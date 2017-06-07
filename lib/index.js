import { install } from './install'
import { createRESTApiTree } from './create-rest-tree'

export default class VueApify {
  constructor(records, options) {
    this.records = records
    this.hooks = []
    this.meta = [{}]
    this.options = [{}]
    this.axiosInstance = options.axios
  }
  globalHook(hook) {
    this.hooks.push(hook)
  }
  create () {
    const acc = { meta: this.meta, options: this.options, hooks: this.hooks }
    return createRESTApiTree(this.records, acc, this.axiosInstance)
  }
}

VueApify.install = install
