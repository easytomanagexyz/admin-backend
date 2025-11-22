#!/usr/bin/env bash
set -euo pipefail

SSM_FULL_PARAM="/prod/master-db-url"
SSM_PREFIX="/eatwithme"

echo "Loading DATABASE_URL_MASTER from SSM (attempt full URL first)..."

FULL_URL=$(aws ssm get-parameter --name "$SSM_FULL_PARAM" --with-decryption --region ap-south-1 --query "Parameter.Value" --output text 2>/dev/null || echo "")

if [ -n "$FULL_URL" ]; then
  # strip surrounding quotes if any
  FULL_URL=$(echo "$FULL_URL" | sed 's/^"//;s/"$//')
  export DATABASE_URL_MASTER="$FULL_URL"
  echo "Loaded full DATABASE_URL_MASTER from SSM ($SSM_FULL_PARAM)."
else
  echo "Full URL not found. Loading individual params under $SSM_PREFIX..."
  DB_USER=$(aws ssm get-parameter --name "$SSM_PREFIX/db-user" --with-decryption --region ap-south-1 --query "Parameter.Value" --output text)
  DB_PASS=$(aws ssm get-parameter --name "$SSM_PREFIX/db-password" --with-decryption --region ap-south-1 --query "Parameter.Value" --output text)
  DB_HOST=$(aws ssm get-parameter --name "$SSM_PREFIX/db-host" --with-decryption --region ap-south-1 --query "Parameter.Value" --output text)
  DB_PORT=$(aws ssm get-parameter --name "$SSM_PREFIX/db-port" --with-decryption --region ap-south-1 --query "Parameter.Value" --output text)
  DB_NAME=$(aws ssm get-parameter --name "$SSM_PREFIX/db-name" --with-decryption --region ap-south-1 --query "Parameter.Value" --output text 2>/dev/null || echo "master-db")

  # strip quotes if returned
  DB_USER=$(echo "$DB_USER" | sed 's/^"//;s/"$//')
  DB_PASS=$(echo "$DB_PASS" | sed 's/^"//;s/"$//')
  DB_HOST=$(echo "$DB_HOST" | sed 's/^"//;s/"$//')
  DB_PORT=$(echo "$DB_PORT" | sed 's/^"//;s/"$//')
  DB_NAME=$(echo "$DB_NAME" | sed 's/^"//;s/"$//')

  export DATABASE_URL_MASTER="postgresql://$(python3 - <<PY
import urllib.parse,sys
u="${DB_USER}"
p="${DB_PASS}"
host="${DB_HOST}"
port="${DB_PORT}"
db="${DB_NAME}"
print(urllib.parse.quote(u, safe='') + ":" + urllib.parse.quote(p, safe='') + "@" + host + ":" + port + "/" + db + "?schema=public")
PY
)"
  echo "Built DATABASE_URL_MASTER from individual params."
fi

echo "Starting backend with PM2 (update-env)..."
pm2 start dist/server.js --name admin-backend --update-env || pm2 restart admin-backend --update-env
pm2 save

echo "Done."
