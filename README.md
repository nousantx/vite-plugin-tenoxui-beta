# TenoxUI + Vite

A seamless way to integrate [TenoxUI](https://github.com/tenoxui/tenoxui) in vite!

## Installation

1. Install the plugin

```bash
npm i vite-plugin-tenoxui-beta
```

2. Use plugin

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import tenoxui from 'vite-plugin-tenoxui-beta'

export default defineConfig({
  plugins: [tenoxui()]
})
```

3. Add TenoxUI configuration

```javascript
// tenoxui.config.js
export default {
  include: ['index.html', 'src/**/*.{js,jsx}'],
  exclude: ['**/node_modules/**/*', '**/dist/**/*'],
  css: {
    // TenoxUI configuration here ...
    property: {
      bg: 'background',
      text: 'color',
      flex: 'display: flex'
    },
    apply: { body: 'bg-red' }
  }
}
```

4. Import modules

```javascript
// main.js
import 'virtual:tenoxui:dev'
import 'virtual:tenoxui.css'
```

5. Start writing your class names!

```javascript
export default function App() {
  return <div className="bg-red text-blue flex"></div>
}
```
