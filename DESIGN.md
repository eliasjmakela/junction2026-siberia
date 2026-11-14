---
name: Plainly
description: Role profiles for companies attending City of Espoo recruitment events, inked as a Finnish modernist poster under a northern night sky.
colors:
  spruce: "#173a30"
  spruce-raised: "#21483c"
  spruce-deep: "#102a23"
  lichen: "#e4cb3a"
  granite: "#d6d9d5"
  granite-line: "#c4c8c3"
  granite-light: "#f0f2ef"
  white: "#ffffff"
  ink: "#121614"
  ink-soft: "#464b47"
  rowan: "#b8361f"
  on-spruce: "#eef0ec"
  on-spruce-soft: "#b4c2bb"
typography:
  display-xl:
    fontFamily: "Familjen Grotesk, Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "2.875rem"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.025em"
  display-xl-compact:
    fontFamily: "Familjen Grotesk, Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  display-l:
    fontFamily: "Familjen Grotesk, Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  display-l-compact:
    fontFamily: "Familjen Grotesk, Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  display-m:
    fontFamily: "Familjen Grotesk, Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  body-l:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 500
    lineHeight: 1.3
  body:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  small:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.08em"
  micro:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.08em"
rounded:
  radius: "2px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "16px"
  s-4: "24px"
  s-5: "32px"
  s-6: "40px"
  s-7: "48px"
  s-8: "56px"
  s-9: "64px"
components:
  button-primary:
    backgroundColor: "{colors.spruce}"
    textColor: "{colors.on-spruce}"
    rounded: "{rounded.radius}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.spruce-raised}"
  button-primary-active:
    backgroundColor: "{colors.spruce-deep}"
  button-primary-disabled:
    backgroundColor: "{colors.granite-light}"
    textColor: "{colors.ink-soft}"
  button-quiet:
    textColor: "{colors.ink-soft}"
    padding: "0 8px"
    height: "48px"
  button-chip:
    backgroundColor: "{colors.spruce}"
    textColor: "{colors.on-spruce}"
    typography: "{typography.small}"
    rounded: "{rounded.radius}"
    padding: "0 16px"
    height: "48px"
  chip:
    backgroundColor: "{colors.granite-light}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.radius}"
    padding: "0 16px 0 14px"
    height: "44px"
  chip-hover:
    backgroundColor: "{colors.white}"
  chip-selected:
    backgroundColor: "{colors.white}"
  chip-undecided:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.radius}"
    height: "44px"
  text-input:
    backgroundColor: "{colors.granite-light}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.radius}"
    padding: "12px 16px"
    height: "48px"
  text-input-focus:
    backgroundColor: "{colors.white}"
  scale-step:
    backgroundColor: "{colors.granite-light}"
    rounded: "{rounded.radius}"
    height: "40px"
  scale-step-selected:
    backgroundColor: "{colors.spruce}"
  event-chip:
    backgroundColor: "{colors.granite-light}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.radius}"
    padding: "8px 12px"
  changed-tag:
    backgroundColor: "{colors.lichen}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "1px 6px"
  gap-tag:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.small}"
    rounded: "{rounded.radius}"
    padding: "0 6px"
  ai-source-tag:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.small}"
    rounded: "{rounded.radius}"
    padding: "0 6px"
  preview-sheet:
    backgroundColor: "{colors.granite-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "40px 40px 32px"
  role-card:
    backgroundColor: "{colors.spruce}"
    textColor: "{colors.on-spruce}"
    rounded: "{rounded.radius}"
    padding: "24px 24px 32px"
    width: "400px"
  qc-panel:
    backgroundColor: "{colors.granite-light}"
    rounded: "{rounded.radius}"
    padding: "24px"
---

# Design System: Plainly

## Overview

**Creative North Star: "The Cut Poster"**

Plainly is a 1960s–70s Finnish modernist poster inked in Espoo landscape colour, with a northern night sky as its hero. A deep spruce field owns one whole region of the shell and is the night: a full-bleed sky in which the role's constellation is brought out of the noise, answer by answer, with a plain-text caption at its foot. The work happens on cool granite beside it. One bright ink, sulphur lichen, is reserved for the things that matter right now: the picked stars and their lines, the role's status, the selected answer, what just changed. Everything else is ink on stone.

The world is flat ink everywhere except the sky's soft focus. No gradients, no drop shadows, 2px corners, one 8px module for shape, type and layout. One display face appears at fixed steps, set bold and tight. Density is calm and operational: a step title, a few fields built from chips, inputs and steppers, a primary action, and a ledger of answers that restyles rows in place.

The signature is the night sky. Each completed step moves the camera, unevenly, toward the role's constellation, pulls the focus and picks one more star out of the noise; only when the profile is complete do lichen lines connect the picked stars into a legible figure. Its motion is the one authored moment; every other transition is a short state change.

**Key Characteristics:**
- Total palette commitment: spruce field, granite ground, lichen as the only bright ink, rowan for errors only.
- Flat ink, 2px corners, no shadows or gradients; softness and glow live only inside the sky.
- One 8px module (4px half-step) for spacing, shape geometry and type rhythm.
- One display face (Familjen Grotesk 700) at fixed steps; Schibsted Grotesk for the interface.
- One authored motion moment: the night sky's camera move, focus pull and constellation draw.
- Dashed means not yet: "Not decided yet" answers, honest gaps and unanswered results are dashed everywhere, sky included.

## Colors

Two grounds, one bright ink, one warning colour: a landscape palette committed to in full.

### Primary
- **Spruce Field** (spruce): the night. The shell's left region at full height, the role card, the small constellation tiles on applicant picker cards, the primary button and skill-bucket buttons, the selected scale step, selected-chip borders, done progress segments, the active tab underline, heavy rules over the privacy note and "fit" list, and the focus ring on granite. It is a ground, not an accent.
- **Raised Spruce** (spruce-raised): hover on spruce surfaces and the scrollbar thumb.
- **Deep Spruce** (spruce-deep): pressed state on spruce.

### Secondary
- **Sulphur Lichen** (lichen): the only bright ink. Picked stars, their halo and the constellation lines; the wordmark; the status label in the field caption and on the role card; the selected chip mark; the current progress segment; the 6px bar inside a selected scale step; "fit" and "matches" marks; the "changed" tag; text selection; the primary-button arrow; and the focus ring on spruce.

### Tertiary
- **Rowan** (rowan): errors only (5.0:1 on granite): error text, invalid field borders, the hover colour of a skill tag's remove control. Never decorative.

### Neutral
- **Granite** (granite): the work ground and page background; stepper button hover.
- **Granite Line** (granite-line): 1px rules, empty progress and budget segments, dashed "not yet" edges, hover borders, the "not for you" list rule.
- **Light Granite** (granite-light): chips, inputs, steppers, scale steps, the event chip, the current ledger row, the review sheet and the quick-check panel.
- **White** (white): selected and hovered chips, focused inputs, skill tags. Paper shows through only where the user has acted.
- **Ink** (ink): primary text on granite.
- **Soft Ink** (ink-soft): secondary text on granite: hints, leads, ledger questions, meta, unselected marks (7.1:1 on granite).
- **On Spruce** (on-spruce) / **Soft On Spruce** (on-spruce-soft): text and noise stars on the field; soft for the tagline, details line, empty-title placeholder and card meta (7.4:1 on spruce).

### Named Rules
**The One Bright Ink Rule.** Lichen marks the picked stars, the role's status, the selection and the change, and nothing else. If an element is not one of those things, it is not lichen.

**The Rowan Is Alarm Rule.** Rowan appears only on errors. It never marks emphasis, a brand moment or a destructive-looking button.

**The Field Owns a Region Rule.** Spruce is applied as a whole region: the field, the role card and the picker's constellation tiles (miniatures of the field carrying their own sky) and solid actions. Never as a thin tint or a generic card background on granite.

## Typography

**Display Font:** Familjen Grotesk (with Schibsted Grotesk, system-ui)
**Body Font:** Schibsted Grotesk (with system-ui)

**Character:** A compact, slightly quirky grotesk set bold and tight for poster headlines, against a plain, sturdy grotesk for everything operational. Both are self-hosted (weights 500/700 display; 400/500/600 UI).

### Hierarchy
- **Display XL** (700, 46px, 1.06, -0.025em): the role title in the field caption, step titles, the review and submitted headings, the applicant, staff and follow-up page headings. Max about 19em.
- **Display XL compact** (700, 30px, 1.1): step, submitted and site-page headings at 900px and below.
- **Display L** (700, 34px, 1.1, -0.02em): the empty-title placeholder in the caption (in soft on-spruce), the role card title, the review sheet title.
- **Display L compact** (700, 22px, 1.1): in-page section headings (the "fit" lists, the quick-check title) and the caption and side-panel titles in the phone band.
- **Display M** (700, 28px, 1, -0.02em): the wordmark, in lichen on spruce and spruce on granite.
- **Body L** (500, 17px, 1.3): field labels and sentence leads (600), the caption details line, the role purpose, quick-check questions, stepper values.
- **Body** (400, 16px, 1.5): hints (max 62ch), inputs, chips (500), buttons (600).
- **Small** (14px): ledger, progress and budget counts (tabular numerals), status and error lines, field hints, meta and notes.
- **Label** (600, 13px, 0.08em, uppercase): the field-caption status, section headings (ledger, skill buckets, review sections, "What next", "Before you decide"). Definition terms and card meta use 13px without tracking or case change. The "changed" tag is 13px/600.
- **Micro** (600, 11px, 0.08em, uppercase): status suffixes such as "soon" and "Optional".

### Named Rules
**The Fixed Steps Rule.** Display type uses only the named steps (XL, L, M and the two compact steps). No fluid clamp scaling; headings switch to compact steps once, at the 900px breakpoint.

**The One Display Face Rule.** Familjen Grotesk is the only display face. Emphasis inside display type is colour, never italic.

**The Labels Carry Data Rule.** Tracked uppercase labels name a section or show a real value (the role's status, the company). They are never invented category kickers above a heading.

## Layout

**Company shell.** Two regions. The spruce field is a fixed-width left column (560px) that stays sticky at full viewport height while the granite work area scrolls; the field colour is painted the full page height behind it. The sky fills the whole field. The wordmark and tagline sit at the top (24px down, 48px in); the caption sits at the bottom (40px up, 48px in): status, role title, details line.

The work area runs top to bottom: section tabs and the sample-event chip, progress segments with "Step n of 8", the step title, hint, error line, fields, actions, a status line, and the ledger pushed to the foot with auto margin. Content widths cap at 800px (step), 880px (ledger, review sheet, submitted page, application questions) and 720px (inputs).

**Site pages.** The applicant (`#/apply`), staff review (`#/staff`) and follow-up (`#/outcomes`) views share one granite page with a top bar: the spruce wordmark, text tabs with the spruce underline for the current page, and the sample-event chip. Spruce appears as whole regions only: the small constellation tile on each company card in the applicant picker, primary actions and heavy rules. On phones the links form one scrolling row, as on the company page.

Spacing is an 8px module with a 4px half-step (s-1 to s-9, 4–64px). Fields stack 32px apart; chip sets wrap with 8px gaps. Status and error lines reserve their height so the layout never jumps.

**Breakpoints:**
- **1360px and below:** company field narrows to 440px; caption and brand insets 32px, work padding 40px.
- **1120px and below:** event chip hidden; submitted page stacks the role card over the next steps.
- **900px and below:** the company field becomes a 240px band (brand and caption inset 16px; title at Display L compact, empty placeholder at Body L, details at Small) with the constellation small on the right. Tabs scroll horizontally inside their row; skill buckets, fit lists and preview grids go single column; primary actions stretch; ledger rows stack into a number / question-over-answer / edit grid.

## Elevation & Depth

Flat. There are no drop shadows and no gradients in the interface. Depth comes from tonal layering only: spruce field beside granite ground, light granite chips and sheets on granite, white where the user has acted. The `box-shadow` uses in the build are flat ink strokes, not elevation: the 3px inset underline on the active tab, the 6px lichen inset bar in a selected scale step, and the 4px inset top rule on the "fit" lists.

The only depth effects anywhere live inside the night sky: star softness, depth-of-field, parallax and a faint lichen halo around picked stars. They are drawn as flat SVG circles whose radius and opacity change; no CSS or SVG blur filter exists in the build.

### Named Rules
**The Flat Ink Rule.** Surfaces never lift. State is shown by changing ink (background, border colour, border style), never by shadow or blur. Inset strokes that draw a line in solid ink are allowed; cast shadows are not. The single exception is the night sky: its focus, depth and halo carry meaning (how far the role has come into focus) and resolve as the profile completes. Blur, glow and softness exist only in the sky.

**The Heavy Rule.** A 4px spruce rule heads a block the reader must take in: the privacy note and the "You'd fit if" list (the "not for you" list takes a granite-line rule of the same weight). Ordinary sections take the 1px granite-line rule.

## Shapes

Near-square: one radius (2px) on buttons, chips, inputs, steppers, scale steps, sheets, cards and tags; progress and budget segments are square. Radio marks in chips are the only circles; checkbox marks are square. Borders are 2px for interactive edges and selected marks, 1px for rules and small tags. List markers are small solid squares (8px in fit and privacy lists, 12px outlined result marks), drawn in CSS.

**Dashed means not yet.** The "Not decided yet" chip and its mark, a disabled input, stepper or salary field left undecided, the gap tag in the review sheet and role card, the "role has changed" notice, an unanswered result mark, and in the sky an undecided star's lines. Solid edges arrive once something is decided.

Icons are filled inline SVG on a 16-unit grid: the primary arrow, the stepper minus and plus, the skill-tag move and remove controls. Never glyphs.

## Components

### Buttons
Solid, square-cornered, confident.
- **Shape:** 2px radius, 48px tall, 24px horizontal padding, weight 600.
- **Primary:** spruce fill, on-spruce text, a 16px filled lichen arrow after the label. Disabled: light granite with soft-ink text.
- **Hover / Active:** raised spruce on hover with the arrow nudging 3px right (220ms); deep spruce when pressed.
- **Quiet:** text-only in soft ink, 48px tall, underline fading in on hover (120ms) and text darkening to ink; disabled at 45% opacity. Inline text actions (ledger "Change", quick-check "Remove") use the same pattern in spruce, Small, 600.
- **Bucket button:** spruce, 48px, Small/600, 16px padding: the "Must-have / Can learn / Nice to have" adders in the skill sorter.
- **Focus:** 3px spruce outline, 2px offset.

### Chips
Light granite choices that turn to paper when chosen; the form's answer primitive.
- **Rest:** light granite, 2px transparent border, 44px min height, 16px/500, a 14px mark ring in soft ink (circle for single choice, square for multiple).
- **Hover:** white with a granite-line border.
- **Selected:** white chip, spruce border; the mark fills lichen inside a spruce ring.
- **Not decided yet:** transparent with a 2px dashed granite-line border, soft-ink text, dashed square mark; stays dashed when pressed, text darkens to ink. Choosing it disables and dashes the field it belongs to.
- **Focus:** the whole chip takes the 3px spruce outline.

### Inputs / Fields
- **Field frame:** a label in Body L/600 (an "Optional" micro tag beside it when optional), a Small hint, then the control 12px below. Text fields with a sentence lead show the lead as the label, ending in "…" or ":" so the answer completes the sentence ("A normal Tuesday looks like …").
- **Text input / textarea:** light granite, 2px transparent border, 48px tall (textarea 80px, vertical resize), placeholder in soft ink. Hover: granite-line border. Focus: white with a spruce border, no outline. Disabled: transparent with a dashed granite-line border.
- **Number stepper:** a 48px light-granite bar with 48px minus/plus buttons (spruce SVG, granite on hover) around a 56px tabular Body L/600 value. Focus within: white with spruce border. Undecided: dashed.
- **Five-step scale:** two end labels in Small soft ink around five 40px light-granite steps (4px gaps). Selected: solid spruce with a 6px lichen inset bar along the bottom.
- **Salary range:** two money boxes ("€" prefix, 96px tabular input) joined by "to"; same rest/focus/undecided treatment as the stepper.
- **Skill sorter:** a text input with three bucket buttons, then three ruled columns (label headings) of skill tags: white, 2px spruce border, Small/600, with a move control (a select laid over a 16-grid icon) that moves the tag to another bucket in place, and a remove control that turns rowan on hover.
- **Error:** rowan Small/600 under the field; the control border turns rowan.

### Navigation
Section tabs at 16px/500 in soft ink with 32px gaps. The current tab is ink with a 3px spruce underline. Unavailable tabs stay in place with a micro "soon" label and a default cursor.

### Progress
One 32px × 6px segment per step with 4px gaps (24px wide on phones): spruce when done, lichen for the current step, granite-line when ahead. A Small count sits beside it.

### Chips and tags
- **Event chip:** light granite, 13px soft-ink text with the event name in 600 ink and the date, 8px/12px padding.
- **Changed tag:** lichen with 13px/600 ink text, 1px/6px padding, under an edited ledger answer. It is the change state.
- **Gap tag:** 1px dashed soft-ink outline (soft on-spruce on the role card), Small/500, for "Not decided yet" and "Not answered" values.
- **AI source tag:** 1px solid spruce outline around a bold "Generated by AI", Small, in the quick-check meta line.

### Ledger
A fixed-column table (number, question, answer, edit) in Small with 1px granite-line rules between rows. Questions are soft ink, answers 600 ink (clamped to two lines), the edit action a spruce text button. The current row tints light granite. Rows restyle in place as answers change; nothing animates in or out. Below 900px rows stack into a grid.

### Review sheet
The attendee-facing role page shown on the review screen: a light granite sheet (2px radius), Display L title, a Small/600 byline with the status in spruce text and the company, the purpose in Body L with its sentence lead in soft ink, a three-column ruled facts grid (13px soft-ink terms, 600 values), then two "fit" lists side by side: "You'd fit if" under a 4px spruce rule with lichen squares in spruce borders, "Probably not for you if" under a 4px granite-line rule with outlined soft-ink squares. Further sections take label headings. Gaps show as gap tags.

### Role card
A 400px spruce card on the submitted page: lichen wordmark and the event in 13px soft on-spruce at top, a 4:3 bleed of the complete static sky, the role title in Display L, status in lichen and company in Small/600, a two-column facts grid under a faint rule (`--rule-on-spruce`) and the must-have skills. Next to it, a top-ruled column with a label heading, the primary "Submit another role" action, a Small note and a quiet "View or edit this role" action.

### Application questions (company)
A top-ruled section on the submitted page: Display L compact title, lede, then a light granite panel holding the draft. A Small meta line shows the producer (outlined "AI-drafted · model" tag, "Drafted from your answers · fixed templates", or spruce "Published"). "What applicants are scored on" lists the attributes as white tiles in a two-column grid: Body L/600 name, Small soft-ink "strong answers show", and each source quote under a 2px spruce left rule with its micro label (the company field it quotes). Questions are numbered rows with 1px rules: Body L/500 question, Small "Shows:" line, a spruce "Remove" text action. A dashed notice appears when the role has changed since publishing. A Small soft-ink privacy paragraph closes the section.

### Applicant flow
Progress segments as in the company form, Display XL step headings. The picker is a grid of company cards: status, title, company, purpose, and a footer with the question count and a small 48px spruce tile carrying the role's complete constellation below; a chosen card takes the white fill, spruce border and lichen mark of a chosen chip. Answers are textareas with a character counter. A privacy block under the heavy spruce rule comes before anything the applicant answers.

### Staff review
A "Before you decide" block under the heavy spruce rule, company-role tiles with counts (the chosen one with a spruce border), then the ranked table: rank, application code with an "Answers" toggle, overall score in display numerals, one score cell per attribute and Invite / Waitlist / Decline chips on one line. Each score cell is a button (0–10 spruce bar, the number, a quote glyph; dashed track when there is no evidence). Selecting it opens one white evidence strip under the row, joined to the active cell like a tab to its panel: applicant, position and score, the rubric, the question and answer with the evidence underlined in lichen, the producer tag and rationale, and the company's own words. Arrow keys step cells (the strip follows), Escape closes. Opening a strip never changes row heights or column widths. A labelled rule marks the event-slot reference line. The table shows the top 10 (plus anything unscored or already decided) with a Small line "Top 10 of n applicants…" and a quiet "Show all n" action under it. Below 1024px rows become stacked cards and the strip opens inside the tapped attribute.

### Follow-up
An event select and 3/6-month checkpoint chips sit above a status line (done, running or scheduled) with Copy summary and Download CSV. Then numbered, top-ruled sections: attendees (a tile with the share and range, four facts, one stacked bar where only "At a company they met" is lichen, "Profile not matched" is dashed, with counts in the legend), the LinkedIn profile check (four numbered steps, six agent lanes with dashed unfinished parts, cross-checks), companies (table with follow-up tags and a Details disclosure; counts of 1–2 are banded; stacked cards below 720px), across events, a report summary in a white panel and three small deployment lines. Unknown or pending values are dashed pills, never colour alone.

Bottom-left on the field, in a polite live region: the status (Label, lichen, uppercase; "No status yet" before one is chosen), the role title (Display XL; when empty a generic placeholder at Display L in soft on-spruce), and a details line (Body L, soft on-spruce). In the 240px phone band: title at Display L compact, placeholder at Body L, details at Small, 16px insets.

### Copy and voice
Interface copy is generic, practically built product text that holds for any company and any answer: "No answers yet", "Step 4 of 8", "Not decided yet", "Not answered". Labels, buttons, empty states, errors and status lines never comment on the user's particular choices. Summaries assembled from answers are plain templates with slots (the caption, ledger summaries, the role page, "Matches n of m requirements"). Frank, characterful language belongs where a team authors it once: step titles, sentence leads and help text. The exceptions are AI-drafted attributes, questions, scores and rationales: they are always labelled as AI-drafted wherever they appear (an outlined source tag for the company and staff, a note for the applicant), and everything around them stays fixed copy. Copy describes the product on its own terms and never carries contrasts with alternatives or traces of how it was designed.

## Do's and Don'ts

### Do:
- **Do** keep lichen to picked stars and lines, the role's status, selection, the changed state and focus on spruce (The One Bright Ink Rule).
- **Do** use the 2px radius and the 8px module (4px half-step) for every new component.
- **Do** show state through ink: white fill and spruce border for chosen, dashed edges for not yet, solid edges once decided.
- **Do** carry "Not decided yet" through every view: dashed chip, dashed field, gap tag, dim star with dashed lines.
- **Do** switch the focus ring to lichen on any spruce surface, spruce on granite.
- **Do** reserve height for status, error and caption text so nothing jumps.
- **Do** draw icons as filled inline SVG on the 16-unit grid.
- **Do** label AI-generated content as AI-drafted wherever it appears, show the evidence next to every score, and put a privacy note before anything applicants answer.
- **Do** write labels, empty states and errors as generic templates; put characterful language in step titles, sentence leads and static help text.

### Don't:
- **Don't** add drop shadows, glows, blur or gradients outside the night sky; interface depth is tonal only (The Flat Ink Rule).
- **Don't** draw constellation lines before the profile is complete, or show the status as anything but text outside the sky.
- **Don't** use rowan for anything but errors.
- **Don't** add a second display face, italic emphasis, or fluid display sizes between the fixed steps.
- **Don't** add motion beyond short state transitions (120ms / 220ms); the night sky is the one authored moment.
- **Don't** put invented uppercase kickers above headings; tracked labels carry section names or real values.
- **Don't** write UI copy that reacts to the user's specific answers, or that explains what the product is not.
- **Don't** add "sample", "demo" or "simulated" tags and banners: the demo context is understood, and they are clutter.
