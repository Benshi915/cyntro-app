#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Mentor AI — Start all services (Mac/Linux)
#  Run every time: bash start.sh
# ═══════════════════════════════════════════════════════════════

set -e
CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

info() { echo -e "${CYAN}→  $1${NC}"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo ""
echo "═══════════════════════════════════════════════════"
echo "   Mentor AI — Starting"
echo "═══════════════════════════════════════════════════"
echo ""

# ── 1. Qdrant (Docker) ───────────────────────────────────────────
info "Starting Qdrant (vector database)..."
docker compose -f docker/docker-compose.yml up -d --quiet-pull
ok "Qdrant running → http://localhost:6333/dashboard"

# ── 2. Activate Python venv ──────────────────────────────────────
if [ -f ".venv/bin/activate" ]; then
  source .venv/bin/activate
else
  warn ".venv not found — run setup_mac.sh first"
  exit 1
fi

# ── 3. FastAPI backend ───────────────────────────────────────────
info "Starting Python backend (port 8000)..."
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
ok "Backend running → http://localhost:8000/docs"

# ── 4. Next.js frontend ──────────────────────────────────────────
info "Starting frontend (port 3000)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# ── 5. Wait and open browser ─────────────────────────────────────
sleep 3
echo ""
echo "═══════════════════════════════════════════════════"
echo -e "${GREEN}   All services running! 🚀${NC}"
echo "═══════════════════════════════════════════════════"
echo ""
echo "   App:      http://localhost:3000"
echo "   API docs: http://localhost:8000/docs"
echo "   Qdrant:   http://localhost:6333/dashboard"
echo ""
echo "   Press Ctrl+C to stop everything."
echo ""

# Open browser automatically
if command -v open &>/dev/null; then
  open "http://localhost:3000"
fi

# ── Cleanup on Ctrl+C ────────────────────────────────────────────
cleanup() {
  echo ""
  info "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  docker compose -f docker/docker-compose.yml down
  echo "Stopped."
}
trap cleanup INT TERM

wait
