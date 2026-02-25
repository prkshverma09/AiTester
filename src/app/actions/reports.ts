'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getRoleForUser } from '@/lib/auth/get-role'
import { getQuestionsForConcept, type Question } from '@/data/questions'
import { generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'

// Use GOOGLE_GEMINI_API_KEY (project env) or GOOGLE_GENERATIVE_AI_API_KEY (SDK default)
const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GOOGLE_GEMINI_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    '',
})

const conceptReportSchema = z.object({
  expertiseScore: z.number().min(0).max(100).describe('0–100 score representing current mastery of this concept based on recent performance'),
  strengths: z.array(z.string()).describe('2-4 short bullet points on what the child understands well'),
  shortcomings: z.array(z.string()).describe('2-4 short bullet points on gaps or recurring mistakes'),
  summary: z.string().describe('2-3 sentence encouraging summary of their understanding of this concept'),
})

const studentSummarySchema = z.object({
  overallAssessment: z.string().describe('2-4 sentence overall assessment of the child\'s math progress'),
  recommendedNextSteps: z.array(z.string()).describe('1-3 concrete next steps for the parent or child'),
})

function getCorrectAnswerString(q: Question): string {
  if (q.type === 'mcq') return q.options[q.correctIndex] ?? ''
  return q.correctAnswer
}

/** Verify current user is the parent of this student; return supabase client or throw. */
async function ensureParentOfStudent(studentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return { ok: false as const, error: 'Not authenticated' }
  const role = await getRoleForUser(supabase, user.id)
  if (role?.role !== 'parent') return { ok: false as const, error: 'Not a parent' }
  const { data: student } = await supabase
    .from('students')
    .select('id, parent_id')
    .eq('id', studentId)
    .single()
  if (!student || student.parent_id !== user.id)
    return { ok: false as const, error: 'Student not found or access denied' }
  return { ok: true as const, supabase }
}

export type ConceptReportResult = {
  expertiseScore?: number
  strengths: string[]
  shortcomings: string[]
  summary: string
}

export async function generateConceptReport(
  studentId: string,
  concept: string
): Promise<{ error?: string; report?: ConceptReportResult }> {
  try {
    const auth = await ensureParentOfStudent(studentId)
    if (!auth.ok) return { error: auth.error }

    const { supabase } = auth
    const questions = getQuestionsForConcept(concept)
    const questionMap = new Map(questions.map((q) => [q.id, q]))

    const { data: sessions } = await supabase
      .from('test_sessions')
      .select('id, end_time')
      .eq('student_id', studentId)
      .eq('concept', concept)
      .eq('status', 'completed')
      .order('end_time', { ascending: false })

    if (!sessions?.length) {
      return { error: 'No completed sessions for this concept' }
    }

    const lastSessionId = sessions[0].id

    const { data: existing } = await supabase
      .from('concept_reports')
      .select('report_json, last_session_id')
      .eq('student_id', studentId)
      .eq('concept', concept)
      .maybeSingle()

    if (existing?.report_json && existing.last_session_id === lastSessionId) {
      return { report: existing.report_json as ConceptReportResult }
    }

    type Attempt = {
      questionText: string
      childAnswer: string
      correctAnswer: string
      isCorrect: boolean
      type: string
      tags: string[]
      difficulty: number
    }
    const sessionsWithAttempts: { sessionLabel: string; attempts: Attempt[] }[] = []

    for (let i = 0; i < sessions.length; i++) {
      const sess = sessions[i]
      const { data: answers } = await supabase
        .from('test_answers')
        .select('question_id, raw_answer, is_correct')
        .eq('session_id', sess.id)
      const attempts: Attempt[] = []
      for (const a of answers ?? []) {
        const q = questionMap.get(a.question_id)
        if (!q) continue
        attempts.push({
          questionText: q.text,
          childAnswer: a.raw_answer ?? '',
          correctAnswer: getCorrectAnswerString(q),
          isCorrect: a.is_correct ?? false,
          type: q.type,
          tags: q.tags ?? [],
          difficulty: q.difficulty,
        })
      }
      if (attempts.length > 0) {
        const dateStr = sess.end_time ? new Date(sess.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
        const label = i === 0 ? `Most recent session (${dateStr})` : `Earlier session ${i + 1} (${dateStr})`
        sessionsWithAttempts.push({ sessionLabel: label, attempts })
      }
    }

    const totalAttempts = sessionsWithAttempts.reduce((n, s) => n + s.attempts.length, 0)
    if (totalAttempts === 0) return { error: 'No answer data for this concept' }

    const formatAttempt = (a: Attempt, j: number) => {
      const meta = `[Type: ${a.type}, Tags: ${a.tags.join(', ') || 'none'}, Diff: ${a.difficulty}/5]`
      return `  ${j + 1}. ${meta} Q: ${a.questionText} | Child's answer: ${a.childAnswer} | Correct: ${a.correctAnswer} | Correct? ${a.isCorrect}`
    }
    const sessionsBlock = sessionsWithAttempts
      .slice(0, 10)
      .map(
        (s) =>
          `${s.sessionLabel}:\n${s.attempts.map((a, j) => formatAttempt(a, j)).join('\n')}`
      )
      .join('\n\n')

    const prompt = `You are an expert math tutor. Analyze this child's performance on the concept "${concept}".

Below are ALL their test sessions for this concept, ordered from most recent to oldest. Each question includes metadata: Type (mcq = multiple choice, subjective = open/written answer), Tags (e.g. word-problem, single-digit), and Diff (difficulty 1–5). Give MORE WEIGHT to recent sessions when assessing current understanding — the child may have improved significantly.

${sessionsBlock}

Pay special attention to the TYPES of questions the child gets right or wrong. For example: Do they get simple MCQ questions right but struggle with subjective questions or word problems (comprehending the question then applying the math)? Do they struggle with higher-difficulty questions or specific tags? If you notice such patterns, clearly highlight them in shortcomings or strengths.

Provide: (1) expertiseScore: a number 0–100 representing the child's current mastery of this concept based on recent performance; (2) strengths (what they understand well, especially from recent sessions); (3) shortcomings (gaps or recurring mistake patterns; note if these improved in recent sessions); (4) a short encouraging summary. Keep each bullet 1 short sentence.`

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: conceptReportSchema,
      prompt,
    })
    const report: ConceptReportResult = {
      expertiseScore: object.expertiseScore,
      strengths: object.strengths,
      shortcomings: object.shortcomings,
      summary: object.summary,
    }
    await supabase.from('concept_reports').upsert(
      {
        student_id: studentId,
        concept,
        report_json: report,
        last_session_id: lastSessionId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,concept' }
    )
    revalidatePath(`/dashboard/parent/child/${studentId}`)
    return { report }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to generate report'
    return { error: message }
  }
}

export type StudentSummaryResult = {
  overallAssessment: string
  recommendedNextSteps: string[]
}

export async function generateStudentSummary(
  studentId: string
): Promise<{ error?: string; summary?: StudentSummaryResult }> {
  try {
    const auth = await ensureParentOfStudent(studentId)
    if (!auth.ok) return { error: auth.error }

    const { supabase } = auth
    const { data: conceptReports } = await supabase
      .from('concept_reports')
      .select('concept, report_json, updated_at')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false })

    if (!conceptReports?.length) {
      return { error: 'Generate at least one concept report first' }
    }

    const { data: existingSummary } = await supabase
      .from('student_summaries')
      .select('summary_json, updated_at')
      .eq('student_id', studentId)
      .maybeSingle()

    const latestConceptUpdate = conceptReports.reduce(
      (max, r) => (r.updated_at && (!max || r.updated_at > max) ? r.updated_at : max),
      null as string | null
    )
    if (
      existingSummary?.summary_json &&
      latestConceptUpdate &&
      existingSummary.updated_at &&
      existingSummary.updated_at >= latestConceptUpdate
    ) {
      return { summary: existingSummary.summary_json as StudentSummaryResult }
    }

    const reportsText = conceptReports
      .map(
        (r) =>
          `[${r.concept}] ${(r.report_json as { summary?: string }).summary ?? ''} Strengths: ${(r.report_json as { strengths?: string[] }).strengths?.join('; ') ?? ''}. Shortcomings: ${(r.report_json as { shortcomings?: string[] }).shortcomings?.join('; ') ?? ''}.`
      )
      .join('\n\n')

    const prompt = `Summarize this child's overall math progress based on these concept reports. Keep it encouraging and concise.

If there are consistent patterns across different concepts (e.g. struggling with word problems or subjective questions despite knowing the core calculation, or excelling at MCQ but not at applying math in context), highlight that in the overall assessment and in recommended next steps.

${reportsText}`

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: studentSummarySchema,
      prompt,
    })
    const summary: StudentSummaryResult = {
      overallAssessment: object.overallAssessment,
      recommendedNextSteps: object.recommendedNextSteps,
    }
    await supabase.from('student_summaries').upsert(
      {
        student_id: studentId,
        summary_json: summary,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id' }
    )
    revalidatePath(`/dashboard/parent/child/${studentId}`)
    return { summary }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to generate summary'
    return { error: message }
  }
}
