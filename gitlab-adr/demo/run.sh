#!/bin/sh
# Try gitlab-adr without GitLab: serves the site with a fake GitLab (demo/mock.js) and sample data.
# Usage: sh demo/run.sh [port]   (default port 8000). Needs Python 3. Edits to the site show after rerunning.
set -e
cd "$(dirname "$0")/.."
out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT INT TERM
cp adr.js "$out/"
cp -R template "$out/"
cp demo/mock.js demo/config.json "$out/"
# The same page as index.html, with the fake GitLab loaded before the app.
sed 's|<script type="module" src="adr.js"></script>|<script src="mock.js"></script><script type="module" src="adr.js"></script>|' index.html > "$out/index.html"
port=${1:-8000}
echo "gitlab-adr demo: http://localhost:$port/  (Ctrl+C to stop)"
cd "$out" && python3 -m http.server "$port" --bind 127.0.0.1
