import type { ReactNode } from 'react'
import { EVENT } from '../event/store'
import { NAV, ROLE_OF_AREA, type Area } from './nav'
import { hasOwnApplication, readOwnRole, setViewedCompany, useViewedCompany } from './viewing'
import { ViewingBand } from './ViewingBand'
import './SiteHeader.css'

/** The current role's navigation. Items that are not available yet are dashed and not links. */
export function RoleNav({ area, className }: { area: Area; className: string }) {
  const viewed = useViewedCompany()
  const role = ROLE_OF_AREA[area]
  const unavailable = (a: Area) =>
    (a === 'questions' && !viewed && !readOwnRole().submitted) || (a === 'mine' && !hasOwnApplication())
  // The applicant's two items share one page; the current one follows whether they have applied.
  const current = (a: Area) => (role === 'seeker' ? (hasOwnApplication() ? a === 'mine' : a === 'apply') : a === area)
  return (
    <nav className={className} aria-label="Main navigation">
      {NAV[role].map((l) =>
        unavailable(l.area) ? (
          <span key={l.area} className="is-unavailable" aria-disabled="true">
            {l.label}
          </span>
        ) : (
          <a key={l.area} href={l.href} aria-current={current(l.area) ? 'page' : undefined}>
            {l.label}
          </a>
        ),
      )}
    </nav>
  )
}

/** The viewing-as band and the current role's top bar. */
export function SiteHeader({
  area,
  action,
  nextCompanyId,
  event = EVENT,
}: {
  area: Area
  /** The page's walkthrough control, shown in the band. */
  action?: ReactNode
  nextCompanyId?: string | null
  event?: { name: string; date: string }
}) {
  return (
    <>
      <ViewingBand area={area} action={action} nextCompanyId={nextCompanyId} />
      <header className="site-header">
        <a className="site-header__brand" href="#/" onClick={() => setViewedCompany(null)}>
          Plainly
        </a>
        <RoleNav area={area} className="site-header__nav" />
        <div className="site-header__actions">
          <p className="site-header__event">
            <b>{event.name}</b> · {event.date}
          </p>
        </div>
      </header>
    </>
  )
}
