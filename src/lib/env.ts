import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  GOOGLE_GEMINI_API_KEY: z.string().min(1),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(input: Record<string, string | undefined>): Env {
  return envSchema.parse(input)
}

// Runtime singleton — validates at startup
export const env = validateEnv(process.env as Record<string, string | undefined>)
