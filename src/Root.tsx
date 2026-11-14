import { useEffect, type ReactNode } from 'react'
import { Apply } from './apply/Apply'
import { useRoute } from './components/viewing'
import { Meetings } from './meetings/Meetings'
import { Outcomes } from './outcomes/Outcomes'
import { Staff } from './staff/Staff'

/** Hash routes for the applicant, staff, meetings and follow-up views; the company app is the default. */
export function Root({ children }: { children: ReactNode }) {
  const { path } = useRoute()
  // The retired role browser now lives in the company's views.
  const retired = path === '#/roles'
  useEffect(() => {
    if (retired) window.location.replace('#/')
  }, [retired])
  if (path === '#/apply') return <Apply />
  if (path === '#/staff') return <Staff />
  if (path === '#/meetings') return <Meetings />
  if (path === '#/outcomes') return <Outcomes />
  return <>{children}</>
}
