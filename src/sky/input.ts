import { SCREENS, type Values } from '../form/schema'
import { fieldsFor, goalOf } from '../form/logic'
import { STAR_SCREEN } from './scene'

/** Which stars are picked out, and which stand for steps left "Not decided yet". */
export function skyStars(values: Values, isDone: (screenIndex: number) => boolean) {
  const goal = goalOf(values)
  const undecidedScreen = SCREENS.map((s) => fieldsFor(s, goal).some((f) => values[f.id]?.undecided))
  return {
    lit: STAR_SCREEN.map((i) => isDone(i)),
    undecided: STAR_SCREEN.map((i) => isDone(i) && undecidedScreen[i]),
  }
}

export function newSeed() {
  return Math.random().toString(36).slice(2, 10)
}

/** A stable, role-specific fingerprint from active answers; company profile fields are shared. */
export function roleFingerprint(values: Values): string {
  const goal = goalOf(values)
  const activeFields = SCREENS.flatMap((screen) => fieldsFor(screen, goal)).filter((field) => !field.company)
  const parts = activeFields.flatMap((field) => {
    const value = values[field.id]
    if (!value) return []
    let answer: string
    if (value.undecided) answer = 'undecided'
    else {
      switch (field.kind) {
        case 'single':
          answer = `${value.choice ?? ''}:${value.date ?? ''}`
          break
        case 'multi':
          answer = (value.choices ?? []).slice().sort().join(',')
          break
        case 'text':
          answer = (value.text ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
          break
        case 'number':
        case 'scale':
          answer = String(value.number ?? '')
          break
        case 'skills':
          answer = (['must', 'teach', 'nice'] as const)
            .map((bucket) => (value.skills?.[bucket] ?? []).map((skill) => skill.trim().replace(/\s+/g, ' ').toLowerCase()).sort().join(','))
            .join('|')
          break
        case 'salary':
          answer = `${value.salary?.min ?? ''}:${value.salary?.max ?? ''}`
          break
      }
    }
    return answer ? [`${field.id}:${answer}`] : []
  })
  const text = parts.join('|')
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
  return (hash >>> 0).toString(36)
}
