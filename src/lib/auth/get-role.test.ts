import { describe, it, expect, vi } from 'vitest'
import { getRoleForUser } from './get-role'

describe('getRoleForUser', () => {
  it('returns null when userId is null', async () => {
    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    const result = await getRoleForUser(supabase as never, null)
    expect(result).toBeNull()
  })

  it('returns null when userId is undefined', async () => {
    const supabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    const result = await getRoleForUser(supabase as never, undefined)
    expect(result).toBeNull()
  })

  it('returns parent role when user exists in parents table', async () => {
    const userId = 'parent-uuid-123'
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'parents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: userId, email: 'parent@example.com' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'student_accounts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn() }
      }),
    }
    const result = await getRoleForUser(supabase as never, userId)
    expect(result).toEqual({ role: 'parent', id: userId })
  })

  it('returns student role when user exists in student_accounts table', async () => {
    const authUserId = 'student-auth-uuid'
    const studentId = 'alice-student-uuid'
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'parents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }
        }
        if (table === 'student_accounts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { auth_user_id: authUserId, student_id: studentId },
                  error: null,
                }),
              }),
            }),
          }
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn() }
      }),
    }
    const result = await getRoleForUser(supabase as never, authUserId)
    expect(result).toEqual({ role: 'student', id: authUserId, studentId })
  })

  it('returns student when user is in both (student_accounts checked first)', async () => {
    const userId = 'same-uuid'
    const studentId = 'alice-uuid'
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'student_accounts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { auth_user_id: userId, student_id: studentId },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'parents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: userId },
                  error: null,
                }),
              }),
            }),
          }
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn() }
      }),
    }
    const result = await getRoleForUser(supabase as never, userId)
    expect(result).toEqual({ role: 'student', id: userId, studentId })
  })

  it('returns null when user is in neither table', async () => {
    const userId = 'unknown-uuid'
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }
      }),
    }
    const result = await getRoleForUser(supabase as never, userId)
    expect(result).toBeNull()
  })
})
