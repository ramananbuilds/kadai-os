/**
 * The Kadai OS domain model, distilled from the design prototype
 * (apps/web/src/screens). This file is the single vocabulary shared by
 * the mobile app, the web app, and the backend drivers in @kadai-os/api.
 *
 * Invariants that hold everywhere:
 * - Money is integer paise (see money.ts). Points are integers.
 * - All ids are UUIDv4 strings, generatable on the client. Bills created
 *   offline keep their client-generated id; the server treats it as an
 *   idempotency key, which makes the offline outbox safe to replay.
 * - Bills snapshot product name/sku/price at sale time. Renaming or
 *   repricing a product never rewrites history.
 * - The loyalty ledger is append-only. Balances are derived, never stored
 *   as the source of truth on clients.
 */

// ─── Shared scalar types ─────────────────────────────────────────

export type Iso8601 = string

export type ShopId = string
export type UserId = string
export type ProductId = string
export type CustomerId = string
export type BillId = string
export type RewardId = string

// ─── Shop & membership ───────────────────────────────────────────

export type MemberRole = 'owner' | 'staff'

export interface LoyaltyConfig {
  earnRule: { pointsPerHundredRupees: number }
  tiers: { gold: number; platinum: number }
}

export interface Shop {
  id: ShopId
  name: string
  /** Shop's own UPI id, rendered as a static QR at checkout (v1 payments). */
  upiId: string
  gstin: string | null
  loyalty: LoyaltyConfig
  createdAt: Iso8601
}

export interface ShopMember {
  id: string
  shopId: ShopId
  userId: UserId
  role: MemberRole
  /** 4-digit quick-switch PIN for staff devices (owner uses phone OTP). */
  pin: string | null
  createdAt: Iso8601
}

// ─── Catalog & stock ─────────────────────────────────────────────

export interface Product {
  id: ProductId
  shopId: ShopId
  name: string
  sku: string
  /** EAN-13/UPC as printed on the item; null when the shop doesn't barcode it. */
  barcode: string | null
  category: string
  pricePaise: number
  costPaise: number
  stockQty: number
  /** At or below this level the item shows in Low Stock / reorder lists. */
  reorderLevel: number
  isActive: boolean
  createdAt: Iso8601
  updatedAt: Iso8601
}

export type StockReason = 'sale' | 'restock' | 'adjustment' | 'return'

/** Append-only stock journal. Current stock is derived; never edited in place. */
export interface StockMovement {
  id: string
  shopId: ShopId
  productId: ProductId
  /** Signed quantity delta — sales are negative. */
  delta: number
  reason: StockReason
  billId: BillId | null
  note: string | null
  createdAt: Iso8601
}

// ─── Customers & loyalty ─────────────────────────────────────────

export interface Customer {
  id: CustomerId
  shopId: ShopId
  name: string
  /** E.164, e.g. +919876543210 — the loyalty lookup key at the counter. */
  phone: string
  pointsBalance: number
  lifetimeSpendPaise: number
  visitCount: number
  lastVisitAt: Iso8601 | null
  isBlocked: boolean
  createdAt: Iso8601
}

export type LedgerEntryType = 'earn' | 'redeem' | 'expire' | 'adjust'

/** One immutable line of the loyalty ledger. */
export interface LoyaltyEntry {
  id: string
  shopId: ShopId
  customerId: CustomerId
  type: LedgerEntryType
  /** Signed: earn is +, redeem/expire are −. */
  points: number
  billId: BillId | null
  note: string | null
  /** Denormalized for cheap history rendering; still append-only. */
  balanceAfter: number
  createdAt: Iso8601
}

export type RewardKind = 'percent_off' | 'flat_off'

/** Catalog rewards a customer can unlock with points (back-office managed). */
export interface Reward {
  id: RewardId
  shopId: ShopId
  name: string
  kind: RewardKind
  /** Percent (0–100) for percent_off, paise for flat_off. */
  value: number
  minSpendPaise: number | null
  costPoints: number
  /** Days until an unlocked reward expires; null = no expiry. */
  expiryDays: number | null
  isActive: boolean
}

// ─── Bills ───────────────────────────────────────────────────────

export type Tender = 'cash' | 'upi' | 'card'
export type BillStatus = 'completed' | 'void'

export interface BillItem {
  productId: ProductId
  /** Frozen at sale time — catalog edits must not mutate old bills. */
  nameSnapshot: string
  skuSnapshot: string
  unitPricePaise: number
  qty: number
  lineTotalPaise: number
}

export interface Bill {
  id: BillId
  shopId: ShopId
  /** Sequential per shop, assigned by the backend on commit. */
  number: number
  /** Null = walk-in. */
  customerId: CustomerId | null
  items: BillItem[]
  subtotalPaise: number
  discountPercent: number
  discountPaise: number
  totalPaise: number
  earnedPoints: number
  redeemedPoints: number
  redeemedRewardId: RewardId | null
  tender: Tender
  status: BillStatus
  /** Client clock at creation; the backend records its own receivedAt. */
  createdAt: Iso8601
}
