import { useRef, useState, type FormEvent } from 'react'
import { Arrow, Emblem, IntentShape } from './components/IntentShape'
import { FieldView } from './form/fields'
import { goalOf, intentSentence, isAnswered, missingOn, screenSummary, specificity } from './form/logic'
import { RolePreview } from './form/RolePreview'
import { ALL_FIELDS, GOALS, SCREENS, type Goal, type Value, type Values } from './form/schema'
import './App.css'

const EVENT = { name: 'Espoo Matchmaking Day', date: '4 Mar 2027' }
const STORAGE_KEY = 'plainly:role:v2'
const REVIEW = SCREENS.length

type Stored = { values: Values; savedAt: string }

function loadStored(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Stored) : null
  } catch {
    return null
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function focusFirstIn(id: string) {
  const el = document
    .getElementById(id)
    ?.querySelector<HTMLElement>('input:not([disabled]), textarea:not([disabled]), button:not([disabled])')
  el?.focus()
}

export default function App() {
  const [initial] = useState(loadStored)
  const [values, setValues] = useState<Values>(initial?.values ?? {})
  // A restored role opens on its review.
  const [index, setIndex] = useState(initial ? REVIEW : 0)
  const [invalid, setInvalid] = useState<Set<string>>(new Set())
  const [visited, setVisited] = useState<Set<string>>(new Set(initial ? SCREENS.map((s) => s.id) : []))
  const [changed, setChanged] = useState<Set<string>>(new Set())
  const [savedAt, setSavedAt] = useState<string | null>(initial?.savedAt ?? null)
  const [submitError, setSubmitError] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const goal = goalOf(values)
  const spec = goal ? specificity(values) : 0
  const sentence = intentSentence(values)
  const onReview = index >= REVIEW
  const screen = SCREENS[Math.min(index, REVIEW - 1)]
  const isDone = (i: number) => visited.has(SCREENS[i].id) && missingOn(SCREENS[i], values).length === 0
  const doneCount = SCREENS.filter((_, i) => isDone(i)).length
  const lastToFill = SCREENS.every((_, i) => i === index || isDone(i))

  function goTo(i: number) {
    setInvalid(new Set())
    setIndex(i)
    window.scrollTo({ top: 0 })
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function setField(id: string, v: Value) {
    setValues((prev) => ({ ...prev, [id]: v }))
    setSavedAt(null)
    setInvalid((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    const owner = SCREENS.find((s) => s.fields.some((f) => f.id === id))
    if (owner && visited.has(owner.id)) setChanged((prev) => new Set(prev).add(owner.id))
  }

  function next(e: FormEvent) {
    e.preventDefault()
    const missing = missingOn(screen, values)
    if (missing.length) {
      setInvalid(new Set(missing.map((f) => f.id)))
      focusFirstIn(`field-${missing[0].id}`)
      return
    }
    setVisited((prev) => new Set(prev).add(screen.id))
    const after = SCREENS.findIndex((_, i) => i > index && !isDone(i))
    goTo(after === -1 ? REVIEW : after)
  }

  function back() {
    goTo(Math.max(0, Math.min(index, REVIEW) - 1))
  }

  function submit() {
    const at = new Date().toISOString()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ values, savedAt: at } satisfies Stored))
      setSubmitError(false)
      setSavedAt(at)
      setChanged(new Set())
    } catch {
      setSubmitError(true)
    }
  }

  function addAnotherRole() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* storage unavailable: nothing to clear */
    }
    // Company answers are shared by every role, so they carry over.
    const kept: Values = {}
    for (const f of ALL_FIELDS) if (f.company && values[f.id]) kept[f.id] = values[f.id]
    setValues(kept)
    setVisited(new Set())
    setChanged(new Set())
    setSavedAt(null)
    setSubmitError(false)
    goTo(0)
  }

  const anyAnswer = ALL_FIELDS.some((f) => isAnswered(f, values[f.id]))

  return (
    <div className="shell">
      <aside className="field" aria-label="Your role">
        <div className="field__brand">
          <span className="wordmark">Plainly</span>
          <span className="field__tagline">for Espoo recruitment events</span>
        </div>
        <div className="field__figure">
          <IntentShape goal={goal} specificity={spec} />
        </div>
        <p className="intent" aria-live="polite">
          {goal ? <em>{sentence.lead}</em> : sentence.lead}
          <span className={goal ? undefined : 'intent__quiet'}>{goal ? sentence.rest : ` ${sentence.rest}`}</span>
        </p>
        <ul className="legend" aria-label="Role status">
          {(Object.keys(GOALS) as Goal[]).map((g) => (
            <li key={g} className={g === goal ? 'is-on' : undefined} aria-current={g === goal ? 'true' : undefined}>
              <Emblem goal={g} />
              {GOALS[g].name}
            </li>
          ))}
        </ul>
      </aside>

      <main className="work">
        <header className="topbar">
          <nav aria-label="Sections" className="tabs">
            <a href="#form" aria-current="page">
              Role
            </a>
            <span aria-disabled="true">
              Events <small>soon</small>
            </span>
            <span aria-disabled="true">
              Company page <small>soon</small>
            </span>
          </nav>
          <p className="event-chip">
            Sample event · <b>{EVENT.name}</b> · {EVENT.date}
          </p>
        </header>

        <div className="progress" aria-label={`${doneCount} of ${SCREENS.length} steps complete`}>
          <ol className="progress__bars" aria-hidden="true">
            {SCREENS.map((s, i) => (
              <li key={s.id} className={!onReview && i === index ? 'is-current' : isDone(i) ? 'is-done' : undefined} />
            ))}
          </ol>
          <span>{onReview ? 'Review' : `Step ${index + 1} of ${SCREENS.length}`}</span>
        </div>

        {onReview ? (
          <section className="review" id="form" aria-labelledby="review-title">
            <h1 id="review-title" ref={headingRef} tabIndex={-1}>
              Review your role page
            </h1>
            <p className="hint">
              This is how the role appears to attendees of {EVENT.name}. You can change any step before submitting.
            </p>
            <RolePreview values={values} />
            <div className="actions actions--review">
              <button type="button" className="btn" onClick={submit} disabled={savedAt !== null}>
                {savedAt ? 'Submitted' : 'Submit role'} {!savedAt && <Arrow />}
              </button>
              {savedAt ? (
                <button type="button" className="btn-quiet" onClick={addAnotherRole}>
                  Add another role
                </button>
              ) : (
                <button type="button" className="btn-quiet" onClick={back}>
                  Back
                </button>
              )}
            </div>
            <p className="status" role="status">
              {submitError
                ? 'Could not submit the role. Try again.'
                : savedAt
                  ? `Role submitted ${formatTime(savedAt)}. Change an answer to submit an update.`
                  : ''}
            </p>
          </section>
        ) : (
          <form className="question" id="form" onSubmit={next} noValidate>
            <h1 ref={headingRef} tabIndex={-1}>
              {screen.title}
            </h1>
            {screen.hint && <p className="hint">{screen.hint}</p>}
            <p className="error" role="alert">
              {invalid.size === 0 ? '' : invalid.size === 1 ? 'One answer is missing.' : `${invalid.size} answers are missing.`}
            </p>
            <div className="fields">
              {screen.fields.map((f) => (
                <FieldView
                  key={f.id}
                  field={f}
                  value={values[f.id]}
                  invalid={invalid.has(f.id)}
                  onChange={(v) => setField(f.id, v)}
                />
              ))}
            </div>
            <div className="actions">
              <button type="submit" className="btn">
                {lastToFill ? 'Review role page' : 'Next'} <Arrow />
              </button>
              <button type="button" className="btn-quiet" onClick={back} disabled={index === 0}>
                Back
              </button>
            </div>
          </form>
        )}

        <section className="ledger" aria-labelledby="ledger-title">
          <h2 id="ledger-title">Your answers</h2>
          {!anyAnswer && visited.size === 0 ? (
            <p className="ledger__empty">No answers yet.</p>
          ) : (
            <table>
              <colgroup>
                <col className="ledger__col-n" />
                <col className="ledger__col-q" />
                <col />
                <col className="ledger__col-edit" />
              </colgroup>
              <thead className="visually-hidden">
                <tr>
                  <th scope="col">Step</th>
                  <th scope="col">Section</th>
                  <th scope="col">Your answers</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {SCREENS.map((s, i) => {
                  const summary = screenSummary(s, values)
                  if (!visited.has(s.id) && !summary) return null
                  return (
                    <tr key={s.id} className={!onReview && i === index ? 'is-current' : undefined}>
                      <td className="ledger__n">{i + 1}</td>
                      <td className="ledger__q">{s.name}</td>
                      <td className="ledger__a">
                        <span className="ledger__clamp">{summary || 'Not answered yet'}</span>
                        {changed.has(s.id) && <span className="tag">changed</span>}
                      </td>
                      <td className="ledger__edit">
                        <button type="button" onClick={() => goTo(i)} aria-label={`Change: ${s.name}`}>
                          Change
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  )
}
