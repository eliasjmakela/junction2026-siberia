import { display, goalOf, hasValue } from '../form/logic'
import { FIELD_BY_ID, type Values } from '../form/schema'
import { sanitizeBrief, type BriefSource, type CompanyBrief } from './core'

/** Company answers that describe the work, in the order they appear in the form. */
const TEXT_FIELDS: [id: string, label: string][] = [
  ['purpose', 'This role exists so that'],
  ['hiringCondition', 'Before hiring'],
  ['month1', 'In the first month, this person will'],
  ['problem', 'A recent problem this person would help solve'],
  ['tuesday', 'A normal Tuesday looks like'],
  ['thrive', 'People who thrive here tend to'],
  ['career', 'A typical career path from this role'],
]

/**
 * The company brief: the role in the company's own words, built from the
 * form. Fields left "Not decided yet" are left out, so they cannot become an
 * attribute. Salary, location and visa terms are not included: they describe
 * the offer, not what the company is looking for in a person.
 */
export function briefFrom(values: Values): CompanyBrief {
  const answered = (id: string) => (FIELD_BY_ID[id] && hasValue(FIELD_BY_ID[id], values[id]) ? values[id] : undefined)
  const sources: BriefSource[] = []
  for (const [id, label] of TEXT_FIELDS) {
    const text = answered(id)?.text?.trim()
    if (text) sources.push({ field: id, label, text })
  }
  const skills = answered('skills')?.skills
  if (skills?.must.length) sources.push({ field: 'mustSkills', label: 'Must-have skills', text: skills.must.join(', ') })
  if (skills?.teach.length) sources.push({ field: 'teachSkills', label: 'Skills we can teach', text: skills.teach.join(', ') })
  if (skills?.nice.length) sources.push({ field: 'niceSkills', label: 'Nice-to-have skills', text: skills.nice.join(', ') })
  const withWho = answered('with') ? display('with', values) : null
  if (withWho) sources.push({ field: 'with', label: 'Works most with', text: withWho })
  const finnish = answered('finnish') ? display('finnish', values) : null
  if (finnish) sources.push({ field: 'finnish', label: 'Finnish required', text: finnish })

  return sanitizeBrief({
    company: answered('company')?.text?.trim(),
    title: answered('title')?.text?.trim(),
    status: goalOf(values) ?? undefined,
    sources,
  })
}
