import { preset, preflight, defaultProperties } from '@tenoxui/preset-tailwind'

export default {
  include: ['src/App.jsx'],
  exclude: ['**/node_modules/**/*', '**/dist/**/*'],
  css: {
    apply: { ...defaultProperties, ...preflight },
    ...preset()
  }
}
