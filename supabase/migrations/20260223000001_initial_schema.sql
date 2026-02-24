-- Parents: linked to Supabase Auth users
CREATE TABLE public.parents (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Students: children managed by a parent
CREATE TABLE public.students (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  uuid NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  name       text NOT NULL,
  age        int  NOT NULL CHECK (age BETWEEN 5 AND 12),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Test sessions: one per concept attempt per student
CREATE TABLE public.test_sessions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  concept    text NOT NULL,
  start_time timestamptz DEFAULT now() NOT NULL,
  end_time   timestamptz,
  status     text NOT NULL DEFAULT 'in_progress'
             CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- Individual question responses with timing
CREATE TABLE public.test_answers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  raw_answer  text,
  time_taken  int,   -- milliseconds
  is_correct  bool
);

-- AI-generated diagnostic reports (one per session)
CREATE TABLE public.diagnostic_reports (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           uuid UNIQUE NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
  ai_generated_report  jsonb,
  created_at           timestamptz DEFAULT now() NOT NULL
);

-- =====================
-- Row Level Security
-- =====================

ALTER TABLE public.parents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_answers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_reports ENABLE ROW LEVEL SECURITY;

-- Parents can only access their own row
CREATE POLICY "parents: own row only"
  ON public.parents FOR ALL
  USING (id = auth.uid());

-- Parents access students they own
CREATE POLICY "students: parent owns"
  ON public.students FOR ALL
  USING (parent_id = auth.uid());

-- Parents access sessions for their students
CREATE POLICY "test_sessions: via student"
  ON public.test_sessions FOR ALL
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE parent_id = auth.uid()
    )
  );

-- Parents access answers for their sessions
CREATE POLICY "test_answers: via session"
  ON public.test_answers FOR ALL
  USING (
    session_id IN (
      SELECT ts.id FROM public.test_sessions ts
      JOIN public.students s ON ts.student_id = s.id
      WHERE s.parent_id = auth.uid()
    )
  );

-- Parents access reports for their sessions
CREATE POLICY "diagnostic_reports: via session"
  ON public.diagnostic_reports FOR ALL
  USING (
    session_id IN (
      SELECT ts.id FROM public.test_sessions ts
      JOIN public.students s ON ts.student_id = s.id
      WHERE s.parent_id = auth.uid()
    )
  );
