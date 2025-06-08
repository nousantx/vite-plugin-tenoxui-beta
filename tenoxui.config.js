import { preset, preflight, defaultProperties } from '@tenoxui/preset-tailwind'
import { is, has } from 'cssrxp'

const { property, ...config } = preset()

export default {
  include: ['index.html', 'src/**/*.{js,jsx}'],
  exclude: ['**/node_modules/**/*', '**/dist/**/*'],
  css: {
    apply: { ...defaultProperties, ...preflight },
    ...config,
    property: {
      ...property,
      'iam-frfr': ({ value, unit, key, secondValue }) => {
        return !value || key || secondValue
          ? null
          : `margin: ${is.number.test(value + unit) ? Number(value) * 0.25 + 'rem' : value + unit}`
      }
    }
  }
}
