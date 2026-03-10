import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { calculateNewPrices, formatRupees } from '../lib/markets'

const QUICK_AMOUNTS = [1000, 5000, 10000, 50000, 100000]

export default function TradeModal({ market, side, onClose, onTrade }) {
  const { user, refreshUser } = useAuth()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const isYes = side === 'YES'
  const price = isYes ? market.yes_price : market.no_price
  const sharePrice = price  // price in rupees per share (out of 1000)

  const numAmount = parseFloat(amount) || 0
  const shares = numAmount > 0 ? (numAmount / price).toFixed(2) : '0.00'
  const { yes_price: newYes, no_price: newNo } = numAmount > 0
    ? calculateNewPrices(market.yes_price, numAmount, side)
    : { yes_price: market.yes_price, no_price: market.no_price }

  const handleTrade = async () => {
    setError('')
    if (!numAmount || numAmount <= 0) {
      setError('Enter a valid amount')
      return
    }
    if (numAmount > user.balance) {
      setError('Insufficient balance')
      return
    }
    if (numAmount < 100) {
      setError('Minimum trade: ₹100')
      return
    }

    setLoading(true)
    try {
      // 1. Insert trade
      const { error: tradeError } = await supabase.from('trades').insert({
        user_id: user.id,
        market_id: market.id,
        side,
        amount: numAmount,
      })
      if (tradeError) throw tradeError

      // 2. Update market prices + volume
      const { error: marketError } = await supabase
        .from('markets')
        .update({
          yes_price: newYes,
          no_price: newNo,
          volume: (market.volume || 0) + numAmount,
        })
        .eq('id', market.id)
      if (marketError) throw marketError

      // 3. Deduct user balance
      const { error: userError } = await supabase
        .from('users')
        .update({ balance: user.balance - numAmount })
        .eq('id', user.id)
      if (userError) throw userError

      await refreshUser()
      setSuccess(true)
      setTimeout(() => {
        onTrade && onTrade()
        onClose()
      }, 1200)
    } catch (err) {
      setError(err.message || 'Trade failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative card w-full max-w-sm animate-slide-up rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${isYes ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                BUY {side}
              </span>
            </div>
            <h3 className="font-bold text-white text-sm leading-snug max-w-[220px]">
              {market.question}
            </h3>
          </div>
          <button onClick={onClose} className="text-[#6B7280] hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Current price */}
        <div className="bg-[#0D0F14] rounded-xl p-3 mb-4 flex justify-between items-center">
          <span className="text-[#6B7280] text-xs">Current {side} price</span>
          <span className={`font-bold font-mono text-lg ${isYes ? 'text-emerald-400' : 'text-red-400'}`}>
            ₹{price} <span className="text-xs text-[#6B7280]">/ share</span>
          </span>
        </div>

        {/* Amount input */}
        <div className="mb-3">
          <label className="text-xs text-[#6B7280] mb-1.5 block">Amount (₹)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] font-mono">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="input-field pl-8 font-mono text-lg"
              min="100"
              max={user?.balance}
            />
          </div>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 flex-wrap mb-4">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(String(q))}
              className="text-xs font-mono bg-[#0D0F14] border border-[#1E2330] hover:border-[#2A3347] text-[#6B7280] hover:text-white px-2.5 py-1.5 rounded-lg transition-all"
            >
              {formatRupees(q)}
            </button>
          ))}
          <button
            onClick={() => setAmount(String(Math.floor(user?.balance || 0)))}
            className="text-xs font-mono bg-[#0D0F14] border border-[#1E2330] hover:border-[#2A3347] text-yellow-500 hover:text-yellow-400 px-2.5 py-1.5 rounded-lg transition-all"
          >
            MAX
          </button>
        </div>

        {/* Trade summary */}
        {numAmount > 0 && (
          <div className="bg-[#0D0F14] rounded-xl p-3 mb-4 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-[#6B7280]">
              <span>You get</span>
              <span className="text-white">{shares} shares</span>
            </div>
            <div className="flex justify-between text-[#6B7280]">
              <span>New YES price</span>
              <span className={newYes > market.yes_price ? 'text-emerald-400' : 'text-red-400'}>
                ₹{newYes} ({(newYes / 10).toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between text-[#6B7280]">
              <span>Balance after</span>
              <span className="text-white">{formatRupees(user.balance - numAmount)}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-800/50 text-red-400 text-xs rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-emerald-900/20 border border-emerald-800/50 text-emerald-400 text-xs rounded-lg p-3 mb-4 text-center">
            ✓ Trade executed successfully!
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleTrade}
          disabled={loading || success}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            isYes
              ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
              : 'bg-red-500 hover:bg-red-400 text-white'
          }`}
        >
          {loading ? 'Processing...' : success ? 'Done!' : `Buy ${side} for ${formatRupees(numAmount || 0)}`}
        </button>

        {/* Balance */}
        <p className="text-center text-xs text-[#6B7280] mt-3 font-mono">
          Available: {formatRupees(user?.balance || 0)}
        </p>
      </div>
    </div>
  )
}
