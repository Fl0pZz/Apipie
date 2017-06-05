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

## API

### Options

#### name

type: `String` - наименование метода

#### meta

type: `Object` - объект с данными, доступ к которым есть в хуках

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
