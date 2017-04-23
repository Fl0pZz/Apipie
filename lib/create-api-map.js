import parseExecArgs from './utils/args-parser'
import compose from './utils/compose'


export function createApiMap (records, { axiosInstance }) {
  const apiMap = {}
  records.forEach(api => addApiRecord(apiMap, api, {}, axiosInstance ))
  return apiMap
}

export function addApiRecord (apiMap, record, acc, axiosInstance) {
  record = normalizeRecord(record, acc)
  apiMap[record.name] = {}
  if (record.children.length) {
    record.children.forEach(child => addApiRecord(apiMap[record.name], child, record, axiosInstance))
    return
  }
  apiMap[record.name] = createExecFunc(record, axiosInstance)
}

export function normalizeRecord (record, { options = {}, meta = {}, hooks = [] }) {
  return {
    name: record.name,
    url: record.url.path || record.url,
    options: Object.assign({}, options, record.url.options || {}, { method: record.method }),
    meta: Object.assign({}, meta, record.meta),
    hooks: record.hooks && record.hooks.length
      ? hooks.slice().push(record.hooks)
      : hooks.slice(),
    children: record.children || []
  }
}

export function createContext({ meta, options }) {
  return {
    meta,
    options,
    response: null
  }
}

export function createExecFunc (record, axiosInstance) {
  return function () {
    const argObj = parseExecArgs(record.url.path || record.url, ...Array.from(arguments))
    Object.assign(record.options, argObj)
    const ctx = createContext(record)
    record.hooks.push(createRequestFunc(record, axiosInstance))
    const fn = compose(record.hooks)
    // return fn(ctx)
    return fn(ctx).then(() => ctx)
  }
}

export function createRequestFunc (record, axiosInstance) {
  return function (context, next) {
    return axiosInstance(record.options)
      .then(response => {
        context['response'] = response
        next()
      })
  }
}
