-- Student accounts: link auth users to students so students can log in
CREATE TABLE public.student_accounts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id   uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE
);

ALTER TABLE public.student_accounts ENABLE ROW LEVEL SECURITY;

-- Students can only access their own account row
CREATE POLICY "student_accounts: own row only"
  ON public.student_accounts FOR ALL
  USING (auth_user_id = auth.uid());

-- Students can read their own student row (for name, age, etc.)
CREATE POLICY "students: student owns"
  ON public.students FOR SELECT
  USING (
    id IN (
      SELECT student_id FROM public.student_accounts WHERE auth_user_id = auth.uid()
    )
  );

-- Students can access test_sessions for their student_id
CREATE POLICY "test_sessions: student via account"
  ON public.test_sessions FOR ALL
  USING (
    student_id IN (
      SELECT student_id FROM public.student_accounts WHERE auth_user_id = auth.uid()
    )
  );

-- Students can access test_answers for their sessions
CREATE POLICY "test_answers: student via session"
  ON public.test_answers FOR ALL
  USING (
    session_id IN (
      SELECT ts.id FROM public.test_sessions ts
      JOIN public.student_accounts sa ON ts.student_id = sa.student_id
      WHERE sa.auth_user_id = auth.uid()
    )
  );

-- Students can read diagnostic_reports for their sessions
CREATE POLICY "diagnostic_reports: student via session"
  ON public.diagnostic_reports FOR SELECT
  USING (
    session_id IN (
      SELECT ts.id FROM public.test_sessions ts
      JOIN public.student_accounts sa ON ts.student_id = sa.student_id
      WHERE sa.auth_user_id = auth.uid()
    )
  );
