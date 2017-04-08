# Vue-apify

Transform api declaration to js object.

## Installation
```bash
# yarn
yarn install
# npm
npm install
```

## Example
```js
const api = [
    {
        name: 'user',
        type: 'get',
        meta: { requireAuth: true },
        exec: meta => axios.get(path, payload),
        children: [
            {
                name: 'settings',
                beforeHook: (meta, next) => {
                  console.log('beforeHook UserSettings', meta)
                  next()
                },
                exec: meta => axios(path, payload)}
            }
        ]
    }
]
// Transform to api with methods:
api.user.get()
api.user.settings()
```