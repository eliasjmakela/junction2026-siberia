import { Fragment, useRef, useState } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import {
  COMPANIES,
  DEFAULT_EVENT,
  RUNNING_LEFT,
  RUNNING_START,
  EVENTS,
  TOO_FEW,
  band,
  pct,
  range,
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

const eventLabel = (e: { name: string; date: string }) => `${e.name} · ${e.date}`

function statusLine(s: Summary): string {
  if (s.state === 'done') return `Profile check done ${s.checkDate}`
  if (s.state === 'running') return `Profile check running · ${s.checked} of ${s.total} profiles · figures are provisional`
  return `Profile check scheduled ${s.checkDate}`
}

function Provisional({ s }: { s: Summary }) {
  return s.state === 'running' ? <span className="out-pill">Provisional</span> : null
}

/** A share with its rough range and counts; banded numerators hide the share. */
function ShareCell({ s }: { s: Summary }) {
  if (s.state === 'scheduled') return <span className="out-pill">Scheduled {s.checkDate}</span>
  if (s.state === 'running') return <span className="out-pill">Running</span>
  const m = s.attendance.matched
  if (!s.shown.pickedExact) {
    return (
      <>
        {TOO_FEW}
        <span className="out-range">{s.shown.picked} of {m}</span>
      </>
    )
  }
  return (
    <>
      {pct(s.pickedShare.value)}
      <span className="out-range">
        {range(s.pickedShare)} · {s.shown.picked} of {m}
      </span>
    </>
  )
}

function Lane({ a, max, running }: { a: { id: number; assigned: number; done: number; matched: number }; max: number; running: boolean }) {
  const open = a.assigned - a.done
  return (
    <li className="out-lane">
      <span className="out-lane__n">Agent {a.id}</span>
      <span className="out-lane__track" style={{ width: `${(a.assigned / max) * 100}%` }}>
        <span className="out-lane__done" style={{ flexGrow: a.done }} />
        {open > 0 && <span className="out-lane__open" style={{ flexGrow: open }} />}
      </span>
      <span className="out-lane__count">{running ? `${a.done} of ${a.assigned} profiles` : `${a.done} profiles`}</span>
      <span className="out-lane__count">
        {band(a.matched)} matched · {band(a.done - a.matched)} not matched
      </span>
    </li>
  )
}

function PagesLane({ done, total }: { done: number; total: number }) {
  return (
    <li className="out-lane">
      <span className="out-lane__n">Company pages</span>
      <span className="out-lane__track" style={{ width: '100%' }}>
        <span className="out-lane__done" style={{ flexGrow: done }} />
        {total > done && <span className="out-lane__open" style={{ flexGrow: total - done }} />}
      </span>
      <span className="out-lane__count">{done} of {total} pages</span>
    </li>
  )
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
  return (
    <div className="out-details" id={id}>
      <dl>
        <div>
          <dt>Applicants</dt>
          <dd>{c.applicants}</dd>
        </div>
        {s.state !== 'scheduled' && (
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
    <button type="button" className="out-toggle" aria-expanded={open} aria-controls={controls} aria-label={`Details, ${name}`} onClick={onClick}>
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

/**
 * Concept demo of the event follow-up: a LinkedIn profile check, 3 and 6
 * months after an event, shows who now works at a company they applied to
 * meet. Every figure is simulated from fixed seeds.
 */
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
  const maxAssigned = Math.max(...s.agents.map((x) => x.assigned), 1)
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
    ['Employer changes', sh.changes],
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
      <SiteHeader area="outcomes" note="Concept demo" event={s.event} />

      <section className="out-intro" aria-labelledby="out-title">
        <p className="out-demo">Concept demo · simulated data</p>
        <h1 id="out-title">Event follow-up</h1>
        <p className="out-lede">
          3 and 6 months after an event, a check of attendees' and companies' LinkedIn profiles shows who now works at a company they applied to meet.
          Every figure on this page is simulated sample data. Nothing is looked up or collected.
        </p>
      </section>

      <div className="out-controls">
        <div className="out-field">
          <label htmlFor="out-event" className="out-label">Event</label>
          <select id="out-event" className="out-select" value={eventId} onChange={(e) => choose(() => setEventId(e.target.value))}>
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
                <input type="radio" name="checkpoint" value={c} checked={cp === c} onChange={() => choose(() => setCp(c))} />
                <span className="chip__mark" aria-hidden="true" />
                {c} months
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="out-statusbar">
        <p className="out-status" role="status">{statusLine(s)}</p>
        <div className="out-actions">
          <button type="button" className="btn-chip" onClick={copy}>
            {copied === 'ok' ? 'Copied' : 'Copy summary'}
          </button>
          <button type="button" className="btn-chip btn-chip--quiet" onClick={() => download(`plainly-follow-up-${s.event.id}.csv`, toCsv(s.event.id))}>
            Download CSV
          </button>
        </div>
      </div>
      <p className="out-sr" role="status">{copied === 'ok' ? 'Summary copied' : copied === 'fail' ? 'Copy not available in this browser' : ''}</p>

      <section className="out-section" aria-labelledby="out-h-attendees">
        <h2 id="out-h-attendees" className="out-h2">
          Attendees at {cp} months <Provisional s={s} />
        </h2>
        {!live ? (
          <p className="out-pending">
            The profile check is scheduled for {s.checkDate}. {a.attended} attended of {a.invited} invited.
          </p>
        ) : (
          <>
            <div className="out-headline">
              <div className={`out-hero${s.state === 'running' ? ' out-hero--provisional' : ''}`}>
                <p className="out-hero__label">Working at a company they applied to meet</p>
                <p className="out-hero__value">
                  {s.state === 'running' && 'So far: '}
                  {sh.picked} of {a.matched} matched profiles
                  {sh.pickedExact && <> · {pct(s.pickedShare.value)}</>}
                </p>
                <p className="out-hero__note">{sh.pickedExact ? `Rough range ${range(s.pickedShare)}` : TOO_FEW}</p>
                {s.previous && (
                  <p className="out-hero__prev">
                    Previous event at {cp} months: {s.previous.picked} of {s.previous.matched}
                    {s.previous.share && <> · {s.previous.share}</>}
                  </p>
                )}
              </div>
              <dl className="out-facts">
                <div>
                  <dt>Attended</dt>
                  <dd>{a.attended} attended of {a.invited} invited</dd>
                </div>
                <div>
                  <dt>Profiles matched</dt>
                  <dd>{a.matched} of {a.attended}</dd>
                </div>
                <div>
                  <dt>Employer changes</dt>
                  <dd>{sh.changes}</dd>
                </div>
                <div>
                  <dt>Confirmed by company</dt>
                  <dd>{sh.confirmed} of {sh.picked}</dd>
                </div>
              </dl>
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
          </>
        )}
        {!scheduled && (
          <ul className="out-caveats">
            <li>Ranges are 95% Wilson intervals over matched profiles.</li>
            <li>Profiles are often updated weeks after a job starts.</li>
            <li>Counts of 1–2 are shown as "1–2".</li>
          </ul>
        )}
      </section>

      <section className="out-section" aria-labelledby="out-h-check">
        <h2 id="out-h-check" className="out-h2">
          LinkedIn profile check <Provisional s={s} />
        </h2>
        <p className="out-sub">What the check found at this checkpoint.</p>
        {!live ? (
          <p className="out-pending">No check yet.</p>
        ) : (
          <>
            <ol className="out-steps">
              {steps.map(([label, value], i) => (
                <li key={label}>
                  <span className="out-steps__n" aria-hidden="true">{i + 1}</span>
                  <span className="out-steps__value">{value}</span>
                  <span className="out-steps__label">{label}</span>
                </li>
              ))}
            </ol>
            <p className="out-label out-label--gap" id="out-agents">Agents</p>
            <ol className="out-lanes" aria-labelledby="out-agents">
              {s.agents.map((x) => (
                <Lane key={x.id} a={x} max={maxAssigned} running={s.state === 'running'} />
              ))}
              <PagesLane done={s.pages.done} total={s.pages.total} />
            </ol>
            <p className="out-sub">
              6 agents in parallel · {s.total} attendee profiles and {COMPANIES.length} company pages ·{' '}
              {s.state === 'running' ? `started ${s.checkDate}, ${RUNNING_START} · ${RUNNING_LEFT}` : `${s.minutes} min`}
            </p>
            <p className="out-label out-label--gap">Cross-checks</p>
            <p className="out-cross">
              <span>Company hire reports {s.crossChecks.reports} of {COMPANIES.length}</span>
              <span>Survey answers: {s.crossChecks.surveys} · {band(s.crossChecks.differ)} differ from the profile</span>
            </p>
          </>
        )}
      </section>

      <section className="out-section" aria-labelledby="out-h-companies">
        <h2 id="out-h-companies" className="out-h2">
          Companies <Provisional s={s} />
        </h2>
        <p className="out-sub">
          {scheduled
            ? `Profile checks scheduled ${s.event.checks[3].date} (3 months) and ${s.event.checks[6].date} (6 months).`
            : 'Hires found by the profile check, per company. Attendees meet up to three companies, so company counts add up to more than the attendee total.'}
        </p>
        <div className="out-table-wrap out-only-wide">
          <table className="out-table">
            <thead>
              <tr>
                <th scope="col">Company and role</th>
                <th scope="col" className="out-num">Invited</th>
                <th scope="col" className="out-num">Attended</th>
                {!scheduled && (
                  <>
                    <th scope="col" className="out-num">Hires 3 m</th>
                    <th scope="col" className="out-num">Hires 6 m</th>
                    <th scope="col">Company report, {cp} m</th>
                    <th scope="col">Follow-up</th>
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
                      <td className="out-num">{c.invited}</td>
                      <td className="out-num">{c.attended}</td>
                      {!scheduled && (
                        <>
                          <td className={`out-num${cp === 3 ? ' is-current' : ''}`}><HiresOther c={c} k={3} s={s} /></td>
                          <td className={`out-num${cp === 6 ? ' is-current' : ''}`}><HiresOther c={c} k={6} s={s} /></td>
                          <td><Report c={c} s={s} /></td>
                          <td><Follow c={c} s={s} /></td>
                        </>
                      )}
                      <td><Toggle open={isOpen} onClick={() => toggle(c.id)} controls={id} name={c.company} /></td>
                    </tr>
                    {isOpen && (
                      <tr className="out-detail-row">
                        <td colSpan={scheduled ? 4 : 8}><Details c={c} s={s} id={id} /></td>
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
                <p className="out-company">{c.company}</p>
                <p className="out-role">{c.title}</p>
                <dl>
                  <div><dt>Invited</dt><dd>{c.invited}</dd></div>
                  <div><dt>Attended</dt><dd>{c.attended}</dd></div>
                  {!scheduled && (
                    <>
                      <div><dt>Hires 3 m</dt><dd><HiresOther c={c} k={3} s={s} /></dd></div>
                      <div><dt>Hires 6 m</dt><dd><HiresOther c={c} k={6} s={s} /></dd></div>
                      <div><dt>Company report, {cp} m</dt><dd><Report c={c} s={s} /></dd></div>
                      <div><dt>Follow-up</dt><dd><Follow c={c} s={s} /></dd></div>
                    </>
                  )}
                </dl>
                <Toggle open={isOpen} onClick={() => toggle(c.id)} controls={id} name={c.company} />
                {isOpen && <Details c={c} s={s} id={id} />}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="out-section" aria-labelledby="out-h-across">
        <h2 id="out-h-across" className="out-h2">Across events</h2>
        <p className="out-sub">The same checkpoint across sample events.</p>
        <div className="out-table-wrap">
          <table className="out-table out-table--across">
            <thead>
              <tr>
                <th scope="col">Event date</th>
                <th scope="col" className="out-num">Attended</th>
                <th scope="col" className="out-num">Profiles matched</th>
                <th scope="col" className="out-num">{`At a company they applied to meet, ${cp} m`}</th>
              </tr>
            </thead>
            <tbody>
              {eventRows.map(({ e, s: r }) => (
                <tr key={e.id} className={e.id === eventId ? 'is-selected' : undefined}>
                  <th scope="row">{e.date}</th>
                  <td className="out-num">{r.attendance.attended}</td>
                  {r.state === 'done' ? (
                    <>
                      <td className="out-num">{r.attendance.matched}</td>
                      <td className="out-num"><ShareCell s={r} /></td>
                    </>
                  ) : (
                    <td className="out-num" colSpan={2}>
                      <span className="out-pill">{r.state === 'running' ? 'Running' : `Scheduled ${r.checkDate}`}</span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="out-section" aria-labelledby="out-h-summary">
        <h2 id="out-h-summary" className="out-h2">Summary for a report</h2>
        <p className="out-sub">Assembled from the figures above.</p>
        <p className="out-summary">{s.reportText}</p>
      </section>

      <section className="out-section out-live" aria-labelledby="out-h-live">
        <h2 id="out-h-live" className="out-label">For a live deployment</h2>
        <ul>
          <li>LinkedIn's terms restrict automated access, so profile checks need an approved data source.</li>
          <li>Attendees agree to the follow-up when they apply and can withdraw.</li>
          <li>Purpose is event evaluation only; employer and start month are deleted after the 6-month check. Results are counts per event and company, never a list of people.</li>
        </ul>
      </section>

      <p className="out-colophon">Simulated sample events, generated from fixed seeds.</p>
    </main>
  )
}
