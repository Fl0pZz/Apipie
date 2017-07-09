import pathToRegexp from 'path-to-regexp'

export default function parseExecArgs (url, props, { _require }) {
  const result = { url }
  if (_require.params && (!props || !props.params)) throw new Error('Require params!')
  if (_require.data && (!props || !props.data)) throw new Error('Require data!')
  let requireParams = pathToRegexp.parse(url)
    .filter(token =>
        [
          typeof token !== 'string',
          !token.optional, // https://github.com/pillarjs/path-to-regexp#optional
          !token.asterisk // https://github.com/pillarjs/path-to-regexp#asterisk
        ].every(Boolean)
    )
    .map(({ name }) => name)
  if (requireParams.length && !props) throw new Error('Require url_params!')
  if (!props) {
    return result
  }
  const { url_params, params, data } = props
  if (url_params) {
    requireParams.forEach(param => {
      if (!url_params[param]) {
        throw new Error(`Require ${requireParams.join(', ')}, but given ${Object.keys(url_params).join(', ') || 'nothing'}`)
      }
    })
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