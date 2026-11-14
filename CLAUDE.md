# Plainly: notes for agents

Plainly is a Junction 2026 hackathon app for the City of Espoo challenge (recruitment events in an age of AI-written job material). A company describes one role plainly in eight short steps, reviews the role page attendees will see, submits it, and can publish a 60-second AI-drafted quick check that attendees answer as a self-check.

Read these before changing anything visible:
- `PRODUCT.md`: users, purpose, constraints, the **interface copy rule** and the **GDPR rules**. Binding.
- `DESIGN.md` (+ `.impeccable/design.json`): the visual system. Binding.
- `.impeccable/surfaces/src-app-tsx.md`: the surface brief and direction contract (development-only; never copy it into shipped code).

## Commands

```sh
npm install
npm run dev        # Vite dev server, also serves POST /api/screening
npm run build      # tsc -b && vite build
npm run lint       # oxlint
npm run capture    # screenshots of every main state into .impeccable/review/ (needs the dev server; see scripts/capture.mjs)
```

Optional: copy `.env.example` to `.env`. `ANTHROPIC_API_KEY` enables Claude quick-check drafts; `GEMINI_API_KEY` enables Gemini writing help in text fields. Without either key, the app uses its labelled fixed demo suggestions. Model overrides are `PLAINLY_SCREENING_MODEL` and `PLAINLY_WRITING_MODEL`.

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
| `src/screening/` | Quick check: `core.ts` (shared types, validator, rules generator, prompt, scoring), `ScreeningReview.tsx` (company side), `SeekerCheck.tsx` (attendee side, `#/check`), `Root.tsx` (hash router) |
| `src/seeker/` | Sample attendee role browser at `#/roles`; five synthetic profiles use the generated role card and role page components |
| `server/screening.ts` | Vite plugin for `POST /api/screening`; holds the API key server-side |
| `src/writing-assistant/` | Field-level writing-help client, input sanitizer, prompt, schema and demo suggestions |
| `server/writing-assistant.ts` | Vite plugin for `POST /api/writing-assist`; holds the Gemini key server-side |
| `src/styles/tokens.css`, `base.css` | Design tokens and browser-surface styling |
| `scripts/capture.mjs` | Playwright screenshots with synthetic sample answers |

The top-bar **Play sample demo** action fills the company flow with clearly labelled synthetic answers and advances through all eight steps to review.

## How things fit together

- All state lives in the browser. `localStorage` keys: `plainly:role:v2` (`{ values, savedAt, seed }`, written on Submit role) and `plainly:screening:v1` (the published quick check). There is no backend database.
- **Adding a question**: add the field to a screen in `schema.ts`. Fields can be scoped to a role status with `onlyFor` / `excludeFor`; `fieldsFor()` keeps validation, progress and ledger summaries on the active path. If attendees should see it, render it in `RolePreview.tsx`; if it should affect fit, add a rule in `fitLists()`; add a fill step to `scripts/capture.mjs`. Required fields automatically get "Not decided yet" unless `noUndecided` or `optional` is set.
- **The sky maps stars to steps**: `LIGHT_AT`/`STAR_SCREEN` in `src/sky/scene.ts` assume 8 screens and 9 stars (two stars for step 2). Changing the number of screens means updating that mapping and the constellation figures.
- The three status constellations are closed outlines with a restrained internal connection. Keep the geometry bounded and line segments clear as the answer fingerprint varies it.
- Lines join the constellation only when every step is complete (review and submitted pages). A step with any "Not decided yet" answer keeps a dim star and dashed lines.
- The noise field seed is new per role and saved. At review and submission, the constellation shape uses a deterministic fingerprint of the active role answers; company-wide answers are excluded. The bounded geometry preserves the clean status-specific figures, and the camera path is random each time.
- `#/check` reads the published quick check and the submitted role from `localStorage`, so it only works in the same browser for now.

## Rules that are easy to break

- **Copy**: UI text is generic product copy that holds for any company. No commentary on the user's particular answers, except the AI-generated quick-check questions, which are labelled as such. "Not decided yet" is the one wording for honest gaps.
- **GDPR / non-discrimination** (quick check): only job requirements from the profile; never special categories, age, gender, family, nationality or other protected grounds; no names or contact details; attendee answers stay in React state and are never stored or sent; the result is a self-check, not a decision. The validator in `src/screening/core.ts` enforces this; keep it in the path for both AI and rules output.
- **Visual**: lichen `#e4cb3a` is the only bright colour (lit stars, lines, selection, changed state). Dashed means "not yet". Flat ink, 2px corners, 8px module, Familjen Grotesk display at the fixed steps in `tokens.css`, Schibsted Grotesk UI. Blur exists only in the sky. No new fonts, icons from emoji, gradients or shadows.
- Sample event and answers are synthetic and labelled "Sample". Never invent outcomes, customers or numbers.

## Prototypes (not shipped)

`.impeccable/mocks/` holds design history: `decision/` (the original direction round), `hero-concepts.html`, `hero-lab.html` (an interactive sandbox for tuning the sky), `hero-mock.html` (the clickable mock the sky was built from). Open them directly in a browser.

## Known gaps

- Live event role data and filters, and attendee-to-role matching; `#/roles` currently shows five synthetic sample profiles.
- Finnish and Swedish copy.
- Persistence beyond one browser; `/api/screening` exists only in `vite dev`/`vite preview` (a static deploy falls back to rules in the browser).
- The keyword-based topic filter is deliberately broad and can drop a legitimate skill question.
