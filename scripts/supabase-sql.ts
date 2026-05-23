// ---------------------------------------------------------------------------
// scripts/supabase-sql.ts
// Runs arbitrary SQL against the remote Supabase project via the Management API.
//
// Usage:
//   npm run sb:sql -- "SELECT version()"
//   npm run sb:sql -- --file supabase/migrations/0008_extend_profiles.sql
//
// Reads SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF from .env.local.
// ---------------------------------------------------------------------------

import { config as loadEnv } from 'dotenv'
import { readFileSync } from 'node:fs'

loadEnv({ path: '.env.local' })

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const REF   = process.env.SUPABASE_PROJECT_REF

if (!TOKEN || !REF) {
  console.error('Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF in .env.local')
  process.exit(1)
}

const args = process.argv.slice(2)
let sql: string | undefined

const fileIdx = args.indexOf('--file')
if (fileIdx !== -1) {
  const path = args[fileIdx + 1]
  if (!path) {
    console.error('--file requires a path argument')
    process.exit(1)
  }
  sql = readFileSync(path, 'utf8')
} else if (args.length > 0) {
  sql = args.join(' ')
}

if (!sql || sql.trim().length === 0) {
  console.error('No SQL provided. Pass a string or --file <path>.')
  process.exit(1)
}

const url = `https://api.supabase.com/v1/projects/${REF}/database/query`

const res = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
})

const body = await res.text()

if (!res.ok) {
  console.error(`HTTP ${res.status} ${res.statusText}`)
  console.error(body)
  process.exit(1)
}

try {
  console.log(JSON.stringify(JSON.parse(body), null, 2))
} catch {
  console.log(body)
}
