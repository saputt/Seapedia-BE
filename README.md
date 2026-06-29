---
title: SEAPEDIA Backend
emoji: 🛒
colorFrom: indigo
colorTo: blue
sdk: docker
pinned: false
---

# SEAPEDIA Backend

Platform e-commerce multi-role berbasis **NestJS + Prisma + PostgreSQL + Supabase**.

---

## Daftar Isi

1. [Header & Deployment Information](#header--deployment-information)
2. [Environment Variables](#environment-variables)
3. [Local Setup & Running Guide](#local-setup--running-guide)
4. [Admin Account Setup](#admin-account-setup)
5. [Demo Accounts / Seed Data](#demo-accounts--seed-data)
6. [Business Rules Documentation](#business-rules-documentation)
7. [Security Notes](#security-notes)
8. [End-to-End Testing Guide](#end-to-end-testing-guide)

---

## Header & Deployment Information

### Live URL

| Environment | URL |
|---|---|
| **API (HuggingFace)** | `https://saukiputraa-seapedia-be.hf.space` |
| **Swagger Docs** | `https://saukiputraa-seapedia-be.hf.space/docs` |
| **Frontend** | `https://seapedia-nine.vercel.app` |

> **Catatan:** Backend di-deploy ke **HuggingFace Spaces** (Docker) dengan PostgreSQL dari **Supabase** sebagai database. File storage menggunakan **Supabase Storage**.

### Stack

| Lapisan | Teknologi |
|---|---|
| Framework | NestJS v11 |
| ORM | Prisma v6 |
| Database | PostgreSQL (Supabase) |
| Auth | JWT + bcrypt + Passport |
| File Storage | Supabase Storage |
| Dokumentasi API | Swagger (OpenAPI) |
| Rate Limiting | @nestjs/throttler |
| Security | Helmet, class-validator, sanitize-html |

---

## Environment Variables

Buat file `.env` di root `Backend/` dengan isi berikut:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# JWT Secret (min 16 karakter)
SECRET_JWT="rahasia-jwt-minimal-16-karakter"

# Order Token Secret (min 16 karakter)
SECRET_ORDER="rahasia-order-minimal-16-karakter"

# Supabase
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="service_role_key_anda"

# Port (default: 3000)
PORT=3000

# CORS Origins (dipisah koma, opsional)
CORS_ORIGINS="http://localhost:5173,https://seapedia-nine.vercel.app"
```

### Variabel Wajib vs Opsional

| Variabel | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string PostgreSQL |
| `SECRET_JWT` | ✅ | Minimal 16 karakter |
| `SECRET_ORDER` | ✅ | Minimal 16 karakter |
| `SUPABASE_URL` | ✅ | Untuk upload gambar |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role Supabase |
| `PORT` | ❌ | Default: 3000 |
| `CORS_ORIGINS` | ❌ | Default: localhost:5173 |

---

## Local Setup & Running Guide

### Prasyarat

- Node.js v22+
- PostgreSQL (atau akses ke Supabase)
- npm / yarn

### Langkah Instalasi

```bash
# 1. Clone repositori
git clone https://github.com/saputt/Seapedia-BE.git
cd Seapedia-BE

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env sesuai konfigurasi Anda

# 4. Generate Prisma client & jalankan migrasi
npx prisma generate
npx prisma migrate dev

# 5. Seed database (admin + demo akun + produk)
npx prisma db seed

# 6. Jalankan development server
npm run start:dev
```

Server akan berjalan di `http://localhost:3000`. Dokumentasi Swagger dapat diakses di `http://localhost:3000/docs`.

### Scripts yang Tersedia

| Script | Kegunaan |
|---|---|
| `npm run start:dev` | Development dengan watch mode |
| `npm run build` | Build ke `dist/` |
| `npm run start:prod` | Jalankan production build |
| `npm run lint` | ESLint fix |
| `npm run test` | Unit test (Jest) |
| `npm run test:e2e` | End-to-end test |
| `npx prisma db seed` | Seed database |
| `npx prisma migrate deploy` | Jalankan migrasi di production |
| `npx prisma studio` | Buka Prisma Studio (GUI database) |

---

## Admin Account Setup

Akun admin **tidak bisa dibuat via registrasi**. Harus di-seed langsung ke database.

### Cara 1: Seed (Otomatis)

Jalankan perintah berikut setelah migrasi selesai:

```bash
npx prisma db seed
```

Seed akan membuat akun admin dengan kredensial:

| Field | Value |
|---|---|
| Email | `admin@seapedia.com` |
| Password | `admin123` |
| Role | ADMIN |

### Cara 2: Manual via Prisma Studio

```bash
npx prisma studio
```

Lalu buat record di tabel `users` dengan field:
- `username`: "Admin Seapedia"
- `email`: "admin@seapedia.com"
- `password`: (hash bcrypt dari "admin123")
- `last_active_role`: "ADMIN"

Kemudian buat record di tabel `user_roles` dengan `role_name`: "ADMIN" dan `user_id` mengacu ke user yang baru dibuat.

### Verifikasi

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@seapedia.com", "password": "admin123"}'
```

Response akan berisi `accessToken` dengan role `ADMIN`.

---

## Demo Accounts / Seed Data

Semua akun di bawah dibuat otomatis saat menjalankan `npx prisma db seed`.

### Daftar Akun Demo

| Role | Email | Password | Deskripsi |
|---|---|---|---|
| **Admin** | `admin@seapedia.com` | `admin123` | Akses penuh ke panel admin, CRUD diskon, monitoring order |
| **Buyer** | `buyer@seapedia.com` | `buyer123` | Belanja, cart, checkout, wallet, lacak pesanan |
| **Seller** | `seller@seapedia.com` | `seller123` | Punya toko "Toko Seapedia" + 50 produk |
| **Driver** | `driver@seapedia.com` | `driver123` | Ambil job pengiriman, antar pesanan |
| **Multi Role** | `multirole@seapedia.com` | `multirole123` | Punya 3 role: BUYER + SELLER + DRIVER |

### Data Tambahan yang di-Seed

| Data | Detail |
|---|---|
| **Produk** | 50 produk (Elektronik, Fashion, Home, Food, Hobby) |
| **Toko** | "Toko Seapedia" (milik seller@seapedia.com) |
| **Diskon** | `HEMAT10` (10%), `DISKON20RB` (Rp20.000), `PROMO50` (50%), `FLAT5RB` (Rp5.000), `WELCOME25` (25%) |

### Catatan untuk Juri

- Wallet semua akun baru bernilai **0**. Perlu top-up sebelum checkout.
- Akun `multirole@seapedia.com` bisa digunakan untuk menguji switch role tanpa login ulang.
- Seller `seller@seapedia.com` sudah memiliki toko dan 50 produk — siap pakai.

---

## Business Rules Documentation

### 1. Role System

Setiap user baru otomatis mendapat 3 role: **BUYER**, **SELLER**, **DRIVER**. Role **ADMIN** hanya bisa di-seed manual.

User bisa **switch role** kapan saja via endpoint `POST /api/auth/switch-role`. Token JWT baru akan diterbitkan dengan role yang dipilih.

| Role | Kemampuan |
|---|---|
| **BUYER** | Cart, checkout, wallet, address, lacak pesanan, konfirmasi delivery |
| **SELLER** | Kelola toko, CRUD produk, proses pesanan masuk |
| **DRIVER** | Lihat job tersedia, ambil job, antar pesanan |
| **ADMIN** | CRUD diskon, monitor semua order, simulasi overdue |

### 2. Cart Rules

- Cart hanya bisa berisi produk dari **1 toko yang sama**.
- Jika user mencoba menambah produk dari toko berbeda, akan error.
- Cart wajib di-clear jika ingin berpindah toko.

### 3. Order Lifecycle

```
PENDING  ──[SELLER]──►  READY_FOR_DELIVERY  ──[DRIVER]──►  ON_DELIVERY  ──[BUYER]──►  DELIVERED
    │                                                                                          
    └──[BUYER cancel]──►  CANCELLED  (refund + restock)                                         
    └──[ADMIN overdue]──►  CANCELLED  (refund + restock)                                         
```

| Status | Dapat Dicancel? | Dapat Di-progress Oleh |
|---|---|---|
| `PENDING` | ✅ Buyer | Seller → `READY_FOR_DELIVERY` |
| `READY_FOR_DELIVERY` | ❌ (kecuali admin overdue) | Driver → `ON_DELIVERY` |
| `ON_DELIVERY` | ❌ (kecuali admin overdue) | Buyer → `DELIVERED` |
| `DELIVERED` | ❌ Terminal | - |
| `CANCELLED` | ❌ Terminal | - |

### 4. Checkout Flow (2 Step)

**Step 1 — Order Summary** (`POST /api/orders/summary`):
- Menghitung subtotal, diskon, ongkir, pajak
- Mengembalikan `orderToken` (JWT, berlaku **5 menit**)

**Step 2 — Checkout** (`POST /api/orders/checkout`):
- Menerima `orderToken` + `addressId`
- Dalam 1 transaksi database: potong wallet, kurangi stok, buat order, bersihkan cart

### 5. Shipping Methods & Pricing

| Method | Biaya | Estimasi |
|---|---|---|
| `REGULAR` | Rp 10.000 | 3 hari |
| `INSTANT` | Rp 15.000 | 1 hari |
| `NEXT_DAY` | Rp 20.000 | Besok |

Perhitungan harga:
```
subtotal = Σ(price × quantity)
taxFee = round(subtotal × 0.12)   // PPN 12%
totalPrice = subtotal - discountValue + shippingFee + taxFee
```

### 6. Payout Distribution

Pembayaran ke seller dan driver terjadi **saat buyer konfirmasi delivery** (`ON_DELIVERY → DELIVERED`):

| Pihak | Nominal | Tipe Transaksi |
|---|---|---|
| **Driver** | `shippingFee` | DRIVER_EARNING |
| **Seller** | `subtotal - discountValue` | SELLER_EARNING |

### 7. Wallet Transaction Types

| Tipe | Kapan | Dampak |
|---|---|---|
| `TOP_UP` | User top up saldo | Balance + |
| `PAYMENT` | Checkout | Balance - |
| `REFUND` | Cancel / overdue | Balance + |
| `SELLER_EARNING` | Buyer konfirmasi delivery | Balance + (seller) |
| `DRIVER_EARNING` | Buyer konfirmasi delivery | Balance + (driver) |

### 8. Overdue System (Admin)

Admin dapat mensimulasikan waktu dan memproses order yang melewati SLA:

| Shipping Method | SLA |
|---|---|
| `INSTANT` | 1 hari |
| `NEXT_DAY` | 2 hari |
| `REGULAR` | 3 hari |

Order yang melewati SLA akan otomatis di-cancel dengan refund ke buyer dan restock.

### 9. Discount Rules

| Atribut | Keterangan |
|---|---|
| `type` | `VOUCHER` atau `PROMO` |
| `isPercent` | Jika `true`: value dalam persen (max 100). Jika `false`: nominal rupiah |
| `maxUses` | Opsional. `null` = unlimited |
| `usedCount` | Bertambah setiap checkout |

### 10. Order Token (JWT)

- Ditandatangani dengan `SECRET_ORDER` (berbeda dari JWT auth)
- Masa berlaku: **5 menit**
- Berisi semua data order (produk, harga, diskon)
- Digunakan untuk memverifikasi integritas data checkout

---

## Security Notes

### Checklist Keamanan

| # | Lapisan | Implementasi | Status |
|---|---|---|---|
| 1 | **SQL Injection** | Prisma ORM — semua query menggunakan parameterized query bawaan Prisma. Tidak ada raw SQL. | ✅ |
| 2 | **XSS (Cross-Site Scripting)** | Library `sanitize-html` untuk membersihkan input teks. Global `ValidationPipe` dengan `whitelist: true` memfilter properti tidak dikenal. | ✅ |
| 3 | **CSRF** | Token JWT stateless — tidak ada cookie session. API menggunakan `Authorization: Bearer` header. CORS terbatas ke origin yang dikenal. | ✅ |
| 4 | **Password Hashing** | bcrypt dengan salt rounds = 10. Password tidak pernah disimpan dalam bentuk plaintext. | ✅ |
| 5 | **JWT Authentication** | Passport JWT Strategy. Secret dari env variable (`SECRET_JWT`). Token expiry: 7 hari. | ✅ |
| 6 | **Token Blacklist** | Token yang di-logout di-blacklist (hash SHA-256 disimpan di DB). Dicek secara global di setiap request. | ✅ |
| 7 | **Rate Limiting** | Global: 100 request/60 detik. Login: 30 request/60 detik. Register: 5 request/60 detik. Checkout: 10 request/60 detik. | ✅ |
| 8 | **Role-Based Access Control** | Setiap endpoint role-specific memiliki guard (`BuyerGuard`, `SellerGuard`, `DriverGuard`, `AdminGuard`). | ✅ |
| 9 | **Input Validation** | `class-validator` DTO + Joi schema validation untuk env variables. `forbidNonWhitelisted` mencegah properti tambahan. | ✅ |
| 10 | **HTTP Security Headers** | `helmet` middleware (mengatur CSP, X-Frame-Options, HSTS, dll). | ✅ |
| 11 | **Request Size Limiting** | Body limit: 5MB (JSON dan URL-encoded). | ✅ |
| 12 | **Order Token Integrity** | Order summary ditandatangani dengan `SECRET_ORDER` (secret terpisah). Expiry 5 menit. Dicek saat checkout. | ✅ |
| 13 | **Ownership Verification** | Helper `checkOwnership()` memverifikasi kepemilikan resource sebelum operasi. User hanya bisa akses data miliknya. | ✅ |
| 14 | **Suspension System** | Driver dapat di-suspend oleh admin. Driver yang di-suspend tidak bisa mengambil job baru. | ✅ |
| 15 | **Database Transaction** | Semua operasi kritis (checkout, cancel, refund, payout) menggunakan `Prisma.$transaction()` — atomic rollback jika gagal. | ✅ |
| 16 | **Error Handling** | `GlobalExceptionFilter` menstandarisasi semua error response. Tidak ada stack trace yang bocor ke client. | ✅ |

### Proteksi Khusus

**SQL Injection:**
Prisma ORM secara otomatis melakukan parameterized query. Tidak ada celah SQL injection karena tidak ada penggunaan `$queryRawUnsafe` atau raw query strings.

**XSS:**
Semua input teks melewati `sanitize-html` sebelum diproses atau disimpan. Tag HTML dihapus/di-escape.

**JWT Security:**
- Secret key disimpan di environment variable (tidak di-hardcode)
- Minimal 16 karakter (divalidasi oleh Joi)
- Token diverifikasi di setiap request (pessimistic — query DB cek user masih ada)

---

## End-to-End Testing Guide

Panduan ini untuk **juri** melakukan uji coba alur lengkap SEAPEDIA.

### Persiapan

1. Pastikan server berjalan (local atau production)
2. Buka Swagger Docs: `http://localhost:3000/docs` (atau production URL)
3. Siapkan tools: **Swagger UI** atau **Postman** atau **curl**

### Alur Uji Coba Lengkap

#### A. Setup Awal — Login sebagai Admin

```bash
POST /api/auth/login
Body: { "email": "admin@seapedia.com", "password": "admin123" }
```

Simpan `accessToken` dari response. Gunakan sebagai `Authorization: Bearer <token>` di semua request berikutnya.

---

#### B. Kelola Diskon (Admin)

**1. Lihat semua diskon:**
```bash
GET /api/discounts/all
```

**2. Buat diskon baru:**
```bash
POST /api/discounts
Body: {
  "code": "TEST10",
  "type": "VOUCHER",
  "value": 10,
  "isPercent": true,
  "maxUses": 10,
  "expiredAt": "2027-12-31T23:59:59.000Z"
}
```

**3. Update diskon:**
```bash
PATCH /api/discounts/{discountId}
Body: { "maxUses": 5 }
```

**4. Hapus diskon:**
```bash
DELETE /api/discounts/{discountId}
```

---

#### C. Registrasi & Login User Baru

**1. Register user baru:**
```bash
POST /api/auth/register
Body: { "username": "Juri Test", "email": "juri@test.com", "password": "password123" }
```

**2. Login:**
```bash
POST /api/auth/login
Body: { "email": "juri@test.com", "password": "password123" }
```

Response akan mengembalikan `accessToken` dan `userRoles: ["BUYER", "SELLER", "DRIVER"]`.

---

#### D. Alur Buyer (Belanja)

**1. Lihat produk (public — tanpa token):**
```bash
GET /api/products
```

**2. Top up wallet:**
```bash
POST /api/wallet/topup
Body: { "amount": 500000 }
```

**3. Tambah produk ke cart:**
Ambil `productId` dari response produk.
```bash
POST /api/cart/{productId}
Body: { "quantity": 2 }
```

**4. Lihat cart:**
```bash
GET /api/cart
```

**5. Tambah alamat pengiriman:**
```bash
POST /api/address
Body: { "label": "Rumah", "completeAddress": "Jl. Test No. 1, Jakarta" }
```

**6. Buat order summary:**
```bash
POST /api/orders/summary
Body: { "discountCode": "HEMAT10", "shippingMethod": "REGULAR" }
```

Simpan `orderToken` dari response.

**7. Checkout:**
```bash
POST /api/orders/checkout
Body: { "orderToken": "<orderToken_dari_summary>", "addressId": "<addressId>" }
```

**8. Lihat daftar pesanan:**
```bash
GET /api/orders
```

**9. Batalkan pesanan (saat masih PENDING):**
```bash
PATCH /api/orders/{orderId}/cancel
```

Ceck wallet — saldo harus kembali (refund).

---

#### E. Alur Seller (Penjualan)

```bash
# Switch role ke SELLER
POST /api/auth/switch-role
Body: { "role": "SELLER" }
```

**1. Lihat toko:**
Simpan token baru dari switch role.
```bash
GET /api/stores/{storeId}
```

**2. Buat produk baru:**
```bash
POST /api/products/{storeId}
Body: { "name": "Produk Test Juri", "description": "Testing", "price": 50000, "stock": 10 }
```

**3. Update produk:**
```bash
PUT /api/products/{productId}
Body: { "price": 45000 }
```

**4. Hapus produk:**
```bash
DELETE /api/products/{productId}
```

**5. Proses pesanan masuk (PENDING → READY_FOR_DELIVERY):**
```bash
PATCH /api/orders/{orderId}/progress
```

---

#### F. Alur Driver (Pengiriman)

```bash
# Switch role ke DRIVER
POST /api/auth/switch-role
Body: { "role": "DRIVER" }
```

**1. Lihat job tersedia:**
```bash
GET /api/orders/available-jobs
```

**2. Ambil job:**
```bash
PATCH /api/orders/{orderId}/take-job
```

---

#### G. Alur Konfirmasi Delivery

```bash
# Switch role ke BUYER
POST /api/auth/switch-role
Body: { "role": "BUYER" }
```

**1. Konfirmasi terima barang (ON_DELIVERY → DELIVERED):**
```bash
PATCH /api/orders/{orderId}/progress
```

Cek wallet seller dan driver — earning harus masuk.

---

#### H. Alur Admin — Simulasi Overdue

```bash
# Switch role ke ADMIN
POST /api/auth/switch-role
Body: { "role": "ADMIN" }
```

**1. Lihat dashboard admin:**
```bash
GET /api/admin/dashboard
```

**2. Simulasi overdue:**
```bash
POST /api/admin/simulation/overdue
Body: { "dayToSkip": 7 }
```

Order yang melewati SLA akan otomatis di-cancel dengan refund.

---

### Skenario Uji Cepat (Happy Path)

Untuk pengujian singkat, ikuti urutan ini:

1. **Login** sebagai `admin@seapedia.com` → ok
2. **Login** sebagai `buyer@seapedia.com`, **top up** Rp500.000
3. **Lihat produk**, **tambah ke cart** (produk dari Toko Seapedia)
4. **Buat alamat**, **order summary**, **checkout**
5. **Switch ke SELLER** (`seller@seapedia.com`) → **proses order** → READY_FOR_DELIVERY
6. **Switch ke DRIVER** (`driver@seapedia.com`) → **ambil job** → ON_DELIVERY
7. **Switch ke BUYER** → **konfirmasi delivery** → DELIVERED
8. Cek wallet seller & driver — earning sudah masuk

---
