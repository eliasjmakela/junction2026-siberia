import { useSyncExternalStore, type ReactNode } from 'react'
import { Apply } from './apply/Apply'
import { Meetings } from './meetings/Meetings'
import { Outcomes } from './outcomes/Outcomes'
import { Browse } from './seeker/Browse'
import { Staff } from './staff/Staff'

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const readHash = () => window.location.hash

/** Hash routes for the applicant, staff and follow-up views; the company app is the default. */
export function Root({ children }: { children: ReactNode }) {
  const hash = useSyncExternalStore(subscribe, readHash, () => '')
  const path = hash.split('?')[0]
  if (path === '#/apply') return <Apply />
  if (path === '#/staff') return <Staff />
  if (path === '#/meetings') return <Meetings />
  if (path === '#/outcomes') return <Outcomes />
  if (path === '#/roles') return <Browse />
  return <>{children}</>
}
