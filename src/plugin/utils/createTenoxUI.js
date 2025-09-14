import { TenoxUI } from '@tenoxui/core'
import { Moxie, transform, createMatcher } from '@tenoxui/plugin-moxie'
import { has } from 'cssrxp'

export function create(config) {
  const {
    // core config
    utilities = {},
    variants = {},
    plugins = [],
    // moxie config
    priority = 0,
    prefixChars = [],
    typeSafelist = [],
    valuePatterns = [],
    onMatcherCreated = null,
    moxiePlugins = []
  } = config

  const { moxie: __MOXIE_UTILITIES__ = {}, ...otherUtilities } = utilities

  return new TenoxUI({
    utilities: {
      ...otherUtilities,
      __MOXIE_UTILITIES__
    },
    variants,
    plugins: [
      ...plugins,
      Moxie({
        onMatcherCreated: (result) => {
          if (onMatcherCreated) onMatcherCreated(result)
        },
        utilitiesName: '__MOXIE_UTILITIES__',
        priority,
        prefixChars,
        typeSafelist,
        plugins: moxiePlugins,
        valuePatterns: [has.length, has.ratio, ...valuePatterns]
      })
    ]
  })
}

export default create
