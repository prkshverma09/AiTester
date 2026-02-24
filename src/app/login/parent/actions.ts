'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRoleForUser } from '@/lib/auth/get-role'

export type ParentLoginState = { error?: string }

export async function loginParent(
  _prevState: ParentLoginState,
  formData: FormData
): Promise<ParentLoginState> {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    return { error: authError.message ?? 'Invalid email or password.' }
  }

  const user = authData.user
  if (!user?.id) {
    return { error: 'Could not sign in.' }
  }

  const role = await getRoleForUser(supabase, user.id)
  if (role?.role !== 'parent') {
    await supabase.auth.signOut()
    return { error: 'This account is not a parent account. Use Student Login instead.' }
  }

  redirect('/dashboard/parent')
}
