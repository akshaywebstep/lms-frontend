import API_CONFIG from '../config/api.config'

export const resolveMediaUrl = (url = '') => {
  if (!url) return ''
  const backendBase = API_CONFIG.BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '')

  // Route legacy shipowl upload URLs through active backend /uploads
  if (url.includes('shipowl.io/uploads/')) {
    const filename = url.split('/uploads/')[1]
    if (filename) return `${backendBase}/uploads/${filename}`
  }

  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url

  const path = url.startsWith('/') ? url : `/${url}`
  return `${backendBase}${path}`
}