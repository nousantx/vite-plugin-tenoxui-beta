import { Extractor } from './src/plugin/utils/classNameExtractor.js'
import { Renderer } from './src/plugin/utils/staticRenderer.js'
import { is, has } from 'cssrxp'

const ext = new Extractor({
  utilities: {
    moxie: {
      bg: 'background'
    }
  }
})

const ren = new Renderer({ main: ext.core })

const classNames = ext.process(
  '"bg-red" [--clr]-red [margin]-10px [margin]-10 [x]-px902 bg-1/6 bg-[100px/40px]" !bg-blue'
)

console.log(classNames)

console.log(ren.render(classNames))
