import { ALL_FIELDS, FIELD_BY_ID, GOALS, type Field, type Goal, type Screen, type Value, type Values } from './schema'

export const UNDECIDED = 'Not decided yet'

/** True when the field holds a real answer (not "Not decided yet"). */
export function hasValue(f: Field, v: Value | undefined): boolean {
  if (!v || v.undecided) return false
  switch (f.kind) {
    case 'single':
      if (!v.choice) return false
      return f.options.find((o) => o.id === v.choice)?.withDate ? Boolean(v.date) : true
    case 'multi':
      return Boolean(v.choices?.length)
    case 'text':
      return Boolean(v.text?.trim())
    case 'number':
    case 'scale':
      return typeof v.number === 'number' && !Number.isNaN(v.number)
    case 'skills':
      return Boolean(v.skills && (v.skills.must.length || v.skills.teach.length || v.skills.nice.length))
    case 'salary':
      return typeof v.salary?.min === 'number' || typeof v.salary?.max === 'number'
  }
}

/** Answered means a real value or an honest "Not decided yet". */
export function isAnswered(f: Field, v: Value | undefined): boolean {
  return Boolean(v?.undecided) || hasValue(f, v)
}

export function missingOn(screen: Screen, values: Values): Field[] {
  return screen.fields.filter((f) => !f.optional && !isAnswered(f, values[f.id]))
}

export function screenComplete(screen: Screen, values: Values) {
  return missingOn(screen, values).length === 0
}

export function goalOf(values: Values): Goal | null {
  const c = values.vacancy?.choice
  return c === 'now' || c === 'soon' || c === 'pipeline' ? c : null
}

/**
 * How specific the role is, 0..1. A real answer counts fully, an honest
 * "Not decided yet" counts half, so a role full of gaps never comes fully into focus.
 */
export function specificity(values: Values): number {
  const required = ALL_FIELDS.filter((f) => !f.optional && f.id !== 'vacancy')
  const score = required.reduce((s, f) => {
    const v = values[f.id]
    return s + (hasValue(f, v) ? 1 : v?.undecided ? 0.5 : 0)
  }, 0)
  return score / required.length
}

function optionLabel(f: Field, id: string | undefined) {
  if (!id || (f.kind !== 'single' && f.kind !== 'multi')) return null
  return f.options.find((o) => o.id === id)?.label ?? null
}

const euro = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** One field's answer as display text, or null when unanswered. */
export function display(fieldId: string, values: Values): string | null {
  const f = FIELD_BY_ID[fieldId]
  const v = values[fieldId]
  if (!f || !v) return null
  if (v.undecided) return UNDECIDED
  if (!hasValue(f, v)) return null
  switch (f.kind) {
    case 'single': {
      const o = f.options.find((x) => x.id === v.choice)
      return o?.withDate && v.date ? formatDate(v.date) : (o?.label ?? null)
    }
    case 'multi':
      return (v.choices ?? []).map((c) => optionLabel(f, c)).filter(Boolean).join(', ')
    case 'text':
      return v.text!.trim()
    case 'number':
      return String(v.number)
    case 'scale': {
      const labels = [f.left, 'Mostly solo, some team', 'Balanced', 'Mostly team, some solo', f.right]
      return labels[(v.number ?? 3) - 1]
    }
    case 'skills': {
      const s = v.skills!
      return [s.must.length && `${s.must.length} must-have`, s.teach.length && `${s.teach.length} we teach`, s.nice.length && `${s.nice.length} nice to have`]
        .filter(Boolean)
        .join(', ')
    }
    case 'salary': {
      const { min, max } = v.salary!
      if (typeof min === 'number' && typeof max === 'number') return `€${euro.format(min)}–${euro.format(max)} / month`
      if (typeof min === 'number') return `From €${euro.format(min)} / month`
      return `Up to €${euro.format(max!)} / month`
    }
  }
}

export function screenSummary(screen: Screen, values: Values): string {
  return screen.fields
    .map((f) => display(f.id, values))
    .filter(Boolean)
    .join(' · ')
}

/** The intent sentence on the field: a plain template with slots. */
export function intentSentence(values: Values): { lead: string; rest: string } {
  const goal = goalOf(values)
  if (!goal) return { lead: 'No status yet.', rest: 'Your role appears here as you answer.' }
  const title = hasValue(FIELD_BY_ID.title, values.title) ? values.title!.text!.trim() : null
  const n = hasValue(FIELD_BY_ID.positions, values.positions) ? values.positions!.number! : null
  const type = hasValue(FIELD_BY_ID.type, values.type) ? display('type', values) : null
  const start = hasValue(FIELD_BY_ID.start, values.start) ? display('start', values) : null
  const parts = [
    title && (n && n > 1 ? `${title} × ${n}` : title),
    type?.toLowerCase(),
    start && (values.start?.choice === 'date' ? `starting ${start}` : start.toLowerCase()),
  ].filter(Boolean)
  return { lead: GOALS[goal].name, rest: parts.length ? `: ${parts.join(', ')}.` : '.' }
}

/** "You'd fit if" and "Probably not for you if", assembled from answers by fixed rules. */
export function fitLists(values: Values): { fit: string[]; not: string[] } {
  const fit: string[] = []
  const not: string[] = []
  const c = (id: string) => (values[id]?.undecided ? undefined : values[id]?.choice)
  const skills = values.skills?.undecided ? undefined : values.skills?.skills

  for (const s of skills?.must.slice(0, 3) ?? []) fit.push(`You have ${s}`)
  if (skills?.teach.length) fit.push(`You want to learn ${skills.teach.slice(0, 2).join(' or ')} on the job`)
  const thrive = hasValue(FIELD_BY_ID.thrive, values.thrive) ? values.thrive!.text!.trim().replace(/\.$/, '') : null
  if (thrive) fit.push(`You tend to ${thrive}`)
  if (c('finnish') === 'no' || c('finnish') === 'learnable') fit.push('You are still learning Finnish')
  if (c('fromAbroad') === 'yes') fit.push('You are applying from abroad')

  if (c('finnish') === 'fluent') not.push('You do not speak fluent Finnish')
  if (c('finnish') === 'basic') not.push('You do not speak any Finnish')
  if (c('mode') === 'onsite') not.push('You need to work remotely')
  if (c('mode') === 'hybrid') not.push('You need fully remote work')
  if (c('fromAbroad') === 'no') not.push('You are applying from outside Finland')
  else if (c('visa') === 'no') not.push('You need visa sponsorship')
  if (c('abroadFirst') === 'no' && c('fromAbroad') !== 'no') not.push('You need to work from abroad at first')
  if (c('education') === 'required') not.push('You do not have a relevant degree')
  const type = c('type')
  if (type === 'full') not.push('You are looking for part-time work')
  if (type === 'intern' || type === 'thesis' || type === 'summer') not.push('You are looking for a permanent job')

  return { fit: fit.slice(0, 5), not: not.slice(0, 5) }
}
