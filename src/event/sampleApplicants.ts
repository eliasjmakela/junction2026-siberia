import type { Application } from './store'

/**
 * Synthetic applications for the sample event, labelled Sample wherever shown.
 * Answers vary on purpose: specific, decent, thin, generic and partly
 * off-topic, in different writing styles. No real people, companies or outcomes.
 */

const FS = 'sample-field-service'
const BE = 'sample-backend'
const PD = 'sample-product-design'
const DE = 'sample-data-engineer'
const SU = 'sample-sustainability'

type Seed = { n: number; day: number; answers: Record<string, Record<string, string>> }

const SEEDS: Seed[] = [
  {
    n: 1,
    day: 3,
    answers: {
      [BE]: {
        q1: 'At my last job I moved our invoice export from a nightly cron script to a TypeScript service on top of PostgreSQL. I wrote the migration that added a unique constraint on (customer_id, period), and a retry queue for failed rows. Before release I replayed one month of production events in staging and compared totals line by line; we found two rounding bugs that way. After release the support tickets about missing invoices went from about ten a month to zero in the first quarter.',
        q2: 'First I would log both channels with the event time and the time we received it, so I can see how late the updates really are. Then I would trace one duplicated order end to end and check whether the order is created before the stock update is applied. My guess is the fix is an idempotency key per channel order id, enforced with a unique index, so a late or repeated message cannot create a second order.',
        q3: 'Our on-call runbook was a long wiki page nobody read. I replaced it with a small CLI that runs the five checks we always did by hand and prints which service is unhealthy. New developers could take on-call after one week instead of a month, and the average time to find the failing service dropped from around 40 minutes to under 10.',
      },
      [DE]: {
        q1: 'I built a Python job that loads sensor readings from CSV files into a SQL table every hour. I added checks for missing timestamps and values outside the sensor range, and the job writes a short report of rejected rows. I knew it was right when the daily totals matched the device vendor portal for two weeks.',
        q2: 'Once I had temperatures in Celsius from one source and Fahrenheit from another, plus different time zones. I converted everything to UTC and Celsius in one staging step, kept the original values in separate columns, and wrote a test for each conversion.',
        q3: 'I made a one-page chart for the facilities team showing which buildings used the most energy at night. I removed the technical columns and wrote one sentence under each chart about what to do.',
      },
    },
  },
  {
    n: 2,
    day: 4,
    answers: {
      [FS]: {
        q1: 'A ventilation unit in a school stopped every afternoon. Customer said it is the motor. I measured the supply voltage under load and it dropped when the kitchen equipment start, so motor was fine. I found a loose neutral in the distribution board, tightened and tested again with the logger for two days. No stops after that and we did not change the motor, which saved the customer around 900 euros.',
        q2: 'First I call the customer before I drive, and ask what model, when last service and what they see now. On site I take photo of the type plate and I check the last notes in the unit cabinet, many times there is a paper log. I write everything I measure in the service note, also what I did not have time to check, so next technician does not start from zero.',
        q3: 'One customer was angry because it was the third visit for the same heat pump. I let him talk first. Then I showed him on the display what the error code mean and what part was broken, and I told honestly that the part will come Thursday. I gave him my estimate of the time and called him Wednesday to confirm. He was calm after and asked the same technician next time.',
      },
    },
  },
  {
    n: 3,
    day: 4,
    answers: {
      [PD]: {
        q1: 'I am passionate about creating seamless, user-centric experiences that drive value. In my previous roles I have leveraged design thinking methodologies to map end-to-end journeys and identify key pain points. By aligning stakeholders around a shared vision, I consistently deliver impactful solutions that optimize workflows and enhance efficiency.',
        q2: 'Prototyping is at the heart of my process. I believe in iterating rapidly and validating assumptions early with real users. My Figma skills allow me to create high-fidelity, interactive prototypes that bring ideas to life and generate actionable insights.',
        q3: 'Collaboration is one of my core strengths. I thrive in cross-functional environments and excel at fostering open communication between customers, engineers and business stakeholders to ensure alignment and drive innovation.',
      },
      [BE]: {
        q1: 'I have extensive experience with modern backend technologies, including TypeScript and PostgreSQL. I am committed to writing clean, scalable and maintainable code and always follow best practices to ensure robust, high-quality releases.',
        q2: 'I would take a holistic, data-driven approach: analyse the root cause, collaborate with stakeholders, and implement a scalable, future-proof solution that ensures data integrity across all channels.',
        q3: 'I am a strong believer in developer experience and always strive to make systems more intuitive and easier to operate for everyone involved.',
      },
    },
  },
  {
    n: 4,
    day: 5,
    answers: {
      [SU]: {
        q1: 'For my thesis I did a cradle-to-gate assessment of an office chair for a furniture maker, in SimaPro with ecoinvent data. Scope was materials, part manufacturing and transport to the assembly site. I built the bill of materials in Excel first, with one tab per supplier, so each emission factor could be traced to a source. The aluminium base was 46 % of the footprint, and switching to recycled aluminium would cut the total by about a third.',
        q2: 'I would make one intake template with fixed units and required fields, and map every supplier file into it instead of editing their files. Each row keeps a link to the original file and a data-quality score from 1 to 3. Then I check totals per supplier against last year and flag anything that changed more than 20 % before it goes into reporting.',
        q3: 'A product team quoted a 60 % lower footprint for a new packaging. I checked and the old number included transport and the new one did not. I redid both on the same boundary, which gave 18 %, and explained it in a short meeting with one chart that showed the two boundaries side by side. They used the 18 % in the launch material.',
      },
      [DE]: {
        q1: 'In a course project I wrote SQL views that joined sales and weather data for a café chain. I used Python to download the weather data. I checked a few days by hand against the original files.',
        q2: 'I would agree on one standard format first, convert both sources to it, and keep a log of the conversions.',
        q3: 'I presented my course results to the café owner with simple bar charts and avoided technical words.',
      },
    },
  },
  {
    n: 5,
    day: 6,
    answers: {
      [FS]: {
        q1: 'I fixed a broken light switch at home and some sockets.',
        q2: 'I would ask the customer or call the office.',
        q3: 'I try to be polite and explain things.',
      },
      [SU]: {
        q1: 'I have read about life-cycle assessment and I am interested in sustainability.',
        q2: 'Check the files carefully.',
        q3: 'I always check numbers.',
      },
    },
  },
  {
    n: 6,
    day: 6,
    answers: {
      [BE]: {
        q1: 'I added a REST endpoint in a TypeScript (NestJS) service that lets customers download their order history as CSV. The query in PostgreSQL was slow for big customers, so I added an index and paginated the export. I wrote tests for the date filters and checked the output with the support team before release.',
        q2: 'I would look at the logs for the duplicated orders and see if the two channels send the same order twice. Then I would add a check before creating an order, maybe with a unique key.',
        q3: 'I wrote a README and a docker-compose file so new developers could run the service locally in one command. Before that it took most people a full day to set up.',
      },
    },
  },
  {
    n: 7,
    day: 7,
    answers: {
      [PD]: {
        q1: 'At a logistics startup I spent three days in the dispatch office with a notebook. Dispatchers typed the same delivery address into the route planner, the driver app and a spreadsheet for invoicing. I mapped every copy step on a wall, 14 in total, and we designed one entry form that fed the other two tools. After launch, planning a morning shift went from about 50 minutes to 20, measured by the dispatchers themselves.',
        q2: 'I built a clickable Figma prototype of a route-change screen and tested it with five drivers in their vans during lunch breaks. Three of them missed the confirm button because they used the app with gloves, so we made the touch targets twice as big and moved confirm to the bottom of the screen. The second round of tests had no missed confirms.',
        q3: 'Engineers thought drivers wanted more map features; drivers kept asking for fewer taps. I set up a 30-minute call every second week where one driver showed their screen and an engineer watched without talking until the end. After the third call the team dropped two planned map features and fixed the login flow first.',
      },
    },
  },
  {
    n: 8,
    day: 8,
    answers: {
      [DE]: {
        q1: 'I build pipeline for electricity meter data, about 2 million rows per day, Python with pandas first and later moved heavy parts to SQL in the warehouse. Input is raw readings every 15 minutes, output is clean hourly consumption per customer. For checking it is right I wrote tests that the sum of 15-minute values equal the hourly value, and a daily check that alerts if more than 1 % of meters are missing. We found one meter type sending duplicated readings after daylight saving change.',
        q2: 'Weather data came in local time and Fahrenheit from one API and UTC and Celsius from other. I make a mapping table for station IDs, convert all to UTC and Celsius in staging, and keep raw columns too. When two sources disagree more than 2 degrees I mark the row and do not use it for the model. I documented each rule in the data catalog so analysts can see why rows are missing.',
        q3: 'The customer service team did not understand why some bills were estimated. I made a simple dashboard with three colours: measured, estimated, missing, per meter. I sat with two of them for one hour and changed the labels to their words. After that they could answer most calls without asking the data team.',
      },
      [BE]: {
        q1: 'I know some TypeScript from a course.',
        q2: 'Maybe the messages come twice, so I would check that.',
        q3: 'Not yet in backend.',
      },
      [SU]: {
        q1: 'I helped with a carbon calculation for our office using a spreadsheet tool. I collected electricity and travel numbers.',
        q2: 'Make a template where every supplier gives the same columns, and check the units.',
        q3: 'In the office calculation, flights were counted twice. I noticed and told the team lead.',
      },
    },
  },
  {
    n: 9,
    day: 9,
    answers: {
      [FS]: {
        q1: 'In my apprenticeship a washing machine at a laundromat tripped the breaker. I checked the heating element with a multimeter and found it had low insulation resistance. We replaced it with my supervisor and tested the unit.',
        q2: 'I look for any old service notes, ask the customer what happened before, and check the type plate. I write what I found so the next visit is easier.',
        q3: 'A customer was upset about waiting. I explained what was wrong and how long the repair would take.',
      },
      [PD]: {
        q1: 'I like to sketch a lot and I have good taste in visual design. I redesigned the logo and website for my sports club last year and people liked the new colours.',
        q2: 'I made a prototype for my school project in Figma and showed it to my classmates. They said it looked nice.',
        q3: 'I worked in a café for two years, so I am used to talking with customers.',
      },
    },
  },
  {
    n: 10,
    day: 10,
    answers: {
      [SU]: {
        q1: 'I bring a strong passion for sustainability and a holistic understanding of life-cycle thinking. I am adept at leveraging data-driven insights to support informed decision-making and drive meaningful environmental impact across the value chain.',
        q2: 'I would implement a robust, standardised framework to ensure data consistency, accuracy and transparency, while fostering strong collaboration with suppliers to continuously improve data quality.',
        q3: 'Critical thinking is central to my approach. I always challenge assumptions and communicate complex findings in a clear, compelling and accessible way to diverse audiences.',
      },
    },
  },
  {
    n: 11,
    day: 11,
    answers: {
      [PD]: {
        q1: 'For a library app I interviewed six staff members about how they handle reservations. I drew the steps on paper and saw that staff copied reservation details from email into the system by hand. My redesign added a form that customers fill in directly.',
        q2: 'I tested a Figma prototype of the reservation form with four library visitors. Two did not understand the date field, so I changed it to a calendar picker.',
        q3: 'In the library project I joined one meeting between staff and the developer to explain the prototype.',
      },
      [DE]: {
        q1: 'I have done some SQL queries in a course.',
        q2: 'I am not sure, I would ask a senior.',
        q3: 'I explained my course project to my friends.',
      },
    },
  },
  {
    n: 12,
    day: 12,
    answers: {
      [FS]: {
        q1: 'I am a highly motivated and detail-oriented professional with a strong technical background. I excel at troubleshooting complex issues and always strive to deliver first-class service that exceeds customer expectations.',
        q2: 'I would adopt a proactive and solution-oriented approach, leveraging my strong problem-solving skills to ensure a seamless experience for the customer while maintaining the highest standards of quality.',
        q3: 'Customer satisfaction is my top priority. I communicate with empathy and professionalism, building trust and long-lasting relationships.',
      },
    },
  },
  {
    n: 13,
    day: 13,
    answers: {
      [BE]: {
        q1: 'I mostly work with WordPress sites and some PHP. I would like to learn TypeScript.',
        q2: 'I think it is important to test everything well.',
        q3: 'I helped my colleague install plugins.',
      },
      [PD]: {
        q1: 'I have not mapped a workflow but I am a fast learner and very motivated.',
        q2: 'I would like to learn Figma.',
        q3: 'I am a team player.',
      },
      [FS]: {
        q1: 'I like fixing bikes and computers.',
        q2: 'Ask someone who knows.',
        q3: 'I stay calm.',
      },
    },
  },
  {
    n: 14,
    day: 14,
    answers: {
      [SU]: {
        q1: 'In a summer job I updated the footprint of two cleaning products for a retailer, in an Excel model built by a senior analyst. I replaced the old packaging data with new supplier values and documented each change in a log tab.',
        q2: 'I would sort the files by supplier and material, convert units to kilograms, and keep a list of missing values to ask the suppliers.',
        q3: 'The retailer wanted to say a bottle was 30 % lighter. I checked and the cap was not included in the new weight. I told my supervisor and we corrected the claim.',
      },
      [FS]: {
        q1: 'At a property maintenance company I traced why the stair lights in a building stayed on all day. The motion sensor was fine; the timer relay was stuck. I replaced the relay and checked the other staircases.',
        q2: 'I check the building logbook and ask the caretaker. I note the model and what I changed in the work order system.',
        q3: 'A resident complained about the noise of our repair. I explained what we were doing and when it would end, and we finished before the evening.',
      },
    },
  },
]

const pad = (n: number) => String(n).padStart(2, '0')

export const SAMPLE_APPLICATIONS: Application[] = SEEDS.map(({ n, day, answers }) => {
  const at = `2027-02-${pad(day)}T${pad(8 + (n % 9))}:${pad((n * 7) % 60)}:00.000Z`
  return {
    id: `sample-app-${pad(n)}`,
    code: `A-S${pad(n)}`,
    submittedAt: at,
    picks: Object.keys(answers),
    answers,
    email: `sample${pad(n)}@example.invalid`,
    consentAt: at,
    sample: true,
  }
})
