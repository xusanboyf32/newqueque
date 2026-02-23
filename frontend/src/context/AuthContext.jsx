import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI, tokenStorage } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(tokenStorage.getUser())
  const [loading, setLoading] = useState(!!tokenStorage.getAccess())

  // App ochilganda tokenni tekshirish
  useEffect(() => {
    if (!tokenStorage.getAccess()) { setLoading(false); return }
    authAPI.me()
      .then((u) => { setUser(u); tokenStorage.setUser(u) })
      .catch(() => { tokenStorage.clear(); setUser(null) })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (credentials) => {
    const data = await authAPI.login(credentials)
    tokenStorage.setTokens(data.tokens.access, data.tokens.refresh)
    tokenStorage.setUser(data.user)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (formData) => {
    const data = await authAPI.register(formData)
    tokenStorage.setTokens(data.tokens.access, data.tokens.refresh)
    tokenStorage.setUser(data.user)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await authAPI.logout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuth: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

