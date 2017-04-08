export function install (Vue) {
  if (install.installed) return
  install.installed = true
  
  Object.defineProperty(Vue.prototype, '$api', {
    get () { return this.$options.api }
  })
}