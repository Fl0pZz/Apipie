import parseExecArgs from './utils/args-parser'
import compose from './utils/compose'
import merge from 'deepmerge'


export function createApiMap (records, { axiosInstance }) {
  const apiMap = {}
  records.forEach(api => addApiRecord(apiMap, api, {}, axiosInstance ))
  return apiMap
}

export function addApiRecord (apiMap, record, acc, axiosInstance) {
  record = normalizeRecord(record, acc)
  apiMap[record.name] = {}

  if (record.children.length) {
    record.children.forEach(child => { addApiRecord(apiMap[record.name], child, record, axiosInstance) })
    return
  }
  apiMap[record.name] = createExecFunc(record, axiosInstance)
}

export function normalizeRecord (record, props) {
  const { options = {}, meta = {}, hooks = [] } = props
  const createSimpleChildRecord = (url, method) => ({ name: method.toLowerCase(), options: { url, method } })
  const normalizedRecord = {
    name: record.name,
    children: record.children || [],
    options: merge.all([options, record.options || {}]),
    meta: merge.all([meta, record.meta || {}]),
    hooks: record.hooks && record.hooks.length
      ? hooks.concat(record.hooks)
      : hooks.slice()
  }
  if (record.url && record.method) {
    normalizedRecord.options = merge.all([normalizedRecord.options, { url: record.url, method: record.method }])
  }
  if (normalizedRecord.children.length && normalizedRecord.options.method && normalizedRecord.options.url) {
    normalizedRecord.children.push(createSimpleChildRecord(normalizedRecord.options.url, normalizedRecord.options.method))
    delete normalizedRecord.options.url
    delete normalizedRecord.options.method
  }
  return normalizedRecord
}

export function createExecFunc (record, axiosInstance) {
  function createContext({ meta, options }) {
    return {
      meta,
      options,
      response: null
    }
  }
  function createRequestFunc () {
    return function (ctx, next) {
      return axiosInstance(record.options)
        .then(response => {
          ctx.response = response
          next()
        })
    }
  }
  return function (payload) {
    record.options = merge(record.options, parseExecArgs(record.options.url, payload))
    record.hooks.push(createRequestFunc())

    const fn = compose(record.hooks)
    const context = createContext(record)

    return fn(context).then(() => context)
  }
}
