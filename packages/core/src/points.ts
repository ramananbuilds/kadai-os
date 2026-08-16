/**
 * Loyalty points. Points are store credit — the backend treats them like
 * money (append-only ledger, integer math, server-authoritative). These
 * helpers define the *rules*; both the memory driver (dev) and the Supabase
 * RPCs (prod) must use them so every client and the server agree on the
 * arithmetic.
 */

import type { Paise } from './money'

/** Integer point count. */
export type Points = number

export type LoyaltyTier = 'silver' | 'gold' | 'platinum'

/** How many points a completed bill earns. */
export interface EarnRule {
  /** Points awarded per ₹100 spent, e.g. 1 → a ₹48,230 bill earns 482 points. */
  pointsPerHundredRupees: number
}

/** Point thresholds that promote a customer to the next tier. */
export interface TierThresholds {
  /** At or above this balance-eligible total → gold. */
  gold: Points
  /** At or above this → platinum. */
  platinum: Points
}

/**
 * Defaults from the design prototype (CustomerScreen): Silver is the entry
 * tier, Gold at 2,000 points, Platinum at 5,000. Per-shop configurable in
 * the back-office later.
 */
export const DEFAULT_TIERS: TierThresholds = {
  gold: 2_000,
  platinum: 5_000,
}

export const DEFAULT_EARN_RULE: EarnRule = {
  pointsPerHundredRupees: 1,
}

/** Points earned by a bill. Always floors — never award partial points. */
export function computeEarnedPoints(totalPaise: Paise, rule: EarnRule = DEFAULT_EARN_RULE): Points {
  if (rule.pointsPerHundredRupees <= 0) return 0
  return Math.floor((totalPaise / 10_000) * rule.pointsPerHundredRupees)
}

export function resolveTier(points: Points, tiers: TierThresholds = DEFAULT_TIERS): LoyaltyTier {
  if (points >= tiers.platinum) return 'platinum'
  if (points >= tiers.gold) return 'gold'
  return 'silver'
}

export interface TierProgress {
  current: LoyaltyTier
  next: LoyaltyTier | null
  nextAt: Points
  remaining: Points
  /** 0–1 fraction of the way to the next tier (1 when maxed). */
  fraction: number
}

export function tierProgress(points: Points, tiers: TierThresholds = DEFAULT_TIERS): TierProgress {
  const current = resolveTier(points, tiers)
  const [next, nextAt] =
    current === 'silver'
      ? (['gold', tiers.gold] as const)
      : current === 'gold'
        ? (['platinum', tiers.platinum] as const)
        : ([null, points] as const)

  if (next === null) {
    return { current, next: null, nextAt: points, remaining: 0, fraction: 1 }
  }

  const floor = current === 'silver' ? 0 : tiers.gold
  const span = nextAt - floor
  return {
    current,
    next,
    nextAt,
    remaining: Math.max(0, nextAt - points),
    fraction: span <= 0 ? 1 : Math.min(1, Math.max(0, (points - floor) / span)),
  }
}
