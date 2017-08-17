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
  if (requireParams.length && !props) throw new Error('Require urlParams!')
  if (!props) {
    return result
  }
  const { urlParams, params, data } = props
  if (urlParams) {
    requireParams.forEach(param => {
      if (!urlParams[param]) {
        throw new Error(`Require ${requireParams.join(', ')}, but given ${Object.keys(urlParams).join(', ') || 'nothing'}`)
      }
    })
    const toPath = pathToRegexp.compile(url)
    result.url = toPath(urlParams)
  }
  if (params) {
    result.params = params
  }
  if (data) {
    result.data = data
  }
  return result
}