#!/bin/sh
set -e
branch="${1:-main}"
msg="${2:-site: update}"
git add .
# commit if there are staged changes; ignore non-zero if nothing to commit
git commit -m "$msg" || true
git push origin "$branch"
