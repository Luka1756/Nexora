import { getCategory, isAvailable, toolPath } from '../tools/registry.js'
import { getFavourites, onStorageChange, toggleFavourite } from '../utils/storage.js'
import { h } from '../utils/dom.js'
import { icon } from './icons.js'
import { showToast } from './toast.js'

let listening = false

function setPressed(button, pressed) {
  button.setAttribute('aria-pressed', String(pressed))
}

// One shared listener keeps every star on the page in step with storage,
// including stars on other cards and changes made in another tab.
function keepFavouriteButtonsInSync() {
  if (listening) return
  listening = true
  onStorageChange(() => {
    const favourites = new Set(getFavourites())
    for (const button of document.querySelectorAll('.fav-button')) {
      setPressed(button, favourites.has(button.dataset.toolId))
    }
  })
}

function createFavouriteButton(tool) {
  const button = h(
    'button',
    {
      type: 'button',
      class: 'fav-button',
      'aria-label': `Favourite ${tool.name}`,
      'aria-pressed': String(getFavourites().includes(tool.id)),
      dataset: { toolId: tool.id },
      onClick: () => {
        const nowFavourite = toggleFavourite(tool.id)
        if (nowFavourite === null) showToast('Favourites could not be saved in this browser.')
      },
    },
    icon('Star', 18),
  )
  return button
}

/**
 * A tool card. Available tools link to their page; coming-soon tools are plain
 * text with a badge and are never linked. Both can be favourited.
 * `level` is the heading level for the title (2 or 3), chosen by the surrounding page.
 */
export function createToolCard(tool, { level = 3, showCategory = false } = {}) {
  keepFavouriteButtonsInSync()
  const available = isAvailable(tool)
  const title = available ? h('a', { href: toolPath(tool) }, tool.name) : tool.name
  const category = getCategory(tool.category)

  return h(
    'article',
    { class: `tool-card${available ? '' : ' is-coming-soon'}` },
    h('div', { class: 'tool-card-icon' }, icon(tool.icon, 22)),
    h(`h${level}`, { class: 'tool-card-title' }, title),
    h('p', { class: 'tool-card-description' }, tool.description),
    h(
      'div',
      { class: 'tool-card-meta' },
      available ? null : h('span', { class: 'badge' }, 'Coming soon'),
      showCategory ? h('span', {}, category.name) : null,
    ),
    createFavouriteButton(tool),
  )
}
