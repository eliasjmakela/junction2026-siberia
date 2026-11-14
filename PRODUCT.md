# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: companies considering taking part in recruitment and matchmaking events organized by the City of Espoo, typically the person at the company deciding whether and how to show up (HR, a recruiter, a hiring manager or a founder at a small company). They use it desktop-first, at a desk while preparing for an event, with full mobile support for checking in on the go.

Secondary (implied by the challenge, not yet designed for): the talent those companies want to meet, and the City of Espoo staff who organize the events.

## Product Purpose

Built for the Junction 2026 hackathon, City of Espoo challenge: *"How can recruitment and matchmaking events organized by City of Espoo help companies and talent relevantly find and connect with each other, despite AI-generated job search materials and AI-assisted recruitment processes becoming common?"*

The tool has a company describe each role plainly before the event: whether it is open now, opening soon, or a talent pipeline, what the first month and a normal day look like, which skills are must-have versus teachable, language, location and relocation terms. Attendees then see at a glance whether a role is for them.

Typical job fairs fail because they are aimless and nobody really benefits. Success means a company arrives at an Espoo event knowing its goal, and the event can match it with the right people because of that clarity.

## Positioning

Most recruitment tools optimize the candidate side or automate screening. This one puts the questioning on the company: it makes the company say what it is really after, so the human meeting at the event is worth having. In a market flooded with AI-written CVs and AI-run screening, the honest, specific intent of the company is the signal that still means something.

## Operating Context

- Espoo city-run recruitment and matchmaking events (job fairs, matchmaking sessions).
- The company uses the tool before the event on a desktop; on a phone during or right before the event.
- Hackathon setting: a working demo judged by City of Espoo and Junction judges.

## Capabilities and Constraints

- Core capability: a company form with guiding questions and answer chips, filled in once per role (about 8 minutes). Company answers (name, size and stage, who thrives here) are asked once and carried over to every role.
- The form's first question sets the role status: open now, opening soon, or talent pipeline.
- Every required question can be answered "Not decided yet"; the role page shows these as honest gaps instead of filler.
- Output: a role page generated from the answers by one template, including "You'd fit if" and "Probably not for you if" lists assembled by fixed rules (no LLM).
- Role card: the submitted role as one spruce card with its constellation, title, status and key facts.
- Quick check for attendees (LLM-powered): from the submitted role, AI drafts a 60-second questionnaire of yes/no and number questions about the role's requirements. The company reviews, removes and publishes the questions; attendees answer them at #/check as a self-check. Without an API key, or if the model call fails, the questions come from fixed rules.
- GDPR and non-discrimination (binding for anything attendees see): only job-relevant requirements; never special-category data, age, gender, family status, nationality or other protected grounds; no names or contact details; attendee answers stay in the attendee's browser, are never stored or sent, and the result is a self-check, never an automated decision. The model sees only the role profile.
- Planned next: an event page listing all companies with filters (skills, language, remote, relocation); optionally, pasting a job ad to have an LLM draft answers for the company to correct.
- Hard limit: a company finishes one role in 10 minutes at most. Question count and question types are chosen for that budget.
- Stack: React 19 + TypeScript + Vite (already scaffolded).
- Undecided: how attendees are matched to roles, and the language set (Finnish, Swedish, English).

## Brand Commitments

- Product name: **Plainly**. Tagline from the team's brief: "Just say it plainly."
- Own product identity that clearly belongs in Espoo, without copying the city's official visual identity or logo.
- User requirement: the design language must not look like generic AI-generated UI.

### Interface copy: no revision residue

Copy states what the product is and does, never what it was or what it is not. Interface text, docs and comments must not carry traces of how they were made: no "unlike before", "instead of X", "not a wizard but…", "we deliberately avoid…", or explanations of why something is A rather than B. Those contrasts come from design discussions, and a visitor who never saw those discussions reads them as defensive. Arguing with options the reader never saw is a recognisable AI tell
- Describe the thing on its own terms: "Choose the role you would make an offer for", not "Choose a real role, not a generic one".
- Design reasoning and rejected options belong in development records (surface briefs, design docs, commit messages), never in anything a user or judge reads.
- When something changes, the new version simply replaces the old one, with no apology, contrast or justification left behind
It sits alongside the bespoke-text rule. That rule covers text that reacts to the current app state; this one covers text that reacts to the project's own history
### Interface copy: avoid the bespoke text trap

UI text must read like a real, practically built app, not a hand-tailored vertical slice. Real apps do not comment on the user's specific state (no "Nice, two roles is a great start!", no hints that react to what was just picked, no editorial asides written for one demo path) unless the feature is explicitly LLM-powered and labelled as such.

- Labels, buttons, empty states, errors and status messages are generic templates that would hold for any company and any answer: "No answers yet", "Intent submitted", "Choose an answer to continue".
- Summaries built from data are fine when they are plainly assembled from the fields (a template with slots), not prose that pretends to understand.
- Colourful, frank or interesting language is welcome where a product team would actually author it once: question wording, static help text per question, marketing and onboarding copy. Be deliberate about where each kind of language belongs.

## Evidence on Hand

- Challenge statement (quoted above).
- No real companies, testimonials, event data or match statistics exist yet. Demo content must be labeled as sample data, and no outcome claims may be invented.

## Product Principles

1. Intent before exposure: the company states its goal before it gets a stand, a slot or a match.
2. Specific beats aimless: every question should narrow the answer; "recruiting in general" is a valid answer but still has to be pinned down.
3. Human signal over generated noise: favor what a company can honestly answer over polished, AI-sounding copy.
4. Respect the recruiter's time: a session is short and focused on desktop, and still works on a phone.

## Accessibility & Inclusion

Public-sector product for the City of Espoo: aim for WCAG 2.2 AA. Multilingual use (Finnish, Swedish, English) is likely.
