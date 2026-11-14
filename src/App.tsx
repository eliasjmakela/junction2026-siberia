import { useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { Arrow, Emblem, IntentShape } from './components/IntentShape'
import { DRILL_LENGTH, FIRST, GOALS, PATHS, type Goal, type Question } from './drill/questions'
import './App.css'

type Answer = { optionId?: string; text?: string }
type Answers = Record<string, Answer>

const EVENT = { name: 'Espoo Matchmaking Day', date: '4 Mar 2027' }
const STORAGE_KEY = 'plainly:intent:v1'

type Saved = { answers: Answers; savedAt: string }

function loadSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Saved) : null
  } catch {
    return null
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function answerLabel(q: Question, a: Answer | undefined): string | null {
  if (!a) return null
  if (a.text?.trim()) return a.text.trim()
  return q.options.find((o) => o.id === a.optionId)?.label ?? null
}

function isAnswered(a: Answer | undefined) {
  return Boolean(a && (a.optionId || a.text?.trim()))
}

function lower(s: string | null) {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : null
}

/** The answer as it reads inside the summary sentence. */
function summaryLabel(q: Question, a: Answer | undefined): string | null {
  if (!a) return null
  if (a.text?.trim()) return lower(a.text.trim())
  const o = q.options.find((x) => x.id === a.optionId)
  return o ? (o.summary ?? lower(o.label)) : null
}

function intentSentence(goal: Goal | null, seq: Question[], answers: Answers): { lead: string; rest: string } {
  const get = (id: string) => {
    const q = seq.find((x) => x.id === id)
    return q ? summaryLabel(q, answers[id]) : null
  }
  if (!goal) return { lead: 'No goal yet.', rest: 'Your intent appears here as you answer.' }
  if (goal === 'need') {
    const parts = [get('role'), get('headcount') && `${get('headcount')} of them`, get('start')].filter(Boolean)
    return { lead: 'Hire for a specific need', rest: parts.length ? `: ${parts.join(', ')}.` : '.' }
  }
  if (goal === 'visibility') {
    const who = get('who')
    const what = get('what')
    const rest = [who && ` by ${who}`, what && `, remembered for ${what}`].filter(Boolean).join('')
    return { lead: 'Be seen', rest: `${rest}.` }
  }
  const good = get('good')
  const team = get('teams')
  const rest = [good && `: ${good}`, team && `, in ${team}`].filter(Boolean).join('')
  return { lead: 'Hire in general', rest: `${rest}.` }
}

export default function App() {
  const [initial] = useState(loadSaved)
  const [answers, setAnswers] = useState<Answers>(initial?.answers ?? {})
  // A restored intent opens on its summary.
  const [index, setIndex] = useState(initial ? Number.MAX_SAFE_INTEGER : 0)
  const [error, setError] = useState<string | null>(null)
  const [changed, setChanged] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState<Set<string>>(new Set())
  const [savedAt, setSavedAt] = useState<string | null>(initial?.savedAt ?? null)
  const [submitError, setSubmitError] = useState(false)
  const firstInput = useRef<HTMLInputElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const ownId = useId()

  const goal = (FIRST.options.find((o) => o.id === answers[FIRST.id]?.optionId)?.goal ?? null) as Goal | null
  const seq = useMemo<Question[]>(() => (goal ? [FIRST, ...PATHS[goal]] : [FIRST]), [goal])
  const pathAnswered = goal ? PATHS[goal].filter((q) => isAnswered(answers[q.id])).length : 0
  const specificity = goal ? pathAnswered / PATHS[goal].length : 0
  const answeredCount = seq.filter((q) => isAnswered(answers[q.id])).length
  const done = goal !== null && answeredCount === seq.length && index >= seq.length
  const q = seq[Math.min(index, seq.length - 1)]
  const current = answers[q.id]
  const sentence = intentSentence(goal, seq, answers)

  function focusQuestion() {
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function setAnswer(next: Answer) {
    setError(null)
    setSavedAt(null)
    setAnswers((prev) => {
      const out = { ...prev, [q.id]: next }
      // Changing the goal changes the path: drop answers the new path does not ask.
      if (q.id === FIRST.id && next.optionId !== prev[FIRST.id]?.optionId) {
        const g = FIRST.options.find((o) => o.id === next.optionId)?.goal
        const keep = new Set([FIRST.id, ...(g ? PATHS[g].map((x) => x.id) : [])])
        for (const k of Object.keys(out)) if (!keep.has(k)) delete out[k]
      }
      return out
    })
    if (submitted.has(q.id)) setChanged((prev) => new Set(prev).add(q.id))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!isAnswered(current)) {
      setError(q.allowOwnWords ? 'Choose an answer or write your own to continue.' : 'Choose an answer to continue.')
      firstInput.current?.focus()
      return
    }
    setSubmitted((prev) => new Set(prev).add(q.id))
    // Go to the first unanswered question after this one, then any earlier gap, or finish.
    const nextIndex = seq.findIndex((x, i) => i > index && !isAnswered(answers[x.id]))
    const firstGap = seq.findIndex((x) => !isAnswered(answers[x.id]))
    setIndex(nextIndex !== -1 ? nextIndex : firstGap !== -1 ? firstGap : seq.length)
    focusQuestion()
  }

  function back() {
    setError(null)
    setIndex((i) => Math.max(0, Math.min(i, seq.length) - 1))
    focusQuestion()
  }

  function edit(i: number) {
    setError(null)
    setIndex(i)
    focusQuestion()
  }

  function submitIntent() {
    const at = new Date().toISOString()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, savedAt: at } satisfies Saved))
      setSubmitError(false)
      setSavedAt(at)
    } catch {
      setSubmitError(true)
    }
  }

  function restart() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* storage unavailable: nothing to clear */
    }
    setAnswers({})
    setChanged(new Set())
    setSubmitted(new Set())
    setSavedAt(null)
    setError(null)
    setIndex(0)
    focusQuestion()
  }

  const progressTotal = goal ? seq.length : DRILL_LENGTH

  return (
    <div className="shell">
      <aside className="field" aria-label="Your intent">
        <div className="field__brand">
          <span className="wordmark">Plainly</span>
          <span className="field__tagline">for Espoo recruitment events</span>
        </div>
        <div className="field__figure">
          <IntentShape goal={goal} specificity={done ? 1 : specificity} />
        </div>
        <p className="intent" aria-live="polite">
          {goal ? <em>{sentence.lead}</em> : sentence.lead}
          <span className={goal ? undefined : 'intent__quiet'}>{goal ? sentence.rest : ` ${sentence.rest}`}</span>
        </p>
        <ul className="legend" aria-label="The three goals">
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
            <a href="#drill" aria-current="page">
              Drill
            </a>
            <span aria-disabled="true">
              Events <small>soon</small>
            </span>
            <span aria-disabled="true">
              Company profile <small>soon</small>
            </span>
          </nav>
          <p className="event-chip">
            Sample event · <b>{EVENT.name}</b> · {EVENT.date}
          </p>
        </header>

        <div className="progress" aria-label={`${Math.min(answeredCount, progressTotal)} of ${progressTotal} answered`}>
          <ol className="progress__bars" aria-hidden="true">
            {Array.from({ length: progressTotal }, (_, i) => (
              <li
                key={i}
                className={
                  !done && i === index ? 'is-current' : isAnswered(answers[seq[i]?.id ?? '']) ? 'is-done' : undefined
                }
              />
            ))}
          </ol>
          <span>{done ? 'All answered' : `Question ${index + 1} of ${progressTotal}`}</span>
        </div>

        {done ? (
          <section className="result" id="drill" aria-labelledby="result-title">
            <h1 id="result-title" ref={headingRef} tabIndex={-1}>
              <Emblem goal={goal} size={32} />
              {sentence.lead}
              {sentence.rest}
            </h1>
            <p className="hint">
              Summary for {EVENT.name}. You can change any answer below before submitting.
            </p>
            <div className="actions">
              <button type="button" className="btn" onClick={submitIntent} disabled={savedAt !== null}>
                {savedAt ? 'Submitted' : 'Submit intent'} {!savedAt && <Arrow />}
              </button>
              <button type="button" className="btn-quiet" onClick={restart}>
                Start over
              </button>
            </div>
            <p className="status" role="status">
              {submitError
                ? 'Could not submit your intent. Try again.'
                : savedAt
                  ? `Intent submitted ${formatTime(savedAt)}. Change an answer to submit an update.`
                  : ''}
            </p>
          </section>
        ) : (
          <form className="question" id="drill" onSubmit={submit} noValidate>
            <h1 id="q-title" ref={headingRef} tabIndex={-1}>
              {q.prompt}
            </h1>
            {q.hint && <p className="hint">{q.hint}</p>}
            <fieldset aria-labelledby="q-title" aria-describedby={error ? 'q-error' : undefined}>
              <div className={`options${q.options.length === 3 ? ' options--three' : ''}`}>
                {q.options.map((o, i) => (
                  <label key={o.id} className="option">
                    <input
                      ref={i === 0 ? firstInput : undefined}
                      type="radio"
                      name={q.id}
                      value={o.id}
                      checked={current?.optionId === o.id && !current?.text?.trim()}
                      onChange={() => setAnswer({ optionId: o.id })}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
              {q.allowOwnWords && (
                <div className="own">
                  <label htmlFor={ownId} className="visually-hidden">
                    Or answer in your own words
                  </label>
                  <input
                    id={ownId}
                    type="text"
                    autoComplete="off"
                    placeholder="Or say it in your own words"
                    value={current?.text ?? ''}
                    onChange={(e) => setAnswer({ text: e.target.value })}
                  />
                </div>
              )}
            </fieldset>
            <p className="error" id="q-error" role="alert">
              {error}
            </p>
            <div className="actions">
              <button type="submit" className="btn">
                {index === seq.length - 1 && goal ? 'See your intent' : 'Next question'} <Arrow />
              </button>
              <button type="button" className="btn-quiet" onClick={back} disabled={index === 0}>
                Back
              </button>
            </div>
          </form>
        )}

        <section className="ledger" aria-labelledby="ledger-title">
          <h2 id="ledger-title">Your answers</h2>
          {answeredCount === 0 ? (
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
                  <th scope="col">Number</th>
                  <th scope="col">Question</th>
                  <th scope="col">Your answer</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {seq.map((sq, i) =>
                  isAnswered(answers[sq.id]) ? (
                    <tr key={sq.id} className={!done && i === index ? 'is-current' : undefined}>
                      <td className="ledger__n">{i + 1}</td>
                      <td className="ledger__q">{sq.prompt}</td>
                      <td className="ledger__a">
                        {answerLabel(sq, answers[sq.id])}
                        {changed.has(sq.id) && <span className="tag">changed</span>}
                      </td>
                      <td className="ledger__edit">
                        <button type="button" onClick={() => edit(i)} aria-label={`Change answer to: ${sq.short}`}>
                          Change
                        </button>
                      </td>
                    </tr>
                  ) : null,
                )}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  )
}
