export function helper(name, method, url, ...args) {
  const meta = {}, hooks = []
  let children = []
  
  for (let arg of args) {
    if ( typeof arg === 'function') {
      hooks.push(arg)
    } else if ( arg instanceof Array) {
      children = children.concat(arg)
    } else {
      Object.assign(meta, arg)
    }
  }
  
  return {
    name,
    url,
    method,
    meta,
    hooks,
    children
  }
}