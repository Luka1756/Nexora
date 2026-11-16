// Shared helpers for the browser tests: a production-like static server,
// Chrome launching, and a tiny pass/fail recorder.

import { createRequire } from 'node:module'
import { readFile, stat } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { chromium } from 'playwright-core'

const require = createRequire(import.meta.url)

export const axeSource = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8')

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
}

/**
 * Serves a built site the way static hosting does: directory index files, a redirect to the
 * trailing-slash form, and a real 404 status with 404.html for unknown paths.
 * Listens on a free port. Returns { url, close }.
 */
export async function serveStatic(root) {
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost')
    let file = path.join(root, decodeURIComponent(url.pathname))
    if (!file.startsWith(root)) return response.writeHead(403).end()
    try {
      let info = await stat(file)
      if (info.isDirectory()) {
        if (!url.pathname.endsWith('/')) return response.writeHead(301, { Location: `${url.pathname}/` }).end()
        file = path.join(file, 'index.html')
        info = await stat(file)
      }
      response.writeHead(200, { 'Content-Type': CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream' })
      response.end(await readFile(file))
    } catch {
      response.writeHead(404, { 'Content-Type': CONTENT_TYPES['.html'] })
      response.end(await readFile(path.join(root, '404.html')))
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}

/**
 * Launches the locally installed Google Chrome (no browser download needed).
 * Set CHROME_PATH to use a different Chrome/Chromium executable.
 */
export function launchBrowser() {
  const asRoot = typeof process.getuid === 'function' && process.getuid() === 0
  return chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }),
    args: asRoot ? ['--no-sandbox'] : [],
  })
}

export function createRecorder() {
  let passed = 0
  const failures = []
  return {
    check(name, ok, detail = '') {
      if (ok) passed++
      else failures.push(detail === '' ? name : `${name} -> ${detail}`)
    },
    get passed() {
      return passed
    },
    get failures() {
      return failures
    },
    /** Prints the summary and returns the process exit code. */
    report(label) {
      console.log(`${label}: ${passed} passed, ${failures.length} failed`)
      for (const failure of failures) console.log(`  FAIL ${failure}`)
      return failures.length === 0 ? 0 : 1
    },
  }
}

export const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
}

export async function newPage(context) {
  const page = await context.newPage()
  page.errors = []
  page.on('pageerror', (error) => page.errors.push(String(error)))
  page.on('console', (message) => {
    if (message.type() === 'error') page.errors.push(message.text())
  })
  return page
}
