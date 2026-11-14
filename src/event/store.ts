import { useSyncExternalStore } from 'react'
import type { Values } from '../form/schema'
import { DEFAULT_SLOTS, overallOf, type CompanyBrief, type Producer, type QuestionSet, type Score, type Status } from './core'
import { SAMPLE_APPLICATIONS, SAMPLE_BULK_SCORES, SAMPLE_LISTINGS } from './sample'
import { SAMPLE_SCORES } from './sampleAssessments'

/**
 * Event state for the shortlisting flow, kept in this browser's localStorage
 * under one key and shared between tabs through the storage event. Sample
 * listings and applications come from code and are merged in on read; only
 * real changes are stored.
 */

export const EVENT = { name: 'Espoo Matchmaking Day', date: '4 Mar 2027', applyBy: '18 Feb 2027' }
const KEY = 'plainly:event:v1'

/** A company role joining the event, with its published questions. */
export type Listing = {
  id: string
  company: string
  title: string
  status?: Status
  /** The role in the company's words; attributes quote it. */
  brief: CompanyBrief
  set: QuestionSet
  /** Company form answers, for the role card and constellation. */
  values: Values
  seed: string
  publishedAt: string
  sample?: boolean
}

export type Application = {
  id: string
  /** Pseudonymous code shown to staff, e.g. "A-7F3K". */
  code: string
  submittedAt: string
  picks: string[]
  /** Answers by listing id, then question id. */
  answers: Record<string, Record<string, string>>
  /** Used only to send the invitation; never shown in rankings or sent to AI. */
  email: string
  consentAt: string
  /** Fingerprint of each listing's questions when answered (setKeyOf), to notice republished questions. */
  sets?: Record<string, string>
  sample?: boolean
}

export type Assessment = {
  applicationId: string
  listingId: string
  scores: Score[]
  overall: number | null
  source: Producer
  model?: string
  assessedAt: string
  /** Fingerprint of the questions that were scored, to notice republished questions. */
  setKey: string
}

export type Decision = 'invite' | 'waitlist' | 'decline'
export type DecisionRecord = { decision: Decision; at: string }

type Stored = {
  listings: Listing[]
  applications: Application[]
  assessments: Assessment[]
  decisions: Record<string, DecisionRecord>
  slots: Record<string, number>
  /** Sample records the staff removed from this browser. */
  hiddenSamples: string[]
}

export type EventState = Stored & {
  /** Every listing: company-published first, then samples. */
  allListings: Listing[]
  allApplications: Application[]
}

const empty = (): Stored => ({ listings: [], applications: [], assessments: [], decisions: {}, slots: {}, hiddenSamples: [] })

function read(): Stored {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const s = JSON.parse(raw) as Partial<Stored>
    return { ...empty(), ...s }
  } catch {
    return empty()
  }
}

let snapshot: EventState | null = null
const listeners = new Set<() => void>()

const roleKey = (l: Pick<Listing, 'company' | 'title'>) => `${l.company}|${l.title}`.toLowerCase().replace(/\s+/g, ' ').trim()

/** Hand-written assessments for the sample applicants, used until a pair is scored again. */
const SAMPLE_ASSESSMENTS: Assessment[] = Object.entries({ ...SAMPLE_SCORES, ...SAMPLE_BULK_SCORES }).flatMap(([key, scores]) => {
  const [applicationId, listingId] = key.split(':')
  const listing = SAMPLE_LISTINGS.find((l) => l.id === listingId)
  const app = SAMPLE_APPLICATIONS.find((a) => a.id === applicationId)
  if (!listing || !app) return []
  return [{ applicationId, listingId, scores, overall: overallOf(scores), source: 'sample' as const, assessedAt: app.submittedAt, setKey: setKeyOf(listing.set) }]
})

function derive(s: Stored): EventState {
  const hidden = new Set(s.hiddenSamples)
  // A published role with the same company and title replaces its sample.
  const published = new Set(s.listings.map(roleKey))
  const stored = new Set(s.assessments.map((a) => pairKey(a.applicationId, a.listingId)))
  return {
    ...s,
    assessments: [...s.assessments, ...SAMPLE_ASSESSMENTS.filter((a) => !hidden.has(a.applicationId) && !stored.has(pairKey(a.applicationId, a.listingId)))],
    allListings: [...s.listings, ...SAMPLE_LISTINGS.filter((l) => !hidden.has(l.id) && !published.has(roleKey(l)))],
    allApplications: [...s.applications, ...SAMPLE_APPLICATIONS.filter((a) => !hidden.has(a.id))],
  }
}

function getSnapshot(): EventState {
  if (!snapshot) snapshot = derive(read())
  return snapshot
}

function emit() {
  snapshot = null
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) emit()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** Applies a change and saves it. Returns false when storage is unavailable. */
function update(change: (s: Stored) => Stored): boolean {
  try {
    const next = change(read())
    localStorage.setItem(KEY, JSON.stringify(next))
    emit()
    return true
  } catch {
    return false
  }
}

export function useEvent(): EventState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function pairKey(applicationId: string, listingId: string) {
  return `${applicationId}:${listingId}`
}
export function setKeyOf(set: Pick<QuestionSet, 'questions' | 'attributes'>) {
  return JSON.stringify([set.attributes.map((a) => [a.id, a.name]), set.questions.map((q) => [q.id, q.text])])
}

export function slotsFor(state: EventState, listingId: string) {
  return state.slots[listingId] ?? DEFAULT_SLOTS
}

/* ---------- Mutations ---------- */

export function publishListing(listing: Listing) {
  return update((s) => ({ ...s, listings: [listing, ...s.listings.filter((l) => l.id !== listing.id)] }))
}

export function unpublishListing(id: string) {
  return update((s) => ({ ...s, listings: s.listings.filter((l) => l.id !== id) }))
}

export function submitApplication(app: Application) {
  return update((s) => ({ ...s, applications: [app, ...s.applications.filter((a) => a.id !== app.id)] }))
}

export function saveAssessment(a: Omit<Assessment, 'overall'>) {
  const full: Assessment = { ...a, overall: overallOf(a.scores) }
  return update((s) => {
    // The application may have been deleted while it was being scored.
    const exists = s.applications.some((x) => x.id === a.applicationId) || (SAMPLE_APPLICATIONS.some((x) => x.id === a.applicationId) && !s.hiddenSamples.includes(a.applicationId))
    if (!exists) return s
    return {
    ...s,
    assessments: [full, ...s.assessments.filter((x) => !(x.applicationId === a.applicationId && x.listingId === a.listingId))],
    }
  })
}

/** True when the applicant answered an earlier version of this listing's questions. */
export function answeredEarlier(app: Application, listing: Listing) {
  const key = app.sets?.[listing.id]
  return Boolean(key && key !== setKeyOf(listing.set))
}

export function setDecision(applicationId: string, listingId: string, decision: Decision | null) {
  return update((s) => {
    const decisions = { ...s.decisions }
    if (decision) decisions[pairKey(applicationId, listingId)] = { decision, at: new Date().toISOString() }
    else delete decisions[pairKey(applicationId, listingId)]
    return { ...s, decisions }
  })
}

export function setSlots(listingId: string, slots: number) {
  return update((s) => ({ ...s, slots: { ...s.slots, [listingId]: Math.max(1, Math.min(50, Math.round(slots))) } }))
}

/** Deletes one application with its assessments and decisions (erasure on request). */
export function deleteApplication(id: string) {
  return update((s) => ({
    ...s,
    applications: s.applications.filter((a) => a.id !== id),
    assessments: s.assessments.filter((a) => a.applicationId !== id),
    decisions: Object.fromEntries(Object.entries(s.decisions).filter(([k]) => !k.startsWith(`${id}:`))),
    hiddenSamples: SAMPLE_APPLICATIONS.some((a) => a.id === id) ? [...new Set([...s.hiddenSamples, id])] : s.hiddenSamples,
  }))
}

/** Clears every stored record of the event in this browser. */
export function resetEvent() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable: nothing to clear */
  }
  emit()
}

/* ---------- Helpers ---------- */

export function newCode(taken: Set<string>) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  for (;;) {
    let c = 'A-'
    for (let i = 0; i < 4; i += 1) c += alphabet[Math.floor(Math.random() * alphabet.length)]
    if (!taken.has(c)) return c
  }
}

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
