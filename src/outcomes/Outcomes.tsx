import { useState } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import { EVENT_DATE, summary, type Checkpoint, type Interval } from './data'
import '../form/fields.css'
import './outcomes.css'

const pct = (x: number) => `${Math.round(x * 100)}%`
const range = (i: Interval) => `${pct(i.low)}–${pct(i.high)}`

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="out-stat">
      <dt>{label}</dt>
      <dd className="out-stat__value">{value}</dd>
      <dd className="out-stat__note">{note}</dd>
    </div>
  )
}

type Bar = { label: string; value: number; tone: 'base' | 'fit' | 'other' | 'open'; note?: string }

function FunnelChart({ bars, max }: { bars: Bar[]; max: number }) {
  return (
    <ol className="out-funnel" aria-label="Participants at each stage">
      {bars.map((b) => (
        <li key={b.label} className={`out-funnel__row out-funnel__row--${b.tone}`}>
          <span className="out-funnel__label">{b.label}</span>
          <span className="out-funnel__track">
            <span className="out-funnel__bar" style={{ width: `${Math.max(b.value ? 1.5 : 0, (b.value / max) * 100)}%` }} />
            <span className="out-funnel__value">
              {b.value}
              {b.note && <span className="out-funnel__note"> {b.note}</span>}
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}

function RateCell({ rate }: { rate: Interval }) {
  if (!rate.n) return <td className="out-num out-muted">No data</td>
  return (
    <td className="out-num">
      {pct(rate.value)}
      <span className="out-range">
        {range(rate)} · n {rate.n}
      </span>
    </td>
  )
}

const PIPELINE: { title: string; body: string }[] = [
  { title: 'Participant list', body: 'Companies and attendees of the event, from the shortlist records.' },
  { title: 'Profile lookup', body: 'At 3 and 6 months, parallel workers look up company pages and the profiles of attendees who opted in.' },
  { title: 'Employer and start date', body: 'Each found profile gives a current employer and the month the job started.' },
  { title: 'Match to picks', body: 'The employer is compared with the companies the attendee applied to meet.' },
  { title: 'Aggregate', body: 'Counts per company and per stage. Per-person results are never reported.' },
  { title: 'Estimates', body: 'Shares with rough ranges, compared across checkpoints.' },
]

const REAL_NOTES = [
  "LinkedIn's terms prohibit automated scraping. A real follow-up would use an approved data source, profiles that attendees choose to link when they apply, or a short follow-up survey.",
  'Consent is asked at application, for this purpose only, and can be withdrawn at any time.',
  'Only the current employer and start month are kept, for the 6-month follow-up period, then deleted.',
  'Results are reported in aggregate per company and event, never about one person.',
  'Companies can report their own hires from the event as a cross-check.',
]

/**
 * Concept demo of the event follow-up: rough estimates of whether attendees
 * found work at the companies they applied to meet, 3 and 6 months after the
 * event. Every figure is simulated from a fixed-seed sample cohort.
 */
export function Outcomes() {
  const [checkpoint, setCheckpoint] = useState<Checkpoint>(3)
  const s = summary(checkpoint)
  const f = s.funnel
  const notFound = f.matched - f.picked - f.elsewhere
  const bars: Bar[] = [
    { label: 'Applied', value: f.applied, tone: 'base' },
    { label: 'Invited', value: f.invited, tone: 'base' },
    { label: 'Attended', value: f.attended, tone: 'base' },
    { label: 'Profile matched', value: f.matched, tone: 'base' },
    { label: 'Working at a picked company', value: f.picked, tone: 'fit' },
    { label: 'Working elsewhere, new job', value: f.elsewhere, tone: 'other' },
    { label: 'No new job found', value: notFound, tone: 'open' },
  ]

  return (
    <main className="page">
      <SiteHeader area="outcomes" note="Concept demo" />

      <section className="out-intro" aria-labelledby="out-title">
        <p className="out-demo">Concept demo · simulated data</p>
        <h1 id="out-title">Event follow-up</h1>
        <p className="out-lede">
          Rough estimates of whether attendees found work at the companies they applied to meet, 3 and 6 months after the event on {EVENT_DATE}.
          Every figure on this page comes from a simulated sample cohort. Nothing is looked up or collected.
        </p>
      </section>

      <fieldset className="out-switch">
        <legend>Checkpoint</legend>
        <div className="out-switch__chips">
          {([3, 6] as const).map((c) => (
            <label key={c} className="chip">
              <input type="radio" name="checkpoint" value={c} checked={checkpoint === c} onChange={() => setCheckpoint(c)} />
              <span className="chip__mark" aria-hidden="true" />
              {c} months
            </label>
          ))}
        </div>
        <p className="out-switch__meta">Simulated check on {s.checkedOn}</p>
      </fieldset>

      <section className="out-section" aria-labelledby="out-headline">
        <h2 id="out-headline" className="out-h2">
          Estimates at {checkpoint} months
        </h2>
        <div className="out-headline">
          <div className="out-hero">
            <p className="out-hero__label">Matched attendees working at a company they picked</p>
            <p className="out-hero__value">{pct(s.pickedShare.value)}</p>
            <p className="out-hero__note">
              Rough range {range(s.pickedShare)} · {f.picked} of {s.pickedShare.n} matched attendees
            </p>
          </div>
          <dl className="out-stats">
            <Stat label="In a new job anywhere" value={pct(s.anyJobShare.value)} note={`Rough range ${range(s.anyJobShare)}`} />
            <Stat label="Hires at picked companies" value={String(s.hires)} note={`Across ${s.companies.length} companies`} />
            <Stat label="Attendee profiles matched" value={pct(s.coverage.value)} note={`${f.matched} of ${f.attended} attendees`} />
          </dl>
        </div>
        <ul className="out-caveats">
          <li>Ranges are 95% Wilson intervals: with counts this small, treat every share as a rough estimate.</li>
          <li>Profiles are incomplete and often updated weeks after a job starts, so early checkpoints undercount.</li>
          <li>A hire after the event does not show that the event caused it.</li>
        </ul>
      </section>

      <section className="out-section" aria-labelledby="out-funnel">
        <h2 id="out-funnel" className="out-h2">
          From application to work
        </h2>
        <p className="out-sub">Participants at each stage, {checkpoint} months after the event. The last three rows split the matched attendees.</p>
        <FunnelChart bars={bars} max={f.applied} />
      </section>

      <section className="out-section" aria-labelledby="out-companies">
        <h2 id="out-companies" className="out-h2">
          By company
        </h2>
        <p className="out-sub">
          Hire rate compares matched attendees each company invited with matched applicants it did not invite. It is a rough comparison, not a causal effect.
        </p>
        <div className="out-table-wrap" tabIndex={0} role="region" aria-labelledby="out-companies">
          <table className="out-table">
            <thead>
              <tr>
                <th scope="col">Company and role</th>
                <th scope="col" className="out-num">Applicants</th>
                <th scope="col" className="out-num">Invited</th>
                <th scope="col" className="out-num">Attended</th>
                <th scope="col" className={`out-num${checkpoint === 3 ? ' is-current' : ''}`}>Hires 3 m</th>
                <th scope="col" className={`out-num${checkpoint === 6 ? ' is-current' : ''}`}>Hires 6 m</th>
                <th scope="col" className="out-num">Hire rate if invited</th>
                <th scope="col" className="out-num">Hire rate if not invited</th>
              </tr>
            </thead>
            <tbody>
              {s.companies.map((c) => (
                <tr key={c.id}>
                  <th scope="row">
                    <span className="out-company">{c.company}</span>
                    <span className="out-role">{c.title}</span>
                  </th>
                  <td className="out-num">{c.applicants}</td>
                  <td className="out-num">{c.invited}</td>
                  <td className="out-num">{c.attended}</td>
                  <td className={`out-num${checkpoint === 3 ? ' is-current' : ''}`}>{c.hires[3]}</td>
                  <td className={`out-num${checkpoint === 6 ? ' is-current' : ''}`}>{c.hires[6]}</td>
                  <RateCell rate={c.invitedRate} />
                  <RateCell rate={c.otherRate} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="out-foot">Sample companies. Hire rates are at the selected checkpoint.</p>
      </section>

      <section className="out-section" aria-labelledby="out-how">
        <h2 id="out-how" className="out-h2">
          How the follow-up would work
        </h2>
        <ol className="out-pipeline">
          {PIPELINE.map((step, i) => (
            <li key={step.title} className={`out-step${i === 1 ? ' out-step--parallel' : ''}`}>
              <span className="out-step__n">{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              {i === 1 && (
                <span className="out-lanes" aria-hidden="true">
                  {Array.from({ length: 6 }, (_, k) => (
                    <span key={k} />
                  ))}
                </span>
              )}
            </li>
          ))}
        </ol>

        <h3 className="out-h3">Simulated run at {checkpoint} months</h3>
        <p className="out-sub">Six lookup workers take batches in parallel; the last batch covers the company pages.</p>
        <div className="out-table-wrap" tabIndex={0} role="region" aria-label={`Simulated run at ${checkpoint} months`}>
          <table className="out-table out-table--log">
            <thead>
              <tr>
                <th scope="col" className="out-num">Batch</th>
                <th scope="col">Worker</th>
                <th scope="col" className="out-num">Profiles</th>
                <th scope="col" className="out-num">Matched</th>
                <th scope="col" className="out-num">New employer</th>
                <th scope="col" className="out-num">Time</th>
              </tr>
            </thead>
            <tbody>
              {s.batches.map((b) => (
                <tr key={b.batch}>
                  <td className="out-num">{b.batch}</td>
                  <td>{b.worker}</td>
                  <td className="out-num">{b.profiles}</td>
                  <td className="out-num">{b.matched}</td>
                  <td className="out-num">{b.employers}</td>
                  <td className="out-num">{b.seconds} s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="out-section out-real" aria-labelledby="out-real">
        <h2 id="out-real" className="out-label">
          Before building this for real
        </h2>
        <ul>
          {REAL_NOTES.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      <p className="out-colophon">Simulated sample cohort of {f.applied} applicants and five sample companies, generated from a fixed seed.</p>
    </main>
  )
}
