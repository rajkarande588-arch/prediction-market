import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { formatRupees, formatPrice } from '../../lib/markets'
import Navbar from '../../components/Navbar'
import TradeModal from '../../components/TradeModal'

export default function MarketPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { id } = router.query

  const [market, setMarket] = useState(null)
  const [trades, setTrades] = useState([])
  const [fetching, setFetching] = useState(true)
  const [tradeModal, setTradeModal] = useState(null) // 'YES' | 'NO' | null
  const [priceHistory, setPriceHistory] = useState([])
  const prevPriceRef = useRef(null)
  const cardRef = useRef(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading])

  useEffect(() => {
    if (!id || !user) return
    fetchMarket()
    fetchTrades()
    const cleanup = subscribeToMarket()
    return cleanup
  }, [id, user])

  const fetchMarket = async () => {
    const { data } = await supabase.from('markets').select('*').eq('id', id).single()
    if (data) {
      setMarket(data)
      prevPriceRef.current = data.yes_price
      setPriceHistory(prev => [...prev, { time: new Date().toLocaleTimeString(), yes: data.yes_price, no: data.no_price }])
    }
    setFetching(false)
  }

  const fetchTrades = async () => {
    const { data } = await supabase
      .from('trades')
      .select('*, users(username)')
      .eq('market_id', id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setTrades(data)
  }

  const subscribeToMarket = () => {
    const channel = supabase
      .channel(`market-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'markets',
        filter: `id=eq.${id}`,
      }, (payload) => {
        const prev = prevPriceRef.current
        const next = payload.new.yes_price
        setMarket(payload.new)
        setPriceHistory(ph => [...ph.slice(-19), {
          time: new Date().toLocaleTimeString(),
          yes: payload.new.yes_price,
          no: payload.new.no_price,
        }])

        // Flash animation
        if (cardRef.current) {
          const cls = next > prev ? 'flash-green' : 'flash-red'
          cardRef.current.classList.add(cls)
          setTimeout(() => cardRef.current?.classList.remove(cls), 800)
        }
        prevPriceRef.current = next
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'trades',
        filter: `market_id=eq.${id}`,
      }, () => {
        fetchTrades()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }

  if (loading || !user || fetching || !market) {
    return (
      <div className="min-h-screen bg-[#0D0F14] flex items-center justify-center">
        <div className="text-[#6B7280] font-mono text-sm animate-pulse">Loading market...</div>
      </div>
    )
  }

  const name = market.question.replace(' will cry on farewell speech?', '')
  const yesPercent = (market.yes_price / 10).toFixed(1)
  const noPercent = (market.no_price / 10).toFixed(1)

  return (
    <>
      <Head>
        <title>{market.question} — PredMarket</title>
      </Head>
      <div className="min-h-screen bg-[#0D0F14]">
        <Navbar />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-6 font-mono">
            <Link href="/markets" className="hover:text-white transition-colors">Markets</Link>
            <span>/</span>
            <span className="text-white">{name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Market info + trading */}
            <div className="lg:col-span-2 space-y-4">

              {/* Market header card */}
              <div ref={cardRef} className="card rounded-2xl p-6 transition-colors duration-300">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1652F0]/30 to-[#1652F0]/5 border border-[#1652F0]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#1652F0] font-black text-lg">{name[0]}</span>
                    </div>
                    <div>
                      <h1 className="text-xl font-black text-white leading-tight">{market.question}</h1>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
                        <span className="text-emerald-400 text-xs font-mono">LIVE</span>
                        <span className="text-[#6B7280] text-xs">·</span>
                        <span className="text-[#6B7280] text-xs font-mono">Vol: {formatRupees(market.volume)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Big price display */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-emerald-900/10 border border-emerald-800/30 rounded-xl p-4 text-center">
                    <div className="text-emerald-400 text-xs font-mono uppercase tracking-wider mb-1">YES</div>
                    <div className="text-emerald-400 font-black text-4xl font-mono">{yesPercent}%</div>
                    <div className="text-[#6B7280] text-xs font-mono mt-1">₹{market.yes_price} / share</div>
                  </div>
                  <div className="bg-red-900/10 border border-red-800/30 rounded-xl p-4 text-center">
                    <div className="text-red-400 text-xs font-mono uppercase tracking-wider mb-1">NO</div>
                    <div className="text-red-400 font-black text-4xl font-mono">{noPercent}%</div>
                    <div className="text-[#6B7280] text-xs font-mono mt-1">₹{market.no_price} / share</div>
                  </div>
                </div>

                {/* Price bar */}
                <div className="flex h-2 rounded-full overflow-hidden mb-5 gap-px">
                  <div className="bg-emerald-400 transition-all duration-700" style={{ width: `${yesPercent}%` }} />
                  <div className="bg-red-400 flex-1" />
                </div>

                {/* Trade buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTradeModal('YES')}
                    className="btn-yes py-4 text-base rounded-xl flex flex-col items-center gap-0.5"
                  >
                    <span className="font-black">Buy YES</span>
                    <span className="text-xs font-normal opacity-80">₹{market.yes_price} / share</span>
                  </button>
                  <button
                    onClick={() => setTradeModal('NO')}
                    className="btn-no py-4 text-base rounded-xl flex flex-col items-center gap-0.5"
                  >
                    <span className="font-black">Buy NO</span>
                    <span className="text-xs font-normal opacity-80">₹{market.no_price} / share</span>
                  </button>
                </div>
              </div>

              {/* Price history table */}
              {priceHistory.length > 1 && (
                <div className="card rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <span>Price History</span>
                    <span className="text-[10px] font-mono text-[#6B7280] bg-[#0D0F14] px-2 py-0.5 rounded">This session</span>
                  </h3>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {[...priceHistory].reverse().map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs font-mono py-1 border-b border-[#1E2330] last:border-0">
                        <span className="text-[#6B7280]">{p.time}</span>
                        <div className="flex gap-4">
                          <span className="text-emerald-400">YES {(p.yes / 10).toFixed(1)}%</span>
                          <span className="text-red-400">NO {(p.no / 10).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Activity feed */}
            <div className="space-y-4">
              <div className="card rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <span>Recent Trades</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
                </h3>

                {trades.length === 0 ? (
                  <div className="text-center py-8 text-[#6B7280] text-xs">
                    No trades yet. Be the first!
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {trades.map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between py-2 border-b border-[#1E2330] last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#1E2330] flex items-center justify-center text-xs font-bold text-[#6B7280]">
                            {trade.users?.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="text-xs text-white font-medium">{trade.users?.username || 'Anon'}</div>
                            <div className="text-[10px] text-[#6B7280] font-mono">
                              {new Date(trade.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-bold ${trade.side === 'YES' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trade.side}
                          </div>
                          <div className="text-[10px] text-[#6B7280] font-mono">{formatRupees(trade.amount)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Market info */}
              <div className="card rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">Market Details</h3>
                <div className="space-y-2.5 text-xs font-mono">
                  {[
                    ['Type', 'Binary'],
                    ['Price Range', '₹0 – ₹1000'],
                    ['Starting YES', '₹700 (70%)'],
                    ['Resolution', 'Farewell Day'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-[#6B7280]">{k}</span>
                      <span className="text-white">{v}</span>
                    </div>
                  ))}
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
            onClose={() => setTradeModal(null)}
            onTrade={() => {
              fetchMarket()
              fetchTrades()
            }}
          />
        )}
      </div>
    </>
  )
}
