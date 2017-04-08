import { createApiMap } from './create-api-map'

export default class VueApify {
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