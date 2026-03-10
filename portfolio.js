import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { formatRupees } from '../lib/markets'
import Navbar from '../components/Navbar'

export default function PortfolioPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [trades, setTrades] = useState([])
  const [markets, setMarkets] = useState({})
  const [fetching, setFetching] = useState(true)
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading])

  useEffect(() => {
    if (!user) return
    fetchPortfolio()
    fetchLeaderboard()
  }, [user])

  const fetchPortfolio = async () => {
    const { data: tradeData } = await supabase
      .from('trades')
      .select('*, markets(question, yes_price, no_price)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (tradeData) setTrades(tradeData)
    setFetching(false)
  }

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('users')
      .select('username, balance')
      .order('balance', { ascending: false })
      .limit(10)
    if (data) setLeaderboard(data)
  }

  const totalSpent = trades.reduce((s, t) => s + t.amount, 0)
  const yesCount = trades.filter(t => t.side === 'YES').length
  const noCount = trades.filter(t => t.side === 'NO').length
  const initialBalance = 1000000
  const pnl = user ? user.balance - initialBalance : 0

  if (loading || !user) return null

  return (
    <>
      <Head>
        <title>Portfolio — PredMarket</title>
      </Head>
      <div className="min-h-screen bg-[#0D0F14]">
        <Navbar />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight">My Portfolio</h1>
            <p className="text-[#6B7280] mt-1 font-mono text-sm">{user.username}</p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Balance', value: formatRupees(user.balance), color: 'text-white', mono: true },
              {
                label: 'P&L',
                value: `${pnl >= 0 ? '+' : ''}${formatRupees(pnl)}`,
                color: pnl >= 0 ? 'text-emerald-400' : 'text-red-400',
                mono: true
              },
              { label: 'Total Trades', value: trades.length, color: 'text-white', mono: false },
              { label: 'Total Spent', value: formatRupees(totalSpent), color: 'text-[#6B7280]', mono: true },
            ].map(({ label, value, color, mono }) => (
              <div key={label} className="card p-4 rounded-xl">
                <div className="text-[10px] text-[#6B7280] uppercase tracking-widest mb-1">{label}</div>
                <div className={`text-lg font-black ${color} ${mono ? 'font-mono' : ''}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* YES / NO split */}
          {trades.length > 0 && (
            <div className="card rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2 text-xs text-[#6B7280] font-mono">
                <span>YES trades: {yesCount}</span>
                <span>NO trades: {noCount}</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden gap-px">
                <div
                  className="bg-emerald-400 transition-all"
                  style={{ width: `${trades.length ? (yesCount / trades.length) * 100 : 50}%` }}
                />
                <div className="bg-red-400 flex-1" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Trade history */}
            <div className="lg:col-span-2">
              <div className="card rounded-2xl p-5">
                <h2 className="text-base font-bold text-white mb-4">Trade History</h2>

                {fetching ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-14 bg-[#0D0F14] rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : trades.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">📊</div>
                    <div className="text-[#6B7280] text-sm">No trades yet</div>
                    <Link href="/markets" className="inline-block mt-3 text-[#1652F0] text-sm hover:underline">
                      Browse Markets →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {trades.map((trade) => {
                      const name = trade.markets?.question?.replace(' will cry on farewell speech?', '') || '—'
                      return (
                        <div key={trade.id} className="flex items-center justify-between py-3 border-b border-[#1E2330] last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                              trade.side === 'YES'
                                ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50'
                                : 'bg-red-900/30 text-red-400 border border-red-800/50'
                            }`}>
                              {trade.side[0]}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{name}</div>
                              <div className="text-[10px] text-[#6B7280] font-mono">
                                {new Date(trade.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-bold font-mono ${trade.side === 'YES' ? 'text-emerald-400' : 'text-red-400'}`}>
                              -{formatRupees(trade.amount)}
                            </div>
                            <div className="text-[10px] text-[#6B7280]">Buy {trade.side}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Leaderboard */}
            <div>
              <div className="card rounded-2xl p-5">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  🏆 Leaderboard
                </h2>
                <div className="space-y-2">
                  {leaderboard.map((u, i) => (
                    <div key={u.username} className={`flex items-center justify-between py-2 px-3 rounded-lg ${u.username === user.username ? 'bg-[#1652F0]/10 border border-[#1652F0]/20' : ''}`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`text-xs font-mono w-4 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-[#6B7280]'}`}>
                          {i + 1}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-[#1E2330] flex items-center justify-center text-xs font-bold text-[#6B7280]">
                          {u.username[0]}
                        </div>
                        <span className={`text-xs font-medium ${u.username === user.username ? 'text-[#1652F0]' : 'text-white'}`}>
                          {u.username}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400">{formatRupees(u.balance)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
