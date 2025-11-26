FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci && npm cache clean --force

COPY . .

# Fix permissions and generate Prisma client
RUN chmod -R +x /app/node_modules/.bin/ && \
    npx prisma generate

EXPOSE 4001

# Run with ts-node-dev
CMD ["npx", "ts-node-dev", "src/server.ts"]
