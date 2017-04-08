export function install (Vue) {
  Vue.mixin({
    beforeCreate () {
      this.$api = this.$options.api
    }
  })
  // Object.defineProperty(Vue.prototype, '$api', {
  //   get () { return this.$options.api }
  // })
}