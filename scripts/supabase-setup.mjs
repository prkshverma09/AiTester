#!/usr/bin/env node
/**
 * Supabase setup:
 * - Always: creates test users via Auth API.
 * - If DATABASE_URL is set: also runs migrations and seed.
 * - If not: writes supabase/seed-ready.sql and prints manual steps.
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   DATABASE_URL (optional; Dashboard → Database → Connection string → URI)
 *
 * Run: node scripts/supabase-setup.mjs
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

config({ path: resolve(root, '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DATABASE_URL = process.env.DATABASE_URL

const PARENT_EMAIL = 'parent@mathdiagnose.example'
const PARENT_PASSWORD = 'TestParent123!'
const STUDENT_EMAIL = 'student@mathdiagnose.example'
const STUDENT_PASSWORD = 'TestStudent123!'

function log(msg) {
  console.log('[supabase-setup]', msg)
}

function bail(msg) {
  console.error('[supabase-setup]', msg)
  process.exit(1)
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  bail(
    'Missing env. In .env.local set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Dashboard → API → service_role).'
  )
}

async function ensureUser(supabaseAdmin, email, password) {
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers()
  const found = existing?.users?.find((u) => u.email === email)
  if (found) {
    log(`User already exists: ${email}`)
    return found.id
  }
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw new Error(`Create user ${email}: ${error.message}`)
  log(`Created user: ${email}`)
  return data.user.id
}

async function runMigrations(client) {
  const migrationsDir = resolve(root, 'supabase', 'migrations')
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()
  for (const file of files) {
    const sql = readFileSync(resolve(migrationsDir, file), 'utf8')
    log(`Running migration: ${file}`)
    try {
      await client.query(sql)
    } catch (e) {
      if (e.message?.includes('already exists')) {
        log(`  (already applied)`)
      } else {
        throw e
      }
    }
  }
}

async function ensureParentRow(pgClient, parentId, email) {
  const { rows } = await pgClient.query(
    'SELECT 1 FROM public.parents WHERE id = $1',
    [parentId]
  )
  if (rows.length === 0) {
    log('Inserting parent row (user was created before trigger existed)...')
    await pgClient.query(
      'INSERT INTO public.parents (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      [parentId, email]
    )
  }
}

async function runSeed(client, parentId, studentAuthUserId) {
  const seedPath = resolve(root, 'supabase', 'seed.sql')
  let sql = readFileSync(seedPath, 'utf8')
  sql = sql
    .replace(/PASTE_PARENT_USER_ID_HERE/g, parentId)
    .replace(/PASTE_STUDENT_AUTH_USER_ID_HERE/g, studentAuthUserId)
  log('Running seed...')
  await client.query(sql)
}

async function main() {
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const seedPath = resolve(root, 'supabase', 'seed.sql')
  let seedSql = readFileSync(seedPath, 'utf8')

  if (DATABASE_URL) {
    let ok = false
    let parentId, studentAuthUserId
    try {
      const pgClient = new pg.Client({ connectionString: DATABASE_URL })
      await pgClient.connect()
      try {
        await runMigrations(pgClient)
        log('Creating test users...')
        parentId = await ensureUser(supabaseAdmin, PARENT_EMAIL, PARENT_PASSWORD)
        studentAuthUserId = await ensureUser(supabaseAdmin, STUDENT_EMAIL, STUDENT_PASSWORD)
        await ensureParentRow(pgClient, parentId, PARENT_EMAIL)
        await runSeed(pgClient, parentId, studentAuthUserId)
        log('Migrations and seed done.')
        ok = true
      } finally {
        await pgClient.end()
      }
    } catch (e) {
      console.error('[supabase-setup] Database connection failed:', e.message)
      console.error('[supabase-setup] Check DATABASE_URL (Dashboard → Database → Connection string). Falling back to seed-ready.sql.')
    }
    if (!ok) {
      writeFileSync(resolve(root, 'supabase', 'seed-ready.sql'), seedSql, 'utf8')
      log('Wrote supabase/seed-ready.sql. Run migrations and this file in SQL Editor.')
      console.log('')
      console.log('  In Supabase Dashboard → SQL Editor, run in order:')
      console.log('  1. supabase/migrations/20260223000001_initial_schema.sql')
      console.log('  2. supabase/migrations/20260223000002_auth_trigger.sql')
      console.log('  3. supabase/migrations/20260224000001_student_accounts.sql')
      console.log('  4. supabase/migrations/20260225000001_ai_reports.sql')
      console.log('  5. supabase/seed-ready.sql')
      console.log('')
    }
  } else {
    writeFileSync(resolve(root, 'supabase', 'seed-ready.sql'), seedSql, 'utf8')
    log('Wrote supabase/seed-ready.sql (no DATABASE_URL — run migrations and this file in SQL Editor).')
    console.log('')
    console.log('  Run in Supabase Dashboard → SQL Editor (in order):')
    console.log('  1. supabase/migrations/20260223000001_initial_schema.sql')
    console.log('  2. supabase/migrations/20260223000002_auth_trigger.sql')
    console.log('  3. supabase/migrations/20260224000001_student_accounts.sql')
    console.log('  4. supabase/migrations/20260225000001_ai_reports.sql')
    console.log('  5. supabase/seed-ready.sql')
    console.log('')
  }

  log('Sign in with:')
  log(`  Parent:  ${PARENT_EMAIL} / ${PARENT_PASSWORD}`)
  log(`  Student: ${STUDENT_EMAIL} / ${STUDENT_PASSWORD}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
