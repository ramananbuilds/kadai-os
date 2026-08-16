/**
 * Print path: ReceiptLine[] → HTML sheet → system print dialog
 * (expo.print). 58 mm paper maps to a narrow page; thermal printers
 * attached via Bluetooth/USB consume the same lines through
 * escposEncode() once the native transport lands (dev-client build).
 */

import * as Print from 'expo-print'

import { escposEncode, renderReceipt, type Bill, type ReceiptLine, type Shop } from '@kadai-os/core'

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function receiptHtml(lines: ReceiptLine[]): string {
  const rows = lines
    .map(
      (l) =>
        `<div style="text-align:${l.align};font-weight:${l.bold || l.tall ? 700 : 400};font-size:${
          l.tall ? '15px' : '11px'
        };white-space:pre">${esc(l.text || '&nbsp;')}</div>`,
    )
    .join('')
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: 58mm auto; margin: 3mm; }
    body { font-family: 'Courier New', monospace; margin: 0; }
  </style></head><body>${rows}</body></html>`
}

export async function printReceipt(bill: Bill, shop: Shop, customerName?: string): Promise<void> {
  const lines = renderReceipt(bill, shop, customerName)
  await Print.printAsync({ html: receiptHtml(lines), printerUrl: undefined })
}

/** Bytes for a thermal transport (Bluetooth/USB), Phase 3+ native build. */
export function receiptBytes(bill: Bill, shop: Shop, customerName?: string): Uint8Array {
  return escposEncode(renderReceipt(bill, shop, customerName))
}
