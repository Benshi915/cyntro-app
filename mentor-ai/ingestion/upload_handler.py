"""
Manual upload handler.

Accepts files dropped by the user through the web UI or CLI and routes
them through the correct ingestion pipeline based on file type.

Supported types
---------------
  Text  : .txt, .md
  PDF   : .pdf           → pdf_reader
  Audio : .mp3, .wav, .m4a, .ogg  → Whisper transcription
  Video : .mp4, .mov, .mkv, .webm → audio extraction + Whisper

Usage
-----
    from ingestion.upload_handler import ingest_upload

    # From a saved file:
    ids = ingest_upload("/path/to/file.mp3", title="My Interview")

    # From raw bytes (FastAPI UploadFile scenario):
    ids = ingest_upload_bytes(content=bytes_data, filename="notes.txt")
"""

from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path
from typing import List, Optional

from .auto_tagger import tag_chunks_batch
from .youtube_scraper import chunk_text, transcribe_audio
from .pdf_reader import ingest_pdf
from database.schema import KnowledgeChunk
from database import qdrant_client as db

# ── File type routing ─────────────────────────────────────────────────────────

TEXT_EXTENSIONS  = {".txt", ".md", ".markdown", ".rst"}
PDF_EXTENSIONS   = {".pdf"}
AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".flac", ".aac"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"}

ALL_SUPPORTED = TEXT_EXTENSIONS | PDF_EXTENSIONS | AUDIO_EXTENSIONS | VIDEO_EXTENSIONS


def _extension(filename: str) -> str:
    return Path(filename).suffix.lower()


# ── Text ingestion ────────────────────────────────────────────────────────────

def _ingest_text_file(
    path: str,
    source_url: str,
    title: str,
) -> List[str]:
    """Read a plain text file, chunk, tag, and store."""
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    if not content.strip():
        print("[upload] ⚠️  File is empty, skipping.")
        return []

    print(f"[upload] Text file: {len(content.split())} words.")
    chunks = chunk_text(content)
    tagging_results = tag_chunks_batch(chunks)

    knowledge_chunks = [
        KnowledgeChunk(
            content=text,
            source_url=source_url,
            source_type="upload",
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


# ── Audio / Video ingestion ───────────────────────────────────────────────────

def _ingest_audio_file(
    path: str,
    source_url: str,
    title: str,
    whisper_model: str = "base",
) -> List[str]:
    """Transcribe an audio/video file, chunk, tag, and store."""
    print(f"[upload] Transcribing with Whisper (model={whisper_model})…")
    transcript = transcribe_audio(path, whisper_model)

    if not transcript.strip():
        print("[upload] ⚠️  Empty transcript, skipping.")
        return []

    chunks = chunk_text(transcript)
    tagging_results = tag_chunks_batch(chunks)

    knowledge_chunks = [
        KnowledgeChunk(
            content=text,
            source_url=source_url,
            source_type="upload",
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


def _extract_audio_from_video(video_path: str, output_dir: str) -> str:
    """
    Extract audio track from a video file using ffmpeg.

    Returns path to the extracted .mp3 file.
    """
    import subprocess
    out_path = os.path.join(output_dir, "extracted_audio.mp3")
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",                   # no video
        "-acodec", "mp3",
        "-ab", "128k",
        "-ar", "44100",
        out_path,
    ]
    result = subprocess.run(cmd, capture_output=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"ffmpeg failed: {result.stderr.decode()[:300]}"
        )
    return out_path


# ── Public API ────────────────────────────────────────────────────────────────

def ingest_upload(
    path: str,
    title: Optional[str] = None,
    source_url: Optional[str] = None,
    whisper_model: str = "base",
    pdf_start_page: int = 1,
) -> List[str]:
    """
    Ingest a local file into the knowledge base.

    Routes automatically based on file extension.

    Parameters
    ----------
    path          : Absolute or relative path to the file.
    title         : Human-readable label (defaults to filename).
    source_url    : DB identifier (defaults to "local://<filename>").
    whisper_model : Whisper model size for audio/video transcription.
    pdf_start_page: First page to read for PDFs (skip front matter).
    """
    db.init_collection()

    resolved = Path(path).resolve()
    if not resolved.exists():
        raise FileNotFoundError(f"File not found: {resolved}")

    ext = _extension(resolved.name)
    if ext not in ALL_SUPPORTED:
        raise ValueError(
            f"Unsupported file type '{ext}'. "
            f"Supported: {sorted(ALL_SUPPORTED)}"
        )

    if title is None:
        title = resolved.stem.replace("_", " ").replace("-", " ").title()
    if source_url is None:
        source_url = f"local://{resolved.name}"

    print(f"\n[upload] File  : {resolved.name}")
    print(f"[upload] Type  : {ext}")
    print(f"[upload] Title : {title}")

    if ext in PDF_EXTENSIONS:
        return ingest_pdf(str(resolved), source_url=source_url, title=title, start_page=pdf_start_page)

    if ext in TEXT_EXTENSIONS:
        return _ingest_text_file(str(resolved), source_url=source_url, title=title)

    if ext in AUDIO_EXTENSIONS:
        return _ingest_audio_file(str(resolved), source_url=source_url, title=title, whisper_model=whisper_model)

    if ext in VIDEO_EXTENSIONS:
        # Extract audio first, then transcribe
        with tempfile.TemporaryDirectory() as tmp_dir:
            print("[upload] Extracting audio from video…")
            audio_path = _extract_audio_from_video(str(resolved), tmp_dir)
            return _ingest_audio_file(audio_path, source_url=source_url, title=title, whisper_model=whisper_model)

    return []  # unreachable, kept for type-checker


def ingest_upload_bytes(
    content: bytes,
    filename: str,
    title: Optional[str] = None,
    whisper_model: str = "base",
) -> List[str]:
    """
    Ingest raw bytes (e.g. from a FastAPI UploadFile) by writing to a
    temporary file first, then calling ingest_upload.

    Parameters
    ----------
    content   : Raw file bytes.
    filename  : Original filename (used to determine type and title).
    title     : Optional override for the display title.
    """
    with tempfile.NamedTemporaryFile(
        suffix=Path(filename).suffix,
        delete=False,
    ) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        return ingest_upload(
            tmp_path,
            title=title or Path(filename).stem,
            source_url=f"upload://{filename}",
            whisper_model=whisper_model,
        )
    finally:
        os.unlink(tmp_path)  # always clean up


# ── CLI entry point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m ingestion.upload_handler <file_path> [Title]")
        print(f"Supported types: {sorted(ALL_SUPPORTED)}")
        sys.exit(1)

    file_path = sys.argv[1]
    file_title = sys.argv[2] if len(sys.argv) > 2 else None

    stored_ids = ingest_upload(file_path, title=file_title)
    print(f"\nIngestion complete. {len(stored_ids)} chunks stored.")
