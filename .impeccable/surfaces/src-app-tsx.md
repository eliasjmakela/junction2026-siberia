---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/styles"]
---

# Intent drill (company side)

Scope: the first working surface of Plainly, the drill that questions a company about what it wants from a City of Espoo recruitment event. Mode: Operate. Desktop-first (1440), full mobile support (390).

Audience and job: a company rep (HR, recruiter, hiring manager, founder) preparing for an Espoo recruitment event. Task: answer a short drill until the company's intent is one of three goals (be seen, hire for a specific need, hire in general) with specifics. Proof/content: sample event and sample answers only, labeled as sample.

Constraints: WCAG 2.2 AA; no invented outcomes or match numbers; tone frank but calm; avoid corporate HR SaaS, cute illustration, dark neon, flag blue-and-white.

Memorable moment: the intent shape coming into focus and being cut sharper with each answer.

Unresolved: what the drill outputs beyond the intent statement, Finnish/Swedish copy.

## Direction contract

THESIS: A company's vague wish to "be at the fair" is cut down, answer by answer, into one flat shape that says exactly what it wants. Refuses the stepper-over-a-white-card wizard every HR tool ships.

OWN-WORLD: 1960s–70s Finnish modernist poster inked in Espoo landscape colour. Spruce field #173A30 owns the left region of the shell; sulphur-lichen #E4CB3A is the only bright ink (shape, selection, changed state); cool granite #D6D9D5 work ground with lighter granite answer cells; ink #121614; rowan #B8361F for errors only. Flat ink, no gradients, no shadows, 2px corners. Familjen Grotesk bold display at fixed steps, Schibsted Grotesk UI. Everything on an 8px module.

STORY: The visitor sees their intent take shape while answering, understands the drill narrows rather than surveys, edits any answer from the ledger, and leaves with one clear intent statement for the event.

FIRST VIEWPORT: Desktop: 560px spruce field left (wordmark top, intent shape ~400×320 centre, intent sentence below, three-emblem legend at the foot). Work area right: nav + sample-event chip top, progress bars and "Question n of m", 46px display question, 2-column answer rows, own-words field, primary "Next question" in spruce with lichen arrow, ledger table at the foot. Mobile: field becomes a top band with a small shape and the sentence.

FORM: Finnish poster modernism, candidate 3 of the grounded list (assigned). seed:f21d75bf4f44a6a4. Raises: total palette commitment (zoo map), fixed-column ledger that restyles rows in place (split-flap), one 8px module for shape, type and layout (Crouwel), one display face at fixed steps (Emigre). Signature interaction: the intent shape morphs (48-point polygon interpolation, exponential ease-out) from blunt rectangle toward its goal emblem (circle = be seen, wedge = hire for a need, band = hire in general) as specificity grows, and pulls from blurry to sharp focus at the same time (user direction: the company's need starts fuzzy and gets clarified).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
