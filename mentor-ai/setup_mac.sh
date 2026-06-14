#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Mentor AI — One-click setup for Mac
#  Run once: bash setup_mac.sh
# ═══════════════════════════════════════════════════════════════

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

ok()   { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${CYAN}→  $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }

echo ""
echo "═══════════════════════════════════════════════════"
echo "   Mentor AI — Setup (Mac)"
echo "═══════════════════════════════════════════════════"
echo ""

# ── 1. Homebrew ──────────────────────────────────────────────────
info "Checking Homebrew..."
if ! command -v brew &>/dev/null; then
  info "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi
ok "Homebrew ready"

# ── 2. Python ────────────────────────────────────────────────────
info "Checking Python..."
if ! command -v python3 &>/dev/null; then
  info "Installing Python..."
  brew install python
fi
PYVER=$(python3 --version 2>&1 | awk '{print $2}')
ok "Python $PYVER ready"

# ── 3. Node.js ───────────────────────────────────────────────────
info "Checking Node.js..."
if ! command -v node &>/dev/null; then
  info "Installing Node.js..."
  brew install node
fi
ok "Node.js $(node --version) ready"

# ── 4. ffmpeg ────────────────────────────────────────────────────
info "Checking ffmpeg..."
if ! command -v ffmpeg &>/dev/null; then
  info "Installing ffmpeg..."
  brew install ffmpeg
fi
ok "ffmpeg ready"

# ── 5. Docker Desktop ────────────────────────────────────────────
info "Checking Docker..."
if ! command -v docker &>/dev/null; then
  warn "Docker Desktop is not installed."
  echo ""
  echo "  Please install Docker Desktop manually:"
  echo "  👉  https://www.docker.com/products/docker-desktop/"
  echo "  Then re-run this script."
  echo ""
  exit 1
fi
ok "Docker ready"

# ── 6. Python virtual environment + packages ─────────────────────
info "Setting up Python environment..."
cd "$(dirname "$0")"   # go to mentor-ai/

python3 -m venv .venv
source .venv/bin/activate

pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
ok "Python packages installed"

# ── 7. Frontend packages ─────────────────────────────────────────
info "Installing frontend packages..."
cd frontend
npm install --silent
cd ..
ok "Frontend packages installed"

# ── 8. .env file ─────────────────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  ok ".env created from template"
fi

if [ ! -f frontend/.env.local ]; then
  cp frontend/.env.local.example frontend/.env.local
  ok "frontend/.env.local created"
fi

# ── Done ─────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo -e "${GREEN}   Setup complete! 🎉${NC}"
echo "═══════════════════════════════════════════════════"
echo ""
echo "  To start the app, run:"
echo ""
echo -e "  ${CYAN}bash start.sh${NC}"
echo ""
