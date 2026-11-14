# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: companies considering taking part in recruitment and matchmaking events organized by the City of Espoo, typically the person at the company deciding whether and how to show up (HR, a recruiter, a hiring manager or a founder at a small company). They use it desktop-first, at a desk while preparing for an event, with full mobile support for checking in on the go.

Secondary (implied by the challenge, not yet designed for): the talent those companies want to meet, and the City of Espoo staff who organize the events.

## Product Purpose

Built for the Junction 2026 hackathon, City of Espoo challenge: *"How can recruitment and matchmaking events organized by City of Espoo help companies and talent relevantly find and connect with each other, despite AI-generated job search materials and AI-assisted recruitment processes becoming common?"*

The tool drills a company on what it actually wants from an event before it attends:
- name recognition and visibility,
- recruiting for a specific need it has now or expects soon, or
- recruiting in general.

Typical job fairs fail because they are aimless and nobody really benefits. Success means a company arrives at an Espoo event knowing its goal, and the event can match it with the right people because of that clarity.

## Positioning

Most recruitment tools optimize the candidate side or automate screening. This one puts the questioning on the company: it makes the company say what it is really after, so the human meeting at the event is worth having. In a market flooded with AI-written CVs and AI-run screening, the honest, specific intent of the company is the signal that still means something.

## Operating Context

- Espoo city-run recruitment and matchmaking events (job fairs, matchmaking sessions).
- The company uses the tool before the event on a desktop; on a phone during or right before the event.
- Hackathon setting: a working demo judged by City of Espoo and Junction judges.

## Capabilities and Constraints

- Core capability: an interactive drill or interview that narrows a company's intent into one of the three goals above, with specifics.
- Stack: React 19 + TypeScript + Vite (already scaffolded).
- Undecided: what the drill outputs (a profile, a match list, an event plan), whether talent sees anything, how matching works, and the language set (Finnish, Swedish, English).

## Brand Commitments

- Product name: **Plainly**.
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
