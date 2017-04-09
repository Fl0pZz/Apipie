# Vue-apify

Transform api declaration to js object. Inspired by VueRouter path declaration.
[Try it here](https://jsfiddle.net/w6amy6az/1/)
## Installation
```bash
# yarn
yarn install vue-apify
# npm
npm install vue-apify
```

```js
import Vue from 'vue'
import VueApify from 'vue-apify'

const api = [
  { name: 'something', exec: axios.get(path, payload) }
]

const apify = new VueApify(api)
const api = apify.create()

Vue.use(apify)

new Vue({
  // ...
  api,
  // ...
})
```
[or use unpkg](https://unpkg.com/vue-apify)
## Example
```js
const api = [
  {
    name: 'user',
    type: 'get',
    meta: { requireAuth: true },
    exec: axios.get(path, payload),
    children: [
      {
        name: 'settings',
        beforeHook: (meta) => {
          console.log('beforeHook UserSettings', meta)
        },
        exec: axios.get(path, payload)}
      }
    ]
  }
]
// Transform to api with methods:
api.user.get()
api.user.settings()
```

## How to use

### Options
*   `name`
*   `type`
*   `meta`
*   `beforeHook`
*   `afterHook`
*   `exec`
*   `children`

### Global hooks
*   `beforeEach`
*   `afterEach`

### VueApify methods
*   `create()`
*   `beforeEach(fn)`
*   `afterEach(fn)`
