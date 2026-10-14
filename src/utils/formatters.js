export const formatCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency
  }).format(amount)

export const formatDate = (date) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date))

export const formatDateTime = (date) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date))

export const formatRemainingTime = (date) => {
  if (!date) return ''
  const diff = new Date(date).getTime() - Date.now()
  if (diff <= 0) return 'Unlocking now'

  const totalMinutes = Math.floor(diff / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) {
    return hours > 0 ? `in ${days}d ${hours}h` : `in ${days}d`
  }
  if (hours > 0) {
    return minutes > 0 ? `in ${hours}h ${minutes}m` : `in ${hours}h`
  }
  return minutes > 0 ? `in ${minutes}m` : 'in less than a minute'
}

export const formatUnlockTime = (date) => {
  if (!date) return ''
  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) return ''
  const timeStr = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(parsed)

  const remaining = formatRemainingTime(date)
  return remaining ? `${timeStr} (${remaining})` : timeStr
}

export const formatRelativeTime = (date) => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`

  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`

  return `${Math.floor(hrs / 24)}d ago`
}

export const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}