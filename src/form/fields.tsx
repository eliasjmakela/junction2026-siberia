import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { Field, Skills, Value } from './schema'
import { UNDECIDED } from './logic'
import './fields.css'

type Props = {
  field: Field
  value: Value | undefined
  onChange: (v: Value) => void
  invalid: boolean
}

const ERROR = 'Answer this, or choose Not decided yet.'
const ERROR_NO_UNDECIDED = 'This is needed to continue.'

function Label({ field, htmlFor, as = 'label' }: { field: Field; htmlFor?: string; as?: 'label' | 'legend' }) {
  const text = field.kind === 'text' && field.lead ? (field.lead.endsWith(':') ? field.lead : `${field.lead} …`) : field.label
  const inner = (
    <>
      <span>{text}</span>
      {field.optional && <span className="qfield__optional">Optional</span>}
    </>
  )
  return as === 'legend' ? (
    <legend className="qfield__label">{inner}</legend>
  ) : (
    <label className="qfield__label" htmlFor={htmlFor}>
      {inner}
    </label>
  )
}

function Undecided({ value, onChange }: { value: Value | undefined; onChange: (v: Value) => void }) {
  const on = Boolean(value?.undecided)
  return (
    <button
      type="button"
      className="chip chip--undecided"
      aria-pressed={on}
      onClick={() => onChange(on ? {} : { undecided: true })}
    >
      <span className="chip__mark" aria-hidden="true" />
      {UNDECIDED}
    </button>
  )
}

function Shell({
  field,
  invalid,
  children,
  group,
  inputId,
}: {
  field: Field
  invalid: boolean
  children: ReactNode
  group: boolean
  inputId?: string
}) {
  const errId = `${field.id}-error`
  const hintId = `${field.id}-hint`
  const body = (
    <>
      <Label field={field} htmlFor={inputId} as={group ? 'legend' : 'label'} />
      {field.hint && (
        <p className="qfield__hint" id={hintId}>
          {field.hint}
        </p>
      )}
      {children}
      {invalid && (
        <p className="qfield__error" id={errId}>
          {field.noUndecided ? ERROR_NO_UNDECIDED : ERROR}
        </p>
      )}
    </>
  )
  const cls = `qfield${invalid ? ' is-invalid' : ''}`
  return group ? (
    <fieldset className={cls} id={`field-${field.id}`} aria-describedby={invalid ? errId : field.hint ? hintId : undefined}>
      {body}
    </fieldset>
  ) : (
    <div className={cls} id={`field-${field.id}`}>
      {body}
    </div>
  )
}

export function FieldView({ field, value, onChange, invalid }: Props) {
  const uid = useId()
  const inputId = `${uid}-input`
  const describedBy = invalid ? `${field.id}-error` : field.hint ? `${field.id}-hint` : undefined
  const undecided = Boolean(value?.undecided)

  switch (field.kind) {
    case 'single':
      return (
        <Shell field={field} invalid={invalid} group>
          <div className="chips">
            {field.options.map((o) => (
              <label key={o.id} className="chip">
                <input
                  type="radio"
                  name={field.id}
                  checked={!undecided && value?.choice === o.id}
                  onChange={() => onChange({ choice: o.id, date: o.withDate ? value?.date : undefined })}
                />
                <span className="chip__mark" aria-hidden="true" />
                {o.label}
              </label>
            ))}
            {!field.noUndecided && <Undecided value={value} onChange={onChange} />}
          </div>
          {field.options.some((o) => o.withDate && value?.choice === o.id) && !undecided && (
            <div className="qfield__sub">
              <label className="visually-hidden" htmlFor={inputId}>
                Date
              </label>
              <input
                id={inputId}
                className="input input--date"
                type="date"
                value={value?.date ?? ''}
                onChange={(e) => onChange({ ...value, date: e.target.value })}
              />
            </div>
          )}
        </Shell>
      )

    case 'multi': {
      const chosen = undecided ? [] : (value?.choices ?? [])
      const toggle = (id: string) => {
        let next = chosen.includes(id) ? chosen.filter((c) => c !== id) : [...chosen, id]
        // "None" excludes every other choice.
        if (id === 'none' && next.includes('none')) next = ['none']
        else if (id !== 'none') next = next.filter((c) => c !== 'none')
        onChange({ choices: next })
      }
      return (
        <Shell field={field} invalid={invalid} group>
          <div className="chips">
            {field.options.map((o) => (
              <label key={o.id} className="chip chip--multi">
                <input type="checkbox" checked={chosen.includes(o.id)} onChange={() => toggle(o.id)} />
                <span className="chip__mark" aria-hidden="true" />
                {o.label}
              </label>
            ))}
            <Undecided value={value} onChange={onChange} />
          </div>
        </Shell>
      )
    }

    case 'text': {
      const Tag = field.multiline ? 'textarea' : 'input'
      return (
        <Shell field={field} invalid={invalid} group={false} inputId={inputId}>
          <Tag
            id={inputId}
            className={`input${field.multiline ? ' input--area' : ''}`}
            placeholder={undecided ? UNDECIDED : field.placeholder}
            value={undecided ? '' : (value?.text ?? '')}
            disabled={undecided}
            rows={field.multiline ? 2 : undefined}
            autoComplete="off"
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            onChange={(e) => onChange({ text: e.target.value })}
          />
          {!field.noUndecided && !field.optional && (
            <div className="qfield__sub">
              <Undecided value={value} onChange={onChange} />
            </div>
          )}
        </Shell>
      )
    }

    case 'number': {
      const n = undecided ? undefined : value?.number
      const set = (x: number) => onChange({ number: Math.min(field.max, Math.max(field.min, x)) })
      return (
        <Shell field={field} invalid={invalid} group={false} inputId={inputId}>
          <div className="qfield__row">
            <div className={`stepper${undecided ? ' is-off' : ''}`}>
              <button type="button" aria-label="Fewer" disabled={undecided || (n ?? field.min) <= field.min} onClick={() => set((n ?? field.min) - 1)}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="2" /></svg>
              </button>
              <input
                id={inputId}
                type="number"
                inputMode="numeric"
                min={field.min}
                max={field.max}
                value={n ?? ''}
                placeholder="–"
                disabled={undecided}
                aria-describedby={describedBy}
                onChange={(e) => (e.target.value === '' ? onChange({}) : set(Number(e.target.value)))}
              />
              <button type="button" aria-label="More" disabled={undecided || (n ?? 0) >= field.max} onClick={() => set((n ?? 0) + 1)}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="2" /><rect x="7" y="3" width="2" height="10" /></svg>
              </button>
            </div>
            <Undecided value={value} onChange={onChange} />
          </div>
        </Shell>
      )
    }

    case 'scale':
      return (
        <Shell field={field} invalid={invalid} group>
          <div className="scale">
            <span className="scale__end" aria-hidden="true">{field.left}</span>
            <div className="scale__steps">
              {[1, 2, 3, 4, 5].map((i) => (
                <label key={i} className="scale__step">
                  <input
                    type="radio"
                    name={field.id}
                    checked={!undecided && value?.number === i}
                    onChange={() => onChange({ number: i })}
                  />
                  <span className="visually-hidden">
                    {i === 1 ? field.left : i === 5 ? field.right : i === 3 ? 'Balanced' : i < 3 ? `Leaning ${field.left.toLowerCase()}` : `Leaning ${field.right.toLowerCase()}`}
                  </span>
                </label>
              ))}
            </div>
            <span className="scale__end" aria-hidden="true">{field.right}</span>
          </div>
          <div className="qfield__sub">
            <Undecided value={value} onChange={onChange} />
          </div>
        </Shell>
      )

    case 'skills':
      return <SkillsField field={field} value={value} onChange={onChange} invalid={invalid} />

    case 'salary': {
      const s = undecided ? {} : (value?.salary ?? {})
      const setPart = (k: 'min' | 'max', raw: string) => {
        const next = { ...s, [k]: raw === '' ? undefined : Math.max(0, Number(raw)) }
        onChange(next.min === undefined && next.max === undefined ? {} : { salary: next })
      }
      return (
        <Shell field={field} invalid={invalid} group>
          <div className="qfield__row">
            <div className="salary">
              <label className="money">
                <span className="visually-hidden">Lowest monthly salary</span>
                <span aria-hidden="true">€</span>
                <input type="number" inputMode="numeric" min={0} step={100} placeholder="3 200" value={s.min ?? ''} disabled={undecided} onChange={(e) => setPart('min', e.target.value)} />
              </label>
              <span className="salary__to" aria-hidden="true">to</span>
              <label className="money">
                <span className="visually-hidden">Highest monthly salary</span>
                <span aria-hidden="true">€</span>
                <input type="number" inputMode="numeric" min={0} step={100} placeholder="4 000" value={s.max ?? ''} disabled={undecided} onChange={(e) => setPart('max', e.target.value)} />
              </label>
            </div>
            <Undecided value={value} onChange={onChange} />
          </div>
        </Shell>
      )
    }
  }
}

const BUCKETS: { key: keyof Skills; label: string }[] = [
  { key: 'must', label: 'Must-have' },
  { key: 'teach', label: 'We can teach' },
  { key: 'nice', label: 'Nice to have' },
]

function SkillsField({ field, value, onChange, invalid }: Props) {
  const [draft, setDraft] = useState('')
  const uid = useId()
  const undecided = Boolean(value?.undecided)
  const skills: Skills = value?.skills ?? { must: [], teach: [], nice: [] }

  const add = (bucket: keyof Skills) => {
    const name = draft.trim().replace(/\s+/g, ' ')
    if (!name) return
    const clean: Skills = {
      must: skills.must.filter((s) => s.toLowerCase() !== name.toLowerCase()),
      teach: skills.teach.filter((s) => s.toLowerCase() !== name.toLowerCase()),
      nice: skills.nice.filter((s) => s.toLowerCase() !== name.toLowerCase()),
    }
    onChange({ skills: { ...clean, [bucket]: [...clean[bucket], name] } })
    setDraft('')
  }
  const remove = (bucket: keyof Skills, name: string) => {
    const next = { ...skills, [bucket]: skills[bucket].filter((s) => s !== name) }
    onChange(next.must.length || next.teach.length || next.nice.length ? { skills: next } : {})
  }
  const move = (from: keyof Skills, to: keyof Skills, name: string) => {
    if (from === to) return
    onChange({ skills: { ...skills, [from]: skills[from].filter((s) => s !== name), [to]: [...skills[to], name] } })
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      add('must')
    }
  }

  return (
    <Shell field={field} invalid={invalid} group={false} inputId={`${uid}-skill`}>
      <div className={`skills${undecided ? ' is-off' : ''}`}>
        <div className="skills__add">
          <input
            id={`${uid}-skill`}
            className="input"
            placeholder={undecided ? UNDECIDED : 'e.g. Kotlin or customer service'}
            value={draft}
            disabled={undecided}
            autoComplete="off"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            aria-describedby={`${uid}-skill-help`}
          />
          <div className="skills__buttons" role="group" aria-label="Add skill as">
            {BUCKETS.map((b) => (
              <button key={b.key} type="button" className="btn-chip" disabled={undecided || !draft.trim()} onClick={() => add(b.key)}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
        <p className="visually-hidden" id={`${uid}-skill-help`}>
          Press Enter to add as a must-have.
        </p>
        <div className="qfield__sub">
          <Undecided value={value} onChange={onChange} />
        </div>
        <div className="skills__lists">
          {BUCKETS.map((b) => (
            <div key={b.key} className="skills__list">
              <h3>{b.label}</h3>
              {skills[b.key].length === 0 ? (
                <p className="skills__empty">None added</p>
              ) : (
                <ul>
                  {skills[b.key].map((s) => (
                    <li key={s} className="tag-skill">
                      {s}
                      <span className="tag-skill__move">
                        <select
                          aria-label={`Move ${s} to`}
                          value={b.key}
                          disabled={undecided}
                          onChange={(e) => move(b.key, e.target.value as keyof Skills, s)}
                        >
                          {BUCKETS.map((o) => (
                            <option key={o.key} value={o.key}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <svg viewBox="0 0 16 16" aria-hidden="true">
                          <path d="M3 6 L8 11 L13 6 L12 5 L8 9 L4 5 Z" />
                        </svg>
                      </span>
                      <button type="button" aria-label={`Remove ${s}`} onClick={() => remove(b.key, s)} disabled={undecided}>
                        <svg viewBox="0 0 16 16" aria-hidden="true">
                          <path d="M4 3 L8 7 L12 3 L13 4 L9 8 L13 12 L12 13 L8 9 L4 13 L3 12 L7 8 L3 4 Z" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}
