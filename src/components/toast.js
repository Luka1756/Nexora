import { h } from '../utils/dom.js'

let toast = null
let hideTimer = 0

/** Shows a short message to everyone, including screen reader users. */
export function showToast(message, duration = 3500) {
  if (!toast) {
    toast = h('div', { class: 'toast', role: 'status', hidden: true })
    document.body.append(toast)
  }
  toast.textContent = message
  toast.hidden = false
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    toast.hidden = true
  }, duration)
}
