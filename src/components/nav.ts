import type { Role } from './viewing'

export type Area = 'profile' | 'questions' | 'meetings' | 'apply' | 'mine' | 'staff' | 'outcomes'

export const ROLE_OF_AREA: Record<Area, Role> = {
  profile: 'company',
  questions: 'company',
  meetings: 'company',
  apply: 'seeker',
  mine: 'seeker',
  staff: 'espoo',
  outcomes: 'espoo',
}

export const ROLES: { id: Role; label: string; href: string }[] = [
  { id: 'company', label: 'Company', href: '#/' },
  { id: 'seeker', label: 'Job seeker', href: '#/apply' },
  { id: 'espoo', label: 'City of Espoo', href: '#/staff' },
]

/** Each role's own navigation, in timeline order. */
export const NAV: Record<Role, { area: Area; href: string; label: string }[]> = {
  company: [
    { area: 'profile', href: '#/', label: 'Role profile' },
    { area: 'questions', href: '#/?view=questions', label: 'Application questions' },
    { area: 'meetings', href: '#/meetings', label: 'Meetings' },
  ],
  seeker: [
    { area: 'apply', href: '#/apply', label: 'Apply' },
    { area: 'mine', href: '#/apply', label: 'My application' },
  ],
  espoo: [
    { area: 'staff', href: '#/staff', label: 'Applications' },
    { area: 'outcomes', href: '#/outcomes', label: 'Follow-up' },
  ],
}

/** The hand-off to the next moment of the event, shown in the band. */
export const NEXT: Record<Area, { href: string; label: string } | null> = {
  profile: { href: '#/apply', label: 'Job seeker · Apply' },
  questions: { href: '#/apply', label: 'Job seeker · Apply' },
  apply: { href: '#/staff', label: 'City of Espoo · Applications' },
  mine: { href: '#/staff', label: 'City of Espoo · Applications' },
  staff: { href: '#/meetings', label: 'Company · Meetings' },
  meetings: { href: '#/outcomes', label: 'City of Espoo · Follow-up' },
  outcomes: null,
}
