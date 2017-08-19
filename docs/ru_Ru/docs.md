## Почему я должен использовать эту либу, вместо того же axios?

`Apipie` это не просто еще одна обертка над `fetch`. В первую очередь `apipie` предоставляет единый стандарт описания запросов к серверу с хуками и мета данными, которые позволяют вам еще на стадии подготовки запроса изменять, формировать или отклонять его, например если пользовать не авторизован, а запрос возможен только для авторизованных пользователей.

## Небольшая история развития

Основная идея декларации взята из `VueRouter`, поэтому тут есть `meta`, `hooks`, `children`, `name`. Однако реализация хуков позаимствованна у `koa2-middleware`, а параметры запроса задаются в `options`, как при задании параметров с помощью `axios`. Версии `v0.12.*` были добавлены `query` и `data`, которые позволяют явно указать, что запросы явно требуют `axios.options.query` и `axios.options.data`.
Кроме того, добавлен некоторый синтаксический сахар: `url` и `method`.

В версии `v0.9` был переписан движок (а в версии `v0.10`), который конструировал объект по декларации, теперь он не обсчитывает все пути при инициализации, а делает это лениво и только те узлы, которые необходимы для выполнения запроса, при этом кешируя промежуточные результаты.

### Hooks

Хуки описываются точно так же как и в `koa2-middlewares`. Однако стоит отметить несколько отличий:
* context состоит из `meta`, `response`, `options`
* хуки исполняются в виде цепочки промисов (Promise chaining), а это значит, что каждый хук ДОЛЖЕН возвращать промис (используйте async/await для этого)

### Request

Настройки запроса через `options` почти полностью взяты у [axios](https://github.com/mzabriskie/axios#request-config), однако стоит акцентировать внимание на `url`. `Apipie` внутри использует [path-to-regexp](https://github.com/pillarjs/path-to-regexp), поэтому теперь поддерживаются пути вида `/something/:id/`. Для этого нужно передать при вызове метода `params: { id: /* something */ }`.

### Meta

Каждый хук имеет доступ к `meta`. В декларации каждый метод может добавлять какое-нибудь поле.
```js
{
  name: 'user',
  meta: { something1: true },
  hook: async (ctx, next) => { 
    ctx.meta.something1 // true
    await next()
  },
  children: [
    { 
      name: 'get',
      meta: { something2: false },
      hook: async (ctx, next) => {
        ctx.meta.something1 // true
        ctx.meta.something2 // false
        await next()
      }
  ]
}
```

### Global hook

Это хук, который будет применен первым к каждой записи. Передается во втором параметре статической функции `create` в поле `globalHook`.

### Calls

Допустим вы определили такую декларацию:
```js
{ 
  name: 'user', // Further you'll use it as `api.user()` for sending request
  url: '/user/:id',
  method: 'get'
}
```
Теперь вы можете его вызвать внутри `Vue` как:
```js
const user_id = 123;
this.$api.user({ params: { id: user_id } }) // GET: /user/123
```

Объект, который вы передаете как аргумент при вызове содержит 3 поля:
```js
{
  params, // Те переменные и их значения, что будут подставлены в путь
  query,     // Параметры запроса как в query в axios
  data        // Данные, которые необходимо передать
}
```

#### Syntax sugar

Часто придется писать такие простые запросы:
```js
{ name: 'test', options: { url: '/test', method: 'get' } }
```

Вместо этого можно использовать более красивый синтаксис для декларации этого же самого запроса:
```js
{ name: 'test', url: '/test', method: 'get' }
```

#### Context

Контекст состоит из 5 полей:
```js
{
  meta,
  options,
  response,
  name,
  fullName // Array, например для api.user.settings fullName = [ 'user', 'settings' ]
}
```

### Data&query&params validations

Хочется сразу видеть, что запрос требует `query` и/или `data`.

#### query

Если при декларировании указать `query: true`, то при вызове метода будет сделана проверка, что `query` передана в параметрах вызова, если ее нет, то будет вызвано исключение.

#### Data

Аналогичный механиз применяется и для валидации `data`.

#### params

Для валидации `params` не нужно ничего довольнительно добавлять, вы это уже сделали, когда воспользовалиись именованными параметрами при указании пути: `url: '/test/:id1/:id2'`. При вызове будет проверено не только начиличие переданных параметров в `{ params: {...} }`, но проверено на соответсвие с тем, что указано в декларации, в данном примере ожидаются `id1` и `id2`. Если валидация выявит ошибку, то будет сгенерировано исключение, с описанием ожидаемых именованных параметров и переданных. Более того, вы можете использовать больше возможностей, такие как [опциональные именованные параметры](https://github.com/pillarjs/path-to-regexp#optional), [безымяные параметры](https://github.com/pillarjs/path-to-regexp#unnamed-parameters), и многое другое, что может [pathToRegexp](https://github.com/pillarjs/path-to-regexp).

## API

### Options

#### name

type: `String` - наименование метода

#### meta

type: `Object` - объект с данными, доступ к которым есть в хуках

#### url

type `string` - url запроса, в том числе поддерживает [именованные параметры](https://github.com/pillarjs/path-to-regexp#named-parameters)

#### method

type `string` - тип метода, как `axios options method`

#### options

type `Object` - смотри [axios request-config](https://github.com/mzabriskie/axios#request-config)

#### hook

type: `Function: (ctx, next) => Promise` - функция. Чтобы прервать исполнение цепочки используйте `throw`.

#### children

type: `Array<Object>` - список дочерних API.

#### data

type: `Boolean` - флаг необходимости проверки передаваемых данных при вызове

#### query

type: `Boolean` - флаг необходимости проверки передаваеммых параметров при вызове

### Apipie methods

#### create

type: `Function: (records, options)`- возвращает js объект, полученный из трансформирования декларации

`records` - объект с декларациями запросов

```
options: 
{
  axios
}
```

#### globalHook

type: `Function: (ctx, next) => Promise`
