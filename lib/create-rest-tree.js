import parseExecArgs from './utils/args-parser'
import compose from './utils/compose'
import merge from 'deepmerge'


export function createRESTApiTree(records, acc, axiosInstance) {
  const tree = {}
  records.forEach((record, index) => addTreeBranch({ tree, records }, [index], record, acc, tree, axiosInstance))
  return tree
}

export function addTreeBranch({ tree, records }, path, record, acc, branch, axiosInstance) {
  branch[record.name] = {}
  prenormalizeRecord(record)
  if (record.children && record.children.length) {
    record.children
      .forEach((childRecord, index) =>
        addTreeBranch({ tree, records }, path.concat(index), childRecord, acc, branch[record.name], axiosInstance))
    return
  }

  branch[record.name] = function createLeafRESTTree(props) {
    // Lazy counting of data on call
    let [names, record1] = normalizeStackRecords(records, acc, path, [])
    const fullName = names.join('.')
    tree[fullName] = createExecFunc(record1, names, axiosInstance)
    return tree[fullName](props)
  }
}

export function normalizeStackRecords(records, acc, path, names) {
  let record = records[path.shift()]
  record = normalizeRecord(record, acc)
  names.push(record.name)
  if (record.children.length) {
    return normalizeStackRecords(record.children, record, path, names)
  }
  return [names, record]
}

// { ..., option: { ..., url, method }, children: [...] } -->
// --> { ..., option: { ..., url, method }, children: [..., { name, option: { url, method } }] }
export function prenormalizeRecord (record) {
  const createSimpleChildRecord = (method, url) => ({ name: method.toLowerCase(), options: { url, method } })

  if (record.children && record.children.length &&
    (record.method || (record.options && record.options.method))
    && (record.url || (record.options && record.options.url))) {
    record.children
      .push(createSimpleChildRecord(record.method || record.options.method, record.url || record.options.url))
  }
}

export function normalizeRecord (record, props) {
  if (record.normalized) return record

  const { options = [], meta = [], hooks = [] } = props
  const normalizedRecord = {
    normalized: true,
    name: record.name,
    meta: [].concat(meta, record.meta || {}),
    options: [].concat(options, record.options || {}),
    hooks: [].concat(hooks, record.hook || []),
    children: record.children || []
  }
  // { name, url, method } --> { name, option: { url, method } }
  if (record.url && record.method) {
    normalizedRecord.options.push({ url: record.url, method: record.method })
  }
  // { ..., option: { ..., url, method }, children: [...] } -->
  // --> { ..., option: { ... }, children: [..., { name, option: { url, method } }] }
  const opts = normalizedRecord.options[normalizedRecord.options.length - 1]
  if (normalizedRecord.children.length && opts.method && opts.url) {
    delete opts.method
    delete opts.url
  }
  return normalizedRecord
}

export function createExecFunc (record, fullName, axiosInstance) {
  function createContext({ meta, options }) {
    return {
      meta,
      options,
      response: null,
      name: record.name,
      fullName
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
  return function (props) {
    // TODO: It is necessary to optimize, then what is calculated on each call
    if (record.options instanceof Array) {
      record.options = merge.all(record.options)
    }
    record.options = merge(record.options, parseExecArgs(record.options.url, props))

    if (record.meta instanceof Array) {
      record.meta = merge.all(record.meta)
    }
    record.hooks.push(createRequestFunc())

    const fn = compose(record.hooks)
    const context = createContext(record)

    return fn(context).then(() => context)

  }
}
