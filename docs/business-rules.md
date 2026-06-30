# Business Rules

> Ringkasan aturan bisnis yang tidak bisa dipahami langsung dari source code.
> Waktu baca: 5 menit | Prioritas: Must Read

## 1. Cart Rules

| Aturan | Detail | Source |
|--------|--------|--------|
| Single-store | Semua item cart harus dari store yang sama | `cart.service.ts:38-49` |
| Force flag | `force: true` clear cart sebelum tambah item baru | `cart.service.ts:28-30` |
| Stock limit | `quantity ≤ product.stock` | `cart.service.ts:56-57,80-81` |
| No hidden check | Produk hidden tetap bisa masuk cart. Error muncul di checkout. | `cart.service.ts:26` (no check) |

## 2. Checkout Rules

| Aturan | Detail | Source |
|--------|--------|--------|
| 2-step | Step 1: `POST /orders/summary` (hitung + sign token). Step 2: `POST /orders/checkout` (verifikasi + eksekusi) | `order-checkout.service.ts:74-335` |
| Order token | JWT signed dengan `SECRET_ORDER`, berlaku 5 menit | `order-checkout.service.ts:54-58` |
| Double-spend | In-memory dedup `Map` dengan TTL 10 menit. **Hilang saat server restart.** | `order-checkout.service.ts:198-218` |
| Direct buy | Bypass cart via `items[]` di `OrderSummaryDto` | `order-checkout.service.ts:80-118` |

## 3. Order Status Rules

```
PENDING → READY_FOR_DELIVERY → ON_DELIVERY → DELIVERED
  │                                              │
  └── CANCELLED (buyer cancel, PENDING only)     │
  └── CANCELLED (overdue, PENDING + READY_FOR_DELIVERY)
```

| Transition | Who | Condition | Source |
|-----------|-----|-----------|--------|
| PENDING → READY_FOR_DELIVERY | SELLER | store owner, storeId match | `order-status.service.ts:62-68` |
| READY_FOR_DELIVERY → ON_DELIVERY | DRIVER | after takeJob, driverJob exists | `order-status.service.ts:69-77` |
| ON_DELIVERY → DELIVERED | BUYER | via progress endpoint | `order-status.service.ts:78-102` |
| ON_DELIVERY → DELIVERED | DRIVER | via `deliveryDone()` endpoint | `order-status.service.ts:221-261` |
| PENDING → CANCELLED | BUYER | refund total + restock | `order-status.service.ts:119-158` |

## 4. Payout Rules

| Event | Recipient | Amount | Type | Source |
|-------|-----------|--------|------|--------|
| DELIVERED | Driver | `shippingFee` (full) | DRIVER_EARNING | `order-status.service.ts:88-94,233-238` |
| DELIVERED | Seller | `subtotal` (full, discount NOT subtracted) | SELLER_EARNING | `order-status.service.ts:96-101,242-247` |
| CANCELLED | Buyer | `totalPrice` (full refund) | REFUND | `order-status.service.ts:136-141` |

**Catatan**: Discount tidak membebani seller — seller tetap mendapat subtotal penuh. Discount sepenuhnya absorbed oleh sistem.

## 5. Overdue Rules

| Shipping Method | SLA (hari) | Source |
|----------------|-----------|--------|
| REGULAR | 3 hari | `admin.service.ts:17-21` |
| INSTANT | 1 hari | `admin.service.ts:17-21` |
| NEXT_DAY | 2 hari | `admin.service.ts:17-21` |

- **Otomatis**: Cron `EVERY_30_MINUTES` via `@nestjs/schedule` (`admin-scheduler.service.ts:11`)
- **Manual**: Admin simulation — skip waktu 1-365 hari, proses overdue (`admin.service.ts:139-246`)
- **Scope**: PENDING + READY_FOR_DELIVERY order yang melebihi SLA
- **Simulasi in-memory**: `simulatedTimeOffsetMs` — hilang saat server restart (`admin.service.ts:27`)

## 6. Wallet Rules

| Transaction Type | Direction | Source |
|-----------------|-----------|--------|
| TOP_UP | + | `schema.prisma:277-283` |
| PAYMENT | - | Atomic: `updateMany` with `balance >= amount` |
| REFUND | + | Full `totalPrice` on cancel |
| SELLER_EARNING | + | `subtotal` on DELIVERED |
| DRIVER_EARNING | + | `shippingFee` on DELIVERED |

Atomic deduction: `wallet.repository.ts:46-60` — `updateMany` dengan `where: { balance: { gte: amount } }`.

## 7. Discount Rules

| Aturan | Detail | Source |
|--------|--------|--------|
| Types | VOUCHER dan PROMO — diperlakukan identik | `discount.service.ts:38-53` |
| isPercent | `true`: `subtotal * (value / 100)`. `false`: `value` (nominal). | `order-checkout.service.ts:153-161` |
| maxUses | `null` = unlimited. Checked at summary + checkout. | `discount.service.ts:50-51` |
| Expired | `expiredAt < now` → not available | `discount.service.ts:48-49` |

## 8. Review Rules

| Type | Condition | Unique Constraint | Auth | Source |
|------|-----------|-------------------|------|--------|
| Product review | Order must be DELIVERED | `@@unique([orderId, productId])` | BUYER | `product-review.service.ts:37-38,46-53`, `schema.prisma:152` |
| Driver review | Order must be DELIVERED | `@@unique([orderId])` | BUYER | `driver-review.service.ts:29-38`, `schema.prisma:334` |
| App review | No restriction | None | Public (no auth) | `review.controller.ts` (no JwtAuthGuard) |

## 9. Shipping Rules

| Method | Price | SLA | Source |
|--------|-------|-----|--------|
| REGULAR | Rp 10.000 | 3 hari | `order.types.ts:46-65` |
| INSTANT | Rp 15.000 | 1 hari | `order.types.ts:46-65` |
| NEXT_DAY | Rp 20.000 | Next day | `order.types.ts:46-65` |

## 10. PPN

PPN 12%: `Math.round(Math.max(0, subtotal - discountValue) * 0.12)` (`order-checkout.service.ts:170-171`).

## 11. Known Gaps

| Gap | Detail | Impact |
|-----|--------|--------|
| Inactive store not checked | `store.isActive` tidak diperiksa di checkout, cart, product listing | Store non-aktif masih bisa transaksi |
| Suspended driver | Hanya diperiksa di `takeJob()` (`order-status.service.ts:183-192`). Tidak di `deliveryDone()` | Driver suspended bisa selesaikan delivery yang sudah diambil |
| Hidden product in cart | Tidak dicek saat add-to-cart | Buyer baru tahu produk hidden saat checkout |
| Server restart risk | In-memory token dedup + simulation hilang | Order token bekas bisa dipakai lagi, simulation reset |

---

**Related:**
- [Order Lifecycle](./order-lifecycle.md) — state machine & payout
- [Checkout Flow](./checkout-flow.md) — detail 2-step checkout
- [ADR](./architecture-decision-record.md) — alasan di balik aturan

**Back to:** [README](../README.md)
