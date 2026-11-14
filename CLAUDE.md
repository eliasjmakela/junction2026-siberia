# Plainly: notes for agents

Plainly is a Junction 2026 hackathon app for the City of Espoo challenge (recruitment events in an age of AI-written job material). A company describes one role plainly in eight short steps, reviews and submits the role page, then publishes AI-drafted application questions grounded in its own answers. Job seekers pick at most three companies at `#/apply` and answer their questions. At `#/staff`, City of Espoo staff see applicants ranked per company by AI-drafted 0–10 attribute scores (each with evidence quotes) and decide invitations by hand. `#/outcomes` is a concept demo of a 3- and 6-month follow-up on simulated data.

Read these before changing anything visible:
- `PRODUCT.md`: users, purpose, constraints, the **interface copy rule** and the **GDPR rules**. Binding.
- `DESIGN.md` (+ `.impeccable/design.json`): the visual system. Binding.
- `.impeccable/surfaces/src-app-tsx.md`: the surface brief and direction contract (development-only; never copy it into shipped code).

## Commands

```sh
npm install
npm run dev        # Vite dev server, also serves POST /api/questions, /api/assess, /api/writing-assist
npm run build      # tsc -b && vite build
npm run lint       # oxlint
npm run capture    # screenshots of every main state into .impeccable/review/ (needs the dev server; see scripts/capture.mjs)
npm run deploy     # build and deploy to Cloudflare (Worker `plainly`, https://plainly.eliasmakela.fi)
```

Hosting: a Cloudflare Worker with static assets (`wrangler.jsonc`, `worker/index.ts`). The Worker serves `dist/` and runs first only for `/api/*`, reusing the functions in `server/`. Production deploys from `main` through Workers Builds (build `npm run build`, deploy `npx wrangler deploy`). API keys are Worker secrets (`npx wrangler secret put ANTHROPIC_API_KEY`, `GEMINI_API_KEY`); without them the routes return the fallbacks.

Optional: copy `.env.example` to `.env`. `ANTHROPIC_API_KEY` enables Claude application questions and scoring (default `claude-opus-5-5`, override `PLAINLY_AI_MODEL`); `GEMINI_API_KEY` enables Gemini writing help in text fields. Without keys, questions come from fixed templates, scores are a labelled fixed-rule estimate and writing help shows labelled demo suggestions. Gemini model override: `PLAINLY_WRITING_MODEL`.

Design check after UI edits: `~/.claude/skills/impeccable/scripts/impeccable detect --json src` should return `[]` (only present on machines with the Impeccable skill).

## Code map

| Path | What it is |
|---|---|
| `src/App.tsx`, `src/App.css` | Shell, step flow, review page, submitted page, answer ledger |
| `src/form/schema.ts` | **The form.** `SCREENS` (8 steps) and every field. Edit here to add or change a question |
| `src/form/logic.ts` | Answered / undecided checks, display text, ledger summaries, "You'd fit if" rules |
| `src/form/fields.tsx`, `fields.css` | Field components: chips, "Not decided yet" chip, text, stepper, scale, salary, skill sorter |
| `src/form/RolePreview.*` | The attendee-facing role page shown on the review step |
| `src/form/RoleCard.*` | The role card on the submitted page |
| `src/sky/scene.ts` | The night-sky hero (camera, focus, constellations). Settings in `SKY` |
| `src/sky/input.ts` | Which stars are lit or undecided, from the form state; deterministic role-answer fingerprint |
| `src/components/Sky.tsx` | React wrapper for the sky (resize, animation loop, reduced motion) |
| `src/Root.tsx` | Hash router: `#/apply`, `#/staff`, `#/outcomes`, `#/roles`; the company app is the default |
| `src/event/core.ts` | Shared by browser and server: types, the forbidden-topic filter, question-set and score validators (verbatim-quote checks), prompts, JSON schemas, fixed-rule fallbacks, `overallOf` |
| `src/event/brief.ts` | Builds the company brief (the role's own texts) from the form; the only input to question drafting |
| `src/event/store.ts` | Event state in localStorage (`plainly:event:v1`): listings, applications, assessments, decisions, slots; `useEvent()` hook, cross-tab sync |
| `src/event/api.ts` | Browser client for the AI endpoints with rules fallback and re-validation |
| `src/event/CompanyQuestions.tsx` | Company side: draft, review and publish application questions (submitted page) |
| `src/event/sample.ts`, `sampleApplicants.ts`, `sampleAssessments.ts`, `sampleBulk.ts` | Synthetic sample companies (from `src/seeker/sampleRoles.ts`) with hand-written question sets; 14 hand-written applicants with hand-written assessments; and 160 seeded, mostly weak generated applicants with low scores (`sampleBulk.ts`), so each role has 50–80 applicants and the good ones have to float to the top. Sample assessments are used until a pair is scored again |
| `src/apply/` | Applicant flow at `#/apply`, with its walkthrough answers in `demoAnswers.ts` |
| `src/staff/` | Staff review at `#/staff`: per-company ranking (top 10 shown, plus anything unscored or decided; "Show all" for the rest), per-score evidence strip, decisions, invitations |
| `src/outcomes/` | Follow-up concept demo at `#/outcomes`: `data.ts` (four seeded events, 3/6-month checks, banding, summary text, CSV), `Outcomes.tsx`, `outcomes.css` (simulated data only) |
| `src/components/SiteHeader.tsx` | Top bar for the applicant, staff and follow-up views; `NAV_LINKS` (in `src/components/nav.ts`) is the one main navigation, also rendered by the company page's top bar so labels and order match everywhere |
| `server/event-ai.ts` | `POST /api/questions` and `POST /api/assess` (Vite plugin locally, called by `worker/index.ts` in production); holds the Anthropic key server-side |
| `src/seeker/` | Sample role browser at `#/roles` (not in the main nav) |
| `src/writing-assistant/` | Field-level writing-help client, input sanitizer, prompt, schema and demo suggestions |
| `server/writing-assistant.ts` | Vite plugin for `POST /api/writing-assist`; holds the Gemini key server-side |
| `src/styles/tokens.css`, `base.css` | Design tokens and browser-surface styling |
| `scripts/capture.mjs` | Playwright screenshots with synthetic sample answers |

The **Play walkthrough** action (at the end of the progress row) fills the company flow with synthetic answers and advances through all eight steps to review. The same action on `#/apply` (on the intro screen next to Start application, then in the progress row) (`src/apply/demoAnswers.ts`, cursor helper `src/components/demoCursor.ts`) picks the newest company-published role plus a sample role, types synthetic answers, e-mail and consent, and stops at the review. Any real click or key press stops either demo.

## How things fit together

- All state lives in the browser. `localStorage` keys: `plainly:role:v2` (`{ values, savedAt, seed }`, written on Submit role), `plainly:event:v1` (published listings, applications, assessments, decisions, slots) and `plainly:apply:mine` (the applicant's own application id). Sample listings and applicants come from code and are merged on read. There is no backend database, so the whole flow works in one browser (tabs stay in sync).
- **Pipeline**: company form → `briefFrom()` → `/api/questions` → `validateQuestionSet()` (every attribute must quote the brief verbatim) → company review → `publishListing()` (listing id `role-<seed>`). Applicant answers → staff view scores each (application, listing) pair via `/api/assess` → `validateScores()` (evidence must be a verbatim quote from the answers) → `saveAssessment()`. A stored assessment is stale when its `setKey` no longer matches the listing's questions; an application records the `setKey` it answered (`sets`), and staff do not score answers to an earlier version. A published role with the same company and title as a sample hides that sample. Evidence the topic filter catches is withheld (`withheld: true`): the attribute shows "Read the answers" and is left out of the overall score.
- **Adding a question**: add the field to a screen in `schema.ts`. Fields can be scoped to a role status with `onlyFor` / `excludeFor`; `fieldsFor()` keeps validation, progress and ledger summaries on the active path. If attendees should see it, render it in `RolePreview.tsx`; if it should affect fit, add a rule in `fitLists()`; add a fill step to `scripts/capture.mjs`. Required fields automatically get "Not decided yet" unless `noUndecided` or `optional` is set.
- **The sky maps stars to steps**: `LIGHT_AT`/`STAR_SCREEN` in `src/sky/scene.ts` assume 8 screens and 9 stars (two stars for step 2). Changing the number of screens means updating that mapping and the constellation figures.
- The three status constellations (`FIGURES` in `src/sky/scene.ts`) are sparse stick figures like real star patterns: a standing figure (open now), a dipper (opening soon) and a long cross (talent pipeline), each with at most one small closed shape. The fingerprint adds bounded tilt, proportion and per-star wobble; `crossing()` shrinks the wobble until no lines cross. Thumbnails fit the whole figure and draw finer stars when small.
- Lines join the constellation only when every step is complete (review and submitted pages). A step with any "Not decided yet" answer keeps a dim star and dashed lines.
- The noise field seed is new per role and saved. At review and submission, the constellation shape uses a deterministic fingerprint of the active role answers; company-wide answers are excluded. The bounded geometry preserves the clean status-specific figures, and the camera path is random each time.

## Rules that are easy to break

- **Copy**: UI text is generic product copy that holds for any company. No commentary on the user's particular answers, except AI-generated questions, attributes, scores and rationales, which are labelled as AI-drafted wherever they appear. "Not decided yet" is the one wording for honest gaps.
- **GDPR / non-discrimination**: attributes and questions only from the company's job texts, each attribute quoting them; never special categories, age, gender, family, nationality or other protected grounds in questions, attributes, scores, rationales or evidence; no names or contact details sent to a model (the scoring request carries one listing's questions and one applicant's scrubbed answers, never the e-mail or code); e-mails appear only in the staff invitation list; scores are decision support and staff decide every invitation by hand. `touchesForbidden` and the validators in `src/event/core.ts` enforce this; keep them in the path for both AI and rules output, on both server and browser.
- **Follow-up** (`#/outcomes`) is a concept demo of a LinkedIn profile check: simulated, deterministic numbers only. Nothing is looked up or collected. Every count of 1–2 (attendee, company hires, reports) is shown as "1–2"; 0 and 3 or more stay exact, and a banded figure must not be recomputable from exact ones.
- **Visual**: lichen `#e4cb3a` is the only bright colour (lit stars, lines, selection, changed state). Dashed means "not yet". Flat ink, 2px corners, 8px module, Familjen Grotesk display at the fixed steps in `tokens.css`, Schibsted Grotesk UI. Blur exists only in the sky. No new fonts, icons from emoji, gradients or shadows.
- Sample companies, applicants and follow-up figures are synthetic. The UI deliberately carries no "sample", "demo" or "simulated" tags or banners (the product owner finds them clutter); keep it that way, and never present synthetic outcomes as real in docs or pitch.

## Prototypes (not shipped)

`.impeccable/mocks/` holds design history: `decision/` (the original direction round), `hero-concepts.html`, `hero-lab.html` (an interactive sandbox for tuning the sky), `hero-mock.html` (the clickable mock the sky was built from). Open them directly in a browser.

## Known gaps

- Persistence beyond one browser: event data is in localStorage, so the company, applicant and staff views share data only within one browser. The AI endpoints run in `vite dev`/`vite preview` and in the Cloudflare Worker; a plain static deploy would fall back to fixed rules in the browser. The deployed API routes have no rate limiting yet.
- Invitations are recorded, not sent; there is no staff authentication.
- Finnish and Swedish copy.
- The keyword-based topic filter is deliberately broad and can drop a legitimate question or evidence quote.
- The fixed-rule score is a rough estimate (answer length and overlap with the company's wording); real ranking needs the AI key.
