// old
import fs from 'node:fs'
import fg from 'fast-glob'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createFilter } from '@rollup/pluginutils'

const WS_EVENT_PREFIX = 'hmr:tenoxui'
const VIRTUAL_MODULE_ID = 'virtual:tenoxui:dev'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID
const VIRTUAL_MODULE_ID_BUILD = 'virtual:tenoxui.css'
const RESOLVED_VIRTUAL_MODULE_ID_BUILD = '\0' + VIRTUAL_MODULE_ID_BUILD

export default function Txoo() {
  const cssPath = path.resolve('./css.txt')

  let userConfig
  let includeFilter = () => true

  async function loadConfig() {
    try {
      const configPath = path.resolve('tenoxui.config.js')

      if (fs.existsSync(configPath)) {
        const configURL = pathToFileURL(configPath).href + `?t=${Date.now()}`
        const data = await import(configURL)
        userConfig = data.default || data
        
        const { include, exclude } = userConfig
        includeFilter = createFilter(include, exclude)
      } else {
        console.warn('⚠️ Config file not found, using empty config')
        userConfig = {}
        includeFilter = () => true
      }
    } catch (error) {
      console.error('❌ Error loading framework config:', error)
      userConfig = {}
    }
  }

  let config
  let css = ''
  let servers = []

  function readCSS() {
    try {
      return fs.readFileSync(cssPath, 'utf-8')
    } catch (err) {
      console.warn(`Could not read CSS file at ${cssPath}:`, err.message)
      return ''
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
        config = _config
        console.log(config.command)
      },
      async buildStart() {
        await loadConfig()
        console.log(userConfig, includeFilter)
        css = readCSS()
      }
    },
    {
      name: 'tenoxui:dev',
      resolveId(id) {
        if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID
      },

      load(id) {
        if (id === RESOLVED_VIRTUAL_MODULE_ID) {
          if (config.command === 'serve') {
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
        // server.watcher.add(cssPath)

        server.middlewares.use('/__tenoxui_css__', (req, res, next) => {
          if (req.method === 'GET') {
            const currentCSS = readCSS()
            res.setHeader('Content-Type', 'text/plain')
            res.setHeader('Cache-Control', 'no-cache')
            res.end(currentCSS)
          } else {
            next()
          }
        })

        server.watcher.on('change', file => {
          // if (file === cssPath) {
          if (includeFilter(file)) {
            const newCSS = readCSS()
            if (newCSS !== css) {
              css = newCSS
              sendCSSUpdate(newCSS)
            }
          }
        })
      },
      handleHotUpdate(ctx) {
        // if (ctx.file === cssPath) {
        if (includeFilter(ctx.file)) {
          console.log(ctx.file)
          const newCSS = readCSS()
          if (newCSS !== css) {
            css = newCSS
            sendCSSUpdate(newCSS)
          }
          return []
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
          if (config.command === 'build') {
            return readCSS()
          }
          return '/* nothing to do */'
        }
      }
    }
  ]
}
