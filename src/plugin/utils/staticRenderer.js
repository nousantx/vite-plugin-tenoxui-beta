import { transform, generateRuleBlock, processVariantSelector } from '@tenoxui/plugin-moxie'

export class Renderer {
  constructor({ main = null, aliases = {}, apply = {} } = {}) {
    this.main = main
    this.aliases = aliases
    this.apply = apply
  }

  processClassesToRules(selector, classNames) {
    if (!this.main) {
      console.warn('Main processor not provided')
      return []
    }

    const results = []
    const baseRulesMap = new Map()

    try {
      const dataRules = this.main.process(classNames)

      if (!dataRules) return []

      dataRules.forEach((rule) => {
        if (rule.use === 'moxie' && rule.rules) {
          const rules = generateRuleBlock(rule.rules, rule.isImportant || false, true)

          if (rule.variant) {
            const variantRule = processVariantSelector(rule.variant, selector, `{ ${rules} }`)
            results.push(variantRule)
          } else {
            if (!baseRulesMap.has(selector)) {
              baseRulesMap.set(selector, [])
            }
            baseRulesMap.get(selector).push(rules)
          }
        }
      })

      baseRulesMap.forEach((rulesList, selectorKey) => {
        if (rulesList.length > 0) {
          const combinedRules = rulesList.join('; ')
          results.unshift(`${selectorKey} { ${combinedRules} }`)
        }
      })
    } catch (error) {
      console.error(`Error processing classes for selector '${selector}':`, error)
    }

    return results
  }

  processObjectRules(data) {
    const allResults = []

    Object.entries(data).forEach(([selector, classNames]) => {
      if (classNames) {
        const results = this.processClassesToRules(selector, classNames)
        allResults.push(...results)
      }
    })

    return allResults
  }

  processAlias(aliasName) {
    const aliasClasses = this.aliases[aliasName]

    if (!aliasClasses) {
      console.warn(`Alias '${aliasName}' not found`)
      return []
    }

    const classSelector = `.${aliasName}`
    return this.processClassesToRules(classSelector, aliasClasses)
  }

  sanitize(classNames) {
    let cns

    if (typeof classNames === 'string') {
      cns = classNames
        .split(/\s+/)
        .map((cn) => cn.trim())
        .filter(Boolean)
    } else if (Array.isArray(classNames)) {
      cns = classNames.filter(Boolean)
    } else {
      return null
    }

    if (cns.length === 0) return null

    const results = {
      classNames: [],
      aliases: []
    }

    cns.forEach((cn) => {
      if (this.aliases[cn]) {
        results.aliases.push(cn)
      } else {
        results.classNames.push(cn)
      }
    })

    return results
  }

  addAlias(name, classes) {
    this.aliases[name] = classes
    return this
  }

  removeAlias(name) {
    if (this.aliases[name]) {
      delete this.aliases[name]
    }
    return this
  }

  processStringOrArray(input) {
    const results = []

    const sanitized = this.sanitize(input)
    if (!sanitized) return results

    const { classNames, aliases } = sanitized

    // alias class names should rendered first
    if (aliases.length > 0) {
      aliases.forEach((aliasName) => {
        const aliasRules = this.processAlias(aliasName)
        if (aliasRules.length > 0) {
          results.push(...aliasRules)
        }
      })
    }

    if (classNames.length > 0 && this.main) {
      try {
        const transformResult = transform(this.main.process(classNames))
        if (transformResult.rules && transformResult.rules.length > 0) {
          results.push(...transformResult.rules)
        }
      } catch (error) {
        console.error('Error processing class names:', error)
      }
    }

    return results
  }

  render(...args) {
    const results = []

    args.forEach((arg) => {
      try {
        if (typeof arg === 'object' && !Array.isArray(arg)) {
          const objectRules = this.processObjectRules(arg)
          if (objectRules.length > 0) {
            results.push(...objectRules)
          }
        } else if (typeof arg === 'string' || Array.isArray(arg)) {
          const stringArrayRules = this.processStringOrArray(arg)
          if (stringArrayRules.length > 0) {
            results.push(...stringArrayRules)
          }
        }
      } catch (error) {
        console.error('Error processing render argument:', error, arg)
      }
    })

    const applyRules =
      Object.keys(this.apply).length > 0
        ? this.processObjectRules(this.apply).join('\n') + '\n'
        : ''
    const mainRules = results.length > 0 ? results.join('\n') : ''

    return applyRules + mainRules
  }

  clear() {
    this.aliases = {}
    this.apply = {}
  }
}
