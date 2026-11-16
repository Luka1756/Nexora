// Central site configuration, read at build time (Node only, never shipped to the browser).
//
// SITE_URL is the production origin, e.g. "https://example.com" (no trailing slash).
// Set it here once the domain is final, or provide it per build with an environment
// variable:  SITE_URL=https://example.com npm run build
//
// While SITE_URL is empty, the build deliberately omits everything that needs an
// absolute URL: canonical links, og:url, sitemap.xml and the Sitemap line in robots.txt.
// This avoids publishing wrong URLs.
export const SITE_URL = (process.env.SITE_URL ?? '').trim().replace(/\/+$/, '')
