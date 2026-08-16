/**
 * Money in Kadai OS is ALWAYS integer paise (₹1 = 100 paise).
 * Floating-point rupees are never stored, summed, or compared.
 * Every conversion from human-entered rupees happens exactly once,
 * here, via {@link rupeesToPaise}.
 */

/** Integer amount in paise. */
export type Paise = number

/**
 * Convert a rupee amount (e.g. from a UI input) to integer paise.
 * Rounds to neutralize float noise from `rupees * 100`.
 */
export function rupeesToPaise(rupees: number): Paise {
  if (!Number.isFinite(rupees)) {
    throw new Error(`rupeesToPaise: received non-finite value "${rupees}"`)
  }
  return Math.round(rupees * 100)
}

/** Convert integer paise back to rupees for display division only. */
export function paiseToRupees(paise: Paise): number {
  return paise / 100
}

/** Format paise as Indian rupees with en-IN digit grouping (₹48,230). */
export function formatINR(paise: Paise, opts: { decimals?: boolean } = {}): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: opts.decimals ? 2 : 0,
    maximumFractionDigits: opts.decimals ? 2 : 0,
  }).format(paise / 100)
}

/** Compact display form: ₹1,42,800 → ₹1.4L. Falls back to formatINR below 1 lakh. */
export function formatINRCompact(paise: Paise): string {
  if (paise < 100_00_000) {
    if (paise < 100_000) return formatINR(paise)
    return `₹${(paise / 100_000).toFixed(1)}L`
  }
  return `₹${(paise / 100_00_000).toFixed(2)}Cr`
}

/** Line total for a bill item. Both operands are integers, so is the result. */
export function lineTotalPaise(unitPricePaise: Paise, qty: number): Paise {
  return unitPricePaise * qty
}

/** Sum of line totals. */
export function subtotalPaise(items: Array<{ lineTotalPaise: Paise }>): Paise {
  return items.reduce((sum, item) => sum + item.lineTotalPaise, 0)
}

/**
 * Discount amount for a whole-bill percentage discount.
 * Rounds half-up; a 5% discount on ₹33.98 → ₹1.70, never ₹1.6999999.
 */
export function discountPaise(subtotal: Paise, percent: number): Paise {
  if (percent <= 0) return 0
  if (percent >= 100) return subtotal
  return Math.round((subtotal * percent) / 100)
}

/** Final bill total: subtotal − discount − flat reward value, floored at zero. */
export function billTotalPaise(
  subtotal: Paise,
  discountPercent: number,
  flatRewardPaise: Paise = 0,
): Paise {
  return Math.max(
    0,
    subtotal - discountPaise(subtotal, discountPercent) - flatRewardPaise,
  )
}
