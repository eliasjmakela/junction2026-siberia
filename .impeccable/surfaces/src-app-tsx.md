---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/styles"]
---

# Company role form (company side)

Scope: the main surface of Plainly: a company describes one role for a City of Espoo recruitment event in eight short steps, reviews the attendee-facing role page, submits it, and can publish an AI-generated 60-second quick check for attendees (#/check). Mode: Operate. Desktop-first (1440), full mobile support (390).

Audience and job: a company rep (HR, recruiter, hiring manager, founder) preparing for an Espoo recruitment event. Task: describe the role plainly (status, the work, team, skills, language, location, company) within 10 minutes, with "Not decided yet" allowed. Proof/content: sample event and sample answers only, labeled as sample.

Constraints: WCAG 2.2 AA; no invented outcomes or match numbers; tone frank but calm; avoid corporate HR SaaS, cute illustration, dark neon, flag blue-and-white; GDPR and non-discrimination for anything shown to attendees.

Memorable moment: the night sky. Each completed step zooms the camera toward the role's constellation and picks one more star out of the noise; when the profile is complete, lines connect the stars into the role's constellation.

Unresolved: Finnish/Swedish copy, the event page listing all roles, matching attendees to roles.

## Direction contract

THESIS: A role starts as noise in a sky full of AI-sameness and is brought into focus, answer by answer, until it is one legible constellation. Refuses the stepper-over-a-white-card wizard every HR tool ships.

OWN-WORLD: 1960s–70s Finnish modernist poster inked in Espoo landscape colour, with a northern night sky as the hero. Spruce #173A30 owns the left region of the shell and is the night; sulphur-lichen #E4CB3A is the only bright ink (picked stars, constellation lines, selection, changed state); cool granite #D6D9D5 work ground with lighter granite cells; ink #121614; rowan #B8361F for errors only. Flat ink everywhere except the sky's soft focus. Familjen Grotesk bold display at fixed steps, Schibsted Grotesk UI. 8px module, 2px corners.

STORY: The visitor sees the role come into focus while answering, understands each step adds one concrete fact, can leave honest gaps ("Not decided yet", shown dim and dashed), reviews the role page attendees will see, and leaves with a submitted role, its role card and an optional quick check for attendees.

FIRST VIEWPORT: Desktop: 560px full-bleed night sky on the left (wordmark top left; caption bottom left: status in small lichen capitals, role title at 46px, key details). Work area right: tabs + sample-event chip, progress segments and "Step n of 8", 46px screen title, fields with answer chips and dashed "Not decided yet" chips, spruce Next with lichen arrow, ledger of answers at the foot. Mobile: the sky becomes a 240px band with the constellation small on the right.

FORM: Finnish poster modernism, candidate 3 of the grounded list (assigned), with the hero replaced at the user's direction by the night sky. seed:f21d75bf4f44a6a4. Raises kept: total palette commitment, fixed-column ledger, one 8px module, one display face at fixed steps. Signature interaction (src/sky/scene.ts): uneven zoom, wandering pan and swinging rotation that settle, heavy parallax, subtle focus pull and twinkle, one star picked per completed step, constellation lines drawn in sequence only when the profile is complete.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
