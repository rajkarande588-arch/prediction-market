import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/auth'
import Head from 'next/head'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) router.replace('/markets')
  }, [user])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim()) { setError('Enter your name'); return }
    setLoading(true)
    try {
      await login(username.trim(), password)
      router.push('/markets')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Login — PredMarket</title>
      </Head>
      <div className="login-bg min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">

        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-[#1652F0]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full bg-[#00C278]/8 blur-3xl pointer-events-none" />

        {/* Ticker tape */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-[#141720] border-b border-[#1E2330] overflow-hidden flex items-center">
          <div className="ticker-content flex gap-12 text-[10px] font-mono text-[#6B7280]">
            {['Abhishek 70.0% YES', 'Anmol 30.0% NO', 'Arihant 70.0% YES', 'Saina 30.0% YES', 'Dev 70.0% NO', 'Dhruv C 45.0% YES', 'Hemang 62.0% YES', 'Jatin 38.0% NO', 'Bilal 55.0% YES', 'Parth 70.0% YES'].map((t, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className={i % 2 === 0 ? 'text-emerald-400' : 'text-red-400'}>●</span>
                {t}
              </span>
            ))}
            {['Abhishek 70.0% YES', 'Anmol 30.0% NO', 'Arihant 70.0% YES', 'Saina 30.0% YES', 'Dev 70.0% NO', 'Dhruv C 45.0% YES', 'Hemang 62.0% YES', 'Jatin 38.0% NO', 'Bilal 55.0% YES', 'Parth 70.0% YES'].map((t, i) => (
              <span key={`dup-${i}`} className="flex items-center gap-2">
                <span className={i % 2 === 0 ? 'text-emerald-400' : 'text-red-400'}>●</span>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Login card */}
        <div className="relative w-full max-w-sm animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#1652F0] flex items-center justify-center">
                <span className="text-white font-black text-base">PM</span>
              </div>
              <span className="font-black text-2xl tracking-tight">
                Pred<span className="text-[#1652F0]">Market</span>
              </span>
            </div>
            <p className="text-[#6B7280] text-sm">MFT Farewell Prediction Market</p>
          </div>

          <div className="card p-6 rounded-2xl shadow-2xl shadow-black/50">
            <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
            <p className="text-[#6B7280] text-sm mb-6">Trade outcomes. Win bragging rights.</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-[#6B7280] mb-1.5 block font-medium tracking-wide uppercase">
                  Your Name
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Abhishek Mandot"
                  className="input-field"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-[#6B7280] mb-1.5 block font-medium tracking-wide uppercase">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="input-field"
                />
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Enter the Market →'}
              </button>
            </form>

            {/* Stats row */}
            <div className="mt-6 pt-5 border-t border-[#1E2330] grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Markets', value: '28' },
                { label: 'Starting ₹', value: '10L' },
                { label: 'Live', value: '🔴' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-white font-bold text-base font-mono">{value}</div>
                  <div className="text-[#6B7280] text-[10px] uppercase tracking-wider">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-[#6B7280] text-xs mt-4">
            Paper trading only · No real money involved
          </p>
        </div>
      </div>
    </>
  )
}
