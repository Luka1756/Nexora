import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'

// Minimal browser stand-ins; storage.js only needs localStorage and window events.
const store = new Map()
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
}
globalThis.window = new EventTarget()
globalThis.CustomEvent = class extends Event {}

const storage = await import('../src/utils/storage.js')

beforeEach(() => store.clear())

test('favourites toggle on and off and persist', () => {
  assert.equal(storage.toggleFavourite('pdf-merger'), true)
  assert.equal(storage.isFavourite('pdf-merger'), true)
  assert.deepEqual(storage.getFavourites(), ['pdf-merger'])
  assert.equal(storage.toggleFavourite('pdf-merger'), false)
  assert.deepEqual(storage.getFavourites(), [])
})

test('corrupt or wrongly shaped stored data is ignored', () => {
  store.set('nexora:favourites', '{not json')
  assert.deepEqual(storage.getFavourites(), [])
  store.set('nexora:favourites', '{"a":1}')
  assert.deepEqual(storage.getFavourites(), [])
  store.set('nexora:favourites', '["ok", 5, null, "ok", "also"]')
  assert.deepEqual(storage.getFavourites(), ['ok', 'also'])
})

test('recents are empty until a tool is recorded, most recent first, de-duplicated and capped', () => {
  assert.deepEqual(storage.getRecents(), [])
  for (const id of ['a', 'b', 'c', 'a', 'd', 'e', 'f', 'g']) storage.recordRecent(id)
  assert.deepEqual(storage.getRecents(), ['g', 'f', 'e', 'd', 'a', 'c'])
})

test('a failing localStorage does not throw and reports failure', () => {
  const original = globalThis.localStorage.setItem
  globalThis.localStorage.setItem = () => {
    throw new Error('quota')
  }
  assert.equal(storage.toggleFavourite('x'), null)
  assert.equal(storage.recordRecent('x'), false)
  globalThis.localStorage.setItem = original
})

test('subscribers are notified of changes and can unsubscribe', () => {
  let calls = 0
  const unsubscribe = storage.onStorageChange(() => calls++)
  storage.toggleFavourite('x')
  assert.equal(calls, 1)
  unsubscribe()
  storage.toggleFavourite('x')
  assert.equal(calls, 1)
})
