import fs from 'node:fs'
import fg from 'fast-glob'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createFilter } from '@rollup/pluginutils'
import { Extractor } from './utils/classNameExtractor.js'
import { Renderer } from './utils/staticRenderer.js'
import { create as TenoxUI } from './utils/createTenoxUI.js'

const WS_EVENT_PREFIX = 'hmr:tenoxui'
const VIRTUAL_MODULE_ID = 'virtual:tenoxui:dev'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID
const VIRTUAL_MODULE_ID_BUILD = 'virtual:tenoxui.css'
const RESOLVED_VIRTUAL_MODULE_ID_BUILD = '\0' + VIRTUAL_MODULE_ID_BUILD

const fileContentCache = new Map()
const FILE_CACHE_MAX_SIZE = 1000
const DEFAULT_FILE_EXT = '**/*.{html,js,jsx,ts,tsx,vue,svelte}'

export function VitePlugin() {
  let config = {}
  let includeFilter = () => true
  let tenoxui = null
  let extractor = new Extractor()
  const configPath = path.resolve('tenoxui.config.js')

  let GLOBAL_MATCHER = null
  let GLOBAL_MATCHER_TX = null
  let MODES = null
  let css = ''
  let servers = []

  const allClassNames = new Set()
  let isScanning = false
  let scanPromise = null

  // Debounce helper for file changes
  const debounceMap = new Map()
  function debounce(key, fn, delay = 100) {
    if (debounceMap.has(key)) {
      clearTimeout(debounceMap.get(key))
    }
    debounceMap.set(
      key,
      setTimeout(() => {
        debounceMap.delete(key)
        fn()
      }, delay)
    )
  }

  async function loadConfig() {
    try {
      if (fs.existsSync(configPath)) {
        const configURL = pathToFileURL(configPath).href + `?t=${Date.now()}`
        const configModule = await import(configURL)
        config = configModule.default || configModule

        // Validate config structure
        if (typeof config !== 'object') {
          throw new Error('Config must export an object')
        }

        try {
          tenoxui = new Renderer({
            main: TenoxUI({
              ...config.css,
              onMatcherCreated: (x) => {
                GLOBAL_MATCHER_TX = x
              }
            }),
            aliases: config.css?.aliases || {},
            apply: config.css?.apply || {}
          })
        } catch (rendererError) {
          console.error('❌ Error creating TenoxUI renderer:', rendererError)
          throw rendererError
        }

        // Initialize extractor with validation
        try {
          extractor.setConfig({
            ...config.css,
            onMatcherCreated: (x) => {
              GLOBAL_MATCHER = x
            },
            rules: Array.isArray(config.rules) ? config.rules : []
          })
        } catch (extractorError) {
          console.error('❌ Error configuring extractor:', extractorError)
          throw extractorError
        }

        const { include = [DEFAULT_FILE_EXT], exclude } = config
        includeFilter = createFilter(include, exclude)
      } else {
        console.warn('⚠️ Config file not found, using default configuration')
        config = {
          include: [DEFAULT_FILE_EXT],
          exclude: ['node_modules/**'],
          css: {}
        }
        includeFilter = createFilter(config.include, config.exclude)

        // Initialize with empty config
        tenoxui = new Renderer({ main: TenoxUI({}) })
        extractor = new Extractor()
      }
    } catch (error) {
      console.error('❌ Error loading TenoxUI config:', error.message)
      // Fallback to minimal working config
      config = { include: [DEFAULT_FILE_EXT], css: {} }
      tenoxui = new Renderer({ main: TenoxUI({}) })
      extractor = new Extractor()
      includeFilter = createFilter(config.include)
    }
  }

  function generateCSS() {
    if (!tenoxui || allClassNames.size === 0) return ''

    try {
      const classNamesArray = Array.from(allClassNames)
      const styles = tenoxui.render(classNamesArray)
      return styles || ''
    } catch (error) {
      console.error('❌ Error generating CSS:', error)
      return ''
    }
  }

  async function scanAllFiles() {
    if (isScanning) {
      return scanPromise
    }

    isScanning = true
    scanPromise = (async () => {
      try {
        allClassNames.clear()
        const patterns =
          Array.isArray(config.include) && config.include.length > 0
            ? config.include
            : [DEFAULT_FILE_EXT]

        const files = await fg(patterns, {
          ignore: config.exclude || ['node_modules/**'],
          absolute: true,
          onlyFiles: true
        })

        const processPromises = files.map(async (file) => {
          try {
            const content = await fs.promises.readFile(file, 'utf-8')
            const classNames = extractor.process(content)

            if (Array.isArray(classNames)) {
              classNames.forEach((name) => {
                if (name && typeof name === 'string') {
                  allClassNames.add(name)
                }
              })
            }
          } catch (fileError) {
            console.warn(`⚠️ Error processing file ${file}:`, fileError.message)
          }
        })

        await Promise.all(processPromises)
      } catch (error) {
        console.error('❌ Error scanning files:', error)
      } finally {
        isScanning = false
        scanPromise = null
      }
    })()

    return scanPromise
  }

  function processFileContent(file, content) {
    try {
      const cachedContent = fileContentCache.get(file)
      if (cachedContent === content) {
        return false
      }

      if (fileContentCache.size >= FILE_CACHE_MAX_SIZE) {
        const firstKey = fileContentCache.keys().next().value
        fileContentCache.delete(firstKey)
      }
      fileContentCache.set(file, content)

      const classNames = extractor.process(content)
      let hasChanges = false

      if (Array.isArray(classNames)) {
        classNames.forEach((name) => {
          if (name && typeof name === 'string' && !allClassNames.has(name)) {
            allClassNames.add(name)
            hasChanges = true
          }
        })
      }

      return hasChanges
    } catch (error) {
      console.warn(`⚠️ Error processing file content for ${file}:`, error.message)
      return false
    }
  }

  function sendCSSUpdate(newCSS) {
    if (!newCSS || newCSS === css) return

    css = newCSS
    for (const server of servers) {
      try {
        server.ws.send({
          type: 'custom',
          event: WS_EVENT_PREFIX,
          data: newCSS
        })
      } catch (error) {
        console.warn('⚠️ Error sending CSS update to client:', error.message)
      }
    }
  }

  return [
    {
      name: 'tenoxui:global',
      configResolved(_config) {
        MODES = _config.command
      },
      async buildStart() {
        try {
          await loadConfig()
          await scanAllFiles()
          css = generateCSS()
        } catch (error) {
          console.error('❌ Error during build start:', error)
          this.error(error)
        }
      },
      async buildEnd() {
        // Cleanup
        fileContentCache.clear()
        allClassNames.clear()
        debounceMap.forEach((timer) => clearTimeout(timer))
        debounceMap.clear()
      }
    },
    {
      name: 'tenoxui:dev',
      resolveId(id) {
        if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID
      },
      load(id) {
        if (id === RESOLVED_VIRTUAL_MODULE_ID) {
          if (MODES === 'serve') {
            return `import { updateStyle, removeStyle } from '/@vite/client'

const id = ${JSON.stringify(VIRTUAL_MODULE_ID)};
let currentCSS = '';

async function getCurrentCSS() {
  try {
    const response = await fetch('/__tenoxui_css__');
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }
    return await response.text();
  } catch (e) {
    console.warn('[tenoxui] Failed to fetch CSS:', e.message);
    return '';
  }
}

getCurrentCSS().then(css => {
  if (css !== currentCSS) {
    currentCSS = css;
    updateStyle(id, css);
  }
}).catch(e => {
  console.error('[tenoxui] Error initializing styles:', e);
});

if (import.meta.hot) {
  import.meta.hot.on('${WS_EVENT_PREFIX}', (newCSS) => {
    if (newCSS !== currentCSS) {
      currentCSS = newCSS;
      updateStyle(id, newCSS);
    }
  });
  
  import.meta.hot.accept(() => {
    // nothing todo :)
  });
  
  import.meta.hot.prune(() => {
    try {
      removeStyle(id);
    } catch (e) {
      console.warn('[tenoxui] Error removing styles:', e);
    }
  });

  // Handle disposal
  import.meta.hot.dispose(() => {
    try {
      removeStyle(id);
    } catch (e) {
      console.warn('[tenoxui] Error during disposal:', e);
    }
  });
}

export default {};
`
          }
          return ''
        }
      },
      async configureServer(server) {
        servers.push(server)

        // Watch config file
        if (fs.existsSync(configPath)) {
          server.watcher.add(configPath)
        }

        server.middlewares.use('/__tenoxui_css__', async (req, res, next) => {
          if (req.method === 'GET') {
            try {
              await loadConfig()
              await scanAllFiles()
              const generatedCSS = generateCSS()

              res.setHeader('Content-Type', 'text/css; charset=utf-8')
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
              res.setHeader('Pragma', 'no-cache')
              res.setHeader('Expires', '0')
              res.end(generatedCSS)
            } catch (error) {
              console.error('❌ Error generating CSS for middleware:', error)
              res.statusCode = 500
              res.end('/* Error generating CSS */')
            }
          } else {
            next()
          }
        })

        server.watcher.on('change', (file) => {
          const normalizedFile = path.normalize(file)

          if (normalizedFile === path.normalize(configPath)) {
            console.log('📁 TenoxUI config changed, reloading...')
            debounce(
              'config-reload',
              () => {
                server.ws.send({ type: 'full-reload' })
              },
              300
            )
            return
          }

          if (includeFilter(file)) {
            debounce(
              `file-${file}`,
              async () => {
                try {
                  const content = await fs.promises.readFile(file, 'utf-8')
                  const hasChanges = processFileContent(file, content)

                  if (hasChanges) {
                    const newCSS = generateCSS()
                    sendCSSUpdate(newCSS)
                  }
                } catch (error) {
                  console.warn(`⚠️ Error processing changed file ${file}:`, error.message)
                }
              },
              50
            )
          }
        })

        // Handle server cleanup
        const originalClose = server.close.bind(server)
        server.close = async () => {
          // Cleanup resources
          fileContentCache.clear()
          allClassNames.clear()
          debounceMap.forEach((timer) => clearTimeout(timer))
          debounceMap.clear()
          servers.length = 0

          return originalClose()
        }
      }
    },
    {
      name: 'tenoxui:build',
      resolveId(id) {
        if (id === VIRTUAL_MODULE_ID_BUILD) return RESOLVED_VIRTUAL_MODULE_ID_BUILD
      },
      load(id) {
        if (id === RESOLVED_VIRTUAL_MODULE_ID_BUILD) {
          if (MODES === 'build') {
            return css
          }
          return '/* TenoxUI - build mode not active */'
        }
      }
    }
  ]
}

export default VitePlugin
