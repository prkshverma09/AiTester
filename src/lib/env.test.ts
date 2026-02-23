import { describe, it, expect } from 'vitest'
import { validateEnv } from './env'

const validEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key-value',
  GOOGLE_GEMINI_API_KEY: 'test-gemini-key-value',
}

describe('validateEnv', () => {
  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    const { NEXT_PUBLIC_SUPABASE_URL, ...rest } = validEnv
    expect(() => validateEnv(rest)).toThrow()
  })

  it('throws when NEXT_PUBLIC_SUPABASE_URL is not a valid URL', () => {
    expect(() =>
      validateEnv({ ...validEnv, NEXT_PUBLIC_SUPABASE_URL: 'not-a-url' })
    ).toThrow()
  })

  it('throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    const { NEXT_PUBLIC_SUPABASE_ANON_KEY, ...rest } = validEnv
    expect(() => validateEnv(rest)).toThrow()
  })

  it('throws when GOOGLE_GEMINI_API_KEY is missing', () => {
    const { GOOGLE_GEMINI_API_KEY, ...rest } = validEnv
    expect(() => validateEnv(rest)).toThrow()
  })

  it('returns typed config when all required vars are present', () => {
    const result = validateEnv(validEnv)
    expect(result.NEXT_PUBLIC_SUPABASE_URL).toBe('https://abc.supabase.co')
    expect(result.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key-value')
    expect(result.GOOGLE_GEMINI_API_KEY).toBe('test-gemini-key-value')
  })
})
