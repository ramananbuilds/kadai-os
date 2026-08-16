/**
 * Receipts — the paper artifact of a Bill (see CONTEXT.md: the Bill is
 * the record; the Receipt is the paper).
 *
 * renderReceipt() produces structured lines: transport-agnostic, testable,
 * and directly consumable by an ESC/POS byte encoder (escposEncode) or an
 * HTML print sheet. 58 mm thermal paper is ~32 monospace columns wide —
 * every line respects that.
 */

import { formatINR, type Bill, type Shop } from './index'

export type ReceiptAlign = 'left' | 'center' | 'right'

export interface ReceiptLine {
  text: string
  align: ReceiptAlign
  bold?: boolean
  /** Double-height for the total line. */
  tall?: boolean
}

const W = 32 // columns on 58 mm paper

function center(text: string): string {
  if (text.length >= W) return text.slice(0, W)
  return ' '.repeat(Math.floor((W - text.length) / 2)) + text
}

function twoCols(left: string, right: string): string {
  const rightText = right.slice(0, W)
  const leftText = left.slice(0, Math.max(0, W - rightText.length - 1))
  return leftText + ' '.repeat(Math.max(1, W - leftText.length - rightText.length)) + rightText
}

export function renderReceipt(bill: Bill, shop: Shop, customerName?: string): ReceiptLine[] {
  const lines: ReceiptLine[] = [
    { text: center(shop.name), align: 'center', bold: true },
    { text: center(shop.upiId), align: 'center' },
    { text: center(`GSTIN: ${shop.gstin ?? '—'}`), align: 'center' },
    { text: '', align: 'left' },
    { text: twoCols(`Bill #${bill.number}`, bill.createdAt.slice(0, 10)), align: 'left' },
    { text: customerName ?? 'Walk-in', align: 'left' },
    { text: '--------------------------------', align: 'center' },
  ]

  for (const item of bill.items) {
    lines.push({ text: item.nameSnapshot.slice(0, W), align: 'left', bold: true })
    lines.push({
      text: twoCols(`  ${item.qty} x ${formatINR(item.unitPricePaise)}`, formatINR(item.lineTotalPaise)),
      align: 'left',
    })
  }

  lines.push({ text: '--------------------------------', align: 'center' })
  lines.push({ text: twoCols('Subtotal', formatINR(bill.subtotalPaise)), align: 'left' })
  if (bill.discountPaise > 0) {
    lines.push({ text: twoCols(`Discount (${bill.discountPercent}%)`, `-${formatINR(bill.discountPaise)}`), align: 'left' })
  }
  lines.push({ text: twoCols('TOTAL', formatINR(bill.totalPaise)), align: 'left', bold: true, tall: true })
  lines.push({ text: twoCols(`Paid by ${bill.tender.toUpperCase()}`, ''), align: 'left' })

  if (bill.customerId) {
    lines.push({ text: '', align: 'left' })
    lines.push({ text: twoCols('Points earned', `+${bill.earnedPoints}`), align: 'left' })
    if (bill.redeemedPoints > 0) {
      lines.push({ text: twoCols('Points redeemed', `-${bill.redeemedPoints}`), align: 'left' })
    }
  }

  lines.push({ text: '', align: 'left' })
  lines.push({ text: twoCols('Pay via UPI', shop.upiId), align: 'left' })
  lines.push({ text: '', align: 'left' })
  lines.push({ text: center('Thank you! Visit again.'), align: 'center' })

  return lines
}

// ─── ESC/POS encoding ─────────────────────────────────────────────

const ESC = 0x1b
const GS = 0x1d

/** Command bytes for a thermal printer (ESC/POS). Pure — no transport. */
export function escposEncode(lines: ReceiptLine[]): Uint8Array {
  const out: number[] = [
    ESC, 0x40, // initialize
    ESC, 0x61, 0x00, // align left default
  ]

  for (const line of lines) {
    // alignment
    out.push(ESC, 0x61, line.align === 'center' ? 0x01 : line.align === 'right' ? 0x02 : 0x00)
    // emphasis
    out.push(ESC, 0x45, line.bold ? 0x01 : 0x00)
    // double height/width for tall lines
    out.push(GS, 0x21, line.tall ? 0x11 : 0x00)
    for (const ch of line.text) out.push(ch.charCodeAt(0))
    out.push(0x0a)
  }

  out.push(ESC, 0x45, 0x00) // emphasis off
  out.push(GS, 0x21, 0x00) // size reset
  out.push(ESC, 0x61, 0x00)
  out.push(0x0a, 0x0a) // feed
  out.push(GS, 0x56, 0x42, 0x00) // full cut

  return new Uint8Array(out)
}
