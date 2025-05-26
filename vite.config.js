import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import x from './src/plugin/index.js'
import i from 'vite-plugin-inspect'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), x(), i()]
})
