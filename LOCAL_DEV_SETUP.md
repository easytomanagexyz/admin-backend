# Local Development Setup Guide

## Overview

This guide will help you set up all three services locally for development:
- **Admin Backend** (Port 4000)
- **POS Backend** (Port 5000)
- **Frontend** (Port 3000)

## Prerequisites

- **Docker & Docker Compose** - [Install Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Node.js 18+** - [Install Node.js](https://nodejs.org/)
- **PostgreSQL** (optional if using Docker)
- **Git**

## Quick Start

### 1. Admin Backend Setup

```bash
cd admin-backend

# Copy environment file
cp .env.example .env.local

# Install dependencies
npm install

# Option A: Using Docker Compose (Recommended)
docker-compose -f docker-compose.dev.yml up -d

# Option B: Using Local PostgreSQL
# Make sure PostgreSQL is running and create the database
# Update DATABASE_URL in .env.local to point to your local DB
npm run dev
```

### 2. POS Backend Setup

```bash
cd ../Eat-with-me-POS

# Copy environment file
cp .env .env.local

# Install dependencies
npm install

# Generate Prisma client and run migrations
npm run prisma:generate
npm run prisma:migrate

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd ../eat-with-me-frontend

# Copy environment file
cp .env.local.example .env.local

# Install dependencies
npm install

# Start development server
npm run dev
```

## Environment Variables

### Admin Backend (.env.local)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/admin_db
PORT=4000
NODE_ENV=development
JWT_SECRET=your_dev_secret
LOG_LEVEL=debug
```

### POS Backend (.env.local)
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your_dev_secret
MASTER_DB_USER=postgres
MASTER_DB_PASS=postgres
MASTER_DB_HOST=localhost
MASTER_DB_PORT=5432
MASTER_DB_NAME=master_db
DATABASE_URL_TENANT=postgresql://postgres:postgres@localhost:5432/tenant_db
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:4000
VITE_POS_API_URL=http://localhost:5000
VITE_DEV_MODE=true
```

## Database Setup

### Using Docker Compose
```bash
cd admin-backend
docker-compose -f docker-compose.dev.yml up -d
```

This will start a PostgreSQL container on port 5432 with credentials:
- User: postgres
- Password: postgres
- Database: admin_db

### Manual PostgreSQL Setup
```bash
# Create databases
creatdb admin_db
creatdb master_db
creatdb tenant_db

# For migrations (in each service directory)
npm run prisma:migrate dev
```

## Running the Services

### Terminal 1 - Admin Backend
```bash
cd admin-backend
npm run dev
```

### Terminal 2 - POS Backend
```bash
cd Eat-with-me-POS
npm run dev
```

### Terminal 3 - Frontend
```bash
cd eat-with-me-frontend
npm run dev
```

## Accessing the Applications

- **Frontend**: http://localhost:3000
- **Admin Backend API**: http://localhost:4000
- **POS Backend API**: http://localhost:5000

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format in .env.local
- Ensure database exists: `createdb admin_db`

### Node Modules Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes and test locally**

3. **Run linting and tests**
   ```bash
   npm run lint
   npm test
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: description"
   git push origin feature/your-feature
   ```

## Docker Compose Commands

```bash
# Start services
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Remove volumes (deletes data)
docker-compose -f docker-compose.dev.yml down -v
```

## Common Commands

### Admin Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run prisma:studio # Open Prisma Studio
npm test            # Run tests
```

### POS Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Useful Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Questions or Issues?

Refer to individual repository READMEs for more details:
- Admin Backend: `admin-backend/README.md`
- POS Backend: `Eat-with-me-POS/README.md`
- Frontend: `eat-with-me-frontend/README.md`
