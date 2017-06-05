import { createApiMap } from './create-api-map'
import { install } from './install'

export default class VueApify {
  static create (records, options) {
    return createApiMap(records, options)
  }
}

VueApify.install = install
