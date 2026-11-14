import { SAMPLE_ROLES } from '../seeker/sampleRoles'
import { briefFrom } from './brief'
import { validateQuestionSet, type QuestionSet } from './core'
import type { Listing } from './store'
import { SAMPLE_APPLICATIONS as HAND_WRITTEN } from './sampleApplicants'
import { bulkApplicants } from './sampleBulk'

type DraftSet = {
  attributes: { id: string; name: string; looks_like: string; sources: { field: string; quote: string }[] }[]
  questions: { text: string; attributes: string[] }[]
}

/**
 * Question sets for the synthetic sample companies, written in the same shape
 * the model returns. They run through the same validator, so every source
 * quote is checked against the sample company's own texts.
 */
const SAMPLE_SETS: Record<string, DraftSet> = {
  'field-service': {
    attributes: [
      { id: 'a1', name: 'Electrical fault diagnosis', looks_like: 'Finds and fixes an electrical fault methodically and gets it right on the first visit.', sources: [{ field: 'mustSkills', quote: 'Electrical diagnostics' }, { field: 'purpose', quote: 'reliable equipment repairs on the first visit' }] },
      { id: 'a2', name: 'Customer communication on site', looks_like: 'Explains a technical problem calmly and clearly to a customer, including a frustrated one.', sources: [{ field: 'mustSkills', quote: 'Customer communication' }, { field: 'thrive', quote: 'enjoy meeting customers' }] },
      { id: 'a3', name: 'Working with incomplete information', looks_like: 'Has a practical way to work safely and well when the equipment history is missing or wrong.', sources: [{ field: 'problem', quote: 'technicians receive incomplete equipment histories' }] },
      { id: 'a4', name: 'Careful service records', looks_like: 'Keeps service notes that the next technician can rely on.', sources: [{ field: 'tuesday', quote: 'update service notes' }] },
    ],
    questions: [
      { text: 'Tell us about a fault you found and fixed in electrical equipment. How did you narrow it down, and what was the result?', attributes: ['a1'] },
      { text: 'You arrive at a customer site and the equipment history is incomplete. What do you do before and during the repair?', attributes: ['a3', 'a4'] },
      { text: 'Describe a time you explained a technical problem to a customer who was frustrated. What did you say, and how did it end?', attributes: ['a2'] },
    ],
  },
  backend: {
    attributes: [
      { id: 'a1', name: 'TypeScript and PostgreSQL in production', looks_like: 'Has built and shipped backend changes with TypeScript and PostgreSQL, with concrete details.', sources: [{ field: 'mustSkills', quote: 'TypeScript, PostgreSQL' }] },
      { id: 'a2', name: 'Data consistency and reliability', looks_like: 'Understands late, duplicated or out-of-order events and has made a system more reliable.', sources: [{ field: 'problem', quote: 'arrive late and create duplicate orders' }, { field: 'month1', quote: 'a small reliability improvement from start to release' }] },
      { id: 'a3', name: 'Tracing problems across systems', looks_like: 'Follows an event or request through several services to find a root cause.', sources: [{ field: 'tuesday', quote: 'trace an order event' }] },
      { id: 'a4', name: 'Making systems easier to operate', looks_like: 'Has made a system simpler for others to run, monitor or debug.', sources: [{ field: 'thrive', quote: 'making complex systems easier to operate' }] },
    ],
    questions: [
      { text: 'Describe a backend change you took from start to release with TypeScript or PostgreSQL. What did you build, and what did you check before releasing?', attributes: ['a1', 'a2'] },
      { text: 'Stock updates from two sales channels arrive late and create duplicate orders. How would you find the cause and stop the duplicates?', attributes: ['a2', 'a3'] },
      { text: 'Tell us about something you made easier for others to run or debug. What changed for them?', attributes: ['a4'] },
    ],
  },
  'product-design': {
    attributes: [
      { id: 'a1', name: 'Mapping a workflow end to end', looks_like: 'Has mapped how people actually do a job before designing changes to it.', sources: [{ field: 'month1', quote: 'map the current planning journey' }] },
      { id: 'a2', name: 'Prototyping and testing with users', looks_like: 'Tests prototypes with real users and changes the design because of what they learn.', sources: [{ field: 'month1', quote: 'prototype one improvement with fleet managers' }, { field: 'tuesday', quote: 'test a prototype with a customer' }] },
      { id: 'a3', name: 'Reducing repeated manual work', looks_like: 'Has removed duplicate entry or handoffs from a workflow, with a visible effect.', sources: [{ field: 'problem', quote: 're-enter the same route details in several tools' }, { field: 'purpose', quote: 'fewer manual handoffs' }] },
      { id: 'a4', name: 'Bringing customers and engineers together', looks_like: 'Brings customers and engineers into one conversation and turns it into decisions.', sources: [{ field: 'thrive', quote: 'bringing customers and engineers into the same conversation' }] },
    ],
    questions: [
      { text: 'Walk us through a workflow you mapped and then improved. What did you learn from the people doing the work, and what did you change?', attributes: ['a1', 'a3'] },
      { text: 'Describe a prototype you tested with real users, in Figma or another tool. What did the test change in your design?', attributes: ['a2'] },
      { text: 'Tell us about a time you brought customers and engineers into the same conversation. What came out of it?', attributes: ['a4'] },
    ],
  },
  'data-engineer': {
    attributes: [
      { id: 'a1', name: 'Python and SQL pipelines', looks_like: 'Has built or improved data transformations in Python and SQL and can describe them concretely.', sources: [{ field: 'mustSkills', quote: 'Python, SQL' }, { field: 'tuesday', quote: 'improve a transformation' }] },
      { id: 'a2', name: 'Reconciling inconsistent data', looks_like: 'Has reconciled sources with different formats, units or timing, step by step.', sources: [{ field: 'problem', quote: 'arrive in different formats and take time to reconcile' }] },
      { id: 'a3', name: 'Data quality and documentation', looks_like: 'Checks data quality deliberately and documents data so others can trust it.', sources: [{ field: 'purpose', quote: 'consistent, well-documented data' }, { field: 'tuesday', quote: 'review quality checks with an analyst' }] },
      { id: 'a4', name: 'Explaining data to non-engineers', looks_like: 'Makes data and results understandable to people outside engineering.', sources: [{ field: 'thrive', quote: 'making data understandable to people outside engineering' }] },
    ],
    questions: [
      { text: 'Describe a data pipeline or transformation you built with Python or SQL. What data went in, what came out, and how did you know it was right?', attributes: ['a1', 'a3'] },
      { text: 'Two sources describe the same thing in different formats and units. Tell us how you reconciled data like that, step by step.', attributes: ['a2'] },
      { text: 'Tell us about a time you made a dataset or result understandable to someone outside engineering.', attributes: ['a4'] },
    ],
  },
  sustainability: {
    attributes: [
      { id: 'a1', name: 'Life-cycle assessment in practice', looks_like: 'Has done or contributed to a footprint or LCA with a clear scope, data and conclusion.', sources: [{ field: 'mustSkills', quote: 'Life-cycle assessment' }, { field: 'month1', quote: 'prepare a first product footprint' }] },
      { id: 'a2', name: 'Reviewing scattered supplier data', looks_like: 'Has a consistent method for checking data that arrives from many suppliers in different shapes.', sources: [{ field: 'problem', quote: 'material data is spread across supplier files' }, { field: 'tuesday', quote: 'check supplier data' }] },
      { id: 'a3', name: 'Checking and explaining assumptions', looks_like: 'Questions the assumptions behind numbers and explains what they mean to non-specialists.', sources: [{ field: 'thrive', quote: 'checking assumptions and explaining what the numbers mean' }, { field: 'tuesday', quote: 'discuss assumptions with product teams' }] },
      { id: 'a4', name: 'Spreadsheet modelling', looks_like: 'Builds and maintains a model in Excel that others can follow.', sources: [{ field: 'mustSkills', quote: 'Excel' }, { field: 'tuesday', quote: 'update a footprint model' }] },
    ],
    questions: [
      { text: 'Describe a footprint or life-cycle assessment you worked on. What was in scope, which data did you use, and what did you conclude?', attributes: ['a1', 'a4'] },
      { text: 'Material data is spread across supplier files in different shapes. How would you review it consistently before reporting?', attributes: ['a2'] },
      { text: 'Tell us about a time you questioned an assumption behind a number and explained the result to a non-specialist.', attributes: ['a3'] },
    ],
  },
}

const PUBLISHED_AT = '2027-01-20T09:00:00.000Z'

/** Synthetic companies joining the sample event, labelled Sample wherever shown. */
export const SAMPLE_LISTINGS: Listing[] = SAMPLE_ROLES.flatMap((role) => {
  const brief = briefFrom(role.values)
  const draft = SAMPLE_SETS[role.id]
  const checked = draft ? validateQuestionSet(draft, brief) : null
  if (!checked) {
    if (import.meta.env.DEV) console.warn(`[sample] question set for ${role.id} failed validation`)
    return []
  }
  const set: QuestionSet = { ...checked, source: 'sample' }
  return [
    {
      id: `sample-${role.id}`,
      company: brief.company,
      title: brief.title,
      status: brief.status,
      brief,
      set,
      values: role.values,
      seed: `sample-${role.id}`,
      publishedAt: PUBLISHED_AT,
      sample: true,
    },
  ]
})

const bulk = bulkApplicants(SAMPLE_LISTINGS, new Set(HAND_WRITTEN.map((a) => a.code)))

/** Every sample applicant: the hand-written ones, then the generated long tail. */
export const SAMPLE_APPLICATIONS = [...HAND_WRITTEN, ...bulk.applications]
/** Scores for the generated applicants, keyed `${applicationId}:${listingId}`. */
export const SAMPLE_BULK_SCORES = bulk.scores
