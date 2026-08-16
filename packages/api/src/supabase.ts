/**
 * Supabase driver — still the ONLY file that imports @supabase/supabase-js.
 *
 * Phase 1 status: billing, catalog reads, stock adjustment, and daily
 * summaries are wired to the Postgres RPCs/views in supabase/migrations.
 * Auth (phone OTP), shop onboarding, and realtime subscriptions arrive in
 * Phase 2 and are marked with explicit TODO(phase-2) errors.
 *
 * Row mapping: the database is snake_case (SQL), the app is camelCase
 * (TS). Every mapping lives here so the rest of the codebase never
 * thinks about column names.
 */

import type { PostgrestSingleResponse } from '@supabase/supabase-js'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { billDraftSchema, type Bill, type BillDraft, type Customer, type Product } from '@kadai-os/core'

import type { DailySummary, KadaiDriver, OutboxEntry, Session, SyncResult } from './driver'

export interface SupabaseConfig {
  url: string
  anonKey: string
}

// ─── row → domain mappers (snake_case DB → camelCase app) ────────

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

// ─── driver ───────────────────────────────────────────────────────

const phase2 = (method: string): never => {
  throw new Error(`KadaiApi: supabase driver "${method}" lands in Phase 2 (auth + onboarding wiring).`)
}

export function createSupabaseDriver(config: SupabaseConfig): KadaiDriver {
  const db: SupabaseClient = createClient(config.url, config.anonKey)

  function unwrap<T>(res: PostgrestSingleResponse<T>): T {
    if (res.error) throw new Error(`KadaiApi/supabase: ${res.error.message}`)
    return res.data as T
  }

  return {
    // Auth — Phase 2: Supabase phone OTP (Twilio/MSG91) + session plumbing.
    sendOtp: () => phase2('sendOtp'),
    verifyOtp: () => phase2('verifyOtp'),
    signOut: () => phase2('signOut'),
    getSession: () => phase2('getSession'),

    async getShop(shopId) {
      return unwrap(await db.from('shops').select('*').eq('id', shopId).single())
    },

    async updateShop(shopId, patch) {
      // camelCase patch → snake_case columns for the fields we allow.
      const row: Record<string, unknown> = {}
      if (patch.name !== undefined) row.name = patch.name
      if (patch.upiId !== undefined) row.upi_id = patch.upiId
      if (patch.gstin !== undefined) row.gstin = patch.gstin
      return unwrap(await db.from('shops').update(row).eq('id', shopId).select().single())
    },

    listMembers: () => phase2('listMembers'),

    async listProducts(shopId, filter) {
      let query = db.from('products').select('*').eq('shop_id', shopId).eq('is_active', true)
      if (filter?.search) query = query.or(`name.ilike.%${filter.search}%,sku.ilike.%${filter.search}%`)
      const rows = unwrap(await query.order('name')) as ProductRow[]
      const products = rows.map(mapProduct)
      return filter?.lowStockOnly
        ? products.filter((p) => p.stockQty <= p.reorderLevel)
        : products
    },

    createProduct: () => phase2('createProduct'),
    updateProduct: () => phase2('updateProduct'),

    async adjustStock(productId, delta, reason, note) {
      return unwrap(
        await db.rpc('adjust_stock', {
          p_product_id: productId,
          p_delta: delta,
          p_reason: reason,
          p_note: note ?? null,
        }),
      )
    },

    async listCustomers(shopId, filter) {
      let query = db.from('customers').select('*').eq('shop_id', shopId)
      if (filter?.search) query = query.or(`name.ilike.%${filter.search}%,phone.ilike.%${filter.search}%`)
      const rows = unwrap(await query.order('name')) as CustomerRow[]
      return rows.map(mapCustomer)
    },

    createCustomer: () => phase2('createCustomer'),

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
      // Hydrate items for each bill in one round trip per bill; recent-bills
      // lists are short. Batched IN-query when lists grow.
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
