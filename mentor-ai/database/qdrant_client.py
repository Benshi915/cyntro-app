"""
Qdrant vector database interface.

Handles:
  - Collection initialisation
  - Upserting single chunks and batches
  - Semantic search with optional persona / tag filters
  - Listing stored sources

Qdrant runs locally via Docker (see docker/docker-compose.yml).
Set QDRANT_HOST / QDRANT_PORT in .env to override defaults.

Usage
-----
    from database.qdrant_client import init_collection, upsert_chunk, search

    init_collection()
    upsert_chunk(chunk)
    results = search("how do I build an irresistible offer?", limit=5)
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchAny,
    MatchValue,
    PointStruct,
    VectorParams,
)

from .embeddings import embed, embed_batch, vector_size
from .schema import KnowledgeChunk

# ── Configuration ─────────────────────────────────────────────────────────────

QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "mentor_knowledge")

# ── Singleton client ──────────────────────────────────────────────────────────

_client: QdrantClient | None = None


def get_client() -> QdrantClient:
    """Return (and lazily create) the shared Qdrant client."""
    global _client
    if _client is None:
        _client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    return _client


# ── Collection management ─────────────────────────────────────────────────────

def init_collection(recreate: bool = False) -> None:
    """
    Ensure the mentor_knowledge collection exists in Qdrant.

    Set recreate=True to wipe and rebuild from scratch.
    """
    client = get_client()
    existing = {c.name for c in client.get_collections().collections}

    if COLLECTION_NAME in existing:
        if recreate:
            client.delete_collection(COLLECTION_NAME)
            print(f"[qdrant] Deleted existing collection '{COLLECTION_NAME}'.")
        else:
            print(f"[qdrant] Collection '{COLLECTION_NAME}' already exists.")
            return

    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(
            size=vector_size(),
            distance=Distance.COSINE,
        ),
    )
    print(f"[qdrant] Created collection '{COLLECTION_NAME}' (dim={vector_size()}).")


# ── Write operations ──────────────────────────────────────────────────────────

def upsert_chunk(chunk: KnowledgeChunk) -> str:
    """
    Embed and store a single KnowledgeChunk. Returns the stored ID.

    If chunk.embedding is already set it will be reused (skip re-embedding).
    """
    if chunk.embedding is None:
        chunk.embedding = embed(chunk.content)

    client = get_client()
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=chunk.id,
                vector=chunk.embedding,
                payload=chunk.to_qdrant_payload(),
            )
        ],
    )
    return chunk.id


def upsert_batch(chunks: List[KnowledgeChunk], batch_size: int = 64) -> List[str]:
    """
    Embed and store a list of KnowledgeChunks efficiently.

    Chunks without a pre-computed embedding are embedded in a single batched
    forward pass, then upserted together.
    """
    # Separate chunks that still need embedding
    needs_embed = [c for c in chunks if c.embedding is None]
    if needs_embed:
        texts = [c.content for c in needs_embed]
        vectors = embed_batch(texts)
        for chunk, vec in zip(needs_embed, vectors):
            chunk.embedding = vec

    client = get_client()

    # Upsert in batches to avoid oversized requests
    ids: List[str] = []
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        points = [
            PointStruct(
                id=c.id,
                vector=c.embedding,
                payload=c.to_qdrant_payload(),
            )
            for c in batch
        ]
        client.upsert(collection_name=COLLECTION_NAME, points=points)
        ids.extend(c.id for c in batch)
        print(f"[qdrant] Upserted {len(ids)}/{len(chunks)} chunks…")

    return ids


# ── Read / search operations ──────────────────────────────────────────────────

def search(
    query: str,
    limit: int = 5,
    persona_filter: Optional[str] = None,
    tag_filter: Optional[str] = None,
    score_threshold: float = 0.0,
) -> List[Dict[str, Any]]:
    """
    Semantic search over the knowledge base.

    Parameters
    ----------
    query          : Natural language question or topic.
    limit          : Number of results to return.
    persona_filter : "robbins" | "hormozi" | "both" — restrict to one persona.
    tag_filter     : Single tag string — restrict to chunks with this tag.
    score_threshold: Minimum cosine similarity (0.0 = no threshold).

    Returns a list of dicts with keys: id, score, content, source_url,
    persona, tags, title, chunk_index, total_chunks, timestamp.
    """
    query_vector = embed(query)

    must_conditions = []
    if persona_filter:
        must_conditions.append(
            FieldCondition(key="persona", match=MatchValue(value=persona_filter))
        )
    if tag_filter:
        must_conditions.append(
            FieldCondition(key="tags", match=MatchValue(value=tag_filter))
        )

    qdrant_filter = Filter(must=must_conditions) if must_conditions else None

    client = get_client()
    hits = client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        limit=limit,
        query_filter=qdrant_filter,
        score_threshold=score_threshold if score_threshold > 0 else None,
    )

    return [{"id": h.id, "score": round(h.score, 4), **h.payload} for h in hits]


def collection_stats() -> Dict[str, Any]:
    """Return basic stats about the knowledge base collection."""
    client = get_client()
    info = client.get_collection(COLLECTION_NAME)
    return {
        "collection": COLLECTION_NAME,
        "total_vectors": info.vectors_count,
        "indexed_vectors": info.indexed_vectors_count,
        "status": info.status,
    }


def list_sources() -> List[Dict[str, str]]:
    """
    Return a deduplicated list of all ingested sources.

    Each entry: {"source_url": ..., "source_type": ..., "title": ..., "persona": ...}
    """
    client = get_client()
    # Scroll through all points and collect unique source_urls
    seen: set[str] = set()
    sources: List[Dict[str, str]] = []
    offset = None

    while True:
        results, offset = client.scroll(
            collection_name=COLLECTION_NAME,
            limit=256,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )
        for point in results:
            url = point.payload.get("source_url", "")
            if url not in seen:
                seen.add(url)
                sources.append(
                    {
                        "source_url": url,
                        "source_type": point.payload.get("source_type", ""),
                        "title": point.payload.get("title", ""),
                        "persona": point.payload.get("persona", ""),
                    }
                )
        if offset is None:
            break

    return sources
