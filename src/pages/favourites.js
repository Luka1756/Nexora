import { getTool } from '../tools/registry.js'
import { createToolCard } from '../components/tool-card.js'
import { showToast } from '../components/toast.js'
import { getFavourites, onStorageChange } from '../utils/storage.js'
import { h } from '../utils/dom.js'

export function renderFavouritesPage() {
  const content = h('div')
  let knownCount = null

  function render() {
    const tools = getFavourites().map(getTool).filter(Boolean)
    const removed = knownCount !== null && tools.length < knownCount
    knownCount = tools.length

    if (tools.length === 0) {
      const message = h(
        'div',
        { class: 'empty-state', tabindex: '-1' },
        h('p', {}, 'You have no favourites yet.'),
        h('p', {}, 'Use the star on any tool to save it here. Favourites are stored in this browser only.'),
        h('p', {}, h('a', { href: '/#popular' }, 'Browse popular tools')),
      )
      content.replaceChildren(message)
      if (removed) {
        message.focus()
        showToast('Removed from favourites.')
      }
      return
    }

    const hadFocusInside = content.contains(document.activeElement)
    content.replaceChildren(
      h('div', { class: 'grid' }, tools.map((tool) => createToolCard(tool, { level: 2, showCategory: true }))),
    )
    if (removed) {
      showToast('Removed from favourites.')
      if (hadFocusInside) content.querySelector('.fav-button')?.focus()
    }
  }

  render()
  onStorageChange(render)

  return h(
    'div',
    { class: 'container page' },
    h(
      'div',
      { class: 'page-header' },
      h('h1', {}, 'Favourites'),
      h('p', {}, 'Tools you have saved in this browser.'),
    ),
    content,
  )
}
