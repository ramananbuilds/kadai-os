/**
 * The KadaiDriver contract: every backend capability the apps need,
 * expressed as one interface. Drivers:
 *
 *   - memory   → dev/demo, seeded with the prototype's mock data
 *   - supabase → production (Phase 1–2: Postgres schema + RPCs)
 *
 * Apps never import a driver directly — they call createKadaiApi(driver)
 * from api.ts. This is the seam that makes the backend swappable later
 * (Supabase → self-hosted Postgres → custom NestJS in front of the same
 * schema) without touching a single screen.
 */

import type {
  Bill,
  BillDraft,
  Customer,
  CustomerInput,
  Iso8601,
  LoyaltyEntry,
  MemberRole,
  Product,
  ProductInput,
  Reward,
  Shop,
  ShopMember,
  StockMovement,
  StockReason,
} from '@kadai-os/core'

// ─── Auth & session ──────────────────────────────────────────────

/**
 * A signed-in identity plus its (single, in v1) shop membership.
 * shopId/role are null right after OTP for a first-time user — the app
 * routes them to onboarding until createShopForOwner() fills it in.
 */
export interface Session {
  userId: string
  shopId: string | null
  role: MemberRole | null
  expiresAt: Iso8601
}

// ─── Sync (offline outbox) ───────────────────────────────────────

/**
 * One pending local mutation destined for the backend. The client keeps
 * these in SQLite (mobile) / IndexedDB (web) while offline and drains
 * them in order; `id` is the idempotency key, so replays are safe.
 */
export interface OutboxEntry {
  kind: 'bill'
  id: string
  payload: BillDraft
  createdAt: Iso8601
}

export interface SyncResult {
  accepted: string[]
  rejected: Array<{ id: string; reason: string }>
}

// ─── Read models ─────────────────────────────────────────────────

/** Home dashboard aggregates — served from SQL views in production. */
export interface DailySummary {
  date: string
  revenuePaise: number
  billCount: number
  avgBillPaise: number
  tenderSplit: { cash: number; upi: number; card: number }
  returns: number
}

// ─── The contract ────────────────────────────────────────────────

export interface KadaiDriver {
  // Auth — phone OTP for owners; staff quick-switch PINs are client-side
  // against listMembers after the session exists.
  sendOtp(phone: string): Promise<void>
  verifyOtp(phone: string, token: string): Promise<Session>
  signOut(): Promise<void>
  getSession(): Promise<Session | null>

  // Onboarding (Phase 2)
  createShopForOwner(input: { name: string; upiId: string; gstin?: string | null }): Promise<Shop>
  addStaffMember(phone: string, pin: string): Promise<ShopMember>

  // Shop
  getShop(shopId: string): Promise<Shop>
  updateShop(shopId: string, patch: Partial<Pick<Shop, 'name' | 'upiId' | 'gstin' | 'loyalty'>>): Promise<Shop>
  listMembers(shopId: string): Promise<ShopMember[]>

  // Catalog & stock
  listProducts(shopId: string, filter?: { search?: string; lowStockOnly?: boolean }): Promise<Product[]>
  createProduct(shopId: string, input: ProductInput): Promise<Product>
  updateProduct(
    productId: string,
    patch: Partial<Pick<Product, 'name' | 'sku' | 'barcode' | 'category' | 'pricePaise' | 'costPaise' | 'reorderLevel' | 'isActive'>>,
  ): Promise<Product>
  adjustStock(productId: string, delta: number, reason: StockReason, note?: string): Promise<StockMovement>

  // Customers
  listCustomers(shopId: string, filter?: { search?: string }): Promise<Customer[]>
  createCustomer(shopId: string, input: CustomerInput): Promise<Customer>

  // Billing — the transactional heart. Server-side, this maps to the
  // create_bill() Postgres RPC: bill + items + stock movements + loyalty
  // ledger entries commit atomically or not at all.
  createBill(shopId: string, draft: BillDraft): Promise<Bill>
  listRecentBills(shopId: string, limit?: number): Promise<Bill[]>

  // Loyalty
  listLedger(customerId: string): Promise<LoyaltyEntry[]>
  listRewards(shopId: string): Promise<Reward[]>

  // Aggregates
  dailySummary(shopId: string, date: string): Promise<DailySummary>

  // Offline sync drain
  pushOutbox(entries: OutboxEntry[]): Promise<SyncResult>
}
