import { rulesQuestions, validateQuestions, type RoleProfile, type Screening } from './core'

const TIMEOUT_MS = 25_000

/**
 * Asks the server endpoint for the quick check. The request carries the role
 * profile only. If the endpoint is missing (a static build), slow or failing,
 * the questions are built in the browser from the same rules, so the
 * feature always works. Server answers are validated again here.
 */
export async function generateScreening(profile: RoleProfile): Promise<Screening> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch('/api/screening', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ profile }),
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as Partial<Screening>
    const questions = validateQuestions(data.questions, profile)
    if (!questions.length) throw new Error('No valid questions')
    return { questions, source: data.source === 'ai' ? 'ai' : 'rules', model: data.source === 'ai' ? data.model : undefined }
  } catch {
    return { questions: rulesQuestions(profile), source: 'rules' }
  } finally {
    clearTimeout(timer)
  }
}
