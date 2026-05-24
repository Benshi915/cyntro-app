"""
Local embedding model using sentence-transformers.

Runs entirely offline — no API calls, no internet needed once the model
is cached (~80 MB for all-MiniLM-L6-v2).

Usage
-----
    from database.embeddings import embed, embed_batch

    vec  = embed("You are the creator of your own destiny.")
    vecs = embed_batch(["text one", "text two", "text three"])
"""

from __future__ import annotations

from typing import List

from sentence_transformers import SentenceTransformer

# ── Configuration ─────────────────────────────────────────────────────────────

# all-MiniLM-L6-v2 — fast, 384-dim, great retrieval quality for its size.
# To switch models update this constant and VECTOR_SIZE in qdrant_client.py.
MODEL_NAME = "all-MiniLM-L6-v2"

# ── Singleton model ───────────────────────────────────────────────────────────

_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    """Lazy-load the model once; reuse on subsequent calls."""
    global _model
    if _model is None:
        print(f"[embeddings] Loading model '{MODEL_NAME}' (first call only)…")
        _model = SentenceTransformer(MODEL_NAME)
        print(f"[embeddings] Model loaded. Vector size: {_model.get_sentence_embedding_dimension()}")
    return _model


# ── Public API ────────────────────────────────────────────────────────────────

def embed(text: str) -> List[float]:
    """
    Embed a single string.

    Returns a normalised float vector (cosine similarity ready).
    """
    model = _get_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


def embed_batch(texts: List[str], batch_size: int = 64) -> List[List[float]]:
    """
    Embed a list of strings in one forward pass (much faster than looping).

    Returns a list of normalised float vectors in the same order as input.
    """
    model = _get_model()
    vectors = model.encode(
        texts,
        normalize_embeddings=True,
        batch_size=batch_size,
        show_progress_bar=len(texts) > 20,  # only show bar for large batches
    )
    return vectors.tolist()


def vector_size() -> int:
    """Return the embedding dimension of the loaded model."""
    return _get_model().get_sentence_embedding_dimension()
