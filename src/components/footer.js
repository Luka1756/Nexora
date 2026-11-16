import { PRIMARY_NAV, TAGLINE } from '../site.js'
import { h } from '../utils/dom.js'
import { createWordmark } from './header.js'

export function createFooter() {
  return h(
    'footer',
    { class: 'site-footer' },
    h(
      'div',
      { class: 'container' },
      h(
        'div',
        { class: 'footer-inner' },
        h(
          'div',
          { class: 'footer-about' },
          createWordmark(),
          h('p', {}, TAGLINE),
          h(
            'p',
            {},
            'Nexora tools are built to run in your browser, so your files stay on your device unless a tool clearly says otherwise.',
          ),
        ),
        h(
          'nav',
          { class: 'footer-nav', 'aria-label': 'Footer' },
          h(
            'ul',
            {},
            PRIMARY_NAV.map((item) => h('li', {}, h('a', { href: item.path }, item.label))),
          ),
        ),
      ),
      h('p', { class: 'footer-legal' }, `© ${new Date().getFullYear()} Nexora`),
    ),
  )
}
