const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ─── Token storage ───────────────────────────────────────────────
export const tokenStorage = {
  getAccess:  () => localStorage.getItem('access_token'),
  getRefresh: () => localStorage.getItem('refresh_token'),
  getUser:    () => {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  },
  setTokens: (access, refresh) => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  },
  setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
  clear: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  },
}

// ─── Token refresh ────────────────────────────────────────────────
async function tryRefresh() {
  const refresh = tokenStorage.getRefresh()
  if (!refresh) return false
  try {
    const res = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    if (res.ok) {
      const data = await res.json()
      tokenStorage.setTokens(data.access, refresh)
      return true
    }
  } catch {
    return false
  }
  return false
}

// ─── Base fetch (tokenli) ─────────────────────────────────────────
export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  const token = tokenStorage.getAccess()
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    const ok = await tryRefresh()
    if (ok) {
      headers['Authorization'] = `Bearer ${tokenStorage.getAccess()}`
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
    } else {
      tokenStorage.clear()
      window.location.href = '/login'
      return
    }
  }
  return res
}

// ─── Auth API ─────────────────────────────────────────────────────
export const authAPI = {
  async login({ phone_number, password }) {
    const res = await fetch(`${BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number, password }),
    })
    const data = await res.json()
    if (!res.ok) throw data
    return data
  },

  async register(payload) {
    const res = await fetch(`${BASE_URL}/api/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw data
    return data
  },

  async logout() {
    const refresh = tokenStorage.getRefresh()
    if (refresh) {
      await apiFetch('/api/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
      })
    }
    tokenStorage.clear()
  },

  async me() {
    const res = await apiFetch('/api/auth/me/')
    if (!res || !res.ok) throw new Error('Unauthorized')
    return res.json()
  },
}