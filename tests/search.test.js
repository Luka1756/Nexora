import test from 'node:test'
import assert from 'node:assert/strict'
import { TOOLS } from '../src/tools/registry.js'
import { searchTools } from '../src/utils/search.js'

const ids = (query) => searchTools(TOOLS, query).map((tool) => tool.id)

test('empty or whitespace query returns nothing', () => {
  assert.deepEqual(ids(''), [])
  assert.deepEqual(ids('   '), [])
})

test('matches by name, case-insensitively', () => {
  assert.equal(ids('IMAGE CONVERTER')[0], 'image-converter')
  assert.equal(ids('qr')[0], 'qr-code-generator')
})

test('matches by keyword', () => {
  assert.ok(ids('webp').includes('image-converter'))
  assert.ok(ids('hex').includes('colour-palette-generator'))
  assert.ok(ids('mp3').includes('audio-converter'))
})

test('both spellings of colour find the palette tool', () => {
  assert.ok(ids('color').includes('colour-palette-generator'))
  assert.ok(ids('colour').includes('colour-palette-generator'))
})

test('every word must match', () => {
  assert.deepEqual(ids('pdf zzzz'), [])
  assert.equal(ids('pdf merge')[0], 'pdf-merger')
})

test('name matches outrank description-only matches', () => {
  const results = ids('compress')
  assert.deepEqual(results.slice(0, 2).sort(), ['image-compressor', 'pdf-compressor'])
})

test('respects the limit and handles regex characters safely', () => {
  assert.equal(searchTools(TOOLS, 'e', 3).length, 3)
  assert.deepEqual(ids('(.*['), [])
})
