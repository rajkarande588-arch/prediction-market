import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for persisted session
    const stored = localStorage.getItem('pm_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch (_) {}
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    if (password !== 'MFT') {
      throw new Error('Invalid password')
    }

    // Look up user by username
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !data) {
      throw new Error('User not found')
    }

    localStorage.setItem('pm_user', JSON.stringify(data))
    setUser(data)
    return data
  }

  const logout = () => {
    localStorage.removeItem('pm_user')
    setUser(null)
  }

  const refreshUser = async () => {
    if (!user) return
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data) {
      setUser(data)
      localStorage.setItem('pm_user', JSON.stringify(data))
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
