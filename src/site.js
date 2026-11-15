// Site-wide constants and the list of real pages.
// Pure data and helpers, shared by the browser app and the build-time page generator.

import { CATEGORIES, TOOLS, isAvailable, toolPath } from './tools/registry.js'

export const SITE_NAME = 'Nexora'
export const TAGLINE = 'Create. Convert. Simplify.'

export const PRIMARY_NAV = [
  { id: 'home', label: 'Home', path: '/' },
  ...CATEGORIES.map((category) => ({
    id: category.id,
    label: category.name,
    path: category.path,
  })),
  { id: 'favourites', label: 'Favourites', path: '/favourites/' },
]

const NOT_FOUND_PAGE = {
  id: 'not-found',
  kind: 'not-found',
  path: '/404.html',
  heading: 'Page not found',
  title: `Page not found – ${SITE_NAME}`,
  description: 'The page you were looking for does not exist.',
  indexable: false,
}

// Every page that gets its own HTML file at build time.
// Tool pages exist only for tools that are actually available.
export function getPages() {
  return [
    {
      id: 'home',
      kind: 'home',
      path: '/',
      heading: `${SITE_NAME}: ${TAGLINE}`,
      title: `${SITE_NAME} – ${TAGLINE}`,
      description:
        'Free online tools to convert, compress, edit and create images, PDFs, audio and more. Built to work in your browser.',
      indexable: true,
    },
    ...CATEGORIES.map((category) => ({
      id: category.id,
      kind: 'category',
      path: category.path,
      heading: category.name,
      title: `${category.name} tools – ${SITE_NAME}`,
      description: category.pageDescription,
      indexable: true,
    })),
    {
      id: 'favourites',
      kind: 'favourites',
      path: '/favourites/',
      heading: 'Favourites',
      title: `Favourites – ${SITE_NAME}`,
      description: 'Your saved tools, stored in this browser.',
      // The content depends on this browser's saved data, so it is not useful to index.
      indexable: false,
    },
    ...TOOLS.filter(isAvailable).map((tool) => ({
      id: tool.id,
      kind: 'tool',
      path: toolPath(tool),
      heading: tool.name,
      title: `${tool.name} – ${SITE_NAME}`,
      description: tool.description,
      indexable: true,
    })),
    NOT_FOUND_PAGE,
  ]
}

// Maps a URL pathname to a page. Unknown paths resolve to the not-found page.
export function resolvePage(pathname) {
  let path = pathname.replace(/index\.html$/, '')
  if (!path.endsWith('/') && !path.endsWith('.html')) path += '/'
  return getPages().find((page) => page.path === path) ?? NOT_FOUND_PAGE
}
