import { useSyncExternalStore } from 'react'
import type { Values } from '../form/schema'
import { DEFAULT_SLOTS, overallOf, type CompanyBrief, type Producer, type QuestionSet, type Score, type Status } from './core'
import { SAMPLE_APPLICATIONS, SAMPLE_BULK_SCORES, SAMPLE_LISTINGS } from './sample'
import { takenFor } from '../meetings/slots'
import { SAMPLE_SCORES } from './sampleAssessments'
import { seedMeetings } from './sampleMeetings'

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

/** A 20-minute meeting at the company's stand on event day. */
export type Booking = { applicationId: string; listingId: string; start: string; place: string; at: string }
export type NextStep = 'interview' | 'keep' | 'none'
/** The company's rating of a candidate it met, kept in this browser only. */
export type Rating = { applicationId: string; listingId: string; score: 1 | 2 | 3 | 4 | 5; next: NextStep; note: string; at: string }

/** Stored maps hold null as a tombstone: the record was cleared, so the built-in one stays cleared. */
type Stored = {
  listings: Listing[]
  applications: Application[]
  assessments: Assessment[]
  decisions: Record<string, DecisionRecord | null>
  bookings: Record<string, Booking | null>
  ratings: Record<string, Rating | null>
  slots: Record<string, number>
  /** Sample records the staff removed from this browser. */
  hiddenSamples: string[]
}

export type EventState = Omit<Stored, 'decisions' | 'bookings' | 'ratings'> & {
  decisions: Record<string, DecisionRecord>
  bookings: Record<string, Booking>
  ratings: Record<string, Rating>
  /** Every listing: company-published first, then samples. */
  allListings: Listing[]
  allApplications: Application[]
}

const empty = (): Stored => ({ listings: [], applications: [], assessments: [], decisions: {}, bookings: {}, ratings: {}, slots: {}, hiddenSamples: [] })

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

const SEEDS = seedMeetings(SAMPLE_LISTINGS, SAMPLE_APPLICATIONS, SAMPLE_ASSESSMENTS)

/** Built-in records under the stored ones, without tombstones or records of removed applications and roles. */
function merged<T>(seed: Record<string, T>, stored: Record<string, T | null>, keep: (key: string) => boolean): Record<string, T> {
  const out: Record<string, T> = {}
  for (const [k, v] of Object.entries({ ...seed, ...stored })) if (v && keep(k)) out[k] = v
  return out
}

function derive(s: Stored): EventState {
  const hidden = new Set(s.hiddenSamples)
  // A published role with the same company and title replaces its sample.
  const published = new Set(s.listings.map(roleKey))
  const stored = new Set(s.assessments.map((a) => pairKey(a.applicationId, a.listingId)))
  const allListings = [...s.listings, ...SAMPLE_LISTINGS.filter((l) => !hidden.has(l.id) && !published.has(roleKey(l)))]
  const allApplications = [...s.applications, ...SAMPLE_APPLICATIONS.filter((a) => !hidden.has(a.id))]
  const listingIds = new Set(allListings.map((l) => l.id))
  const appIds = new Set(allApplications.map((a) => a.id))
  const present = (key: string) => {
    const [a, l] = key.split(':')
    return appIds.has(a) && listingIds.has(l)
  }
  const decisions = merged(SEEDS.decisions, s.decisions, present)
  const bookings = merged(SEEDS.bookings, s.bookings, (k) => present(k) && decisions[k]?.decision === 'invite')
  const ratings = merged(SEEDS.ratings, s.ratings, (k) => k in bookings)
  return {
    ...s,
    decisions,
    bookings,
    ratings,
    assessments: [...s.assessments, ...SAMPLE_ASSESSMENTS.filter((a) => !hidden.has(a.applicationId) && !stored.has(pairKey(a.applicationId, a.listingId)))],
    allListings,
    allApplications,
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
    const key = pairKey(applicationId, listingId)
    const decisions = { ...s.decisions, [key]: decision ? { decision, at: new Date().toISOString() } : null }
    if (decision === 'invite') return { ...s, decisions }
    // Withdrawing an invitation also clears the meeting and its rating.
    return { ...s, decisions, bookings: { ...s.bookings, [key]: null }, ratings: { ...s.ratings, [key]: null } }
  })
}

/** Books or moves a meeting. 'taken' when the time is no longer free. */
export function bookMeeting(applicationId: string, listingId: string, start: string, place: string): 'ok' | 'taken' | 'storage' {
  let taken = false
  const ok = update((s) => {
    const state = derive(s)
    const listing = state.allListings.find((l) => l.id === listingId)
    if (!listing || state.decisions[pairKey(applicationId, listingId)]?.decision !== 'invite' || takenFor(state, listing, applicationId).has(start)) {
      taken = true
      return s
    }
    return { ...s, bookings: { ...s.bookings, [pairKey(applicationId, listingId)]: { applicationId, listingId, start, place, at: new Date().toISOString() } } }
  })
  return !ok ? 'storage' : taken ? 'taken' : 'ok'
}

/** Cancels a meeting; its rating goes with it. */
export function cancelMeeting(applicationId: string, listingId: string) {
  const key = pairKey(applicationId, listingId)
  return update((s) => ({ ...s, bookings: { ...s.bookings, [key]: null }, ratings: { ...s.ratings, [key]: null } }))
}

/** Saves the rating of a meeting that is booked. */
export function rateMeeting(r: Omit<Rating, 'at'>) {
  const key = pairKey(r.applicationId, r.listingId)
  return update((s) => {
    if (!derive(s).bookings[key]) return s
    return { ...s, ratings: { ...s.ratings, [key]: { ...r, at: new Date().toISOString() } } }
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
    bookings: Object.fromEntries(Object.entries(s.bookings).filter(([k]) => !k.startsWith(`${id}:`))),
    ratings: Object.fromEntries(Object.entries(s.ratings).filter(([k]) => !k.startsWith(`${id}:`))),
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
