import { createApiMap } from './create-api-map'
import { install } from './install'

export default class VueApify {
  static create (records, axiosInstanse) {
    return createApiMap(records, axiosInstanse)
  }
}

VueApify.install = install
