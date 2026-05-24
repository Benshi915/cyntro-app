"""
PDF ingestion pipeline.

Reads books and documents page-by-page using pdfplumber,
then chunks, tags, and stores them in Qdrant.

Supports:
  - Local PDF files
  - Optional page range (e.g. skip front matter / index)

Usage
-----
    from ingestion.pdf_reader import ingest_pdf

    ingest_pdf(
        path="data/raw/100m_offers.pdf",
        source_url="local://100m_offers.pdf",   # identifier stored in DB
        title="$100M Offers — Alex Hormozi",
        start_page=10,   # skip cover / table of contents
    )

CLI
---
    python -m ingestion.pdf_reader path/to/book.pdf "Book Title"
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path
from typing import List, Optional

import pdfplumber

from .auto_tagger import tag_chunks_batch
from .youtube_scraper import chunk_text
from ..database.schema import KnowledgeChunk
from ..database import qdrant_client as db

# ── Configuration ─────────────────────────────────────────────────────────────

# Minimum words on a page to keep (skips blank / image-only pages)
MIN_PAGE_WORDS = 30


# ── PDF text extraction ───────────────────────────────────────────────────────

def extract_text_from_pdf(
    path: str,
    start_page: int = 1,
    end_page: Optional[int] = None,
) -> str:
    """
    Extract all text from a PDF file using pdfplumber.

    Parameters
    ----------
    path       : Absolute or relative path to the .pdf file.
    start_page : First page to read (1-indexed). Useful to skip cover pages.
    end_page   : Last page to read (inclusive). None = read to end.

    Returns the full extracted text as a single string.
    """
    extracted_pages: List[str] = []

    with pdfplumber.open(path) as pdf:
        total = len(pdf.pages)
        end = min(end_page, total) if end_page else total
        start = max(1, start_page) - 1  # convert to 0-index

        print(f"[pdf] Reading pages {start + 1}–{end} of {total} total.")

        for page_num in range(start, end):
            page = pdf.pages[page_num]
            text = page.extract_text() or ""
            text = _clean_page_text(text)

            if len(text.split()) >= MIN_PAGE_WORDS:
                extracted_pages.append(text)
            else:
                # Very short page — likely a chapter title or image; keep but mark
                if text.strip():
                    extracted_pages.append(text)

    full_text = "\n\n".join(extracted_pages)
    print(f"[pdf] Extracted {len(full_text.split())} words from {len(extracted_pages)} pages.")
    return full_text


def _clean_page_text(text: str) -> str:
    """
    Clean common PDF artefacts:
    - Hyphenated line breaks (re-join split words)
    - Multiple spaces
    - Page numbers / headers left by pdfplumber
    """
    # Re-join hyphenated words at end of line
    text = re.sub(r"-\n(\w)", r"\1", text)
    # Collapse excessive whitespace
    text = re.sub(r"[ \t]{2,}", " ", text)
    # Collapse more than 2 consecutive newlines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# ── Full ingest pipeline ──────────────────────────────────────────────────────

def ingest_pdf(
    path: str,
    source_url: Optional[str] = None,
    title: Optional[str] = None,
    start_page: int = 1,
    end_page: Optional[int] = None,
) -> List[str]:
    """
    Full PDF ingestion pipeline: extract → chunk → tag → store.

    Parameters
    ----------
    path       : Path to the .pdf file.
    source_url : Identifier stored in the DB (defaults to "local://<filename>").
    title      : Human-readable title. Defaults to the filename stem.
    start_page : First page to read (1-indexed).
    end_page   : Last page (inclusive). None = read to end.

    Returns a list of stored Qdrant chunk IDs.
    """
    db.init_collection()

    resolved = Path(path).resolve()
    if not resolved.exists():
        raise FileNotFoundError(f"PDF not found: {resolved}")

    if source_url is None:
        source_url = f"local://{resolved.name}"
    if title is None:
        title = resolved.stem.replace("_", " ").replace("-", " ").title()

    print(f"\n[pdf] Ingesting: {resolved.name}")
    print(f"[pdf] Title    : {title}")

    # ── Extract ─────────────────────────────────────────────────────────────
    full_text = extract_text_from_pdf(str(resolved), start_page, end_page)

    if not full_text.strip():
        print("[pdf] ⚠️  No text extracted. PDF may be image-only. "
              "Consider running OCR first (e.g. ocrmypdf).")
        return []

    # ── Chunk ────────────────────────────────────────────────────────────────
    chunks = chunk_text(full_text)
    print(f"[chunker] Split into {len(chunks)} chunks.")

    # ── Tag ──────────────────────────────────────────────────────────────────
    print(f"[tagger] Classifying {len(chunks)} chunks…")
    tagging_results = tag_chunks_batch(chunks)

    # ── Build KnowledgeChunks ────────────────────────────────────────────────
    knowledge_chunks = [
        KnowledgeChunk(
            content=text,
            source_url=source_url,
            source_type="pdf",
            title=title,
            persona=persona,
            tags=tags,
            chunk_index=idx,
            total_chunks=len(chunks),
        )
        for idx, (text, (tags, persona)) in enumerate(zip(chunks, tagging_results))
    ]

    # ── Store ────────────────────────────────────────────────────────────────
    ids = db.upsert_batch(knowledge_chunks)
    print(f"✅  Stored {len(ids)} chunks from: \"{title}\"")
    return ids


def ingest_pdf_directory(
    directory: str,
    recursive: bool = False,
) -> dict[str, List[str]]:
    """
    Ingest all PDF files found in a directory.

    Returns a dict mapping filename → list of stored chunk IDs.
    """
    dir_path = Path(directory)
    pattern = "**/*.pdf" if recursive else "*.pdf"
    pdfs = list(dir_path.glob(pattern))

    if not pdfs:
        print(f"[pdf] No PDFs found in {directory}")
        return {}

    print(f"[pdf] Found {len(pdfs)} PDF(s) to ingest.")
    results: dict[str, List[str]] = {}

    for pdf_path in pdfs:
        try:
            ids = ingest_pdf(str(pdf_path))
            results[pdf_path.name] = ids
        except Exception as e:
            print(f"[pdf] ❌  Failed {pdf_path.name}: {e}")
            results[pdf_path.name] = []

    return results


# ── CLI entry point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m ingestion.pdf_reader <path/to/file.pdf> [Title] [start_page]")
        sys.exit(1)

    pdf_path = sys.argv[1]
    pdf_title = sys.argv[2] if len(sys.argv) > 2 else None
    s_page = int(sys.argv[3]) if len(sys.argv) > 3 else 1

    stored_ids = ingest_pdf(pdf_path, title=pdf_title, start_page=s_page)
    print(f"\nIngestion complete. {len(stored_ids)} chunks stored.")
