import test from 'node:test'
import assert from 'node:assert/strict'
import { CATEGORIES, TOOLS, isAvailable } from '../src/tools/registry.js'
import { SITE_NAME, getPages, resolvePage } from '../src/site.js'

test('registry has the 15 MVP tools with unique ids', () => {
  assert.equal(TOOLS.length, 15)
  assert.equal(new Set(TOOLS.map((tool) => tool.id)).size, TOOLS.length)
})

test('every tool belongs to a known category and has the required fields', () => {
  const categoryIds = new Set(CATEGORIES.map((category) => category.id))
  for (const tool of TOOLS) {
    assert.ok(categoryIds.has(tool.category), `${tool.id}: unknown category`)
    assert.ok(tool.name && tool.description && tool.icon, `${tool.id}: missing field`)
    assert.ok(Array.isArray(tool.keywords) && tool.keywords.length > 0, `${tool.id}: no keywords`)
    assert.ok(['available', 'coming-soon'].includes(tool.status), `${tool.id}: bad status`)
  }
})

test('category split matches the brief: 5 convert, 7 edit, 3 create', () => {
  const count = (id) => TOOLS.filter((tool) => tool.category === id).length
  assert.deepEqual([count('convert'), count('edit'), count('create')], [5, 7, 3])
})

test('pages have unique paths and tool pages exist only for available tools', () => {
  const pages = getPages()
  assert.equal(new Set(pages.map((page) => page.path)).size, pages.length)
  const toolPages = pages.filter((page) => page.kind === 'tool')
  assert.equal(toolPages.length, TOOLS.filter(isAvailable).length)
})

test('resolvePage normalises paths and falls back to not-found', () => {
  assert.equal(resolvePage('/').id, 'home')
  assert.equal(resolvePage('/convert').id, 'convert')
  assert.equal(resolvePage('/convert/index.html').id, 'convert')
  assert.equal(resolvePage('/nope/').id, 'not-found')
  // A coming-soon tool has no page, so its URL is not-found.
  assert.equal(resolvePage('/tools/image-converter/').id, 'not-found')
})

test('every icon named in the registry exists in the icon set', async () => {
  const { ICON_NAMES } = await import('../src/components/icons.js')
  const used = [...CATEGORIES, ...TOOLS].map((entry) => entry.icon)
  for (const name of used) assert.ok(ICON_NAMES.includes(name), `missing icon: ${name}`)
})

test('the homepage heading names the site, so the static fallback and the app agree', () => {
  const home = getPages().find((page) => page.id === 'home')
  assert.ok(home.heading.startsWith(`${SITE_NAME}:`))
  assert.ok(home.title.includes(SITE_NAME))
})
