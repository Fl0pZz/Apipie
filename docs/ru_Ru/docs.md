## How to use

### Options
*   `name` - именование промежуточного пути или метода
*   `type` - `get/put/delete/...`. используется для случая, когда:
```js
{
  name: 'user',
  type: 'get',
  exec: Promise.resolve(),
  children: [
    {
      name: settings,
      exec: Promise.resolve
    }
  ]
}
// transform to
user.get() // для получаения данных пользователя
user.settings() // получить настройки пользователя
```

*   `meta` - некоторая мета, как в `VueRouter`
```js
{
  name: 'user',
  type: 'get',
  meta: { someMeta1: true }
  exec: Promise.resolve(),
  children: [
    {
      name: settings,
      meta: { someMeta2: true }
      beforeHook: (meta) => {
        meta.someMeta1 // true
        meta.someMeta2 // true
      }
      exec: Promise.resolve
    }
  ]
}
```

*   `beforeHook` - хук, выполняемый до `exec`
*   `afterHook` - хук, выпоняемый после выполнения `exec`
*   `exec` - исполняемая функция. Должна быть Promise
*   `children` - список потомков

### VueApify methods
*   `create()` - возвращает js объект, полученный из трансофрмирования декларации
*   `beforeEach(fn)` - глобальный хук
*   `afterEach(fn)` - глобальный хук
