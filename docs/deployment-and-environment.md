# Deployment & Environment

> Infrastruktur, environment variables, dan deployment configuration.
> Waktu baca: 2 menit | Prioritas: Should Read

## Production URLs

| Service | URL | Source |
|---------|-----|--------|
| Backend API | `https://saukiputraa-seapedia-be.hf.space` | CORS `/\\.hf\\.space$/` (`main.ts:22`) |
| Swagger Docs | `https://saukiputraa-seapedia-be.hf.space/docs` | `SwaggerModule.setup('docs')` (`main.ts:71`) |
| Frontend | `https://seapedia-nine.vercel.app` | CORS list (`main.ts:23`), `vercel.json` |

## Infrastructure

| Component | Provider | Detail |
|-----------|----------|--------|
| Backend hosting | HuggingFace Spaces | Docker container, port 7860 |
| Frontend hosting | Vercel | SPA dengan rewrite rules (`vercel.json`) |
| Database | Supabase PostgreSQL | Connection via `DATABASE_URL` |
| File storage | Supabase Storage | Buckets: `profiles`, `products` |
| Image processing | sharp | Auto-convert ke WebP quality 80 (`storage.service.ts:27-29`) |

## Docker Setup

Multi-stage build (`Dockerfile`):

- **Stage 1 (build)**: `node:22-alpine`, `npm ci`, `npx prisma generate`, `npm run build`
- **Stage 2 (runtime)**: `node:22-alpine`, `apk add openssl`, `npm ci --omit=dev`, copy `dist/` + `prisma/`, `npx prisma generate`
- **Port**: `EXPOSE 7860`, `ENV PORT=7860`
- **Startup**: `npx prisma db push && node dist/src/main.js` — menggunakan `db push` (schema sync), bukan `migrate deploy`

## Environment Variables

| Variable | Required | Default | Description | Source |
|----------|----------|---------|-------------|--------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string | `validation.ts:4` |
| `SECRET_JWT` | Yes (min 16 chars) | — | Sign auth JWT (7d expiry) | `validation.ts:5`, `auth.service.ts:57-61` |
| `SECRET_ORDER` | Yes (min 16 chars) | — | Sign order token (5m expiry) | `validation.ts:6`, `order-checkout.service.ts:54-58` |
| `SUPABASE_URL` | Yes (runtime) | — | Supabase project URL | `storage.service.ts:15-19` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (runtime) | — | Supabase service role key | `storage.service.ts:15-19` |
| `PORT` | No | 3000 | Server port (Docker: 7860) | `validation.ts:7`, `main.ts:73` |
| `CORS_ORIGINS` | No | localhost:5173,5174, seapedia-nine.vercel.app, hf.space | Comma-separated allowed origins | `main.ts:18` |
| `CONNECTION_LIMIT` | No | 10 | Prisma connection pool | `prisma.service.ts:13` |

**Catatan**: `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` tidak ada di Joi validation schema — hanya dibaca langsung di `StorageService.onModuleInit()`. Jika tidak set, error throw saat startup.

## CORS Configuration

Allowed origins (`main.ts:17-27`):

1. `http://localhost:5173` — Vite dev
2. `http://localhost:5174` — Vite dev (alternate)
3. `https://huggingface.co`
4. `/\.hf\.space$/` — semua HuggingFace Spaces
5. `https://seapedia-nine.vercel.app`

Jika env `CORS_ORIGINS` diset, daftar override seluruhnya (comma-separated).

## File Upload

- **Limit**: 5MB per file (Multer `fileSize: 5 * 1024 * 1024`)
- **Format**: Semua upload dikonversi ke WebP (quality 80) via sharp
- **Auto-delete**: Gambar lama dihapus dari Supabase saat update
- **Rate limit**: 10 req/60s (`upload.controller.ts:26,41`)

## Seed Data

`prisma/seed.ts`:

| Account | Email | Password | Wallet |
|---------|-------|----------|--------|
| Admin | `admin@seapedia.com` | `admin123` | — |
| Buyer | `buyer@seapedia.com` | `buyer123` | Rp500.000 |
| Seller | `seller@seapedia.com` | `seller123` | Rp5.000.000 |
| Driver | `driver@seapedia.com` | `driver123` | Rp200.000 |
| Multi Role | `multirole@seapedia.com` | `multirole123` | Rp1.000.000 |

Data lain: 2 stores, 210+ products (5 categories), 5 discount codes, 14 sample orders.

---

**Related:**
- [Backend README](../README.md) — quick start
- [Demo Guide](../../Frontend/docs/demo-guide.md) — cara akses aplikasi

**Back to:** [README](../README.md)
