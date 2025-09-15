import { Extractor } from './src/plugin/utils/classNameExtractor.js'
import { Renderer } from '@tenoxui/plugin-moxie'
import { is, has } from 'cssrxp'
let globalMatcher = null

const ext = new Extractor({
  utilities: {
    bg: 'background'
  },
  valuePatterns: ['#[0-9a-fA-F]+', has.time]
})

const ren = new Renderer({ main: ext.core })

const classNames = ext.process(
  '"bg-red" [--clr]-red [margin]-10px [margin]-10 [x]-px902 bg-1/6 bg-[100px/40px]" !bg-blue[transition]-300ms'
)

console.log(classNames)
console.log(/#[0-9a-fA-F]+/.test('#ccf654'))
