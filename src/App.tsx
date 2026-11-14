import { useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { Arrow } from './components/Arrow'
import { NAV_LINKS } from './components/nav'
import { Sky } from './components/Sky'
import { FieldView } from './form/fields'
import { display, fieldsFor, goalOf, hasValue, isAnswered, missingOn, screenSummary } from './form/logic'
import { RoleCard } from './form/RoleCard'
import { RolePreview } from './form/RolePreview'
import { CompanyQuestions } from './event/CompanyQuestions'
import { EVENT, useEvent } from './event/store'
import { ALL_FIELDS, FIELD_BY_ID, GOALS, SCREENS, type Value, type Values } from './form/schema'
import { newSeed, roleFingerprint, skyStars } from './sky/input'
import './App.css'

const STORAGE_KEY = 'plainly:role:v2'
const REVIEW = SCREENS.length
const SUBMITTED = SCREENS.length + 1

type Stored = { values: Values; savedAt: string; seed?: string; demo?: boolean }

const SAMPLE_ANSWERS: Values = {
  vacancy: { choice: 'soon' },
  openingWindow: { choice: 'm2' },
  title: { text: 'Field service technician' },
  purpose: { text: 'customers get reliable equipment repairs on the first visit.' },
  type: { choice: 'full' },
  positions: { number: 2 },
  start: { choice: 'flex' },
  month1: { text: 'shadow a senior technician, then lead scheduled visits with support.' },
  problem: { text: 'spring service visits are delayed when technicians receive incomplete equipment histories.' },
  tuesday: { text: 'check the route, visit two customer sites, update service notes, and review parts needed for tomorrow.' },
  hours: { choice: 'flexible' },
  salary: { salary: { min: 3300, max: 3900 } },
  with: { choices: ['customers', 'engineers'] },
  solo: { number: 3 },
  teamsize: { choice: '4-10' },
  skills: { skills: { must: ['Electrical diagnostics', 'Customer communication'], teach: ['Lumo service system'], nice: ['Heat pump experience'] } },
  education: { choice: 'preferred' },
  worklang: { choices: ['fi', 'en'] },
  finnish: { choice: 'basic' },
  mode: { choice: 'onsite' },
  office: { text: 'Keilaniemi, Espoo' },
  abroadFirst: { choice: 'no' },
  fromAbroad: { choice: 'case' },
  visa: { choice: 'depends' },
  relocation: { choices: ['admin', 'travel'] },
  company: { text: 'Lumo Kiinteistöhuolto Oy' },
  size: { choice: 'growing' },
  thrive: { text: 'solve practical problems and enjoy meeting customers' },
  career: { text: 'service specialist, then technical lead or trainer.' },
}

const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

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
  // A restored role opens on its confirmation.
  const [index, setIndex] = useState(initial ? SUBMITTED : 0)
  const [invalid, setInvalid] = useState<Set<string>>(new Set())
  const [visited, setVisited] = useState<Set<string>>(new Set(initial ? SCREENS.map((s) => s.id) : []))
  const [changed, setChanged] = useState<Set<string>>(new Set())
  const [savedAt, setSavedAt] = useState<string | null>(initial?.savedAt ?? null)
  const [submitError, setSubmitError] = useState(false)
  const [demoRunning, setDemoRunning] = useState(false)
  const [demoMode, setDemoMode] = useState(initial?.demo ?? false)
  const demoRun = useRef(0)
  const demoInteraction = useRef(false)
  const demoCursor = useRef<HTMLDivElement>(null)
  // The random seed identifies the noise field; reviewed geometry uses roleFingerprint(values).
  const [seed, setSeed] = useState(() => initial?.seed ?? newSeed())
  const eventState = useEvent()
  const questionsPublished = eventState.listings.some((l) => l.id === `role-${seed}`)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const goal = goalOf(values)
  const onSubmitted = index === SUBMITTED && savedAt !== null
  const onReview = index >= REVIEW && !onSubmitted
  const screen = SCREENS[Math.min(index, REVIEW - 1)]
  const isDone = (i: number) => visited.has(SCREENS[i].id) && missingOn(SCREENS[i], values, goal).length === 0
  const doneCount = SCREENS.filter((_, i) => isDone(i)).length
  const lastToFill = SCREENS.every((_, i) => i === index || isDone(i))

  function goTo(i: number) {
    if (!demoInteraction.current) {
      demoRun.current += 1
      setDemoRunning(false)
      demoCursor.current?.classList.remove('is-visible')
    }
    setInvalid(new Set())
    setIndex(i)
    window.scrollTo({ top: 0 })
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function setField(id: string, v: Value) {
    if (demoRunning && !demoInteraction.current) {
      demoRun.current += 1
      setDemoRunning(false)
      demoCursor.current?.classList.remove('is-visible')
    }
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
    const missing = missingOn(screen, values, goal)
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ values, savedAt: at, seed, demo: demoMode } satisfies Stored))
      setSubmitError(false)
      setSavedAt(at)
      setChanged(new Set())
      goTo(SUBMITTED)
    } catch {
      setSubmitError(true)
    }
  }

  async function playSampleDemo(event: MouseEvent<HTMLButtonElement>) {
    if (demoRunning) {
      demoRun.current += 1
      setDemoRunning(false)
      demoCursor.current?.classList.remove('is-visible')
      return
    }

    const run = demoRun.current + 1
    demoRun.current = run
    const cursor = demoCursor.current
    const startRect = event.currentTarget.getBoundingClientRect()
    if (cursor) {
      cursor.style.transition = 'none'
      cursor.style.transform = `translate3d(${startRect.left + startRect.width / 2}px, ${startRect.top + startRect.height / 2}px, 0)`
      cursor.classList.add('is-visible')
      requestAnimationFrame(() => { cursor.style.transition = '' })
    }

    const glide = async (target: HTMLElement) => {
      if (!cursor || demoRun.current !== run) return false
      const before = target.getBoundingClientRect()
      const outsideViewport = before.top < 28 || before.bottom > window.innerHeight - 28 || before.left < 8 || before.right > window.innerWidth - 8
      if (outsideViewport) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        await delay(420)
      }
      if (demoRun.current !== run) return false
      const rect = target.getBoundingClientRect()
      cursor.style.transform = `translate3d(${rect.left + rect.width / 2}px, ${rect.top + rect.height / 2}px, 0)`
      await delay(460)
      return demoRun.current === run
    }

    const clickTarget = async (target: HTMLElement) => {
      if (!(await glide(target))) return false
      cursor?.classList.add('is-down')
      demoInteraction.current = true
      target.click()
      demoInteraction.current = false
      await delay(150)
      cursor?.classList.remove('is-down')
      return demoRun.current === run
    }

    const typeText = async (target: HTMLInputElement | HTMLTextAreaElement, text: string) => {
      if (!(await glide(target))) return false
      demoInteraction.current = true
      target.click()
      target.focus()
      demoInteraction.current = false
      const prototype = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
      for (let i = 0; i < text.length; i += 1) {
        if (demoRun.current !== run) return false
        demoInteraction.current = true
        setter?.call(target, text.slice(0, i + 1))
        target.dispatchEvent(new Event('input', { bubbles: true }))
        demoInteraction.current = false
        await delay(text[i] === ' ' ? 75 : 48)
      }
      await delay(220)
      return demoRun.current === run
    }

    const choose = async (field: (typeof ALL_FIELDS)[number], optionId: string) => {
      if (field.kind !== 'single' && field.kind !== 'multi') return false
      const option = field.options.find((item) => item.id === optionId)
      const root = document.getElementById(`field-${field.id}`)
      const label = option && root
        ? Array.from(root.querySelectorAll<HTMLElement>('label.chip')).find((item) => item.textContent?.trim() === option.label)
        : undefined
      return label ? clickTarget(label) : false
    }

    setDemoRunning(true)
    setDemoMode(true)
    setValues({})
    setInvalid(new Set())
    setVisited(new Set())
    setChanged(new Set())
    setSavedAt(null)
    setSubmitError(false)
    setSeed(newSeed())
    setIndex(0)
    window.scrollTo({ top: 0 })
    await delay(700)

    const demoGoal = 'soon'
    for (let i = 0; i < SCREENS.length; i += 1) {
      if (demoRun.current !== run) return
      const current = SCREENS[i]
      for (const field of fieldsFor(current, demoGoal)) {
        if (demoRun.current !== run) return
        const answer = SAMPLE_ANSWERS[field.id]
        const root = document.getElementById(`field-${field.id}`)
        if (!answer || !root) continue

        if (field.kind === 'text' && answer.text) {
          const input = root.querySelector<HTMLInputElement | HTMLTextAreaElement>('input.input, textarea.input')
          if (input) await typeText(input, answer.text)
        } else if (field.kind === 'single' && answer.choice) {
          await choose(field, answer.choice)
          if (field.id === 'start' && answer.choice === 'date' && answer.date) {
            const dateInput = root.querySelector<HTMLInputElement>('input[type="date"]')
            if (dateInput) await typeText(dateInput, answer.date)
          }
        } else if (field.kind === 'multi' && answer.choices) {
          for (const optionId of answer.choices) await choose(field, optionId)
        } else if (field.kind === 'number' && typeof answer.number === 'number') {
          const more = root.querySelector<HTMLButtonElement>('button[aria-label="More"]')
          if (more && await glide(more)) {
            for (let count = 0; count < answer.number; count += 1) {
              if (demoRun.current !== run) return
              cursor?.classList.add('is-down')
              demoInteraction.current = true
              more.click()
              demoInteraction.current = false
              cursor?.classList.remove('is-down')
              await delay(240)
            }
          }
        } else if (field.kind === 'scale' && typeof answer.number === 'number') {
          const choice = root.querySelector<HTMLElement>(`.scale__step:nth-child(${answer.number})`)
          if (choice) await clickTarget(choice)
        } else if (field.kind === 'salary' && answer.salary) {
          const inputs = root.querySelectorAll<HTMLInputElement>('.salary .money input')
          if (inputs[0] && typeof answer.salary.min === 'number') await typeText(inputs[0], String(answer.salary.min))
          if (inputs[1] && typeof answer.salary.max === 'number') await typeText(inputs[1], String(answer.salary.max))
        } else if (field.kind === 'skills' && answer.skills) {
          const skillInput = root.querySelector<HTMLInputElement>('.skills__add input')
          const buckets: [keyof NonNullable<typeof answer.skills>, string][] = [['must', 'Must-have'], ['teach', 'We can teach'], ['nice', 'Nice to have']]
          for (const [bucket, label] of buckets) {
            for (const skill of answer.skills[bucket]) {
              if (!skillInput || !(await typeText(skillInput, skill))) continue
              const button = Array.from(root.querySelectorAll<HTMLButtonElement>('.skills__buttons button')).find((item) => item.textContent?.trim() === label)
              if (button) await clickTarget(button)
            }
          }
        }
        if (demoRun.current !== run) return
        await delay(230)
      }
      const continueButton = document.querySelector<HTMLButtonElement>('#form button[type="submit"]')
      if (!continueButton || !(await clickTarget(continueButton))) return
      await delay(500)
    }

    if (demoRun.current !== run) return
    setDemoRunning(false)
    await delay(550)
    cursor?.classList.remove('is-visible')
  }

  function startQuestions() {
    const panel = document.getElementById('application-questions')
    panel?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
    const start = panel?.querySelector<HTMLButtonElement>('[data-cq-start]')
    if (start && !start.disabled) start.click()
    else panel?.querySelector<HTMLElement>('[data-cq-primary]')?.focus({ preventScroll: true })
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
    setSeed(newSeed())
    setVisited(new Set())
    setChanged(new Set())
    setSavedAt(null)
    setSubmitError(false)
    goTo(0)
  }

  const anyAnswer = ALL_FIELDS.some((f) => isAnswered(f, values[f.id]))
  const stars = skyStars(values, isDone)
  const fingerprint = onReview || onSubmitted ? roleFingerprint(values) : undefined
  const title = hasValue(FIELD_BY_ID.title, values.title) ? values.title!.text!.trim() : null
  const detailIds = goal === 'pipeline'
    ? ['type', 'hiringCondition'] as const
    : goal === 'soon'
      ? ['positions', 'type', 'openingWindow'] as const
      : ['positions', 'type', 'start'] as const
  const details = detailIds
    .filter((id) => hasValue(FIELD_BY_ID[id], values[id]))
    .map((id) => (id === 'positions' ? `${values.positions!.number} ${values.positions!.number === 1 ? 'position' : 'positions'}` : display(id, values)))
    .join(' · ')
  const screenFields = fieldsFor(screen, goal)
  const screenTitle = screen.id === 'role'
    ? goal === 'pipeline'
      ? 'What kind of role are you exploring?'
      : goal === 'soon'
        ? 'What is the role, and when do you expect it to open?'
        : screen.title
    : screen.title
  const screenHint = screen.id === 'role' && goal === 'pipeline'
    ? 'Describe a specific kind of work to discuss. Headcount and start timing can remain undecided.'
    : screen.hint

  return (
    <div className="shell">
      <aside className="field" aria-label="Your role">
        <Sky
          className="field__sky"
          seed={seed}
          fingerprint={fingerprint}
          goal={goal}
          step={doneCount}
          lit={stars.lit}
          undecided={stars.undecided}
          complete={onReview || onSubmitted}
        />
        <div className="field__brand">
          <span className="wordmark">Plainly</span>
          <span className="field__tagline">for Espoo recruitment events</span>
        </div>
        <div className="field__caption" aria-live="polite">
          <p className="field__status">{goal ? GOALS[goal].name : 'No status yet'}</p>
          <p className={`field__title${title ? '' : ' is-quiet'}`}>{title ?? 'Your role takes shape as you answer.'}</p>
          {details && <p className="field__details">{details}</p>}
        </div>
      </aside>

      <main className="work">
        <header className="topbar">
          <nav aria-label="Main navigation" className="tabs">
            {NAV_LINKS.map((l) => (
              <a key={l.area} href={l.href} aria-current={l.area === 'company' ? 'page' : undefined}>
                {l.label}
              </a>
            ))}
          </nav>
          <div className="topbar__actions">
            <p className="event-chip">
              <b>{EVENT.name}</b> · {EVENT.date}
            </p>
          </div>
        </header>

        <div className="progress" aria-label={`${doneCount} of ${SCREENS.length} steps complete`}>
          <ol className="progress__bars" aria-hidden="true">
            {SCREENS.map((s, i) => (
              <li key={s.id} className={!onReview && !onSubmitted && i === index ? 'is-current' : isDone(i) ? 'is-done' : undefined} />
            ))}
          </ol>
          <span>{onSubmitted ? 'Submitted' : onReview ? 'Review' : `Step ${index + 1} of ${SCREENS.length}`}</span>
          <button type="button" className="btn-quiet demo-control" onClick={playSampleDemo} aria-pressed={demoRunning} title="Fills in the form with example answers, step by step. Click anywhere to take over.">
            {demoRunning ? 'Stop walkthrough' : demoMode ? 'Replay walkthrough' : 'Play walkthrough'}
          </button>
        </div>

        {onSubmitted ? (
          <section className="submitted" id="form" aria-labelledby="submitted-title">
            <h1 id="submitted-title" ref={headingRef} tabIndex={-1}>
              Role submitted
            </h1>
            <p className="hint">
              {values.title?.text?.trim() || 'The role'} is submitted for {EVENT.name}, {formatTime(savedAt!)}.
            </p>
            <div className="submitted__body">
              <RoleCard values={values} seed={seed} fingerprint={roleFingerprint(values)} event={EVENT} />
              <div className="submitted__next">
                <h2>Next</h2>
                {questionsPublished ? (
                  <a className="btn" href="#/apply">
                    Open applicant view <Arrow />
                  </a>
                ) : (
                  <button type="button" className="btn" onClick={startQuestions}>
                    Draft application questions <Arrow />
                  </button>
                )}
                <button type="button" className="btn-quiet" onClick={addAnotherRole}>
                  Submit another role
                </button>
                <p className="submitted__note">Company details are filled in for you.</p>
                <button type="button" className="btn-quiet" onClick={() => goTo(REVIEW)}>
                  View or edit this role
                </button>
              </div>
            </div>
            <CompanyQuestions values={values} seed={seed} />
          </section>
        ) : onReview ? (
          <section className="review" id="form" aria-labelledby="review-title">
            <h1 id="review-title" ref={headingRef} tabIndex={-1}>
              Review your role page
            </h1>
            <p className="hint">
              This is how the role appears to attendees of {EVENT.name}. You can change any step before submitting.
            </p>
            <RolePreview values={values} />
            <div className="actions actions--review">
              {savedAt ? (
                <button type="button" className="btn" onClick={addAnotherRole}>
                  Submit another role <Arrow />
                </button>
              ) : (
                <>
                  <button type="button" className="btn" onClick={submit}>
                    Submit role <Arrow />
                  </button>
                  <button type="button" className="btn-quiet" onClick={back}>
                    Back
                  </button>
                </>
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
              {screenTitle}
            </h1>
            {screenHint && <p className="hint">{screenHint}</p>}
            <p className="error" role="alert">
              {invalid.size === 0 ? '' : invalid.size === 1 ? 'One answer is missing.' : `${invalid.size} answers are missing.`}
            </p>
            <div className="fields">
              {screenFields.map((f) => (
                <FieldView
                  key={f.id}
                  field={f}
                  value={values[f.id]}
                  invalid={invalid.has(f.id)}
                  roleTitle={values.title?.text ?? ''}
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

        {!onSubmitted && <section className="ledger" aria-labelledby="ledger-title">
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
                  const summary = screenSummary(s, values, goal)
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
        </section>}
      </main>
      <div ref={demoCursor} className="demo-cursor" aria-hidden="true">
        <svg className="demo-cursor__shape" viewBox="0 0 24 32" focusable="false">
          <path d="M2 1v25l7-7 5 11 5-2-5-11h9L2 1Z" />
        </svg>
      </div>
    </div>
  )
}
