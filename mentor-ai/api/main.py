"""
FastAPI server — the single backend entry point.

Endpoints
---------
  POST /ingest/youtube          Ingest a YouTube video by URL
  POST /ingest/url              Scrape and ingest a web article
  POST /ingest/upload           Upload a file (PDF, audio, video, text)
  POST /ingest/batch            Ingest multiple YouTube/web URLs in one shot (background)
  GET  /jobs/{job_id}           Poll status of a batch ingestion job
  GET  /search                  Semantic search the knowledge base
  GET  /sources                 List all ingested sources
  GET  /stats                   Collection statistics
  GET  /health                  Health check
  POST /prompt                  Build a Claude.ai-ready prompt for a query
  GET  /route                   Show which persona a query routes to (debug)

Start
-----
    cd mentor-ai
    uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import json
import os
import threading
from pathlib import Path
from typing import List, Optional
from uuid import uuid4

from dotenv import load_dotenv
import json as _json

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

load_dotenv()  # load .env at startup

from ingestion import youtube_scraper, web_scraper, upload_handler
from database import qdrant_client as db
from personas.prompt_builder import build_prompt_for_query, get_routing_info

# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Mentor AI — Backend API",
    description="Data ingestion and knowledge retrieval for the Tony Robbins × Alex Hormozi AI mentor.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Job persistence ───────────────────────────────────────────────────────────

_JOBS_FILE = Path(__file__).resolve().parent.parent / "data" / "jobs.json"


def _save_jobs() -> None:
    try:
        _JOBS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(_JOBS_FILE, "w") as f:
            json.dump(_JOBS, f)
    except Exception as e:
        print(f"[jobs] Warning: could not save job state: {e}")


def _load_and_resume_jobs() -> None:
    if not _JOBS_FILE.exists():
        return
    try:
        with open(_JOBS_FILE) as f:
            saved = json.load(f)
        _JOBS.update(saved)
        for job_id, job in saved.items():
            if job["status"] == "running":
                print(f"[jobs] Resuming interrupted job {job_id} ({len(job['items'])} items)…")
                items = [
                    BatchItem(
                        type=it["type"],
                        url=it["url"],
                        whisper_model=it.get("whisper_model", "base"),
                    )
                    for it in job["items"]
                ]
                t = threading.Thread(target=_run_batch, args=(job_id, items), daemon=True)
                t.start()
    except Exception as e:
        print(f"[jobs] Warning: could not load saved jobs: {e}")


# ── Startup: ensure Qdrant collection exists ──────────────────────────────────

@app.on_event("startup")
def startup() -> None:
    try:
        db.init_collection()
    except Exception as e:
        print(f"[startup] ⚠️  Could not connect to Qdrant: {e}")
        print("[startup] Is Docker running? → docker compose -f docker/docker-compose.yml up -d")
    _load_and_resume_jobs()


# ── Request / response models ─────────────────────────────────────────────────

class YoutubeIngestRequest(BaseModel):
    url: str
    whisper_model: str = "base"
    keep_audio: bool = False


class UrlIngestRequest(BaseModel):
    url: str


class SearchRequest(BaseModel):
    query: str
    limit: int = 5
    persona: Optional[str] = None   # "robbins" | "hormozi" | "both" | None
    tag: Optional[str] = None
    score_threshold: float = 0.0


class IngestResponse(BaseModel):
    status: str
    chunks_stored: int
    chunk_ids: List[str]


class SearchResult(BaseModel):
    id: str
    score: float
    content: str
    source_url: str
    source_type: str
    title: Optional[str]
    persona: str
    tags: List[str]
    chunk_index: int
    total_chunks: int
    timestamp: str


# ── Batch job store (in-memory) ───────────────────────────────────────────────

_JOBS: dict[str, dict] = {}


class BatchItem(BaseModel):
    type: str           # "youtube" | "url"
    url: str
    whisper_model: str = "base"


class BatchRequest(BaseModel):
    items: List[BatchItem]


def _run_batch(job_id: str, items: List[BatchItem]) -> None:
    job = _JOBS[job_id]
    for i, item in enumerate(items):
        if job["items"][i]["status"] in ("done", "skipped"):
            continue  # already completed — support resume after crash

        job["items"][i]["status"] = "processing"
        job["items"][i]["step"] = "starting"
        _save_jobs()
        try:
            if item.type == "youtube":
                if db.source_exists(item.url):
                    job["items"][i]["status"] = "skipped"
                    job["items"][i]["step"] = None
                    _save_jobs()
                    continue

                def on_progress(step, _i=i):
                    job["items"][_i]["step"] = step
                    _save_jobs()

                ids = youtube_scraper.ingest_youtube(
                    url=item.url,
                    whisper_model=item.whisper_model,
                    progress_callback=on_progress,
                )
            else:
                ids = web_scraper.ingest_url(item.url)

            job["items"][i]["status"] = "done"
            job["items"][i]["step"] = None
            job["items"][i]["chunks_stored"] = len(ids)
            _save_jobs()
        except Exception as e:
            job["items"][i]["status"] = "error"
            job["items"][i]["step"] = None
            job["items"][i]["error"] = str(e)
            _save_jobs()
    job["status"] = "done"
    _save_jobs()


def _run_file_batch(job_id: str) -> None:
    job = _JOBS[job_id]
    for i, item in enumerate(job["items"]):
        if item["status"] in ("done", "skipped"):
            continue

        job["items"][i]["status"] = "processing"
        _save_jobs()
        try:
            path = Path(item["path"])
            ids = upload_handler.ingest_upload(
                str(path),
                title=item.get("title"),
                source_url=f"upload://{item['url']}",
                whisper_model=item.get("whisper_model", "base"),
            )
            path.unlink(missing_ok=True)
            job["items"][i]["status"] = "done"
            job["items"][i]["chunks_stored"] = len(ids)
            _save_jobs()
        except Exception as e:
            job["items"][i]["status"] = "error"
            job["items"][i]["error"] = str(e)
            _save_jobs()

    job["status"] = "done"
    # Clean up upload dir if empty
    try:
        upload_dir = Path(job["items"][0]["path"]).parent
        if upload_dir.exists() and not any(upload_dir.iterdir()):
            upload_dir.rmdir()
    except Exception:
        pass
    _save_jobs()


# ── Endpoints: ingestion ──────────────────────────────────────────────────────

@app.post("/ingest/youtube", response_model=IngestResponse, tags=["Ingestion"])
def ingest_youtube(req: YoutubeIngestRequest):
    """
    Download, transcribe, and store a YouTube video.

    This is a long-running operation (2–15 min depending on video length and
    Whisper model). Keep the connection open or run with a client that handles
    long timeouts.
    """
    try:
        ids = youtube_scraper.ingest_youtube(
            url=req.url,
            whisper_model=req.whisper_model,
            keep_audio=req.keep_audio,
        )
        return IngestResponse(status="ok", chunks_stored=len(ids), chunk_ids=ids)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/url", response_model=IngestResponse, tags=["Ingestion"])
def ingest_url(req: UrlIngestRequest):
    """Scrape a web article or blog post and store it."""
    try:
        ids = web_scraper.ingest_url(req.url)
        return IngestResponse(status="ok", chunks_stored=len(ids), chunk_ids=ids)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/upload", response_model=IngestResponse, tags=["Ingestion"])
async def ingest_file_upload(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    whisper_model: str = Form("base"),
):
    """
    Upload a file (PDF, MP3, MP4, TXT, MD) and ingest it.

    Multipart form fields:
    - file         : The file binary
    - title        : Optional display title
    - whisper_model: Whisper model size for audio/video (default: base)
    """
    try:
        content = await file.read()
        ids = upload_handler.ingest_upload_bytes(
            content=content,
            filename=file.filename or "upload",
            title=title,
            whisper_model=whisper_model,
        )
        return IngestResponse(status="ok", chunks_stored=len(ids), chunk_ids=ids)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/upload/batch", tags=["Ingestion"])
async def ingest_upload_batch(
    files: List[UploadFile] = File(...),
    titles: str = Form("[]"),
    whisper_model: str = Form("base"),
):
    """
    Upload multiple files and process them in the background.

    Returns a job_id immediately. Poll GET /jobs/{job_id} for progress.
    Form fields: files (multiple), titles (JSON array of strings), whisper_model.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    title_list = _json.loads(titles) if titles else []
    job_id = str(uuid4())
    upload_dir = _JOBS_FILE.parent / "uploads" / job_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    job_items = []
    for i, f in enumerate(files):
        content = await f.read()
        safe_name = Path(f.filename or f"file_{i}").name
        file_path = upload_dir / safe_name
        file_path.write_bytes(content)
        title = title_list[i] if i < len(title_list) else Path(safe_name).stem.replace("-", " ").replace("_", " ").title()
        job_items.append({
            "url": safe_name,
            "type": "file",
            "path": str(file_path),
            "title": title,
            "whisper_model": whisper_model,
            "status": "pending",
            "chunks_stored": 0,
            "error": None,
            "step": None,
        })

    _JOBS[job_id] = {"id": job_id, "status": "running", "items": job_items}
    _save_jobs()
    t = threading.Thread(target=_run_file_batch, args=(job_id,), daemon=True)
    t.start()
    return {"job_id": job_id}


@app.post("/ingest/batch", tags=["Ingestion"])
def ingest_batch(req: BatchRequest):
    """
    Kick off a batch of YouTube / web-URL ingestion jobs in the background.

    Returns a job_id immediately. Poll GET /jobs/{job_id} to track progress.
    Each item status cycles: pending → processing → done | error.
    """
    if not req.items:
        raise HTTPException(status_code=400, detail="items list is empty")

    job_id = str(uuid4())
    _JOBS[job_id] = {
        "id": job_id,
        "status": "running",
        "items": [
            {
                "url": it.url,
                "type": it.type,
                "whisper_model": it.whisper_model,
                "status": "pending",
                "chunks_stored": 0,
                "error": None,
                "step": None,
            }
            for it in req.items
        ],
    }
    _save_jobs()
    t = threading.Thread(target=_run_batch, args=(job_id, req.items), daemon=True)
    t.start()
    return {"job_id": job_id}


@app.get("/jobs/{job_id}", tags=["Ingestion"])
def get_job(job_id: str):
    """Return the current state of a batch ingestion job."""
    if job_id not in _JOBS:
        raise HTTPException(status_code=404, detail="Job not found")
    return _JOBS[job_id]


# ── Endpoints: retrieval ──────────────────────────────────────────────────────

@app.get("/search", response_model=List[SearchResult], tags=["Retrieval"])
def search(
    q: str = Query(..., description="Search query"),
    limit: int = Query(5, ge=1, le=20),
    persona: Optional[str] = Query(None, description="robbins | hormozi | both"),
    tag: Optional[str] = Query(None, description="Filter by topic tag"),
    score_threshold: float = Query(0.0, ge=0.0, le=1.0),
):
    """
    Semantic search over the knowledge base.

    Returns the most relevant chunks for the query.
    Use persona= and tag= to narrow results.
    """
    try:
        results = db.search(
            query=q,
            limit=limit,
            persona_filter=persona,
            tag_filter=tag,
            score_threshold=score_threshold,
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sources", tags=["Retrieval"])
def list_sources():
    """Return a deduplicated list of all ingested sources."""
    try:
        return db.list_sources()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats", tags=["Retrieval"])
def get_stats():
    """Return collection statistics (total chunks, status)."""
    try:
        return db.collection_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Endpoints: prompt builder ─────────────────────────────────────────────────

class PromptRequest(BaseModel):
    query: str
    persona: Optional[str] = None   # "robbins" | "hormozi" | "both" | None (auto)
    num_chunks: int = 5


class PromptResponse(BaseModel):
    mode: str            # which persona was selected
    prompt: str          # full formatted prompt — paste this into Claude.ai
    chunks_used: int     # how many knowledge base chunks were retrieved


@app.post("/prompt", response_model=PromptResponse, tags=["Prompt"])
def build_prompt(req: PromptRequest):
    """
    The core endpoint.

    Send your question → get back a fully formatted prompt with:
    - The correct persona system prompt (Robbins / Hormozi / both)
    - The most relevant knowledge base excerpts
    - Your question embedded at the end

    Paste the returned `prompt` field directly into Claude.ai.
    """
    try:
        routing = get_routing_info(req.query)
        mode = req.persona or routing["mode"]

        prompt = build_prompt_for_query(
            query=req.query,
            persona_override=req.persona,
            num_chunks=req.num_chunks,
        )

        # Count context chunks (rough: count SOURCE markers)
        chunks_used = prompt.count("[SOURCE:") or prompt.count("relevance:")

        return PromptResponse(mode=mode, prompt=prompt, chunks_used=chunks_used)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/route", tags=["Prompt"])
def route_query(q: str = Query(..., description="The query to analyse")):
    """
    Debug endpoint — shows how the router would classify a query
    without building the full prompt.

    Returns: mode, emotional_score, business_score, tags, reasoning.
    """
    try:
        return get_routing_info(q)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
def health():
    return {"status": "ok"}
