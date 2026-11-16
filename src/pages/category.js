import { getCategory, getToolsByCategory } from '../tools/registry.js'
import { createToolCard } from '../components/tool-card.js'
import { h } from '../utils/dom.js'

export function renderCategoryPage(page) {
  const category = getCategory(page.id)
  return h(
    'div',
    { class: 'container page' },
    h('div', { class: 'page-header' }, h('h1', {}, category.name), h('p', {}, category.pageDescription)),
    h('div', { class: 'grid' }, getToolsByCategory(category.id).map((tool) => createToolCard(tool, { level: 2 }))),
  )
}
