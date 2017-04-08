export function install (Vue) {
  Vue.mixin({
    created () {
      this.$api = this.$options.api
    }
  })
  // Object.defineProperty(Vue.prototype, '$api', {
  //   get () { return this.$options.api }
  // })
}