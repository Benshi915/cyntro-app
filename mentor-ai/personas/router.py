"""
Query router — detects what kind of question is being asked and
selects the right persona + search tags.

Detection logic
---------------
  EMOTIONAL / HARD DAY  →  Tony Robbins
  BUSINESS / STRATEGY   →  Alex Hormozi
  MIXED / UNCLEAR       →  Both (Robbins first, Hormozi second)

The router also returns suggested Qdrant search tags so the retrieval
step fetches the most relevant chunks for the query type.

Usage
-----
    from personas.router import route_query

    mode, tags = route_query("I feel like giving up on my business")
    # mode → "robbins"
    # tags → ["hard-day", "mindset", "state-management"]

    mode, tags = route_query("How do I structure my offer to charge $5k?")
    # mode → "hormozi"
    # tags → ["offer-creation", "pricing"]
"""

from __future__ import annotations

import re
from typing import Literal, Tuple

QueryMode = Literal["robbins", "hormozi", "both"]


# ── Keyword sets ──────────────────────────────────────────────────────────────
#
# These are intentionally broader than auto_tagger keywords —
# they're matching a *query*, not a knowledge chunk, so false negatives hurt more.

_EMOTIONAL_KEYWORDS = [
    # Hard day / crisis
    "feel like giving up", "giving up", "want to quit", "can't do this",
    "overwhelmed", "hopeless", "lost", "broken", "depressed", "anxiety",
    "hard day", "tough day", "struggling", "suffering", "in pain",
    "don't know what to do", "feel stuck", "feel like a failure",
    "I failed", "failure", "rock bottom", "hitting a wall",
    # Relationships / identity
    "who am i", "identity", "self worth", "confidence", "imposter",
    "not good enough", "not enough", "worthless", "unloved",
    "relationship", "family", "loneliness", "lonely", "connection",
    # Motivation / purpose
    "motivation", "purpose", "why am i doing this", "meaning",
    "inspired", "passionate", "drive", "direction", "clarity",
    "what's the point", "feel empty",
    # State / emotion words
    "feeling", "emotion", "angry", "frustrated", "scared", "afraid",
    "fear", "ashamed", "guilt", "regret", "sad",
]

_BUSINESS_KEYWORDS = [
    # Offer / revenue
    "offer", "pricing", "price", "charge", "revenue", "sales", "close",
    "conversion", "funnel", "leads", "traffic", "customers",
    # Business mechanics
    "business", "startup", "scale", "grow", "market", "niche",
    "unit economics", "ltv", "cac", "margin", "profit", "churn",
    "cash flow", "runway", "roi", "cogs",
    # Strategy
    "strategy", "positioning", "competitor", "competitive", "differentiate",
    "product market fit", "target audience", "avatar", "icp",
    # Operations
    "hire", "team", "delegate", "automate", "system", "process",
    "operations", "operator", "coo", "ceo", "founder",
    # Marketing / acquisition
    "ads", "advertising", "content", "social media", "email", "seo",
    "cold outreach", "cold email", "referral", "partnership",
    # Numbers
    "how much should i charge", "what price", "how to make more money",
    "how to get more clients", "how to grow",
]

_HARD_DAY_TAGS = ["hard-day", "mindset", "state-management", "motivation", "identity"]
_BUSINESS_TAGS = ["business-strategy", "offer-creation", "pricing", "scaling",
                  "lead-generation", "sales", "unit-economics"]
_MIXED_TAGS    = ["mindset", "business-strategy", "motivation", "habits", "peak-performance"]


def _normalise(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower().strip())


def _score(text: str, keywords: list[str]) -> int:
    """Count how many keywords from the list appear in text."""
    count = 0
    for kw in keywords:
        if " " in kw:
            count += 1 if kw in text else 0
        else:
            count += len(re.findall(rf"\b{re.escape(kw)}\b", text))
    return count


# ── Public API ────────────────────────────────────────────────────────────────

def route_query(query: str) -> Tuple[QueryMode, list[str]]:
    """
    Analyse a user query and return the best persona + suggested search tags.

    Parameters
    ----------
    query : Raw user question or situation description.

    Returns
    -------
    mode : "robbins" | "hormozi" | "both"
    tags : List of Qdrant tag filters to prioritise in retrieval.
    """
    text = _normalise(query)

    emotional_score = _score(text, _EMOTIONAL_KEYWORDS)
    business_score  = _score(text, _BUSINESS_KEYWORDS)

    # Clear winner
    if emotional_score > business_score:
        return "robbins", _HARD_DAY_TAGS

    if business_score > emotional_score:
        return "hormozi", _BUSINESS_TAGS

    # Tie or no signal — both personas, blended tags
    return "both", _MIXED_TAGS


def explain_routing(query: str) -> dict:
    """
    Return a debug dict showing why a query was routed the way it was.
    Useful for testing and UI display.
    """
    text = _normalise(query)
    emotional_score = _score(text, _EMOTIONAL_KEYWORDS)
    business_score  = _score(text, _BUSINESS_KEYWORDS)
    mode, tags = route_query(query)

    return {
        "query": query,
        "mode": mode,
        "emotional_score": emotional_score,
        "business_score": business_score,
        "tags": tags,
        "reasoning": (
            "Emotional signals dominate → Tony Robbins" if mode == "robbins"
            else "Business signals dominate → Alex Hormozi" if mode == "hormozi"
            else "No clear signal → Both personas"
        ),
    }
