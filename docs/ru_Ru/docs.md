## Почему я должен использовать эту либу, вместо того же axios?

`Apify` это не просто еще одна обертка над `fetch`. В первую очередь `apify` предоставляет единый стандарт описания запросов к серверу с хуками и мета данными, которые позволяют вам еще на стадии подготовки запроса изменять, формировать или отклонять его, например если пользовать не авторизован, а запрос возможен только для авторизованных пользователей.

## Небольшая история развития

Основная идея декларации взята из `VueRouter`, поэтому тут есть `meta`, `hooks`, `children`, `name`. Однако реализация хуков позаимствованна у `koa2-middleware`, а параметры запроса задаются в `options`, как при задании параметров с помощью `axios`.
Кроме того, добавлен некоторый синтаксический сахар: `url` и `method`.

### Hooks

Хуки описываются точно так же как и в `koa2-middlewares`. Однако стоит отметить несколько отличий:
* context состоит из `meta`, `response`, `options`
* хуки исполняются в виде цепочки промисов (Promise chaining)

### Request

Настройки запроса через `options` почти полностью взяты у [axios](https://github.com/mzabriskie/axios#request-config), однако стоит акцентировать внимание на `url`. `Apify` внутри использует [path-to-regexp](https://github.com/pillarjs/path-to-regexp), поэтому теперь поддерживаются пути вида `/something/:id/`. Для этого нужно передать при вызове метода `url_params: { id: /* something */ }`.

### Meta

Каждый хук имеет доступ к `meta`. В декларации каждый метод может добавлять какое-нибудь поле.
```js
{
  name: 'user',
  meta: { something1: true },
  hook: (ctx, next) => { ctx.meta.something1 // true }
  children: [
    { 
      name: 'get',
      meta: { something2: false },
      hook: (ctx, next) => {
        ctx.meta.something1 // true
        ctx.meta.something2 // false
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
this.$api.user({ url_params: { id: user_id } }) // GET: /user/123
```

Объект, который вы передаете как аргумент при вызове содержит 3 поля:
```js
{
  usr_params, // Те переменные и их значения, что будут подставлены в путь
  params,     // Параметры запроса как в params в axios
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

## API

### Options

#### name

type: `String` - наименование метода

#### meta

type: `Object` - объект с данными, доступ к которым есть в хуках

#### url

type `string` - url запроса, в том числе поддерживает [именнование параметры](https://github.com/pillarjs/path-to-regexp#named-parameters)

#### method

type `string` - тип метода, как `axios options method`

#### options

type `Object` - смотри [axios request-config](https://github.com/mzabriskie/axios#request-config)

#### hook

type: `Function: (ctx, next) => Promise` - функция. Чтобы прервать исполнение цепочки используйте `throw`.

#### children

type: `Array<Object>` - список дочерних API.

### VueApify methods

#### create

type: `Function: (records, options)`- возвращает js объект, полученный из трансформирования декларации

`records` - объект с декларациями запросов

```
options: 
{
  axiosInstance,
  globalHook
}
```
