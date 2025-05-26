import S from 'node:fs'
import U from 'fast-glob'
import L from 'node:path'
import { pathToFileURL as R } from 'node:url'
import { createFilter as v } from '@rollup/pluginutils'
import D from 'nguraijs'
import { TenoxUI as h, constructRaw as T } from 'tenoxui'
class O {
  constructor({ css: s = { property: { bg: 'background' } }, rules: o = [] } = {}) {
    ;(this.config = o), (this.cssConfig = s), (this.core = new h(this.cssConfig))
  }
  setConfig({ css: s = {}, rules: o = [] } = {}) {
    return (this.config = o), (this.cssConfig = s), (this.core = new h(s)), this
  }
  process(s) {
    try {
      const {
          all: o,
          prefix: f,
          type: i
        } = this.core.main.regexp(Object.keys(this.cssConfig.aliases || {}) || []),
        d = new D({
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
                (t.isImportant ? '!' : '') + (t.rules ? T(t.raw[0], t.raw[1], '', '') : t.raw[6])
            )
        : []
    } catch (o) {
      return console.error('Error extracting class names:', o), []
    }
  }
}
const x = 'hmr:tenoxui',
  w = 'virtual:tenoxui:dev',
  C = '\0' + w,
  E = 'virtual:tenoxui.css',
  _ = '\0' + E
function k() {
  let r,
    s = () => !0,
    o = null,
    f = new O()
  const i = L.resolve('tenoxui.config.js')
  async function d() {
    try {
      if (S.existsSync(i)) {
        const n = await import(R(i).href + `?t=${Date.now()}`)
        ;(r = n.default || n), (o = new h(r.css)), f.setConfig({ css: r.css })
        const { include: c, exclude: a } = r
        s = v(c, a)
      } else console.warn('⚠️ Config file not found, using empty config'), (r = {}), (s = () => !0)
    } catch (e) {
      console.error('❌ Error loading framework config:', e), (r = {})
    }
  }
  let l,
    t = '',
    u = []
  const m = /* @__PURE__ */ new Set()
  function p() {
    var n
    return o ? o.render(((n = r.css) == null ? void 0 : n.apply) || {}, Array.from(m)) : ''
  }
  async function y() {
    m.clear()
    const e = await U(r.include || [], {
      ignore: r.exclude || []
    })
    for (const n of e) {
      const c = S.readFileSync(n, 'utf-8'),
        a = f.process(c)
      for (const g of a) m.add(g)
    }
  }
  function I(e) {
    for (const n of u)
      n.ws.send({
        type: 'custom',
        event: x,
        data: e
      })
  }
  return [
    {
      name: 'tenoxui:global',
      configResolved(e) {
        l = e.command
      },
      async buildStart() {
        await d(), await y(), (t = p())
      }
    },
    {
      name: 'tenoxui:dev',
      resolveId(e) {
        if (e === w) return C
      },
      load(e) {
        if (e === C)
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
                c.end(p()))
              : a()
          }),
          e.watcher.on('change', (n) => {
            if (
              (n === i &&
                (console.warn('TenoxUI config file changed, reloading...'),
                e.ws.send({ type: 'full-reload' })),
              s(n))
            ) {
              const c = S.readFileSync(n, 'utf-8'),
                a = f.process(c)
              for (const g of a) m.add(g)
              ;(t = p()), I(t)
            }
          })
      }
    },
    {
      name: 'tenoxui:build',
      resolveId(e) {
        if (e === E) return _
      },
      load(e) {
        if (e === _) return l === 'build' ? t : '/* nothing to do :3 */'
      }
    }
  ]
}
export { k as default }
//# sourceMappingURL=index.es.js.map
