# Testing

## Unit tests

```bash
npm test
```

Runs `tests/*.test.js` with Node's built-in runner (no extra dependencies): registry integrity, page resolution, search ranking, and favourites/recents storage (including corrupt data and blocked storage).

## Browser tests

```bash
npm run test:e2e
```

This builds the site, then runs two scripts in headless Chrome against `dist/`:

- `tests/e2e/run.mjs` checks the real site as built.
- `tests/e2e/fixture.mjs` builds a throwaway copy in the OS temp folder with one tool marked available, to test what is invisible while every tool is "coming soon" (tool-page generation, canonical and sitemap output, links, "Recently used"). Your working tree is never modified.

Both use a small static server (`tests/e2e/harness.mjs`) that behaves like production hosting: directory index files, trailing-slash redirects, and a real 404 status with `404.html`.

### Requirements

- Google Chrome installed. The tests use `playwright-core` (no browser download). To use another Chrome or Chromium, set `CHROME_PATH=/path/to/chrome`.
- Dev dependencies only: `playwright-core` and `axe-core`.
- Optional: `SHOTS_DIR=./shots npm run test:e2e` saves full-page screenshots of every page, viewport and colour scheme.

### What `run.mjs` covers

- Every page (`/`, `/convert/`, `/edit/`, `/create/`, `/favourites/`) at 375, 768 and 1280 px, in light and dark mode: HTTP 200, exactly one `h1`, no horizontal overflow, no console errors, correct title, and zero axe-core accessibility violations.
- Homepage heading: accessible name is "Nexora: Create. Convert. Simplify."; the visible text is the tagline.
- Navigation on desktop and mobile, the mobile menu (open, Escape, focus return), and unknown URLs returning a real 404 page.
- Search: combobox semantics, ranking, arrow keys, Enter, Escape, outside click, the `/` shortcut, no-match message, hostile input staying inert, and a visible "Coming soon" badge on unfinished results.
- Favourites: toggling by mouse and keyboard, persistence, order, cross-tab updates, empty state, focus after removal, corrupt or unknown stored data, and visible "Coming soon" status on favourited unfinished tools.
- Keyboard: skip link, and a visible focus indicator on every tab stop.
- A 320 px wide screen with reduced motion.

### Baseline

Recorded 2026-11-16 on Chrome 153, Node 22, for the Phase 1 branch:

| Suite | Result |
|---|---|
| Unit tests | 19 passed, 0 failed |
| Browser tests (`run.mjs`) | 279 passed, 0 failed |
| Fixture tests (`fixture.mjs`) | 13 passed, 0 failed |

Exact counts will change as pages and tools are added; what matters is that the failure count stays at zero.

### When a test fails

Failures print as `FAIL <page/viewport> <check> -> <detail>`. Run `SHOTS_DIR=./shots npm run test:e2e` to see the pages. Playwright refuses to click elements marked `aria-disabled`; the tests use `click({ force: true })` where a real user can still click them.
