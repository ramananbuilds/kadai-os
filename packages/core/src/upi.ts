/**
 * UPI intent links — v1 payments. The checkout screen renders this string
 * as a QR (or a tap target on mobile); the customer's UPI app reads it
 * and pre-fills the shop's VPA + amount. We never take the payment.
 *
 * Spec: https://www.npci.org.in (UPI deep linking)
 */

import type { Paise } from './money'

export interface UpiIntent {
  /** Payee VPA, e.g. ravi@okhdfcbank — from the shop's upiId. */
  payeeVpa: string
  /** Shop name shown in the customer's UPI app. */
  payeeName: string
  /** Optional pre-filled amount. */
  amountPaise?: Paise
  /** Note shown in the passbook, e.g. "Bill 1088". */
  note?: string
}

export function buildUpiDeepLink(intent: UpiIntent): string {
  const params = new URLSearchParams()
  params.set('pa', intent.payeeVpa)
  params.set('pn', intent.payeeName)
  if (intent.amountPaise !== undefined) {
    // UPI wants plain rupees with 2 decimals — the one sanctioned place
    // paise become a decimal string.
    params.set('am', (intent.amountPaise / 100).toFixed(2))
    params.set('cu', 'INR')
  }
  if (intent.note) params.set('tn', intent.note)
  // URLSearchParams encodes for query strings; UPI readers accept it.
  return `upi://pay?${params.toString()}`
}
