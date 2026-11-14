import { EVENT } from '../event/store'
import './SiteHeader.css'

export type Area = 'company' | 'apply' | 'staff' | 'outcomes'

const LINKS: { area: Area; href: string; label: string }[] = [
  { area: 'company', href: '#/', label: 'For companies' },
  { area: 'apply', href: '#/apply', label: 'Apply to the event' },
  { area: 'staff', href: '#/staff', label: 'Staff review' },
  { area: 'outcomes', href: '#/outcomes', label: 'Follow-up' },
]

/** The top bar for the applicant, staff and follow-up views. */
export function SiteHeader({ area, note }: { area: Area; note?: string }) {
  return (
    <header className="site-header">
      <a className="site-header__brand" href="#/">
        Plainly
      </a>
      <nav className="site-header__nav" aria-label="Main navigation">
        {LINKS.map((l) => (
          <a key={l.area} href={l.href} aria-current={l.area === area ? 'page' : undefined}>
            {l.label}
          </a>
        ))}
      </nav>
      <p className="site-header__event">
        {note && <>{note} · </>}Sample event · <b>{EVENT.name}</b> · {EVENT.date}
      </p>
    </header>
  )
}
