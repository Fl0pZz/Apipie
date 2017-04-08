export function install (Vue) {
  Object.defineProperty(Vue.prototype, '$api', {
    get () { return this.$options.api }
  })
}