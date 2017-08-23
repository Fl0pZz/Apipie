import parseExecArgs from './utils/args-parser'
import { checkRecordOnHavingMethod } from './utils/checkRecord.js'
import normalizeRecord from './normalizeRecord'
import compose from 'koa-compose'
import merge from 'deepmerge'

function setVal (obj, propNamesPath, val) {
  propNamesPath.reduce((acc, propName, i) => {
    if (i === propNamesPath.length - 1) {
      acc[propName] = val
      return val
    }

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
  const setBranch = (record, indexPath, closurePack) => {
    if (checkRecordOnHavingMethod(record)) {
      return lazyCalcLeafNode(indexPath, closurePack)
    }

    return {}
  }

  branch[record.name] = setBranch(record, indexPath, closurePack)
  if (record.children && record.children.length) {
    record.children.forEach((childRecord, index) => {
      addTreeBranch(branch[record.name], childRecord, indexPath.concat(index), closurePack)
    })
  }
}

export function lazyCalcLeafNode (indexPath, closurePack) {
  return (props) => {
    const { tree, records, axios } = closurePack
    let [propNamesPath, record] = calculateBranchNodes(records, indexPath, [], closurePack)
    const execFunc = createExecFunc(record, propNamesPath, axios)
    const prevState = getVal(tree, propNamesPath)
    for (let child in prevState) {
      execFunc[child] = prevState[child]
    }

    setVal(tree, propNamesPath, execFunc)

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
  if (indexPath.length > 0 && record.children.length > 0) {
    return calculateBranchNodes(record.children, indexPath, propNamesPath, record)
  }

  return [propNamesPath, record]
}

export function createExecFunc (record, fullName, axios) {
  function createContext (meta, options) {
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
