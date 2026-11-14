import type { Question, QuestionSource } from './core'

/**
 * The published quick check, kept in this browser. It holds the role's
 * questions and the approval time only: never any attendee answers.
 */
export type Published = {
  questions: Question[]
  source: QuestionSource
  model?: string
  role: { title: string; company: string }
  /** The profile the questions were generated from, to notice later role changes. */
  fingerprint: string
  generatedAt: string
  approvedAt: string
}

export const SCREENING_KEY = 'plainly:screening:v1'

export function loadPublished(): Published | null {
  try {
    const raw = localStorage.getItem(SCREENING_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Published
    return Array.isArray(p?.questions) && p.questions.length ? p : null
  } catch {
    return null
  }
}

export function savePublished(p: Published): boolean {
  try {
    localStorage.setItem(SCREENING_KEY, JSON.stringify(p))
    return true
  } catch {
    return false
  }
}

export function removePublished() {
  try {
    localStorage.removeItem(SCREENING_KEY)
  } catch {
    /* storage unavailable: nothing to remove */
  }
}
