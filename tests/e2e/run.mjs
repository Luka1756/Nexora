// Browser tests for the built site (dist/). Run with `npm run test:e2e`.
//
// Covers: every page at mobile/tablet/desktop in light and dark mode (status, one h1,
// no horizontal overflow, no console errors, axe accessibility scan), navigation, the
// mobile menu, search, favourites (including cross-tab sync and bad stored data),
// keyboard focus, not-found handling and a 320px width.
//
// Set SHOTS_DIR=some/folder to also save full-page screenshots.

import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { VIEWPORTS, axeSource, createRecorder, launchBrowser, newPage, serveStatic } from './harness.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist')
if (!existsSync(path.join(root, 'index.html'))) {
  console.error('dist/ not found. Run `npm run build` first (or use `npm run test:e2e`).')
  process.exit(2)
}

const shotsDir = process.env.SHOTS_DIR ? path.resolve(process.env.SHOTS_DIR) : ''
if (shotsDir) await mkdir(shotsDir, { recursive: true })

const ROUTES = ['/', '/convert/', '/edit/', '/create/', '/favourites/']
const HOME_HEADING = 'Nexora: Create. Convert. Simplify.'

const { check, report } = createRecorder()
const site = await serveStatic(root)
const browser = await launchBrowser()
const BASE = site.url
console.log(`Chrome ${browser.version()} against ${root}`)

// ── 1. Every page, every viewport, light and dark ───────────────────
for (const scheme of ['light', 'dark']) {
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ viewport, colorScheme: scheme })
    const page = await newPage(context)
    for (const route of ROUTES) {
      const tag = `[${scheme}/${viewportName}${route}]`
      const response = await page.goto(BASE + route)
      check(`${tag} status 200`, response.status() === 200, response.status())
      await page.waitForSelector('main#main h1')
      check(`${tag} exactly one h1`, (await page.locator('h1').count()) === 1)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      check(`${tag} no horizontal overflow`, overflow <= 0, `${overflow}px`)
      check(`${tag} no console errors`, page.errors.length === 0, page.errors.join(' | '))
      check(`${tag} title names the site`, (await page.title()).includes('Nexora'))
      await page.evaluate(axeSource)
      const violations = await page.evaluate(async () =>
        (await window.axe.run(document, { resultTypes: ['violations'] })).violations.map(
          (violation) => `${violation.id}(${violation.nodes.length}): ${violation.nodes[0].target}`,
        ),
      )
      check(`${tag} axe violations`, violations.length === 0, violations.join('; '))
      if (shotsDir) {
        const name = `${scheme}-${viewportName}-${route.replaceAll('/', '_') || '_'}.png`
        await page.screenshot({ path: path.join(shotsDir, name), fullPage: true })
      }
    }
    await context.close()
  }
}

// ── 2. Headings, navigation and page content (desktop) ──────────────
{
  const context = await browser.newContext({ viewport: VIEWPORTS.desktop })
  const page = await newPage(context)
  await page.goto(BASE + '/')
  await page.waitForSelector('main h1')
  check('home h1 accessible name names the site', (await page.getByRole('heading', { level: 1, name: HOME_HEADING }).count()) === 1)
  // innerText includes visually hidden text, so compare the text outside the .sr-only span.
  check('home h1 shows only the tagline visibly', (await page.locator('h1').evaluate((h1) => [...h1.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent).join('')) ) === 'Create. Convert. Simplify.' && (await page.locator('h1 .sr-only').textContent()) === 'Nexora: ')
  const navLinks = await page.locator('.site-nav a').allTextContents()
  check('desktop nav items', JSON.stringify(navLinks) === JSON.stringify(['Home', 'Convert', 'Edit', 'Create', 'Favourites']), navLinks.join(','))
  check('desktop menu toggle hidden', !(await page.locator('.menu-toggle').isVisible()))
  for (const [label, route] of [['Convert', '/convert/'], ['Edit', '/edit/'], ['Create', '/create/'], ['Favourites', '/favourites/'], ['Home', '/']]) {
    await page.locator('.site-nav').getByRole('link', { name: label, exact: true }).click()
    await page.waitForSelector('main h1')
    check(`nav ${label} -> ${route}`, new URL(page.url()).pathname === route, page.url())
    check(`nav ${label} marks current page`, (await page.locator('.site-nav a[aria-current="page"]').textContent()) === label)
  }
  await page.locator('.category-card h3 a', { hasText: 'Edit' }).click()
  await page.waitForSelector('main h1')
  check('category card links to its page', new URL(page.url()).pathname === '/edit/')
  check('edit page lists 7 tools', (await page.locator('.tool-card').count()) === 7)
  await page.goto(BASE + '/create/')
  await page.waitForSelector('.tool-card')
  check('create page lists 3 tools', (await page.locator('.tool-card').count()) === 3)
  await page.goto(BASE + '/convert/')
  await page.waitForSelector('.tool-card')
  check('convert page lists 5 tools', (await page.locator('.tool-card').count()) === 5)
  check('no card is a link while every tool is coming soon', (await page.locator('.tool-card-title a').count()) === 0)
  check('every card shows a visible Coming soon badge', (await page.locator('.tool-card .badge:visible', { hasText: 'Coming soon' }).count()) === 5)
  await page.goto(BASE + '/')
  await page.waitForSelector('.hero')
  check('home: 6 popular cards', (await page.locator('#popular .tool-card').count()) === 6)
  check('home: 3 category cards', (await page.locator('.category-card').count()) === 3)
  check('home: no recently-used section by default', !(await page.locator('#recent-heading').isVisible()))
  check('home: category counts are honest', (await page.locator('.category-count').allTextContents()).every((text) => text.endsWith('0 available')))
  await page.getByRole('link', { name: 'Browse categories' }).click()
  check('hero button jumps to categories', page.url().endsWith('#categories'))
  for (const route of ['/nope/', '/tools/image-converter/', '/tools/']) {
    const response = await page.goto(BASE + route)
    await page.waitForSelector('main h1')
    check(`${route} responds 404`, response.status() === 404, response.status())
    check(`${route} shows the not-found page`, (await page.locator('h1').textContent()) === 'Page not found')
  }
  await context.close()
}

// ── 3. Mobile menu ──────────────────────────────────────────────────
{
  const context = await browser.newContext({ viewport: VIEWPORTS.mobile })
  const page = await newPage(context)
  await page.goto(BASE + '/')
  await page.waitForSelector('main h1')
  const toggle = page.locator('.menu-toggle')
  check('mobile toggle visible', await toggle.isVisible())
  check('mobile nav closed initially', !(await page.locator('.site-nav').isVisible()) && (await toggle.getAttribute('aria-expanded')) === 'false')
  await toggle.click()
  check('mobile nav opens', (await page.locator('.site-nav').isVisible()) && (await toggle.getAttribute('aria-expanded')) === 'true')
  await page.locator('.site-nav a').first().focus()
  await page.keyboard.press('Escape')
  check('Escape closes the menu and returns focus to the toggle', !(await page.locator('.site-nav').isVisible()) && (await page.evaluate(() => document.activeElement.className)) === 'menu-toggle')
  await toggle.click()
  await page.locator('.site-nav').getByRole('link', { name: 'Create' }).click()
  await page.waitForSelector('main h1')
  check('mobile nav navigates', new URL(page.url()).pathname === '/create/')
  check('search is visible without opening the menu', await page.locator('#tool-search').isVisible())
  await context.close()
}

// ── 4. Search (desktop and mobile) ──────────────────────────────────
for (const viewportName of ['desktop', 'mobile']) {
  const context = await browser.newContext({ viewport: VIEWPORTS[viewportName] })
  const page = await newPage(context)
  await page.goto(BASE + '/')
  await page.waitForSelector('main h1')
  const input = page.locator('#tool-search')
  const tag = `[search/${viewportName}]`
  check(`${tag} combobox semantics`, (await input.getAttribute('role')) === 'combobox' && (await input.getAttribute('aria-expanded')) === 'false')
  await input.fill('pdf')
  const names = await page.locator('.search-option .search-option-name').allTextContents()
  check(`${tag} "pdf" finds the 5 PDF tools`, names.length === 5 && ['Image to PDF', 'PDF to Image', 'PDF Merger', 'PDF Splitter', 'PDF Compressor'].every((name) => names.includes(name)), names.join(','))
  check(`${tag} results show a visible Coming soon badge`, (await page.locator('.search-option .badge:visible', { hasText: 'Coming soon' }).count()) === 5)
  check(`${tag} aria-expanded true when open`, (await input.getAttribute('aria-expanded')) === 'true')
  check(`${tag} panel stays inside the viewport`, await page.evaluate(() => { const box = document.querySelector('.search-panel').getBoundingClientRect(); return box.left >= 0 && box.right <= window.innerWidth }))
  await page.keyboard.press('ArrowDown')
  const first = await input.getAttribute('aria-activedescendant')
  await page.keyboard.press('ArrowDown')
  const second = await input.getAttribute('aria-activedescendant')
  check(`${tag} arrow keys move the active option`, first === 'search-option-0' && second === 'search-option-1', `${first} ${second}`)
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  check(`${tag} arrow up wraps to the last option`, (await input.getAttribute('aria-activedescendant')) === 'search-option-4')
  const before = page.url()
  await page.keyboard.press('Enter')
  check(`${tag} Enter on a coming-soon tool shows a message and stays put`, (await page.locator('.toast').isVisible()) && /coming soon/i.test(await page.locator('.toast').textContent()) && page.url() === before)
  await page.keyboard.press('Escape')
  check(`${tag} Escape closes the panel`, (await input.getAttribute('aria-expanded')) === 'false' && !(await page.locator('.search-panel').isVisible()))
  check(`${tag} first Escape keeps the text`, (await input.inputValue()) === 'pdf')
  await page.keyboard.press('Escape')
  check(`${tag} second Escape clears it`, (await input.inputValue()) === '')
  await input.fill('zzzzqq')
  check(`${tag} no-match message`, (await page.locator('.search-empty').textContent()).includes('zzzzqq'))
  await input.fill('<img src=x onerror=window.__xss=1>')
  check(`${tag} markup in the query stays inert`, (await page.locator('.search-panel img').count()) === 0 && !(await page.evaluate(() => window.__xss)))
  await input.fill('colour')
  check(`${tag} British spelling finds the palette tool`, (await page.locator('.search-option-name').allTextContents()).includes('Colour Palette Generator'))
  await page.locator('.footer-legal').click()
  check(`${tag} clicking outside closes the panel`, !(await page.locator('.search-panel').isVisible()))
  await input.fill('qr')
  await page.locator('.search-option').first().click({ force: true }) // aria-disabled: Playwright would otherwise refuse
  check(`${tag} clicking a coming-soon option shows a message`, await page.locator('.toast').isVisible())
  await page.keyboard.press('Escape')
  await input.fill('')
  await page.locator('.footer-legal').click()
  await page.keyboard.press('/')
  check(`${tag} "/" focuses search`, (await page.evaluate(() => document.activeElement.id)) === 'tool-search')
  await page.keyboard.type('/')
  check(`${tag} "/" typed inside the field is kept`, (await input.inputValue()) === '/')
  await context.close()
}

// ── 5. Favourites ───────────────────────────────────────────────────
{
  const context = await browser.newContext({ viewport: VIEWPORTS.desktop })
  const page = await newPage(context)
  await page.goto(BASE + '/favourites/')
  await page.waitForSelector('main h1')
  check('favourites: empty state at first', (await page.locator('.empty-state').count()) === 1 && (await page.locator('.tool-card').count()) === 0)
  await page.goto(BASE + '/')
  await page.waitForSelector('#popular .tool-card')
  const star = page.getByRole('button', { name: 'Favourite Image Converter' })
  check('star starts unpressed', (await star.getAttribute('aria-pressed')) === 'false')
  await star.click()
  check('star is pressed after clicking', (await star.getAttribute('aria-pressed')) === 'true')
  check('saved in localStorage', (await page.evaluate(() => localStorage.getItem('nexora:favourites'))) === '["image-converter"]')
  const second = page.getByRole('button', { name: 'Favourite PDF Merger' })
  await second.focus()
  await page.keyboard.press('Enter')
  check('Enter toggles a star', (await second.getAttribute('aria-pressed')) === 'true')
  await page.keyboard.press('Space')
  check('Space toggles it back', (await second.getAttribute('aria-pressed')) === 'false')
  await page.reload()
  await page.waitForSelector('#popular .tool-card')
  check('favourite survives a reload', (await page.getByRole('button', { name: 'Favourite Image Converter' }).getAttribute('aria-pressed')) === 'true')
  await page.goto(BASE + '/convert/')
  await page.waitForSelector('.tool-card')
  check('state shows on the category page', (await page.getByRole('button', { name: 'Favourite Image Converter' }).getAttribute('aria-pressed')) === 'true')
  await page.getByRole('button', { name: 'Favourite Audio Converter' }).click()
  await page.goto(BASE + '/favourites/')
  await page.waitForSelector('.tool-card')
  const favouriteNames = await page.locator('.tool-card-title').allTextContents()
  check('favourites page lists saved tools in order', JSON.stringify(favouriteNames) === JSON.stringify(['Image Converter', 'Audio Converter']), favouriteNames.join(','))
  check('favourited coming-soon tools show a visible Coming soon badge', (await page.locator('.tool-card .badge:visible', { hasText: 'Coming soon' }).count()) === 2)
  check('favourited coming-soon tools are not links', (await page.locator('.tool-card-title a').count()) === 0)
  // Changes made in another tab reach this page.
  const other = await newPage(context)
  await other.goto(BASE + '/')
  await other.waitForSelector('#popular .tool-card')
  await other.getByRole('button', { name: 'Favourite Image Converter' }).click()
  await page.waitForFunction(() => document.querySelectorAll('.tool-card').length === 1, null, { timeout: 3000 }).catch(() => {})
  check('another tab removing a favourite updates this page', (await page.locator('.tool-card').count()) === 1)
  await other.close()
  await page.getByRole('button', { name: 'Favourite Audio Converter' }).click()
  check('removing the last favourite shows the empty state', (await page.locator('.empty-state').count()) === 1)
  check('removal is announced', await page.locator('.toast').isVisible())
  await page.goto(BASE + '/convert/')
  await page.waitForSelector('.tool-card')
  await page.getByRole('button', { name: 'Favourite Image Converter' }).click()
  await page.getByRole('button', { name: 'Favourite SVG Converter' }).click()
  await page.goto(BASE + '/favourites/')
  await page.waitForSelector('.tool-card')
  await page.getByRole('button', { name: 'Favourite Image Converter' }).click()
  check('removing one keeps the other', (await page.locator('.tool-card').count()) === 1)
  check('focus stays in the list after removal', await page.evaluate(() => document.activeElement.classList.contains('fav-button')))
  await page.evaluate(() => localStorage.setItem('nexora:favourites', '{broken'))
  await page.reload()
  await page.waitForSelector('main h1')
  check('corrupt stored data does not break the page', (await page.locator('.empty-state').count()) === 1 && page.errors.length === 0, page.errors.join('|'))
  await page.evaluate(() => localStorage.setItem('nexora:favourites', '["ghost-tool", 3, "svg-converter"]'))
  await page.reload()
  await page.waitForSelector('main h1')
  check('unknown ids are ignored', (await page.locator('.tool-card').count()) === 1)
  await context.close()
}

// ── 6. Keyboard focus ───────────────────────────────────────────────
{
  const context = await browser.newContext({ viewport: VIEWPORTS.desktop })
  const page = await newPage(context)
  await page.goto(BASE + '/')
  await page.waitForSelector('main h1')
  await page.keyboard.press('Tab')
  check('first Tab stop is the skip link', (await page.evaluate(() => document.activeElement.className)) === 'skip-link')
  await page.keyboard.press('Enter')
  check('skip link moves to the main content', (await page.evaluate(() => location.hash)) === '#main')
  await page.goto(BASE + '/')
  await page.waitForSelector('main h1')
  const withoutIndicator = []
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab')
    const stop = await page.evaluate(() => {
      const element = document.activeElement
      const own = getComputedStyle(element).outlineStyle !== 'none'
      const stretched = getComputedStyle(element, '::after').outlineStyle !== 'none'
      return { tag: element.tagName, label: (element.getAttribute('aria-label') || element.textContent).trim().slice(0, 30), shown: own || stretched || element.classList.contains('search-input') }
    })
    if (stop.tag !== 'BODY' && !stop.shown) withoutIndicator.push(stop)
  }
  check('every focusable element shows a focus indicator', withoutIndicator.length === 0, JSON.stringify(withoutIndicator.slice(0, 3)))
  await context.close()
}

// ── 7. Very narrow screen ───────────────────────────────────────────
{
  const context = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'reduce' })
  const page = await newPage(context)
  for (const route of ROUTES) {
    await page.goto(BASE + route)
    await page.waitForSelector('main h1')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    check(`320px wide: no overflow on ${route}`, overflow <= 0, `${overflow}px`)
  }
  await context.close()
}

await browser.close()
await site.close()
process.exit(report('Browser tests'))
