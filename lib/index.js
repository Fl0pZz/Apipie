import { createApiMap } from './create-api-map'
import { install } from './install'

export { helper as h } from './utils/helper'

export default class VueApify {
  static create (records, axiosInstance) {
    return createApiMap(records, axiosInstance)
  }
}

VueApify.install = install
