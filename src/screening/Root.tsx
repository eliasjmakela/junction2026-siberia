import { useSyncExternalStore, type ReactNode } from 'react'
import { SeekerCheck } from './SeekerCheck'

export const CHECK_ROUTE = '#/check'

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const readHash = () => window.location.hash

/** Renders the attendee quick check at #/check, and the company app everywhere else. */
export function Root({ children }: { children: ReactNode }) {
  const hash = useSyncExternalStore(subscribe, readHash, () => '')
  return hash === CHECK_ROUTE ? <SeekerCheck /> : <>{children}</>
}
