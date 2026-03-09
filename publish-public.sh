#!/usr/bin/env bash

set -euo pipefail

repo_name="${1:-accenture-java-interview-kit}"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required. Install GitHub CLI first."
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub login is required. Run: gh auth login"
  exit 1
fi

owner="$(gh api user --jq .login)"

if git remote get-url origin >/dev/null 2>&1; then
  git push -u origin main
  echo "Pushed to existing remote: $(git remote get-url origin)"
else
  gh repo create "$repo_name" \
    --public \
    --source=. \
    --remote=origin \
    --push \
    --description "Static interview kit for Accenture Java role"
fi

if gh api "repos/$owner/$repo_name/pages" >/dev/null 2>&1; then
  :
else
  gh api "repos/$owner/$repo_name/pages" \
    -X POST \
    -H "Accept: application/vnd.github+json" \
    -f build_type=workflow >/dev/null 2>&1 || true
fi

echo
echo "Repository:"
echo "https://github.com/$owner/$repo_name"
echo
echo "GitHub Pages:"
echo "https://$owner.github.io/$repo_name/"
echo
echo "If Pages does not appear immediately, open:"
echo "Repository Settings -> Pages -> Source: GitHub Actions"
