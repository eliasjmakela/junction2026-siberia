/**
 * The company form: eight screens of guiding questions, then a review of the
 * role page attendees will see. Every required field can be answered with
 * "Not decided yet", so the page shows honest gaps instead of filler.
 */

export type Goal = 'now' | 'soon' | 'pipeline'

export const GOALS: Record<Goal, { name: string }> = {
  now: { name: 'Open now' },
  soon: { name: 'Opening soon' },
  pipeline: { name: 'Talent pipeline' },
}

export type Option = { id: string; label: string; withDate?: boolean }

type Base = {
  id: string
  label: string
  hint?: string
  /** Optional fields never block Next. */
  optional?: boolean
  /** Fields that set structure (the goal) cannot be left undecided. */
  noUndecided?: boolean
  /** Asked once per company and kept when adding another role. */
  company?: boolean
}

export type Field =
  | (Base & { kind: 'single'; options: Option[] })
  | (Base & { kind: 'multi'; options: Option[] })
  | (Base & { kind: 'text'; multiline?: boolean; lead?: string; placeholder?: string })
  | (Base & { kind: 'number'; min: number; max: number })
  | (Base & { kind: 'scale'; left: string; right: string })
  | (Base & { kind: 'skills' })
  | (Base & { kind: 'salary' })

export type Skills = { must: string[]; teach: string[]; nice: string[] }

export type Value = {
  choice?: string
  choices?: string[]
  date?: string
  text?: string
  number?: number
  skills?: Skills
  salary?: { min?: number; max?: number }
  undecided?: boolean
}

export type Values = Record<string, Value>

export type Screen = { id: string; name: string; title: string; hint?: string; fields: Field[] }

export const SCREENS: Screen[] = [
  {
    id: 'goal',
    name: 'Vacancy',
    title: 'Is this a real open vacancy, or are you building a talent pipeline?',
    fields: [
      {
        id: 'vacancy',
        kind: 'single',
        label: 'Status of the role',
        noUndecided: true,
        options: [
          { id: 'now', label: 'Open now' },
          { id: 'soon', label: 'Opening soon' },
          { id: 'pipeline', label: 'Talent pipeline' },
        ],
      },
    ],
  },
  {
    id: 'role',
    name: 'The role',
    title: 'What is the role?',
    fields: [
      { id: 'title', kind: 'text', label: 'Role title', placeholder: 'e.g. Backend developer', noUndecided: true },
      {
        id: 'purpose',
        kind: 'text',
        multiline: true,
        label: 'In one sentence',
        lead: 'This role exists so that',
        placeholder: 'e.g. our customers get their equipment fixed on the first visit.',
      },
      {
        id: 'type',
        kind: 'single',
        label: 'Type',
        options: [
          { id: 'full', label: 'Full-time' },
          { id: 'part', label: 'Part-time' },
          { id: 'intern', label: 'Internship' },
          { id: 'thesis', label: 'Thesis' },
          { id: 'summer', label: 'Summer job' },
          { id: 'contract', label: 'Contract' },
        ],
      },
      { id: 'positions', kind: 'number', label: 'Number of positions', min: 1, max: 99 },
      {
        id: 'start',
        kind: 'single',
        label: 'Start date',
        options: [
          { id: 'asap', label: 'As soon as possible' },
          { id: '3m', label: 'Within 3 months' },
          { id: 'flex', label: 'Flexible' },
          { id: 'date', label: 'A specific date', withDate: true },
        ],
      },
    ],
  },
  {
    id: 'work',
    name: 'The work',
    title: 'What does the work look like?',
    fields: [
      {
        id: 'month1',
        kind: 'text',
        multiline: true,
        label: 'First month',
        lead: 'In the first month, this person will',
        placeholder: 'e.g. shadow two senior technicians and run their first service visits.',
      },
      {
        id: 'tuesday',
        kind: 'text',
        multiline: true,
        label: 'A normal day',
        lead: 'A normal Tuesday looks like',
        placeholder: 'e.g. a stand-up at 9, customer calls before lunch, focused work after.',
        optional: true,
      },
      {
        id: 'hours',
        kind: 'single',
        label: 'Working hours',
        options: [
          { id: 'fixed', label: 'Fixed' },
          { id: 'flexible', label: 'Flexible' },
          { id: 'shift', label: 'Shift work' },
        ],
      },
      {
        id: 'salary',
        kind: 'salary',
        label: 'Salary range',
        hint: 'Gross, euros per month.',
        optional: true,
      },
    ],
  },
  {
    id: 'team',
    name: 'The team',
    title: 'Who will they work with?',
    fields: [
      {
        id: 'with',
        kind: 'multi',
        label: 'Works most with',
        hint: 'Choose all that apply.',
        options: [
          { id: 'customers', label: 'Customers' },
          { id: 'engineers', label: 'Engineers' },
          { id: 'suppliers', label: 'Suppliers' },
          { id: 'management', label: 'Management' },
        ],
      },
      { id: 'solo', kind: 'scale', label: 'Solo or team-based?', left: 'Mostly solo', right: 'Mostly team' },
      {
        id: 'teamsize',
        kind: 'single',
        label: 'Team size',
        options: [
          { id: '1-3', label: '1–3 people' },
          { id: '4-10', label: '4–10 people' },
          { id: '11-30', label: '11–30 people' },
          { id: '30+', label: 'More than 30' },
        ],
      },
    ],
  },
  {
    id: 'skills',
    name: 'Skills',
    title: 'What skills does the role need?',
    fields: [
      {
        id: 'skills',
        kind: 'skills',
        label: 'Skills',
        hint: 'Add a skill, then choose where it belongs.',
      },
      {
        id: 'education',
        kind: 'single',
        label: 'Education',
        options: [
          { id: 'required', label: 'Required' },
          { id: 'preferred', label: 'Preferred' },
          { id: 'no', label: 'Not important' },
        ],
      },
    ],
  },
  {
    id: 'language',
    name: 'Language',
    title: 'Which languages are used at work?',
    fields: [
      {
        id: 'worklang',
        kind: 'multi',
        label: 'Working language',
        hint: 'Choose all that are used day to day.',
        options: [
          { id: 'fi', label: 'Finnish' },
          { id: 'en', label: 'English' },
          { id: 'sv', label: 'Swedish' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'finnish',
        kind: 'single',
        label: 'Finnish required?',
        options: [
          { id: 'no', label: 'No' },
          { id: 'basic', label: 'Basic' },
          { id: 'fluent', label: 'Fluent' },
          { id: 'learnable', label: 'Learnable in the role' },
        ],
      },
    ],
  },
  {
    id: 'location',
    name: 'Location',
    title: 'Where is the work done?',
    fields: [
      {
        id: 'mode',
        kind: 'single',
        label: 'Work mode',
        options: [
          { id: 'onsite', label: 'On-site' },
          { id: 'hybrid', label: 'Hybrid' },
          { id: 'remote', label: 'Remote' },
        ],
      },
      { id: 'office', kind: 'text', label: 'Office location', placeholder: 'e.g. Keilaniemi, Espoo' },
      {
        id: 'abroadFirst',
        kind: 'single',
        label: 'Can the person work from abroad at first?',
        options: [
          { id: 'yes', label: 'Yes' },
          { id: 'no', label: 'No' },
          { id: 'depends', label: 'Depends' },
        ],
      },
      {
        id: 'fromAbroad',
        kind: 'single',
        label: 'Open to candidates from abroad?',
        options: [
          { id: 'yes', label: 'Yes' },
          { id: 'no', label: 'No' },
          { id: 'case', label: 'Case by case' },
        ],
      },
      {
        id: 'visa',
        kind: 'single',
        label: 'Visa support',
        options: [
          { id: 'yes', label: 'Yes' },
          { id: 'no', label: 'No' },
          { id: 'depends', label: 'Depends' },
        ],
      },
      {
        id: 'relocation',
        kind: 'multi',
        label: 'Relocation help',
        hint: 'Choose all that you offer.',
        options: [
          { id: 'housing', label: 'Housing' },
          { id: 'travel', label: 'Travel costs' },
          { id: 'admin', label: 'Admin support' },
          { id: 'none', label: 'None' },
        ],
      },
    ],
  },
  {
    id: 'company',
    name: 'Company',
    title: 'About the company',
    hint: 'These answers are shared by all of your roles.',
    fields: [
      { id: 'company', kind: 'text', label: 'Company name', placeholder: 'e.g. Example Oy', company: true, noUndecided: true },
      {
        id: 'size',
        kind: 'single',
        label: 'Size and stage',
        company: true,
        options: [
          { id: 'startup', label: 'Startup' },
          { id: 'growing', label: 'Growing' },
          { id: 'established', label: 'Established' },
          { id: 'public', label: 'Public sector' },
        ],
      },
      {
        id: 'thrive',
        kind: 'text',
        multiline: true,
        label: 'Who does well here',
        lead: 'People who thrive here tend to',
        placeholder: 'e.g. ask a lot of questions and like fixing things themselves.',
        company: true,
      },
      {
        id: 'career',
        kind: 'text',
        multiline: true,
        label: 'Career path',
        lead: 'A typical career path from this role:',
        placeholder: 'e.g. senior technician in 2–3 years, then team lead or specialist.',
        optional: true,
      },
    ],
  },
]

export const ALL_FIELDS: Field[] = SCREENS.flatMap((s) => s.fields)
export const FIELD_BY_ID: Record<string, Field> = Object.fromEntries(ALL_FIELDS.map((f) => [f.id, f]))
