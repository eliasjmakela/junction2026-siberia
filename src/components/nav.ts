export type Area = 'company' | 'apply' | 'staff' | 'outcomes'

/** The main navigation, the same on every page. */
export const NAV_LINKS: { area: Area; href: string; label: string }[] = [
  { area: 'company', href: '#/', label: 'For companies' },
  { area: 'apply', href: '#/apply', label: 'Apply to the event' },
  { area: 'staff', href: '#/staff', label: 'Staff review' },
  { area: 'outcomes', href: '#/outcomes', label: 'Follow-up' },
]
