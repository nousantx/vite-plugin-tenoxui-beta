import { preset, preflight, defaultProperties } from '@tenoxui/preset-tailwind'

export default {
  include: ['index.html', 'src/**/*.{js,jsx}'],
  exclude: ['**/node_modules/**/*', '**/dist/**/*'],
  css: {
    apply: { ...defaultProperties, ...preflight },
    ...preset(),
    aliases: {
      btn: '[background]-red',
      'btn-icon': '[background]-blue',
      'btn-2px/40px': '[background]-red'
    }
  }
}
