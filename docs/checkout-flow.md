# Checkout Flow

> Detail 2-step checkout: dari hitung harga hingga eksekusi order.
> Waktu baca: 1 menit | Prioritas: Reference

## Step 1: Order Summary

`POST /orders/summary` → `order-checkout.service.ts:74-196`

1. Ambil produk dari **cart** atau **direct buy** (via `items[]` di DTO, bypass cart)
2. Validasi: semua produk dari store yang sama, tidak ada yang hidden
3. Hitung komponen harga:

| Komponen | Perhitungan | Source |
|----------|-------------|--------|
| Subtotal | `sum(price * quantity)` | Lines 107-109 (direct) / 126-128 (cart) |
| Discount | `isPercent ? subtotal * (value/100) : value`, capped at subtotal | Lines 153-162 |
| Shipping fee | Lookup dari `SHIPPING_LIST` | Lines 168-169, `order.types.ts:46-65` |
| PPN 12% | `Math.round(Math.max(0, subtotal - discount) * 0.12)` | Lines 170-171 |
| Total | `Math.max(0, subtotal - discount) + shippingFee + taxFee` | Lines 172-173 |

4. Sign semua data ke **orderToken** JWT (5 menit, `SECRET_ORDER`): `order-checkout.service.ts:54-58`

## Step 2: Checkout

`POST /orders/checkout` → `order-checkout.service.ts:224-335`

1. Cek **in-memory dedup** (Map, TTL 10 menit) — `order-checkout.service.ts:225,333`
2. **Verify orderToken** — `SECRET_ORDER`, cek expiry + user match — `order-checkout.service.ts:230-241`
3. Validate: address milik user, discount masih available, produk tidak hidden — `order-checkout.service.ts:246-267`
4. **Atomic transaction** (`this.prisma.$transaction`):

| Urutan | Operasi | Source |
|--------|---------|--------|
| 1 | Wallet deduction: `updateMany` with `balance >= amount` | Line 270-275 |
| 2 | Stock reduction: `updateMany` with `stock >= quantity` | Line 277-283 |
| 3 | Create Order + snapshot alamat | Line 285-300 |
| 4 | Create OrderItems | Line 302-309 |
| 5 | Increment discount usedCount | Line 311-316 |
| 6 | Create PENDING status log | Line 318-322 |
| 7 | Clear cart (jika bukan direct buy) | Line 324-326 |
| 8 | Mark address as last used | Line 328 |

5. Mark token sebagai processed (in-memory dedup)

## Double-Spend Protection

| Layer | Mekanisme | Keterangan |
|-------|-----------|------------|
| JWT expiry | 5 menit (`expiresIn: '5m'`) | `order-checkout.service.ts:58` |
| In-memory dedup | Map TTL 10 menit | `order-checkout.service.ts:198-218` |
| Key separation | `SECRET_ORDER` ≠ `SECRET_JWT` | `order-checkout.service.ts:55-56,65-66` |

**⚠️ Server restart menghapus in-memory dedup Map.** Token yang sudah dipakai bisa diproses lagi setelah restart (dalam batas 5 menit JWT expiry).

## Direct Buy vs Cart

| Mode | Sumber Produk | Cart Behavior |
|------|--------------|---------------|
| Cart checkout | Cart items (`cartService.getUserCart`) | Cart di-clear setelah order |
| Direct buy | `items[]` di DTO | Cart tidak disentuh |

---

**Related:**
- [Business Rules](./business-rules.md) section 2 (checkout rules)
- [Order Lifecycle](./order-lifecycle.md) (state setelah checkout)
- [ADR](./architecture-decision-record.md) section ADR-1, ADR-3 (alasan arsitektur)

**Back to:** [README](../README.md)
