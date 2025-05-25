const VIRTUAL_MODULE_ID = 'virtual:tenoxui:dev'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

export function ViteTenoxUIDevMode() {
  return {
    name: 'tenoxui:dev',
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID
    },
    configResolved(_config) {
      config = _config
      console.log(config.command)
    },
    buildStart() {
      css = readCSS()
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

      server.watcher.on('change', (file) => {
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
