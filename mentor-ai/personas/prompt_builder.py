"""
Prompt builder — the final assembly step before Claude.ai.

Takes a user query, runs it through the router, retrieves the most relevant
chunks from Qdrant, selects the right persona prompt, and returns a single
formatted string the user pastes into Claude.ai.

This is the RAG layer: Router → Retrieval → Persona → Formatted Prompt.

Usage
-----
    from personas.prompt_builder import build_prompt_for_query

    prompt = build_prompt_for_query("I feel like giving up on my business today")
    print(prompt)
    # → Full Tony Robbins prompt with relevant context, ready for Claude.ai

    # Or with explicit persona override:
    prompt = build_prompt_for_query(
        "How should I structure my offer?",
        persona_override="hormozi",
        num_chunks=6,
    )
"""

from __future__ import annotations

from typing import Literal, Optional

from .router import route_query, QueryMode, explain_routing
from .robbins import build_prompt as robbins_prompt, format_context as robbins_context
from .hormozi import build_prompt as hormozi_prompt, format_context as hormozi_context
from ..database import qdrant_client as db

# ── Configuration ─────────────────────────────────────────────────────────────

DEFAULT_NUM_CHUNKS = 5          # retrieved chunks per persona
SCORE_THRESHOLD    = 0.25       # minimum cosine similarity to include a chunk


# ── Both-persona prompt template ──────────────────────────────────────────────
# Used when the query is "both" — emotional + business blend.

_BOTH_TEMPLATE = """You are a combined mentor — you embody two personas simultaneously:

PERSONA 1 — TONY ROBBINS (emotional foundation, state, identity, mindset):
{robbins_system}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERSONA 2 — ALEX HORMOZI (business strategy, offers, unit economics, execution):
{hormozi_system}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO RESPOND IN COMBINED MODE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Start with Tony's lens — address the emotional state and identity first.
Then shift to Alex's lens — move to the concrete business strategy and numbers.
Label the transition clearly: "Now, from a business strategy perspective..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE QUESTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{query}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Respond with both lenses. Tony first, Alex second.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"""


# ── Core retrieval + assembly ─────────────────────────────────────────────────

def _retrieve_chunks(
    query: str,
    persona: QueryMode,
    tags: list[str],
    num_chunks: int,
) -> list[dict]:
    """
    Retrieve the most relevant knowledge chunks from Qdrant.

    Strategy:
    - If persona is specific, try persona-filtered search first.
    - If not enough results, fall back to unfiltered search.
    - If tags available, also try a tag-filtered pass and merge.
    """
    chunks: list[dict] = []
    seen_ids: set[str] = set()

    def _add(results: list[dict]) -> None:
        for r in results:
            if r["id"] not in seen_ids:
                seen_ids.add(r["id"])
                chunks.append(r)

    # 1. Persona-specific + no tag filter
    if persona in ("robbins", "hormozi"):
        _add(db.search(
            query=query,
            limit=num_chunks,
            persona_filter=persona,
            score_threshold=SCORE_THRESHOLD,
        ))

    # 2. Try with persona "both" content (relevant to either)
    if len(chunks) < num_chunks:
        _add(db.search(
            query=query,
            limit=num_chunks,
            persona_filter="both",
            score_threshold=SCORE_THRESHOLD,
        ))

    # 3. Fallback: no filter at all
    if len(chunks) < num_chunks:
        _add(db.search(
            query=query,
            limit=num_chunks,
            score_threshold=SCORE_THRESHOLD,
        ))

    # Sort by score descending, take top N
    chunks.sort(key=lambda x: x.get("score", 0), reverse=True)
    return chunks[:num_chunks]


# ── Public API ────────────────────────────────────────────────────────────────

def build_prompt_for_query(
    query: str,
    persona_override: Optional[Literal["robbins", "hormozi", "both"]] = None,
    num_chunks: int = DEFAULT_NUM_CHUNKS,
) -> str:
    """
    Full pipeline: route → retrieve → format → return prompt for Claude.ai.

    Parameters
    ----------
    query            : The user's raw question or situation.
    persona_override : Force a specific persona instead of auto-routing.
    num_chunks       : Number of knowledge base chunks to retrieve.

    Returns a single string ready to paste into Claude.ai.
    """
    # ── Route ────────────────────────────────────────────────────────────────
    if persona_override:
        mode: QueryMode = persona_override
        # Pick appropriate default tags for override mode
        from .router import _HARD_DAY_TAGS, _BUSINESS_TAGS, _MIXED_TAGS
        tags = (
            _HARD_DAY_TAGS  if mode == "robbins"
            else _BUSINESS_TAGS if mode == "hormozi"
            else _MIXED_TAGS
        )
    else:
        mode, tags = route_query(query)

    # ── Retrieve ─────────────────────────────────────────────────────────────
    chunks = _retrieve_chunks(query, mode, tags, num_chunks)

    # ── Build prompt ─────────────────────────────────────────────────────────
    if mode == "robbins":
        return robbins_prompt(query=query, chunks=chunks)

    if mode == "hormozi":
        return hormozi_prompt(query=query, chunks=chunks)

    # "both" — dual persona
    from .robbins import SYSTEM_PROMPT as R_PROMPT, format_context as r_fmt
    from .hormozi import SYSTEM_PROMPT as H_PROMPT, format_context as h_fmt

    r_chunks = chunks[: num_chunks // 2 + 1]
    h_chunks = chunks[num_chunks // 2 :]

    return _BOTH_TEMPLATE.format(
        robbins_system=R_PROMPT.format(context=r_fmt(r_chunks)),
        hormozi_system=H_PROMPT.format(context=h_fmt(h_chunks)),
        query=query,
    )


def get_routing_info(query: str) -> dict:
    """
    Return routing debug info without building the full prompt.
    Useful for the frontend to show which persona was selected and why.
    """
    return explain_routing(query)


# ── CLI entry point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python -m personas.prompt_builder \"your question here\"")
        print("       python -m personas.prompt_builder \"your question\" robbins|hormozi|both")
        sys.exit(1)

    user_query = sys.argv[1]
    override   = sys.argv[2] if len(sys.argv) > 2 else None

    # Show routing info first
    info = get_routing_info(user_query)
    print("\n── ROUTING ─────────────────────────────────────────────")
    print(f"  Mode     : {info['mode'].upper()}")
    print(f"  Reasoning: {info['reasoning']}")
    print(f"  Scores   : emotional={info['emotional_score']}, business={info['business_score']}")
    print(f"  Tags     : {info['tags']}")
    print("────────────────────────────────────────────────────────\n")

    # Build the full prompt
    try:
        prompt = build_prompt_for_query(user_query, persona_override=override)
        print(prompt)
    except Exception as e:
        print(f"\n[error] Could not retrieve from Qdrant: {e}")
        print("Make sure Qdrant is running: docker compose -f docker/docker-compose.yml up -d")
        sys.exit(1)
