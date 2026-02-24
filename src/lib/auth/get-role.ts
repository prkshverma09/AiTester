export type AuthRole =
  | { role: 'parent'; id: string }
  | { role: 'student'; id: string; studentId: string }
  | null

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => { eq: (col: string, value: string) => { single: () => Promise<{ data: unknown; error: unknown }> } }
  }
}

export async function getRoleForUser(
  supabase: SupabaseLike,
  userId: string | null | undefined
): Promise<AuthRole> {
  if (userId == null || userId === '') return null

  // Check student_accounts first (trigger adds every new user to parents, so student would match both)
  const studentRow = await supabase
    .from('student_accounts')
    .select('auth_user_id, student_id')
    .eq('auth_user_id', userId)
    .single()

  if (studentRow.data != null && studentRow.error == null) {
    const data = studentRow.data as { auth_user_id: string; student_id: string }
    return { role: 'student', id: userId, studentId: data.student_id }
  }

  const parentRow = await supabase
    .from('parents')
    .select('id')
    .eq('id', userId)
    .single()

  if (parentRow.data != null && parentRow.error == null) {
    return { role: 'parent', id: userId }
  }

  return null
}
