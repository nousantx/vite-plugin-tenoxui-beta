async function loadConfig() {
    try {
      configPath = path.resolve(configFile)

      if (fs.existsSync(configPath)) {
        const configURL = pathToFileURL(configPath).href + `?t=${Date.now()}`
        const data = await import(configURL)
        config = data.default || data
        extractor.setConfig({ css: mainConfig.css })
        mainTx = new TenoxUI(mainConfig.css)
        const { include = [], exclude = [] } = config
        includeFilter = createFilter(include, exclude)
      } else {
        console.warn('⚠️ Config file not found, using empty config')
        config = {}
        includeFilter = () => true
      }
    } catch (error) {
      console.error('❌ Error loading framework config:', error)
      config = {}
    }
  }

  const allClassNames = new Set()

  function generateCSS() {
    if (!mainTx) return ''
    const styles = mainTx.render(mainConfig.css.apply, Array.from(allClassNames))
    return styles
  }

  async function scanAllFiles() {
    allClassNames.clear()
    const files = await fg(mainConfig.include || [], { ignore: mainConfig.exclude || [] })
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      const classNames = extractor.process(content)
      for (const name of classNames) {
        allClassNames.add(name)
      }
    }
  }