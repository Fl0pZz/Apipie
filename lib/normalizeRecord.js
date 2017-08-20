import merge from 'deepmerge'

export default function normalizeRecord (record, { options = {}, meta = {}, hooks = [] }) {
  if (record._normalized) return record
  transformSugarSyntax(record)
  stackUrl(options, record.options)

  return {
    _normalized: true,
    _require: {
      data: !!record.data,
      query: !!record.query
    },
    name: record.name,
    meta: merge(meta, record.meta || {}, { clone: true }),
    options: merge(options, record.options || {}, { clone: true }),
    hooks: [].concat(hooks, record.hook || []),
    children: record.children || []
  }
}

const arrayOfMethods = ['get', 'delete', 'head', 'post', 'options', 'put', 'patch'];

export function transformSugarSyntax(record) {
  // { name, url, method } --> { name, option: { url, method } }
  if (record.options == null) record.options = {}
  if (record.url) {
    record.options.url = record.url
  }
  if (record.url && record.method && (record.children == null)) {
    record.options.method = record.method
  }

  // { name, method: url } --> { name, option: { url, method } }
  const httpMethod = arrayOfMethods.find(key => key in record);
  
  if (httpMethod && typeof record[httpMethod] === 'string') {
    record.options.url = record[httpMethod];
    record.options.method = httpMethod;
  }
}

export function stackUrl (parentOpts, options) {
  // console.warn({parentOpts, options})
  if (parentOpts.url == null && options.url == null) return null
  const url = options.url
  const parentUrl = parentOpts.url
  if ((url != null) && url.startsWith('/')) return url
  if (parentUrl == null && !url.startsWith('/')) {
    throw new Error('Can not find root of path!')
  }
  if ((url == null || url === '') && parentUrl) return parentUrl
  if (parentUrl.endsWith('/')) {
    options.url = parentUrl + url
  } else {
    options.url = `${parentUrl}/${url}`
  }
}