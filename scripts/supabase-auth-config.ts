// ---------------------------------------------------------------------------
// scripts/supabase-auth-config.ts
// GET or PATCH the project's auth configuration via the Management API.
//
// Usage:
//   npm run sb:auth -- --get
//   npm run sb:auth -- --set --site-url http://localhost:5173 \
//        --redirect-urls "http://localhost:5173/**,https://interview-crm.vercel.app/**" \
//        --email-enabled true --autoconfirm true
//
// Reads SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF from .env.local.
// ---------------------------------------------------------------------------

import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const REF   = process.env.SUPABASE_PROJECT_REF

if (!TOKEN || !REF) {
  console.error('Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF in .env.local')
  process.exit(1)
}

const url = `https://api.supabase.com/v1/projects/${REF}/config/auth`
const args = process.argv.slice(2)

function flag(name: string): string | undefined {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args[i + 1]
}

async function get() {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  const body = await res.text()
  if (!res.ok) {
    console.error(`HTTP ${res.status}`)
    console.error(body)
    process.exit(1)
  }
  const json = JSON.parse(body)
  const summary = {
    site_url:                  json.site_url,
    uri_allow_list:            json.uri_allow_list,
    external_email_enabled:    json.external_email_enabled,
    mailer_autoconfirm:        json.mailer_autoconfirm,
    disable_signup:            json.disable_signup,
    external_google_enabled:   json.external_google_enabled,
  }
  console.log(JSON.stringify(summary, null, 2))
}

async function set() {
  const payload: Record<string, unknown> = {}
  const siteUrl = flag('--site-url')
  if (siteUrl) payload.site_url = siteUrl
  const redirects = flag('--redirect-urls')
  if (redirects) payload.uri_allow_list = redirects
  const emailEnabled = flag('--email-enabled')
  if (emailEnabled) payload.external_email_enabled = emailEnabled === 'true'
  const autoconfirm = flag('--autoconfirm')
  if (autoconfirm) payload.mailer_autoconfirm = autoconfirm === 'true'

  if (Object.keys(payload).length === 0) {
    console.error('No fields to set. Pass at least one of --site-url, --redirect-urls, --email-enabled, --autoconfirm.')
    process.exit(1)
  }

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const body = await res.text()
  if (!res.ok) {
    console.error(`HTTP ${res.status}`)
    console.error(body)
    process.exit(1)
  }
  const json = JSON.parse(body)
  const summary = {
    site_url:               json.site_url,
    uri_allow_list:         json.uri_allow_list,
    external_email_enabled: json.external_email_enabled,
    mailer_autoconfirm:     json.mailer_autoconfirm,
  }
  console.log('PATCH succeeded:')
  console.log(JSON.stringify(summary, null, 2))
}

if (args.includes('--get')) await get()
else if (args.includes('--set')) await set()
else {
  console.error('Pass --get or --set <fields>')
  process.exit(1)
}
