import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  GOOGLE_GEMINI_API_KEY: z.string().min(1, 'GOOGLE_GEMINI_API_KEY is required'),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(input: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(input)
  if (!result.success) {
    const issues = result.error.issues ?? []
    const first = issues[0]
    const path = first ? String(first.path?.[0] ?? 'env') : 'env'
    const hint =
      input[path] === undefined || input[path] === ''
        ? `${path} is missing`
        : (first?.message ?? `Invalid ${path}`)
    throw new Error(
      `${hint}. Add ${path} to .env.local (copy from .env.local.example). See README for Supabase setup.`
    )
  }
  return result.data
}

let cached: Env | null = null

function getEnv(): Env {
  if (cached) return cached
  cached = validateEnv(process.env as Record<string, string | undefined>)
  return cached
}

// Lazy singleton — validates on first access so missing vars produce a clear error
export const env = new Proxy({} as Env, {
  get(_, prop: string) {
    return getEnv()[prop as keyof Env]
  },
})
