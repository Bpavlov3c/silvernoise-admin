#!/usr/bin/env bash
set -e

SITE_DIR="/home/forge/silvernoise-admin.on-forge.com"
LATEST=$(ls -td "$SITE_DIR/releases"/*/ | head -1)
echo "Deploying to: $LATEST"
cd "$LATEST"

if [ -d ".git" ]; then
  git pull origin main
else
  git clone git@github.com:Bpavlov3c/silvernoise-admin.git .
fi

npm ci
npm run build

cp -r public .next/standalone/public 2>/dev/null || true
cp -r .next/static .next/standalone/.next/static 2>/dev/null || true

PORT=3001 pm2 reload silvernoise-admin --update-env 2>/dev/null || \
PORT=3001 pm2 start node --name silvernoise-admin \
  -- "$SITE_DIR/current/.next/standalone/server.js"

pm2 save
echo "Deploy complete."
