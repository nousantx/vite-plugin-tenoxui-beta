export default {
  build: {
    minify: true,
    sourcemap: true,
    target: 'es2018',
    outDir: 'plugin',
    lib: {
      entry: './src/plugin/index.js',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      output: {
        exports: 'named'
      },
      external: [
        '@rollup/pluginutils',
        'node:path',
        'fast-glob',
        'nguraijs',
        'node:url',
        'node:fs',
        'tenoxui'
      ]
    }
  }
}
