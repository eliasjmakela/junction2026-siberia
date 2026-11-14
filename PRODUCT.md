# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: companies considering taking part in recruitment and matchmaking events organized by the City of Espoo, typically the person at the company deciding whether and how to show up (HR, a recruiter, a hiring manager or a founder at a small company). They use it desktop-first, at a desk while preparing for an event, with full mobile support for checking in on the go.

Secondary: job seekers who want to attend an Espoo event. They pick at most three companies that are joining and answer each company's short open questions to apply.

Third: City of Espoo staff who organise the event. They review the applications per company, ranked by AI-drafted attribute scores with evidence, and decide whom to invite.

## Product Purpose

Built for the Junction 2026 hackathon, City of Espoo challenge: *"How can recruitment and matchmaking events organized by City of Espoo help companies and talent relevantly find and connect with each other, despite AI-generated job search materials and AI-assisted recruitment processes becoming common?"*

The tool has a company describe each role plainly before the event: whether it is open now, expected to open within three months, or a talent pipeline, what the first month and a normal day look like, which skills are must-have versus teachable, language, location and relocation terms. From those answers, AI drafts the questions job seekers answer to apply for the event, and City of Espoo staff decide whom to invite with AI-drafted, evidence-backed scores as support.

Typical job fairs fail because they are aimless and nobody really benefits. Success means a company arrives at an Espoo event knowing its goal, and the event can match it with the right people because of that clarity.

## Positioning

Most recruitment tools optimize the candidate side or automate screening. This one puts the questioning on the company: it makes the company say what it is really after, so the human meeting at the event is worth having. In a market flooded with AI-written CVs and AI-run screening, the honest, specific intent of the company is the signal that still means something.

## Operating Context

- Espoo city-run recruitment and matchmaking events (job fairs, matchmaking sessions).
- The company uses the tool before the event on a desktop; on a phone during or right before the event.
- Hackathon setting: a working demo judged by City of Espoo and Junction judges.

## Capabilities and Constraints

- Core capability: a company form with guiding questions and answer chips, filled in once per role (about 8 minutes). Company answers (name, size and stage, who thrives here) are asked once and carried over to every role.
- The form's first question sets the role status: open now, expected to open within three months, or a talent pipeline. The role step adapts to the status: open roles ask for positions and start timing; expected openings ask for their window; pipelines ask what would need to happen before hiring and leave headcount and start timing undecided.
- Every required question can be answered "Not decided yet"; the role page shows these as honest gaps instead of filler.
- Output: a role page generated from the answers by one template, including "You'd fit if" and "Probably not for you if" lists assembled by fixed rules (no LLM).
- Company writing help: on request, help clarify one text answer with a concise rewrite and job-related follow-up questions. The company chooses whether to apply suggested wording. Until Gemini is configured, the form shows suggestions tagged "From fixed templates".
- Role card: the submitted role as one spruce card with its constellation, title, status and key facts.
- The constellation figure is a clean, status-specific shape with bounded variations derived from the role's active answers, giving the same role a repeatable visual fingerprint.
- Application questions (LLM-powered): from the submitted role's own texts, AI drafts 2–5 attributes the company is looking for, each citing verbatim quotes from the company's answers, and 2–4 open questions that let applicants show them with concrete examples. The company reviews, removes and publishes them to the event. Without an API key, or if the model call fails, fixed templates draft them from the same texts.
- Applying to the event: a job seeker picks at most three published companies, answers their questions, gives an e-mail for the invitation and consents to the processing. They get a pseudonymous application code and can delete the application.
- Staff review (LLM-powered decision support): for each company, every application is scored 0–10 per attribute, each score with a verbatim quote from the applicant's answer as evidence and the company quotes that made the attribute matter. Applicants are ranked within each company's pool against its event slots. Staff record every invite, waitlist or decline decision by hand. Without an API key, scores are a labelled fixed-rule estimate.
- Meetings (`#/meetings`): a company books 20-minute meetings at its stand on event day with the candidates City of Espoo invited for its role (decisions made in Staff review), then, after the event, rates each candidate it met 1–5 with a next step and an optional note. Candidates appear by application code with their scores, evidence and answers to that company's questions; no e-mail, other companies or other answers. Notes are checked by the forbidden-topic filter, stay in this browser and are never sent to a model. Ratings are the company's own and do not feed Staff review or Follow-up.
- Structure: a band at the top of every page shows who the event is viewed as (Company, Job seeker, City of Espoo). Each role has its own navigation in timeline order: Company has Role profile (`#/`), Application questions (`#/?view=questions`) and Meetings (`#/meetings`); Job seeker has Apply and My application (`#/apply`); City of Espoo has Applications (`#/staff`) and Follow-up (`#/outcomes`). The band also holds the company menu (New company, or one of the five event companies shown read-only), Play walkthrough and a Next link through the five moments.
- Follow-up (concept demo only, simulated data): a "LinkedIn profile check" 3 and 6 months after the event shows how many attendees now work at a company they applied to meet, out of how many matched profiles, with per-company follow-up actions and a copyable summary. Nothing is looked up or collected in the demo. A real deployment needs approved access to LinkedIn data or the members' own consent, consent given at application, and GDPR purpose and retention limits (event evaluation only; employer and start month deleted after the 6-month check). Results are counts per event and company, never a list of people; counts of 1–2 are shown as "1–2".
- GDPR and non-discrimination (binding): attributes and questions come only from the company's job texts and must quote them; never special-category data, age, gender, family status, nationality or other protected grounds, in questions, attributes, scores, rationales or evidence; no names or contact details in questions or in anything sent to a model. The scoring model sees one company's questions and one applicant's answers to them, scrubbed of contact details, without the e-mail or application code. E-mails appear only in the staff invitation list. Scores are decision support under human review (GDPR art. 22; the EU AI Act treats candidate evaluation as high-risk): every score shows its evidence, a score without valid evidence is not given, and no invitation is automatic. Applicants are told this before they answer and give explicit consent.
- Writing-help privacy: only the selected field's answer, role title and static field guidance are sent to Gemini, on request. E-mail addresses, URLs and phone-like strings are removed before sending; the Gemini request uses stateless mode. Never send applicant data or other role/company answers.
- Planned next: a shared backend for event data (everything is in one browser's storage today), sending invitations, and Finnish and Swedish copy. Optionally, pasting a job ad to have an LLM draft answers for the company to correct.
- Hard limit: a company finishes one role in 10 minutes at most. Question count and question types are chosen for that budget.
- Stack: React 19 + TypeScript + Vite (already scaffolded).
- Undecided: the language set (Finnish, Swedish, English) and the retention period for applications.

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
- No real companies, testimonials, event data or match statistics exist yet. All companies, applicants and follow-up figures in the app are synthetic. The interface does not carry "sample" or "demo" labels (the demo context is understood), but no outcome claims may be presented as real in the pitch or docs.

## Product Principles

1. Intent before exposure: the company states its goal before it gets a stand, a slot or a match.
2. Specific beats aimless: every question should narrow the answer; "recruiting in general" is a valid answer but still has to be pinned down.
3. Human signal over generated noise: favor what a company can honestly answer over polished, AI-sounding copy.
4. Respect the recruiter's time: a session is short and focused on desktop, and still works on a phone.

## Accessibility & Inclusion

Public-sector product for the City of Espoo: aim for WCAG 2.2 AA. Multilingual use (Finnish, Swedish, English) is likely.
