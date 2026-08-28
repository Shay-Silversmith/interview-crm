// ---------------------------------------------------------------------------
// InterviewFlow — companyLogo.ts
// Resolving a company's logo without an API key or an AI call.
//
// Clearbit's logo API — the usual choice for this — is dead: every one of the
// ten domains in this workspace returns an error from it. Google's favicon
// service answered for all ten, so that is the primary. DuckDuckGo returns a
// sharper icon for some brands, so it is tried first and Google catches the
// misses.
//
// Nothing here fetches on its own: these are just <img> URLs, and CompanyLogo
// walks the list on error before falling back to initials.
// ---------------------------------------------------------------------------

/** Pull a bare hostname out of whatever the user typed in the website field. */
export function domainFromWebsite(website?: string | null): string | undefined {
  const raw = (website ?? '').trim()
  if (!raw) return undefined
  try {
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    const host = new URL(withScheme).hostname.toLowerCase()
    return host.replace(/^www\./, '') || undefined
  } catch {
    return undefined
  }
}

/**
 * Last resort when a company was created by typing only its name.
 * Deliberately naive — "Wiz" guesses wiz.com when the real site is wiz.io — but
 * a wrong guess costs nothing: the image 404s and we land on initials. Setting
 * the website on the company replaces the guess with the real domain.
 */
export function guessDomainFromName(name?: string | null): string | undefined {
  const slug = (name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return slug.length >= 2 ? `${slug}.com` : undefined
}

export const googleFavicon = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`

export const duckDuckGoIcon = (domain: string) =>
  `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`

/**
 * Ordered logo candidates for a company, best first.
 * An explicit logoUrl always wins — it is the manual override.
 */
export function logoCandidates(opts: {
  logoUrl?: string | null
  website?: string | null
  name?: string | null
}): string[] {
  const out: string[] = []
  const explicit = (opts.logoUrl ?? '').trim()
  if (explicit) out.push(explicit)

  const domain = domainFromWebsite(opts.website) ?? guessDomainFromName(opts.name)
  if (domain) {
    out.push(duckDuckGoIcon(domain))
    out.push(googleFavicon(domain))
  }
  return out
}

/** The single URL to persist on a company row. */
export function resolveLogoUrl(opts: { website?: string | null; name?: string | null }): string | undefined {
  const domain = domainFromWebsite(opts.website) ?? guessDomainFromName(opts.name)
  return domain ? googleFavicon(domain) : undefined
}
