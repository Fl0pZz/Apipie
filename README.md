# Apipie
Thanks [Akiyamka](https://github.com/akiyamka) for new project name!! (Previously called VueApify)

This is a tool for transforming the declaration of REST Api to js object.
Inspired by VueRouter, koa2 and axios.

[Try it here!](https://jsfiddle.net/fl0pzz/1n90wtn0/7/)

## Installation

```bash
# Using yarn:
yarn add apipie
# Using npm:
npm install apipie
```

Using CDN:

```html
<script src="https://unpkg.com/apipie"></script>
```

```js
import Apipie from 'apipie'
import axios from 'axios'

const hook = async (ctx, next) => {
  console.log(`I'm hook!`)
  await next()
}

const decl = [
  {
    name: 'user', // Further you'll use it as `api.user()` for sending request
    // All of the options you'll find https://github.com/mzabriskie/axios#request-config
    options: { ... }
    url: '/user/:id',
    method: 'get'
  },
  { // You can not call api.settings(), but api.settings.get() will be available
    name: 'settings', url: '/settings', method: 'get',
    children: [
      { name: 'setStatus', url: '/set_status', method: 'post' },
      { name: 'changeAvatar', url: '/change_avatar', method: 'post' }
    ]
  }
]

const apipie = new Apipie(decl, { axios })
apipie.globalHook(hook) // Global hook is also available
const api = apipie.create()

api.user({ url_params: { id: 1 } }) // GET: /user/1
  .then(ctx => {
    console.log(ctx.response) // Response schema as here:
                              // https://github.com/mzabriskie/axios#response-schema
  })

// POST: /set_status?status=my_status
api.settings.setStatus({ params: { status: 'my_status' } })
  .then(ctx => { console.log(ctx.response) })

const avatar = // ...
api.settings.changeAvatar({ data: { avatar } })
```

### Documentations
[See here](/docs)

### TODO
* Stacking of paths
* More examples
