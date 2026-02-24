-- =============================================================
-- MathDiagnose seed data — run in Supabase SQL Editor after
-- creating parent and (optional) student auth users.
--
-- Test login users (see README):
--   Parent: parent@mathdiagnose.example / TestParent123!
--   Student: student@mathdiagnose.example / TestStudent123!
--
-- Steps:
--   1. In Supabase Dashboard → Authentication → Users, create:
--      - Parent: email parent@mathdiagnose.example, password TestParent123!
--      - Student: email student@mathdiagnose.example, password TestStudent123!
--   2. Get IDs: SELECT id, email FROM auth.users WHERE email IN ('parent@mathdiagnose.example', 'student@mathdiagnose.example');
--   3. Replace PASTE_PARENT_USER_ID_HERE and PASTE_STUDENT_AUTH_USER_ID_HERE below
--   4. Run this script
-- =============================================================

DO $$
DECLARE
  parent_id             uuid := 'PASTE_PARENT_USER_ID_HERE';       -- parent auth user id
  student_auth_user_id  uuid := 'PASTE_STUDENT_AUTH_USER_ID_HERE'; -- student auth user id (for student_accounts)
  alice_id              uuid := gen_random_uuid();
  bob_id                uuid := gen_random_uuid();
  charlie_id            uuid := gen_random_uuid();
  session1_id           uuid := gen_random_uuid();
  session2_id           uuid := gen_random_uuid();
  session3_id           uuid := gen_random_uuid();
  session4_id           uuid := gen_random_uuid();
  session_alice_add_id  uuid := gen_random_uuid();  -- Alice: Addition (for student dashboard progress)
BEGIN

-- ── Students ──────────────────────────────────────────────────
INSERT INTO public.students (id, parent_id, name, age) VALUES
  (alice_id,   parent_id, 'Alice',   8),
  (bob_id,     parent_id, 'Bob',    10),
  (charlie_id, parent_id, 'Charlie', 7);

-- ── Student account: link student auth user to Alice (for student login) ─
INSERT INTO public.student_accounts (auth_user_id, student_id)
VALUES (student_auth_user_id, alice_id)
ON CONFLICT (auth_user_id) DO NOTHING;

-- ── Test Sessions ─────────────────────────────────────────────
INSERT INTO public.test_sessions (id, student_id, concept, start_time, end_time, status) VALUES
  (session1_id, alice_id, 'Addition & Subtraction',
   now() - interval '1 day',  now() - interval '23 hours', 'completed'),
  (session2_id, bob_id,   'Multiplication Tables',
   now() - interval '2 days', now() - interval '47 hours', 'completed'),
  (session3_id, alice_id, 'Place Value',
   now() - interval '5 days', now() - interval '4 days 23 hours', 'completed'),
  (session4_id, bob_id,   'Fractions (Intro)',
   now() - interval '8 days', now() - interval '7 days 23 hours', 'completed');

-- ── Answers for Session 1 — Alice, Addition (8/10 correct) ───
INSERT INTO public.test_answers (session_id, question_id, raw_answer, time_taken, is_correct) VALUES
  (session1_id, 'add_001', '7',   3200, true),
  (session1_id, 'add_002', '15',  2800, true),
  (session1_id, 'add_003', '9',   4100, false),  -- answered 9, correct is 11
  (session1_id, 'add_004', '23',  3500, true),
  (session1_id, 'add_005', '18',  2900, true),
  (session1_id, 'sub_001', '4',   3800, true),
  (session1_id, 'sub_002', '12',  4200, true),
  (session1_id, 'sub_003', '7',   5100, false),  -- answered 7, correct is 8
  (session1_id, 'sub_004', '31',  3300, true),
  (session1_id, 'sub_005', '19',  2700, true);

-- ── Answers for Session 2 — Bob, Multiplication (6/10 correct) ─
INSERT INTO public.test_answers (session_id, question_id, raw_answer, time_taken, is_correct) VALUES
  (session2_id, 'mul_001', '12',  4500, true),
  (session2_id, 'mul_002', '35',  5200, false),
  (session2_id, 'mul_003', '56',  3900, true),
  (session2_id, 'mul_004', '40',  4100, false),
  (session2_id, 'mul_005', '48',  5500, true),
  (session2_id, 'mul_006', '27',  6200, false),
  (session2_id, 'mul_007', '63',  4800, true),
  (session2_id, 'mul_008', '72',  3700, true),
  (session2_id, 'mul_009', '81',  5900, false),
  (session2_id, 'mul_010', '64',  4300, true);

-- ── Diagnostic Reports ────────────────────────────────────────
INSERT INTO public.diagnostic_reports (session_id, ai_generated_report) VALUES
  (session1_id, '{
    "score": 85,
    "strengths": ["Single-digit addition", "Two-digit subtraction"],
    "weaknesses": ["Carrying in addition", "Borrowing in subtraction"],
    "recommendation": "Alice is performing well above average for her age. Focus next on carrying and borrowing with 3-digit numbers.",
    "next_concept": "3-Digit Addition with Carrying"
  }'::jsonb),
  (session2_id, '{
    "score": 62,
    "strengths": ["×3 and ×4 tables", "Perfect squares up to 8×8"],
    "weaknesses": ["×6, ×7, ×8 tables", "Speed on larger products"],
    "recommendation": "Bob knows the easy tables but needs more practice on 6s, 7s, and 8s. Daily 5-minute drills recommended.",
    "next_concept": "Multiplication Tables (6, 7, 8)"
  }'::jsonb);

RAISE NOTICE 'Seed data inserted successfully for parent %', parent_id;
RAISE NOTICE 'Students: Alice (%), Bob (%), Charlie (%)', alice_id, bob_id, charlie_id;

END $$;
