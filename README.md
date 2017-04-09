# Vue-apify

Constructor of api-wrapper. Inspired by VueRouter path declaration.
[Try it here](https://jsfiddle.net/fl0pzz/fdLw70L0/) or
[here](https://jsfiddle.net/fl0pzz/vndxbxww/)
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
import VueApify from 'vue-apify'

const options = [
  { name: 'something', exec: () => axios.get(path, payload) }
]

const apify = new VueApify(options)
const api = apify.create()

Vue.use(apify)

new Vue({
  // ...
  api,
  // ...
})
```
### Documentations
[See here](/docs)
