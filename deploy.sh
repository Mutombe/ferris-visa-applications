#!/usr/bin/env bash
# Deploy Ferris Visa Consultants to Render.
#
# Render static sites can only build from a Git repository, so this script
# creates the repo, pushes, then creates and polls the Render service.
#
# Usage:
#   GITHUB_TOKEN=ghp_xxx ./deploy.sh
#
# GITHUB_TOKEN needs the `repo` scope (classic) or Contents+Administration
# read/write (fine-grained). If the repo already exists the script reuses it.

set -euo pipefail

RENDER_API_KEY="${RENDER_API_KEY:-rnd_yOgjtn2o7bOYv2poxVcjoWPyYRH5}"
RENDER_OWNER_ID="${RENDER_OWNER_ID:-tea-csps2923esus73eo23pg}"
GITHUB_USER="${GITHUB_USER:-Mutombe}"
REPO_NAME="${REPO_NAME:-ferris-visa-applications}"
SERVICE_NAME="${SERVICE_NAME:-ferris-visa-applications}"
BRANCH="${BRANCH:-main}"

: "${GITHUB_TOKEN:?set GITHUB_TOKEN to a token with repo scope}"

api_gh() { curl -sS -H "Authorization: Bearer $GITHUB_TOKEN" \
                    -H "Accept: application/vnd.github+json" "$@"; }
api_rn() { curl -sS -H "Authorization: Bearer $RENDER_API_KEY" \
                    -H "Accept: application/json" \
                    -H "Content-Type: application/json" "$@"; }

echo "==> 1/4  GitHub repository"
if api_gh "https://api.github.com/repos/$GITHUB_USER/$REPO_NAME" | grep -q '"full_name"'; then
  echo "    already exists: $GITHUB_USER/$REPO_NAME"
else
  api_gh -X POST https://api.github.com/user/repos \
    -d "{\"name\":\"$REPO_NAME\",\"private\":true,\"description\":\"Ferris Visa Consultants website\",\"has_issues\":false,\"has_wiki\":false}" \
    > /dev/null
  echo "    created (private): $GITHUB_USER/$REPO_NAME"
fi

echo "==> 2/4  push"
git branch -M "$BRANCH"
git remote remove origin 2>/dev/null || true
git remote add origin "https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git"
git push -u origin "$BRANCH" --force
# do not leave the token sitting in .git/config
git remote set-url origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
echo "    pushed $BRANCH"

echo "==> 3/4  Render service"
EXISTING=$(api_rn "https://api.render.com/v1/services?name=${SERVICE_NAME}&limit=1")
SERVICE_ID=$(printf '%s' "$EXISTING" | python -c "
import sys,json
d=json.load(sys.stdin)
print(d[0]['service']['id'] if d else '')
" 2>/dev/null || true)

if [ -n "$SERVICE_ID" ]; then
  echo "    reusing $SERVICE_ID"
  api_rn -X POST "https://api.render.com/v1/services/$SERVICE_ID/deploys" -d '{"clearCache":"clear"}' > /dev/null
else
  RESP=$(api_rn -X POST https://api.render.com/v1/services -d "{
    \"type\": \"static_site\",
    \"name\": \"$SERVICE_NAME\",
    \"ownerId\": \"$RENDER_OWNER_ID\",
    \"repo\": \"https://github.com/$GITHUB_USER/$REPO_NAME\",
    \"branch\": \"$BRANCH\",
    \"autoDeploy\": \"yes\",
    \"serviceDetails\": { \"publishPath\": \".\", \"buildCommand\": \"\" }
  }")
  SERVICE_ID=$(printf '%s' "$RESP" | python -c "
import sys,json
d=json.load(sys.stdin)
s=d.get('service',d)
print(s.get('id',''))
sys.stderr.write(json.dumps(d)[:400] if not s.get('id') else '')
")
  [ -n "$SERVICE_ID" ] || { echo "    service creation failed"; exit 1; }
  echo "    created $SERVICE_ID"
fi

echo "==> 4/4  waiting for the build"
URL=""
for i in $(seq 1 60); do
  S=$(api_rn "https://api.render.com/v1/services/$SERVICE_ID")
  STATUS=$(printf '%s' "$S" | python -c "
import sys,json
d=json.load(sys.stdin); s=d.get('service',d)
print(s.get('serviceDetails',{}).get('url','') or '')
")
  D=$(api_rn "https://api.render.com/v1/services/$SERVICE_ID/deploys?limit=1")
  ST=$(printf '%s' "$D" | python -c "
import sys,json
d=json.load(sys.stdin)
print(d[0]['deploy']['status'] if d else 'unknown')
")
  echo "    [$i] deploy status: $ST"
  case "$ST" in
    live)   URL="$STATUS"; break ;;
    build_failed|update_failed|canceled|pre_deploy_failed)
            echo "    deploy failed: $ST"; exit 1 ;;
  esac
  sleep 10
done

echo
if [ -n "$URL" ]; then
  echo "LIVE: $URL"
else
  echo "still building. check https://dashboard.render.com/static/$SERVICE_ID"
fi
