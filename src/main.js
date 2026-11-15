import './style.css'
import { resolvePage } from './site.js'
import { createHeader } from './components/header.js'
import { createFooter } from './components/footer.js'
import { renderHomePage } from './pages/home.js'
import { renderCategoryPage } from './pages/category.js'
import { renderFavouritesPage } from './pages/favourites.js'
import { renderNotFoundPage } from './pages/not-found.js'
import { h } from './utils/dom.js'

// One renderer per page kind. Tool pages are added in Phase 2, so until then
// the URL of a tool that is not built resolves to the not-found page.
const renderers = {
  home: renderHomePage,
  category: renderCategoryPage,
  favourites: renderFavouritesPage,
  'not-found': renderNotFoundPage,
}

const page = resolvePage(window.location.pathname)
const render = renderers[page.kind] ?? renderNotFoundPage

document.querySelector('#app').replaceChildren(
  h('a', { class: 'skip-link', href: '#main' }, 'Skip to main content'),
  createHeader(page),
  h('main', { id: 'main', tabindex: '-1' }, render(page)),
  createFooter(),
)
