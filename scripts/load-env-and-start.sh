#!/bin/bash
set -e

echo "🔹 Loading environment variables from .env..."

Load .env into environment
if [ -f ".env" ]; then
export $(grep -v '^#' .env | xargs)
echo "✔ .env loaded"
else
echo "⚠️ .env file not found, continuing with existing env..."
fi

echo "🔹 Starting admin backend with node..."

Stop any existing admin-backend process
pkill -f "node dist/server.js" || true

Start new process in background
nohup node dist/server.js > admin-backend.log 2>&1 &

echo "🎉 Admin backend started!"