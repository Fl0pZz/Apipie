# Vue-apify

This is a tool for transforming the declaration of api call to js object.
Inspired by VueRouter, Vue render function declaration, koa2.

## Installation
```bash
# Using yarn:
yarn install vue-apify
# Using npm:
npm install vue-apify
```

Using CDN:
```html
<script src="https://unpkg.com/vue-apify"></script>
```

```js
import Vue from 'vue'
import VueApify, { h } from 'vue-apify'
import axios from 'axios'

const apiDecl = [
  h('user', 'get', '/user/:id')
]

const api = VueApify.create(apiDecl, { axiosInstance: axios.create() })

Vue.use(apify)

new Vue({
  // ...
  api,
  // ...
  mounted () {
    api.user([1]) // GET: /user/1
      .then(ctx => {
        console.log(ctx.response)
      })
  }
})
```
### Documentations
[See here](/docs)
