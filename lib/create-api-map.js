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
    let sequence = beforeHooks
      .reduce((seq, hook) => seq.then(() => hook(api.meta)), Promise.resolve())
      .then(() => api.exec)
    sequence = afterHooks
      .reduce((seq, hook) => seq.then((res) => {
        hook(api.meta)
        return res
      }), sequence)
    return sequence
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
