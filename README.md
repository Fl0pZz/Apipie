# Apipie

Утилита для построения из декларативно описанного дерева REST API endpoint's в слой api в виде объекта с функциями.

Проект вдохновлен VueRouter, koa2 и axios.

Использует для обработки путей [path-to-regexp](https://github.com/pillarjs/path-to-regexp) и для отправки http запросов [axios](https://github.com/mzabriskie/axios)

## Установка

```bash
# Через yarn:
yarn add apipie
# Через npm:
npm install apipie
```

С помощью CDN

```html
<script src="https://unpkg.com/apipie"></script>
```

## Пример

### Api.js

```js
import createApi from 'apipie'
import axios from 'axios'

const hook = async (ctx, next) => {
  console.log(`I'm hook!`)
  await next()
}

const data = true
const query = true

const resources = [
  {
    name: 'user', // Далее это будет использоваться для отправки запроса
    options: { ... }, // Все опции можно найти https://github.com/mzabriskie/axios#request-config
    get: '/user/:id', // Сахар который будет преобразован в { url: '/user/:id', method: 'get' }
  },
  {
    name: 'settings',
    url: '/settings',
    method: 'get',
    children: [
      { 
        name: 'setStatus', 
        post: '/set_status',
        query // Если query = true, то передача query параметров для этого ресурса будут обязательными.
      },
      { name: 'changeAvatar',
        url: '/change_avatar',
        method: 'post'
      }
    ]
  }
]

/**
* Все глобальные настройки для axios можно определить заранее.
* Есть возможность прокидывать глобальные хуки, которые выполняют перед запросом в axios.
*/

const api = createApi(resources, axios, { hooks: [ hook ] })

export default api
```

### Somefile.js

```js
import api from './api'

api.user() // Выкинет ошибку, так как :id обязательный параметр. За подробностями https://github.com/pillarjs/path-to-regexp

api.user({ params: { id: 1 } }) // GET: /user/1
  .then(ctx => { console.log(ctx.response) }) // Схему для response, можно посмотреть тут https://github.com/mzabriskie/axios#response-schema
// Схему для объекта ctx смотрите в документации дальше.


api.settings() // GET: /settings

api.settings.setStatus() // Ошибка, нужно передать query объект.

// POST: /set_status?status=my_status
api.settings.setStatus({ query: { status: 'my_status' } })
  .then({ response } => { console.log(response) })


const avatar = document.querySelector('img').src

api.settings.changeAvatar({ data: { avatar } }) // Так же можно передать FormData, https://github.com/mzabriskie/axios#request-config
```
