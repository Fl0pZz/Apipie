## Почему я должен использовать эту либу, вместо того же axios?

`Apify` это не просто еще одна обертка над `fetch`, в вервую очередь `apify` редоставляет единый стандарт описания запросов к серверу с хуками и мета данными, которые позволяют вам еще на стадии подготовки запроса изменять, формировать или отклонять его, например если пользовать не авторизирован, а запрос возможен только для авторизированных пользователей.

## Небольшая история развития

Основная идея декларации взята из `VueRouter`, поэтому тут есть `meta`, `hooks`, `children`, `name`, однако реализация хуков позаимствованна у `koa2-middleware`, а параметры запроса задаются в `options`, как при задании запросов с помощью `axios`.
Кроме того, добавлен некоторый синтаксический сахар: `url` и `method`.

### Hooks

Хуки описываеются точно так же как и в `koa2-middlewares`, однако стоит отметить несколько отличий:
* context это состоит из `meta`, `response`, `options`
* исполняются в виде цепочки промисов (Promise chaining)

### Request

Настройки запроса через `options` почти полностью взяты у [axios](https://github.com/mzabriskie/axios#request-config), однако стоит акцентировать внимание на `url`. Внутри `apify` использует [path-to-regexp](https://github.com/pillarjs/path-to-regexp) поэтому теперь поддерживают пути вида `/something/:id/`, просто для этого нужно передать при вызове метода `url_params: { id: /* something */ }`

### Meta

Каждый хук имеет доступ к `meta`, в декларации каждый метод может добавлять к какое-нибудь поле.
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

## API

### Options

#### name

type: `String` - наименование метода

#### meta

type: `Object` - подробнее смотри выше.

#### hook

type: `Function: (ctx, next) => Promise` - функция. Чтобы прервать исполнение цепочки используйте `throw`.

#### children

type: `Array<Object>` - список дочерних API.

### VueApify methods

#### create

type: `Object`- возвращает js объект, полученный из трансформирования декларации
