import { useRef, useState } from 'react'
import { Arrow } from '../components/Arrow'
import { Sky } from '../components/Sky'
import { goalOf } from '../form/logic'
import type { Values } from '../form/schema'
import { skyStars } from '../sky/input'
import { BUDGET_SECONDS, outcomeOf, secondsFor, targetText, totalSeconds, type Answer, type NumberQuestion, type Question } from './core'
import { loadPublished } from './storage'
import '../App.css'
import '../form/fields.css'
import './screening.css'

type Stage = 'intro' | 'questions' | 'result' | 'cleared'

/** The submitted role, read only to draw its constellation beside the check. */
function loadRoleSky(): { values: Values; seed: string } | null {
  try {
    const raw = localStorage.getItem('plainly:role:v2')
    const r = raw ? (JSON.parse(raw) as { values?: Values; seed?: string }) : null
    return r?.values && r.seed ? { values: r.values, seed: r.seed } : null
  } catch {
    return null
  }
}

function answerText(q: Question, a: Answer) {
  if (q.kind === 'yesno') return a === 'yes' ? 'Yes' : 'No'
  return `${a} ${a === 1 ? q.unit.replace(/^(\w+?)s\b/, '$1') : q.unit}`
}

function YesNo({ q, value, onChange }: { q: Question; value: Answer | undefined; onChange: (a: Answer) => void }) {
  return (
    <div className="sq__yesno">
      {(['yes', 'no'] as const).map((v) => (
        <label key={v} className="chip sq__chip">
          <input type="radio" name={q.id} value={v} checked={value === v} onChange={() => onChange(v)} />
          <span className="chip__mark" aria-hidden="true" />
          {v === 'yes' ? 'Yes' : 'No'}
        </label>
      ))}
    </div>
  )
}

function NumberInput({ q, value, onChange }: { q: NumberQuestion; value: Answer | undefined; onChange: (a: Answer | undefined) => void }) {
  const n = typeof value === 'number' ? value : undefined
  const clamp = (x: number) => Math.max(q.min, Math.min(q.max, Math.round(x)))
  const inputId = `sq-${q.id}-input`
  return (
    <div className="sq__number">
      <div className="stepper">
        <button type="button" aria-label="Fewer" disabled={n !== undefined && n <= q.min} onClick={() => onChange(clamp((n ?? q.min + 1) - 1))}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="2" /></svg>
        </button>
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={q.min}
          max={q.max}
          value={n ?? ''}
          placeholder="–"
          aria-labelledby={`sq-${q.id}-text`}
          aria-describedby={`sq-${q.id}-unit`}
          onChange={(e) => onChange(e.target.value === '' ? undefined : clamp(Number(e.target.value)))}
        />
        <button type="button" aria-label="More" disabled={n !== undefined && n >= q.max} onClick={() => onChange(clamp((n ?? q.min - 1) + 1))}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="2" /><rect x="7" y="3" width="2" height="10" /></svg>
        </button>
      </div>
      <span className="sq__unit" id={`sq-${q.id}-unit`}>{q.unit}</span>
    </div>
  )
}

/**
 * The attendee's quick check at #/check. Answers live in memory only: they
 * are never written to storage, never sent anywhere, and the result is shown
 * to the attendee alone as a self-check, never as a decision about them.
 */
export function SeekerCheck() {
  const [roleSky] = useState(loadRoleSky)
  const [published] = useState(loadPublished)
  const [stage, setStage] = useState<Stage>('intro')
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const headingRef = useRef<HTMLHeadingElement>(null)

  function go(s: Stage) {
    setStage(s)
    window.scrollTo({ top: 0 })
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function clearAnswers() {
    setAnswers({})
    go('cleared')
  }

  function setAnswer(id: string, a: Answer | undefined) {
    setAnswers((prev) => {
      const next = { ...prev }
      if (a === undefined) delete next[id]
      else next[id] = a
      return next
    })
  }

  const brand = (
    <div className="seeker__brand">
      <a className="wordmark" href="#/">Plainly</a>
      <span className="seeker__tag">Quick check</span>
    </div>
  )

  if (!published) {
    return (
      <div className="seeker">
        <aside className="seeker__field">{brand}</aside>
        <main className="seeker__work">
          <h1 className="seeker__h1">No quick check yet</h1>
          <p className="hint">A quick check appears here once an employer publishes one for a role.</p>
          <div className="seeker__actions">
            <a className="btn" href="#/">
              Go to Plainly <Arrow />
            </a>
          </div>
        </main>
      </div>
    )
  }

  const { questions, role } = published
  const answered = questions.filter((q) => answers[q.id] !== undefined)
  const left = questions.filter((q) => answers[q.id] === undefined).reduce((s, q) => s + secondsFor(q), 0)
  const outcomes = questions.map((q) => ({ q, a: answers[q.id], o: outcomeOf(q, answers[q.id]) }))
  const matches = outcomes.filter((x) => x.o === 'match').length
  const madeBy = published.source === 'ai' ? 'generated by AI from' : 'generated from'

  return (
    <div className="seeker">
      <aside className="seeker__field" aria-label="Role">
        {roleSky && (
          <Sky
            className="seeker__sky"
            seed={roleSky.seed}
            goal={goalOf(roleSky.values)}
            step={8}
            {...skyStars(roleSky.values, () => true)}
            complete
          />
        )}
        {brand}
        <div className="seeker__role">
          <p className="seeker__company">{role.company}</p>
          <p className="seeker__title">{role.title}</p>
        </div>
        <p className="seeker__foot">
          {questions.length} questions · about {totalSeconds(questions)} seconds
        </p>
      </aside>

      <main className="seeker__work">
        {stage === 'intro' && (
          <section aria-labelledby="sk-title">
            <h1 id="sk-title" className="seeker__h1" ref={headingRef} tabIndex={-1}>
              Check this role in {BUDGET_SECONDS} seconds
            </h1>
            <p className="hint">
              {questions.length} yes/no and number questions about what the role requires. Answer the ones you like, then see how well the role
              matches what you told us.
            </p>
            <div className="privacy" role="note" aria-labelledby="privacy-title">
              <h2 id="privacy-title">Before you start</h2>
              <ul>
                <li>Your answers stay on this device. They are not saved and not sent to {role.company}, to Plainly or to anyone else.</li>
                <li>No name, e-mail or other contact details are asked.</li>
                <li>The questions were {madeBy} the employer’s role description and reviewed by the employer.</li>
                <li>The result is a self-check for you only. It does not reject, rank or score you for the employer.</li>
              </ul>
            </div>
            <div className="seeker__actions">
              <button type="button" className="btn" onClick={() => go('questions')}>
                Start the quick check <Arrow />
              </button>
              <button type="button" className="btn-quiet" onClick={clearAnswers}>
                Not now
              </button>
            </div>
          </section>
        )}

        {stage === 'questions' && (
          <form
            aria-labelledby="sk-title"
            onSubmit={(e) => {
              e.preventDefault()
              go('result')
            }}
          >
            <h1 id="sk-title" className="seeker__h1 seeker__h1--small" ref={headingRef} tabIndex={-1}>
              What the role requires
            </h1>
            <div className="budget" aria-live="polite">
              <ol className="budget__bar" aria-hidden="true">
                {questions.map((q) => (
                  <li key={q.id} style={{ flexGrow: secondsFor(q) }} className={answers[q.id] !== undefined ? 'is-done' : undefined} />
                ))}
              </ol>
              <span>
                {answered.length} of {questions.length} answered · {left ? `about ${left} seconds left` : 'all answered'}
              </span>
            </div>
            <ol className="sq-list">
              {questions.map((q, i) => (
                <li key={q.id}>
                  <fieldset className="sq">
                    <legend className="sq__text" id={`sq-${q.id}-text`}>
                      <span className="sq__n">{i + 1}</span>
                      {q.text}
                    </legend>
                    {q.kind === 'yesno' ? (
                      <YesNo q={q} value={answers[q.id]} onChange={(a) => setAnswer(q.id, a)} />
                    ) : (
                      <NumberInput q={q} value={answers[q.id]} onChange={(a) => setAnswer(q.id, a)} />
                    )}
                  </fieldset>
                </li>
              ))}
            </ol>
            <p className="seeker__note">
              Every question is optional. {published.source === 'ai' ? 'Questions generated by AI' : 'Questions generated from the role description'},
              reviewed by the employer.
            </p>
            <div className="seeker__actions">
              <button type="submit" className="btn" disabled={!answered.length}>
                See how well it matches <Arrow />
              </button>
              <button type="button" className="btn-quiet" onClick={clearAnswers}>
                Not now, clear my answers
              </button>
            </div>
          </form>
        )}

        {stage === 'result' && (
          <section aria-labelledby="sk-title">
            <h1 id="sk-title" className="seeker__h1" ref={headingRef} tabIndex={-1}>
              Matches {matches} of {answered.length} requirements
            </h1>
            <p className="hint">
              A self-check based on what you told us. It is not a hiring decision, and your answers are not sent to {role.company}.
              {questions.length > answered.length && ` ${questions.length - answered.length} not answered.`}
            </p>
            <ul className="result-list">
              {outcomes.map(({ q, a, o }) => (
                <li key={q.id} className={`result-item is-${o}`}>
                  <span className="result-item__mark" aria-hidden="true" />
                  <div>
                    <p className="result-item__req">
                      {q.requirement}
                      <span className="visually-hidden">
                        {o === 'match' ? ': matches' : o === 'miss' ? ': does not match' : ': not answered'}
                      </span>
                    </p>
                    {(a !== undefined || q.kind === 'number') && (
                      <p className="result-item__meta">
                        {[a !== undefined && `Your answer: ${answerText(q, a)}`, q.kind === 'number' && `Role: ${targetText(q)}`].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="result-item__state" aria-hidden="true">
                    {o === 'match' ? 'Matches' : o === 'miss' ? 'Does not match' : 'Not answered'}
                  </span>
                </li>
              ))}
            </ul>
            <div className="seeker__actions">
              <button type="button" className="btn" onClick={() => go('questions')}>
                Change answers <Arrow />
              </button>
              <button type="button" className="btn-quiet" onClick={clearAnswers}>
                Clear my answers
              </button>
            </div>
          </section>
        )}

        {stage === 'cleared' && (
          <section aria-labelledby="sk-title">
            <h1 id="sk-title" className="seeker__h1" ref={headingRef} tabIndex={-1}>
              No answers kept
            </h1>
            <p className="hint">Nothing was saved or sent. You can take the quick check any time.</p>
            <div className="seeker__actions">
              <button type="button" className="btn" onClick={() => go('intro')}>
                Start again <Arrow />
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
