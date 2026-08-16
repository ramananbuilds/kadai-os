/**
 * In-memory KadaiDriver — the dev/demo backend. Seeded with the Figma
 * prototype's mock catalog and customers so screens have realistic data
 * before the real backend exists. Also serves as the executable spec for
 * the Supabase create_bill() RPC: whatever transaction happens here must
 * happen there, atomically.
 */

import {
  DEFAULT_EARN_RULE,
  DEFAULT_TIERS,
  billTotalPaise,
  computeEarnedPoints,
  discountPaise,
  lineTotalPaise,
  subtotalPaise,
  type Bill,
  type BillDraft,
  type Customer,
  type CustomerInput,
  type LoyaltyEntry,
  type Product,
  type ProductInput,
  type Reward,
  type Shop,
  type ShopMember,
  type StockMovement,
  type StockReason,
} from '@kadai-os/core'

import type {
  DailySummary,
  KadaiDriver,
  OutboxEntry,
  Session,
  SyncResult,
} from './driver'

const SHOP_ID = '00000000-0000-4000-8000-000000000001'
const OWNER_USER_ID = '00000000-0000-4000-8000-0000000000a1'

const now = () => new Date().toISOString()

/** Session with membership resolved from the members list (SQL: shop_members). */
function resolveSession(state: MemoryState, userId: string): Session {
  const member = state.members.find((m) => m.userId === userId)
  return {
    userId,
    shopId: member?.shopId ?? null,
    role: member?.role ?? null,
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
  }
}

interface MemoryState {
  shop: Shop
  members: ShopMember[]
  products: Map<string, Product>
  customers: Map<string, Customer>
  bills: Map<string, Bill>
  ledger: LoyaltyEntry[]
  stockMovements: StockMovement[]
  rewards: Reward[]
  nextBillNumber: number
  session: Session | null
  otps: Map<string, string>
}

function seedState(): MemoryState {
  const t0 = '2026-01-01T00:00:00.000Z'

  const product = (
    id: string,
    name: string,
    sku: string,
    category: string,
    pricePaise: number,
    costPaise: number,
    stockQty: number,
    reorderLevel: number,
    barcode: string | null = null,
  ): Product => ({
    id,
    shopId: SHOP_ID,
    name,
    sku,
    barcode,
    category,
    pricePaise,
    costPaise,
    stockQty,
    reorderLevel,
    isActive: true,
    createdAt: t0,
    updatedAt: t0,
  })

  const customer = (
    id: string,
    name: string,
    phone: string,
    pointsBalance: number,
    lifetimeSpendPaise: number,
    visitCount: number,
  ): Customer => ({
    id,
    shopId: SHOP_ID,
    name,
    phone,
    pointsBalance,
    lifetimeSpendPaise,
    visitCount,
    lastVisitAt: now(),
    isBlocked: false,
    createdAt: t0,
  })

  return {
    shop: {
      id: SHOP_ID,
      name: "Ravi's Boutique",
      upiId: 'ravi@okhdfcbank',
      gstin: null,
      loyalty: { earnRule: DEFAULT_EARN_RULE, tiers: DEFAULT_TIERS },
      createdAt: t0,
    },
    products: new Map(
      [
        product('00000000-0000-4000-8000-000000000101', 'Blue Denim Jacket', 'BDJ-001', 'Jackets', 249900, 140000, 8, 5, '8901234500011'),
        product('00000000-0000-4000-8000-000000000102', 'White Linen Shirt', 'WLS-001', 'Shirts', 89900, 42000, 2, 10, '8901234500028'),
        product('00000000-0000-4000-8000-000000000103', 'Nike Air Max 270', 'NAM-270', 'Footwear', 899900, 580000, 5, 3, '8901234500035'),
        product('00000000-0000-4000-8000-000000000104', 'Floral Summer Dress', 'FSD-022', 'Dresses', 185000, 90000, 11, 8),
        product('00000000-0000-4000-8000-000000000105', 'Black Slim Joggers', 'BSJ-044', 'Bottoms', 129900, 62000, 1, 10),
        product('00000000-0000-4000-8000-000000000106', 'Canvas Tote Bag', 'CTB-012', 'Accessories', 59900, 22000, 3, 15),
        product('00000000-0000-4000-8000-000000000107', 'Oversized Hoodie', 'OVH-009', 'Tops', 199900, 98000, 14, 5),
        product('00000000-0000-4000-8000-000000000108', 'Leather Belt Brown', 'LBB-003', 'Accessories', 54900, 20000, 7, 8),
      ].map((p) => [p.id, p]),
    ),
    customers: new Map(
      [
        customer('00000000-0000-4000-8000-000000000201', 'Priya Sharma', '+919876543210', 4_820, 14_280_000, 34),
        customer('00000000-0000-4000-8000-000000000202', 'Rohan Verma', '+918765432109', 2_140, 6_840_000, 18),
        customer('00000000-0000-4000-8000-000000000203', 'Aisha Khan', '+917654321098', 890, 2_460_000, 8),
      ].map((c) => [c.id, c]),
    ),
    bills: new Map(),
    ledger: [],
    stockMovements: [],
    rewards: [
      {
        id: '00000000-0000-4000-8000-000000000301',
        shopId: SHOP_ID,
        name: '₹500 Off Next Purchase',
        kind: 'flat_off',
        value: 50_000,
        minSpendPaise: 150_000,
        costPoints: 500,
        expiryDays: 30,
        isActive: true,
      },
      {
        id: '00000000-0000-4000-8000-000000000302',
        shopId: SHOP_ID,
        name: '10% Off Footwear',
        kind: 'percent_off',
        value: 10,
        minSpendPaise: null,
        costPoints: 200,
        expiryDays: 60,
        isActive: true,
      },
    ],
    nextBillNumber: 1_088,
    members: [
      {
        id: '00000000-0000-4000-8000-0000000000b1',
        shopId: SHOP_ID,
        userId: OWNER_USER_ID,
        role: 'owner',
        pin: null,
        createdAt: t0,
      },
    ],
    session: null,
    otps: new Map(),
  }
}

export interface MemoryDriverOptions {
  /** Fixed OTP for dev: verifyOtp accepts this token for any phone. */
  devOtp?: string
}

export function createMemoryDriver(options: MemoryDriverOptions = {}): KadaiDriver {
  const state = seedState()
  const devOtp = options.devOtp ?? '123456'

  /** The transactional core — mirrors what create_bill() must do in SQL. */
  function commitBill(draft: BillDraft): Bill {
    const existing = state.bills.get(draft.id)
    if (existing) return existing // idempotent replay from the outbox

    // 1. Resolve items against server-side prices (never trust client prices).
    const items = draft.items.map((line) => {
      const product = state.products.get(line.productId)
      if (!product || !product.isActive) {
        throw new Error(`Product ${line.productId} not found or inactive`)
      }
      if (product.stockQty < line.qty) {
        throw new Error(`Insufficient stock for ${product.name}: have ${product.stockQty}, need ${line.qty}`)
      }
      return {
        productId: product.id,
        nameSnapshot: product.name,
        skuSnapshot: product.sku,
        unitPricePaise: product.pricePaise,
        qty: line.qty,
        lineTotalPaise: lineTotalPaise(product.pricePaise, line.qty),
      }
    })

    // 2. Money math via @kadai-os/core only.
    const subtotal = subtotalPaise(items)
    const discount = discountPaise(subtotal, draft.discountPercent)
    const flatRewardPaise = (() => {
      if (!draft.redeemedRewardId) return 0
      const reward = state.rewards.find((r) => r.id === draft.redeemedRewardId)
      if (!reward || !reward.isActive) throw new Error('Reward not found or inactive')
      return reward.kind === 'flat_off' ? reward.value : 0
    })()
    const total = billTotalPaise(subtotal, draft.discountPercent, flatRewardPaise)

    // 3. Loyalty: redemption must be covered by the balance.
    const customer = draft.customerId ? state.customers.get(draft.customerId) : undefined
    if (draft.customerId && !customer) throw new Error('Customer not found')
    if (draft.redeemedPoints > 0) {
      if (!customer) throw new Error('Cannot redeem points on a walk-in bill')
      if (draft.redeemedPoints > customer.pointsBalance) {
        throw new Error(`Insufficient points: balance ${customer.pointsBalance}, tried to redeem ${draft.redeemedPoints}`)
      }
    }

    const earnedPoints = customer ? computeEarnedPoints(total, state.shop.loyalty.earnRule) : 0
    const bill: Bill = {
      id: draft.id,
      shopId: SHOP_ID,
      number: state.nextBillNumber++,
      customerId: draft.customerId ?? null,
      items,
      subtotalPaise: subtotal,
      discountPercent: draft.discountPercent,
      discountPaise: discount,
      totalPaise: total,
      earnedPoints,
      redeemedPoints: draft.redeemedPoints,
      redeemedRewardId: draft.redeemedRewardId ?? null,
      tender: draft.tender,
      status: 'completed',
      createdAt: draft.createdAt,
    }

    // 4. Commit: stock journal + movements.
    for (const item of items) {
      const product = state.products.get(item.productId)!
      product.stockQty -= item.qty
      product.updatedAt = now()
      state.stockMovements.push({
        id: crypto.randomUUID(),
        shopId: SHOP_ID,
        productId: item.productId,
        delta: -item.qty,
        reason: 'sale',
        billId: bill.id,
        note: null,
        createdAt: now(),
      })
    }

    // 5. Commit: loyalty ledger + customer aggregates.
    if (customer) {
      if (draft.redeemedPoints > 0) {
        customer.pointsBalance -= draft.redeemedPoints
        state.ledger.push({
          id: crypto.randomUUID(),
          shopId: SHOP_ID,
          customerId: customer.id,
          type: 'redeem',
          points: -draft.redeemedPoints,
          billId: bill.id,
          note: null,
          balanceAfter: customer.pointsBalance,
          createdAt: now(),
        })
      }
      if (earnedPoints > 0) {
        customer.pointsBalance += earnedPoints
        state.ledger.push({
          id: crypto.randomUUID(),
          shopId: SHOP_ID,
          customerId: customer.id,
          type: 'earn',
          points: earnedPoints,
          billId: bill.id,
          note: null,
          balanceAfter: customer.pointsBalance,
          createdAt: now(),
        })
      }
      customer.lifetimeSpendPaise += total
      customer.visitCount += 1
      customer.lastVisitAt = now()
    }

    state.bills.set(bill.id, bill)
    return bill
  }

  return {
    async sendOtp(phone) {
      state.otps.set(phone, devOtp)
    },

    async verifyOtp(phone, token) {
      const expected = state.otps.get(phone) ?? devOtp
      if (token !== expected) throw new Error('Invalid OTP')
      state.session = resolveSession(state, OWNER_USER_ID)
      return state.session
    },

    async signOut() {
      state.session = null
    },

    async getSession() {
      return state.session
    },

    createShopForOwner(input) {
      if (!state.session) return Promise.reject(new Error('KADAI/unauthenticated: sign in first'))
      if (state.session.shopId) {
        return Promise.reject(new Error('KADAI/already-member: this user already belongs to a shop'))
      }
      const t = now()
      const shop: Shop = {
        id: crypto.randomUUID(),
        name: input.name,
        upiId: input.upiId,
        gstin: input.gstin ?? null,
        loyalty: { earnRule: DEFAULT_EARN_RULE, tiers: DEFAULT_TIERS },
        createdAt: t,
      }
      const owner: ShopMember = {
        id: crypto.randomUUID(),
        shopId: shop.id,
        userId: state.session.userId,
        role: 'owner',
        pin: null,
        createdAt: t,
      }
      // Fresh shop, fresh books — mirrors the SQL transaction.
      state.shop = shop
      state.members = [owner]
      state.products = new Map()
      state.customers = new Map()
      state.bills = new Map()
      state.ledger = []
      state.stockMovements = []
      state.rewards = []
      state.nextBillNumber = 1001
      state.session = { ...state.session, shopId: shop.id, role: 'owner' }
      return Promise.resolve(shop)
    },

    addStaffMember(phone, pin) {
      if (!state.session || state.session.role !== 'owner') {
        return Promise.reject(new Error('KADAI/not-owner: only owners can invite staff'))
      }
      if (!/^\d{4}$/.test(pin)) {
        return Promise.reject(new Error('KADAI/bad-pin: PIN must be exactly 4 digits'))
      }
      const member: ShopMember = {
        id: crypto.randomUUID(),
        shopId: state.session.shopId!,
        // Memory driver keeps no user registry; a stable id per phone.
        userId: `mem-${phone}`,
        role: 'staff',
        pin,
        createdAt: now(),
      }
      state.members.push(member)
      return Promise.resolve(member)
    },

    async getShop() {
      return state.shop
    },

    async updateShop(_shopId, patch) {
      state.shop = { ...state.shop, ...patch, loyalty: { ...state.shop.loyalty, ...patch.loyalty } }
      return state.shop
    },

    async listMembers() {
      return state.members
    },

    async listProducts(_shopId, filter) {
      let list = [...state.products.values()].filter((p) => p.isActive)
      if (filter?.search) {
        const q = filter.search.toLowerCase()
        list = list.filter(
          (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.barcode ?? '').includes(q),
        )
      }
      if (filter?.lowStockOnly) {
        list = list.filter((p) => p.stockQty <= p.reorderLevel)
      }
      return list
    },

    async createProduct(_shopId, input: ProductInput) {
      const product: Product = {
        id: crypto.randomUUID(),
        shopId: SHOP_ID,
        ...input,
        isActive: true,
        createdAt: now(),
        updatedAt: now(),
      }
      state.products.set(product.id, product)
      if (input.stockQty > 0) {
        state.stockMovements.push({
          id: crypto.randomUUID(),
          shopId: SHOP_ID,
          productId: product.id,
          delta: input.stockQty,
          reason: 'restock',
          billId: null,
          note: 'initial stock',
          createdAt: now(),
        })
      }
      return product
    },

    async updateProduct(productId, patch) {
      const product = state.products.get(productId)
      if (!product) throw new Error('Product not found')
      Object.assign(product, patch, { updatedAt: now() })
      return product
    },

    async adjustStock(productId, delta, reason: StockReason, note) {
      const product = state.products.get(productId)
      if (!product) throw new Error('Product not found')
      const next = product.stockQty + delta
      if (next < 0) throw new Error('Adjustment would take stock below zero')
      product.stockQty = next
      product.updatedAt = now()
      const movement: StockMovement = {
        id: crypto.randomUUID(),
        shopId: SHOP_ID,
        productId,
        delta,
        reason,
        billId: null,
        note: note ?? null,
        createdAt: now(),
      }
      state.stockMovements.push(movement)
      return movement
    },

    async listCustomers(_shopId, filter) {
      let list = [...state.customers.values()].filter((c) => !c.isBlocked)
      if (filter?.search) {
        const q = filter.search.toLowerCase()
        list = list.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q.replace(/\D/g, '')))
      }
      return list
    },

    async createCustomer(_shopId, input: CustomerInput) {
      const dupe = [...state.customers.values()].find((c) => c.phone === input.phone)
      if (dupe) throw new Error('A customer with this phone already exists')
      const customer: Customer = {
        id: crypto.randomUUID(),
        shopId: SHOP_ID,
        ...input,
        pointsBalance: 0,
        lifetimeSpendPaise: 0,
        visitCount: 0,
        lastVisitAt: null,
        isBlocked: false,
        createdAt: now(),
      }
      state.customers.set(customer.id, customer)
      return customer
    },

    async createBill(_shopId: string, draft: BillDraft): Promise<Bill> {
      // Async so failures reject the promise (per the KadaiDriver contract)
      // instead of throwing synchronously into callers.
      return commitBill(draft)
    },

    async listRecentBills(_shopId, limit = 20) {
      return [...state.bills.values()]
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, limit)
    },

    async listLedger(customerId) {
      return state.ledger.filter((e) => e.customerId === customerId)
    },

    async listRewards(_shopId) {
      return state.rewards.filter((r) => r.isActive)
    },

    async createReward(_shopId, input) {
      const reward: Reward = {
        id: crypto.randomUUID(),
        shopId: SHOP_ID,
        ...input,
        isActive: true,
      }
      state.rewards.push(reward)
      return reward
    },

    async setRewardActive(rewardId, isActive) {
      const reward = state.rewards.find((r) => r.id === rewardId)
      if (!reward) throw new Error('Reward not found')
      reward.isActive = isActive
      return reward
    },

    async dailySummary(_shopId, date): Promise<DailySummary> {
      const dayBills = [...state.bills.values()].filter((b) => b.createdAt.slice(0, 10) === date)
      const revenue = dayBills.reduce((s, b) => s + b.totalPaise, 0)
      const tenderSplit = { cash: 0, upi: 0, card: 0 }
      for (const b of dayBills) tenderSplit[b.tender] += b.totalPaise
      return {
        date,
        revenuePaise: revenue,
        billCount: dayBills.length,
        avgBillPaise: dayBills.length ? Math.round(revenue / dayBills.length) : 0,
        tenderSplit,
        returns: 0,
      }
    },

    async pushOutbox(entries: OutboxEntry[]): Promise<SyncResult> {
      const accepted: string[] = []
      const rejected: SyncResult['rejected'] = []
      for (const entry of entries) {
        try {
          commitBill(entry.payload)
          accepted.push(entry.id)
        } catch (err) {
          rejected.push({ id: entry.id, reason: err instanceof Error ? err.message : String(err) })
        }
      }
      return { accepted, rejected }
    },
  }
}
