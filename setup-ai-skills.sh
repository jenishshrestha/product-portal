#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FORCE=false

for arg in "$@"; do
  case $arg in
    --force) FORCE=true ;;
  esac
done

# Check prerequisites
if ! command -v npx &>/dev/null; then
  echo -e "${RED}Error: npx is not available. Install Node.js >= 22.x first.${NC}"
  exit 1
fi

echo "Setting up Claude Code skills..."
echo ""

# ── Skill Sources ─────────────────────────────────────────────────
VERCEL_REPO="vercel-labs/agent-skills"
CUSTOM_REPO="jenishshrestha/ai-skills"

VERCEL_SKILLS=("vercel-composition-patterns" "vercel-react-best-practices")
CUSTOM_SKILLS=("code-review" "FDD-architecture" "tailwind-v4-best-practices")

INSTALLED=0
SKIPPED=0
FAILED=0

install_skill() {
  local repo="$1"
  local skill="$2"
  local skill_dir="$PROJECT_ROOT/.agents/skills/$skill"

  if [[ -d "$skill_dir" && "$FORCE" == "false" ]]; then
    echo -e "  ${YELLOW}⊘ $skill${NC} (already installed, use --force to reinstall)"
    SKIPPED=$((SKIPPED + 1))
    return
  fi

  if npx skills add "$repo" --skill "$skill" -y 2>/dev/null; then
    echo -e "  ${GREEN}✓ $skill${NC}"
    INSTALLED=$((INSTALLED + 1))
  else
    echo -e "  ${RED}✗ $skill${NC} (failed to install from $repo)"
    FAILED=$((FAILED + 1))
  fi
}

# ── Install Vercel Skills ─────────────────────────────────────────
echo "Installing from $VERCEL_REPO..."
for skill in "${VERCEL_SKILLS[@]}"; do
  install_skill "$VERCEL_REPO" "$skill"
done

echo ""

# ── Install Custom Skills ─────────────────────────────────────────
echo "Installing from $CUSTOM_REPO..."
for skill in "${CUSTOM_SKILLS[@]}"; do
  install_skill "$CUSTOM_REPO" "$skill"
done

echo ""

# ── Create .claude/settings.local.json ────────────────────────────
SETTINGS_FILE="$PROJECT_ROOT/.claude/settings.local.json"
mkdir -p "$(dirname "$SETTINGS_FILE")"
if [[ ! -f "$SETTINGS_FILE" || "$FORCE" == "true" ]]; then
  cat > "$SETTINGS_FILE" << 'EOF'
{
  "permissions": {
    "allow": [
      "Bash(*)",
      "WebFetch(*)"
    ]
  }
}
EOF
  echo -e "${GREEN}✓${NC} Created .claude/settings.local.json"
else
  echo -e "${YELLOW}⊘${NC} .claude/settings.local.json already exists"
fi

echo ""

# ── Summary ───────────────────────────────────────────────────────
echo "Done! Installed: $INSTALLED | Skipped: $SKIPPED | Failed: $FAILED"

if [[ "$FAILED" -gt 0 ]]; then
  echo -e "${RED}Some skills failed to install. Check the output above.${NC}"
  exit 1
fi
