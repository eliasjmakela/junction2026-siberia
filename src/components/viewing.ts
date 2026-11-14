import { useSyncExternalStore } from 'react'
import { useEvent, type Listing } from '../event/store'

/** Who the event is being viewed as. Derived from the route, never stored. */
export type Role = 'company' | 'seeker' | 'espoo'

export function roleOf(path: string): Role {
  if (path === '#/apply') return 'seeker'
  if (path === '#/staff' || path === '#/outcomes') return 'espoo'
  return 'company'
}

/* ---------- Route ---------- */

function subscribeHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const readHash = () => window.location.hash

/** The hash route: its path and its `?view=` value. */
export function useRoute(): { path: string; view: string | null } {
  const hash = useSyncExternalStore(subscribeHash, readHash, () => '')
  const [path, query = ''] = hash.split('?')
  return { path: path || '#/', view: new URLSearchParams(query).get('view') }
}

/* ---------- The viewed company ---------- */

const VIEWING_KEY = 'plainly:viewing:company'
const listeners = new Set<() => void>()

function readViewing(): string | null {
  try {
    return localStorage.getItem(VIEWING_KEY)
  } catch {
    return null
  }
}

/** Sets the company the company screens follow: a listing id, or null for New company. */
export function setViewedCompany(id: string | null) {
  try {
    if (id) localStorage.setItem(VIEWING_KEY, id)
    else localStorage.removeItem(VIEWING_KEY)
  } catch {
    /* storage unavailable: the choice lasts until reload only for this tab's state */
  }
  listeners.forEach((l) => l())
}

function subscribeViewing(onChange: () => void) {
  listeners.add(onChange)
  const onStorage = (e: StorageEvent) => {
    if (e.key === VIEWING_KEY || e.key === null) onChange()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onStorage)
  }
}

/** The event company being viewed, or null for New company (the company's own form and role). */
export function useViewedCompany(): Listing | null {
  const id = useSyncExternalStore(subscribeViewing, readViewing, () => null)
  const state = useEvent()
  if (!id) return null
  return state.allListings.find((l) => l.id === id && l.sample) ?? null
}

/* ---------- Stored facts the band needs ---------- */

/** The company name and submitted state of the company's own role, from the saved form. */
export function readOwnRole(): { company: string | null; submitted: boolean } {
  try {
    const raw = localStorage.getItem('plainly:role:v2')
    if (!raw) return { company: null, submitted: false }
    const s = JSON.parse(raw) as { values?: { company?: { text?: string } }; savedAt?: string }
    return { company: s.values?.company?.text?.trim() || null, submitted: Boolean(s.savedAt) }
  } catch {
    return { company: null, submitted: false }
  }
}

/** Whether this browser holds the applicant's own application. */
export function hasOwnApplication(): boolean {
  try {
    return Boolean(localStorage.getItem('plainly:apply:mine'))
  } catch {
    return false
  }
}
