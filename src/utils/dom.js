// Small helper for building DOM safely. Strings are always inserted as text nodes,
// so user-controlled values can never become markup.

/**
 * h('a', { href: '/x', class: 'link' }, 'Label', otherNode)
 * Props: `class`, `dataset`, `on<Event>` listeners, `hidden`/boolean props, anything else as attribute.
 */
export function h(tag, props = {}, ...children) {
  const element = document.createElement(tag)
  for (const [name, value] of Object.entries(props ?? {})) {
    if (value === undefined || value === null || value === false) continue
    if (name === 'class') element.className = value
    else if (name === 'dataset') Object.assign(element.dataset, value)
    else if (name.startsWith('on') && typeof value === 'function') {
      element.addEventListener(name.slice(2).toLowerCase(), value)
    } else element.setAttribute(name, value === true ? '' : value)
  }
  append(element, children)
  return element
}

function append(parent, children) {
  for (const child of children.flat()) {
    if (child === undefined || child === null || child === false) continue
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)))
  }
}
