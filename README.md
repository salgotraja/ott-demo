# OTT Demo - Movie & TV Discovery Platform

A pnpm monorepo with two Next.js apps: a public-facing frontend and a private backend with admin panel, Redis cache, and TMDB sync.

## Architecture

```
apps/ott            — Public frontend (port 3000): movie/TV browsing, no DB access
apps/ott-backend    — Backend (port 3001): public API, admin UI, Redis cache, TMDB sync
packages/database   — Shared Prisma schema, migrations, and client
infra/              — Docker Compose stack
```

## Tech Stack

- **Runtime**: Node.js 20, pnpm workspaces, Turborepo
- **Framework**: Next.js 16 (App Router, Server Components)
- **Database**: PostgreSQL 16 + Prisma 7.x with pg adapter
- **Cache**: Redis 7
- **Styling**: Tailwind CSS v4
- **Auth**: JWT (jose) + bcrypt, httpOnly cookies
- **Data Source**: TMDB API v3

---

## Option A - Full stack via Docker Compose

The fastest way to run everything.

### Prerequisites

- Docker & Docker Compose

### Setup

```bash
# 1. Create secrets file
cp infra/.env.example infra/.env

# 2. Edit infra/.env — set JWT_SECRET and ADMIN_PASSWORD_HASH
#    Generate JWT_SECRET:
openssl rand -hex 32
#    Generate ADMIN_PASSWORD_HASH (bcrypt of your chosen password):
node -e "const b=require('bcryptjs'); b.hash('yourpassword',10).then(console.log)"
```

### Start

```bash
cd infra
docker-compose up -d
```

Startup order (enforced by health checks):
1. `postgres` + `redis` become healthy
2. `ott-backend` starts on :3001
3. `ott` starts on :3000

### URLs

| Service      | URL                              |
|---|---|
| Frontend     | http://localhost:3000            |
| Backend API  | http://localhost:3001            |
| Admin panel  | http://localhost:3001/admin      |

### Rebuild after code changes

```bash
cd infra
docker-compose up -d --build
```

---

## Option B - Local development

Run apps locally; only databases in Docker.

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker & Docker Compose

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start databases

```bash
cd infra
docker-compose up -d postgres redis
```

### 3. Configure environment

Create `apps/ott-backend/.env.local`:

```bash
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/ottdemo
REDIS_URL=redis://localhost:6379
JWT_SECRET=<generate-a-random-hex-string>
ADMIN_USERNAME=<your admin username>
ADMIN_PASSWORD_HASH=<bcrypt hash of your password>
TMDB_API_KEY=<your tmdb api key>
PORT=3001
```

Create `apps/ott/.env.local`:

```bash
INTERNAL_API_URL=http://localhost:3001
```

### 4. Generate Prisma client

```bash
pnpm --filter @ott/database exec prisma generate
```

### 5. Start the apps

In two separate terminals:

```bash
# Terminal 1 — backend (http://localhost:3001)
pnpm --filter ott-backend dev

# Terminal 2 — frontend (http://localhost:3000)
pnpm --filter ott dev
```

Or start both from the root with Turborepo:

```bash
pnpm turbo dev
```

---

## Available Commands

### Root (runs across all packages via Turborepo)

```bash
pnpm turbo build        # Build all packages and apps
pnpm turbo dev          # Start all apps in dev mode
pnpm turbo lint         # Lint all packages
pnpm turbo type-check   # Type-check all packages
```

### Per-app

```bash
pnpm --filter ott dev               # Frontend dev server
pnpm --filter ott build             # Frontend production build
pnpm --filter ott start             # Frontend production server

pnpm --filter ott-backend dev       # Backend dev server
pnpm --filter ott-backend build     # Backend production build
```

### Database

```bash
# Run from packages/database
pnpm --filter @ott/database exec prisma generate      # Regenerate client after schema changes
pnpm --filter @ott/database exec prisma migrate dev   # Create and apply migration
pnpm --filter @ott/database exec prisma studio        # Open Prisma Studio GUI
```

### Docker Compose

```bash
cd infra
docker-compose up -d                  # Start full stack
docker-compose up -d postgres redis   # Start databases only
docker-compose down                   # Stop (data preserved)
docker-compose down -v                # Stop and delete all data
docker-compose logs -f ott-backend    # Tail backend logs
docker-compose up -d --build          # Rebuild images and restart
```

---

## Project Structure

```
apps/
  ott/
    app/                    # Next.js pages (movies, TV, providers)
    components/             # UI components
    lib/api.ts              # fetchApi() helper + TypeScript interfaces
  ott-backend/
    server.ts               # Custom HTTP server (init Redis, SSE, worker)
    src/
      app/api/public/       # Public API routes (movies, TV, providers, genres)
      app/api/admin/        # Admin API routes (auth, sync, SSE stream)
      app/admin/            # Admin UI pages (login, movies, sync, notifications)
      actions/              # Server Actions (movies, providers — with cache invalidation)
      cache/                # Redis client + helpers
      sse/                  # SSE manager (Redis Pub/Sub → active streams)
      jobs/                 # TMDB sync worker
      middleware.ts         # JWT validation for /admin/* and /api/admin/*
packages/
  database/
    prisma/schema.prisma    # Source of truth for DB schema
    prisma/migrations/      # Applied migrations
    src/index.ts            # Prisma singleton exported as { prisma }
    prisma.config.ts        # Prisma 7.x config (datasource URL)
infra/
  docker-compose.yml        # postgres, redis, ott-backend, ott
  .env.example              # Required secrets template
```

## Environment Variables

### apps/ott

| Variable           | Description                              |
|---|---|
| `INTERNAL_API_URL` | Backend base URL, e.g. `http://localhost:3001` |

### apps/ott-backend

| Variable              | Required | Description |
|---|---|---|
| `DATABASE_URL`        | yes | PostgreSQL connection string |
| `REDIS_URL`           | yes | Redis connection string |
| `JWT_SECRET`          | yes | HS256 signing secret (min 32 chars) |
| `ADMIN_USERNAME`      | yes | Admin panel username |
| `ADMIN_PASSWORD_HASH` | yes | bcrypt hash of admin password |
| `TMDB_API_KEY`        | sync only | TMDB v3 API key — [get one here](https://www.themoviedb.org/settings/api) |
| `SYNC_WEBHOOK_URL`    | no | URL to POST on sync complete/fail |
| `PORT`                | no | Server port (default `3001`) |

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. Provider data sourced from JustWatch.
