import { Ngurai } from '@nguraijs/core'
import { createMatcher, createTenoxUI } from '@tenoxui/plugin-moxie'

const processCache = new Map()
const CACHE_MAX_SIZE = 500

export class Extractor {
  constructor({
    rules = [],
    // core config
    utilities = {},
    variants = {},
    plugins = [],
    // moxie config
    priority = 0,
    prefixChars = [],
    typeSafelist = [],
    valuePatterns = []
  } = {}) {
    this.matcher = null
    this.config = rules
    this.cssConfig = {
      utilities,
      variants,
      plugins,
      priority,
      prefixChars,
      typeSafelist,
      valuePatterns
    }

    this.core = null
    this.isInitialized = false

    try {
      this._initializeCore()
      this.init()
    } catch (error) {
      console.error('❌ Error initializing Extractor:', error)
      this._initializeFallback()
    }
  }

  _initializeCore() {
    this.core = createTenoxUI({
      ...this.cssConfig,
      onMatcherCreated: (result) => {
        this.matcher = result
      }
    })
  }

  _initializeFallback() {
    this.core = createTenoxUI({})
    console.warn('⚠️ Using fallback extractor configuration')
  }

  init() {
    try {
      if (this.core) {
        this.core.process('[--moxie-is-init]-true')
        this.isInitialized = true
      }
    } catch (error) {
      console.warn('⚠️ Error during extractor initialization:', error.message)
      this.isInitialized = false
    }
  }

  setConfig(config = {}) {
    try {
      // Validate input
      if (typeof config !== 'object') {
        throw new Error('Config must be an object')
      }

      this.config = Array.isArray(config.rules) ? config.rules : []
      this.cssConfig = {
        utilities: config.utilities || {},
        variants: config.variants || {},
        plugins: config.plugins || [],
        priority: config.priority || 0,
        prefixChars: config.prefixChars || [],
        typeSafelist: config.typeSafelist || [],
        valuePatterns: config.valuePatterns || []
      }

      // Clear cache when config changes
      processCache.clear()

      this.core = createTenoxUI({
        ...config,
        onMatcherCreated: (x) => {
          this.matcher = x
        }
      })

      this.init()

      return this
    } catch (error) {
      console.error('❌ Error setting extractor config:', error)
      return this
    }
  }

  _createCacheKey(code) {
    let hash = 0
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return hash.toString()
  }

  _manageCacheSize() {
    if (processCache.size >= CACHE_MAX_SIZE) {
      const keysToDelete = Array.from(processCache.keys()).slice(
        0,
        Math.floor(CACHE_MAX_SIZE * 0.2)
      )
      keysToDelete.forEach((key) => processCache.delete(key))
    }
  }

  _createMatchers() {
    if (!this.matcher?.patterns) {
      return { withValue: null, valueless: null }
    }

    try {
      const withValue = createMatcher(this.matcher.patterns, {
        strict: false,
        valueMode: 2
      })

      const valueless = createMatcher(this.matcher.patterns, {
        withValue: false,
        strict: false
      })

      return { withValue, valueless }
    } catch (error) {
      console.warn('⚠️ Error creating matchers:', error.message)
      return { withValue: null, valueless: null }
    }
  }

  _processWithNgurai(code, matchers) {
    const { withValue, valueless } = matchers

    const tokens = [withValue, valueless]
      .map((reg) => new RegExp(`!?${reg.source}!?`))
      .filter(Boolean)

    if (Array.isArray(this.config) && this.config.length > 0) {
      this.config.forEach((reg) => {
        try {
          if (reg && reg.source) {
            const source = reg.source
            tokens.push(new RegExp(`!?${source}!?`, reg.flags))
          }
        } catch (error) {
          console.warn('⚠️ Invalid regex in config:', error.message)
        }
      })
    }

    if (tokens.length === 0) {
      return []
    }

    try {
      const nx = new Ngurai({
        tokensOnly: true,
        noSpace: true,
        noUnknownTokens: true,
        tokens: {
          className: tokens
        }
      })

      const result = nx.process(code)
      return Array.from(
        new Set(
          result
            .flatMap((line) => line.filter((token) => token.type === 'className'))
            .map((token) => token.value)
            .filter(Boolean)
        )
      )
    } catch (error) {
      console.warn('⚠️ Error processing with Ngurai:', error.message)
      return []
    }
  }

  _validateClassNames(classNames) {
    if (!Array.isArray(classNames) || classNames.length === 0) {
      return []
    }

    if (!this.core) {
      return []
    }

    try {
      const processResult = this.core.process(classNames)
      if (!Array.isArray(processResult)) {
        return []
      }

      return processResult
        .filter((item) => item && item.use === 'moxie' && item.rules && item.className)
        .map((item) => item.className)
        .filter(Boolean)
    } catch (error) {
      console.warn('⚠️ Error validating class names:', error.message)
      return []
    }
  }

  process(code) {
    // Input validation
    if (!code || typeof code !== 'string') {
      return []
    }

    // Check cache first
    const cacheKey = this._createCacheKey(code)
    if (processCache.has(cacheKey)) {
      return processCache.get(cacheKey)
    }

    // Manage cache size
    this._manageCacheSize()

    let result = []

    try {
      // Early return if not properly initialized
      if (!this.isInitialized || !this.matcher) {
        console.warn('⚠️ Extractor not properly initialized')
        processCache.set(cacheKey, result)
        return result
      }

      // Create matchers
      const matchers = this._createMatchers()
      if (!matchers.withValue && !matchers.valueless) {
        processCache.set(cacheKey, result)
        return result
      }

      // Process with Ngurai
      const classNames = this._processWithNgurai(code, matchers)
      if (classNames.length === 0) {
        processCache.set(cacheKey, result)
        return result
      }

      // Validate class names
      result = this._validateClassNames(classNames)

      // Cache the result
      processCache.set(cacheKey, result)
    } catch (error) {
      console.error('❌ Error extracting class names:', error)
      processCache.set(cacheKey, [])
    }

    return result
  }

  // Cleanup method for proper resource management
  destroy() {
    this.clearCache()
    this.matcher = null
    this.core = null
    this.isInitialized = false
  }
}
