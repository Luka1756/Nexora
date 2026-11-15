import { defineConfig } from 'vite'
import nexoraPages from './build/pages-plugin.js'
import { SITE_URL } from './site.config.js'

export default defineConfig({
  plugins: [nexoraPages({ siteUrl: SITE_URL })],
})
