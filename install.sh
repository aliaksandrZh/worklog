#!/usr/bin/env bash
# Usage:
#   chmod +x install.sh   # make executable (one time)
#   ./install.sh           # run the installer
# Or without making executable:
#   bash install.sh
set -euo pipefail

echo "=== Task Tracker CLI Installer ==="
echo

# 1. Check Node.js
if ! command -v node &>/dev/null; then
  echo "Error: Node.js is not installed."
  echo "Install it from https://nodejs.org/ and try again."
  exit 1
fi
echo "Node.js found: $(node --version)"

# 2. Install local dependencies
echo "Installing dependencies..."
npm install

# 3. Install globally
echo "Installing tt globally..."
npm install -g .

# 4. Verify tt is on PATH
if command -v tt &>/dev/null; then
  echo
  echo "Success! tt is installed and available on your PATH."
  echo "Try running: tt today"
else
  # 5. Print PATH instructions
  NPM_PREFIX="$(npm prefix -g)"
  NPM_BIN="$NPM_PREFIX/bin"
  echo
  echo "tt was installed but is not on your PATH."
  echo "Add the following line to your shell profile:"
  echo

  SHELL_NAME="$(basename "$SHELL")"
  case "$SHELL_NAME" in
    zsh)
      echo "  echo 'export PATH=\"$NPM_BIN:\$PATH\"' >> ~/.zshrc"
      echo
      echo "Then run: source ~/.zshrc"
      ;;
    bash)
      echo "  echo 'export PATH=\"$NPM_BIN:\$PATH\"' >> ~/.bashrc"
      echo
      echo "Then run: source ~/.bashrc"
      ;;
    *)
      echo "  export PATH=\"$NPM_BIN:\$PATH\""
      echo
      echo "Add the line above to your shell profile."
      ;;
  esac
fi
