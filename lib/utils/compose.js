export default function compose (hooks) {
  if (!Array.isArray(hooks)) throw new TypeError('Hooks stack must be an array!')
  hooks.forEach(fn => { if (typeof fn !== 'function') throw new TypeError('Hooks must be composed of functions!') })
  // for (const fn of hooks) {
  //   if (typeof fn !== 'function') throw new TypeError('Hooks must be composed of functions!')
  // }
  
  return function (context, next) {
    // last called middleware #
    let index = -1
    return dispatch(0)
    function dispatch (i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      let fn = hooks[i]
      if (i === hooks.length) fn = next
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn(context, function next () {
          return dispatch(i + 1)
        }))
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}