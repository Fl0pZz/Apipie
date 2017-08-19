import pathToRegexp from 'path-to-regexp'

export default function parseExecArgs (url, props, { _require }) {
  const result = { url }
  
  // validate query
  if (_require.query && (!props || !props.query)) {
    throw new Error('Require query!')
  }

  // validate data
  if (_require.data && (!props || !props.data)) {
    throw new Error('Require data!')
  }

  //validate params
  let requireParams = pathToRegexp.parse(url)
    .filter(token =>
        [
          typeof token !== 'string',
          !token.optional, // https://github.com/pillarjs/path-to-regexp#optional
          !token.asterisk // https://github.com/pillarjs/path-to-regexp#asterisk
        ].every(Boolean)
    )
    .map(({ name }) => name)

  if (requireParams.length && !props) {
    throw new Error('Require params!')
  }

  if (!props) {
    return result
  }

  const { params, query, data } = props

  if (params) {
    requireParams.forEach(param => {
      if (!params[param]) {
        throw new Error(`Require ${requireParams.join(', ')}, but given ${Object.keys(params).join(', ') || 'nothing'}`)
      }
    })

    const toPath = pathToRegexp.compile(url)
    result.url = toPath(params)
  }

  // query == params for axios
  if (query) {
    result.params = query
  }

  if (data) {
    result.data = data
  }

  return result
}