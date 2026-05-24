"""
Web scraping pipeline using Crawl4AI.

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

import asyncio
import re
import sys
from typing import List, Optional
from urllib.parse import urlparse

from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
from crawl4ai.content_filter_strategy import PruningContentFilter
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator

from .auto_tagger import tag_chunks_batch
from .youtube_scraper import chunk_text
from ..database.schema import KnowledgeChunk
from ..database import qdrant_client as db

# ── Configuration ─────────────────────────────────────────────────────────────

# Minimum characters in a scraped page to bother storing
MIN_CONTENT_LENGTH = 300

# Crawl4AI config: prune boilerplate (navbars, footers, ads)
_CRAWLER_CONFIG = CrawlerRunConfig(
    cache_mode=CacheMode.BYPASS,
    markdown_generator=DefaultMarkdownGenerator(
        content_filter=PruningContentFilter(
            threshold=0.48,
            threshold_type="fixed",
            min_word_threshold=50,
        )
    ),
    word_count_threshold=10,
    exclude_external_links=True,
    remove_overlay_elements=True,
)


# ── Scrape a single URL ───────────────────────────────────────────────────────

async def _scrape(url: str) -> tuple[str, str]:
    """
    Scrape a URL and return (title, clean_markdown_text).

    Uses Crawl4AI's pruning filter to strip navbars, ads, and boilerplate,
    leaving only the main article content.
    """
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url=url, config=_CRAWLER_CONFIG)

    if not result.success:
        raise RuntimeError(f"Failed to scrape {url}: {result.error_message}")

    # Prefer fit_markdown (filtered) over raw markdown
    content = (
        result.markdown_v2.fit_markdown
        if result.markdown_v2 and result.markdown_v2.fit_markdown
        else result.markdown
    )

    # Strip markdown formatting to plain text for embedding
    content = _markdown_to_plain(content or "")
    title = result.metadata.get("title", "") or _title_from_url(url)

    return title.strip(), content.strip()


def _markdown_to_plain(md: str) -> str:
    """Strip the most common markdown tokens to get cleaner plain text."""
    md = re.sub(r"#{1,6}\s*", "", md)       # headings
    md = re.sub(r"\*{1,2}([^*]+)\*{1,2}", r"\1", md)  # bold/italic
    md = re.sub(r"`[^`]+`", "", md)          # inline code
    md = re.sub(r"!?\[([^\]]*)\]\([^)]*\)", r"\1", md)  # links/images
    md = re.sub(r"[-*]\s+", "", md)          # list bullets
    md = re.sub(r"\n{3,}", "\n\n", md)       # collapse blank lines
    return md.strip()


def _title_from_url(url: str) -> str:
    """Derive a rough title from the URL path when metadata is missing."""
    path = urlparse(url).path.rstrip("/")
    slug = path.split("/")[-1] if path else url
    return slug.replace("-", " ").replace("_", " ").title()


# ── Full ingest pipeline ──────────────────────────────────────────────────────

async def _ingest_url_async(url: str) -> List[str]:
    """Async implementation of the full ingest pipeline for one URL."""
    db.init_collection()

    print(f"\n[web] Scraping: {url}")
    title, content = await _scrape(url)

    if len(content) < MIN_CONTENT_LENGTH:
        print(f"[web] ⚠️  Content too short ({len(content)} chars), skipping.")
        return []

    print(f"[web] Title   : {title}")
    print(f"[web] Length  : {len(content.split())} words")

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
    """Scrape, chunk, tag, and store a single web URL. Synchronous wrapper."""
    return asyncio.run(_ingest_url_async(url))


async def _ingest_urls_async(urls: List[str]) -> dict[str, List[str]]:
    """Ingest multiple URLs concurrently."""
    tasks = [_ingest_url_async(url) for url in urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    output: dict[str, List[str]] = {}
    for url, result in zip(urls, results):
        if isinstance(result, Exception):
            print(f"[web] ❌  Failed {url}: {result}")
            output[url] = []
        else:
            output[url] = result
    return output


def ingest_urls(urls: List[str]) -> dict[str, List[str]]:
    """Scrape, chunk, tag, and store a list of URLs concurrently."""
    return asyncio.run(_ingest_urls_async(urls))


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
