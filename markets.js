import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import MarketCard from '../components/MarketCard'
import { formatRupees } from '../lib/markets'

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
    subscribeToMarkets()
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
      .channel('markets-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'markets',
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setMarkets((prev) =>
            prev.map((m) => (m.id === payload.new.id ? payload.new : m))
          )
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }

  const filteredMarkets = markets
    .filter((m) => m.question.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'volume') return b.volume - a.volume
      if (sortBy === 'yes_high') return b.yes_price - a.yes_price
      if (sortBy === 'yes_low') return a.yes_price - b.yes_price
      return a.question.localeCompare(b.question)
    })

  const totalVolume = markets.reduce((s, m) => s + (m.volume || 0), 0)
  const totalTrades = markets.length

  if (loading || !user) return null

  return (
    <>
      <Head>
        <title>Markets — PredMarket</title>
      </Head>
      <div className="min-h-screen bg-[#0D0F14]">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 live-dot" />
              <span className="text-emerald-400 text-xs font-mono uppercase tracking-widest">Live Markets</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              MFT Farewell Markets
            </h1>
            <p className="text-[#6B7280] mt-1">Who will cry? Trade your prediction.</p>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Active Markets', value: totalTrades, mono: false },
              { label: 'Total Volume', value: formatRupees(totalVolume), mono: true },
              { label: 'Your Balance', value: formatRupees(user.balance), mono: true, color: 'text-emerald-400' },
            ].map(({ label, value, mono, color }) => (
              <div key={label} className="card p-4 rounded-xl">
                <div className="text-[10px] text-[#6B7280] uppercase tracking-widest mb-1">{label}</div>
                <div className={`text-xl font-black ${color || 'text-white'} ${mono ? 'font-mono' : ''}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Search + sort */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              placeholder="Search markets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field flex-1"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field sm:w-44 bg-[#0D0F14] cursor-pointer"
            >
              <option value="name">Sort: Name</option>
              <option value="volume">Sort: Volume</option>
              <option value="yes_high">Sort: YES High</option>
              <option value="yes_low">Sort: YES Low</option>
            </select>
          </div>

          {/* Markets grid */}
          {fetching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card rounded-xl p-4 animate-pulse h-36">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-full bg-[#1E2330]" />
                    <div className="flex-1">
                      <div className="h-3 bg-[#1E2330] rounded mb-2 w-3/4" />
                      <div className="h-2 bg-[#1E2330] rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#1E2330] rounded mb-3" />
                  <div className="h-4 bg-[#1E2330] rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMarkets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
              {filteredMarkets.length === 0 && (
                <div className="col-span-full text-center py-16 text-[#6B7280]">
                  No markets match your search.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
