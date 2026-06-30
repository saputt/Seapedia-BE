# Role System Overview

> Multi-role architecture: bagaimana role di-assign, di-switch, dan di-enforce.
> Waktu baca: 1 menit | Prioritas: Reference

## Role Definition

Empat role (`schema.prisma:17-22`):

| Role | Akses Utama | Ditambahkan Saat |
|------|------------|-----------------|
| BUYER | Beli produk, cart, checkout, review | Register (`auth.repository.ts:21-23`) |
| SELLER | Kelola store, produk, proses order | Buat store (`store.service.ts:64`) |
| DRIVER | Ambil job pengiriman, deliver | Via `POST /auth/roles` |
| ADMIN | Dashboard, manage users/stores/products, simulasi | Seed only |

## Role Assignment

- Saat register: hanya **BUYER** yang auto-assign (`auth.repository.ts:21-23`).
- SELLER ditambahkan saat user membuat store via `store.service.ts:64`.
- DRIVER ditambahkan via `POST /auth/roles` (`auth.controller.ts:52-60`).
- Duplicate assignment dicegah oleh unique constraint `@@unique([userId, roleName])` (`schema.prisma:80`).

## Role Switching

1. User login → JWT berisi `lastActiveRole` dari DB (`auth.service.ts:71`)
2. `POST /auth/switch-role` → update `lastActiveRole` di DB + return JWT baru (`auth.service.ts:98-130`)
3. ADMIN **tidak bisa** switch role — `UnauthorizedException` (`auth.service.ts:101-103`)
4. Setiap request, JWT strategy query DB untuk konfirmasi user masih exist dan ambil `lastActiveRole` terkini (`jwt.strategy.ts:20-35`)

## Per-Role Profile Images

Tiga field terpisah di model User (`schema.prisma:49-51`):

| Field | Digunakan Untuk |
|-------|----------------|
| `buyerImageUrl` | Profile saat role BUYER |
| `sellerImageUrl` | Profile saat role SELLER |
| `driverImageUrl` | Profile saat role DRIVER |

Dipilih dinamis berdasarkan `activeRole` di `user.service.ts:37-43`.

## Token Blacklist

Saat logout, JWT di-blacklist via SHA-256 hash, disimpan di `token_blacklist` table (`token-blacklist.service.ts:13-23`). Global `TokenBlacklistGuard` (`app.module.ts:56`) cek setiap request. In-memory cache dengan 30s TTL (`token-blacklist.service.ts:7-9`). **Catatan**: `cleanupExpired()` (`token-blacklist.service.ts:45-52`) ada tapi tidak dipanggil otomatis — expired entries tetap di DB.

---

**Related:**
- [ADR](./architecture-decision-record.md) section ADR-2 (alasan multi-role)
- [Business Rules](./business-rules.md) section 3 (auth rules)

**Back to:** [README](../README.md)
