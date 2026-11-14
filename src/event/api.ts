import {
  pruneSet,
  rulesQuestionSet,
  rulesScores,
  sanitizeAssessmentInput,
  scrub,
  validateQuestionSet,
  validateScores,
  ANSWER_MAX,
  type AssessmentInput,
  type AssessmentResult,
  type CompanyBrief,
  type QuestionSet,
} from './core'
import type { Listing } from './store'

const TIMEOUT_MS = 90_000

async function post(path: string, body: unknown): Promise<unknown> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Drafts the attributes and questions for a role. The request carries the
 * company brief only. Without the endpoint (a static build), or when it
 * fails, the fixed-rule set is built here. Server output is validated again.
 * Returns null when the brief is too thin for either.
 */
export async function requestQuestionSet(brief: CompanyBrief): Promise<QuestionSet | null> {
  try {
    const data = (await post('/api/questions', { brief })) as Partial<QuestionSet> | null
    if (data && data.source === 'ai') {
      const set = validateQuestionSet(
        { attributes: data.attributes?.map((a) => ({ ...a, looks_like: a.looksLike })), questions: data.questions },
        brief,
      )
      if (set) return { ...set, source: 'ai', model: data.model }
    }
  } catch {
    /* fall through to rules */
  }
  const rules = rulesQuestionSet(brief)
  return rules ? { ...rules, source: 'rules' } : null
}

/** Keeps a reviewed set consistent after the company removes a question. */
export function removeQuestion(set: QuestionSet, questionId: string): QuestionSet | null {
  const next = pruneSet({ ...set, questions: set.questions.filter((q) => q.id !== questionId) })
  return next
}

/**
 * The assessment input for one applicant and one listing: that listing's
 * attributes and questions and the applicant's answers to them, scrubbed of
 * contact details. Nothing else about the applicant is included.
 */
export function assessmentInput(listing: Listing, answers: Record<string, string>): AssessmentInput | null {
  return sanitizeAssessmentInput({
    company: listing.company,
    title: listing.title,
    attributes: listing.set.attributes,
    questions: listing.set.questions,
    answers: Object.fromEntries(listing.set.questions.map((q) => [q.id, scrub(answers[q.id], ANSWER_MAX)])),
  })
}

/** Scores one applicant's answers for one listing; fixed rules when AI is unavailable. */
export async function requestAssessment(listing: Listing, answers: Record<string, string>): Promise<AssessmentResult | null> {
  const input = assessmentInput(listing, answers)
  if (!input) return null
  try {
    const data = (await post('/api/assess', { input })) as Partial<AssessmentResult> | null
    if (data && data.source === 'ai' && Array.isArray(data.scores)) {
      // Re-check on this side: evidence must still be verbatim and in bounds.
      const scores = validateScores(
        data.scores.map((s) => ({ ...s, score: s.score ?? -1 })),
        input,
      )
      return { scores, source: 'ai', model: data.model }
    }
  } catch {
    /* fall through to rules */
  }
  return { scores: rulesScores(input), source: 'rules' }
}
