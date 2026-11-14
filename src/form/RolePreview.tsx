import { display, fitLists, goalOf, hasValue, UNDECIDED } from './logic'
import { FIELD_BY_ID, GOALS, type Values } from './schema'
import './RolePreview.css'

function Val({ id, values, fallback = 'Not answered', forceUndecided = false }: { id: string; values: Values; fallback?: string; forceUndecided?: boolean }) {
  if (forceUndecided) return <span className="gap-tag">{UNDECIDED}</span>
  const text = display(id, values)
  if (text === UNDECIDED) return <span className="gap-tag">{UNDECIDED}</span>
  if (!text) return <span className="gap-tag">{fallback}</span>
  return <>{text}</>
}

function Sentence({ id, values }: { id: string; values: Values }) {
  const f = FIELD_BY_ID[id]
  const v = values[id]
  const lead = f.kind === 'text' ? f.lead : undefined
  if (v?.undecided) return <p><span className="gap-tag">{UNDECIDED}</span></p>
  if (!hasValue(f, v)) return <p><span className="gap-tag">Not answered</span></p>
  return (
    <p>
      {lead && <span className="preview__lead">{lead} </span>}
      {v!.text!.trim()}
    </p>
  )
}

/** The role page attendees see, rendered from the answers by one template. */
export function RolePreview({ values, part = 'all' }: { values: Values; part?: 'all' | 'summary' | 'details' }) {
  const goal = goalOf(values)
  const { fit, not } = fitLists(values)
  const skills = values.skills?.undecided ? null : values.skills?.skills
  const title = hasValue(FIELD_BY_ID.title, values.title) ? values.title!.text!.trim() : 'Untitled role'
  const company = hasValue(FIELD_BY_ID.company, values.company) ? values.company!.text!.trim() : 'Your company'

  const allFacts: [string, string][] = [
    ['Type', 'type'],
    ['Positions', 'positions'],
    ...(goal === 'soon' ? [['Expected opening', 'openingWindow'] as [string, string]] : [['Start', 'start'] as [string, string]]),
    ['Work mode', 'mode'],
    ['Office', 'office'],
    ['Working language', 'worklang'],
    ['Finnish', 'finnish'],
    ['Hours', 'hours'],
    ['Salary', 'salary'],
  ]
  const summaryFacts = allFacts.filter(([label]) => ['Type', 'Positions', 'Expected opening', 'Start', 'Work mode', 'Office', 'Working language', 'Salary'].includes(label))
  const facts = part === 'summary' ? summaryFacts : allFacts

  return (
    <article className={`preview preview--${part}`} aria-label="Role page preview">
      {part !== 'details' && (
        <>
          <header className="preview__head">
            <h2 className="preview__title">{title}</h2>
            <p className="preview__byline">
              {goal && <span className="preview__status">{GOALS[goal].name}</span>}
              <span>{company}{hasValue(FIELD_BY_ID.size, values.size) && <> · {display('size', values)}</>}</span>
            </p>
            <div className="preview__purpose"><Sentence id="purpose" values={values} /></div>
          </header>

          <dl className="preview__facts">
            {facts.map(([label, id]) => (
              <div key={id}>
                <dt>{label}</dt>
                <dd>
                  <Val
                    id={id}
                    values={values}
                    fallback={id === 'salary' ? 'Not listed' : 'Not answered'}
                    forceUndecided={goal === 'pipeline' && (id === 'positions' || id === 'start')}
                  />
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {part !== 'summary' && <>
      <div className="preview__fit">
        <section className="fit fit--yes">
          <h3>You’d fit if</h3>
          {fit.length ? (
            <ul>{fit.map((x) => <li key={x}>{x}</li>)}</ul>
          ) : (
            <p className="fit__empty">Nothing listed yet.</p>
          )}
        </section>
        <section className="fit fit--no">
          <h3>Probably not for you if</h3>
          {not.length ? (
            <ul>{not.map((x) => <li key={x}>{x}</li>)}</ul>
          ) : (
            <p className="fit__empty">Nothing listed yet.</p>
          )}
        </section>
      </div>

      <div className="preview__body">
        {goal === 'pipeline' && (
          <section>
            <h3>Before hiring</h3>
            <Sentence id="hiringCondition" values={values} />
          </section>
        )}
        <section>
          <h3>The first month</h3>
          <Sentence id="month1" values={values} />
        </section>
        <section>
          <h3>A problem you would tackle</h3>
          <Sentence id="problem" values={values} />
        </section>
        {hasValue(FIELD_BY_ID.tuesday, values.tuesday) || values.tuesday?.undecided ? (
          <section>
            <h3>A normal day</h3>
            <Sentence id="tuesday" values={values} />
          </section>
        ) : null}
        <section>
          <h3>The team</h3>
          <p>
            Works most with <Val id="with" values={values} />. <Val id="solo" values={values} />. Team size: <Val id="teamsize" values={values} />.
          </p>
        </section>
        <section>
          <h3>Skills</h3>
          {values.skills?.undecided ? (
            <p><span className="gap-tag">{UNDECIDED}</span></p>
          ) : (
            <div className="preview__skills">
              {(['must', 'teach', 'nice'] as const).map((k) => (
                <div key={k}>
                  <h4>{k === 'must' ? 'Must-have' : k === 'teach' ? 'We teach on the job' : 'Nice to have'}</h4>
                  <p>{skills?.[k].length ? skills[k].join(', ') : '—'}</p>
                </div>
              ))}
            </div>
          )}
          <p className="preview__small">
            Education: <Val id="education" values={values} />
          </p>
        </section>
        <section>
          <h3>Moving here</h3>
          <dl className="preview__pairs">
            <div><dt>Candidates from abroad</dt><dd><Val id="fromAbroad" values={values} /></dd></div>
            <div><dt>Work from abroad at first</dt><dd><Val id="abroadFirst" values={values} /></dd></div>
            <div><dt>Visa support</dt><dd><Val id="visa" values={values} /></dd></div>
            <div><dt>Relocation help</dt><dd><Val id="relocation" values={values} /></dd></div>
          </dl>
        </section>
        {(hasValue(FIELD_BY_ID.career, values.career) || values.career?.undecided) && (
          <section>
            <h3>Where it leads</h3>
            <Sentence id="career" values={values} />
          </section>
        )}
      </div>
      </>}
    </article>
  )
}
