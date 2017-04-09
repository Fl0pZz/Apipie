## А оно тебе надо? О.о

Это либка превращает декларацию API в js объект, удобный для использования. Проще говоря, это конструктор api обертки.
Вдохновлено декларирациями путей [VueRouter](https://github.com/vuejs/vue-router), поэтому некоторые идеи и логика заимствована из него.

Инструкция по установке есть в [README](../../README.md), так что тут я оставлю пару ссылок на примеры:
[простой](https://jsfiddle.net/fl0pzz/fdLw70L0/) и 
[чуть сложнее](https://jsfiddle.net/fl0pzz/vndxbxww/)

## А как использовать?

Основные идеи взяты из `VueRouter`, поэтому тут есть `meta`, `hooks`, `children`, `name`, но так же есть и несколько новых опций: `exec`, `type`. Но обо всем по порядку.

### Hooks
Используются так же, как и во `VueRouter`, разве что уточню пару моментов:
* имеют доступ только к `meta` (например `afterHooks` не имеют доступа к возвращаемому значению из запроса)
* исполняются в виде цепочки промисов (Promise chaining)

Есть глобальные хуки (`beforeEach`, `afterEach`) и есть хуки конкретных вызовов (`beforeHook`, `afterHook`). Компонентых хуков пока нет и еще не знаю, стоит ли их реализовывать.

### Some options
`exec` - это главная исполняемая функция. Предполагается, что в ней будет происходить запрос (пусть будет `axios.get('/users')`). `exec` должна быть фабрикой, возращающей промис:
```js
{
  ...
  exec: (args) => axios.get(args) // можно передавать аргументы
  ...
}
```


`type` - что? зачем это?
Очень просто, дпустим у вас есть такие запросы: 
* `GET: /user` - получаем какие-то данные пользователя
* `GET: /user/settings` - пользователь хочет что-то ~~сломать~~ настроить

Хочется обращаться к этому всему как-то так:
```js
api.user()          // GET: /user
api.user.settings() // GET: /user/settings
```
~~Но я так и не смог сделать такой интерфейс~~

`type: 'get'` создаст нового ребенка и положит в `children` такой объект:
```js
{ name: user.type, exec: user.exec }
```
А если будут еще некоторые запросы?
* `DELETE: /user` - вы ему больше не нужны
* `POST: /user` - что-нибудь еще
Тогда в угоду большей выразительности откажитесь от `type` и поместите все методы в `children`:
```js
{
  name: 'user',
  children: [
    { name: 'get',      exec: (args) => axios.get('/user', args) },
    { name: 'delete',   exec: (args) => axios.delete('/user', args) },
    { name: 'post',     exec: (args) => axios.post('/user'. args) },
    { name: 'settings', exec: (args) => axios.get('/user/settings') }
  ]
}
```

### Meta
Ну и пару слов о `meta`. Каждый хук имеет доступ к `meta`, в декларации каждый метод может добавлять к какое-нибудь поле.
Да что говорить, смотрите пример:
```js
{
  name: 'user',
  meta: { something1: true },
  beforeHook: (meta) => { meta.something1 // true }
  children: [
    { 
      name: 'get',
      meta: { something2: false }
      exec: (args) => axios.get('/user', args) },
      afterHook: (meta) => {
        meta.something1 // true
        meta.something2 // false
      }
  ]
}
```

## API
### Options
#### name
type: `String` - наименование метода

#### type
type: `String` - создаст ребенка  `{ name: parent.type, exec: parent.exec }`. Подробнее смотри выше.

#### meta
type: `Object` - подробнее смотри выше.

#### beforeHook
type: `Function: (meta) => Promise` - функция, выполняемя до `exec`. Чтобы прервать исполнение цепочки используйте `throw`.

#### afterHook
type: `Function: (meta) => Promise` - функция, выполняемая после `exec`. Чтобы прервать исполнение цепочки используйте `throw`. Не имеет досутпа к возвращаемому значению `exec`.

#### exec
type: `Function: (args) => Promise` - главная функция, по предположению это какой-то вызов метода `axios` (как пример).
Может принимать аргументы. Подробнее смотри выше.

#### children
type: `Array<Object>` - список дочерних API.

### VueApify methods
#### create
type: `Object`- возвращает js объект, полученный из трансформирования декларации

#### beforeEach
type: `Function: (meta) => Promise` - глобальный хук

#### afterEach
type: `Function: (meta) => Promise` - глобальный хук
