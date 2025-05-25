import fs from 'node:fs'
import fg from 'fast-glob'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createFilter } from '@rollup/pluginutils'
import { Extractor } from './utils/classNameExtractor.js'
import { TenoxUI } from 'tenoxui'

const WS_EVENT_PREFIX = 'hmr:tenoxui'
const VIRTUAL_MODULE_ID = 'virtual:tenoxui:dev'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID
const VIRTUAL_MODULE_ID_BUILD = 'virtual:tenoxui.css'
const RESOLVED_VIRTUAL_MODULE_ID_BUILD = '\0' + VIRTUAL_MODULE_ID_BUILD

export default function Txoo() {
  let config
  let includeFilter = () => true
  let tenoxui = null
  let extractor = new Extractor()

  async function loadConfig() {
    try {
      const configPath = path.resolve('tenoxui.config.js')

      if (fs.existsSync(configPath)) {
        const configURL = pathToFileURL(configPath).href + `?t=${Date.now()}`
        const data = await import(configURL)
        config = data.default || data
        tenoxui = new TenoxUI(config.css)
        extractor.setConfig({ css: config.css })
        const { include, exclude } = config
        includeFilter = createFilter(include, exclude)
      } else {
        console.warn('⚠️ Config file not found, using empty config')
        config = {}
        includeFilter = () => true
      }
    } catch (error) {
      console.error('❌ Error loading framework config:', error)
      config = {}
    }
  }

  let MODES
  let css = ''
  let servers = []

  const allClassNames = new Set()

  function generateCSS() {
    if (!tenoxui) return ''
    const styles = tenoxui.render(config.css?.apply || {}, Array.from(allClassNames))
    return styles
  }

  async function scanAllFiles() {
    allClassNames.clear()
    const files = await fg(config.include || [], {
      ignore: config.exclude || []
    })

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      const classNames = extractor.process(content)
      for (const name of classNames) {
        allClassNames.add(name)
      }
    }
  }

  function sendCSSUpdate(newCSS) {
    for (const server of servers) {
      server.ws.send({
        type: 'custom',
        event: WS_EVENT_PREFIX,
        data: newCSS
      })
    }
  }

  return [
    {
      name: 'tenoxui:global',
      configResolved(_config) {
        MODES = _config.command
      },
      async buildStart() {
        await loadConfig()
        await scanAllFiles()
        css = generateCSS()
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
            return `
// Try to use Vite's updateStyle, fallback to custom injection
let updateStyle, removeStyle;

try {
  const viteClient = await import('/@vite/client');
  updateStyle = viteClient.updateStyle;
  removeStyle = viteClient.removeStyle;
} catch (e) {
  // Fallback for cases where vite client isn't available
  updateStyle = function(id, css) {
    const existing = document.getElementById(id);
    if (existing) {
      existing.textContent = css;
    } else {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = css;
      document.head.appendChild(style);
    }
  };
  
  removeStyle = function(id) {
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }
  };
}

const id = ${JSON.stringify(VIRTUAL_MODULE_ID)};
let currentCSS = '';

// Fetch current CSS from server
async function getCurrentCSS() {
  try {
    const response = await fetch('/__tenoxui_css__');
    return await response.text();
  } catch (e) {
    console.warn('[tenoxui] Failed to fetch CSS:', e);
    return '';
  }
}

// Initialize styles
getCurrentCSS().then(css => {
  currentCSS = css;
  updateStyle(id, css);
});

if (import.meta.hot) {
  import.meta.hot.on('${WS_EVENT_PREFIX}', (newCSS) => {
    currentCSS = newCSS;
    updateStyle(id, newCSS);
  });
  
  import.meta.hot.accept(() => {
    // Accept updates
  });
  
  import.meta.hot.prune(() => {
    removeStyle(id);
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

        server.middlewares.use('/__tenoxui_css__', async (req, res, next) => {
          if (req.method === 'GET') {
            await loadConfig()
            await scanAllFiles()
            res.setHeader('Content-Type', 'text/plain')
            res.setHeader('Cache-Control', 'no-cache')
            res.end(generateCSS())
          } else {
            next()
          }
        })

        server.watcher.on('change', (file) => {
          if (includeFilter(file)) {
            const content = fs.readFileSync(file, 'utf-8')
            const classNames = extractor.process(content)
            for (const name of classNames) {
              allClassNames.add(name)
            }
            css = generateCSS()
            sendCSSUpdate(css)
          }
        })
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
          return '/* nothing to do :3 */'
        }
      }
    }
  ]
}
