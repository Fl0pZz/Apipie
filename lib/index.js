import { createTreeSkeleton } from './create-rest-tree'

const defaultOptions = {
  records: null,
  hooks: [],
  meta: {},
  options: {},
  axios: null
}

function createApi (records, axios, options = {}) {
  const _options = {
    ...defaultOptions,
    ...options,
    records,
    axios
  }

  return createTreeSkeleton(records, _options)
}

export default createApi
