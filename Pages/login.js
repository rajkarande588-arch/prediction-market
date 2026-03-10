import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useAuth } from '../lib/auth'

const TICKER_ITEMS = [
  { name: 'Abhishek', yes: 70.0, up: true },
  { name: 'Anmol', yes: 30.0, up: false },
  { name: 'Arihant', yes: 70.0, up: true },
  { name: 'Saina', yes: 55.0, up: true },
  { name: 'Dev', yes: 42.0, up: false },
  { name: 'Dhruv C', yes: 70.0, up: true },
  { name: 'Esther', yes: 65.0, up: true },
  { name: 'Hemang', yes: 38.0, up: false },
  { name: 'Hriday', yes: 70.0, up: true },
  { name: 'Jatin', yes: 50.0, up: false },
  { name: 'Bilal', yes: 70.0, up: true },
  { name: 'Palak', yes: 60.0, up: true },
  { name: 'Parth', yes: 45.0, up: false },
  { name: 'Raj', yes: 70.0, up: true },
]

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { login, user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && user) router.replace('/markets')
  }, [user, authLoading])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim()) { setError('Please enter your name'); return }
    if (!password) { setError('Please enter the password'); return }
    setLoading(true)
    try {
      await login(username.trim(), password)
      router.push('/markets')
    } catch (err) {
      setError(err.message || 'Login failed. Check your name and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Login — PredMarket</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0D0F14; }

        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(1.8); }
        }

        .pm-input {
          width: 100%;
          background: #0D0F14;
          border: 1px solid #1E2330;
          border-radius: 10px;
          padding: 13px 16px;
          color: #F1F5F9;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .pm-input:focus {
          border-color: #1652F0;
          box-shadow: 0 0 0 3px rgba(22,82,240,0.18);
        }
        .pm-input::placeholder { color: #374151; }

        .pm-btn {
          width: 100%;
          background: #1652F0;
          color: white;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 15px;
          border: none;
          border-radius: 12px;
          padding: 15px;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
          box-shadow: 0 4px 24px rgba(22,82,240,0.35);
        }
        .pm-btn:hover:not(:disabled) {
          background: #1a5ef5;
          box-shadow: 0 6px 28px rgba(22,82,240,0.45);
        }
        .pm-btn:active:not(:disabled) { transform: scale(0.98); }
        .pm-btn:disabled { opacity: 0.45; cursor: not-allowed; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        fontFamily: "'Syne', sans-serif",
        background: `
          radial-gradient(ellipse at 18% 50%, rgba(22,82,240,0.14) 0%, transparent 58%),
          radial-gradient(ellipse at 82% 18%, rgba(0,194,120,0.09) 0%, transparent 58%),
          radial-gradient(ellipse at 60% 82%, rgba(255,77,77,0.07) 0%, transparent 50%),
          #0D0F14
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Glow blobs */}
        <div style={{ position:'absolute', top:'22%', left:'15%', width:'360px', height:'360px', borderRadius:'50%', background:'rgba(22,82,240,0.07)', filter:'blur(90px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'25%', right:'15%', width:'260px', height:'260px', borderRadius:'50%', background:'rgba(0,194,120,0.05)', filter:'blur(80px)', pointerEvents:'none' }} />

        {/* Ticker tape */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '34px',
          background: '#141720',
          borderBottom: '1px solid #1E2330',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}>
          <div style={{
            display: 'flex', gap: '40px',
            animation: 'ticker 32s linear infinite',
            whiteSpace: 'nowrap',
          }}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} style={{
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#6B7280',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
              }}>
                <span style={{ color: item.up ? '#00C278' : '#FF4D4D', fontSize: '7px' }}>●</span>
                <span style={{ color: '#9CA3AF' }}>{item.name}</span>
                <span style={{ color: item.up ? '#00C278' : '#FF4D4D', fontWeight: 600 }}>{item.yes}%</span>
              </span>
            ))}
          </div>
        </div>

        {/* Card container */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          marginTop: '34px',
          animation: 'fadeSlideUp 0.5s ease-out',
        }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '46px', height: '46px',
                background: 'linear-gradient(135deg, #1652F0, #0f3ec7)',
                borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(22,82,240,0.4)',
              }}>
                <span style={{ color: 'white', fontWeight: 900, fontSize: '17px' }}>PM</span>
              </div>
              <span style={{ fontWeight: 900, fontSize: '28px', color: 'white', letterSpacing: '-0.5px' }}>
                Pred<span style={{ color: '#1652F0' }}>Market</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%', background: '#00C278',
                animation: 'livePulse 2s ease-in-out infinite',
              }} />
              <span style={{ color: '#6B7280', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
                MFT FAREWELL PREDICTION MARKET
              </span>
            </div>
          </div>

          {/* Login card */}
          <div style={{
            background: '#141720',
            border: '1px solid #1E2330',
            borderRadius: '22px',
            padding: '36px 32px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
          }}>
            <h1 style={{ color: 'white', fontWeight: 800, fontSize: '24px', marginBottom: '4px', letterSpacing: '-0.3px' }}>
              Welcome back
            </h1>
            <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '32px' }}>
              Trade outcomes. Win bragging rights.
            </p>

            <form onSubmit={handleLogin}>

              {/* Name field */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{
                  display: 'block', fontSize: '11px', color: '#6B7280',
                  textTransform: 'uppercase', letterSpacing: '0.09em',
                  fontWeight: 700, marginBottom: '8px',
                }}>
                  Your Name
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Raj, Parth Shah, Anmol..."
                  className="pm-input"
                  autoFocus
                  autoComplete="off"
                />
              </div>

              {/* Password field */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block', fontSize: '11px', color: '#6B7280',
                  textTransform: 'uppercase', letterSpacing: '0.09em',
                  fontWeight: 700, marginBottom: '8px',
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pm-input"
                    style={{ paddingRight: '56px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute', right: '14px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      color: '#4B5563', cursor: 'pointer',
                      fontSize: '10px', fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600, letterSpacing: '0.05em',
                    }}
                  >
                    {showPass ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div style={{
                  background: 'rgba(255,77,77,0.08)',
                  border: '1px solid rgba(255,77,77,0.25)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: '#FF6B6B',
                  fontSize: '13px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="pm-btn" disabled={loading}>
                {loading ? 'Signing in...' : 'Enter the Market →'}
              </button>
            </form>

            {/* Bottom stats */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: '0', marginTop: '28px', paddingTop: '24px',
              borderTop: '1px solid #1E2330', textAlign: 'center',
            }}>
              {[
                { value: '28', label: 'Markets' },
                { value: '₹10L', label: 'Each' },
                { value: 'LIVE', label: 'Status' },
              ].map(({ value, label }, i) => (
                <div key={label} style={{
                  borderRight: i < 2 ? '1px solid #1E2330' : 'none',
                  padding: '0 8px',
                }}>
                  <div style={{
                    color: i === 2 ? '#00C278' : 'white',
                    fontWeight: 800, fontSize: '20px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {value}
                  </div>
                  <div style={{
                    color: '#4B5563', fontSize: '10px',
                    textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: '3px',
                  }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p style={{
            textAlign: 'center', color: '#374151', fontSize: '11px',
            marginTop: '16px', fontFamily: "'JetBrains Mono', monospace",
          }}>
            Paper trading only · No real money involved
          </p>
        </div>
      </div>
    </>
  )
}
