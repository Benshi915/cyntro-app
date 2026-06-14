"""
Web scraping pipeline using requests + trafilatura.

Scrapes articles, interviews, and blog posts from the internet,
then chunks, tags, and stores them in Qdrant — same pipeline as youtube_scraper.

Usage
-----
    from ingestion.web_scraper import ingest_url, ingest_urls

    ingest_url("https://www.alexhormozi.com/blog/how-to-build-an-offer")
    ingest_urls(["https://...", "https://..."])

CLI
---
    python -m ingestion.web_scraper https://example.com/article
"""

from __future__ import annotations

import re
import sys
from typing import List, Optional
from urllib.parse import urlparse

import requests
import trafilatura

from .auto_tagger import tag_chunks_batch
from .youtube_scraper import chunk_text
from database.schema import KnowledgeChunk
from database import qdrant_client as db

# ── Configuration ─────────────────────────────────────────────────────────────

MIN_CONTENT_LENGTH = 300

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


# ── Scrape a single URL ───────────────────────────────────────────────────────

def _scrape(url: str) -> tuple[str, str]:
    """Fetch a URL and return (title, clean_text)."""
    try:
        resp = requests.get(url, headers=_HEADERS, timeout=30)
        resp.raise_for_status()
    except requests.RequestException as e:
        raise RuntimeError(f"Failed to fetch {url}: {e}")

    html = resp.text

    # trafilatura extracts main article text, strips navbars/ads/boilerplate
    content = trafilatura.extract(
        html,
        include_comments=False,
        include_tables=False,
        no_fallback=False,
    )

    if not content:
        raise RuntimeError(f"Could not extract readable content from {url}")

    # Extract title from metadata
    meta = trafilatura.extract_metadata(html)
    title = (meta.title if meta and meta.title else None) or _title_from_url(url)

    return title.strip(), content.strip()


def _title_from_url(url: str) -> str:
    path = urlparse(url).path.rstrip("/")
    slug = path.split("/")[-1] if path else url
    return slug.replace("-", " ").replace("_", " ").title()


# ── Full ingest pipeline ──────────────────────────────────────────────────────

def _ingest_one(url: str) -> List[str]:
    db.init_collection()

    print(f"\n[web] Scraping: {url}")
    title, content = _scrape(url)

    if len(content) < MIN_CONTENT_LENGTH:
        print(f"[web] ⚠️  Content too short ({len(content)} chars), skipping.")
        return []

    print(f"[web] Title  : {title}")
    print(f"[web] Length : {len(content.split())} words")

    chunks = chunk_text(content)
    print(f"[chunker] Split into {len(chunks)} chunks.")

    tagging_results = tag_chunks_batch(chunks)

    knowledge_chunks = [
        KnowledgeChunk(
            content=text,
            source_url=url,
            source_type="web",
            title=title,
            persona=persona,
            tags=tags,
            chunk_index=idx,
            total_chunks=len(chunks),
        )
        for idx, (text, (tags, persona)) in enumerate(zip(chunks, tagging_results))
    ]

    ids = db.upsert_batch(knowledge_chunks)
    print(f"✅  Stored {len(ids)} chunks from: \"{title}\"")
    return ids


def ingest_url(url: str) -> List[str]:
    """Scrape, chunk, tag, and store a single web URL."""
    return _ingest_one(url)


def ingest_urls(urls: List[str]) -> dict[str, List[str]]:
    """Scrape, chunk, tag, and store a list of URLs sequentially."""
    output: dict[str, List[str]] = {}
    for url in urls:
        try:
            output[url] = _ingest_one(url)
        except Exception as e:
            print(f"[web] ❌  Failed {url}: {e}")
            output[url] = []
    return output


# ── CLI entry point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m ingestion.web_scraper <url> [url2 url3 ...]")
        sys.exit(1)

    urls = sys.argv[1:]
    if len(urls) == 1:
        stored = ingest_url(urls[0])
    else:
        results = ingest_urls(urls)
        stored = [id_ for ids in results.values() for id_ in ids]

    print(f"\nIngestion complete. {len(stored)} total chunks stored.")
