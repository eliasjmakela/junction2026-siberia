export type Goal = 'visibility' | 'need' | 'general'

export type Option = {
  id: string
  label: string
  /** Only the first question sets a goal. */
  goal?: Goal
  /** Wording used inside the intent summary, when the label does not fit the sentence. */
  summary?: string
}

export type Question = {
  id: string
  /** Short name used in the ledger. */
  short: string
  prompt: string
  hint?: string
  options: Option[]
  allowOwnWords: boolean
}

export const GOALS: Record<Goal, { name: string; emblem: string }> = {
  visibility: { name: 'Be seen', emblem: 'circle' },
  need: { name: 'Hire for a need', emblem: 'wedge' },
  general: { name: 'Hire in general', emblem: 'band' },
}

export const FIRST: Question = {
  id: 'why',
  short: 'Why go',
  prompt: 'Why is your company going to this event?',
  hint: 'Choose the option closest to your main reason.',
  allowOwnWords: false,
  options: [
    { id: 'seen', label: 'So future hires know who we are', goal: 'visibility' },
    { id: 'need', label: 'We have a role to fill, now or soon', goal: 'need' },
    { id: 'general', label: 'We always want to meet good people', goal: 'general' },
  ],
}

const AT_STAND: Question = {
  id: 'stand',
  short: 'At the stand',
  prompt: 'Who from your company will actually be at the stand?',
  allowOwnWords: true,
  options: [
    { id: 'manager', label: 'The hiring manager' },
    { id: 'hr', label: 'HR or a recruiter' },
    { id: 'founder', label: 'A founder or CEO' },
    { id: 'undecided', label: 'Not decided yet' },
  ],
}

export const PATHS: Record<Goal, Question[]> = {
  need: [
    {
      id: 'headcount',
      short: 'Headcount',
      prompt: 'How many people could you hire in the next six months?',
      allowOwnWords: false,
      options: [
        { id: '1', label: 'One' },
        { id: '2-3', label: 'Two or three' },
        { id: '4-10', label: 'Four to ten' },
        { id: '10+', label: 'More than ten' },
      ],
    },
    {
      id: 'start',
      short: 'Start',
      prompt: 'When would they need to start?',
      allowOwnWords: false,
      options: [
        { id: 'now', label: 'Right away' },
        { id: '3m', label: 'Within three months' },
        { id: '12m', label: 'Within a year' },
        { id: 'unsure', label: 'We are not sure yet', summary: 'start date open' },
      ],
    },
    {
      id: 'role',
      short: 'Role',
      prompt: 'If the right person walked up to your stand tomorrow, which role would you hire them for?',
      hint: 'Choose the role you would actually make an offer for.',
      allowOwnWords: true,
      options: [
        { id: 'dev', label: 'Software developer' },
        { id: 'tech', label: 'Field service technician' },
        { id: 'sales', label: 'Sales or customer role' },
        { id: 'any', label: 'No single role, anyone strong', summary: 'any strong candidate' },
      ],
    },
    {
      id: 'musthave',
      short: 'Must-have',
      prompt: 'What would you turn someone down for not having?',
      hint: 'Choose the one requirement you would not compromise on.',
      allowOwnWords: true,
      options: [
        { id: 'skill', label: 'A specific technical skill' },
        { id: 'fi', label: 'Finnish or Swedish' },
        { id: 'years', label: 'Years of experience' },
        { id: 'none', label: 'Nothing, we can teach it' },
      ],
    },
    AT_STAND,
  ],
  visibility: [
    {
      id: 'who',
      short: 'Remembered by',
      prompt: 'Who should still remember your company a month after the event?',
      allowOwnWords: true,
      options: [
        { id: 'students', label: 'Students graduating in one or two years' },
        { id: 'experienced', label: 'Experienced people in our field' },
        { id: 'new', label: 'People new to Finland' },
        { id: 'everyone', label: 'Anyone in Espoo' },
      ],
    },
    {
      id: 'what',
      short: 'Remembered for',
      prompt: 'What should they remember about you?',
      allowOwnWords: true,
      options: [
        { id: 'product', label: 'What we build' },
        { id: 'culture', label: 'What it is like to work here' },
        { id: 'local', label: 'That we hire here in Espoo', summary: 'hiring here in Espoo' },
        { id: 'name', label: 'Just our name', summary: 'our name' },
      ],
    },
    {
      id: 'hiring',
      short: 'Hiring soon',
      prompt: 'Will you hire anyone in the next twelve months?',
      allowOwnWords: false,
      options: [
        { id: 'yes', label: 'Yes, and we know which roles' },
        { id: 'maybe', label: 'Probably, not sure which roles' },
        { id: 'no', label: 'No' },
      ],
    },
    {
      id: 'worked',
      short: 'Success',
      prompt: 'How will you know the event was worth it?',
      allowOwnWords: true,
      options: [
        { id: 'contacts', label: 'People left us their contact details' },
        { id: 'followers', label: 'More people follow or apply later' },
        { id: 'talks', label: 'We had a few real conversations' },
        { id: 'unknown', label: 'Honestly, we do not know' },
      ],
    },
    AT_STAND,
  ],
  general: [
    {
      id: 'good',
      short: 'Good means',
      prompt: 'When you say "good people", what do you mean?',
      hint: 'Choose the quality that matters most.',
      allowOwnWords: true,
      options: [
        { id: 'learner', label: 'Learns fast', summary: 'fast learners' },
        { id: 'expert', label: 'Deep skill in one area', summary: 'specialists' },
        { id: 'fit', label: 'Fits how we work', summary: 'people who fit how we work' },
        { id: 'lang', label: 'Speaks Finnish or Swedish', summary: 'Finnish or Swedish speakers' },
      ],
    },
    {
      id: 'teams',
      short: 'Teams',
      prompt: 'Which part of the company could take someone in this year?',
      allowOwnWords: true,
      options: [
        { id: 'eng', label: 'Engineering or product' },
        { id: 'ops', label: 'Operations or field work' },
        { id: 'biz', label: 'Sales, marketing or support' },
        { id: 'any', label: 'Any team, if the person is right', summary: 'any team' },
      ],
    },
    {
      id: 'rate',
      short: 'Hires per year',
      prompt: 'How many people do you usually hire in a year?',
      allowOwnWords: false,
      options: [
        { id: '0-2', label: 'Up to two' },
        { id: '3-10', label: 'Three to ten' },
        { id: '10+', label: 'More than ten' },
        { id: 'unknown', label: 'We do not track it' },
      ],
    },
    {
      id: 'end',
      short: 'Good outcome',
      prompt: 'What should a good conversation at your stand end with?',
      allowOwnWords: true,
      options: [
        { id: 'interview', label: 'A booked interview' },
        { id: 'contact', label: 'Contact details swapped' },
        { id: 'task', label: 'A short trial task' },
        { id: 'talent', label: 'A place in our talent pool' },
      ],
    },
    AT_STAND,
  ],
}

/** Number of questions in a full drill, so progress can show before the goal is known. */
export const DRILL_LENGTH = 1 + PATHS.need.length
