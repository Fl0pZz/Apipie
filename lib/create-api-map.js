import { warn } from './utils/warn'

export function createApiMap (options, { beforeHooks, afterHooks }) {
  const apiMap = {}
  options.forEach(api => addApiRecord(apiMap, api, { beforeHooks, afterHooks } ))
  return apiMap
}

export function addApiRecord (apiMap, api, hooks, meta = {}) {
  api = normalizeRecord(api, hooks, meta)
  
  apiMap[api.name] = {}
  const { beforeHooks, afterHooks } = api
  if (api.children.length) {
    api.children
      .forEach(child => addApiRecord(apiMap[api.name], child, { beforeHooks, afterHooks }, api.meta))
    return
  }
  apiMap[api.name] = function exec() {
    // преобразуем в итератор
    let iterators = beforeHooks.slice(1, beforeHooks.length).entries()
    // возвращает ссылку на исполняемый хук
    const next = () => {
      const it = iterators.next()
      if (it.done) { return }
      return it.value[1](api.meta, next)
    }
    // запускаем исполнение хуков
    afterHooks.length && beforeHooks[0](api.meta, next)
    iterators = afterHooks.slice(1, afterHooks.length).entries()
    // исполняем afterHooks, только с лучае успеха
    api.exec(api.meta).then(res => {
      afterHooks.length && afterHooks[0](api.meta, next)
      return res
    })
  }
}

export function normalizeRecord (api, { beforeHooks, afterHooks }, meta) {
  const record = {
    name: api.name,
    meta: Object.assign({}, meta, api.meta || {}),
    beforeHooks: beforeHooks.concat(api.beforeHook || []),
    exec: api.exec || (() => warn(false, `Empty exec function on ${api.name} method`) ),
    afterHooks: afterHooks.concat(api.afterHook || []),
    children: api.children || []
  }
  if (api.type) { record.children.push({ name: api.type, exec: api.exec }) }
  return record
}
