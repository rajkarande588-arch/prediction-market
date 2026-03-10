import Link from 'next/link'
import { formatRupees, formatPrice } from '../lib/markets'
import { useEffect, useState, useRef } from 'react'

export default function MarketCard({ market }) {
  const [data, setData] = useState(market)
  const cardRef = useRef(null)

  // Accept live updates via prop
  useEffect(() => {
    const prev = data.yes_price
    const next = market.yes_price

    if (prev !== next && cardRef.current) {
      const cls = next > prev ? 'flash-green' : 'flash-red'
      cardRef.current.classList.add(cls)
      setTimeout(() => cardRef.current?.classList.remove(cls), 800)
    }

    setData(market)
  }, [market])

  const yesPercent = (data.yes_price / 10).toFixed(1)
  const noPercent = (data.no_price / 10).toFixed(1)

  // Extract person name from question
  const name = data.question.replace(' will cry on farewell speech?', '')

  return (
    <Link href={`/market/${data.id}`}>
      <div
        ref={cardRef}
        className="card p-4 hover:border-[#2A3347] transition-all duration-200 cursor-pointer hover:bg-[#161B28] rounded-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            {/* Avatar circle */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1652F0]/30 to-[#1652F0]/10 border border-[#1652F0]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#1652F0] font-bold text-sm">{name[0]}</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-white leading-tight">{name}</p>
              <p className="text-[#6B7280] text-xs mt-0.5">will cry on farewell?</p>
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            <div className="text-xs text-[#6B7280] font-mono">Vol</div>
            <div className="text-xs font-mono text-white">{formatRupees(data.volume)}</div>
          </div>
        </div>

        {/* Price bar */}
        <div className="flex h-1.5 rounded-full overflow-hidden mb-3 gap-px">
          <div
            className="price-bar bg-emerald-400"
            style={{ width: `${yesPercent}%` }}
          />
          <div
            className="price-bar bg-red-400 flex-1"
          />
        </div>

        {/* YES / NO prices */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-bold text-sm font-mono">{yesPercent}%</span>
              <span className="text-[#6B7280] text-xs">YES</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-red-400 font-bold text-sm font-mono">{noPercent}%</span>
              <span className="text-[#6B7280] text-xs">NO</span>
            </div>
          </div>

          <div className="text-[#6B7280] text-xs font-mono">
            ₹{data.yes_price} / ₹{data.no_price}
          </div>
        </div>
      </div>
    </Link>
  )
}
