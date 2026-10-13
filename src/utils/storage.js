import { LOCAL_KEYS, SHARED_KEYS } from './constants'

// Tab-isolated storage using sessionStorage with graceful localStorage fallback
export const storage = {
  get: (key) => {
    try {
      const item = sessionStorage.getItem(key) || localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },

  set: (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      return null
    }
  },

  remove: (key) => {
    try {
      sessionStorage.removeItem(key)
      localStorage.removeItem(key)
    } catch {}
  },

  clear: () => {
    try {
      sessionStorage.clear()
      localStorage.clear()
    } catch {}
  },
}

// Automatically detect active role from current URL path (/admin/*, /coach/*, /student/*)
export const getActiveRole = () => {
  if (typeof window === 'undefined') return 'student'
  const path = window.location.pathname.toLowerCase()
  if (path.includes('/admin')) return 'superadmin'
  if (path.includes('/coach')) return 'coach'
  if (path.includes('/student')) return 'student'

  // If on login/public page, find whichever role session is stored
  for (const r of ['superadmin', 'coach', 'student']) {
    if (storage.get(LOCAL_KEYS(r).TOKEN)) return r
  }
  return 'student'
}

// Role-isolated token helpers:
// Each tab keeps its own session and each role has its own isolated key
export const getToken = (role = getActiveRole()) => storage.get(LOCAL_KEYS(role).TOKEN)
export const setToken = (role = getActiveRole(), token) => storage.set(LOCAL_KEYS(role).TOKEN, token)
export const removeToken = (role = getActiveRole()) => storage.remove(LOCAL_KEYS(role).TOKEN)

export const getRefreshToken = (role = getActiveRole()) => storage.get(LOCAL_KEYS(role).REFRESH)
export const setRefreshToken = (role = getActiveRole(), token) => storage.set(LOCAL_KEYS(role).REFRESH, token)

export const getUser = (role = getActiveRole()) => storage.get(LOCAL_KEYS(role).USER)
export const setUser = (role = getActiveRole(), user) => storage.set(LOCAL_KEYS(role).USER, user)
export const removeUser = (role = getActiveRole()) => storage.remove(LOCAL_KEYS(role).USER)

export const clearAuth = (role = getActiveRole()) => {
  storage.remove(LOCAL_KEYS(role).TOKEN)
  storage.remove(LOCAL_KEYS(role).REFRESH)
  storage.remove(LOCAL_KEYS(role).USER)
}

// Shared (non-role) helpers
export const getTheme = () => storage.get(SHARED_KEYS.THEME)
export const setTheme = (val) => storage.set(SHARED_KEYS.THEME, val)
