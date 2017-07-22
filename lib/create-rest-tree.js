import parseExecArgs from './utils/args-parser'
import compose from './utils/compose'
import merge from 'deepmerge'

function setVal (obj, propNamesPath, val) {
  propNamesPath.reduce((acc, propName, i) => {
    if (i === propNamesPath.length - 1) return acc[propName] = val
      return acc[propName]
    }, obj)
}

function getVal (obj, propNamesPath) {
  return propNamesPath.reduce((acc, propName) => acc[propName], obj)
}

/*
* STEP 1: Create a skeleton tree with minimal intermediate computations
*/
export function createTreeSkeleton (records, baseOptions) {
  /*
  * options: {
  *   hooks,
  *   meta,
  *   options,
  *   records,
  *   axios
  * }
  */
  const tree = {}
  baseOptions.tree = tree
  const closurePack = baseOptions
  records.forEach((record, index) => addTreeBranch(tree, record, [index], closurePack))
  return tree
}

export function addTreeBranch (branch, record, indexPath, closurePack) {
  branch[record.name] = {}
  if (record.children && record.children.length) {
    if (record.method) {
      record.children.push({
        name: record.method,
        method: record.method,
        url: record.url,
        data: !!record.data,
        params: !!record.params
      })
    }
    record.children.forEach((childRecord, index) =>
        addTreeBranch(branch[record.name], childRecord, indexPath.concat(index), closurePack))
    return
  }
  // Create lazy calculation leaf
  branch[record.name] = lazyCalcLeafNode(indexPath, closurePack)
}

export function lazyCalcLeafNode (indexPath, closurePack) {
  return (props) => {
    const { tree, records, axios } = closurePack
    let [propNamesPath, record] = calculateBranchNodes(records, indexPath, [], closurePack)
    setVal(tree, propNamesPath, createExecFunc(record, propNamesPath, axios))
    return getVal(tree, propNamesPath)(props)
  }
}
/*
* STEP 2: Сompute only the necessary nodes of the tree to execute the request
*/
export function calculateBranchNodes (records, indexPath, propNamesPath, closurePack) {
  const index = indexPath.shift()
  records[index] = normalizeRecord(records[index], closurePack)
  const record = records[index]
  propNamesPath.push(record.name)
  if (record.children.length) {
    return calculateBranchNodes(record.children, indexPath, propNamesPath, record)
  }
  return [propNamesPath, record]
}

export function normalizeRecord (record, props) {
  if (record._normalized) return record

  const { options = [], meta = [], hooks = [] } = props
  const normalizedRecord = {
    _normalized: true,
    _require: {
      data: !!record.data,
      params: !!record.params
    },
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
  /*
    {
      ...,
      option: { ...,url, method },
      children: [...]
    }
    transform to
    {
      ...,
      option: { ... },
      children: [
        ...,
        { name: method, option: { url, method } }
      ]
    }
   */
  const opts = normalizedRecord.options[normalizedRecord.options.length - 1]
  if (normalizedRecord.children.length && opts.method && opts.url) {
    delete opts.method
    delete opts.url
  }
  return normalizedRecord
}

export function createExecFunc (record, fullName, axios) {
  function createContext(meta, options) {
    return {
      meta,
      options,
      response: null,
      name: record.name,
      fullName
    }
  }
  function createRequestFunc () {
    return (ctx, next) => axios(ctx.options)
      .then(response => {
        ctx.response = response
        next()
      })
  }
  if (record.options instanceof Array) {
    record.options = merge.all(record.options)
  }
  if (record.meta instanceof Array) {
    record.meta = merge.all(record.meta)
  }
  record.hooks.push(createRequestFunc())
  const fn = compose(record.hooks)

  return function (props) {
    const tmpOptions = merge(record.options, parseExecArgs(record.options.url, props, record), { clone: true })
    const context = createContext(record.meta, tmpOptions)
    return fn(context).then(() => context)
  }
}
