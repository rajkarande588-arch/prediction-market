import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { formatRupees } from '../lib/markets'

function MarketCard({ market }) {
  const cardRef = useRef(null)
  const prevYes = useRef(market.yes_price)

  useEffect(() => {
    const next = market.yes_price
    const prev = prevYes.current
    if (prev !== next && cardRef.current) {
      const cls = next > prev ? 'flash-green' : 'flash-red'
      cardRef.current.classList.remove('flash-green', 'flash-red')
      void cardRef.current.offsetWidth
      cardRef.current.classList.add(cls)
      setTimeout(() => cardRef.current?.classList.remove(cls), 900)
    }
    prevYes.current = next
  }, [market.yes_price])

  const name = market.question.replace(' will cry on farewell speech?', '')
  const yesPercent = (market.yes_price / 10).toFixed(1)
  const noPercent = (market.no_price / 10).toFixed(1)

  return (
    <Link href={`/market/${market.id}`} style={{ textDecoration: 'none' }}>
      <div
        ref={cardRef}
        style={{
          background: '#141720',
          border: '1px solid #1E2330',
          borderRadius: '16px',
          padding: '18px',
          cursor: 'pointer',
          transition: 'border-color 0.2s, background 0.2s',
          display: 'block',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#2A3347'
          e.currentTarget.style.background = '#161B28'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#1E2330'
          e.currentTarget.style.background = '#141720'
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(22,82,240,0.25), rgba(22,82,240,0.05))',
              border: '1px solid rgba(22,82,240,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#1652F0', fontWeight: 800, fontSize: '15px' }}>
                {name[0]}
              </span>
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '14px', lineHeight: 1.2 }}>
                {name}
              </div>
              <div style={{ color: '#6B7280', fontSize: '11px', marginTop: '2px' }}>
                will cry on farewell?
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ color: '#6B7280', fontSize: '10px', fontFamily: 'monospace' }}>Vol</div>
            <div style={{ color: '#9CA3AF', fontSize: '11px', fontFamily: 'monospace', fontWeight: 600 }}>
              {formatRupees(market.volume || 0)}
            </div>
          </div>
        </div>

        {/* Price bar */}
        <div style={{
          display: 'flex', height: '6px', borderRadius: '999px',
          overflow: 'hidden', gap: '2px', marginBottom: '12px',
        }}>
          <div style={{
            width: `${yesPercent}%`,
            background: '#00C278',
            borderRadius: '999px 0 0 999px',
            transition: 'width 0.7s ease',
          }} />
          <div style={{
            flex: 1,
            background: '#FF4D4D',
            borderRadius: '0 999px 999px 0',
          }} />
        </div>

        {/* YES / NO chips */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00C278' }} />
              <span style={{ color: '#00C278', fontWeight: 700, fontSize: '13px', fontFamily: 'monospace' }}>
                {yesPercent}%
              </span>
              <span style={{ color: '#6B7280', fontSize: '11px' }}>YES</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#FF4D4D' }} />
              <span style={{ color: '#FF4D4D', fontWeight: 700, fontSize: '13px', fontFamily: 'monospace' }}>
                {noPercent}%
              </span>
              <span style={{ color: '#6B7280', fontSize: '11px' }}>NO</span>
            </div>
          </div>
          <div style={{ color: '#4B5563', fontSize: '11px', fontFamily: 'monospace' }}>
            ₹{market.yes_price} / ₹{market.no_price}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function MarketsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [markets, setMarkets] = useState([])
  const [fetching, setFetching] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading])

  useEffect(() => {
    if (!user) return
    fetchMarkets()
    const cleanup = subscribeToMarkets()
    return cleanup
  }, [user])

  const fetchMarkets = async () => {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .order('question', { ascending: true })
    if (!error && data) setMarkets(data)
    setFetching(false)
  }

  const subscribeToMarkets = () => {
    const channel = supabase
      .channel('markets-list-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'markets',
      }, (payload) => {
        setMarkets(prev =>
          prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m)
        )
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }

  const sorted = [...markets]
    .filter(m => m.question.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'volume')   return (b.volume || 0) - (a.volume || 0)
      if (sortBy === 'yes_high') return b.yes_price - a.yes_price
      if (sortBy === 'yes_low')  return a.yes_price - b.yes_price
      return a.question.localeCompare(b.question)
    })

  const totalVolume = markets.reduce((s, m) => s + (m.volume || 0), 0)

  if (loading || !user) return null

  return (
    <>
      <Head>
        <title>Markets — PredMarket</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { background: #0D0F14; margin: 0; font-family: 'Syne', sans-serif; }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.8); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .flash-green { animation: flashG 0.8s ease-out; }
        .flash-red   { animation: flashR 0.8s ease-out; }
        @keyframes flashG {
          0%   { background: rgba(0,194,120,0.18); }
          100% { background: #141720; }
        }
        @keyframes flashR {
          0%   { background: rgba(255,77,77,0.18); }
          100% { background: #141720; }
        }
        .skeleton {
          background: linear-gradient(90deg, #141720 25%, #1a2030 50%, #141720 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s ease-in-out infinite;
          border-radius: 10px;
        }
        .pm-input {
          background: #141720;
          border: 1px solid #1E2330;
          border-radius: 10px;
          padding: 11px 16px;
          color: #F1F5F9;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }
        .pm-input:focus { border-color: #1652F0; }
        .pm-input::placeholder { color: #374151; }
        .pm-select {
          background: #141720;
          border: 1px solid #1E2330;
          border-radius: 10px;
          padding: 11px 16px;
          color: #F1F5F9;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          outline: none;
          cursor: pointer;
          appearance: none;
          transition: border-color 0.2s;
          min-width: 170px;
        }
        .pm-select:focus { border-color: #1652F0; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0D0F14', fontFamily: "'Syne', sans-serif" }}>
        <Navbar />

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px' }}>

          {/* Page header */}
          <div style={{ marginBottom: '36px', animation: 'fadeSlideUp 0.4s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%', background: '#00C278',
                animation: 'livePulse 2s ease-in-out infinite',
              }} />
              <span style={{ color: '#00C278', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '0.12em', fontWeight: 600 }}>
                LIVE MARKETS
              </span>
            </div>
            <h1 style={{ color: 'white', fontWeight: 900, fontSize: '34px', letterSpacing: '-0.5px', margin: 0 }}>
              MFT Farewell Markets
            </h1>
            <p style={{ color: '#6B7280', marginTop: '6px', fontSize: '14px' }}>
              Who will cry? Place your bets.
            </p>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '32px',
            animation: 'fadeSlideUp 0.4s ease-out 0.05s both',
          }}>
            {[
              { label: 'Active Markets', value: markets.length.toString(), color: 'white' },
              { label: 'Total Volume', value: formatRupees(totalVolume), color: 'white', mono: true },
              { label: 'Your Balance', value: formatRupees(user.balance), color: '#00C278', mono: true },
            ].map(({ label, value, color, mono }) => (
              <div key={label} style={{
                background: '#141720', border: '1px solid #1E2330',
                borderRadius: '14px', padding: '18px 20px',
              }}>
                <div style={{ color: '#6B7280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '6px', fontWeight: 600 }}>
                  {label}
                </div>
                <div style={{
                  color, fontWeight: 900, fontSize: '22px',
                  fontFamily: mono ? "'JetBrains Mono', monospace" : "'Syne', sans-serif",
                }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Search + sort */}
          <div style={{
            display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap',
            animation: 'fadeSlideUp 0.4s ease-out 0.1s both',
          }}>
            <input
              type="text"
              placeholder="Search markets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pm-input"
              style={{ flex: 1, minWidth: '200px' }}
            />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="pm-select"
            >
              <option value="name">Sort: Name A–Z</option>
              <option value="volume">Sort: Volume ↓</option>
              <option value="yes_high">Sort: YES High</option>
              <option value="yes_low">Sort: YES Low</option>
            </select>
          </div>

          {/* Markets grid */}
          {fetching ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{
                  background: '#141720', border: '1px solid #1E2330',
                  borderRadius: '16px', padding: '18px', height: '130px',
                }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                    <div className="skeleton" style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: '13px', width: '60%', marginBottom: '7px' }} />
                      <div className="skeleton" style={{ height: '10px', width: '40%' }} />
                    </div>
                  </div>
                  <div className="skeleton" style={{ height: '6px', borderRadius: '999px', marginBottom: '12px' }} />
                  <div className="skeleton" style={{ height: '12px', width: '55%' }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
              animation: 'fadeSlideUp 0.4s ease-out 0.15s both',
            }}>
              {sorted.map(market => (
                <MarketCard key={market.id} market={market} />
              ))}
              {sorted.length === 0 && (
                <div style={{
                  gridColumn: '1 / -1', textAlign: 'center',
                  padding: '80px 0', color: '#6B7280', fontSize: '14px',
                }}>
                  No markets match "{search}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
