import { TenoxUI } from 'tenoxui'
import config from './tenoxui.config.js'

const css = new TenoxUI({
  ...config.css
})

console.log(
  // should generate only 3 css rules
  css.render([
    'iam-frfr-5', // 5 * 0.25 + rem = 1.25rem
    'iam-frfr-5px', // 5px, 5 = value, px = unit
    'hover:iam-frfr-5rem', // 5rem
    'iam-frfr', // null, value isn't defined
    'iam-frfr-5px/5' // null, second value (value after /) is defined
  ])
)
