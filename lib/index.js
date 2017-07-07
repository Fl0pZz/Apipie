import { install } from './install'
import { createTreeSkeleton } from './create-rest-tree'

export default class VueApify {
  constructor(records, options) {
    this.records = records
    this.hooks = []
    this.meta = [{}]
    this.options = [{}]
    this.axios = options.axios
  }
  globalHook(hook) {
    this.hooks.push(hook)
  }
  create () {
    return createTreeSkeleton(this.records, this)
  }
}

VueApify.install = install
