// Only the icons Nexora uses are imported, so the bundle stays small.
// Tool and category icons are referenced by name from the registry.

import {
  createElement,
  ArrowRight,
  Blend,
  Crop,
  FileArchive,
  FileImage,
  FilePlus2,
  ImageUp,
  Menu,
  Merge,
  Minimize2,
  Music,
  Palette,
  Pencil,
  QrCode,
  RefreshCw,
  Scaling,
  Search,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  Split,
  Star,
  X,
} from 'lucide'

const ICONS = {
  ArrowRight,
  Blend,
  Crop,
  FileArchive,
  FileImage,
  FilePlus2,
  ImageUp,
  Menu,
  Merge,
  Minimize2,
  Music,
  Palette,
  Pencil,
  QrCode,
  RefreshCw,
  Scaling,
  Search,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  Split,
  Star,
  X,
}

export const ICON_NAMES = Object.keys(ICONS)

/** Returns a decorative SVG element (hidden from assistive technology). */
export function icon(name, size = 20) {
  const node = ICONS[name]
  if (!node) throw new Error(`Unknown icon: ${name}`)
  const svg = createElement(node)
  svg.setAttribute('width', size)
  svg.setAttribute('height', size)
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  return svg
}
