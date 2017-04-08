export function install (Vue) {
  // Vue.mixin({
  //   beforeCreate () {
  //     this.$api = this.$options.api
  //   }
  // })
  /* eslint no-console:0 */
  console.log('install VueApify')
  console.log(Vue)
  Object.defineProperty(Vue.prototype, '$api', {
    get () { return this.$options.api }
  })
  console.log(Vue)
}