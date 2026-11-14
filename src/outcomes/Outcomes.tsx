import { Fragment, useRef, useState } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import { MAX_PICKS } from '../event/core'
import {
  COMPANIES,
  DEFAULT_EVENT,
  RUNNING_LEFT,
  RUNNING_START,
  EVENTS,
  TOO_FEW,
  band,
  pct,
  sortedCompanies,
  summary,
  toCsv,
  type Action,
  type Checkpoint,
  type CompanyRow,
  type Summary,
} from './data'
import '../form/fields.css'
import './outcomes.css'

const ACTION_LABEL: Record<Action, string> = {
  confirm: 'Confirm with company',
  ask: 'Ask about hiring',
  again: 'Invite again',
  none: 'No follow-up',
}

const COMPANY_PAGES = COMPANIES.length

const eventLabel = (e: { name: string; date: string }) => `${e.name} · ${e.date}`

function statusLine(s: Summary): string {
  if (s.state === 'done') return `Checked ${s.checkDate} · ${s.total} attendee profiles and ${COMPANY_PAGES} company pages in ${s.minutes} min`
  if (s.state === 'running') return `Running since ${s.checkDate}, ${RUNNING_START} · ${s.checked} of ${s.total} profiles · ${RUNNING_LEFT}`
  return `The profile check is scheduled for ${s.checkDate}. ${s.attendance.attended} of ${s.attendance.invited} invited applicants attended.`
}

function Provisional({ s }: { s: Summary }) {
  return s.state === 'running' ? <span className="out-pill">Provisional</span> : null
}

function HiresOther({ c, k, s }: { c: CompanyRow; k: Checkpoint; s: Summary }) {
  const st = s.event.checks[k]
  const h = c.hires[k]
  if (st.state === 'running') return <span className="out-pill">{h === null ? 'Running' : `${band(h)} so far`}</span>
  if (st.state === 'scheduled') return <span className="out-pill">Scheduled {st.date}</span>
  return <>{h === null ? '–' : band(h)}</>
}

function Report({ c, s }: { c: CompanyRow; s: Summary }) {
  const r = c.reported[s.checkpoint]
  return r === null ? <span className="out-pill">Not reported</span> : <>Reported {band(r)}</>
}

function Follow({ c, s }: { c: CompanyRow; s: Summary }) {
  if (!c.action) return <span className="out-pill">Not yet</span>
  return (
    <>
      <span className={`out-action out-action--${c.action}`}>{ACTION_LABEL[c.action]}</span>
      {s.state === 'running' && <span className="out-range">From the 3-month check</span>}
    </>
  )
}

function Details({ c, s, id }: { c: CompanyRow; s: Summary; id: string }) {
  const other: Checkpoint = s.checkpoint === 3 ? 6 : 3
  const scheduled = s.state === 'scheduled'
  return (
    <div className="out-details" id={id}>
      <dl>
        {!scheduled && (
          <>
            <div>
              <dt>Invited</dt>
              <dd>{c.invited}</dd>
            </div>
            <div>
              <dt>Attended</dt>
              <dd>{c.attended}</dd>
            </div>
            <div>
              <dt>Hires at {other} months</dt>
              <dd><HiresOther c={c} k={other} s={s} /></dd>
            </div>
          </>
        )}
        <div>
          <dt>Applicants</dt>
          <dd>{c.applicants}</dd>
        </div>
        {!scheduled && (
          <div>
            <dt>Profiles matched</dt>
            <dd>{c.matched} of {c.attended}</dd>
          </div>
        )}
        <div>
          <dt>Questions published</dt>
          <dd>{c.questions}</dd>
        </div>
        <div>
          <dt>Earlier events</dt>
          <dd>
            {c.history.length === 0
              ? 'No earlier events'
              : c.history.map((h) => (
                  <span key={h.date} className="out-hist">
                    {h.date}: {h.hires === null ? '–' : band(h.hires)} hires
                  </span>
                ))}
          </dd>
        </div>
      </dl>
    </div>
  )
}

function Toggle({ open, onClick, controls, name }: { open: boolean; onClick: () => void; controls: string; name: string }) {
  return (
    <button type="button" className="out-toggle" aria-expanded={open} aria-controls={controls} aria-label={`Details for ${name}`} onClick={onClick}>
      Details
    </button>
  )
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    ta.remove()
    return ok
  }
}

/** Event follow-up: a LinkedIn profile check 3 and 6 months after an event. */
export function Outcomes() {
  const [eventId, setEventId] = useState(DEFAULT_EVENT)
  const [cp, setCp] = useState<Checkpoint>(3)
  const [open, setOpen] = useState<string[]>([])
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle')
  const timer = useRef<number | undefined>(undefined)

  const s = summary(eventId, cp)
  const o = s.outcome
  const a = s.attendance
  const rows = sortedCompanies(s)
  const live = s.state !== 'scheduled'
  const sh = s.shown
  const segs: { key: string; label: string; n: number; shown: string }[] = [
    { key: 'picked', label: 'At a company they applied to meet', n: o.picked, shown: sh.picked },
    { key: 'elsewhere', label: 'New employer elsewhere', n: o.elsewhere, shown: sh.elsewhere },
    { key: 'none', label: 'No employer change', n: o.none, shown: sh.none },
    { key: 'unmatched', label: 'Profile not matched', n: o.unmatched, shown: String(o.unmatched) },
  ]
  const steps: [string, string][] = [
    ['Attendees looked up', `${s.checked} of ${s.total}`],
    ['Profiles matched', String(a.matched)],
    ['Changed employer', sh.changes],
    ['At a company they applied to meet', sh.picked],
  ]
  const scheduled = s.state === 'scheduled'

  const toggle = (id: string) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]))

  const choose = (fn: () => void) => {
    setOpen([])
    setCopied('idle')
    fn()
  }

  const copy = async () => {
    const ok = await copyText(s.reportText)
    setCopied(ok ? 'ok' : 'fail')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied('idle'), 2000)
  }

  const eventRows = EVENTS.map((e) => ({ e, s: summary(e.id, cp) }))

  return (
    <main className="page">
      <SiteHeader area="outcomes" event={s.event} />

      <section className="out-intro" aria-labelledby="out-title">
        <h1 id="out-title">Event follow-up</h1>
        <p className="out-lede">
          Three and six months after an event, a LinkedIn profile check counts how many attendees now work at a company they applied to meet.
        </p>
      </section>

      <div className="out-controls">
        <div className="out-field">
          <label htmlFor="out-event" className="out-label">Event</label>
          <select autoComplete="off" data-1p-ignore data-lpignore="true" data-bwignore data-form-type="other" id="out-event" className="out-select" value={eventId} onChange={(e) => choose(() => setEventId(e.target.value))}>
            {EVENTS.map((e) => (
              <option key={e.id} value={e.id}>{eventLabel(e)}</option>
            ))}
          </select>
        </div>
        <fieldset className="out-field out-switch">
          <legend className="out-label">Checkpoint</legend>
          <div className="out-switch__chips">
            {([3, 6] as const).map((c) => (
              <label key={c} className="chip">
                <input autoComplete="off" data-1p-ignore data-lpignore="true" data-bwignore data-form-type="other" type="radio" name="checkpoint" value={c} checked={cp === c} onChange={() => choose(() => setCp(c))} />
                <span className="chip__mark" aria-hidden="true" />
                {c} months
              </label>
            ))}
          </div>
        </fieldset>
        <div className="out-actions">
          <button type="button" className="btn-chip" onClick={copy}>
            {copied === 'ok' ? 'Copied' : 'Copy summary'}
          </button>
          <button type="button" className="btn-chip btn-chip--quiet" onClick={() => download(`plainly-follow-up-${s.event.id}.csv`, toCsv(s.event.id))}>
            Download CSV
          </button>
        </div>
      </div>
      <p className="out-sr" role="status">{copied === 'ok' ? 'Summary copied' : copied === 'fail' ? 'Could not copy the summary.' : ''}</p>

      <section className="out-section" aria-labelledby="out-h-check">
        <h2 id="out-h-check" className="out-h2">
          LinkedIn profile check at {cp} months <Provisional s={s} />
        </h2>
        <p className="out-status" role="status">{statusLine(s)}</p>
        {live && (
          <>
            <div className="out-headline">
              <div className={`out-hero${s.state === 'running' ? ' out-hero--provisional' : ''}`}>
                <p className="out-hero__label">Now working at a company they applied to meet</p>
                <p className="out-hero__value">
                  {s.state === 'running' && 'So far: '}
                  {sh.picked} of {a.matched}
                  {sh.pickedExact && <> · {pct(s.pickedShare.value)}</>}
                </p>
                <p className="out-hero__note">{sh.pickedExact ? `${sh.confirmed} of ${sh.picked} confirmed by the companies` : TOO_FEW}</p>
              </div>
              <ol className="out-steps">
                {steps.map(([label, value], i) => (
                  <li key={label}>
                    <span className="out-steps__n" aria-hidden="true">{i + 1}</span>
                    <span className="out-steps__value">{value}</span>
                    <span className="out-steps__label">{label}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="out-bar" role="img" aria-label={segs.map((g) => `${g.label} ${g.shown}`).join(', ')}>
              {segs.map((g) => g.n > 0 && <span key={g.key} className={`out-seg out-seg--${g.key}`} style={{ flexGrow: g.n }} />)}
            </div>
            <ul className="out-legend">
              {segs.map((g) => (
                <li key={g.key}>
                  <span className={`out-key out-seg--${g.key}`} aria-hidden="true" />
                  {g.label} <b>{g.shown}</b>
                </li>
              ))}
            </ul>
            <details className="out-about">
              <summary>About these figures</summary>
              <ul>
                <li>Shares are of matched profiles; with groups this small, treat them as rough.</li>
                <li>Profiles are often updated weeks after a job starts.</li>
                <li>Counts of 1 or 2 are shown as “1–2”.</li>
                <li>Attendees meet up to {MAX_PICKS} companies, so company counts add up to more than the attendee total.</li>
                <li>Results are counts per event and company, never a list of people; employer and start month are deleted after the 6-month check.</li>
              </ul>
            </details>
          </>
        )}
      </section>

      <section className="out-section" aria-labelledby="out-h-companies">
        <h2 id="out-h-companies" className="out-h2">Companies to follow up</h2>
        {scheduled && (
          <p className="out-sub">
            Profile checks scheduled {s.event.checks[3].date} (3 months) and {s.event.checks[6].date} (6 months).
          </p>
        )}
        <div className="out-table-wrap out-only-wide">
          <table className="out-table">
            <thead>
              <tr>
                <th scope="col">Company and role</th>
                {scheduled ? (
                  <>
                    <th scope="col" className="out-num">Invited</th>
                    <th scope="col" className="out-num">Attended</th>
                  </>
                ) : (
                  <>
                    <th scope="col">Follow-up</th>
                    <th scope="col" className="out-num">Hires found</th>
                    <th scope="col">Company report</th>
                  </>
                )}
                <th scope="col"><span className="out-sr">Details</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const id = `out-d-${c.id}`
                const isOpen = open.includes(c.id)
                return (
                  <Fragment key={c.id}>
                    <tr>
                      <th scope="row">
                        <span className="out-company">{c.company}</span>
                        <span className="out-role">{c.title}</span>
                      </th>
                      {scheduled ? (
                        <>
                          <td className="out-num">{c.invited}</td>
                          <td className="out-num">{c.attended}</td>
                        </>
                      ) : (
                        <>
                          <td><Follow c={c} s={s} /></td>
                          <td className="out-num"><HiresOther c={c} k={cp} s={s} /></td>
                          <td><Report c={c} s={s} /></td>
                        </>
                      )}
                      <td><Toggle open={isOpen} onClick={() => toggle(c.id)} controls={id} name={c.company} /></td>
                    </tr>
                    {isOpen && (
                      <tr className="out-detail-row">
                        <td colSpan={scheduled ? 4 : 5}><Details c={c} s={s} id={id} /></td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        <ul className="out-cards out-only-narrow">
          {rows.map((c) => {
            const id = `out-m-${c.id}`
            const isOpen = open.includes(c.id)
            return (
              <li key={c.id} className="out-card">
                <div className="out-card__top">
                  <p className="out-company">{c.company}</p>
                  {!scheduled && <p className="out-card__tag"><Follow c={c} s={s} /></p>}
                </div>
                <p className="out-role">{c.title}</p>
                {scheduled ? (
                  <p className="out-card__line">Invited {c.invited} · Attended {c.attended}</p>
                ) : (
                  <p className="out-card__line">Hires found <HiresOther c={c} k={cp} s={s} /> · <Report c={c} s={s} /></p>
                )}
                <Toggle open={isOpen} onClick={() => toggle(c.id)} controls={id} name={c.company} />
                {isOpen && <Details c={c} s={s} id={id} />}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="out-section" aria-labelledby="out-h-across">
        <h2 id="out-h-across" className="out-h2">Across events · {cp} months</h2>
        <ul className="out-across">
          {eventRows.map(({ e, s: r }) => (
            <li key={e.id} className={e.id === eventId ? 'is-selected' : undefined}>
              <p className="out-across__date">{e.date}</p>
              {r.state === 'done' ? (
                <>
                  <p className="out-across__share">{r.shown.pickedExact ? pct(r.pickedShare.value) : TOO_FEW}</p>
                  <p className="out-across__n">{r.shown.picked} of {r.attendance.matched}</p>
                </>
              ) : (
                <p><span className="out-pill">{r.state === 'running' ? 'Running' : `Scheduled ${r.checkDate}`}</span></p>
              )}
            </li>
          ))}
        </ul>
      </section>

    </main>
  )
}
