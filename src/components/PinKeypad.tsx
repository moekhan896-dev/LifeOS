'use client'

type Props = {
  disabled?: boolean
  onDigit: (d: string) => void
  onBackspace: () => void
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const

/** PRD ADDENDUM GAP 1 — 72px min touch targets, circular keys, scale(0.95) on tap. */
export function PinKeypad({ disabled, onDigit, onBackspace }: Props) {
  const keyCls =
    'flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[#2C2C2E] text-[22px] font-bold text-[#F5F5F7] transition-colors hover:bg-[#3A3A3C] active:scale-95 active:bg-[#48484A] duration-100 disabled:opacity-40 mx-auto'
  return (
    <div className="mt-6 grid w-full max-w-[260px] gap-4">
      {KEYS.map((row) => (
        <div key={row.join('')} className="grid grid-cols-3 gap-4">
          {row.map((k) => (
            <button key={k} type="button" disabled={disabled} onClick={() => onDigit(k)} className={keyCls}>
              {k}
            </button>
          ))}
        </div>
      ))}
      <div className="grid grid-cols-3 gap-4">
        <div />
        <button type="button" disabled={disabled} onClick={() => onDigit('0')} className={keyCls}>
          0
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onBackspace}
          className={`${keyCls} text-[17px] font-semibold`}
          aria-label="Backspace"
        >
          ⌫
        </button>
      </div>
    </div>
  )
}
