// Vite plugin that turns the page list in src/site.js into real, static HTML files.
//
// index.html is the template. It contains two placeholders:
//   <!--nexora:head-->      replaced with <title>, description, canonical, Open Graph
//   <!--nexora:fallback-->  replaced with a small readable fallback inside #app
// The browser app (src/main.js) renders the interactive page over the fallback.
//
// Dev:   the placeholders are filled per request, based on the URL.
// Build: after Vite has emitted dist/index.html, one HTML file is written per page,
//        plus robots.txt and (only when SITE_URL is set) sitemap.xml.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getPages, resolvePage, PRIMARY_NAV, SITE_NAME } from '../src/site.js'

const HEAD_PLACEHOLDER = '<!--nexora:head-->'
const FALLBACK_PLACEHOLDER = '<!--nexora:fallback-->'

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

function renderHead(page, siteUrl) {
  const absoluteUrl = siteUrl ? `${siteUrl}${page.path}` : ''
  const tags = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    page.indexable ? '' : '<meta name="robots" content="noindex" />',
    page.indexable && absoluteUrl ? `<link rel="canonical" href="${escapeHtml(absoluteUrl)}" />` : '',
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    page.indexable && absoluteUrl ? `<meta property="og:url" content="${escapeHtml(absoluteUrl)}" />` : '',
    '<meta name="twitter:card" content="summary" />',
  ]
  return tags.filter(Boolean).join('\n    ')
}

function renderFallback(page) {
  const links = PRIMARY_NAV.map(
    (item) => `<li><a href="${escapeHtml(item.path)}">${escapeHtml(item.label)}</a></li>`,
  ).join('')
  return [
    '<main>',
    `<h1>${escapeHtml(page.heading)}</h1>`,
    `<p>${escapeHtml(page.description)}</p>`,
    `<nav aria-label="Main"><ul>${links}</ul></nav>`,
    '<noscript><p>Nexora needs JavaScript to run its tools.</p></noscript>',
    '</main>',
  ].join('')
}

const fillTemplate = (html, page, siteUrl) =>
  html
    .replace(HEAD_PLACEHOLDER, renderHead(page, siteUrl))
    .replace(FALLBACK_PLACEHOLDER, renderFallback(page))

// '/' -> index.html, '/convert/' -> convert/index.html, '/404.html' -> 404.html
const outputFileFor = (pagePath) =>
  pagePath.endsWith('.html') ? pagePath.slice(1) : `${pagePath.slice(1)}index.html`

function renderSitemap(pages, siteUrl) {
  const urls = pages
    .filter((page) => page.indexable)
    .map((page) => `  <url><loc>${escapeHtml(siteUrl + page.path)}</loc></url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

function renderRobots(siteUrl) {
  const lines = ['User-agent: *', 'Allow: /']
  if (siteUrl) lines.push('', `Sitemap: ${siteUrl}/sitemap.xml`)
  return `${lines.join('\n')}\n`
}

export default function nexoraPages({ siteUrl = '' } = {}) {
  let config

  return {
    name: 'nexora-pages',

    configResolved(resolved) {
      config = resolved
    },

    transformIndexHtml(html, context) {
      // Build: leave the placeholders; writeBundle fills them once per page.
      if (!context.server) return html
      const { pathname } = new URL(context.originalUrl ?? '/', 'http://localhost')
      return fillTemplate(html, resolvePage(pathname), siteUrl)
    },

    async writeBundle() {
      const outDir = path.resolve(config.root, config.build.outDir)
      const template = await readFile(path.join(outDir, 'index.html'), 'utf8')
      if (!template.includes(HEAD_PLACEHOLDER) || !template.includes(FALLBACK_PLACEHOLDER)) {
        throw new Error('nexora-pages: placeholders are missing from the built index.html')
      }

      const pages = getPages()
      for (const page of pages) {
        const file = path.join(outDir, outputFileFor(page.path))
        await mkdir(path.dirname(file), { recursive: true })
        await writeFile(file, fillTemplate(template, page, siteUrl))
      }

      await writeFile(path.join(outDir, 'robots.txt'), renderRobots(siteUrl))

      if (siteUrl) {
        await writeFile(path.join(outDir, 'sitemap.xml'), renderSitemap(pages, siteUrl))
      } else {
        config.logger.warn(
          '\n[nexora] SITE_URL is not set: canonical links, og:url and sitemap.xml were omitted.\n' +
            '         Set it in site.config.js or with SITE_URL=https://your-domain npm run build.\n',
        )
      }
    },
  }
}
