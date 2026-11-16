// Favourites and recently used tools, stored in this browser only (localStorage).
// Nothing here is sent anywhere. Stored data is validated on every read, and every
// access is wrapped so private modes or blocked storage degrade to "nothing saved".

const FAVOURITES_KEY = 'nexora:favourites'
const RECENTS_KEY = 'nexora:recents'
const MAX_RECENTS = 6

export const CHANGE_EVENT = 'nexora:storage-change'

function readIds(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.filter((id) => typeof id === 'string'))]
  } catch {
    return []
  }
}

function writeIds(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(ids))
  } catch {
    return false
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
  return true
}

export const getFavourites = () => readIds(FAVOURITES_KEY)

export const isFavourite = (id) => getFavourites().includes(id)

/** Adds or removes a favourite. Returns the new state, or null if it could not be saved. */
export function toggleFavourite(id) {
  const current = getFavourites()
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
  return writeIds(FAVOURITES_KEY, next) ? next.includes(id) : null
}

export const getRecents = () => readIds(RECENTS_KEY)

/**
 * Records that a tool was actually used. Tool pages call this once the user has
 * really run the tool (not merely opened the page). Most recent first.
 */
export function recordRecent(id) {
  const next = [id, ...getRecents().filter((item) => item !== id)].slice(0, MAX_RECENTS)
  return writeIds(RECENTS_KEY, next)
}

/** Calls `callback` when favourites or recents change here or in another tab. Returns an unsubscribe function. */
export function onStorageChange(callback) {
  const onStorage = (event) => {
    if (event.key === null || event.key === FAVOURITES_KEY || event.key === RECENTS_KEY) callback()
  }
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', onStorage)
  }
}
