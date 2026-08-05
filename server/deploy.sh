#!/usr/bin/env bash
# Pulls the latest code and (re)deploys the server under pm2.
# Run from anywhere - it always operates on the repo this script lives in.
#
# Assumes:
#   - this checkout is on the branch you want deployed, with an upstream already configured
#     (git pull uses it as-is - it doesn't force a branch or remote)
#   - pm2 is installed and on PATH

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." &> /dev/null && pwd)"
SERVER_DIR="$SCRIPT_DIR"
PM2_APP_NAME="nyxide-server"

if ! command -v pm2 &> /dev/null; then
    echo "pm2 is not installed or not on PATH. Install it with: npm install -g pm2" >&2
    exit 1
fi

echo "==> Fetching latest changes"
git -C "$REPO_ROOT" fetch --all

echo "==> Pulling (fast-forward only)"
git -C "$REPO_ROOT" pull --ff-only

echo "==> Installing server dependencies"
(cd "$SERVER_DIR" && npm ci)

echo "==> Starting/restarting $PM2_APP_NAME under pm2"
if pm2 describe "$PM2_APP_NAME" &> /dev/null; then
    pm2 restart "$PM2_APP_NAME"
else
    (cd "$SERVER_DIR" && pm2 start src/index.js --name "$PM2_APP_NAME")
fi

pm2 save

echo "==> Deploy complete"
