import { goalOf, hasValue } from '../form/logic'
import { FIELD_BY_ID, type Values } from '../form/schema'
import { sanitizeProfile, type RoleProfile } from './core'

/**
 * The role profile for the quick check, built from the company form. Only
 * job requirements are carried over, and any field answered "Not decided yet"
 * is left out, so it cannot produce a question.
 */
export function profileFrom(values: Values): RoleProfile {
  const answered = (id: string) => (FIELD_BY_ID[id] && hasValue(FIELD_BY_ID[id], values[id]) ? values[id] : undefined)
  const choice = (id: string) => answered(id)?.choice
  const text = (id: string) => answered(id)?.text?.trim()
  const skills = answered('skills')?.skills
  const start = goalOf(values) === 'pipeline' ? undefined : answered('start')

  return sanitizeProfile({
    title: text('title'),
    company: text('company'),
    type: choice('type'),
    start: start?.choice,
    startDate: start?.choice === 'date' ? start.date : undefined,
    mustSkills: skills?.must ?? [],
    teachSkills: skills?.teach ?? [],
    niceSkills: skills?.nice ?? [],
    education: choice('education'),
    worklang: answered('worklang')?.choices ?? [],
    finnish: choice('finnish'),
    mode: choice('mode'),
    office: text('office'),
    hours: choice('hours'),
    visa: choice('visa'),
    purpose: text('purpose'),
    month1: text('month1'),
    problem: text('problem'),
  })
}
