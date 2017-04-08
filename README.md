# Vue-apify

Transform api declaration to js object. Inspired by VueRouter path declaration.

## Installation
```bash
# yarn
yarn install vue-apify
# npm
npm install vue-apify
```

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
