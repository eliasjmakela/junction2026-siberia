# Plainly

*Just say it plainly.* A Junction 2026 project for the City of Espoo challenge: helping companies and talent find each other at Espoo recruitment events when job ads, CVs and screening are increasingly AI-generated.

Typical job fairs are aimless. Plainly asks the company to describe each role plainly before the event: whether it is open now, expected to open within three months or a talent pipeline, what the first month looks like, one recent problem the person would help solve, must-have versus teachable skills, language, location and relocation terms. Honest gaps are allowed ("Not decided yet"). From the answers it builds:

- **a role page** attendees can scan in seconds, with "You'd fit if" and "Probably not for you if" lists;
- **a role card**: the role and its constellation on one card;
- **application questions**: AI reads the company's own answers, picks out the attributes the role needs (each quoting the company's words) and drafts a few open questions about them; the company reviews and publishes them to the event.

Job seekers then **apply to the event** by picking at most three companies and answering their questions. AI scores each answer set 0–10 per attribute, with a verbatim quote from the answer as evidence, and **City of Espoo staff** rank applicants within each company's pool and decide whom to invite. A **follow-up** concept demo shows, on simulated data, how the city could estimate 3 and 6 months later whether attendees got work at the companies they applied to meet.

While the company answers, the left panel's night sky zooms in on the role's constellation, one star per completed step, and joins the stars once the profile is complete.
At review, the constellation's bounded shape variation is derived from that role's answers, so the same role gets the same figure.

## Run it

```sh
npm install
npm run dev
```

Open the printed URL. The company form is at `/`, applying at `#/apply`, staff review at `#/staff` and the follow-up demo at `#/outcomes`. Five synthetic sample companies and their sample applicants are always present; everything you add is kept in this browser's storage and shared between its tabs.

Use **Play walkthrough** (next to the step counter) to watch a synthetic role fill through the questionnaire and arrive at its review page. The applicant flow at `#/apply` has the same walkthrough.

To have questions drafted and answers scored by Claude, copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY` (default model `claude-opus-5-5`, override with `PLAINLY_AI_MODEL`). Without a key, questions come from fixed templates and scores are a labelled fixed-rule estimate.

The company form also offers field-level writing help. Without `GEMINI_API_KEY`, it shows labelled demo suggestions; with a key, Gemini drafts a concise rewrite and role-focused follow-up questions. Suggested wording is applied only when the company chooses it.

Other scripts: `npm run build`, `npm run lint`, `npm run capture` (screenshots of every main state; see `scripts/capture.mjs`).

## Project docs

- `PRODUCT.md`: product context, constraints, copy and GDPR rules
- `DESIGN.md`: the design system
- `CLAUDE.md`: code map and conventions for anyone (human or agent) picking this up

Built with React 19, TypeScript and Vite. All sample companies, roles and answers are synthetic.
