import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { formatRupees } from '../lib/markets'
import Navbar from '../components/Navbar'

const INITIAL_BALANCE = 1000000

export default function PortfolioPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [trades, setTrades] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [fetching, setFetching] = useState(true)
  const [activeTab, setActiveTab] = useState('trades')

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading])

  useEffect(() => {
    if (!user) return
    fetchTrades()
    fetchLeaderboard()
  }, [user])

  const fetchTrades = async () => {
    const { data } = await supabase
      .from('trades')
      .select('*, markets(question, yes_price, no_price)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setTrades(data)
    setFetching(false)
  }

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, username, balance')
      .order('balance', { ascending: false })
      .limit(28)
    if (data) setLeaderboard(data)
  }

  const totalSpent    = trades.reduce((s, t) => s + (t.amount || 0), 0)
  const yesCount      = trades.filter(t => t.side === 'YES').length
  const noCount       = trades.filter(t => t.side === 'NO').length
  const pnl           = user ? user.balance - INITIAL_BALANCE : 0
  const pnlPositive   = pnl >= 0
  const myRank        = leaderboard.findIndex(u => u.id === user?.id) + 1

  if (loading || !user) return null

  return (
    <>
      <Head>
        <title>Portfolio — PredMarket</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { background: #0D0F14; margin: 0; font-family: 'Syne', sans-serif; }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #141720 25%, #1a2030 50%, #141720 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s ease-in-out infinite;
          border-radius: 8px;
        }
        .tab-btn {
          padding: 8px 20px;
          border-radius: 8px;
          border: none;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .tab-btn.active {
          background: #1652F0;
          color: white;
        }
        .tab-btn.inactive {
          background: transparent;
          color: #6B7280;
        }
        .tab-btn.inactive:hover { color: white; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0D0F14', fontFamily: "'Syne', sans-serif" }}>
        <Navbar />

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>

          {/* Header */}
          <div style={{ marginBottom: '32px', animation: 'fadeSlideUp 0.4s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(22,82,240,0.3), rgba(22,82,240,0.05))',
                border: '1px solid rgba(22,82,240,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: '#1652F0', fontWeight: 800, fontSize: '18px' }}>
                  {user.username[0].toUpperCase()}
                </span>
              </div>
              <div>
                <h1 style={{ color: 'white', fontWeight: 900, fontSize: '28px', margin: 0, letterSpacing: '-0.3px' }}>
                  {user.username}
                </h1>
                <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
                  {myRank > 0 && (
                    <span style={{ color: '#6B7280', fontSize: '12px', fontFamily: 'monospace' }}>
                      Rank #{myRank}
                    </span>
                  )}
                  <span style={{ color: '#6B7280', fontSize: '12px', fontFamily: 'monospace' }}>
                    {trades.length} trades
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px', marginBottom: '28px',
            animation: 'fadeSlideUp 0.4s ease-out 0.05s both',
          }}>
            {/* Balance */}
            <div style={{
              background: '#141720', border: '1px solid #1E2330',
              borderRadius: '16px', padding: '20px',
            }}>
              <div style={{ color: '#6B7280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '8px' }}>
                Current Balance
              </div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '28px', fontFamily: 'monospace', letterSpacing: '-0.5px' }}>
                {formatRupees(user.balance)}
              </div>
              <div style={{ color: '#374151', fontSize: '11px', fontFamily: 'monospace', marginTop: '4px' }}>
                Started: {formatRupees(INITIAL_BALANCE)}
              </div>
            </div>

            {/* P&L */}
            <div style={{
              background: pnlPositive ? 'rgba(0,194,120,0.06)' : 'rgba(255,77,77,0.06)',
              border: `1px solid ${pnlPositive ? 'rgba(0,194,120,0.2)' : 'rgba(255,77,77,0.2)'}`,
              borderRadius: '16px', padding: '20px',
            }}>
              <div style={{ color: '#6B7280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '8px' }}>
                P&L
              </div>
              <div style={{
                color: pnlPositive ? '#00C278' : '#FF4D4D',
                fontWeight: 900, fontSize: '28px',
                fontFamily: 'monospace', letterSpacing: '-0.5px',
              }}>
                {pnlPositive ? '+' : ''}{formatRupees(pnl)}
              </div>
              <div style={{ color: '#374151', fontSize: '11px', fontFamily: 'monospace', marginTop: '4px' }}>
                vs. starting balance
              </div>
            </div>

            {/* Trades count */}
            <div style={{
              background: '#141720', border: '1px solid #1E2330',
              borderRadius: '16px', padding: '20px',
            }}>
              <div style={{ color: '#6B7280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '8px' }}>
                Total Trades
              </div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '28px', fontFamily: 'monospace' }}>
                {trades.length}
              </div>
              {trades.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00C278' }} />
                    <span style={{ color: '#6B7280', fontSize: '11px', fontFamily: 'monospace' }}>{yesCount} YES</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF4D4D' }} />
                    <span style={{ color: '#6B7280', fontSize: '11px', fontFamily: 'monospace' }}>{noCount} NO</span>
                  </div>
                </div>
              )}
            </div>

            {/* Total spent */}
            <div style={{
              background: '#141720', border: '1px solid #1E2330',
              borderRadius: '16px', padding: '20px',
            }}>
              <div style={{ color: '#6B7280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '8px' }}>
                Total Spent
              </div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '28px', fontFamily: 'monospace' }}>
                {formatRupees(totalSpent)}
              </div>
              <div style={{ color: '#374151', fontSize: '11px', fontFamily: 'monospace', marginTop: '4px' }}>
                across all markets
              </div>
            </div>
          </div>

          {/* YES/NO bar */}
          {trades.length > 0 && (
            <div style={{
              background: '#141720', border: '1px solid #1E2330',
              borderRadius: '12px', padding: '14px 18px',
              marginBottom: '28px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#6B7280', fontSize: '11px', fontFamily: 'monospace' }}>
                  YES: {yesCount} ({trades.length ? ((yesCount / trades.length) * 100).toFixed(0) : 0}%)
                </span>
                <span style={{ color: '#6B7280', fontSize: '11px', fontFamily: 'monospace' }}>
                  NO: {noCount} ({trades.length ? ((noCount / trades.length) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div style={{ display: 'flex', height: '8px', borderRadius: '999px', overflow: 'hidden', gap: '2px' }}>
                <div style={{
                  width: `${trades.length ? (yesCount / trades.length) * 100 : 50}%`,
                  background: '#00C278', borderRadius: '999px 0 0 999px', transition: 'width 0.5s ease',
                }} />
                <div style={{ flex: 1, background: '#FF4D4D', borderRadius: '0 999px 999px 0' }} />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: '4px', marginBottom: '20px',
            background: '#141720', border: '1px solid #1E2330',
            borderRadius: '10px', padding: '4px', width: 'fit-content',
          }}>
            <button className={`tab-btn ${activeTab === 'trades' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('trades')}>
              Trade History
            </button>
            <button className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('leaderboard')}>
              🏆 Leaderboard
            </button>
          </div>

          {/* Trade History */}
          {activeTab === 'trades' && (
            <div style={{
              background: '#141720', border: '1px solid #1E2330',
              borderRadius: '18px', overflow: 'hidden',
              animation: 'fadeSlideUp 0.3s ease-out',
            }}>
              {fetching ? (
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: '56px' }} />
                  ))}
                </div>
              ) : trades.length === 0 ? (
                <div style={{ padding: '80px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
                  <div style={{ color: '#6B7280', fontSize: '14px', marginBottom: '16px' }}>
                    You haven't made any trades yet.
                  </div>
                  <Link href="/markets" style={{
                    color: '#1652F0', fontSize: '14px', textDecoration: 'none', fontWeight: 700,
                  }}>
                    Browse Markets →
                  </Link>
                </div>
              ) : (
                <div>
                  {/* Table header */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 100px 120px',
                    padding: '12px 20px',
                    borderBottom: '1px solid #1E2330',
                    color: '#4B5563', fontSize: '10px', textTransform: 'uppercase',
                    letterSpacing: '0.09em', fontWeight: 700,
                  }}>
                    <span>Market</span>
                    <span>Side</span>
                    <span style={{ textAlign: 'right' }}>Amount</span>
                    <span style={{ textAlign: 'right' }}>Date</span>
                  </div>

                  {trades.map((trade) => {
                    const name = trade.markets?.question?.replace(' will cry on farewell speech?', '') || '—'
                    return (
                      <div
                        key={trade.id}
                        style={{
                          display: 'grid', gridTemplateColumns: '1fr 80px 100px 120px',
                          padding: '14px 20px',
                          borderBottom: '1px solid #1E2330',
                          alignItems: 'center',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#161B28'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                            background: trade.side === 'YES'
                              ? 'rgba(0,194,120,0.12)'
                              : 'rgba(255,77,77,0.12)',
                            border: `1px solid ${trade.side === 'YES' ? 'rgba(0,194,120,0.25)' : 'rgba(255,77,77,0.25)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{
                              fontSize: '12px', fontWeight: 800,
                              color: trade.side === 'YES' ? '#00C278' : '#FF4D4D',
                            }}>
                              {trade.side[0]}
                            </span>
                          </div>
                          <span style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>{name}</span>
                        </div>

                        <span style={{
                          fontSize: '12px', fontWeight: 700, fontFamily: 'monospace',
                          color: trade.side === 'YES' ? '#00C278' : '#FF4D4D',
                        }}>
                          {trade.side}
                        </span>

                        <span style={{
                          color: '#FF4D4D', fontSize: '13px', fontWeight: 700,
                          fontFamily: 'monospace', textAlign: 'right',
                        }}>
                          -{formatRupees(trade.amount)}
                        </span>

                        <span style={{
                          color: '#4B5563', fontSize: '11px', fontFamily: 'monospace', textAlign: 'right',
                        }}>
                          {new Date(trade.created_at).toLocaleString('en-IN', {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Leaderboard */}
          {activeTab === 'leaderboard' && (
            <div style={{
              background: '#141720', border: '1px solid #1E2330',
              borderRadius: '18px', overflow: 'hidden',
              animation: 'fadeSlideUp 0.3s ease-out',
            }}>
              {leaderboard.map((u, i) => {
                const isMe = u.id === user.id
                const medals = ['🥇', '🥈', '🥉']
                const pnl = u.balance - INITIAL_BALANCE
                return (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex', alignItems: 'center',
                      padding: '14px 20px',
                      borderBottom: i < leaderboard.length - 1 ? '1px solid #1E2330' : 'none',
                      background: isMe ? 'rgba(22,82,240,0.07)' : 'transparent',
                      borderLeft: isMe ? '3px solid #1652F0' : '3px solid transparent',
                      gap: '14px',
                    }}
                  >
                    {/* Rank */}
                    <div style={{ width: '32px', textAlign: 'center', flexShrink: 0 }}>
                      {i < 3 ? (
                        <span style={{ fontSize: '18px' }}>{medals[i]}</span>
                      ) : (
                        <span style={{ color: '#4B5563', fontSize: '13px', fontFamily: 'monospace', fontWeight: 700 }}>
                          #{i + 1}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                      background: isMe
                        ? 'rgba(22,82,240,0.25)'
                        : 'rgba(255,255,255,0.05)',
                      border: isMe ? '1px solid rgba(22,82,240,0.4)' : '1px solid #1E2330',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{
                        fontWeight: 800, fontSize: '13px',
                        color: isMe ? '#1652F0' : '#6B7280',
                      }}>
                        {u.username[0].toUpperCase()}
                      </span>
                    </div>

                    {/* Name */}
                    <div style={{ flex: 1 }}>
                      <span style={{
                        color: isMe ? '#93B4FF' : 'white',
                        fontWeight: isMe ? 800 : 600,
                        fontSize: '14px',
                      }}>
                        {u.username}
                        {isMe && <span style={{ color: '#1652F0', fontSize: '11px', marginLeft: '6px' }}>(you)</span>}
                      </span>
                    </div>

                    {/* P&L */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        color: pnl >= 0 ? '#00C278' : '#FF4D4D',
                        fontSize: '11px', fontFamily: 'monospace', fontWeight: 600,
                      }}>
                        {pnl >= 0 ? '+' : ''}{formatRupees(pnl)}
                      </div>
                    </div>

                    {/* Balance */}
                    <div style={{ textAlign: 'right', minWidth: '90px' }}>
                      <div style={{ color: 'white', fontWeight: 700, fontSize: '14px', fontFamily: 'monospace' }}>
                        {formatRupees(u.balance)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
