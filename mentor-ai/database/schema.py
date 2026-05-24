"""
Data models for the Mentor AI knowledge base.

Every piece of ingested content is stored as a KnowledgeChunk —
a single self-contained unit of text with metadata for retrieval.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ── Source types ─────────────────────────────────────────────────────────────

SOURCE_TYPES = {"youtube", "web", "pdf", "upload"}

# ── Persona labels ────────────────────────────────────────────────────────────

PERSONAS = {"robbins", "hormozi", "both"}


# ── Core data model ───────────────────────────────────────────────────────────

class KnowledgeChunk(BaseModel):
    """
    A single chunk of knowledge extracted from any source.

    Fields
    ------
    id           : Unique UUID (auto-generated).
    content      : The raw text of this chunk.
    source_url   : Where the content came from (URL, file path, etc.).
    source_type  : One of "youtube" | "web" | "pdf" | "upload".
    title        : Human-readable title of the source (video name, article headline).
    persona      : Which mentor this content belongs to: "robbins" | "hormozi" | "both".
    tags         : List of topic tags (e.g. ["mindset", "identity", "state-management"]).
    chunk_index  : Position of this chunk within its source document (0-indexed).
    total_chunks : Total number of chunks the source was split into.
    timestamp    : UTC time of ingestion.
    embedding    : Float vector produced by the local embedding model (set before storage).
    """

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    source_url: str
    source_type: str  # "youtube" | "web" | "pdf" | "upload"
    title: Optional[str] = None

    persona: str = "both"           # "robbins" | "hormozi" | "both"
    tags: List[str] = Field(default_factory=list)

    chunk_index: int = 0
    total_chunks: int = 1

    timestamp: datetime = Field(default_factory=datetime.utcnow)
    embedding: Optional[List[float]] = None

    class Config:
        # Allow mutation so we can attach the embedding after creation
        validate_assignment = True

    def to_qdrant_payload(self) -> dict:
        """
        Return a JSON-serialisable dict suitable for Qdrant's payload field.
        Excludes the embedding vector (stored separately in Qdrant).
        """
        return {
            "content": self.content,
            "source_url": self.source_url,
            "source_type": self.source_type,
            "title": self.title,
            "persona": self.persona,
            "tags": self.tags,
            "chunk_index": self.chunk_index,
            "total_chunks": self.total_chunks,
            "timestamp": self.timestamp.isoformat(),
        }
