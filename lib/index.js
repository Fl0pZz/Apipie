import { createApiMap } from './create-api-map'
import { install } from './install'

export default class VueApify {
  static create (records, axiosInstance) {
    return createApiMap(records, axiosInstance)
  }
}

VueApify.install = install
