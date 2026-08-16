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
  computeEarnedPoints,
  discountPaise,
  formatINR,
  resolveTier,
  rupeesToPaise,
  tierProgress,
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

// Idempotent replay (offline outbox resync)
const replay = await api.createBill(SHOP, { ...bill, items: bill.items.map((i) => ({ productId: i.productId, qty: i.qty })) } as never)
assert.equal(replay.id, bill.id)
assert.equal(replay.number, bill.number)
assert.equal((await api.listProducts(SHOP)).find((p) => p.id === jacket.id)!.stockQty, 7) // not double-decremented

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

console.log('✓ smoke: money, points, tiers, billing transaction, idempotency, stock guards — all passing')
