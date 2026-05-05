export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatSalaryRange(min?: number, max?: number, currency = 'ILS'): string {
  if (!min && !max) return '—'
  const fmt = (n: number) => n.toLocaleString('en-US')
  const symbol = currency === 'ILS' ? '₪' : currency === 'USD' ? '$' : currency
  if (min && max) return `${symbol}${fmt(min)} – ${symbol}${fmt(max)}`
  if (min) return `From ${symbol}${fmt(min)}`
  return `Up to ${symbol}${fmt(max!)}`
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '…'
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}
