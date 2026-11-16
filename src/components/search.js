import { TOOLS, getCategory, isAvailable, toolPath } from '../tools/registry.js'
import { searchTools } from '../utils/search.js'
import { h } from '../utils/dom.js'
import { icon } from './icons.js'
import { showToast } from './toast.js'

/**
 * Header search: a combobox with a listbox of matching tools.
 * Keys: ArrowUp/Down to move, Enter to open (or the first available match),
 * Escape to close then clear, "/" anywhere on the page to focus.
 */
export function createSearch() {
  let results = []
  let activeIndex = -1

  const input = h('input', {
    id: 'tool-search',
    class: 'search-input',
    type: 'text',
    role: 'combobox',
    placeholder: 'Search tools',
    autocomplete: 'off',
    spellcheck: 'false',
    maxlength: '80',
    enterkeyhint: 'search',
    'aria-autocomplete': 'list',
    'aria-expanded': 'false',
    'aria-controls': 'search-results',
  })
  const list = h('ul', { id: 'search-results', role: 'listbox', 'aria-label': 'Matching tools', hidden: true })
  const empty = h('p', { class: 'search-empty', hidden: true })
  const panel = h('div', { class: 'search-panel', hidden: true }, list, empty)
  const status = h('div', { class: 'sr-only', role: 'status' })
  const root = h(
    'div',
    { class: 'search header-search', role: 'search' },
    h('label', { class: 'sr-only', for: 'tool-search' }, 'Search tools'),
    h('span', { class: 'search-icon' }, icon('Search', 18)),
    input,
    panel,
    status,
  )

  const options = () => [...list.children]

  function openTool(tool) {
    if (isAvailable(tool)) window.location.assign(toolPath(tool))
    else showToast(`${tool.name} is coming soon.`)
  }

  function setActive(index) {
    activeIndex = index
    options().forEach((option, i) => option.classList.toggle('is-active', i === index))
    options().forEach((option, i) => option.setAttribute('aria-selected', String(i === index)))
    if (index >= 0) {
      const option = options()[index]
      input.setAttribute('aria-activedescendant', option.id)
      option.scrollIntoView({ block: 'nearest' })
    } else {
      input.removeAttribute('aria-activedescendant')
    }
  }

  function close() {
    panel.hidden = true
    input.setAttribute('aria-expanded', 'false')
    setActive(-1)
  }

  function createOption(tool, index) {
    const available = isAvailable(tool)
    const content = [
      icon(tool.icon, 18),
      h('span', { class: 'search-option-name' }, tool.name),
      available
        ? h('span', { class: 'search-option-category' }, getCategory(tool.category).name)
        : h('span', { class: 'badge' }, 'Coming soon'),
    ]
    const inner = available
      ? h('a', { href: toolPath(tool), tabindex: '-1' }, content)
      : h('span', {}, content)
    return h(
      'li',
      {
        id: `search-option-${index}`,
        class: 'search-option',
        role: 'option',
        'aria-selected': 'false',
        'aria-disabled': available ? null : 'true',
        onMouseenter: () => setActive(index),
        // Keep focus in the input so the list does not close before the click lands.
        onMousedown: (event) => event.preventDefault(),
        onClick: (event) => {
          if (available) return // the link navigates
          event.preventDefault()
          openTool(tool)
        },
      },
      inner,
    )
  }

  function update() {
    const query = input.value.trim()
    if (!query) {
      results = []
      status.textContent = ''
      close()
      return
    }
    results = searchTools(TOOLS, query)
    list.replaceChildren(...results.map(createOption))
    list.hidden = results.length === 0
    empty.hidden = results.length > 0
    empty.textContent = results.length === 0 ? `No tools match “${query}”.` : ''
    panel.hidden = false
    input.setAttribute('aria-expanded', 'true')
    setActive(-1)
    status.textContent =
      results.length === 0
        ? 'No tools found.'
        : `${results.length} ${results.length === 1 ? 'tool' : 'tools'} found.`
  }

  input.addEventListener('input', update)
  input.addEventListener('focus', () => {
    if (input.value.trim() && panel.hidden) update()
  })

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!input.value.trim()) return
      event.preventDefault()
      if (panel.hidden) update()
      if (results.length === 0) return
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((activeIndex + step + results.length) % results.length)
    } else if (event.key === 'Enter') {
      if (results.length === 0) return
      event.preventDefault()
      const chosen =
        activeIndex >= 0 ? results[activeIndex] : (results.find(isAvailable) ?? results[0])
      openTool(chosen)
    } else if (event.key === 'Escape') {
      if (!panel.hidden) close()
      else input.value = ''
    }
  })

  root.addEventListener('focusout', (event) => {
    if (!root.contains(event.relatedTarget)) close()
  })

  document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
    const target = event.target
    const typing =
      target instanceof HTMLElement &&
      (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
    if (typing) return
    event.preventDefault()
    input.focus()
  })

  return root
}
