// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/_lib/search.ts
// Web search for the research tools, independent of the LLM.
//
// Why this file exists at all: the research tools used to lean on Gemini's own
// `googleSearch` tool, and Google closed that door. A free-tier key is now
// refused grounding on every model it can reach — measured, not assumed:
//
//   gemini-3.6-flash / 3.8-flash / 3.5-flash / 3.1-flash-lite / flash-latest
//   / flash-lite-latest  →  plain: OK,  grounded: 429 RESOURCE_EXHAUSTED
//
// and gemini-2.5-flash, the one model that still had a free grounding
// allowance, answers 404 "no longer available to new users". There is no
// combination left that works on a key a user can get for free, which matters
// because every user of this app brings their own key.
//
// So the search comes from here instead, and the model only reads the results.
// That also makes the app's fate independent of one vendor's pricing page —
// which is the other lesson, since Brave withdrew its own free tier in
// February 2026 while this was being written.
//
// The key belongs to whoever deploys the app, lives in a server-side env var,
// and is shared by every user. Their own LLM key stays BYOK.
// ---------------------------------------------------------------------------

export interface SearchHit {
  title: string
  url:   string
  /** Page text or snippet — whatever the provider gives for free. */
  text:  string
  publishedDate?: string
}

export interface SearchOutcome {
  hits:     SearchHit[]
  provider: string
}

/**
 * No search provider is configured on the server.
 *
 * No longer thrown by webSearch, which falls back to a keyless search instead;
 * kept because the error-reporting code and the UI still recognise it.
 */
export class SearchUnavailableError extends Error {
  constructor() {
    super(
      'Web search is not configured on this deployment, so the research tools ' +
      'cannot run. Set one of EXA_API_KEY, TAVILY_API_KEY or ' +
      'BRAVE_SEARCH_API_KEY in the server environment. The tools that do not ' +
      'search the web are unaffected.',
    )
    this.name = 'SearchUnavailableError'
  }
}

/** Thrown when every query failed, so there is nothing for the model to read. */
export class SearchFailedError extends Error {
  constructor(provider: string, cause: string) {
    super(`Web search through ${provider} failed: ${cause}`)
    this.name = 'SearchFailedError'
  }
}

// ---------------------------------------------------------------------------
// Providers
//
// Ordered by what a person distributing this app can actually rely on, which
// is not the same as which is best at searching:
//
//   Exa    — 20,000 requests/month free, no payment method on file, so it
//            cannot surprise the account holder with a bill. First choice.
//   Tavily — 1,000 credits/month free, also no card.
//   Brave  — no free tier since February 2026: $5 of monthly credit and then
//            the card on file is charged, with no cap. Supported because a key
//            may already exist, but never the default.
//
// Whichever key is present wins, in that order. With none, see the keyless
// fallback below.
// ---------------------------------------------------------------------------

interface Provider {
  name:   string
  envVar: string
  run:    (key: string, query: string, perQuery: number) => Promise<SearchHit[]>
}

const EXA: Provider = {
  name:   'Exa',
  envVar: 'EXA_API_KEY',
  async run(key, query, perQuery) {
    const res = await postJSON('https://api.exa.ai/search', {
      headers: { 'x-api-key': key },
      body: {
        query,
        numResults: perQuery,
        type:       'auto',
        // Page text, not just a link. Capped because several results times
        // several queries is the model's whole prompt otherwise.
        contents:   { text: { maxCharacters: 2_000 } },
      },
    })
    const results = (res as { results?: unknown[] }).results ?? []
    return results.map(r => {
      const x = r as Record<string, string>
      return {
        title: x.title ?? '',
        url:   x.url   ?? '',
        text:  x.text  ?? '',
        publishedDate: x.publishedDate,
      }
    })
  },
}

const TAVILY: Provider = {
  name:   'Tavily',
  envVar: 'TAVILY_API_KEY',
  async run(key, query, perQuery) {
    const res = await postJSON('https://api.tavily.com/search', {
      headers: { authorization: `Bearer ${key}` },
      body:    { query, max_results: perQuery, search_depth: 'basic' },
    })
    const results = (res as { results?: unknown[] }).results ?? []
    return results.map(r => {
      const x = r as Record<string, string>
      return {
        title: x.title ?? '',
        url:   x.url   ?? '',
        text:  x.content ?? '',
        publishedDate: x.published_date,
      }
    })
  },
}

const BRAVE: Provider = {
  name:   'Brave',
  envVar: 'BRAVE_SEARCH_API_KEY',
  async run(key, query, perQuery) {
    const url = 'https://api.search.brave.com/res/v1/web/search' +
      `?q=${encodeURIComponent(query)}&count=${perQuery}&extra_snippets=true`
    const res = await getJSON(url, { 'X-Subscription-Token': key })
    const results = ((res as { web?: { results?: unknown[] } }).web?.results) ?? []
    return results.map(r => {
      const x = r as Record<string, unknown>
      const extra = Array.isArray(x.extra_snippets) ? (x.extra_snippets as string[]) : []
      return {
        title: String(x.title ?? ''),
        url:   String(x.url   ?? ''),
        // Brave gives a short description plus optional extra snippets; joined
        // they are roughly what the other two return as page text.
        text:  [x.description, ...extra].filter(Boolean).join('\n'),
        publishedDate: typeof x.page_age === 'string' ? x.page_age : undefined,
      }
    })
  },
}

const PROVIDERS = [EXA, TAVILY, BRAVE]

// ---------------------------------------------------------------------------
// Keyless fallback
//
// Every provider above needs a key someone has to sign up for, and a deployment
// without one — or with the placeholder from .env.example still in place, which
// Exa answers with 401 — left every research tool dead while the user's Gemini
// key was fine. DuckDuckGo's HTML endpoint needs no key, so it is the floor:
// used when no key is set, and when the keyed provider returns nothing.
//
// It is a floor, not a peer. It returns one-line snippets rather than page
// text, so the top results are fetched directly to give the model something to
// read; and it is an HTML page, not an API, so it can change shape or refuse a
// datacenter address without notice. A real key is still the better setup.
// ---------------------------------------------------------------------------

const KEYLESS_NAME = 'DuckDuckGo'

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

async function duckDuckGo(query: string, perQuery: number): Promise<SearchHit[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12_000)

  const res = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    { signal: controller.signal, headers: { 'user-agent': BROWSER_UA, accept: 'text/html' } },
  ).finally(() => clearTimeout(timer))

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  const hits: SearchHit[] = []
  for (const block of html.split('class="result__a"').slice(1)) {
    // Result links are redirects carrying the real address in `uddg`.
    const href  = block.match(/href="([^"]+)"/)?.[1] ?? ''
    const uddg  = href.match(/[?&]uddg=([^&]+)/)?.[1]
    const title = block.match(/>([\s\S]*?)<\/a>/)?.[1] ?? ''
    const text  = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? ''
    if (!uddg) continue

    let url: string
    try { url = decodeURIComponent(uddg.replace(/&amp;.*$/, '')) } catch { continue }
    // Sponsored results route through DuckDuckGo's own ad redirect.
    if (!/^https?:\/\//.test(url) || url.includes('duckduckgo.com/y.js')) continue

    hits.push({ title: htmlToText(title), url, text: htmlToText(text) })
    if (hits.length >= perQuery) break
  }

  // A 200 with no results is how a bot check looks from here.
  if (hits.length === 0 && /anomaly|challenge/i.test(html)) {
    throw new Error('DuckDuckGo refused the request as automated')
  }
  return hits
}

/**
 * Swaps snippets for page text on the first few hits.
 *
 * Headcount, HQ and product detail live on the page, not in a one-line
 * snippet. Pages that will not load keep their snippet — LinkedIn and
 * Glassdoor never load, and their snippets are often the useful part.
 */
async function enrichWithPageText(hits: SearchHit[], count = 3): Promise<SearchHit[]> {
  const pages = await Promise.all(
    hits.slice(0, count).map(h => fetchPageText(h.url, 2_500, 6_000)),
  )
  return hits.map((h, i) =>
    pages[i] && pages[i].length > 200 ? { ...h, text: `${h.text}
${pages[i]}` } : h,
  )
}

async function keylessSearch(queries: string[], perQuery: number, maxHits: number): Promise<SearchHit[]> {
  const hits: SearchHit[] = []
  const seen = new Set<string>()
  const failures: string[] = []

  for (const query of queries) {
    try {
      for (const hit of await duckDuckGo(query, perQuery)) {
        if (seen.has(hit.url)) continue
        seen.add(hit.url)
        hits.push(hit)
      }
    } catch (err) {
      failures.push(err instanceof Error ? err.message : String(err))
    }
  }

  if (hits.length === 0) throw new SearchFailedError(KEYLESS_NAME, failures[0] ?? 'no results')
  return enrichWithPageText(hits.slice(0, maxHits))
}

/** The provider this deployment is configured for, or null if none is. */
export function activeProvider(): { provider: Provider; key: string } | null {
  for (const provider of PROVIDERS) {
    const key = process.env[provider.envVar]?.trim()
    if (key) return { provider, key }
  }
  return null
}

/** True when a keyed provider is set, as opposed to the keyless fallback. */
export function isSearchConfigured(): boolean {
  return activeProvider() !== null
}

// ---------------------------------------------------------------------------
// The search itself
// ---------------------------------------------------------------------------

export interface WebSearchOptions {
  /** Results to ask for per query. Default 5. */
  perQuery?: number
  /** Hard cap on hits handed back, after de-duplication. Default 12. */
  maxHits?:  number
}

/**
 * Runs every query and merges the results, newest-first within each query.
 *
 * Queries run one at a time rather than in parallel. Free search plans are
 * rate-limited per second more often than per month, and a burst of four
 * parallel requests is the shape most likely to trip that — while the total
 * wait is still well inside the host's function timeout.
 */
export async function webSearch(
  queries: string[],
  opts: WebSearchOptions = {},
): Promise<SearchOutcome> {
  const perQuery = opts.perQuery ?? 5
  const maxHits  = opts.maxHits  ?? 12

  const wanted = queries.map(q => q.trim()).filter(Boolean).slice(0, 4)

  const active = activeProvider()
  if (wanted.length === 0) {
    throw new SearchFailedError(active?.provider.name ?? KEYLESS_NAME, 'no query to run')
  }
  if (!active) {
    return { hits: await keylessSearch(wanted, perQuery, maxHits), provider: KEYLESS_NAME }
  }

  const { provider, key } = active

  const hits: SearchHit[] = []
  const seen = new Set<string>()
  const failures: string[] = []

  for (const query of wanted) {
    try {
      for (const hit of await provider.run(key, query, perQuery)) {
        if (!hit.url || seen.has(hit.url)) continue
        seen.add(hit.url)
        hits.push(hit)
      }
    } catch (err) {
      failures.push(err instanceof Error ? err.message : String(err))
    }
  }

  // One query failing out of four is noise; all of them failing is the answer
  // — usually a rejected or spent key, which is the deployment's problem and
  // not a reason to fail the user. Fall to the keyless search, and if that
  // fails too, report the keyed provider's error: it is the one worth fixing.
  if (hits.length === 0) {
    const cause = failures[0] ?? 'no results'
    console.warn(`[search] ${provider.name} returned nothing (${cause}); trying ${KEYLESS_NAME}`)
    try {
      return { hits: await keylessSearch(wanted, perQuery, maxHits), provider: KEYLESS_NAME }
    } catch {
      throw new SearchFailedError(provider.name, cause)
    }
  }

  return { hits: hits.slice(0, maxHits), provider: provider.name }
}

/**
 * Renders hits as the context block the model reads.
 *
 * Numbered, with the URL on its own line, because the prompts ask the model to
 * attribute claims and it can only do that if each source is addressable.
 */
export function renderSearchContext(hits: SearchHit[]): string {
  return hits
    .map((h, i) => {
      const when = h.publishedDate ? ` (published ${h.publishedDate.slice(0, 10)})` : ''
      return `[${i + 1}] ${h.title}${when}\n${h.url}\n${h.text.trim()}`
    })
    .join('\n\n---\n\n')
}

// ---------------------------------------------------------------------------
// Direct page reads
//
// Replaces Gemini's urlContext tool, which is only available on the same
// grounded path that is now refused. When the user pastes a job-posting link,
// the server fetches it and hands the text over as ordinary prompt content.
// ---------------------------------------------------------------------------

/**
 * Fetches a page and reduces it to readable text.
 *
 * Returns an empty string rather than throwing: a posting that cannot be read
 * is a normal outcome — expired links, login walls, bot checks — and the
 * prompts already instruct the model to say so instead of inventing content.
 */
export async function fetchPageText(
  url: string,
  maxChars  = 20_000,
  timeoutMs = 15_000,
): Promise<string> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const res = await fetch(url, {
      signal:  controller.signal,
      headers: {
        // Plenty of job boards serve an empty shell to an unrecognised client.
        'user-agent': 'Mozilla/5.0 (compatible; InterviewFlow/1.0; +https://interview-crm.vercel.app)',
        'accept':     'text/html,application/xhtml+xml',
      },
    }).finally(() => clearTimeout(timer))

    if (!res.ok) return ''
    const html = await res.text()
    return htmlToText(html).slice(0, maxChars)
  } catch {
    return ''
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCharCode(Number(d)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim()
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function postJSON(
  url: string,
  opts: { headers: Record<string, string>; body: unknown },
): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)

  const res = await fetch(url, {
    method:  'POST',
    signal:  controller.signal,
    headers: { 'content-type': 'application/json', ...opts.headers },
    body:    JSON.stringify(opts.body),
  }).finally(() => clearTimeout(timer))

  return readOrThrow(res)
}

async function getJSON(url: string, headers: Record<string, string>): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)

  const res = await fetch(url, {
    signal:  controller.signal,
    headers: { accept: 'application/json', ...headers },
  }).finally(() => clearTimeout(timer))

  return readOrThrow(res)
}

async function readOrThrow(res: Response): Promise<unknown> {
  if (!res.ok) {
    // The body usually names the reason — a rejected key, a spent allowance —
    // and losing it leaves only a status code to act on.
    const detail = (await res.text().catch(() => '')).slice(0, 300)
    throw new Error(`HTTP ${res.status}${detail ? ` — ${detail}` : ''}`)
  }
  return res.json()
}
