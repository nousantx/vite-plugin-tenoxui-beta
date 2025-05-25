export default {
  include: ['src/App.jsx'],
  exclude: ['**/node_modules/**/*', '**/dist/**/*'],
  css: {
    apply: { body: 'bg-red' },
    property: {
      bg: 'background'
    }
  }
}
