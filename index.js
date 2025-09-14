import { Extractor } from './src/plugin/utils/classNameExtractor.js'
import { is, has } from 'cssrxp'

const ext = new Extractor({
  utilities: {
    bg: 'background'
  }
})

console.log(
  ext.render(
    ext.process('"bg-red" [--clr]-red [margin]-10px [margin]-10 [x]-px902 bg-1/6 bg-[100px/40px]"')
  )
)
