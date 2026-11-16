// Tests what cannot be seen while every tool is "coming soon": tool-page generation,
// the canonical/sitemap output, links to available tools, and "Recently used".
//
// It builds a throwaway copy of the project in the OS temp folder with one tool marked
// available. Your working tree and registry are never modified.

import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRecorder, VIEWPORTS, launchBrowser, newPage, serveStatic } from './harness.mjs'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const copy = await mkdtemp(path.join(tmpdir(), 'nexora-fixture-'))
const { check, report } = createRecorder()
let exitCode = 1

try {
  for (const entry of ['build', 'src', 'public', 'index.html', 'package.json', 'site.config.js', 'vite.config.js']) {
    await cp(path.join(repo, entry), path.join(copy, entry), { recursive: true })
  }
  await symlink(path.join(repo, 'node_modules'), path.join(copy, 'node_modules'), 'junction')

  const registryPath = path.join(copy, 'src/tools/registry.js')
  const registry = await readFile(registryPath, 'utf8')
  const start = registry.indexOf("id: 'image-converter'")
  const flagAt = registry.indexOf("status: 'coming-soon'", start)
  if (start < 0 || flagAt < 0) throw new Error('fixture: could not find image-converter in the registry')
  const flag = "status: 'coming-soon'"
  await writeFile(registryPath, registry.slice(0, flagAt) + "status: 'available'" + registry.slice(flagAt + flag.length))

  execFileSync(process.execPath, [path.join(copy, 'node_modules/vite/bin/vite.js'), 'build'], {
    cwd: copy,
    env: { ...process.env, SITE_URL: 'https://example.test' },
    stdio: 'pipe',
  })

  const dist = path.join(copy, 'dist')
  const toolHtml = await readFile(path.join(dist, 'tools/image-converter/index.html'), 'utf8')
  const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8')
  check('tool page is generated', toolHtml.includes('<title>Image Converter – Nexora</title>'))
  check('tool page has its own canonical', toolHtml.includes('<link rel="canonical" href="https://example.test/tools/image-converter/" />'))
  check('sitemap lists the tool page', sitemap.includes('<loc>https://example.test/tools/image-converter/</loc>'))
  check('sitemap still excludes favourites and 404', !sitemap.includes('favourites') && !sitemap.includes('404'))

  const site = await serveStatic(dist)
  const browser = await launchBrowser()
  const page = await newPage(await browser.newContext({ viewport: VIEWPORTS.desktop }))
  await page.goto(site.url + '/')
  await page.waitForSelector('#popular .tool-card')
  const link = page.locator('#popular .tool-card-title a')
  check('available tool becomes a link', (await link.count()) === 1 && (await link.getAttribute('href')) === '/tools/image-converter/')
  check('available tool has no Coming soon badge', (await page.locator('.tool-card', { hasText: 'Image Converter' }).locator('.badge').count()) === 0)
  check('category count reflects one available tool', (await page.locator('.category-count').first().textContent()).endsWith('1 available'))
  check('no Recently used section before any use', !(await page.locator('#recent-heading').isVisible()))

  // Recents only ever show tools that exist and are available.
  await page.evaluate(() => localStorage.setItem('nexora:recents', JSON.stringify(['pdf-merger', 'ghost', 'image-converter'])))
  await page.reload()
  await page.waitForSelector('#popular .tool-card')
  check('Recently used appears once a tool was used', await page.locator('#recent-heading').isVisible())
  const recent = await page.locator('section[aria-labelledby=recent-heading] .tool-card-title').allTextContents()
  check('only available tools are listed there', JSON.stringify(recent) === '["Image Converter"]', recent.join(','))
  await page.evaluate(() => localStorage.removeItem('nexora:recents'))
  await page.reload()
  await page.waitForSelector('#popular .tool-card')
  check('Recently used hides again when empty', !(await page.locator('#recent-heading').isVisible()))

  await page.locator('#tool-search').fill('image conv')
  await page.keyboard.press('Enter')
  await page.waitForURL('**/tools/image-converter/', { timeout: 5000 }).catch(() => {})
  check('Enter on an available search result navigates to it', new URL(page.url()).pathname === '/tools/image-converter/', page.url())
  const response = await page.goto(site.url + '/tools/image-converter/')
  check('generated tool page is served with 200', response.status() === 200)

  await browser.close()
  await site.close()
  exitCode = report('Fixture tests')
} catch (error) {
  console.error(error)
} finally {
  await rm(copy, { recursive: true, force: true })
}
process.exit(exitCode)
