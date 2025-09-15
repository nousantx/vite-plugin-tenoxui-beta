import { is, has } from 'cssrxp'

export default {
  include: ['index.html', 'src/**/*.{js,jsx}'],
  exclude: ['**/node_modules/**/*', 'src/plugin/**/*', '**/dist/**/*'],
  utilities: {
    bg: 'background',
    text: 'color',
    flex: { display: 'flex' },
    center: { alignItems: 'center', justifyContent: 'center' },
    p: ({ value }) => {
      if (!value) return null
      let padding = value
      if (is.number.test(value)) padding = Number(value) * 0.25 + 'rem'
      return { padding }
    },
    radius: ({ value }) => {
      if (!value) return null
      let borderRadius = value
      if (is.number.test(value)) borderRadius = Number(value) * 0.25 + 'rem'
      return { borderRadius }
    }
  },
  valuePatterns: ['#[0-9a-fA-F]+'],
  variants: {
    hover: '&:hover'
  },
  apply: {
    ':root': '[fontFamily]-inter',
    body: 'bg-black [color]-white'
  }
}
