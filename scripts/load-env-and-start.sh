#!/bin/bash
set -e

echo "🔹 Loading environment variables from .env..."

if [ -f ".env" ]; then
export $(grep -v '^#' .env | xargs)
echo "✔ .env loaded"
else
echo "⚠️ .env file not found, continuing with existing env..."
fi

echo "🔹 Starting admin backend with node..."


pkill -f "node dist/server.js" || true


nohup node dist/server.js > admin-backend.log 2>&1 &

echo "🎉 Admin backend started!"