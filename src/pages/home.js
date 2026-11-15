import { CATEGORIES, TOOLS, getPopularTools, getToolsByCategory, getTool, isAvailable } from '../tools/registry.js'
import { SITE_NAME, TAGLINE } from '../site.js'
import { createToolCard } from '../components/tool-card.js'
import { icon } from '../components/icons.js'
import { getRecents, onStorageChange } from '../utils/storage.js'
import { h } from '../utils/dom.js'

function createCategoryCard(category) {
  const tools = getToolsByCategory(category.id)
  const availableCount = tools.filter(isAvailable).length
  return h(
    'article',
    { class: 'category-card' },
    h('div', { class: 'tool-card-icon' }, icon(category.icon, 22)),
    h('h3', {}, h('a', { href: category.path }, category.name)),
    h('p', {}, category.description),
    h('p', { class: 'category-count' }, `${tools.length} tools · ${availableCount} available`),
  )
}

// Shown only after a tool has actually been used in this browser. Never pre-filled.
function createRecentSection() {
  const section = h('section', { class: 'section', 'aria-labelledby': 'recent-heading' })

  function render() {
    const tools = getRecents().map(getTool).filter((tool) => tool && isAvailable(tool))
    section.hidden = tools.length === 0
    section.replaceChildren(
      h('div', { class: 'section-header' }, h('h2', { id: 'recent-heading' }, 'Recently used')),
      h('div', { class: 'grid' }, tools.map((tool) => createToolCard(tool))),
    )
  }

  render()
  onStorageChange(render)
  return section
}

export function renderHomePage() {
  return h(
    'div',
    { class: 'container page' },
    h(
      'section',
      { class: 'hero' },
      // The site name is visually hidden: the wordmark already shows it, but the heading
      // should still identify the site when read on its own (screen readers, outline views).
      h('h1', {}, h('span', { class: 'sr-only' }, `${SITE_NAME}: `), TAGLINE),
      h(
        'p',
        { class: 'lead' },
        'Nexora is a collection of free tools for converting, editing and creating images, PDFs, audio and more, designed to run in your browser.',
      ),
      h(
        'p',
        { class: 'notice' },
        'Nexora is in early development. Tools are being released one at a time, and anything marked “Coming soon” is not available yet.',
      ),
      h(
        'div',
        { class: 'hero-actions' },
        h('a', { class: 'button button-primary', href: '#categories' }, 'Browse categories', icon('ArrowRight', 18)),
      ),
    ),
    createRecentSection(),
    h(
      'section',
      { class: 'section', id: 'popular', 'aria-labelledby': 'popular-heading' },
      h('div', { class: 'section-header' }, h('h2', { id: 'popular-heading' }, 'Popular tools')),
      h('div', { class: 'grid' }, getPopularTools().map((tool) => createToolCard(tool, { showCategory: true }))),
    ),
    h(
      'section',
      { class: 'section', id: 'categories', 'aria-labelledby': 'categories-heading' },
      h(
        'div',
        { class: 'section-header' },
        h('h2', { id: 'categories-heading' }, 'Categories'),
        h('p', {}, `${TOOLS.length} tools across three categories.`),
      ),
      h('div', { class: 'grid' }, CATEGORIES.map(createCategoryCard)),
    ),
  )
}
