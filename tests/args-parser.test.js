import parseExecArgs from '../lib/utils/args-parser'

describe('parseExecArgs', () => {
  const url = '/test/:id'

  test('basic', () => {
    expect(parseExecArgs(url, { params: { id: 1 } }, { _require: { query: false, data: false } })).toEqual({ url: '/test/1' })
  })
  test('all', () => {
    const payload = {
      params: { id: 1 },
      query: { abc: 'abc' },
      data: { test: 'test' }
    }
    const result = parseExecArgs(url, payload, { _require: { query: false, data: false } })
    const expected = {
      url: '/test/1',
      params: { abc: 'abc' },
      data: { test: 'test' }
    }
    expect(result).toEqual(expected)
  })
})
