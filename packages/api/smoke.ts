/**
 * Phase 0 smoke test: exercises @kadai-os/core's money/points math and the
 * @kadai-os/api memory driver's billing transaction end-to-end. Run with:
 *
 *   pnpm --filter @kadai-os/api smoke
 *
 * (A real test runner arrives with Phase 1's schema work; this file is the
 * interim executable spec for the create_bill transaction.)
 */

import assert from 'node:assert/strict'

import { createKadaiApi, createMemoryDriver } from './src/index'

import {
  buildUpiDeepLink,
  computeEarnedPoints,
  discountPaise,
  escposEncode,
  formatINR,
  renderReceipt,
  resolveTier,
  rupeesToPaise,
  tierProgress,
  type Shop,
} from '@kadai-os/core'

// ── Money ────────────────────────────────────────────────────────
assert.equal(formatINR(rupeesToPaise(48230)), '₹48,230')
assert.equal(formatINR(rupeesToPaise(18.5), { decimals: true }), '₹18.50')
assert.equal(discountPaise(10_000_00, 10), 100_000) // 10% of ₹10,000 = ₹1,000
assert.equal(discountPaise(rupeesToPaise(33.98), 5), 170) // rounds, never floats

// ── Points & tiers ───────────────────────────────────────────────
assert.equal(computeEarnedPoints(rupeesToPaise(48230)), 482) // 1 pt / ₹100
assert.equal(computeEarnedPoints(rupeesToPaise(99)), 0) // floors below ₹100
assert.equal(resolveTier(1_999), 'silver')
assert.equal(resolveTier(2_000), 'gold')
assert.equal(resolveTier(5_000), 'platinum')
const tp = tierProgress(2_140)
assert.equal(tp.current, 'gold')
assert.equal(tp.next, 'platinum')
assert.equal(tp.remaining, 2_860)

// ── UPI intent links ─────────────────────────────────────────────
assert.equal(
  buildUpiDeepLink({
    payeeVpa: 'ravi@okhdfcbank',
    payeeName: "Ravi's Boutique",
    amountPaise: rupeesToPaise(3058.2),
    note: 'Bill 1088',
  }),
  'upi://pay?pa=ravi%40okhdfcbank&pn=Ravi%27s+Boutique&am=3058.20&cu=INR&tn=Bill+1088',
)
assert.equal(
  buildUpiDeepLink({ payeeVpa: 'shop@upi', payeeName: 'Shop' }),
  'upi://pay?pa=shop%40upi&pn=Shop',
)

// ── Memory driver: the billing transaction ───────────────────────
const api = createKadaiApi(createMemoryDriver())
const SHOP = '00000000-0000-4000-8000-000000000001'

const jacket = (await api.listProducts(SHOP))[0] // Blue Denim Jacket, ₹2,499, stock 8
const shirt = (await api.listProducts(SHOP)).find((p) => p.sku === 'WLS-001')! // ₹899, stock 2

const bill = await api.createBill(SHOP, {
  id: crypto.randomUUID(),
  customerId: '00000000-0000-4000-8000-000000000201', // Priya
  items: [
    { productId: jacket.id, qty: 1 },
    { productId: shirt.id, qty: 1 },
  ],
  discountPercent: 10,
  redeemedPoints: 0,
  redeemedRewardId: null,
  tender: 'upi',
  createdAt: new Date().toISOString(),
})

// Totals: (2499 + 899) − 10% = ₹3,058.20 → 305820 paise
assert.equal(bill.subtotalPaise, 339800)
assert.equal(bill.discountPaise, 33980)
assert.equal(bill.totalPaise, 305820)
assert.equal(bill.earnedPoints, 30) // floor(₹3,058.20 / ₹100)
assert.equal(bill.number, 1088) // sequential, prototype's counter

// Stock decremented via the journal
assert.equal((await api.listProducts(SHOP)).find((p) => p.id === jacket.id)!.stockQty, 7)

// Customer aggregates + ledger
const priya = (await api.listCustomers(SHOP))[0]
assert.equal(priya.pointsBalance, 4_820 + 30)
assert.equal(priya.visitCount, 35)
const ledger = await api.listLedger(priya.id)
assert.equal(ledger.length, 1)
assert.equal(ledger[0].type, 'earn')
assert.equal(ledger[0].balanceAfter, 4_850)

// ── Receipt rendering + ESC/POS bytes ─────────────────────────────
const demoShop: Shop = {
  id: SHOP,
  name: "Ravi's Boutique",
  upiId: 'ravi@okhdfcbank',
  gstin: null,
  pointsExpiryDays: null,
  loyalty: { earnRule: { pointsPerHundredRupees: 1 }, tiers: { gold: 2000, platinum: 5000 } },
  createdAt: '2026-01-01T00:00:00.000Z',
}

const receiptLines = renderReceipt(bill, demoShop, 'Priya Sharma')
const receiptText = receiptLines.map((l) => l.text).join('\n')
assert.ok(receiptText.includes('Bill #1088'), 'receipt carries the bill number')
assert.ok(receiptText.includes('TOTAL'), 'receipt carries TOTAL')
assert.ok(receiptText.includes('3,058'), 'receipt carries the formatted total') // ₹3,058
assert.ok(receiptText.includes('+30'), 'receipt carries earned points')
assert.ok(receiptLines.every((l) => l.text.length <= 32), '58mm width respected')
const tall = receiptLines.find((l) => l.tall)!
assert.ok(tall.text.includes('TOTAL'))

const bytes = escposEncode(receiptLines)
assert.equal(bytes[0], 0x1b, 'ESC @ init')
assert.equal(bytes[1], 0x40)
assert.deepEqual([...bytes.slice(-4)], [0x1d, 0x56, 0x42, 0x00], 'ends with full cut')

// Idempotent replay (offline outbox resync)
const replay = await api.createBill(SHOP, { ...bill, items: bill.items.map((i) => ({ productId: i.productId, qty: i.qty })) } as never)
assert.equal(replay.id, bill.id)
assert.equal(replay.number, bill.number)
assert.equal((await api.listProducts(SHOP)).find((p) => p.id === jacket.id)!.stockQty, 7) // not double-decremented

// Reward redemption charges its point cost with the discount (memory
// driver mirror of seam 5 in sql-smoke).
const rewardBill = await api.createBill(SHOP, {
  id: crypto.randomUUID(),
  customerId: priya.id,
  items: [{ productId: jacket.id, qty: 1 }],
  discountPercent: 0,
  redeemedPoints: 0,
  redeemedRewardId: '00000000-0000-4000-8000-000000000301', // ₹500 off, cost 500 pts
  tender: 'upi',
  createdAt: new Date().toISOString(),
})
assert.equal(rewardBill.totalPaise, 249900 - 50000) // flat ₹500 off ₹2,499
assert.equal(rewardBill.redeemedPoints, 500) // cost points on the bill
assert.equal(rewardBill.earnedPoints, 19) // floor(₹1,999 / ₹100)
const afterReward = (await api.listCustomers(SHOP))[0]
assert.equal(afterReward.pointsBalance, 4_850 + 19 - 500)
const rewardLedger = await api.listLedger(priya.id)
assert.equal(rewardLedger.at(-1)!.type, 'earn')
assert.equal(rewardLedger.filter((e) => e.type === 'redeem')[0]!.points, -500)
console.log('✓ reward redemption: discount + point cost in one transaction')

// Insufficient stock must throw
await assert.rejects(
  () =>
    api.createBill(SHOP, {
      id: crypto.randomUUID(),
      customerId: null,
      items: [{ productId: shirt.id, qty: 5 }], // only 1 left
      discountPercent: 0,
      redeemedPoints: 0,
      redeemedRewardId: null,
      tender: 'cash',
      createdAt: new Date().toISOString(),
    }),
  /Insufficient stock/,
)

// ── Realtime seam: subscribe → invalidation signals ──────────────
const remote = createKadaiApi(createMemoryDriver())
await remote.sendOtp('+919876543210')
await remote.verifyOtp('+919876543210', '123456')

const seen: string[] = []
const unsubscribe = remote.subscribe(SHOP, (e) => seen.push(e.table))

const remoteJacket = (await remote.listProducts(SHOP))[0]
await remote.createBill(SHOP, {
  id: crypto.randomUUID(),
  customerId: '00000000-0000-4000-8000-000000000201',
  items: [{ productId: remoteJacket.id, qty: 1 }],
  discountPercent: 0,
  redeemedPoints: 0,
  redeemedRewardId: null,
  tender: 'upi',
  createdAt: new Date().toISOString(),
})
assert.ok(seen.includes('bills'), 'bill creation signals bills')
assert.ok(seen.includes('stock_movements'), 'bill creation signals stock_movements')
assert.ok(seen.includes('loyalty_ledger'), 'bill creation signals loyalty_ledger')
assert.ok(seen.includes('customers'), 'bill creation signals customers')

await remote.adjustStock(remoteJacket.id, 5, 'restock', 'test')
assert.ok(seen.includes('products'), 'stock adjustment signals products')

unsubscribe()
const before = seen.length
await remote.createCustomer(SHOP, { name: 'Late Joiner', phone: '+919999999999' })
assert.equal(seen.length, before, 'unsubscribe stops delivery')
console.log('✓ realtime seam: invalidation signals, unsubscribe')

console.log('✓ smoke: money, points, tiers, billing transaction, idempotency, stock guards — all passing')
