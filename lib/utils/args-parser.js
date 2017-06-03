import pathToRegexp from 'path-to-regexp'

export default function parseExecArgs (url, props) {
  const result = { url }
  if (!props) {
    return result
  }
  const { url_params, params, data } = props
  if (url_params) {
    /*
      TODO: add validations of url_params
      let names = pathToRegexp.parse(url)
        .filter(token => typeof token !== 'string' )
        .map(({ name }) => name)
      names === Object.keys(url_params)
    */
    const toPath = pathToRegexp.compile(url)
    result.url = toPath(url_params)
  }
  if (params) {
    result.params = params
  }
  if (data) {
    result.data = data
  }
  return result
}