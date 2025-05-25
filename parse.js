import fs from 'node:fs'

import config from './tenoxui.config.js'

import { Extractor } from './plugin/utils/classNameExtractor.js'

const nx = new Extractor().setConfig({ css: config.css })

console.log(nx.process(fs.readFileSync('./src/App.jsx', 'utf-8')))
