# Nexora

**Create. Convert. Simplify.**

Nexora is a browser-first collection of tools for converting, editing and creating images, PDFs, audio and more. Tools run locally in the browser; there is no backend.

Stack: Vite, vanilla JavaScript, HTML5, CSS3. Icons from [Lucide](https://lucide.dev).

## Commands

```bash
npm install
npm run dev        # development server
npm run build      # production build into dist/
npm run preview    # serve the production build
npm test           # unit tests (Node's built-in test runner)
npm run test:e2e   # builds, then runs the browser tests (needs Google Chrome)
```

Requires Node `^20.19.0 || >=22.12.0`. See [docs/testing.md](docs/testing.md) for what the tests cover and how to reproduce them.

## How the site is built

Every page is a real HTML file with its own URL (`/`, `/convert/`, `/edit/`, `/create/`, `/favourites/`, and `/tools/<id>/` for each available tool), so pages can be indexed and shared.

- `src/tools/registry.js` is the single source of truth for categories and tools. The homepage, category pages, search, favourites, sitemap and tool pages are all derived from it.
- `src/site.js` lists the pages. `build/pages-plugin.js` turns that list into HTML files at build time (title, description, Open Graph, canonical, a readable fallback inside `#app`) plus `robots.txt` and `sitemap.xml`.
- `src/main.js` renders the interactive page for the current URL using small DOM helpers (`src/utils/dom.js`). User-controlled strings are always inserted as text, never as markup.
- Favourites and recently used tools live in this browser's `localStorage` only. "Recently used" stays empty until a tool records real use with `recordRecent(id)`.

```text
build/            page generator (Vite plugin)
public/           static files copied as-is
src/components/   header, search, tool card, footer, icons, toast
src/pages/        home, category, favourites, not-found
src/styles/       tokens, base, layout, components
src/tools/        registry (tool implementations will live in convert/, edit/, create/)
src/utils/        dom, storage, search
tests/            unit tests (*.test.js) and browser tests (e2e/)
site.config.js    SITE_URL
```

## Setting the production URL

Canonical links, `og:url` and `sitemap.xml` need the final domain. Until it is set they are left out on purpose, and the build prints a warning.

```bash
SITE_URL=https://your-domain.example npm run build
```

or set the default in `site.config.js`.

## Adding a tool

1. Add or edit its entry in `src/tools/registry.js`. New tools start as `status: 'coming-soon'`.
2. Implement the tool, then change its status to `'available'` in the same change. That creates its page, its link and its sitemap entry, and removes the "Coming soon" badge. Never mark a tool available before it works.
3. Call `recordRecent(tool.id)` when the user actually runs the tool.
