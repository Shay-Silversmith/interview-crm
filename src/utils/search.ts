export function matchesSearch<T extends Record<string, unknown>>(
  item: T,
  query: string,
  fields: (keyof T)[]
): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase()
  return fields.some(field => {
    const val = item[field]
    if (typeof val === 'string') return val.toLowerCase().includes(q)
    return false
  })
}
