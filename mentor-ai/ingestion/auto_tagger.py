"""
Rule-based auto-tagger for knowledge chunks.

Classifies text into topic tags and assigns a persona (robbins / hormozi / both)
using keyword matching. Designed to be fast and deterministic — no models needed.

Usage
-----
    from ingestion.auto_tagger import tag_chunk

    tags, persona = tag_chunk("You have to interrupt the pattern before you can install a new one.")
    # tags   → ["mindset", "state-management"]
    # persona → "robbins"
"""

from __future__ import annotations

import re
from typing import Dict, List, Tuple

# ── Topic taxonomy ────────────────────────────────────────────────────────────
#
# Each key is a tag name; the value is a list of keyword phrases.
# Matching is case-insensitive and checks whole-word / phrase boundaries.

TAG_KEYWORDS: Dict[str, List[str]] = {
    # ── Mindset & Psychology ─────────────────────────────────────
    "mindset": [
        "mindset", "belief", "limiting belief", "mental", "psychology",
        "perspective", "thinking", "subconscious", "reprogramm", "paradigm",
        "reframe", "cognitive", "perception",
    ],
    "identity": [
        "identity", "who you are", "self-concept", "self concept", "core values",
        "character", "who am i", "become", "self-image", "self image",
        "your standard", "personal standard",
    ],
    "state-management": [
        "state", "emotion", "feelings", "physiology", "peak state",
        "change your state", "anchor", "pattern interrupt", "incantation",
        "priming", "breathing", "motion creates emotion", "body language",
        "resourceful state", "emotional state",
    ],
    "6-human-needs": [
        "six human needs", "6 human needs", "certainty", "uncertainty", "variety",
        "significance", "connection", "love and connection", "growth",
        "contribution", "human needs", "core needs",
    ],

    # ── Business Fundamentals ────────────────────────────────────
    "business-strategy": [
        "strategy", "business model", "competitive", "positioning", "niche",
        "market", "moat", "differentiation", "value creation", "execution",
        "traction", "product-market fit", "go-to-market",
    ],
    "offer-creation": [
        "offer", "value proposition", "package", "bundle", "deliverable",
        "what you sell", "grand slam offer", "irresistible offer",
        "premium offer", "stack", "bonus", "risk reversal", "guarantee",
        "value stack",
    ],
    "pricing": [
        "price", "pricing", "charge", "rates", "revenue", "fee", "cost",
        "premium pricing", "raise prices", "price point", "undercharge",
        "overcharge", "willingness to pay", "perceived value",
    ],
    "scaling": [
        "scale", "scaling", "grow", "growth", "expand", "hire", "delegate",
        "leverage", "systems", "processes", "team", "org structure",
        "remove yourself", "operator", "automating",
    ],
    "unit-economics": [
        "unit economics", "ltv", "cac", "lifetime value", "customer acquisition cost",
        "churn", "margin", "profit", "gross margin", "cogs", "contribution margin",
        "payback period", "arpu", "blended cac",
    ],

    # ── Growth & Acquisition ─────────────────────────────────────
    "lead-generation": [
        "lead", "leads", "traffic", "acquisition", "funnel", "top of funnel",
        "marketing", "ads", "advertising", "cold outreach", "cold email",
        "cold call", "content marketing", "seo", "paid traffic",
        "organic growth", "referral",
    ],
    "sales": [
        "sales", "selling", "closing", "close the sale", "conversion",
        "pitch", "objection", "follow up", "discovery call", "sales call",
        "consultative", "overcoming objections", "handle objections",
    ],
    "hormozi-framework": [
        "value equation", "dream outcome", "likelihood of achievement",
        "time delay", "effort and sacrifice", "perceived likelihood",
        "volume", "value", "trim and stack", "niche down", "avatar",
        "nightmare outcome", "vehicle",
    ],

    # ── Performance & Habits ─────────────────────────────────────
    "habits": [
        "habit", "routine", "ritual", "morning routine", "daily", "practice",
        "discipline", "consistency", "compound", "small actions",
        "repetition", "instill", "ingrain",
    ],
    "motivation": [
        "motivation", "drive", "purpose", "why", "vision", "goal", "dream",
        "aspire", "inspire", "fuel", "reason", "meaning", "passion",
        "intrinsic", "extrinsic",
    ],
    "peak-performance": [
        "performance", "excellence", "mastery", "optimization", "productivity",
        "results", "output", "achievement", "high performance", "elite",
        "world class", "operate at your best",
    ],

    # ── Emotional / Hard Days ────────────────────────────────────
    "hard-day": [
        "hard day", "struggle", "difficult", "pain", "suffering", "down",
        "depression", "anxiety", "lost", "hopeless", "defeated", "failure",
        "feel like giving up", "dark moment", "breaking point", "rock bottom",
        "grief", "overwhelmed",
    ],

    # ── Relationships & Influence ────────────────────────────────
    "relationships": [
        "relationship", "people", "team", "partner", "family", "love",
        "connection", "rapport", "trust", "influence", "leadership",
        "communication", "empathy",
    ],

    # ── Health & Energy ──────────────────────────────────────────
    "health": [
        "health", "body", "fitness", "energy", "vitality", "exercise",
        "nutrition", "sleep", "recovery", "strength", "endurance",
        "biohack", "longevity",
    ],
}

# ── Persona keywords ──────────────────────────────────────────────────────────
#
# Score-based: count matches per persona; highest wins.
# Tie or no signal → "both".

PERSONA_KEYWORDS: Dict[str, List[str]] = {
    "robbins": [
        "tony robbins", "robbins", "tony",
        "six human needs", "6 human needs",
        "ultimate power", "awaken the giant", "giant within",
        "rpm system", "massive action plan", "map",
        "triad", "incantation", "priming",
        "unshakeable", "date with destiny", "unleash the power within",
        "money master the game", "pattern interrupt",
        "neuro-associative", "neuro associative",
        "limiting belief", "global conditioning",
        "peak state", "upr", "ultimate relationship program",
    ],
    "hormozi": [
        "alex hormozi", "hormozi", "alex",
        "gym launch", "$100m", "100m offers", "100 million dollar offers",
        "acquisition.com", "grand slam offer",
        "value equation", "dream outcome",
        "mofr", "ltv to cac",
        "volume game", "trim and stack",
        "business is simple", "make more offers",
        "charge more", "raise your prices",
    ],
}

# ── Internal helpers ──────────────────────────────────────────────────────────

def _normalise(text: str) -> str:
    """Lowercase and collapse whitespace."""
    return re.sub(r"\s+", " ", text.lower().strip())


def _count_keyword_hits(text: str, keywords: List[str]) -> int:
    """Count how many keywords from the list appear in text."""
    count = 0
    for kw in keywords:
        # Use word-boundary for single words; substring match for phrases
        if " " in kw:
            count += 1 if kw in text else 0
        else:
            count += len(re.findall(rf"\b{re.escape(kw)}\b", text))
    return count


# ── Public API ────────────────────────────────────────────────────────────────

def tag_chunk(text: str, min_hits: int = 1) -> Tuple[List[str], str]:
    """
    Classify a text chunk into topic tags and a persona.

    Parameters
    ----------
    text     : Raw text to classify.
    min_hits : Minimum keyword matches required to apply a tag (default 1).

    Returns
    -------
    tags    : List of matched topic tag strings (may be empty).
    persona : "robbins" | "hormozi" | "both".
    """
    normalised = _normalise(text)

    # ── Topic tags ────────────────────────────────────────────────
    tags: List[str] = []
    for tag, keywords in TAG_KEYWORDS.items():
        if _count_keyword_hits(normalised, keywords) >= min_hits:
            tags.append(tag)

    # ── Persona assignment ────────────────────────────────────────
    scores: Dict[str, int] = {}
    for persona, keywords in PERSONA_KEYWORDS.items():
        scores[persona] = _count_keyword_hits(normalised, keywords)

    robbins_score = scores.get("robbins", 0)
    hormozi_score = scores.get("hormozi", 0)

    if robbins_score > hormozi_score:
        persona = "robbins"
    elif hormozi_score > robbins_score:
        persona = "hormozi"
    else:
        persona = "both"  # tie or no signal → neutral

    return tags, persona


def tag_chunks_batch(texts: List[str], min_hits: int = 1) -> List[Tuple[List[str], str]]:
    """
    Classify a list of text chunks. Thin wrapper around tag_chunk.
    """
    return [tag_chunk(t, min_hits) for t in texts]
