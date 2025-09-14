import { Ngurai } from '@nguraijs/core'
import { TenoxUI } from '@tenoxui/core'
import { Moxie, transform, createMatcher } from '../../../moxie.js'
import { create as CreateTenoxUI } from './createTenoxUI.js'
import { Renderer } from './staticRenderer.js'

export class Extractor {
  constructor({
    rules = [],
    // core config
    utilities = {},
    variants = {},
    plugins = [],
    // renderer config
    aliases = {},
    apply = {},
    // moxie config
    priority = 0,
    prefixChars = [],
    typeSafelist = [],
    valuePatterns = [],
    moxiePlugins = []
  } = {}) {
    this.matcher
    this.config = rules
    this.cssConfig = {
      utilities,
      variants,
      plugins,
      priority,
      prefixChars,
      typeSafelist,
      moxiePlugins,
      valuePatterns
    }

    this.core = CreateTenoxUI({
      ...this.cssConfig,
      onMatcherCreated: (result) => {
        this.matcher = result
      }
    })
    this.main = new Renderer({
      main: this.core,
      aliases,
      apply
    })

    this.init()
  }

  init() {
    this.core.process('[--moxie-is-init]-true')
  }

  render(...cn) {
    return this.main.render(...cn)
  }

  setConfig(css = {}) {
    this.config = css.rules
    this.cssConfig = css
    this.core = CreateTenoxUI({
      ...css,
      onMatcherCreated: (x) => {
        this.matcher = x
      }
    })
    this.init()
    return this
  }

  process(code) {
    if (!code) return []
    try {
      const withValue = createMatcher(this.matcher.matcher.patterns, {
        strict: false,
        valueMode: 2
      })

      const valueless = createMatcher(this.matcher.matcher.patterns, {
        withValue: false,
        strict: false
      })

      const nx = new Ngurai({
        tokensOnly: true,
        noSpace: true,
        noUnknownTokens: true,
        tokens: {
          className: [
            withValue,
            valueless,
            // new RegExp(reg2),
            ...this.config.map((reg) => {
              const source = reg.source
              return new RegExp(`!?${source}`, reg.flags)
            })
          ]
        }
      })

      const classNames = Array.from(
        new Set(
          nx
            .process(code)
            .flatMap((line) => line.filter((token) => token.type === 'className'))
            .map((token) => token.value)
        )
      )

      const validatedClassNames =
        classNames.length > 0
          ? (this.core.process(classNames) || [])
              .map((item) => item.use === 'moxie' && item.rules && item.className)
              .filter(Boolean)
          : []

      return validatedClassNames
    } catch (error) {
      console.error('Error extracting class names:', error)
      return []
    }
  }
}
