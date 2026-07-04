#!/usr/bin/env bash
set -e

cd /home/forge/silvernoise-admin.on-forge.com

git pull origin "$FORGE_SITE_BRANCH"

npm ci

npm run build

# Copy public assets into standalone build
cp -r public .next/standalone/public 2>/dev/null || true
cp -r .next/static .next/standalone/.next/static 2>/dev/null || true

# Restart PM2 process
pm2 reload silvernoise-admin --update-env 2>/dev/null || \
pm2 reload all --update-env 2>/dev/null || \
pm2 restart all 2>/dev/null || true

echo "Deploy complete."
