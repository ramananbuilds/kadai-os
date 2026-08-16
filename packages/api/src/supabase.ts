/**
 * Supabase driver — still the ONLY file that imports @supabase/supabase-js.
 *
 * Phase 2: everything is wired — phone-OTP auth, shop onboarding, staff
 * invites, catalog/customer CRUD, billing via the create_bill RPC, and
 * daily summaries via the reporting views. Realtime subscriptions land in
 * Phase 5 (sync) and are the next seam here.
 *
 * Row mapping: the database is snake_case (SQL), the app is camelCase
 * (TS). Every mapping lives here so the rest of the codebase never
 * thinks about column names.
 */

import type { PostgrestSingleResponse } from '@supabase/supabase-js'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import {
  billDraftSchema,
  type Bill,
  type BillDraft,
  type Customer,
  type CustomerInput,
  type MemberRole,
  type Product,
  type ProductInput,
  type Shop,
  type ShopMember,
} from '@kadai-os/core'

import type { DailySummary, KadaiDriver, OutboxEntry, Session, SyncResult } from './driver'

export interface SupabaseConfig {
  url: string
  anonKey: string
}

// ─── row → domain mappers (snake_case DB → camelCase app) ────────

interface ShopRow {
  id: string
  name: string
  upi_id: string
  gstin: string | null
  earn_points_per_hundred_rupees: number
  tier_gold_points: number
  tier_platinum_points: number
  created_at: string
}

function mapShop(r: ShopRow): Shop {
  return {
    id: r.id,
    name: r.name,
    upiId: r.upi_id,
    gstin: r.gstin,
    loyalty: {
      earnRule: { pointsPerHundredRupees: r.earn_points_per_hundred_rupees },
      tiers: { gold: r.tier_gold_points, platinum: r.tier_platinum_points },
    },
    createdAt: r.created_at,
  }
}

interface ShopMemberRow {
  id: string
  shop_id: string
  user_id: string
  role: MemberRole
  pin: string | null
  created_at: string
}

function mapShopMember(r: ShopMemberRow): ShopMember {
  return {
    id: r.id,
    shopId: r.shop_id,
    userId: r.user_id,
    role: r.role,
    pin: r.pin,
    createdAt: r.created_at,
  }
}

interface ProductRow {
  id: string
  shop_id: string
  name: string
  sku: string
  barcode: string | null
  category: string
  price_paise: number
  cost_paise: number
  stock_qty: number
  reorder_level: number
  is_active: boolean
  created_at: string
  updated_at: string
}

function mapProduct(r: ProductRow): Product {
  return {
    id: r.id,
    shopId: r.shop_id,
    name: r.name,
    sku: r.sku,
    barcode: r.barcode,
    category: r.category,
    pricePaise: Number(r.price_paise),
    costPaise: Number(r.cost_paise),
    stockQty: r.stock_qty,
    reorderLevel: r.reorder_level,
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

interface CustomerRow {
  id: string
  shop_id: string
  name: string
  phone: string
  points_balance: number
  lifetime_spend_paise: number | string
  visit_count: number
  last_visit_at: string | null
  is_blocked: boolean
  created_at: string
}

function mapCustomer(r: CustomerRow): Customer {
  return {
    id: r.id,
    shopId: r.shop_id,
    name: r.name,
    phone: r.phone,
    pointsBalance: r.points_balance,
    lifetimeSpendPaise: Number(r.lifetime_spend_paise),
    visitCount: r.visit_count,
    lastVisitAt: r.last_visit_at,
    isBlocked: r.is_blocked,
    createdAt: r.created_at,
  }
}

interface BillRow {
  id: string
  shop_id: string
  number: number | string
  customer_id: string | null
  subtotal_paise: number | string
  discount_percent: number
  discount_paise: number | string
  total_paise: number | string
  earned_points: number
  redeemed_points: number
  redeemed_reward_id: string | null
  tender: Bill['tender']
  status: Bill['status']
  created_at: string
}

interface BillItemRow {
  product_id: string
  name_snapshot: string
  sku_snapshot: string
  unit_price_paise: number | string
  qty: number
  line_total_paise: number | string
}

function mapBill(r: BillRow, items: BillItemRow[]): Bill {
  return {
    id: r.id,
    shopId: r.shop_id,
    number: Number(r.number),
    customerId: r.customer_id,
    items: items.map((i) => ({
      productId: i.product_id,
      nameSnapshot: i.name_snapshot,
      skuSnapshot: i.sku_snapshot,
      unitPricePaise: Number(i.unit_price_paise),
      qty: i.qty,
      lineTotalPaise: Number(i.line_total_paise),
    })),
    subtotalPaise: Number(r.subtotal_paise),
    discountPercent: r.discount_percent,
    discountPaise: Number(r.discount_paise),
    totalPaise: Number(r.total_paise),
    earnedPoints: r.earned_points,
    redeemedPoints: r.redeemed_points,
    redeemedRewardId: r.redeemed_reward_id,
    tender: r.tender,
    status: r.status,
    createdAt: r.created_at,
  }
}

interface StockMovementRow {
  id: string
  shop_id: string
  product_id: string
  delta: number
  reason: 'sale' | 'restock' | 'adjustment' | 'return'
  bill_id: string | null
  note: string | null
  created_at: string
}

function mapStockMovement(r: StockMovementRow) {
  return {
    id: r.id,
    shopId: r.shop_id,
    productId: r.product_id,
    delta: r.delta,
    reason: r.reason,
    billId: r.bill_id,
    note: r.note,
    createdAt: r.created_at,
  }
}

// ─── driver ───────────────────────────────────────────────────────

export function createSupabaseDriver(config: SupabaseConfig): KadaiDriver {
  const db: SupabaseClient = createClient(config.url, config.anonKey)

  function unwrap<T>(res: PostgrestSingleResponse<T>): T {
    if (res.error) throw new Error(`KadaiApi/supabase: ${res.error.message}`)
    return res.data as T
  }

  /** Session from the auth store, membership resolved via shop_members. */
  async function currentSession(): Promise<Session | null> {
    const { data } = await db.auth.getSession()
    const authSession = data.session
    const user = authSession?.user
    if (!authSession || !user) return null
    const member = unwrap(
      await db.from('shop_members').select('*').eq('user_id', user.id).limit(1).maybeSingle(),
    ) as ShopMemberRow | null
    return {
      userId: user.id,
      shopId: member?.shop_id ?? null,
      role: member?.role ?? null,
      // Supabase exposes expiry as unix seconds.
      expiresAt: new Date((authSession.expires_at ?? 0) * 1000).toISOString(),
    }
  }

  return {
    async sendOtp(phone) {
      const { error } = await db.auth.signInWithOtp({ phone })
      if (error) throw new Error(`KadaiApi/supabase: ${error.message}`)
    },

    async verifyOtp(phone, token) {
      const { error } = await db.auth.verifyOtp({ phone, token, type: 'sms' })
      if (error) throw new Error(`KadaiApi/supabase: ${error.message}`)
      const session = await currentSession()
      if (!session) throw new Error('KadaiApi/supabase: no session after OTP verification')
      return session
    },

    async signOut() {
      await db.auth.signOut()
    },

    getSession: () => currentSession(),

    async createShopForOwner(input) {
      const row = unwrap(
        await db.rpc('create_shop_for_owner', {
          p_name: input.name,
          p_upi_id: input.upiId,
          p_gstin: input.gstin ?? null,
        }),
      ) as ShopRow
      return mapShop(row)
    },

    async addStaffMember(phone, pin) {
      const row = unwrap(
        await db.rpc('add_staff_member', { p_phone: phone, p_pin: pin }),
      ) as ShopMemberRow
      return mapShopMember(row)
    },

    async getShop(shopId) {
      return mapShop(unwrap(await db.from('shops').select('*').eq('id', shopId).single()) as ShopRow)
    },

    async updateShop(shopId, patch) {
      const row: Record<string, unknown> = {}
      if (patch.name !== undefined) row.name = patch.name
      if (patch.upiId !== undefined) row.upi_id = patch.upiId
      if (patch.gstin !== undefined) row.gstin = patch.gstin
      if (patch.loyalty !== undefined) {
        row.earn_points_per_hundred_rupees = patch.loyalty.earnRule.pointsPerHundredRupees
        row.tier_gold_points = patch.loyalty.tiers.gold
        row.tier_platinum_points = patch.loyalty.tiers.platinum
      }
      return mapShop(
        unwrap(await db.from('shops').update(row).eq('id', shopId).select().single()) as ShopRow,
      )
    },

    async listMembers(shopId) {
      const rows = unwrap(
        await db.from('shop_members').select('*').eq('shop_id', shopId),
      ) as ShopMemberRow[]
      return rows.map(mapShopMember)
    },

    async listProducts(shopId, filter) {
      let query = db.from('products').select('*').eq('shop_id', shopId).eq('is_active', true)
      if (filter?.search) query = query.or(`name.ilike.%${filter.search}%,sku.ilike.%${filter.search}%`)
      const rows = unwrap(await query.order('name')) as ProductRow[]
      const products = rows.map(mapProduct)
      return filter?.lowStockOnly ? products.filter((p) => p.stockQty <= p.reorderLevel) : products
    },

    async createProduct(shopId, input: ProductInput) {
      const row = unwrap(
        await db
          .from('products')
          .insert({
            shop_id: shopId,
            name: input.name,
            sku: input.sku,
            barcode: input.barcode,
            category: input.category,
            price_paise: input.pricePaise,
            cost_paise: input.costPaise,
            stock_qty: input.stockQty,
            reorder_level: input.reorderLevel,
          })
          .select()
          .single(),
      ) as ProductRow
      return mapProduct(row)
    },

    async updateProduct(productId, patch) {
      const row: Record<string, unknown> = {}
      if (patch.name !== undefined) row.name = patch.name
      if (patch.sku !== undefined) row.sku = patch.sku
      if (patch.barcode !== undefined) row.barcode = patch.barcode
      if (patch.category !== undefined) row.category = patch.category
      if (patch.pricePaise !== undefined) row.price_paise = patch.pricePaise
      if (patch.costPaise !== undefined) row.cost_paise = patch.costPaise
      if (patch.reorderLevel !== undefined) row.reorder_level = patch.reorderLevel
      if (patch.isActive !== undefined) row.is_active = patch.isActive
      return mapProduct(
        unwrap(await db.from('products').update(row).eq('id', productId).select().single()) as ProductRow,
      )
    },

    async adjustStock(productId, delta, reason, note) {
      const row = unwrap(
        await db.rpc('adjust_stock', {
          p_product_id: productId,
          p_delta: delta,
          p_reason: reason,
          p_note: note ?? null,
        }),
      ) as StockMovementRow
      return mapStockMovement(row)
    },

    async listCustomers(shopId, filter) {
      let query = db.from('customers').select('*').eq('shop_id', shopId)
      if (filter?.search) query = query.or(`name.ilike.%${filter.search}%,phone.ilike.%${filter.search}%`)
      const rows = unwrap(await query.order('name')) as CustomerRow[]
      return rows.map(mapCustomer)
    },

    async createCustomer(shopId, input: CustomerInput) {
      const row = unwrap(
        await db
          .from('customers')
          .insert({ shop_id: shopId, name: input.name, phone: input.phone })
          .select()
          .single(),
      ) as CustomerRow
      return mapCustomer(row)
    },

    async createBill(_shopId, draftJson) {
      const draft: BillDraft = billDraftSchema.parse(draftJson)
      const row = unwrap(
        await db.rpc('create_bill', {
          p_id: draft.id,
          p_customer_id: draft.customerId,
          p_items: draft.items,
          p_discount_percent: draft.discountPercent,
          p_redeemed_points: draft.redeemedPoints,
          p_redeemed_reward_id: draft.redeemedRewardId,
          p_tender: draft.tender,
          p_created_at: draft.createdAt,
        }),
      ) as BillRow
      const items = unwrap(
        await db.from('bill_items').select('*').eq('bill_id', draft.id),
      ) as BillItemRow[]
      return mapBill(row, items)
    },

    async listRecentBills(shopId, limit = 20) {
      const rows = unwrap(
        await db.from('bills').select('*').eq('shop_id', shopId).order('created_at', { ascending: false }).limit(limit),
      ) as BillRow[]
      const bills: Bill[] = []
      for (const row of rows) {
        const items = unwrap(await db.from('bill_items').select('*').eq('bill_id', row.id)) as BillItemRow[]
        bills.push(mapBill(row, items))
      }
      return bills
    },

    async listLedger(customerId) {
      return unwrap(
        await db.from('loyalty_ledger').select('*').eq('customer_id', customerId).order('created_at'),
      )
    },

    async listRewards(shopId) {
      return unwrap(await db.from('rewards').select('*').eq('shop_id', shopId).eq('is_active', true))
    },

    async createReward(shopId, input) {
      return unwrap(
        await db
          .from('rewards')
          .insert({
            shop_id: shopId,
            name: input.name,
            kind: input.kind,
            value: input.value,
            min_spend_paise: input.minSpendPaise,
            cost_points: input.costPoints,
            expiry_days: input.expiryDays,
          })
          .select()
          .single(),
      )
    },

    async setRewardActive(rewardId, isActive) {
      return unwrap(
        await db.from('rewards').update({ is_active: isActive }).eq('id', rewardId).select().single(),
      )
    },

    async dailySummary(shopId, date): Promise<DailySummary> {
      const rows = unwrap(
        await db.from('daily_sales').select('*').eq('shop_id', shopId).eq('date', date).maybeSingle(),
      ) as
        | {
            bill_count: number
            revenue_paise: number | string
            avg_bill_paise: number | string | null
            cash_paise: number | string | null
            upi_paise: number | string | null
            card_paise: number | string | null
          }
        | null
      return {
        date,
        revenuePaise: Number(rows?.revenue_paise ?? 0),
        billCount: rows?.bill_count ?? 0,
        avgBillPaise: Number(rows?.avg_bill_paise ?? 0),
        tenderSplit: {
          cash: Number(rows?.cash_paise ?? 0),
          upi: Number(rows?.upi_paise ?? 0),
          card: Number(rows?.card_paise ?? 0),
        },
        returns: 0,
      }
    },

    async pushOutbox(entries: OutboxEntry[]): Promise<SyncResult> {
      const accepted: string[] = []
      const rejected: SyncResult['rejected'] = []
      for (const entry of entries) {
        try {
          // The RPC is idempotent on bill id (ADR 0003), so drain order
          // and retries are safe.
          const draft = billDraftSchema.parse({ ...entry.payload, id: entry.id })
          await this.createBill(entry.payload.customerId ?? '', draft)
          accepted.push(entry.id)
        } catch (err) {
          rejected.push({ id: entry.id, reason: err instanceof Error ? err.message : String(err) })
        }
      }
      return { accepted, rejected }
    },
  }
}
