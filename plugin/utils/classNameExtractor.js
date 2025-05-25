// new - classNameExtractor.js
import Ngurai from 'nguraijs'
import { TenoxUI, constructRaw } from 'tenoxui'

export class Extractor {
  constructor({ css = { property: { bg: 'background' } }, rules = [] } = {}) {
    this.config = rules
    this.cssConfig = css
    this.core = new TenoxUI(this.cssConfig)
  }

  setConfig({ css = {}, rules = [] } = {}) {
    this.config = rules
    this.cssConfig = css
    this.core = new TenoxUI(css)
    return this
  }

  process(code) {
    try {
      const { all, prefix, type } = this.core.main.regexp(
        Object.keys(this.cssConfig.aliases || {}) || []
      )

      const nx = new Ngurai({
        customOnly: true,
        noUnknownToken: true,
        noSpace: true,
        custom: {
          className: [
            new RegExp(`!?${all.slice(1, -1)}`),
            new RegExp(`!?(?:(${prefix}):)?${type}`),
            ...this.config.map((reg) => {
              const source = reg.source
              return new RegExp(`!?${source}`, reg.flags)
            })
          ]
        }
      })

      const classNames = [
        ...new Set(
          nx
            .process(code)
            .flatMap((line) => line.filter((token) => token.type === 'className'))
            .map((token) => token.value)
        )
      ]

      return classNames.length > 0
        ? this.core
            .process(classNames)
            .map(
              (i) =>
                (i.isImportant ? '!' : '') +
                (i.rules ? constructRaw(i.raw[0], i.raw[1], '', '') : i.raw[6])
            )
        : []
    } catch (error) {
      console.error('Error extracting class names:', error)
      return []
    }
  }
}
