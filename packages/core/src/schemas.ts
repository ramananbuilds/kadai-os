/**
 * Zod schemas for every payload that crosses a client ↔ backend boundary.
 * Rule: the wire format is validated here in @kadai-os/core so the mobile
 * app, the web app, and (later) the Supabase RPC layer all parse the same
 * shapes. Keep each schema in lockstep with the interface of the same name
 * in types.ts.
 */

import { z } from 'zod'

// ─── Scalars ─────────────────────────────────────────────────────

export const iso8601Schema = z.string().min(1)

/** E.164 phone, India-friendly but not India-locked. */
export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, 'Phone must be E.164, e.g. +919876543210')

/** Non-negative integer paise. */
export const paiseSchema = z.number().int().nonnegative()

/** Positive integer paise (prices, costs). */
export const positivePaiseSchema = z.number().int().positive()

export const uuidSchema = z.string().uuid()

export const tenderSchema = z.enum(['cash', 'upi', 'card'])
export const memberRoleSchema = z.enum(['owner', 'staff'])
export const rewardKindSchema = z.enum(['percent_off', 'flat_off'])
export const stockReasonSchema = z.enum(['sale', 'restock', 'adjustment', 'return'])
export const ledgerEntryTypeSchema = z.enum(['earn', 'redeem', 'expire', 'adjust'])
export const loyaltyTierSchema = z.enum(['silver', 'gold', 'platinum'])

// ─── Shop ────────────────────────────────────────────────────────

export const loyaltyConfigSchema = z.object({
  earnRule: z.object({ pointsPerHundredRupees: z.number().int().nonnegative() }),
  tiers: z.object({ gold: z.number().int().nonnegative(), platinum: z.number().int().nonnegative() }),
})

export const shopSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  upiId: z.string().min(3),
  gstin: z.string().nullable(),
  loyalty: loyaltyConfigSchema,
  createdAt: iso8601Schema,
})

// ─── Catalog ─────────────────────────────────────────────────────

export const productSchema = z.object({
  id: uuidSchema,
  shopId: uuidSchema,
  name: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().nullable(),
  category: z.string(),
  pricePaise: positivePaiseSchema,
  costPaise: z.number().int().nonnegative(),
  stockQty: z.number().int().nonnegative(),
  reorderLevel: z.number().int().nonnegative(),
  isActive: z.boolean(),
  createdAt: iso8601Schema,
  updatedAt: iso8601Schema,
})

/** Payload for creating a product (ids/timestamps assigned by the driver). */
export const productInputSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().nullable().default(null),
  category: z.string().default('General'),
  pricePaise: positivePaiseSchema,
  costPaise: z.number().int().nonnegative().default(0),
  stockQty: z.number().int().nonnegative().default(0),
  reorderLevel: z.number().int().nonnegative().default(5),
})

// ─── Customers & loyalty ─────────────────────────────────────────

export const customerSchema = z.object({
  id: uuidSchema,
  shopId: uuidSchema,
  name: z.string().min(1),
  phone: phoneSchema,
  pointsBalance: z.number().int(),
  lifetimeSpendPaise: paiseSchema,
  visitCount: z.number().int().nonnegative(),
  lastVisitAt: iso8601Schema.nullable(),
  isBlocked: z.boolean(),
  createdAt: iso8601Schema,
})

export const customerInputSchema = z.object({
  name: z.string().min(1),
  phone: phoneSchema,
})

export const loyaltyEntrySchema = z.object({
  id: uuidSchema,
  shopId: uuidSchema,
  customerId: uuidSchema,
  type: ledgerEntryTypeSchema,
  points: z.number().int(),
  billId: uuidSchema.nullable(),
  note: z.string().nullable(),
  balanceAfter: z.number().int(),
  createdAt: iso8601Schema,
})

export const rewardSchema = z.object({
  id: uuidSchema,
  shopId: uuidSchema,
  name: z.string().min(1),
  kind: rewardKindSchema,
  value: z.number().int().positive(),
  minSpendPaise: paiseSchema.nullable(),
  costPoints: z.number().int().nonnegative(),
  expiryDays: z.number().int().positive().nullable(),
  isActive: z.boolean(),
})

// ─── Bills ───────────────────────────────────────────────────────

/**
 * What a client sends to create a bill. Deliberately minimal: product
 * ids + quantities, not prices — prices are re-read server-side so a
 * stale client catalog can't mischarge. `id` is client-generated and
 * doubles as the sync idempotency key.
 */
export const billDraftSchema = z.object({
  id: uuidSchema,
  customerId: uuidSchema.nullable().default(null),
  items: z
    .array(
      z.object({
        productId: uuidSchema,
        qty: z.number().int().positive(),
      }),
    )
    .min(1),
  discountPercent: z.number().int().min(0).max(100).default(0),
  redeemedPoints: z.number().int().nonnegative().default(0),
  redeemedRewardId: uuidSchema.nullable().default(null),
  tender: tenderSchema,
  createdAt: iso8601Schema,
})

export type BillDraft = z.infer<typeof billDraftSchema>
export type ProductInput = z.infer<typeof productInputSchema>
export type CustomerInput = z.infer<typeof customerInputSchema>

export const billItemSchema = z.object({
  productId: uuidSchema,
  nameSnapshot: z.string(),
  skuSnapshot: z.string(),
  unitPricePaise: paiseSchema,
  qty: z.number().int().positive(),
  lineTotalPaise: paiseSchema,
})

export const billSchema = z.object({
  id: uuidSchema,
  shopId: uuidSchema,
  number: z.number().int().positive(),
  customerId: uuidSchema.nullable(),
  items: z.array(billItemSchema),
  subtotalPaise: paiseSchema,
  discountPercent: z.number().int().min(0).max(100),
  discountPaise: paiseSchema,
  totalPaise: paiseSchema,
  earnedPoints: z.number().int().nonnegative(),
  redeemedPoints: z.number().int().nonnegative(),
  redeemedRewardId: uuidSchema.nullable(),
  tender: tenderSchema,
  status: z.enum(['completed', 'void']),
  createdAt: iso8601Schema,
})
