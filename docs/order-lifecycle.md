# Order Lifecycle

> State machine, transisi, payout, dan cancellation flow.
> Waktu baca: 1 menit | Prioritas: Reference

## State Machine

```
                         ┌──────────────────────────────┐
                         │          PENDING              │ ← Order created
                         └─────────────┬────────────────┘
                                       │
                          (SELLER via progress)
                                       │
                                       ▼
                         ┌──────────────────────────────┐
                         │    READY_FOR_DELIVERY         │ ← Seller confirms
                         └─────────────┬────────────────┘
                                       │
                          (DRIVER via takeJob + progress)
                                       │
                                       ▼
                         ┌──────────────────────────────┐
                         │        ON_DELIVERY            │ ← Driver picks up
                         └──────┬───────────┬───────────┘
                                │           │
               (BUYER via progress)    (DRIVER via deliveryDone)
                                │           │
                                ▼           ▼
                         ┌──────────────────────────────┐
                         │        DELIVERED              │ ✓ Done
                         └──────────────────────────────┘

    PENDING ──(BUYER cancel)──→ CANCELLED (refund + restock)
    PENDING / READY_FOR_DELIVERY ──(overdue cron/admin)──→ CANCELLED
```

## Transition Matrix

| From | To | Who | Condition | Source |
|------|----|-----|-----------|--------|
| PENDING | READY_FOR_DELIVERY | SELLER | store owner, storeId match | `order-status.service.ts:62-68` |
| READY_FOR_DELIVERY | ON_DELIVERY | DRIVER | after takeJob, driverJob exists | `order-status.service.ts:69-77` |
| ON_DELIVERY | DELIVERED | BUYER | via `updateStatusOrder()` | `order-status.service.ts:78-102` |
| ON_DELIVERY | DELIVERED | DRIVER | via `deliveryDone()` | `order-status.service.ts:221-261` |
| PENDING | CANCELLED | BUYER | cancelOrder — refund total + restock | `order-status.service.ts:119-158` |
| PENDING / READY_FOR_DELIVERY | CANCELLED | SYSTEM | overdue cron / admin simulation | `admin.service.ts:149-246` |

## Payout Timing

Payout terjadi saat order mencapai **DELIVERED** (`order-status.service.ts:88-102,233-248`):

| Recipient | Amount | Wallet Type |
|-----------|--------|-------------|
| Driver | `shippingFee` (full) | DRIVER_EARNING |
| Seller | `subtotal` (full, discount NOT subtracted) | SELLER_EARNING |

## Cancellation Flow

- **Buyer cancel**: Hanya PENDING. Refund `totalPrice` ke wallet buyer + restock semua item (`order-status.service.ts:119-158`)
- **Overdue cancel**: PENDING + READY_FOR_DELIVERY yang melebihi SLA. Refund + restock (`admin.service.ts:149-246`)

## Overdue Handling

- **Automated**: Cron `EVERY_30_MINUTES` (`admin-scheduler.service.ts:11`)
- **Manual**: Admin simulation — skip waktu, proses overdue (`admin.service.ts:139-246`)
- **SLA**: REGULAR=3d, INSTANT=1d, NEXT_DAY=2d (`admin.service.ts:17-21`)

---

**Related:**
- [Business Rules](./business-rules.md) section 3-5 (rules detail)
- [Checkout Flow](./checkout-flow.md) (order creation)
- [ADR](./architecture-decision-record.md) section ADR-3, ADR-8

**Back to:** [README](../README.md)
