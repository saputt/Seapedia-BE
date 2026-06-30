# Architecture Decision Record

> Alasan di balik setiap keputusan arsitektur. Hanya menjelaskan "why", bukan "what" atau "how".
> Waktu baca: 5 menit (skim ⭐) | Prioritas: Should Read

---

## ⭐ Must Read

### ADR-1: 2-step checkout dengan order token

**Konteks**: Checkout melibatkan wallet deduction, stock reduction, dan order creation. Jika harga berubah antara hitung dan eksekusi, atau token dipakai dua kali, terjadi inkonsistensi finansial.

**Keputusan**: 2-step: `POST /orders/summary` (hitung + sign token JWT 5m dengan `SECRET_ORDER`) → `POST /orders/checkout` (verifikasi + atomic transaction + in-memory dedup 10m). Token signature memastikan data tidak diubah client. Dedup mencegah double-spend.

**Konsekuensi**: (+) Aman dari double-spend dan price tampering. (-) In-memory dedup hilang saat restart. Token 5m bisa merepotkan user lambat.

**Evidence**: `order-checkout.service.ts:54-58` (`expiresIn: '5m'`, `SECRET_ORDER`), `order-checkout.service.ts:198-218` (Map + 10m TTL), `order-checkout.service.ts:269-335` (atomic `$transaction`).

---

### ADR-2: Multi-role architecture

**Konteks**: Satu user bisa berperan sebagai buyer, seller, dan driver. Perlu mekanisme yang jelas untuk assignment, switching, dan authorization.

**Keputusan**: Saat register hanya BUYER yang auto-assign (`auth.repository.ts:21-23`). SELLER ditambahkan saat user membuat store (`store.service.ts:64`). DRIVER ditambahkan via endpoint terpisah. JWT encode `lastActiveRole` dari DB (`jwt.strategy.ts:23,33`). ADMIN tidak bisa switch role (`auth.service.ts:101-103`).

**Konsekuensi**: (+) Fleksibel — user bisa semua peran tanpa registrasi ulang. JWT role valid per request (DB lookup). (-) Kompleksitas routing; perlu guard untuk setiap endpoint.

**Evidence**: `auth.repository.ts:21-23` (hanya BUYER), `store.service.ts:64` (SELLER via store), `auth.service.ts:101-103` (ADMIN no switch).

---

### ADR-3: Atomic transaction pattern

**Konteks**: Checkout perlu mengurangi wallet, mengurangi stock, membuat order, dan clear cart sebagai satu unit. Jika salah satu gagal di tengah, data tidak konsisten.

**Keputusan**: Semua operasi dalam satu `this.prisma.$transaction` (`order-checkout.service.ts:269-335`). Wallet deduction menggunakan `updateMany` dengan `balance >= amount` condition — atomic check-and-decrement tanpa read-then-write race condition (`wallet.repository.ts:46-60`).

**Konsekuensi**: (+) No race condition pada stock/balance. (+) Semua atau tidak sama sekali. (-) Transaksi panjang bisa meningkatkan contention.

**Evidence**: `order-checkout.service.ts:269` (`$transaction`), `wallet.repository.ts:46-60` (`reduceBalanceAtomically`).

---

### ADR-4: Single-store cart rule

**Konteks**: Cart berisi produk dari multiple store. Shipping dan payment jadi kompleks karena setiap store punya alamat, ongkir, dan payout sendiri.

**Keputusan**: Semua item cart harus dari store yang sama. Jika user menambahkan item dari store berbeda, error `DIFFERENT_STORE_IN_CART` dikembalikan dengan `currentStoreId` dan `newStoreId`. Parameter `force: true` mengosongkan cart sebelum menambahkan item baru.

**Konsekuensi**: (+) Sederhana — satu order = satu store. (+) Shipping logic straightforward. (-) User harus checkout per store.

**Evidence**: `cart.service.ts:38-49` (`DIFFERENT_STORE_IN_CART`), `cart.service.ts:28-30` (force flag).

---

### ADR-5: Address snapshot pattern

**Konteks**: User bisa mengubah alamat kapan saja. Jika order mereferensi alamat yang bisa berubah, data order historis tidak akurat.

**Keputusan**: Alamat di-copy ke order record saat checkout: `addressSnapshot: address.completeAddress` dan `storeAddress: store.address` (`order-checkout.service.ts:288-290`). Order memiliki snapshot sendiri, independen dari perubahan alamat user.

**Konsekuensi**: (+) Order immutable — alamat tidak berubah walau user edit. (+) Tidak perlu join query untuk alamat di order detail. (-) Duplikasi data.

**Evidence**: `order-checkout.service.ts:288-290`, `schema.prisma:224-226` (`addressSnapshot` required, `storeAddress` optional).

---

## 📌 Should Read

### ADR-6: Zustand + TanStack Query untuk state management

**Konteks**: Perlu membagi state yang di-fetch dari server vs state client-side.

**Keputusan**: TanStack Query v5 untuk semua server state (staleTime: 5m, retry: 1). Zustand v5 hanya untuk auth (token, user, roles, activeRole — persist ke localStorage) dan cart badge visibility. Tidak ada Redux.

**Konsekuensi**: (+) Query cache handling (retry, caching, polling, optimistic update) gratis. (+) Minimal boilerplate untuk client state. (-) Auth state dan server state di dua tempat berbeda.

**Evidence**: `shared/lib/queryClient.ts:3-10` (TanStack Query config), `features/auth/store/authStore.ts` (Zustand auth), `features/cart/store/cartStore.ts` (Zustand cart).

---

### ADR-7: Separate JWT secrets (SECRET_JWT vs SECRET_ORDER)

**Konteks**: Order token dan auth token sama-sama JWT. Jika satu secret dipakai untuk keduanya, auth token bisa memalsukan order data.

**Keputusan**: Dua secret berbeda — `SECRET_JWT` untuk auth, `SECRET_ORDER` untuk order token. Keduanya di-validasi oleh Joi (`validation.ts:5-6`, min 16 chars).

**Konsekuensi**: (+) Auth token tidak bisa memalsukan order data. (-) Dua secret perlu dikelola.

**Evidence**: `validation.ts:5` (`SECRET_JWT`), `validation.ts:6` (`SECRET_ORDER`), `order-checkout.service.ts:55-56,65-66` (keduanya dipakai).

---

### ADR-8: Dual path to DELIVERED status

**Konteks**: Order perlu mencapai DELIVERED setelah driver selesai antar, tapi buyer juga perlu bisa konfirmasi.

**Keputusan**: Dua endpoint terpisah: buyer via `PATCH /orders/:orderId/progress` (`order-status.service.ts:78-102`) dan driver via `PATCH /orders/:orderId/delivery-done` (`order-status.service.ts:221-261`). Keduanya memicu payout yang identik.

**Konsekuensi**: (+) Buyer bisa konfirmasi. (+) Driver bisa tandai selesai tanpa menunggu buyer. (-) Potensi confusion siapa yang trigger.

**Evidence**: `order-status.service.ts:78-102` (buyer path), `order-status.service.ts:221-261` (driver path).

---

### ADR-9: In-memory simulation untuk overdue

**Konteks**: Admin perlu mensimulasikan waktu untuk testing overdue behavior tanpa benar-benar menunggu.

**Keputusan**: Class field `simulatedTimeOffsetMs` di `AdminService` (`admin.service.ts:27`). `getSimulatedDate()` mengembalikan `Date.now() + offset`. Tidak persist ke database. SLA dihitung menggunakan constant `SLA_DAYS` (`admin.service.ts:17-21`).

**Konsekuensi**: (+) Ringan, tanpa DB overhead. (-) Hilang saat server restart. (-) Tidak akurat untuk timing-sensitive testing.

**Evidence**: `admin.service.ts:17-21` (SLA), `admin.service.ts:27` (offset field), `admin.service.ts:37-38` (getSimulatedDate).

---

### ADR-10: Repository pattern (partial)

**Konteks**: Perlu abstraction untuk database queries, terutama untuk transaction propagation.

**Keputusan**: Base class `BaseRepository` (`base.repository.ts:12-24`) dengan method `getPrismaClient(tx)`. Hanya Cart, Store, Order, Wallet yang extend BaseRepository. Repository lain langsung menggunakan `this.prisma`.

**Konsekuensi**: (+) Transaction handling rapi untuk yang pakai. (-) Tidak konsisten — 5 dari 9 repository tidak extend BaseRepository.

**Evidence**: `base.repository.ts:12-24`, `cart.repository.ts`, `store.repository.ts`, `order.repository.ts`, `wallet.repository.ts` (extend). Auth, Product, User, Admin, Address, Discount, Review (tidak extend).

---

## 📎 Additional Decisions

### ADR-11: Docker db push vs migrate

`Dockerfile:40`: `npx prisma db push && node dist/src/main.js`. Memakai `db push` (schema sync) bukan `migrate deploy`. Tradeoff: (+) Selalu sync dengan schema terbaru. (-) Migration history tidak terkelola di production.

### ADR-12: Testing approach

- **Backend**: Jest + supertest. Unit test per service, e2e test di `test/`. Coverage: services + controllers.
- **Frontend**: Vitest + React Testing Library. Unit test untuk shared UI components (`Button.test.tsx`, `Spinner.test.tsx`).
- **Gap**: Tidak ada integration test end-to-end antara FE dan BE. Coverage terbatas pada unit + API e2e.

### ADR-13: Global guards + response format

- Global `ThrottlerGuard`: 100 req/min (`app.module.ts:32-37`). Override per endpoint: checkout (10/min), password (5/min), review (5/min), upload (10/min).
- Global `TokenBlacklistGuard`: SHA-256 hash token, cek DB + in-memory cache 30s TTL (`app.module.ts:56`, `token-blacklist.service.ts`).
- `TransformInterceptor`: Semua response `{ success, statusCode, message, data }` (`main.ts:49`).
- `GlobalExceptionFilter`: Generic "Terjadi kesalahan pada sistem internal" untuk non-HTTP errors (`main.ts:51`).
- `ValidationPipe`: whitelist=true, forbidNonWhitelisted=true, transform=true (`main.ts:34-47`).

### ADR-14: Native fetch vs HTTP library

Frontend menggunakan native `fetch` (`api/client.ts:36`), bukan Axios/ky. Tradeoff: (+) Zero dependency. (-) Tidak ada interceptor bawaan, perlu manual wrappers untuk error handling dan token injection.

---

**Related:**
- [Business Rules](./business-rules.md) — implementasi konkret aturan
- [Role System Overview](./role-system-overview.md) — detail multi-role
- [Checkout Flow](./checkout-flow.md) — detail 2-step
- [Order Lifecycle](./order-lifecycle.md) — state machine

**Back to:** [README](../README.md)
