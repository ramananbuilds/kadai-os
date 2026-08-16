/** Receipt preview + browser printing (58 mm print CSS). */

import { renderReceipt, type Bill, type Shop } from '@kadai-os/core'

export default function Receipt({
  bill,
  shop,
  customerName,
  onDone,
}: {
  bill: Bill
  shop: Shop
  customerName?: string
  onDone: () => void
}) {
  const lines = renderReceipt(bill, shop, customerName)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={onDone}>
      <div
        className="bg-[var(--surface)] rounded-2xl p-5 max-w-sm w-full flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-base font-bold">
          Bill saved{bill.number === -1 ? ' — syncing' : ` #${bill.number}`}
        </p>
        <div className="bg-white text-black rounded-xl p-4 font-mono receipt-sheet">
          {lines.map((line, i) => (
            <div
              key={i}
              className={line.tall ? 'text-[15px] font-bold' : line.bold ? 'text-[11px] font-bold' : 'text-[11px]'}
              style={{ textAlign: line.align, whiteSpace: 'pre' }}
            >
              {line.text || '\u00A0'}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-xl bg-[var(--primary)] text-white font-bold text-sm py-3"
          >
            🖨️ Print
          </button>
          <button onClick={onDone} className="px-4 rounded-xl border border-[var(--border-mid)] text-sm font-semibold">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
