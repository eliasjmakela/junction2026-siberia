import type { Score } from './core'

const s = (attribute: string, score: number, question: string, evidence: string, rationale: string): Score => ({ attribute, score, question, evidence, rationale })
const none = (attribute: string): Score => ({ attribute, score: null, evidence: '', rationale: 'No usable evidence in the answers.' })

const FS = 'sample-field-service'
const BE = 'sample-backend'
const PD = 'sample-product-design'
const DE = 'sample-data-engineer'
const SU = 'sample-sustainability'
const key = (n: number, listing: string) => `sample-app-${String(n).padStart(2, '0')}:${listing}`

/** Hand-written synthetic assessments for the sample applicants, labelled "Sample assessment" wherever shown. Keyed `${applicationId}:${listingId}`. */
export const SAMPLE_SCORES: Record<string, Score[]> = {
  /* ---------- Field service technician ---------- */
  [key(2, FS)]: [
    s('a1', 9, 'q1', 'I measured the supply voltage under load and it dropped when the kitchen equipment start, so motor was fine', 'Isolated a voltage drop under load before replacing parts, found the loose neutral and saved the customer a new motor.'),
    s('a2', 8, 'q3', 'Then I showed him on the display what the error code mean and what part was broken, and I told honestly that the part will come Thursday', 'Let an upset customer talk, explained the fault on the display, gave an honest date and confirmed it the day before.'),
    s('a3', 8, 'q2', 'First I call the customer before I drive, and ask what model, when last service and what they see now', 'Fills in the missing history before driving out, then checks the type plate and paper log on site.'),
    s('a4', 9, 'q2', 'I write everything I measure in the service note, also what I did not have time to check, so next technician does not start from zero', 'Records measurements and unchecked items, so the next technician can rely on the note.'),
  ],
  [key(5, FS)]: [
    s('a1', 2, 'q1', 'I fixed a broken light switch at home and some sockets', 'Home repairs only, with no fault-finding method or equipment diagnosis described.'),
    s('a2', 2, 'q3', 'I try to be polite and explain things', 'A general intention with no customer situation described.'),
    s('a3', 2, 'q2', 'I would ask the customer or call the office', 'A reasonable first step, but no plan for working when the history is missing.'),
    none('a4'),
  ],
  [key(9, FS)]: [
    s('a1', 6, 'q1', 'I checked the heating element with a multimeter and found it had low insulation resistance', 'Found a faulty heating element by insulation testing during an apprenticeship, under supervision.'),
    s('a2', 4, 'q3', 'A customer was upset about waiting. I explained what was wrong and how long the repair would take', 'Explained the fault and timing to an upset customer, with little detail on how the conversation went.'),
    s('a3', 6, 'q2', 'I look for any old service notes, ask the customer what happened before, and check the type plate', 'A practical routine for missing history: old notes, questions to the customer and the type plate.'),
    s('a4', 5, 'q2', 'I write what I found so the next visit is easier', 'Writes findings down for the next visit, without saying what the notes contain.'),
  ],
  [key(12, FS)]: [
    s('a1', 2, 'q1', 'I excel at troubleshooting complex issues and always strive to deliver first-class service that exceeds customer expectations', 'Claims troubleshooting skill but describes no fault or how it was found.'),
    s('a2', 2, 'q3', 'I communicate with empathy and professionalism, building trust and long-lasting relationships', 'A general claim with no customer situation or the words actually used.'),
    s('a3', 1, 'q2', 'I would adopt a proactive and solution-oriented approach, leveraging my strong problem-solving skills to ensure a seamless experience for the customer while maintaining the highest standards of quality', 'No practical step for working without the equipment history.'),
    none('a4'),
  ],
  [key(13, FS)]: [
    s('a1', 1, 'q1', 'I like fixing bikes and computers', 'Hobby repairs, with nothing about electrical fault finding.'),
    none('a2'),
    none('a3'),
    none('a4'),
  ],
  [key(14, FS)]: [
    s('a1', 6, 'q1', 'The motion sensor was fine; the timer relay was stuck', 'Ruled out the sensor, found a stuck timer relay and checked the other staircases too.'),
    s('a2', 5, 'q3', 'I explained what we were doing and when it would end, and we finished before the evening', 'Explained the work and its timing to a resident and kept to it; a mild case.'),
    s('a3', 5, 'q2', 'I check the building logbook and ask the caretaker', 'Uses the logbook and the caretaker to fill in missing history; brief.'),
    s('a4', 6, 'q2', 'I note the model and what I changed in the work order system', 'Records the model and the changes made in the work order system.'),
  ],

  /* ---------- Backend developer ---------- */
  [key(1, BE)]: [
    s('a1', 9, 'q1', 'I wrote the migration that added a unique constraint on (customer_id, period), and a retry queue for failed rows', 'Shipped a TypeScript service on PostgreSQL with its own migration, constraint and retry queue, and a measured drop in tickets.'),
    s('a2', 9, 'q2', 'My guess is the fix is an idempotency key per channel order id, enforced with a unique index, so a late or repeated message cannot create a second order', 'Proposes an idempotency key with a unique index, which directly stops late or repeated messages creating duplicates.'),
    s('a3', 8, 'q2', 'Then I would trace one duplicated order end to end and check whether the order is created before the stock update is applied', 'Plans to trace one duplicated order end to end and test a specific ordering hypothesis.'),
    s('a4', 9, 'q3', 'New developers could take on-call after one week instead of a month, and the average time to find the failing service dropped from around 40 minutes to under 10', 'Replaced an unread runbook with a small CLI and reports the onboarding and diagnosis time it saved.'),
  ],
  [key(3, BE)]: [
    s('a1', 2, 'q1', 'I have extensive experience with modern backend technologies, including TypeScript and PostgreSQL', 'Lists TypeScript and PostgreSQL with no change, system or release described.'),
    s('a2', 1, 'q2', 'I would take a holistic, data-driven approach: analyse the root cause, collaborate with stakeholders, and implement a scalable, future-proof solution that ensures data integrity across all channels', 'Promises data integrity without saying how duplicate or late updates would be handled.'),
    s('a3', 1, 'q2', 'analyse the root cause, collaborate with stakeholders', 'Says it would analyse the root cause but names no logs, events or systems to trace.'),
    s('a4', 2, 'q3', 'I am a strong believer in developer experience and always strive to make systems more intuitive and easier to operate for everyone involved', 'A stated value with no example of something made easier to run or debug.'),
  ],
  [key(6, BE)]: [
    s('a1', 6, 'q1', 'I added a REST endpoint in a TypeScript (NestJS) service that lets customers download their order history as CSV', 'Shipped a TypeScript endpoint with a PostgreSQL index and pagination, tested with support before release.'),
    s('a2', 5, 'q2', 'Then I would add a check before creating an order, maybe with a unique key', 'Points toward a unique key against duplicates, without covering late or out-of-order updates.'),
    s('a3', 5, 'q2', 'I would look at the logs for the duplicated orders and see if the two channels send the same order twice', 'Would start from the logs of duplicated orders; a sensible but shallow tracing plan.'),
    s('a4', 7, 'q3', 'I wrote a README and a docker-compose file so new developers could run the service locally in one command', 'Cut local setup for new developers from about a day to one command.'),
  ],
  [key(8, BE)]: [
    s('a1', 2, 'q1', 'I know some TypeScript from a course', 'Course knowledge of TypeScript only; no PostgreSQL or shipped change.'),
    s('a2', 3, 'q2', 'Maybe the messages come twice, so I would check that', 'Correctly suspects duplicate messages but gives no way to confirm or prevent them.'),
    s('a3', 2, 'q2', 'Maybe the messages come twice, so I would check that', 'Names one hypothesis but no way to trace an order through the systems.'),
    none('a4'),
  ],
  [key(13, BE)]: [
    s('a1', 1, 'q1', 'I mostly work with WordPress sites and some PHP', 'PHP and WordPress work, not TypeScript or PostgreSQL.'),
    s('a2', 1, 'q2', 'I think it is important to test everything well', 'A general statement with no approach to duplicate or late updates.'),
    none('a3'),
    s('a4', 1, 'q3', 'I helped my colleague install plugins', 'Helped install plugins, which says little about making a system easier to operate.'),
  ],

  /* ---------- Product designer ---------- */
  [key(3, PD)]: [
    s('a1', 2, 'q1', 'In my previous roles I have leveraged design thinking methodologies to map end-to-end journeys and identify key pain points', 'Claims journey mapping in general terms, with no workflow, people or finding named.'),
    s('a2', 2, 'q2', 'My Figma skills allow me to create high-fidelity, interactive prototypes that bring ideas to life and generate actionable insights', 'States Figma skill and rapid iteration but describes no prototype, test or design change.'),
    s('a3', 1, 'q1', 'By aligning stakeholders around a shared vision, I consistently deliver impactful solutions that optimize workflows and enhance efficiency', 'Mentions optimising workflows without any repeated step removed or effect measured.'),
    s('a4', 2, 'q3', 'I thrive in cross-functional environments and excel at fostering open communication between customers, engineers and business stakeholders to ensure alignment and drive innovation', 'Names customers and engineers but gives no situation where they were brought together.'),
  ],
  [key(7, PD)]: [
    s('a1', 9, 'q1', 'At a logistics startup I spent three days in the dispatch office with a notebook', 'Observed dispatchers for three days and mapped every copy step before designing anything.'),
    s('a2', 9, 'q2', 'Three of them missed the confirm button because they used the app with gloves, so we made the touch targets twice as big and moved confirm to the bottom of the screen', 'Tested a Figma prototype with drivers in their vans and changed the design because of what the test showed.'),
    s('a3', 9, 'q1', 'After launch, planning a morning shift went from about 50 minutes to 20, measured by the dispatchers themselves', 'Replaced triple entry of the same address with one form and reports the planning time saved.'),
    s('a4', 8, 'q3', 'I set up a 30-minute call every second week where one driver showed their screen and an engineer watched without talking until the end', 'Set up a recurring driver and engineer session that changed what the team built first.'),
  ],
  [key(9, PD)]: [
    none('a1'),
    s('a2', 3, 'q2', 'I made a prototype for my school project in Figma and showed it to my classmates', 'Showed a school Figma prototype to classmates; no real users and no design change from the test.'),
    none('a3'),
    s('a4', 2, 'q3', 'I worked in a café for two years, so I am used to talking with customers', 'Customer-facing experience, but nothing about bringing customers and engineers together.'),
  ],
  [key(11, PD)]: [
    s('a1', 6, 'q1', 'For a library app I interviewed six staff members about how they handle reservations', 'Interviewed staff and drew the reservation steps before redesigning; small in scope but real.'),
    s('a2', 6, 'q2', 'Two did not understand the date field, so I changed it to a calendar picker', 'Tested a Figma prototype with four visitors and changed the date field because of the result.'),
    s('a3', 5, 'q1', 'My redesign added a form that customers fill in directly', 'Removed a manual copy step with a direct form, though no effect is reported.'),
    s('a4', 4, 'q3', 'In the library project I joined one meeting between staff and the developer to explain the prototype', 'Joined one meeting between staff and the developer; limited evidence of bringing the groups together.'),
  ],
  [key(13, PD)]: [
    s('a1', 0, 'q1', 'I have not mapped a workflow but I am a fast learner and very motivated', 'States that no workflow has been mapped.'),
    s('a2', 0, 'q2', 'I would like to learn Figma', 'No prototype or user test described.'),
    none('a3'),
    none('a4'),
  ],

  /* ---------- Data engineer ---------- */
  [key(1, DE)]: [
    s('a1', 6, 'q1', 'I built a Python job that loads sensor readings from CSV files into a SQL table every hour', 'Built an hourly Python-to-SQL load job; concrete, but small in scope.'),
    s('a2', 7, 'q2', 'I converted everything to UTC and Celsius in one staging step, kept the original values in separate columns, and wrote a test for each conversion', 'Reconciled units and time zones in one staging step, kept the raw values and tested each conversion.'),
    s('a3', 7, 'q1', 'I knew it was right when the daily totals matched the device vendor portal for two weeks', 'Added range and timestamp checks and validated totals against an outside source for two weeks.'),
    s('a4', 6, 'q3', 'I removed the technical columns and wrote one sentence under each chart about what to do', 'Simplified a chart for facilities staff with plain action notes, though no result is given.'),
  ],
  [key(4, DE)]: [
    s('a1', 5, 'q1', 'In a course project I wrote SQL views that joined sales and weather data for a café chain', 'Course-level SQL joins with a Python download step; relevant but small and outside production.'),
    s('a2', 4, 'q2', 'I would agree on one standard format first, convert both sources to it, and keep a log of the conversions', 'A sound outline of standardising and logging conversions, without a real case or detail.'),
    s('a3', 3, 'q1', 'I checked a few days by hand against the original files', 'Checked a few days by hand; no systematic quality checks or documentation.'),
    s('a4', 5, 'q3', 'I presented my course results to the café owner with simple bar charts and avoided technical words', 'Explained results to a non-technical owner in plain charts; little detail on the outcome.'),
  ],
  [key(8, DE)]: [
    s('a1', 9, 'q1', 'I build pipeline for electricity meter data, about 2 million rows per day, Python with pandas first and later moved heavy parts to SQL in the warehouse', 'Built and scaled a meter-data pipeline in Python and SQL with clear inputs and outputs.'),
    s('a2', 9, 'q2', 'When two sources disagree more than 2 degrees I mark the row and do not use it for the model', 'Reconciled units, time zones and station IDs, and flags rows where the sources disagree.'),
    s('a3', 9, 'q1', 'For checking it is right I wrote tests that the sum of 15-minute values equal the hourly value, and a daily check that alerts if more than 1 % of meters are missing', 'Wrote reconciliation tests and a missing-data alert, which caught a real duplicate-reading fault.'),
    s('a4', 8, 'q3', 'I sat with two of them for one hour and changed the labels to their words', 'Built a three-colour view for customer service and rewrote its labels in their words, so they needed the data team less.'),
  ],
  [key(11, DE)]: [
    s('a1', 2, 'q1', 'I have done some SQL queries in a course', 'Course SQL only, with no pipeline or transformation described.'),
    s('a2', 1, 'q2', 'I am not sure, I would ask a senior', 'Gives no approach to reconciling the sources.'),
    none('a3'),
    s('a4', 2, 'q3', 'I explained my course project to my friends', 'Explained a course project informally; no sign of making data usable for colleagues.'),
  ],

  /* ---------- Sustainability analyst ---------- */
  [key(4, SU)]: [
    s('a1', 9, 'q1', 'For my thesis I did a cradle-to-gate assessment of an office chair for a furniture maker, in SimaPro with ecoinvent data', 'Completed a cradle-to-gate assessment with a clear scope, named tools and data, and a quantified hotspot.'),
    s('a2', 9, 'q2', 'I would make one intake template with fixed units and required fields, and map every supplier file into it instead of editing their files', 'A consistent intake method with traceability, quality scores and a year-on-year check before reporting.'),
    s('a3', 9, 'q3', 'I checked and the old number included transport and the new one did not', 'Caught a boundary mismatch behind a 60 % claim, recalculated it and explained it with one chart.'),
    s('a4', 8, 'q1', 'I built the bill of materials in Excel first, with one tab per supplier, so each emission factor could be traced to a source', 'Built a traceable Excel bill of materials that others can follow back to its sources.'),
  ],
  [key(5, SU)]: [
    s('a1', 2, 'q1', 'I have read about life-cycle assessment and I am interested in sustainability', 'Interest in life-cycle assessment, but no assessment done or contributed to.'),
    none('a2'),
    none('a3'),
    none('a4'),
  ],
  [key(8, SU)]: [
    s('a1', 4, 'q1', 'I helped with a carbon calculation for our office using a spreadsheet tool', 'Contributed to an office carbon calculation; related, but not a product assessment.'),
    s('a2', 5, 'q2', 'Make a template where every supplier gives the same columns, and check the units', 'A sensible template-and-units approach, short on how the data would be checked before reporting.'),
    s('a3', 6, 'q3', 'In the office calculation, flights were counted twice. I noticed and told the team lead', 'Spotted double-counted flights and raised it, though no explanation to non-specialists is described.'),
    s('a4', 3, 'q1', 'I collected electricity and travel numbers', 'Collected inputs for a spreadsheet tool; no model built or maintained.'),
  ],
  [key(10, SU)]: [
    s('a1', 2, 'q1', 'I bring a strong passion for sustainability and a holistic understanding of life-cycle thinking', 'Claims life-cycle thinking but names no assessment, scope or data.'),
    s('a2', 2, 'q2', 'I would implement a robust, standardised framework to ensure data consistency, accuracy and transparency', 'Promises a framework with no concrete steps for reviewing supplier files.'),
    s('a3', 2, 'q3', 'I always challenge assumptions and communicate complex findings in a clear, compelling and accessible way to diverse audiences', 'States the skill without any assumption questioned or result explained.'),
    none('a4'),
  ],
  [key(14, SU)]: [
    s('a1', 6, 'q1', 'In a summer job I updated the footprint of two cleaning products for a retailer, in an Excel model built by a senior analyst', 'Updated real product footprints with new supplier data, inside a model someone else built.'),
    s('a2', 6, 'q2', 'I would sort the files by supplier and material, convert units to kilograms, and keep a list of missing values to ask the suppliers', 'A concrete review routine for supplier files, with unit conversion and follow-up questions.'),
    s('a3', 7, 'q3', 'I checked and the cap was not included in the new weight', 'Caught a missing cap behind a 30 % lighter claim and had the claim corrected.'),
    s('a4', 6, 'q1', 'I replaced the old packaging data with new supplier values and documented each change in a log tab', 'Maintained an Excel model with a change log that others can follow.'),
  ],
}
