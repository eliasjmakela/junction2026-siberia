# Plainly

*Just say it plainly.* A Junction 2026 project for the City of Espoo challenge: helping companies and talent find each other at Espoo recruitment events when job ads, CVs and screening are increasingly AI-generated.

Typical job fairs are aimless. Plainly asks the company to describe each role plainly before the event: whether it is open now, expected to open within three months or a talent pipeline, what the first month looks like, one recent problem the person would help solve, must-have versus teachable skills, language, location and relocation terms. Honest gaps are allowed ("Not decided yet"). From the answers it builds:

- **a role page** attendees can scan in seconds, with "You'd fit if" and "Probably not for you if" lists;
- **a role card**: the role and its constellation on one card;
- **a 60-second quick check** for attendees: yes/no and number questions drafted by AI from the role, reviewed by the company, answered privately by attendees as a self-check (GDPR-compliant by design: no personal data leaves the attendee's device).

While the company answers, the left panel's night sky zooms in on the role's constellation, one star per completed step, and joins the stars once the profile is complete.
At review, the constellation's bounded shape variation is derived from that role's answers, so the same role gets the same figure.

## Run it

```sh
npm install
npm run dev
```

Open the printed URL. The sample attendee role list lives at `#/roles`; the quick check lives at `#/check` after a company has published one in the same browser.

Use **Play sample demo** in the top bar to watch a synthetic role fill through the questionnaire and arrive at its attendee-facing review page.

To have the quick check drafted by Claude, copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. Without a key it is built from the answers with fixed rules.

The company form also offers field-level writing help. Without `GEMINI_API_KEY`, it shows labelled demo suggestions; with a key, Gemini drafts a concise rewrite and role-focused follow-up questions. Suggested wording is applied only when the company chooses it.

Other scripts: `npm run build`, `npm run lint`, `npm run capture` (screenshots of every main state; see `scripts/capture.mjs`).

## Project docs

- `PRODUCT.md`: product context, constraints, copy and GDPR rules
- `DESIGN.md`: the design system
- `CLAUDE.md`: code map and conventions for anyone (human or agent) picking this up

Built with React 19, TypeScript and Vite. All sample companies, roles and answers are synthetic.
