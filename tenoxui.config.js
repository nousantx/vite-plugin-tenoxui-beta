import { is, has } from 'cssrxp'

export default {
  include: ['index.html', 'src/**/*.{js,jsx}'],
  exclude: ['**/node_modules/**/*', 'src/plugin/**/*', '**/dist/**/*'],
  css: {
    utilities: {
      moxie: {
        bg: 'background',
        m: ({ value }) => {
          let margin = value
          if (is.number.test(value)) margin = value * 0.25 + 'rem'
          return { margin }
        },
        p: ({ value }) => {
          let padding = value
          if (is.number.test(value)) padding = value * 0.25 + 'rem'
          return { padding }
        },
        flex: 'display: flex',
        center: { justifyContent: 'center', alignItems: 'center' }
      }
    },
    variants: {
      hover: '&:hover'
    },
    apply: {
      body: 'bg-yellow m-0 p-0'
    }
  }
}
