# Mentor AI — Local Backend

> Tony Robbins × Alex Hormozi — AI mentor that runs on your machine, feeds Claude.ai.

---

## What this is

A local Python backend that:
1. **Ingests** content (YouTube, articles, PDFs, audio files)
2. **Stores** everything in a local vector database (Qdrant)
3. **Retrieves** the most relevant chunks when you ask a question
4. **Formats** a context block you paste into Claude.ai

No paid APIs. No cloud. Runs on your laptop.

---

## One-time setup

### Requirements
- Python 3.10+
- Docker Desktop (for Qdrant)
- ffmpeg (for audio/video processing)

Install ffmpeg:
```bash
# Mac
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html and add to PATH
```

### 1. Clone and enter the project
```bash
git clone https://github.com/Benshi915/cyntro-app.git
cd cyntro-app/mentor-ai
```

### 2. Create a Python virtual environment
```bash
python -m venv .venv
source .venv/bin/activate      # Mac/Linux
# .venv\Scripts\activate       # Windows
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up environment variables
```bash
cp .env.example .env
# Edit .env if needed (defaults work for most setups)
```

### 5. Start Qdrant (vector database)
```bash
docker compose -f docker/docker-compose.yml up -d
```

You can verify it's running at: http://localhost:6333/dashboard

---

## Ingest content

### YouTube video
```bash
python -m ingestion.youtube_scraper "https://www.youtube.com/watch?v=VIDEO_ID"

# Use a larger Whisper model for better accuracy (slower):
python -m ingestion.youtube_scraper "https://..." small
```

### Web article / blog post
```bash
python -m ingestion.web_scraper "https://www.alexhormozi.com/blog/some-article"

# Multiple URLs at once:
python -m ingestion.web_scraper "https://url1.com" "https://url2.com"
```

### PDF / Book
```bash
python -m ingestion.pdf_reader "data/raw/100m_offers.pdf" "$100M Offers"

# Skip first 10 pages (cover, table of contents):
python -m ingestion.pdf_reader "data/raw/book.pdf" "Title" 10
```

### Manual upload (audio, video, text)
```bash
python -m ingestion.upload_handler "recordings/my_notes.mp3" "My Notes"
python -m ingestion.upload_handler "data/raw/interview.mp4" "Hormozi Interview"
python -m ingestion.upload_handler "notes.txt" "My Thoughts"
```

---

## Start the API server

```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: http://localhost:8000/docs

### Key endpoints

| Method | Path | What it does |
|--------|------|-------------|
| `POST` | `/ingest/youtube` | Ingest YouTube video |
| `POST` | `/ingest/url` | Scrape web article |
| `POST` | `/ingest/upload` | Upload file |
| `GET`  | `/search?q=...` | Search knowledge base |
| `GET`  | `/sources` | List all ingested sources |
| `GET`  | `/stats` | Database stats |

---

## Project structure

```
mentor-ai/
├── ingestion/
│   ├── auto_tagger.py      # Keyword classifier → tags + persona
│   ├── youtube_scraper.py  # yt-dlp + Whisper pipeline
│   ├── web_scraper.py      # Crawl4AI scraper
│   ├── pdf_reader.py       # pdfplumber PDF reader
│   └── upload_handler.py   # Routes any file to correct pipeline
├── database/
│   ├── schema.py           # KnowledgeChunk data model
│   ├── embeddings.py       # Local sentence-transformers (all-MiniLM-L6-v2)
│   └── qdrant_client.py    # Qdrant interface (upsert, search, list)
├── api/
│   └── main.py             # FastAPI server
├── personas/               # (next) Robbins + Hormozi system prompts
├── docker/
│   └── docker-compose.yml  # Qdrant container
├── data/
│   ├── raw/                # Original downloaded files
│   └── processed/          # (future) pre-chunked exports
├── tests/
│   └── test_auto_tagger.py # Smoke tests (run: python tests/test_auto_tagger.py)
├── .env.example
└── requirements.txt
```

---

## Tags reference

| Tag | Meaning |
|-----|---------|
| `mindset` | Beliefs, psychology, mental models |
| `identity` | Self-concept, who you are |
| `state-management` | Emotions, physiology, pattern interrupts |
| `6-human-needs` | Robbins' framework |
| `offer-creation` | Building irresistible offers |
| `pricing` | Charging more, perceived value |
| `scaling` | Systems, team, delegation |
| `unit-economics` | LTV, CAC, margin |
| `lead-generation` | Traffic, marketing, funnels |
| `sales` | Closing, objections |
| `hormozi-framework` | Value equation, dream outcome |
| `hard-day` | Emotional support content |
| `habits` | Routines, discipline |
| `motivation` | Drive, purpose, vision |
| `peak-performance` | Excellence, mastery |
| `relationships` | People, leadership |
| `health` | Body, energy |

---

## What's next

- [ ] `personas/robbins.py` — Tony Robbins system prompt
- [ ] `personas/hormozi.py` — Alex Hormozi system prompt
- [ ] `personas/router.py` — Detects query type, selects persona
- [ ] `personas/prompt_builder.py` — Assembles final prompt for Claude.ai
- [ ] Next.js frontend — chat UI + upload panel
