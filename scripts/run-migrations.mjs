#!/usr/bin/env node
/**
 * Run Supabase migrations only (no users, no seed).
 *
 * Requires in .env.local:
 *   DATABASE_URL (Dashboard → Database → Connection string → URI)
 *
 * Run: node scripts/run-migrations.mjs
 * Or:  npm run migrate
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, readdirSync } from 'fs'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

config({ path: resolve(root, '.env.local') })

const DATABASE_URL = process.env.DATABASE_URL

function log(msg) {
  console.log('[migrate]', msg)
}

function bail(msg) {
  console.error('[migrate]', msg)
  process.exit(1)
}

if (!DATABASE_URL) {
  bail(
    'Missing DATABASE_URL in .env.local. Get it from Supabase Dashboard → Database → Connection string → URI (Session pooler).'
  )
}

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URL })
  await client.connect()
  try {
    const migrationsDir = resolve(root, 'supabase', 'migrations')
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()
    for (const file of files) {
      const sql = readFileSync(resolve(migrationsDir, file), 'utf8')
      log(`Running: ${file}`)
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
    log('Done.')
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
