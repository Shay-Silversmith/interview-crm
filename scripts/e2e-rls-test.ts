// ---------------------------------------------------------------------------
// scripts/e2e-rls-test.ts
// End-to-end multi-user RLS isolation test.
//   1. Creates two test users via admin client.
//   2. Verifies the trigger created profile rows with display_name.
//   3. Signs in as user1, inserts one application.
//   4. Signs in as user2, lists applications  →  must be empty.
//   5. Deletes both test users.
// ---------------------------------------------------------------------------

import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

loadEnv({ path: '.env.local' })

const URL  = process.env.VITE_SUPABASE_URL!
const ANON = process.env.VITE_SUPABASE_ANON_KEY!
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!URL || !ANON || !SVC) {
  console.error('Missing env. Need VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(URL, SVC, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const ts = Date.now()
const u1 = { email: `test1+${ts}@example.com`, password: 'Passw0rd!', displayName: 'Test One' }
const u2 = { email: `test2+${ts}@example.com`, password: 'Passw0rd!', displayName: 'Test Two' }

let u1Id = ''
let u2Id = ''

async function step(label: string, fn: () => Promise<void>) {
  console.log(`\n→ ${label}`)
  await fn()
}

try {
  await step('Create user1 via admin (autoconfirm)', async () => {
    const { data, error } = await admin.auth.admin.createUser({
      email: u1.email,
      password: u1.password,
      email_confirm: true,
      user_metadata: { display_name: u1.displayName },
    })
    if (error) throw error
    u1Id = data.user!.id
    console.log(`  user1 id: ${u1Id}`)
  })

  await step('Create user2 via admin', async () => {
    const { data, error } = await admin.auth.admin.createUser({
      email: u2.email,
      password: u2.password,
      email_confirm: true,
      user_metadata: { display_name: u2.displayName },
    })
    if (error) throw error
    u2Id = data.user!.id
    console.log(`  user2 id: ${u2Id}`)
  })

  await step('Verify profile rows created by trigger', async () => {
    const { data, error } = await admin
      .from('profiles')
      .select('id, email, display_name')
      .in('id', [u1Id, u2Id])
      .order('email')
    if (error) throw error
    console.log('  profiles:', JSON.stringify(data, null, 2))
    if (data?.length !== 2) throw new Error('Expected 2 profile rows')
    if (!data.some(r => r.display_name === u1.displayName)) throw new Error('user1 display_name missing')
    if (!data.some(r => r.display_name === u2.displayName)) throw new Error('user2 display_name missing')
  })

  await step('Sign in as user1, insert one application', async () => {
    const c1 = createClient(URL, ANON, { auth: { persistSession: false } })
    const { error: signErr } = await c1.auth.signInWithPassword({ email: u1.email, password: u1.password })
    if (signErr) throw signErr
    const { error: insErr } = await c1.from('job_applications').insert({
      user_id: u1Id,
      company_name: 'TestCo',
      role_name: 'Test PM Intern',
      stage: 'Interested',
    })
    if (insErr) throw insErr
    console.log('  inserted job_applications row as user1')
    await c1.auth.signOut()
  })

  await step('Sign in as user2, list applications (must be 0)', async () => {
    const c2 = createClient(URL, ANON, { auth: { persistSession: false } })
    const { error: signErr } = await c2.auth.signInWithPassword({ email: u2.email, password: u2.password })
    if (signErr) throw signErr
    const { data, error } = await c2.from('job_applications').select('id, company_name')
    if (error) throw error
    console.log(`  user2 sees ${data?.length ?? 0} applications`)
    if ((data?.length ?? 0) !== 0) {
      throw new Error(`RLS LEAK — user2 saw ${data!.length} of user1's rows`)
    }
    await c2.auth.signOut()
  })

  await step('Sign in as user1, confirm own row visible', async () => {
    const c1 = createClient(URL, ANON, { auth: { persistSession: false } })
    const { error: signErr } = await c1.auth.signInWithPassword({ email: u1.email, password: u1.password })
    if (signErr) throw signErr
    const { data, error } = await c1.from('job_applications').select('id, company_name')
    if (error) throw error
    console.log(`  user1 sees ${data?.length ?? 0} applications (their own)`)
    if ((data?.length ?? 0) !== 1) throw new Error('user1 should see exactly 1 row')
    await c1.auth.signOut()
  })

  console.log('\n✅ RLS isolation verified')
} catch (err) {
  console.error('\n❌ Test failed:', err)
  process.exitCode = 1
} finally {
  console.log('\n→ Cleanup: deleting test users')
  for (const id of [u1Id, u2Id].filter(Boolean)) {
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) console.error(`  failed to delete ${id}: ${error.message}`)
    else console.log(`  deleted ${id}`)
  }
}
