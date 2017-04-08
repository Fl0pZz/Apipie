import { createApiMap } from './create-api-map'
import { install } from './install'

export default class VueApify {
  static install(Vue) { install(Vue) }
  
  constructor (options) {
    this.beforeHooks = []
    this.afterHooks = []
    this.options = options
  }
  create () {
    return createApiMap(this.options, this)
  }
  beforeEach (fn) {
    this.beforeHooks.push(fn)
  }
  afterEach (fn) {
    this.afterHooks.push(fn)
  }
}
