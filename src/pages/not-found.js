import { h } from '../utils/dom.js'

export function renderNotFoundPage() {
  return h(
    'div',
    { class: 'container page' },
    h(
      'div',
      { class: 'page-header' },
      h('h1', {}, 'Page not found'),
      h('p', {}, 'The page you were looking for does not exist, or the tool is not available yet.'),
    ),
    h('a', { class: 'button button-primary', href: '/' }, 'Back to the homepage'),
  )
}
