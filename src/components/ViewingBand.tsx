import { useEffect, useRef, useState, type ReactNode } from 'react'
import { resetEvent, useEvent } from '../event/store'
import { Arrow } from './Arrow'
import { NEXT, ROLES, ROLE_OF_AREA, type Area } from './nav'
import { readOwnRole, setViewedCompany, useViewedCompany } from './viewing'
import './ViewingBand.css'

/**
 * The layer above the product: who the event is viewed as, which company, the
 * walkthrough and the hand-off to the next moment. The product below never
 * carries any of these.
 */
export function ViewingBand({
  area,
  action,
  nextCompanyId,
  newCompanyName,
}: {
  area: Area
  /** The page's walkthrough control. */
  action?: ReactNode
  /** When set, following Next views this company's screens. */
  nextCompanyId?: string | null
  /** The company name typed into the form, before the role is saved. */
  newCompanyName?: string | null
}) {
  const role = ROLE_OF_AREA[area]
  const state = useEvent()
  const viewed = useViewedCompany()
  const events = state.allListings.filter((l) => l.sample)
  const own = newCompanyName ?? readOwnRole().company
  const next = NEXT[area]
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  function close(refocus: boolean) {
    setOpen(false)
    setConfirming(false)
    if (refocus) trigger.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true)
    }
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) close(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  const companyName = viewed ? viewed.company : own || 'New company'

  return (
    <div className="band">
      <div className="band__who">
        <span className="band__label" id="band-label">Viewing as</span>
        <nav className="band__roles" aria-labelledby="band-label">
          {ROLES.map((r) =>
            r.id === 'company' ? (
              <div className="band__company" key={r.id} ref={wrap}>
                <a href={r.href} aria-current={role === r.id ? 'page' : undefined} className="band__role">
                  {r.label}
                </a>
                <button
                  ref={trigger}
                  type="button"
                  className="band__menu-btn"
                  aria-expanded={open}
                  aria-controls="band-menu"
                  aria-label={`Company menu: ${companyName}`}
                  onClick={() => (open ? close(false) : setOpen(true))}
                >
                  {role === 'company' && <span className="band__menu-name">{companyName}</span>}
                  <span aria-hidden="true">▾</span>
                </button>
                {open && (
                  <div className="band__menu" id="band-menu">
                    <ul>
                      <li>
                        <button
                          type="button"
                          aria-pressed={!viewed}
                          onClick={() => {
                            setViewedCompany(null)
                            close(true)
                            // Choosing a company from another role's screens opens that company's view.
                            if (role !== 'company') window.location.hash = '#/'
                          }}
                        >
                          <span className="band__menu-co">{own || 'New company'}</span>
                          <span className="band__menu-role">{own ? 'Your role form' : 'Your role form, blank to start'}</span>
                        </button>
                      </li>
                      {events.map((l) => (
                        <li key={l.id}>
                          <button
                            type="button"
                            aria-pressed={viewed?.id === l.id}
                            onClick={() => {
                              setViewedCompany(l.id)
                              close(true)
                              if (role !== 'company') window.location.hash = '#/'
                            }}
                          >
                            <span className="band__menu-co">{l.company}</span>
                            <span className="band__menu-role">{l.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="band__menu-foot">
                      {confirming ? (
                        <>
                          <p>Clear all event data in this browser? Published roles, applications, scores and decisions are removed. Built-in records are restored.</p>
                          <div className="band__menu-confirm">
                            <button
                              type="button"
                              onClick={() => {
                                resetEvent()
                                setViewedCompany(null)
                                close(true)
                              }}
                            >
                              Clear
                            </button>
                            <button type="button" onClick={() => setConfirming(false)}>
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <button type="button" onClick={() => setConfirming(true)}>
                          Clear event data in this browser
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <a key={r.id} href={r.href} className="band__role" aria-current={role === r.id ? 'page' : undefined}>
                {r.label}
              </a>
            ),
          )}
        </nav>
      </div>
      <div className="band__actions">
        {action}
        {next && (
          <a
            className="band__next"
            href={next.href}
            onClick={nextCompanyId !== undefined ? () => setViewedCompany(nextCompanyId) : undefined}
          >
            Next: {next.label} <Arrow />
          </a>
        )}
      </div>
    </div>
  )
}
