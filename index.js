import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/auth'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/markets' : '/login')
    }
  }, [user, loading])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0F14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6B7280',
      fontFamily: 'monospace',
      fontSize: '14px',
    }}>
      Loading...
    </div>
  )
}
