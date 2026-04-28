import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null })

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const userRaw = localStorage.getItem('auth_user')
    if (token && userRaw) {
      try {
        setState({ token, user: JSON.parse(userRaw) as User })
      } catch {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }
  }, [])

  function login(token: string, user: User) {
    setState({ token, user })
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
  }

  function logout() {
    setState({ token: null, user: null })
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  function updateUser(user: User) {
    setState((prev) => ({ ...prev, user }))
    localStorage.setItem('auth_user', JSON.stringify(user))
  }

  return (
    <AuthContext.Provider
      value={{ ...state, isAuthenticated: !!state.token, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
