import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

const VIRTUAL_MODULE_ID = 'virtual:tenx:css'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID
const WS_EVENT_PREFIX = 'tenoxui:hmr'

export default function tenoxuiCSSPlugin() {
  const cssPath = path.resolve('./css.txt')

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

  return {
    name: 'plugin-tenoxuiui',
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return `
import { updateStyle, removeStyle } from '/@vite/client'

const id = ${JSON.stringify(VIRTUAL_MODULE_ID)};
let currentCSS = '';

// Fetch current CSS from server
async function getCurrentCSS() {
  try {
    const response = await fetch('/__tenoxui_css__');
    return await response.text();
  } catch (e) {
    console.warn('[tenoxuiui] Failed to fetch CSS:', e);
    return '';
  }
}

// Initialize styles
getCurrentCSS().then(css => {
  currentCSS = css;
  updateStyle(id, css);
});

if (import.meta.hot) {
  // Listen for CSS updates from the server
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
    },

    configureServer(server) {
      servers.push(server)
      server.watcher.add(cssPath)

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
        if (file === cssPath) {
          const newCSS = readCSS()
          if (newCSS !== css) {
            css = newCSS
            sendCSSUpdate(newCSS)
          }
        }
      })
    },

    handleHotUpdate(ctx) {
      if (ctx.file === cssPath) {
        const newCSS = readCSS()
        if (newCSS !== css) {
          css = newCSS
          sendCSSUpdate(newCSS)
        }
        return []
      }
    }
  }
}
