"""
Smoke tests for auto_tagger — no external deps, runs instantly.

Run with:
    cd mentor-ai && python -m pytest tests/test_auto_tagger.py -v
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from ingestion.auto_tagger import tag_chunk, tag_chunks_batch


def test_robbins_persona_detected():
    text = (
        "Tony Robbins talks about pattern interrupt and how six human needs "
        "drive all human behavior — certainty, variety, significance, connection."
    )
    tags, persona = tag_chunk(text)
    assert persona == "robbins", f"Expected 'robbins', got '{persona}'"
    assert "6-human-needs" in tags
    assert "state-management" in tags or "mindset" in tags


def test_hormozi_persona_detected():
    text = (
        "Alex Hormozi explains the grand slam offer and the value equation: "
        "dream outcome over effort and sacrifice, multiplied by likelihood of achievement "
        "and divided by time delay."
    )
    tags, persona = tag_chunk(text)
    assert persona == "hormozi", f"Expected 'hormozi', got '{persona}'"
    assert "offer-creation" in tags or "hormozi-framework" in tags


def test_neutral_persona_when_no_signal():
    text = "The sky is blue and the grass is green."
    tags, persona = tag_chunk(text)
    assert persona == "both"
    assert isinstance(tags, list)


def test_hard_day_tagged():
    text = (
        "I feel completely hopeless today. I'm overwhelmed, I feel like giving up. "
        "Everything seems impossible and I'm at my breaking point."
    )
    tags, persona = tag_chunk(text)
    assert "hard-day" in tags, f"Expected 'hard-day' tag, got {tags}"


def test_business_tags():
    text = (
        "To scale your business you need to understand your unit economics — "
        "your LTV, your CAC, your churn rate, and your contribution margin."
    )
    tags, persona = tag_chunk(text)
    assert "unit-economics" in tags, f"Expected 'unit-economics', got {tags}"
    assert "scaling" in tags or "business-strategy" in tags


def test_batch_tagging():
    texts = [
        "Tony Robbins says your state controls everything.",
        "Alex Hormozi says make more offers.",
        "The weather is nice today.",
    ]
    results = tag_chunks_batch(texts)
    assert len(results) == 3
    _, p0 = results[0]
    _, p1 = results[1]
    assert p0 == "robbins"
    assert p1 == "hormozi"


def test_empty_string():
    tags, persona = tag_chunk("")
    assert persona == "both"
    assert tags == []


if __name__ == "__main__":
    tests = [
        test_robbins_persona_detected,
        test_hormozi_persona_detected,
        test_neutral_persona_when_no_signal,
        test_hard_day_tagged,
        test_business_tags,
        test_batch_tagging,
        test_empty_string,
    ]
    passed = 0
    for t in tests:
        try:
            t()
            print(f"  ✅  {t.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"  ❌  {t.__name__}: {e}")

    print(f"\n{passed}/{len(tests)} tests passed.")
