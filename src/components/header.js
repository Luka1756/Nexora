import { PRIMARY_NAV } from '../site.js'
import { h } from '../utils/dom.js'
import { icon } from './icons.js'
import { createSearch } from './search.js'

export const createWordmark = () => h('a', { class: 'wordmark', href: '/', 'aria-label': 'Nexora home' }, 'Nex', h('span', {}, 'ora'))

export function createHeader(page) {
  const navId = 'site-nav'

  const nav = h(
    'nav',
    { id: navId, class: 'site-nav', 'aria-label': 'Main' },
    h(
      'ul',
      {},
      PRIMARY_NAV.map((item) =>
        h(
          'li',
          {},
          h('a', { href: item.path, 'aria-current': item.id === page.id ? 'page' : null }, item.label),
        ),
      ),
    ),
  )

  const toggle = h(
    'button',
    {
      type: 'button',
      class: 'menu-toggle',
      'aria-controls': navId,
      'aria-expanded': 'false',
      'aria-label': 'Menu',
    },
    icon('Menu', 20),
  )

  function setOpen(open) {
    nav.classList.toggle('is-open', open)
    toggle.setAttribute('aria-expanded', String(open))
    toggle.replaceChildren(icon(open ? 'X' : 'Menu', 20))
  }

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'))
  nav.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false)
      toggle.focus()
    }
  })

  return h(
    'header',
    { class: 'site-header' },
    h('div', { class: 'container header-inner' }, createWordmark(), toggle, createSearch(), nav),
  )
}
