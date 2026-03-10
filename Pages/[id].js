import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { calculateNewPrices, formatRupees } from '../../lib/markets'
import Navbar from '../../components/Navbar'

const QUICK_AMOUNTS = [1000, 5000, 10000, 50000, 100000]
const INITIAL_BALANCE = 1000000

// ─── Trade Modal ──────────────────────────────────────────────────────────────
function TradeModal({ market, side, user, onClose, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const { refreshUser } = useAuth()

  const isYes = side === 'YES'
  const price = isYes ? market.yes_price : market.no_price
  const numAmount = parseFloat(amount) || 0
  const shares = numAmount > 0 ? (numAmount / price).toFixed(3) : '—'
  const preview = numAmount > 0
    ? calculateNewPrices(market.yes_price, numAmount, side)
    : { yes_price: market.yes_price, no_price: market.no_price }

  const handleTrade = async () => {
    setError('')
    if (!numAmount || numAmount <= 0)    { setError('Enter a valid amount'); return }
    if (numAmount < 100)                 { setError('Minimum trade is ₹100'); return }
    if (numAmount > (user?.balance || 0)) { setError('Insufficient balance'); return }

    setLoading(true)
    try {
      // 1. Record trade
      const { error: e1 } = await supabase.from('trades').insert({
        user_id: user.id,
        market_id: market.id,
        side,
        amount: numAmount,
      })
      if (e1) throw e1

      // 2. Update market prices + volume
      const { error: e2 } = await supabase
        .from('markets')
        .update({
          yes_price: preview.yes_price,
          no_price: preview.no_price,
          volume: (market.volume || 0) + numAmount,
        })
        .eq('id', market.id)
      if (e2) throw e2

      // 3. Deduct from user balance
      const { error: e3 } = await supabase
        .from('users')
        .update({ balance: user.balance - numAmount })
        .eq('id', user.id)
      if (e3) throw e3

      await refreshUser()
      setDone(true)
      setTimeout(() => { onSuccess(); onClose() }, 1000)
    } catch (err) {
      setError(err.message || 'Trade failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .pm-input-modal {
          width: 100%;
          background: #0D0F14;
          border: 1px solid #1E2330;
          border-radius: 10px;
          padding: 13px 16px;
          color: #F1F5F9;
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .pm-input-modal:focus {
          border-color: #1652F0;
          box-shadow: 0 0 0 3px rgba(22,82,240,0.15);
        }
        .pm-input-modal::placeholder { color: #374151; }
        .quick-btn {
          padding: 7px 12px;
          background: #0D0F14;
          border: 1px solid #1E2330;
          border-radius: 8px;
          color: #9CA3AF;
          font-family: monospace;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .quick-btn:hover { border-color: #2A3347; color: white; }
        .trade-cta {
          width: 100%;
          border: none;
          border-radius: 14px;
          padding: 16px;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .trade-cta:hover:not(:disabled) { filter: brightness(1.1); }
        .trade-cta:active:not(:disabled) { transform: scale(0.98); }
        .trade-cta:disabled { opacity: 0.45; cursor: not-allowed; }
      `}</style>

      <div style={{
        background: '#141720',
        border: '1px solid #1E2330',
        borderRadius: '22px',
        padding: '28px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
        animation: 'modalIn 0.25s ease-out',
        position: 'relative',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '18px',
            background: 'none', border: 'none', color: '#6B7280',
            fontSize: '22px', cursor: 'pointer', lineHeight: 1,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'}
          onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px',
              background: isYes ? 'rgba(0,194,120,0.15)' : 'rgba(255,77,77,0.15)',
              color: isYes ? '#00C278' : '#FF4D4D',
              border: `1px solid ${isYes ? 'rgba(0,194,120,0.3)' : 'rgba(255,77,77,0.3)'}`,
              letterSpacing: '0.06em',
            }}>
              BUY {side}
            </span>
          </div>
          <h3 style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: 0, lineHeight: 1.35, paddingRight: '24px' }}>
            {market.question}
          </h3>
        </div>

        {/* Current price */}
        <div style={{
          background: '#0D0F14', borderRadius: '12px', padding: '14px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '20px',
        }}>
          <span style={{ color: '#6B7280', fontSize: '12px' }}>
            Current {side} price
          </span>
          <span style={{
            color: isYes ? '#00C278' : '#FF4D4D',
            fontWeight: 800, fontSize: '22px', fontFamily: 'monospace',
          }}>
            ₹{price}
            <span style={{ color: '#4B5563', fontSize: '12px', fontWeight: 400 }}> /share</span>
          </span>
        </div>

        {/* Amount input */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block', color: '#6B7280', fontSize: '11px',
            textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700,
            marginBottom: '8px',
          }}>
            Amount (₹)
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
              color: '#6B7280', fontFamily: 'monospace', fontSize: '16px',
            }}>₹</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="pm-input-modal"
              style={{ paddingLeft: '28px', fontFamily: 'monospace', fontWeight: 700 }}
              min="100"
              max={user?.balance}
              autoFocus
            />
          </div>
        </div>

        {/* Quick amounts */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
          {QUICK_AMOUNTS.map(q => (
            <button key={q} className="quick-btn" onClick={() => setAmount(String(q))}>
              {formatRupees(q)}
            </button>
          ))}
          <button
            className="quick-btn"
            onClick={() => setAmount(String(Math.floor(user?.balance || 0)))}
            style={{ color: '#F59E0B', borderColor: 'rgba(245,158,11,0.3)' }}
          >
            MAX
          </button>
        </div>

        {/* Trade preview */}
        {numAmount > 0 && (
          <div style={{
            background: '#0D0F14', borderRadius: '12px', padding: '14px 16px',
            marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            {[
              { label: 'Shares received', value: `${shares} shares` },
              {
                label: `New YES price`,
                value: `₹${preview.yes_price} (${(preview.yes_price / 10).toFixed(1)}%)`,
                color: preview.yes_price > market.yes_price ? '#00C278' : '#FF4D4D',
              },
              {
                label: 'Balance after',
                value: formatRupees(user.balance - numAmount),
                color: user.balance - numAmount < 0 ? '#FF4D4D' : 'white',
              },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'monospace' }}>
                <span style={{ color: '#6B7280' }}>{label}</span>
                <span style={{ color: color || 'white', fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.25)',
            borderRadius: '10px', padding: '11px 14px', color: '#FF6B6B',
            fontSize: '13px', marginBottom: '16px',
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Success */}
        {done && (
          <div style={{
            background: 'rgba(0,194,120,0.08)', border: '1px solid rgba(0,194,120,0.25)',
            borderRadius: '10px', padding: '11px 14px', color: '#00C278',
            fontSize: '13px', marginBottom: '16px', textAlign: 'center', fontWeight: 700,
          }}>
            ✓ Trade executed!
          </div>
        )}

        {/* CTA */}
        <button
          className="trade-cta"
          onClick={handleTrade}
          disabled={loading || done}
          style={{
            background: isYes
              ? 'linear-gradient(135deg, #00C278, #00a866)'
              : 'linear-gradient(135deg, #FF4D4D, #e03333)',
            color: isYes ? '#000' : '#fff',
            boxShadow: isYes
              ? '0 4px 20px rgba(0,194,120,0.35)'
              : '0 4px 20px rgba(255,77,77,0.35)',
          }}
        >
          {loading ? 'Processing...' : done ? 'Done!' : `Buy ${side} — ${numAmount > 0 ? formatRupees(numAmount) : '₹0'}`}
        </button>

        <p style={{
          textAlign: 'center', color: '#374151', fontSize: '11px',
          fontFamily: 'monospace', marginTop: '12px',
        }}>
          Available: {formatRupees(user?.balance || 0)}
        </p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MarketPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { id } = router.query

  const [market, setMarket] = useState(null)
  const [trades, setTrades] = useState([])
  const [fetching, setFetching] = useState(true)
  const [tradeModal, setTradeModal] = useState(null) // 'YES' | 'NO' | null
  const [priceHistory, setPriceHistory] = useState([])

  const cardRef     = useRef(null)
  const prevYesRef  = useRef(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading])

  useEffect(() => {
    if (!id || !user) return
    loadMarket()
    loadTrades()
    const cleanup = subscribeRealtime()
    return cleanup
  }, [id, user])

  const loadMarket = async () => {
    const { data } = await supabase.from('markets').select('*').eq('id', id).single()
    if (data) {
      setMarket(data)
      prevYesRef.current = data.yes_price
      setPriceHistory([{ time: new Date().toLocaleTimeString(), yes: data.yes_price, no: data.no_price }])
    }
    setFetching(false)
  }

  const loadTrades = async () => {
    const { data } = await supabase
      .from('trades')
      .select('id, side, amount, created_at, users(username)')
      .eq('market_id', id)
      .order('created_at', { ascending: false })
      .limit(25)
    if (data) setTrades(data)
  }

  const subscribeRealtime = () => {
    const channel = supabase
      .channel(`market-page-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'markets',
        filter: `id=eq.${id}`,
      }, (payload) => {
        const prev = prevYesRef.current
        const next = payload.new.yes_price
        setMarket(payload.new)
        setPriceHistory(ph => [
          ...ph.slice(-29),
          { time: new Date().toLocaleTimeString(), yes: payload.new.yes_price, no: payload.new.no_price },
        ])
        if (cardRef.current) {
          const cls = next > prev ? 'flash-green' : 'flash-red'
          cardRef.current.classList.remove('flash-green', 'flash-red')
          void cardRef.current.offsetWidth
          cardRef.current.classList.add(cls)
          setTimeout(() => cardRef.current?.classList.remove(cls), 900)
        }
        prevYesRef.current = next
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'trades',
        filter: `market_id=eq.${id}`,
      }, () => { loadTrades() })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }

  if (loading || !user) return null

  if (fetching || !market) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D0F14', fontFamily: "'Syne', sans-serif" }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ color: '#6B7280', fontFamily: 'monospace', fontSize: '14px' }}>
            Loading market...
          </div>
        </div>
      </div>
    )
  }

  const name       = market.question.replace(' will cry on farewell speech?', '')
  const yesPercent = (market.yes_price / 10).toFixed(1)
  const noPercent  = (market.no_price / 10).toFixed(1)

  return (
    <>
      <Head>
        <title>{name} — PredMarket</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { background: #0D0F14; margin: 0; font-family: 'Syne', sans-serif; }

        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(1.8); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes flashG {
          0%   { background: rgba(0,194,120,0.18); }
          100% { background: #141720; }
        }
        @keyframes flashR {
          0%   { background: rgba(255,77,77,0.18); }
          100% { background: #141720; }
        }
        .flash-green { animation: flashG 0.9s ease-out forwards; }
        .flash-red   { animation: flashR 0.9s ease-out forwards; }

        .trade-btn-yes {
          flex: 1;
          background: linear-gradient(135deg, #00C278, #00a866);
          color: black;
          border: none;
          border-radius: 14px;
          padding: 18px;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,194,120,0.3);
          transition: all 0.15s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .trade-btn-yes:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .trade-btn-yes:active { transform: scale(0.98); }

        .trade-btn-no {
          flex: 1;
          background: linear-gradient(135deg, #FF4D4D, #e03333);
          color: white;
          border: none;
          border-radius: 14px;
          padding: 18px;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(255,77,77,0.3);
          transition: all 0.15s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .trade-btn-no:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .trade-btn-no:active { transform: scale(0.98); }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0D0F14' }}>
        <Navbar />

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

          {/* Breadcrumb */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '12px', fontFamily: 'monospace', color: '#4B5563',
            marginBottom: '24px',
          }}>
            <Link href="/markets" style={{ color: '#6B7280', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
            >
              ← Markets
            </Link>
            <span>/</span>
            <span style={{ color: 'white' }}>{name}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>

            {/* ── Left column ─────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Main market card */}
              <div
                ref={cardRef}
                style={{
                  background: '#141720',
                  border: '1px solid #1E2330',
                  borderRadius: '22px', padding: '28px',
                  transition: 'background 0.3s',
                  animation: 'fadeSlideUp 0.4s ease-out',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '24px' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(22,82,240,0.3), rgba(22,82,240,0.05))',
                    border: '1px solid rgba(22,82,240,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: '#1652F0', fontWeight: 900, fontSize: '22px' }}>{name[0]}</span>
                  </div>
                  <div>
                    <h1 style={{ color: 'white', fontWeight: 900, fontSize: '22px', margin: '0 0 6px 0', lineHeight: 1.2, letterSpacing: '-0.2px' }}>
                      {market.question}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{
                          width: '7px', height: '7px', borderRadius: '50%', background: '#00C278',
                          animation: 'livePulse 2s ease-in-out infinite',
                        }} />
                        <span style={{ color: '#00C278', fontSize: '11px', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.1em' }}>
                          LIVE
                        </span>
                      </div>
                      <span style={{ color: '#374151', fontSize: '12px' }}>·</span>
                      <span style={{ color: '#4B5563', fontSize: '12px', fontFamily: 'monospace' }}>
                        Vol: {formatRupees(market.volume || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Big YES / NO prices */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div style={{
                    background: 'rgba(0,194,120,0.06)', border: '1px solid rgba(0,194,120,0.2)',
                    borderRadius: '16px', padding: '18px', textAlign: 'center',
                  }}>
                    <div style={{ color: '#00C278', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '6px' }}>YES</div>
                    <div style={{ color: '#00C278', fontWeight: 900, fontSize: '42px', fontFamily: 'monospace', lineHeight: 1, letterSpacing: '-1px' }}>
                      {yesPercent}%
                    </div>
                    <div style={{ color: '#374151', fontSize: '12px', fontFamily: 'monospace', marginTop: '6px' }}>
                      ₹{market.yes_price} / share
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255,77,77,0.06)', border: '1px solid rgba(255,77,77,0.2)',
                    borderRadius: '16px', padding: '18px', textAlign: 'center',
                  }}>
                    <div style={{ color: '#FF4D4D', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '6px' }}>NO</div>
                    <div style={{ color: '#FF4D4D', fontWeight: 900, fontSize: '42px', fontFamily: 'monospace', lineHeight: 1, letterSpacing: '-1px' }}>
                      {noPercent}%
                    </div>
                    <div style={{ color: '#374151', fontSize: '12px', fontFamily: 'monospace', marginTop: '6px' }}>
                      ₹{market.no_price} / share
                    </div>
                  </div>
                </div>

                {/* Price bar */}
                <div style={{
                  display: 'flex', height: '8px', borderRadius: '999px',
                  overflow: 'hidden', gap: '2px', marginBottom: '24px',
                }}>
                  <div style={{
                    width: `${yesPercent}%`, background: '#00C278',
                    borderRadius: '999px 0 0 999px', transition: 'width 0.7s ease',
                  }} />
                  <div style={{
                    flex: 1, background: '#FF4D4D',
                    borderRadius: '0 999px 999px 0',
                  }} />
                </div>

                {/* Buy buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="trade-btn-yes" onClick={() => setTradeModal('YES')}>
                    <span>Buy YES</span>
                    <span style={{ fontSize: '12px', fontWeight: 400, opacity: 0.75 }}>
                      ₹{market.yes_price} / share
                    </span>
                  </button>
                  <button className="trade-btn-no" onClick={() => setTradeModal('NO')}>
                    <span>Buy NO</span>
                    <span style={{ fontSize: '12px', fontWeight: 400, opacity: 0.75 }}>
                      ₹{market.no_price} / share
                    </span>
                  </button>
                </div>
              </div>

              {/* Price history */}
              {priceHistory.length > 1 && (
                <div style={{
                  background: '#141720', border: '1px solid #1E2330',
                  borderRadius: '18px', padding: '22px',
                  animation: 'fadeSlideUp 0.4s ease-out 0.1s both',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h3 style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: 0 }}>
                      Price History
                    </h3>
                    <span style={{
                      background: '#0D0F14', border: '1px solid #1E2330',
                      borderRadius: '6px', padding: '3px 10px',
                      color: '#6B7280', fontSize: '11px', fontFamily: 'monospace',
                    }}>
                      This session
                    </span>
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {[...priceHistory].reverse().map((p, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '9px 0',
                        borderBottom: i < priceHistory.length - 1 ? '1px solid #1E2330' : 'none',
                        fontSize: '12px', fontFamily: 'monospace',
                      }}>
                        <span style={{ color: '#4B5563' }}>{p.time}</span>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <span style={{ color: '#00C278' }}>YES {(p.yes / 10).toFixed(1)}%</span>
                          <span style={{ color: '#FF4D4D' }}>NO {(p.no / 10).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Market details */}
              <div style={{
                background: '#141720', border: '1px solid #1E2330',
                borderRadius: '18px', padding: '22px',
                animation: 'fadeSlideUp 0.4s ease-out 0.15s both',
              }}>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: '0 0 14px 0' }}>
                  Market Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    ['Type', 'Binary (YES/NO)'],
                    ['Price range', '₹0 – ₹1,000'],
                    ['YES + NO', 'Always = ₹1,000'],
                    ['Starting YES', '₹700 (70%)'],
                    ['Resolution', 'Farewell Day'],
                    ['Market', id ? `...${id.slice(-8)}` : '—'],
                  ].map(([k, v]) => (
                    <div key={k} style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: '13px', fontFamily: 'monospace',
                      paddingBottom: '10px',
                      borderBottom: '1px solid #1E2330',
                    }}>
                      <span style={{ color: '#6B7280' }}>{k}</span>
                      <span style={{ color: 'white' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right column (activity feed) ─────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div style={{
                background: '#141720', border: '1px solid #1E2330',
                borderRadius: '18px', padding: '20px',
                animation: 'fadeSlideUp 0.4s ease-out 0.05s both',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  marginBottom: '16px',
                }}>
                  <h3 style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: 0, flex: 1 }}>
                    Recent Trades
                  </h3>
                  <div style={{
                    width: '7px', height: '7px', borderRadius: '50%', background: '#00C278',
                    animation: 'livePulse 2s ease-in-out infinite',
                  }} />
                  <span style={{ color: '#00C278', fontSize: '10px', fontFamily: 'monospace', fontWeight: 600 }}>
                    LIVE
                  </span>
                </div>

                {trades.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎯</div>
                    <div style={{ color: '#6B7280', fontSize: '13px' }}>
                      No trades yet. Be the first!
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {trades.map((trade, i) => (
                      <div
                        key={trade.id}
                        style={{
                          display: 'flex', alignItems: 'center',
                          gap: '10px', padding: '11px 0',
                          borderBottom: i < trades.length - 1 ? '1px solid #1E2330' : 'none',
                        }}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                          background: '#1E2330',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 700, color: '#6B7280',
                        }}>
                          {trade.users?.username?.[0]?.toUpperCase() || '?'}
                        </div>

                        {/* Name + time */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            color: 'white', fontSize: '12px', fontWeight: 600,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {trade.users?.username || 'Anonymous'}
                          </div>
                          <div style={{ color: '#4B5563', fontSize: '10px', fontFamily: 'monospace' }}>
                            {new Date(trade.created_at).toLocaleTimeString()}
                          </div>
                        </div>

                        {/* Side + amount */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{
                            fontSize: '11px', fontWeight: 700, fontFamily: 'monospace',
                            color: trade.side === 'YES' ? '#00C278' : '#FF4D4D',
                          }}>
                            {trade.side}
                          </div>
                          <div style={{ color: '#6B7280', fontSize: '10px', fontFamily: 'monospace' }}>
                            {formatRupees(trade.amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Your balance card */}
              <div style={{
                background: '#141720', border: '1px solid #1E2330',
                borderRadius: '18px', padding: '20px',
                animation: 'fadeSlideUp 0.4s ease-out 0.1s both',
              }}>
                <div style={{ color: '#6B7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700, marginBottom: '8px' }}>
                  Your Balance
                </div>
                <div style={{ color: '#00C278', fontWeight: 900, fontSize: '24px', fontFamily: 'monospace' }}>
                  {formatRupees(user.balance)}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px',
                }}>
                  <span style={{
                    fontSize: '11px', fontFamily: 'monospace', fontWeight: 600,
                    color: user.balance >= INITIAL_BALANCE ? '#00C278' : '#FF4D4D',
                  }}>
                    {user.balance >= INITIAL_BALANCE ? '+' : ''}{formatRupees(user.balance - INITIAL_BALANCE)} P&L
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button
                    onClick={() => setTradeModal('YES')}
                    style={{
                      flex: 1, background: 'rgba(0,194,120,0.1)',
                      border: '1px solid rgba(0,194,120,0.25)',
                      borderRadius: '10px', padding: '10px',
                      color: '#00C278', fontFamily: "'Syne', sans-serif",
                      fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,194,120,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,194,120,0.1)'}
                  >
                    Buy YES
                  </button>
                  <button
                    onClick={() => setTradeModal('NO')}
                    style={{
                      flex: 1, background: 'rgba(255,77,77,0.1)',
                      border: '1px solid rgba(255,77,77,0.25)',
                      borderRadius: '10px', padding: '10px',
                      color: '#FF4D4D', fontFamily: "'Syne', sans-serif",
                      fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,77,77,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,77,77,0.1)'}
                  >
                    Buy NO
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Modal */}
        {tradeModal && (
          <TradeModal
            market={market}
            side={tradeModal}
            user={user}
            onClose={() => setTradeModal(null)}
            onSuccess={() => { loadMarket(); loadTrades() }}
          />
        )}
      </div>
    </>
  )
}
