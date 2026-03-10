import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/auth'
import { formatRupees } from '../lib/markets'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const { user, logout, refreshUser } = useAuth()
  const router = useRouter()
  const [balance, setBalance] = useState(user?.balance || 0)

  useEffect(() => {
    if (!user) return
    setBalance(user.balance)

    // Subscribe to user balance changes
    const sub = supabase
      .channel(`user-balance-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        setBalance(payload.new.balance)
      })
      .subscribe()

    return () => supabase.removeChannel(sub)
  }, [user])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!user) return null

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1E2330] bg-[#0D0F14]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/markets" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md bg-[#1652F0] flex items-center justify-center">
              <span className="text-white font-black text-xs">PM</span>
            </div>
            <span className="font-black text-lg tracking-tight">
              Pred<span className="text-[#1652F0]">Market</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/markets" className={`nav-link ${router.pathname === '/markets' ? '!text-white' : ''}`}>
              Markets
            </Link>
            <Link href="/portfolio" className={`nav-link ${router.pathname === '/portfolio' ? '!text-white' : ''}`}>
              Portfolio
            </Link>
          </div>

          {/* Right side: balance + user */}
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
              LIVE
            </div>

            {/* Balance */}
            <div className="bg-[#141720] border border-[#1E2330] rounded-lg px-3 py-1.5">
              <div className="text-[10px] text-[#6B7280] font-mono uppercase tracking-wider">Balance</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">{formatRupees(balance)}</div>
            </div>

            {/* User */}
            <div className="bg-[#141720] border border-[#1E2330] rounded-lg px-3 py-1.5 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#1652F0]/20 flex items-center justify-center">
                <span className="text-[#1652F0] text-xs font-bold">{user.username?.[0]?.toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium hidden sm:block">{user.username}</span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="text-[#6B7280] hover:text-white transition-colors text-sm font-medium px-2 py-1"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
