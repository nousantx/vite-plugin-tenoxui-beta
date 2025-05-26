'use strict'
Object.defineProperties(exports, {
  __esModule: { value: !0 },
  [Symbol.toStringTag]: { value: 'Module' }
})
const h = require('node:fs'),
  U = require('fast-glob'),
  v = require('node:path'),
  L = require('node:url'),
  R = require('@rollup/pluginutils'),
  T = require('nguraijs'),
  g = require('tenoxui')
class D {
  constructor({ css: s = { property: { bg: 'background' } }, rules: o = [] } = {}) {
    ;(this.config = o), (this.cssConfig = s), (this.core = new g.TenoxUI(this.cssConfig))
  }
  setConfig({ css: s = {}, rules: o = [] } = {}) {
    return (this.config = o), (this.cssConfig = s), (this.core = new g.TenoxUI(s)), this
  }
  process(s) {
    try {
      const {
          all: o,
          prefix: f,
          type: i
        } = this.core.main.regexp(Object.keys(this.cssConfig.aliases || {}) || []),
        d = new T({
          customOnly: !0,
          noUnknownToken: !0,
          noSpace: !0,
          custom: {
            className: [
              new RegExp(`!?${o.slice(1, -1)}`),
              new RegExp(`!?(?:(${f}):)?${i}`),
              ...this.config.map((t) => {
                const u = t.source
                return new RegExp(`!?${u}`, t.flags)
              })
            ]
          }
        }),
        l = [
          ...new Set(
            d
              .process(s)
              .flatMap((t) => t.filter((u) => u.type === 'className'))
              .map((t) => t.value)
          )
        ]
      return l.length > 0
        ? this.core
            .process(l)
            .map(
              (t) =>
                (t.isImportant ? '!' : '') +
                (t.rules ? g.constructRaw(t.raw[0], t.raw[1], '', '') : t.raw[6])
            )
        : []
    } catch (o) {
      return console.error('Error extracting class names:', o), []
    }
  }
}
const x = 'hmr:tenoxui',
  w = 'virtual:tenoxui:dev',
  _ = '\0' + w,
  E = 'virtual:tenoxui.css',
  C = '\0' + E
function O() {
  let r,
    s = () => !0,
    o = null,
    f = new D()
  const i = v.resolve('tenoxui.config.js')
  async function d() {
    try {
      if (h.existsSync(i)) {
        const n = await import(L.pathToFileURL(i).href + `?t=${Date.now()}`)
        ;(r = n.default || n), (o = new g.TenoxUI(r.css)), f.setConfig({ css: r.css })
        const { include: c, exclude: a } = r
        s = R.createFilter(c, a)
      } else console.warn('⚠️ Config file not found, using empty config'), (r = {}), (s = () => !0)
    } catch (e) {
      console.error('❌ Error loading framework config:', e), (r = {})
    }
  }
  let l,
    t = '',
    u = []
  const p = new Set()
  function S() {
    var n
    return o ? o.render(((n = r.css) == null ? void 0 : n.apply) || {}, Array.from(p)) : ''
  }
  async function y() {
    p.clear()
    const e = await U(r.include || [], { ignore: r.exclude || [] })
    for (const n of e) {
      const c = h.readFileSync(n, 'utf-8'),
        a = f.process(c)
      for (const m of a) p.add(m)
    }
  }
  function I(e) {
    for (const n of u) n.ws.send({ type: 'custom', event: x, data: e })
  }
  return [
    {
      name: 'tenoxui:global',
      configResolved(e) {
        l = e.command
      },
      async buildStart() {
        await d(), await y(), (t = S())
      }
    },
    {
      name: 'tenoxui:dev',
      resolveId(e) {
        if (e === w) return _
      },
      load(e) {
        if (e === _)
          return l === 'serve'
            ? `import { updateStyle, removeStyle } from '/@vite/client'

const id = ${JSON.stringify(w)};
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
  import.meta.hot.on('${x}', (newCSS) => {
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
            : ''
      },
      async configureServer(e) {
        u.push(e),
          e.watcher.add(i),
          e.middlewares.use('/__tenoxui_css__', async (n, c, a) => {
            n.method === 'GET'
              ? (await d(),
                await y(),
                c.setHeader('Content-Type', 'text/plain'),
                c.setHeader('Cache-Control', 'no-cache'),
                c.end(S()))
              : a()
          }),
          e.watcher.on('change', (n) => {
            if (
              (n === i &&
                (console.warn('TenoxUI config file changed, reloading...'),
                e.ws.send({ type: 'full-reload' })),
              s(n))
            ) {
              const c = h.readFileSync(n, 'utf-8'),
                a = f.process(c)
              for (const m of a) p.add(m)
              ;(t = S()), I(t)
            }
          })
      }
    },
    {
      name: 'tenoxui:build',
      resolveId(e) {
        if (e === E) return C
      },
      load(e) {
        if (e === C) return l === 'build' ? t : '/* nothing to do :3 */'
      }
    }
  ]
}
exports.default = O
//# sourceMappingURL=index.cjs.js.map
