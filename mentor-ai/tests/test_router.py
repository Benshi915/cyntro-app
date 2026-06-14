"""
Smoke tests for the query router — zero external deps.

Run with:
    cd mentor-ai && python tests/test_router.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from personas.router import route_query, explain_routing


def test_hard_day_routes_to_robbins():
    q = "I feel like giving up. Everything is overwhelming and I don't know what to do anymore."
    mode, tags = route_query(q)
    assert mode == "robbins", f"Expected robbins, got {mode}"
    assert "hard-day" in tags or "mindset" in tags

def test_business_routes_to_hormozi():
    q = "How should I price my offer? My conversion rate is 3% and I want to scale."
    mode, tags = route_query(q)
    assert mode == "hormozi", f"Expected hormozi, got {mode}"
    assert "offer-creation" in tags or "pricing" in tags or "business-strategy" in tags

def test_neutral_routes_to_both():
    q = "Tell me something interesting."
    mode, tags = route_query(q)
    assert mode == "both"

def test_fear_routes_to_robbins():
    q = "I'm scared to raise my prices. What if people say no?"
    mode, tags = route_query(q)
    # "scared" and "fear" are emotional; "prices" is business — but fear dominates
    assert mode in ("robbins", "both"), f"Expected robbins or both, got {mode}"

def test_offer_creation_routes_to_hormozi():
    q = "I need to build a grand slam offer for my coaching business. What's the value equation?"
    mode, tags = route_query(q)
    assert mode == "hormozi", f"Expected hormozi, got {mode}"

def test_explain_routing_returns_dict():
    info = explain_routing("How do I get more leads?")
    assert "mode" in info
    assert "emotional_score" in info
    assert "business_score" in info
    assert "reasoning" in info
    assert info["mode"] in ("robbins", "hormozi", "both")

def test_identity_routes_to_robbins():
    q = "I feel like I don't know who I am anymore. My identity is all over the place."
    mode, tags = route_query(q)
    assert mode == "robbins", f"Expected robbins, got {mode}"


if __name__ == "__main__":
    tests = [
        test_hard_day_routes_to_robbins,
        test_business_routes_to_hormozi,
        test_neutral_routes_to_both,
        test_fear_routes_to_robbins,
        test_offer_creation_routes_to_hormozi,
        test_explain_routing_returns_dict,
        test_identity_routes_to_robbins,
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
