import { TenoxUI } from 'tenoxui'

const css = new TenoxUI({
  aliases: {
    btn: '[background]-red',
    'btn-icon': '[background]-blue',
    'btn-2px/40px': '[background]-red'
  }
})

console.log(css.render('btn btn-icon btn-2px/40px'))
