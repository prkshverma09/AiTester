-- AI-generated concept reports (one per student per concept, cached)
CREATE TABLE public.concept_reports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  concept        text NOT NULL,
  report_json    jsonb NOT NULL,
  last_session_id uuid REFERENCES public.test_sessions(id) ON DELETE SET NULL,
  updated_at     timestamptz DEFAULT now() NOT NULL,
  UNIQUE (student_id, concept)
);

-- AI-generated overall student summary (one per student, cached)
CREATE TABLE public.student_summaries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid UNIQUE NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  summary_json  jsonb NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.concept_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_summaries ENABLE ROW LEVEL SECURITY;

-- Parents can access concept_reports for their children
CREATE POLICY "concept_reports: via student"
  ON public.concept_reports FOR ALL
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE parent_id = auth.uid()
    )
  );

-- Parents can access student_summaries for their children
CREATE POLICY "student_summaries: via student"
  ON public.student_summaries FOR ALL
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE parent_id = auth.uid()
    )
  );
