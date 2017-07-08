## How it looked before

Here I tried to release a beautiful and convenient composition of calls to the server.
It works! However, this can hardly be called expressive!!

```js
import axios from './axios-custom'

export const category = () => axios.get('/catalog/categories/')
export const platform = () => axios.get('/catalog/platforms/')
export const apps = () => axios.get('/catalog/apps/')
export const categoryApps = (id) => axios.get('/catalog/apps/', { params: { cat: id } })

export const app = {
  get: id => axios.get(`catalog/apps/${id}`),
  add: id => axios.post(`catalog/addapp/${id}/`),
  delete: id => axios.delete(`catalog/apps/${id}`),
  download: id => axios.get(`catalog/content/${id}`)
}

export const developer = {
  requestApp: (id) => axios.get(`/catalog/developer/request/${id}`),
  requestApps: () => axios.get('/catalog/developer/request/'),
  delRequestApp: (id) => axios.delete(`/catalog/developer/request/${id}`),
  createApp: (data) => axios.post('/catalog/developer/request/', data),
  updateApp: (id, data) => axios.post(`/catalog/developer/request/${id}/`, data),
  app: (id = '') => id === ''
    ? axios.get('/catalog/developer/apps')
    : axios.get(`/catalog/developer/apps/${id}`)
}

export const img = {
  upload: (data) => axios.post('/catalog/developer/image/', data, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const file = {
  upload: (data) => axios.post('/catalog/developer/content/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  post: (id, data) => axios.post(`/catalog/developer/content/${id}/`, data)
}
```

### How it looks now

```js
import axios from 'axios'
import Apipie from 'apipie'

// shorthand property names
const params = true
const data = true

const decl = [
  {
    name: 'app',
    children: [
      { name: 'get', method: 'get', url: 'catalog/apps/:id' },
      { name: 'add', method: 'post', url: 'catalog/addapp/:id' },
      { name: 'delete', method: 'delete', url: 'catalog/apps/:id' },
      { name: 'download', method: 'download', url: 'catalog/content/:id' }
    ]
  },
  {
    name: 'developer',
    children: [
      {
        name: 'app',
        method: 'get',
        url: '/catalog/developer/apps',
        children: [
          { name: 'getOne', method: 'get', '/catalog/developer/apps/:id' }
        ]
      },
      {
        name: 'request',
        children: [
          { name: 'app', method: 'get', url: '/catalog/developer/request/:id' },
          { name: 'apps', method: 'get', url: '/catalog/developer/request/' },
          { name: 'delete', method: 'delete', url: '/catalog/developer/request/:id' },
          { name: 'create', method: 'post', url: '/catalog/developer/request/', data },
          { name: 'update', method: 'post', url: '/catalog/developer/request/:id/', data }
        ]
      }
    ]
  },
  {
    name: 'img',
    children: [
      { name: 'upload', method: 'post', url: '/catalog/developer/image/', data }
    ]
  },
  {
    name: 'file',
    children: [
      { name: 'upload', method: 'post', url: '/catalog/developer/content/', data },
      { name: 'post', method: 'post', url: '/catalog/developer/content/:id/', data }
    ]
  },
  { name: 'category', method: 'get', url: '/catalog/categories/' },
  { name: 'platform', method: 'get', url: '/catalog/platforms/' },
  { name: 'apps', method: 'get', url: '/catalog/apps/' },
  { name: 'categoryApps', method: 'get', url: '/catalog/apps/', params }
]

const apipie = new Apipie(records, { axios })
const api = apipie.create()
export default api
```
