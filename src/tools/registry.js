// Single source of truth for categories and tools.
//
// This file is plain data plus small helpers (no browser or Node APIs), so it is
// imported by the browser app AND by the build-time page generator. The homepage,
// category pages, search, favourites, sitemap and per-tool landing pages are all
// derived from it.
//
// Tool status:
//   'available'    - the tool works and has a landing page at /tools/<id>/
//   'coming-soon'  - listed, but not built yet; shown as such and never linked
//
// Flip a tool to 'available' only in the same change that adds its implementation.

export const CATEGORIES = [
  {
    id: 'convert',
    name: 'Convert',
    path: '/convert/',
    icon: 'RefreshCw',
    description: 'Change files from one format to another.',
    pageDescription:
      'Convert images, PDFs, SVGs and audio between formats, directly in your browser.',
  },
  {
    id: 'edit',
    name: 'Edit',
    path: '/edit/',
    icon: 'Pencil',
    description: 'Compress, resize, crop and rearrange images and PDFs.',
    pageDescription:
      'Compress, resize, crop and adjust images, and merge, split or shrink PDF files.',
  },
  {
    id: 'create',
    name: 'Create',
    path: '/create/',
    icon: 'Sparkles',
    description: 'Make QR codes, gradients and colour palettes.',
    pageDescription:
      'Generate QR codes, CSS gradients and colour palettes you can copy and use straight away.',
  },
]

export const TOOLS = [
  // ── Convert ──────────────────────────────────────────────
  {
    id: 'image-converter',
    name: 'Image Converter',
    category: 'convert',
    icon: 'ImageUp',
    description: 'Convert images between PNG, JPG, WebP and more.',
    keywords: ['png', 'jpg', 'jpeg', 'webp', 'format', 'photo', 'picture'],
    popular: true,
    status: 'coming-soon',
  },
  {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    category: 'convert',
    icon: 'FilePlus2',
    description: 'Combine one or more images into a single PDF.',
    keywords: ['pdf', 'jpg', 'png', 'photos', 'combine', 'document'],
    popular: true,
    status: 'coming-soon',
  },
  {
    id: 'pdf-to-image',
    name: 'PDF to Image',
    category: 'convert',
    icon: 'FileImage',
    description: 'Export PDF pages as PNG or JPG images.',
    keywords: ['pdf', 'png', 'jpg', 'pages', 'export', 'extract'],
    status: 'coming-soon',
  },
  {
    id: 'svg-converter',
    name: 'SVG Converter',
    category: 'convert',
    icon: 'Shapes',
    description: 'Turn SVG graphics into PNG, JPG or WebP images.',
    keywords: ['svg', 'vector', 'raster', 'png', 'jpg', 'webp'],
    status: 'coming-soon',
  },
  {
    id: 'audio-converter',
    name: 'Audio Converter',
    category: 'convert',
    icon: 'Music',
    description: 'Convert audio files between common formats.',
    keywords: ['mp3', 'wav', 'ogg', 'sound', 'music', 'format'],
    status: 'coming-soon',
  },

  // ── Edit ─────────────────────────────────────────────────
  {
    id: 'image-compressor',
    name: 'Image Compressor',
    category: 'edit',
    icon: 'Minimize2',
    description: 'Reduce image file size with adjustable quality.',
    keywords: ['compress', 'optimise', 'optimize', 'smaller', 'size', 'jpg', 'webp'],
    popular: true,
    status: 'coming-soon',
  },
  {
    id: 'image-resizer',
    name: 'Image Resizer',
    category: 'edit',
    icon: 'Scaling',
    description: 'Resize images to exact dimensions or keep the aspect ratio.',
    keywords: ['resize', 'scale', 'dimensions', 'width', 'height', 'pixels'],
    popular: true,
    status: 'coming-soon',
  },
  {
    id: 'image-cropper',
    name: 'Image Cropper',
    category: 'edit',
    icon: 'Crop',
    description: 'Crop images freely or to common aspect ratios.',
    keywords: ['crop', 'trim', 'aspect ratio', 'square', 'cut'],
    status: 'coming-soon',
  },
  {
    id: 'image-editor',
    name: 'Image Editor',
    category: 'edit',
    icon: 'SlidersHorizontal',
    description: 'Adjust brightness and contrast, rotate and flip images.',
    keywords: ['brightness', 'contrast', 'rotate', 'flip', 'filter', 'adjust'],
    status: 'coming-soon',
  },
  {
    id: 'pdf-merger',
    name: 'PDF Merger',
    category: 'edit',
    icon: 'Merge',
    description: 'Combine several PDF files into one.',
    keywords: ['pdf', 'merge', 'join', 'combine', 'document'],
    popular: true,
    status: 'coming-soon',
  },
  {
    id: 'pdf-splitter',
    name: 'PDF Splitter',
    category: 'edit',
    icon: 'Split',
    description: 'Extract selected pages or page ranges from a PDF.',
    keywords: ['pdf', 'split', 'extract', 'pages', 'range', 'separate'],
    status: 'coming-soon',
  },
  {
    id: 'pdf-compressor',
    name: 'PDF Compressor',
    category: 'edit',
    icon: 'FileArchive',
    description: 'Reduce the file size of a PDF where possible.',
    keywords: ['pdf', 'compress', 'smaller', 'size', 'optimise', 'optimize'],
    status: 'coming-soon',
  },

  // ── Create ───────────────────────────────────────────────
  {
    id: 'qr-code-generator',
    name: 'QR Code Generator',
    category: 'create',
    icon: 'QrCode',
    description: 'Generate QR codes from text or links, with custom colours.',
    keywords: ['qr', 'barcode', 'link', 'url', 'text', 'code'],
    popular: true,
    status: 'coming-soon',
  },
  {
    id: 'gradient-generator',
    name: 'Gradient Generator',
    category: 'create',
    icon: 'Blend',
    description: 'Design CSS gradients with a live preview and copy the code.',
    keywords: ['css', 'gradient', 'linear', 'radial', 'background', 'colour', 'color'],
    status: 'coming-soon',
  },
  {
    id: 'colour-palette-generator',
    name: 'Colour Palette Generator',
    category: 'create',
    icon: 'Palette',
    description: 'Generate colour palettes and copy their HEX values.',
    keywords: ['color', 'colour', 'palette', 'hex', 'scheme', 'swatch'],
    status: 'coming-soon',
  },
]

export const isAvailable = (tool) => tool.status === 'available'

export const toolPath = (tool) => `/tools/${tool.id}/`

export const getCategory = (id) => CATEGORIES.find((category) => category.id === id)

export const getTool = (id) => TOOLS.find((tool) => tool.id === id)

export const getToolsByCategory = (categoryId) =>
  TOOLS.filter((tool) => tool.category === categoryId)

export const getPopularTools = () => TOOLS.filter((tool) => tool.popular)
