# SEAPEDIA — Backend

> REST API untuk e-commerce multi-role. NestJS + Prisma + PostgreSQL + Supabase Storage.

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | NestJS 11 (Express), TypeScript |
| ORM | Prisma 6 — `prisma/schema.prisma` |
| Database | PostgreSQL (Supabase) |
| Storage | Supabase Storage — bucket: `profiles`, `products` |
| Auth | JWT (passport-jwt), bcrypt (10 rounds) |
| Validation | class-validator + class-transformer (DTO), Joi (env) |
| Rate limit | @nestjs/throttler — 100 req/min global |
| Scheduling | @nestjs/schedule — overdue cron (30m) |
| Image | sharp — auto-convert ke WebP (quality 80) |
| API docs | Swagger (@nestjs/swagger) — `/docs` |
| Testing | Jest + supertest — `npm test`, `npm run test:e2e` |

## Prerequisites

- Node.js 22+ (`node:22-alpine` di Docker)
- PostgreSQL (via Supabase atau lokal)
- Supabase account (untuk file storage)
- Docker (opsional untuk deployment)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup database
npx prisma migrate dev

# 3. Seed demo data
npx prisma db seed

# 4. Start development server
npm run start:dev    # http://localhost:3000
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `SECRET_JWT` | Yes (min 16 chars) | — | JWT signing secret |
| `SECRET_ORDER` | Yes (min 16 chars) | — | Order token signing secret |
| `SUPABASE_URL` | Yes (runtime) | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (runtime) | — | Supabase service role key |
| `PORT` | No | 3000 | Server port |
| `CORS_ORIGINS` | No | localhost:5173,5174, seapedia-nine.vercel.app | Comma-separated origins |
| `CONNECTION_LIMIT` | No | 10 | Prisma connection pool |

## Links

- [Swagger Docs](https://saukiputraa-seapedia-be.hf.space/docs)
- [Demo Guide (Frontend)](https://github.com/saputt/Seapedia-FE/blob/main/docs/demo-guide.md)
- [Business Rules](./docs/business-rules.md)
- [Architecture Decision Record](./docs/architecture-decision-record.md)
- [Deployment & Environment](./docs/deployment-and-environment.md)

---

**Related:**
- [Business Rules](./docs/business-rules.md)
- [Architecture Decision Record](./docs/architecture-decision-record.md)
- [Deployment & Environment](./docs/deployment-and-environment.md)
- [Frontend Repository](https://github.com/saputt/Seapedia-FE)

**Back to:** [Project Root](../README.md)
