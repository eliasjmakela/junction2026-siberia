import { useSyncExternalStore, type ReactNode } from 'react'
import { SeekerCheck } from './SeekerCheck'
import { Browse } from '../seeker/Browse'

export const CHECK_ROUTE = '#/check'
export const BROWSE_ROUTE = '#/roles'

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const readHash = () => window.location.hash

/** Routes the attendee browse and quick-check views; the company app stays at /. */
export function Root({ children }: { children: ReactNode }) {
  const hash = useSyncExternalStore(subscribe, readHash, () => '')
  if (hash === CHECK_ROUTE) return <SeekerCheck />
  if (hash === BROWSE_ROUTE) return <Browse />
  return <>{children}</>
}
