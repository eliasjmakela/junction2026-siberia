#!/usr/bin/env node
/**
 * Screenshot the app's main states at desktop (1440) and phone (390) widths.
 *
 *   npm run dev            # in another terminal (default http://localhost:5173)
 *   npm run capture        # writes PNGs to .impeccable/review/ (git-ignored)
 *
 * Env: APP_URL (default http://localhost:5173), CHROME_PATH (a Chromium binary;
 * otherwise Playwright's own, installed with `npx playwright-core install chromium`).
 * Captures use reduced motion, so the night sky renders each state without animating.
 * Sample answers below are synthetic.
 */
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const URL = process.env.APP_URL ?? 'http://localhost:5173'
const out = process.argv[2] ?? '.impeccable/review'
mkdirSync(out, { recursive: true })
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
const D = { width: 1440, height: 900 }, M = { width: 390, height: 844 }

async function run(name, vp, steps, full = true) {
  const page = await browser.newPage({ viewport: vp, reducedMotion: 'reduce' })
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.evaluate(() => document.fonts.ready)
  await steps(page)
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: full })
  if (errors.length) console.log(name, 'console errors:', errors)
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) console.log(name, 'horizontal overflow')
  await page.close()
}

const ch = (p, id, label) => p.locator(`#field-${id}`).getByLabel(label, { exact: true }).check({ force: true })
const next = p => p.locator('form button[type=submit]').click()
const s1 = async p => { await ch(p, 'vacancy', 'Open now'); await next(p) }
const s2 = async p => {
  await p.locator('#field-title input').fill('Backend developer')
  await p.locator('#field-purpose textarea').fill('our field technicians get the right job details on their phones before every visit.')
  await ch(p, 'type', 'Full-time')
  await p.getByRole('button', { name: /^More/ }).click(); await p.getByRole('button', { name: /^More/ }).click()
  await ch(p, 'start', 'Within 3 months')
}
const s3 = async p => {
  await p.locator('#field-month1 textarea').fill('pair with our lead developer, ship a small fix to production and visit two customer sites.')
  await p.locator('#field-problem textarea').fill('our scheduling service went down twice during the spring rush and technicians missed customer visits.')
  await p.locator('#field-tuesday textarea').fill('stand-up at 9, a review session, then a few hours of focused work on the scheduling service.')
  await ch(p, 'hours', 'Flexible')
  await p.getByLabel('Lowest monthly salary').fill('3800'); await p.getByLabel('Highest monthly salary').fill('4600')
}
const s4 = async p => { await ch(p, 'with', 'Engineers'); await ch(p, 'with', 'Customers'); await ch(p, 'solo', 'Mostly team, some solo'); await ch(p, 'teamsize', '4–10 people') }
const s5 = async p => {
  const i = p.locator('#field-skills input')
  await i.fill('Kotlin'); await i.press('Enter')
  await i.fill('SQL'); await p.getByRole('button', { name: 'Must-have', exact: true }).click()
  await i.fill('Kubernetes'); await p.getByRole('button', { name: 'We can teach' }).click()
  await i.fill('Field service domain'); await p.getByRole('button', { name: 'Nice to have' }).click()
  await ch(p, 'education', 'Preferred')
}
const s6 = async p => { await ch(p, 'worklang', 'English'); await ch(p, 'worklang', 'Finnish'); await ch(p, 'finnish', 'Learnable in the role') }
const s7 = async p => {
  await ch(p, 'mode', 'Hybrid'); await p.locator('#field-office input').fill('Keilaniemi, Espoo')
  await ch(p, 'abroadFirst', 'No'); await ch(p, 'fromAbroad', 'Yes')
  await p.locator('#field-visa').getByRole('button', { name: 'Not decided yet' }).click()
  await ch(p, 'relocation', 'Admin support'); await ch(p, 'relocation', 'Travel costs')
}
const s8 = async p => {
  await p.locator('#field-company input').fill('Sample Oy'); await ch(p, 'size', 'Growing')
  await p.locator('#field-thrive textarea').fill('ask a lot of questions and enjoy talking to customers')
}
const all = async p => { await s1(p); for (const s of [s2, s3, s4, s5, s6, s7, s8]) { await s(p); await next(p) } }
const submit = async (p) => { await all(p); await p.getByRole('button', { name: /Submit role/ }).click() }
const questions = async (p) => { await submit(p); await p.getByRole('button', { name: /Draft application questions/ }).first().click(); await p.getByRole('button', { name: /Publish to the event/ }).waitFor({ timeout: 95000 }) }
const view = (hash) => async (p) => { await p.evaluate((h) => { location.hash = h }, hash); await p.waitForTimeout(1200) }

for (const [sfx, vp] of [['desktop', D], ['mobile', M]]) {
  await run(`01-empty-${sfx}`, vp, async () => {})
  await run(`02-role-${sfx}`, vp, async (p) => { await s1(p); await s2(p) })
  await run(`03-missing-answers-${sfx}`, vp, async (p) => { await s1(p); await next(p); await next(p) })
  await run(`04-skills-${sfx}`, vp, async (p) => { await s1(p); await s2(p); await next(p); await s3(p); await next(p); await s4(p); await next(p); await s5(p) })
  await run(`05-review-${sfx}`, vp, all)
  await run(`06-submitted-${sfx}`, vp, submit)
  await run(`07-questions-draft-${sfx}`, vp, questions)
  await run(`08-apply-${sfx}`, vp, async (p) => { await questions(p); await p.getByRole('button', { name: /Publish to the event/ }).click(); await view('#/apply')(p) })
  await run(`09-staff-${sfx}`, vp, async (p) => { await view('#/staff')(p); await p.waitForTimeout(1500); await p.locator('.staff-score').first().click() })
  await run(`10-follow-up-${sfx}`, vp, view('#/outcomes'))
  await run(`11-meetings-${sfx}`, vp, view('#/meetings'))
  await run(`12-meetings-after-${sfx}`, vp, view('#/meetings?view=after'))
}
await browser.close()
console.log(`Saved to ${out}/`)
