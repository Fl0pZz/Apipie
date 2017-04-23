import pathToRegexp from 'path-to-regexp'

export function mergeArraysToObject (names, values) {
  if (names.length !== values.length) { throw new Error('Arrays must have the same length')}
  const result = {}
  names.forEach((name, i) => { result[name] = values[i] })
  return result
}

export default function parseExecArgs (url, ...args) {
  const result = { url }
  if (args[0] instanceof Array) {
    // transform array of values to object for pathToRegexp.compile()
    let names = pathToRegexp.parse(url)
      .filter(token => typeof token !== 'string' )
      .map(({ name }) => name)
    let toPath = pathToRegexp.compile(url)
    result.url = toPath(mergeArraysToObject(names, args[0]))
    args = args.slice(1, args.length)
  }
  if (args.length > 1) { throw new Error('Too many arguments') }
  // args[1] is { params?, data? }
  if (args.length === 1) { Object.assign(result, args[0]) }
  return result
}