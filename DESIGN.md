---
name: Plainly
description: Intent drill for companies attending City of Espoo recruitment events, inked as a Finnish modernist poster.
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
  display-l:
    fontFamily: "Familjen Grotesk, Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "2.125rem"
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
  display-xl-compact:
    fontFamily: "Familjen Grotesk, Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  display-l-compact:
    fontFamily: "Familjen Grotesk, Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
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
  button-quiet:
    textColor: "{colors.ink-soft}"
    padding: "0 8px"
    height: "48px"
  answer-cell:
    backgroundColor: "{colors.granite-light}"
    textColor: "{colors.ink}"
    typography: "{typography.body-l}"
    rounded: "{rounded.radius}"
    padding: "16px 20px"
    height: "56px"
  answer-cell-hover:
    backgroundColor: "{colors.white}"
  answer-cell-selected:
    backgroundColor: "{colors.white}"
  own-words-input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "12px 18px"
    height: "48px"
  own-words-input-filled:
    backgroundColor: "{colors.white}"
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
---

# Design System: Plainly

## Overview

**Creative North Star: "The Cut Poster"**

Plainly is a 1960s–70s Finnish modernist poster inked in Espoo landscape colour. A deep spruce field owns one whole region of the shell and carries the brand, the intent shape and the intent sentence; the work happens on cool granite beside it. One bright ink, sulphur lichen, is reserved for the things that matter right now: the shape, the selected answer, what just changed. Everything else is ink on stone.

The world is flat ink. No gradients, no drop shadows, 2px corners, one 8px module for shape, type and layout. One display face appears at fixed steps, set bold and tight. Density is calm and operational: a question, a set of answer cells, a primary action, and a ledger of answers that restyles rows in place.

The signature is the intent shape: a single lichen polygon on spruce that starts out of focus and is cut, answer by answer, from a blunt stock toward one of three emblems, coming into sharp focus as the intent becomes plain. Motion is reserved for that moment; every other transition is a short state change.

**Key Characteristics:**
- Total palette commitment: spruce field, granite ground, lichen as the only bright ink, rowan for errors only.
- Flat ink, 2px corners, no shadows or gradients.
- One 8px module (4px half-step) for spacing, shape geometry and type rhythm.
- One display face (Familjen Grotesk 700) at fixed steps; Schibsted Grotesk for the interface.
- One authored motion moment: the intent shape morph and focus pull (700ms, exponential ease-out).

## Colors

Two grounds, one bright ink, one warning colour: a landscape palette committed to in full.

### Primary
- **Spruce Field** (spruce): the shell's left region at full height, the primary button, selected-cell borders, the done segments of progress, the active tab underline, and the focus ring on granite. It is a ground, not an accent.
- **Raised Spruce** (spruce-raised): spruce one step lighter, for hover on spruce surfaces and the scrollbar thumb.
- **Deep Spruce** (spruce-deep): pressed state on spruce.

### Secondary
- **Sulphur Lichen** (lichen): the only bright ink. The intent shape, the wordmark, the goal phrase in the intent sentence, the active legend emblem, the selected radio dot, the current progress segment, the "changed" tag, text selection, the primary-button arrow, and the focus ring on spruce.

### Tertiary
- **Rowan** (rowan): errors only (5.0:1 on granite). Never decorative.

### Neutral
- **Granite** (granite): the work ground and page background.
- **Granite Line** (granite-line): 1px rules, empty progress segments, dashed own-words edge, answer-cell hover border.
- **Light Granite** (granite-light): answer cells, the event chip, the current ledger row.
- **White** (white): selected and hovered answer cells and the filled own-words field. Paper shows through only where the user has acted.
- **Ink** (ink): primary text on granite.
- **Soft Ink** (ink-soft): secondary text on granite: hints, ledger questions, meta (7.1:1 on granite).
- **On Spruce** (on-spruce) / **Soft On Spruce** (on-spruce-soft): text on the field; soft for tagline, legend and quiet intent text (7.4:1 on spruce).

### Named Rules
**The One Bright Ink Rule.** Lichen marks the shape, the selection and the change, and nothing else. If an element is not one of those things, it is not lichen.

**The Rowan Is Alarm Rule.** Rowan appears only on error text. It never marks emphasis, a brand moment or a destructive-looking button.

**The Field Owns a Region Rule.** Spruce is applied as a whole region (the field, the primary button), never as a thin tint or a card background on granite.

## Typography

**Display Font:** Familjen Grotesk (with Schibsted Grotesk, system-ui)
**Body Font:** Schibsted Grotesk (with system-ui)

**Character:** A compact, slightly quirky grotesk set bold and tight for poster headlines, against a plain, sturdy grotesk for everything operational. Both are self-hosted (weights 500/700 display; 400/500/600 UI).

### Hierarchy
- **Display XL** (700, 46px, 1.06, -0.025em): the current question and the result heading. Max about 19em. Steps down to 30px / 1.1 at 900px and below.
- **Display L** (700, 34px, 1.1, -0.02em): the intent sentence on the field, max 28ch, reserved height of three lines so the field never jumps. The quiet tail uses weight 500 in soft on-spruce. 22px in the mobile band.
- **Display M** (700, 28px, 1, -0.02em): the wordmark, in lichen.
- **Body L** (500, 17px, 1.3): answer cell labels.
- **Body** (400, 16px, 1.5): hints (max 62ch), inputs, buttons (600).
- **Small** (14px): ledger, progress count, status and error lines. Progress uses tabular numerals.
- **Label** (600, 13px, 0.08em, uppercase): section headings such as the ledger title, and the "soon" status beside disabled tabs (11px). The legend and event chip use 13px without tracking or case change.

### Named Rules
**The Fixed Steps Rule.** Display type uses only the three named steps. No fluid clamp scaling; the steps change once, at the 900px breakpoint.

**The One Display Face Rule.** Familjen Grotesk is the only display face. Emphasis inside display type is colour (lichen on spruce), never italic: emphasis elements are set upright.

## Layout

A two-region shell. The spruce field is a fixed-width left column (560px) that stays sticky at full viewport height while the granite work area scrolls; the field colour is painted the full page height behind it. The field stacks wordmark and tagline at top, the intent shape (max 400px wide) and intent sentence centred by auto margins, and the three-emblem legend at the foot above a faint rule.

The work area runs top to bottom: section tabs and the sample-event chip, progress segments with the question count, the question, answer cells, the own-words field, actions, a status line, and the ledger pushed to the foot with auto margin. Content widths cap at 800px (question) and 880px (ledger).

Spacing is an 8px module with a 4px half-step (s-1 to s-9, 4–64px). Field padding is 24/48/40px; work-area padding is 24/64/40px. Answer cells sit in a two-column grid with 8px gaps; a three-answer set spans its last cell full width. Status and error lines reserve their height so the layout never jumps.

**Breakpoints:**
- **1360px and below:** field narrows to 440px; field padding-inline 32px, work 40px.
- **1120px and below:** the event chip is hidden.
- **900px and below:** the field becomes a top band (brand row, then intent sentence beside a 128px shape); legend hidden; tabs scroll horizontally; answers become a single column with 48px cells; primary actions stretch; ledger rows stack into a number / question-over-answer / edit grid.

## Elevation & Depth

Flat. There are no drop shadows and no gradients anywhere. Depth comes from tonal layering only: spruce field beside granite ground, light granite cells on granite, white where the user has acted. The only `box-shadow` uses in the build are flat ink devices, not elevation: the 3px inset underline on the active tab and the 3px white inset ring inside the selected radio.

### Named Rules
**The Flat Ink Rule.** Surfaces never lift. State is shown by changing ink (background, border colour, border style), never by shadow or blur. Inset strokes that draw a line in solid ink are allowed; cast shadows are not. The single exception is the intent shape's focus blur, which carries meaning (how vague the intent still is) and reaches zero when the drill is complete.

## Shapes

Near-square: one radius (2px) on buttons, cells, inputs, chips and tags; progress segments and the shape stock are square. Radios are the only circles. Borders are 2px for interactive edges (cells, inputs, radio rings) and 1px for rules. Dashed strokes mean "not yet": the empty own-words field has a 2px dashed granite-line edge that turns solid spruce once focused or filled; the shape's register frame and cut guides are dashed.

The emblem set is drawn on a 16-unit grid: circle (be seen), wedge pointing right (hire for a specific need), horizontal band (hire in general). The filled arrow shares that grid. These three silhouettes are the system's only iconography; icons are inline SVG, never glyphs.

## Components

### Buttons
Solid, square-cornered, confident.
- **Shape:** 2px radius, 48px tall, 24px horizontal padding, weight 600.
- **Primary:** spruce fill, on-spruce text, a 16px filled lichen arrow after the label.
- **Hover / Active:** raised spruce on hover with the arrow nudging 3px right (220ms); deep spruce when pressed.
- **Quiet:** text-only in soft ink, 48px tall, underline fading in on hover (120ms) and text darkening to ink; disabled at 45% opacity.
- **Focus:** 3px spruce outline, 2px offset.

### Answer cells
Light granite slabs that turn to paper when chosen.
- **Rest:** light granite, 2px transparent border, 56px min height, 16px/20px padding, 17px/500 label after a 20px radio ring in soft ink.
- **Hover:** white with a granite-line border.
- **Selected:** white cell, 2px spruce border; the radio fills lichen inside a spruce ring with a 3px white inset. Spruce ring, white inset, lichen dot.
- **Focus:** the whole cell takes the 3px spruce outline (2px offset), not the native radio.

### Own-words field
- **Style:** transparent, 2px dashed granite-line, 2px radius, 48px tall; placeholder in soft ink.
- **Hover:** border darkens to soft ink.
- **Focus / Filled:** border goes solid spruce and the field turns white.

### Progress
One 32px × 6px segment per question with 4px gaps (24px wide on mobile): spruce when done, lichen for the current question, granite-line when ahead. A small-type count sits beside it.

### Navigation
Section tabs at 16px/500 in soft ink with 32px gaps. The current tab is ink with a 3px spruce underline. Unavailable tabs stay in place with an 11px tracked uppercase "soon" label and a default cursor.

### Chips and tags
- **Event chip:** light granite, 13px soft-ink text with the event name in 600 ink, 8px/12px padding, labelled as sample data.
- **Changed tag:** lichen with 12px/600 ink text, 1px/6px padding, set after an edited ledger answer. It is the change state.

### Ledger
A fixed-column table (number, question, answer, edit) in small type with 1px granite-line rules between rows. Questions are soft ink, answers 600 ink, the edit action is a spruce text button whose underline fades in on hover. The current row tints light granite. Rows restyle in place as answers change; nothing animates in or out. Below 900px rows stack into a grid.

### Focus
**The Ring Follows the Ground Rule.** Focus is a 3px solid outline at 2px offset: spruce on granite surfaces, lichen on spruce surfaces. Every interactive element inside the field uses the lichen ring.

### Intent Shape (signature)
A single flat lichen polygon on the spruce field (400 × 320 viewBox), drawn with 48 points arranged as four 12-point sides so edges stay straight while morphing. It starts as a blunt stock and is cut toward its goal emblem as specificity grows: circle (be seen), wedge (hire for a specific need) or band (hire in general). At the same time it comes into focus: a Gaussian blur on the ink (viewBox units) is 14 before a goal exists, 10 once the goal is chosen, then falls as 10 × (1 − specificity)^1.3 to exactly 0 when every answer is in. Shape and blur change together over 700ms with exponential ease-out; with reduced motion both jump straight to their targets. The register frame, cut guides and legend are never blurred.
- **Register frame:** a dashed lichen rectangle (2px, 4/8 dash, 40% opacity) offset outside the stock so it never touches the ink.
- **Cut guides:** the three possible cuts drawn as dashed spruce outlines (1.5px, 6/6 dash, 45% opacity) over the stock, shown only before a goal exists and fading out (220ms) once one does.
- **Legend:** the three emblems at the field's foot in soft on-spruce; the active goal turns lichen and 600 weight.
- The shape is decorative (`aria-hidden`); the intent sentence carries the meaning in text.

### Copy and voice
Interface copy is generic, practically built product text that holds for any company and any answer: "No answers yet", "Intent submitted", "Choose an answer to continue", "Question 4 of 6". Labels, buttons, empty states, errors and status lines never comment on the user's particular choices. Summaries assembled from answers are plain templates with slots (the intent sentence, the result heading). Frank, characterful language belongs where a team authors it once: question wording and per-question help text. Copy describes the product on its own terms and never carries contrasts with alternatives or traces of how it was designed. Sample content is always labelled as sample.

## Do's and Don'ts

### Do:
- **Do** keep lichen to the shape, selection, changed state and focus on spruce (The One Bright Ink Rule).
- **Do** use the 2px radius and the 8px module (4px half-step) for every new component.
- **Do** show state through ink: white fill and spruce border for chosen, dashed edges for empty, solid edges once filled.
- **Do** switch the focus ring to lichen on any spruce surface, spruce on granite.
- **Do** reserve height for status, error and intent text so nothing jumps.
- **Do** draw icons as filled inline SVG on the 16-unit emblem grid.
- **Do** write labels, empty states and errors as generic templates; put characterful language in question wording and static help text.

### Don't:
- **Don't** add drop shadows, glows, blur or gradients; depth is tonal only. The intent shape's focus blur is the one sanctioned blur (The Flat Ink Rule).
- **Don't** use rowan for anything but errors.
- **Don't** add a second display face, italic emphasis, or fluid display sizes between the fixed steps.
- **Don't** add motion beyond short state transitions (120ms / 220ms); the shape morph is the one authored moment.
- **Don't** write UI copy that reacts to the user's specific answers, or that explains what the product is not.
- **Don't** present sample events or answers without a sample label, or show invented outcomes or match numbers.
