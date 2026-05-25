"""
YouTube ingestion pipeline.

Flow
----
1. yt-dlp   → download audio from a YouTube URL
2. Whisper  → transcribe audio locally (no API)
3. Chunker  → split transcript into overlapping text windows
4. Tagger   → keyword-classify each chunk (auto_tagger)
5. Qdrant   → embed + store each chunk (qdrant_client)

Usage
-----
    from ingestion.youtube_scraper import ingest_youtube

    ids = ingest_youtube(
        "https://www.youtube.com/watch?v=VIDEO_ID",
        whisper_model="base",   # tiny / base / small / medium / large
    )
    print(f"Stored {len(ids)} chunks.")

CLI
---
    python -m ingestion.youtube_scraper https://www.youtube.com/watch?v=VIDEO_ID
"""

from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path
from typing import List, Optional, Tuple

import yt_dlp
import whisper

from .auto_tagger import tag_chunks_batch
from database.schema import KnowledgeChunk
from database import qdrant_client as db

# ── Configuration ─────────────────────────────────────────────────────────────

# Number of words per chunk.
CHUNK_WORD_SIZE: int = int(os.getenv("CHUNK_WORD_SIZE", "500"))

# Overlap between consecutive chunks (words).
CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "50"))

# Default Whisper model size.
# tiny/base run on CPU quickly; medium/large are more accurate but slower.
DEFAULT_WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")

# Raw audio download directory (relative to this file's repo root).
RAW_DIR = Path(__file__).resolve().parents[1] / "data" / "raw"


# ── Step 1: Download audio ────────────────────────────────────────────────────

def download_audio(url: str, output_dir: str) -> Tuple[str, dict]:
    """
    Download the best available audio from a YouTube URL using yt-dlp.

    Returns
    -------
    audio_path : Absolute path to the downloaded .mp3 file.
    info       : Metadata dict from yt-dlp (title, uploader, duration, …).
    """
    ydl_opts = {
        "format": "bestaudio/best",
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "128",
            }
        ],
        "outtmpl": os.path.join(output_dir, "%(id)s.%(ext)s"),
        "quiet": True,
        "no_warnings": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        # yt-dlp writes the final file as <id>.mp3 after post-processing
        audio_path = os.path.join(output_dir, f"{info['id']}.mp3")

    if not os.path.exists(audio_path):
        # Fallback: search for any .mp3 in output_dir
        mp3_files = list(Path(output_dir).glob("*.mp3"))
        if not mp3_files:
            raise FileNotFoundError(
                f"Could not find downloaded audio in {output_dir}. "
                "Ensure ffmpeg is installed."
            )
        audio_path = str(mp3_files[0])

    return audio_path, info


# ── Step 2: Transcribe ────────────────────────────────────────────────────────

def transcribe_audio(audio_path: str, model_size: str = DEFAULT_WHISPER_MODEL) -> str:
    """
    Transcribe an audio file using OpenAI Whisper (runs locally, no API).

    Parameters
    ----------
    audio_path : Path to the .mp3 / .wav file.
    model_size : "tiny" | "base" | "small" | "medium" | "large"

    Returns the full transcript as a single string.
    """
    print(f"[whisper] Loading model '{model_size}'…")
    model = whisper.load_model(model_size)
    print(f"[whisper] Transcribing {Path(audio_path).name}…")
    result = model.transcribe(audio_path, verbose=False)
    transcript: str = result["text"].strip()
    print(f"[whisper] Transcription complete ({len(transcript.split())} words).")
    return transcript


# ── Step 3: Chunk transcript ──────────────────────────────────────────────────

def chunk_text(
    text: str,
    chunk_size: int = CHUNK_WORD_SIZE,
    overlap: int = CHUNK_OVERLAP,
) -> List[str]:
    """
    Split text into overlapping windows of roughly `chunk_size` words.

    Overlap keeps context at chunk boundaries so retrieval isn't cut off
    mid-thought.
    """
    words = text.split()
    if not words:
        return []

    chunks: List[str] = []
    step = max(1, chunk_size - overlap)
    i = 0

    while i < len(words):
        window = words[i : i + chunk_size]
        chunks.append(" ".join(window))
        i += step

    return chunks


# ── Step 4 + 5: Tag and store ─────────────────────────────────────────────────

def store_chunks(
    chunks: List[str],
    source_url: str,
    title: Optional[str],
    source_type: str = "youtube",
) -> List[str]:
    """
    Tag, embed, and store a list of text chunks in Qdrant.

    Returns a list of stored chunk IDs.
    """
    if not chunks:
        return []

    # Classify all chunks in one pass
    print(f"[tagger] Classifying {len(chunks)} chunks…")
    tagging_results = tag_chunks_batch(chunks)

    # Build KnowledgeChunk objects
    knowledge_chunks = [
        KnowledgeChunk(
            content=text,
            source_url=source_url,
            source_type=source_type,
            title=title,
            persona=persona,
            tags=tags,
            chunk_index=idx,
            total_chunks=len(chunks),
        )
        for idx, (text, (tags, persona)) in enumerate(zip(chunks, tagging_results))
    ]

    # Log a quick tag summary
    all_tags: dict[str, int] = {}
    for _, (tags, _) in zip(chunks, tagging_results):
        for t in tags:
            all_tags[t] = all_tags.get(t, 0) + 1
    print(f"[tagger] Tag distribution: {dict(sorted(all_tags.items(), key=lambda x: -x[1]))}")

    # Batch upsert (embeddings generated inside upsert_batch)
    print(f"[qdrant] Embedding and storing {len(knowledge_chunks)} chunks…")
    ids = db.upsert_batch(knowledge_chunks)
    return ids


# ── Main pipeline ─────────────────────────────────────────────────────────────

def ingest_youtube(
    url: str,
    whisper_model: str = DEFAULT_WHISPER_MODEL,
    keep_audio: bool = False,
) -> List[str]:
    """
    Full YouTube ingestion pipeline.

    Parameters
    ----------
    url           : YouTube video URL.
    whisper_model : Whisper model size ("tiny" | "base" | "small" | "medium" | "large").
    keep_audio    : If True, save the .mp3 to data/raw/ instead of deleting it.

    Returns a list of Qdrant chunk IDs.
    """
    db.init_collection()

    # Use a temp dir unless we want to keep the audio
    if keep_audio:
        RAW_DIR.mkdir(parents=True, exist_ok=True)
        tmp_ctx = _NullContext(str(RAW_DIR))
    else:
        tmp_ctx = tempfile.TemporaryDirectory()

    with tmp_ctx as audio_dir:
        # ── Download ────────────────────────────────────────────
        print(f"\n[youtube] Downloading: {url}")
        audio_path, info = download_audio(url, audio_dir)

        title = info.get("title", "Unknown")
        uploader = info.get("uploader", "Unknown")
        duration = info.get("duration", 0)
        print(f"[youtube] Title    : {title}")
        print(f"[youtube] Uploader : {uploader}")
        print(f"[youtube] Duration : {duration}s")

        # ── Transcribe ──────────────────────────────────────────
        transcript = transcribe_audio(audio_path, whisper_model)

        # ── Chunk ───────────────────────────────────────────────
        chunks = chunk_text(transcript)
        print(f"[chunker] Split into {len(chunks)} chunks "
              f"(~{CHUNK_WORD_SIZE} words each, {CHUNK_OVERLAP} word overlap).")

        # ── Tag + Store ─────────────────────────────────────────
        ids = store_chunks(chunks, source_url=url, title=title)

        print(f"\n✅  Stored {len(ids)} chunks from: \"{title}\"")
        return ids


# ── Null context manager (for keep_audio mode) ────────────────────────────────

class _NullContext:
    """Context manager that returns a fixed path without cleanup."""
    def __init__(self, path: str):
        self.path = path

    def __enter__(self) -> str:
        return self.path

    def __exit__(self, *args) -> None:
        pass


# ── CLI entry point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m ingestion.youtube_scraper <youtube_url> [whisper_model]")
        sys.exit(1)

    youtube_url = sys.argv[1]
    model = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_WHISPER_MODEL

    stored_ids = ingest_youtube(youtube_url, whisper_model=model)
    print(f"\nIngestion complete. {len(stored_ids)} chunks stored.")
