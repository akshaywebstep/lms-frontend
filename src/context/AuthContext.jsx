/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import authService from '../services/authService'
import {
  setToken, setRefreshToken, setUser,
  getUser, getToken, clearAuth, getActiveRole,
} from '../utils/storage'
import { getRoleRedirect } from '../utils/helpers'

const AuthContext = createContext(null)

// On tab load/refresh, get user corresponding to current URL/active tab role
const getInitialUser = () => {
  const activeRole = getActiveRole()
  const activeUser = getUser(activeRole)
  const activeToken = getToken(activeRole)
  if (activeUser && activeToken) return activeUser

  for (const role of ['superadmin', 'coach', 'student']) {
    const storedUser = getUser(role)
    const storedToken = getToken(role)
    if (storedUser && storedToken) return storedUser
  }
  return null
}

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(getInitialUser)
  const [loading, setLoading] = useState(Boolean(getInitialUser()))

  useEffect(() => {
    const currentUser = getInitialUser()
    if (!currentUser) { setLoading(false); return }

    authService.getMe()
      .then((res) => {
        const u = res.user
        setUser(u.role, u)
        setUserState(u)
      })
      .catch(() => {
        if (currentUser?.role) clearAuth(currentUser.role)
        setUserState(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const applySession = useCallback((session) => {
    const { user: u, accessToken, refreshToken } = session
    setToken(u.role, accessToken)
    setRefreshToken(u.role, refreshToken)
    setUser(u.role, u)
    setUserState(u)
    return u
  }, [])

  const login = useCallback(async (credentials) => {
    const session = await authService.login(credentials)
    return applySession(session)
  }, [applySession])

  const register = useCallback(async (formData) => {
    const session = await authService.register(formData)
    return applySession(session)
  }, [applySession])

  const updateUser = useCallback((nextUser) => {
    if (nextUser?.role) setUser(nextUser.role, nextUser)
    setUserState(nextUser)
    return nextUser
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      if (user?.role) clearAuth(user.role)
      setUserState(null)
    }
  }, [user])

  const isRole = useCallback((role) => user?.role === role, [user])
  const isAuthenticated = Boolean(user && user.role && getToken(user.role))

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isRole,
        isAuthenticated,
        getRoleRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export default AuthContext
