import type { ReactNode } from 'react'
import { EVENT } from '../event/store'
import { NAV_LINKS, type Area } from './nav'
import './SiteHeader.css'


/** The top bar for the applicant, staff and follow-up views. */
export function SiteHeader({
  area,
  action,
  event = EVENT,
}: {
  area: Area
  action?: ReactNode
  event?: { name: string; date: string }
}) {
  return (
    <header className="site-header">
      <a className="site-header__brand" href="#/">
        Plainly
      </a>
      <nav className="site-header__nav" aria-label="Main navigation">
        {NAV_LINKS.map((l) => (
          <a key={l.area} href={l.href} aria-current={l.area === area ? 'page' : undefined}>
            {l.label}
          </a>
        ))}
      </nav>
      <div className="site-header__actions">
        <p className="site-header__event">
          <b>{event.name}</b> · {event.date}
        </p>
        {action}
      </div>
    </header>
  )
}
