import { getRefreshToken, getActiveRole } from '../utils/storage'
import api from './api'

const authService = {
  login: (credentials = {}) => {
    const role = (credentials.role || '').toLowerCase()
    if (role === 'admin' || role === 'superadmin' || role === 'super_admin') {
      return api.post('/auth/admin/login', credentials)
    }
    if (role === 'coach') {
      return api.post('/auth/coach/login', credentials)
    }
    return api.post('/auth/student/login', credentials)
  },

  register: (data) => {
    let role = ''
    if (data instanceof FormData) {
      role = (data.get('role') || '').toLowerCase()
    } else if (data && typeof data === 'object') {
      role = (data.role || '').toLowerCase()
    }
    const isCoach = role === 'coach'
    const endpoint = isCoach ? '/auth/coach/register' : '/auth/student/register'
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    return api.post(endpoint, data, config)
  },

  logout: () =>
    api.post('/auth/logout', {
      refreshToken: getRefreshToken(),
    }),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token, password) =>
    api.post('/auth/reset-password', { token, password }),

  verifyEmail: (token) =>
    api.post('/auth/verify-email', { token }),

  getMe: () => {
    const role = (getActiveRole() || '').toLowerCase()
    if (role === 'admin' || role === 'superadmin' || role === 'super_admin') {
      return api.get('/auth/admin/me')
    }
    if (role === 'coach') {
      return api.get('/auth/coach/me')
    }
    return api.get('/auth/student/me')
  },

  refreshToken: () =>
    api.post('/auth/refresh-token', {
      refreshToken: getRefreshToken(),
    }),

  changePassword: ({ oldPassword, newPassword }) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),

  requestPasswordOtp: (email) =>
    api.post('/auth/request-password-otp', { email }),

  changePasswordWithOtp: ({ email, otp, newPassword }) =>
    api.post('/auth/change-password-with-otp', { email, otp, newPassword }),
}

export default authService
