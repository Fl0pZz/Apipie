import parseExecArgs from '../lib/utils/args-parser'

describe('parseExecArgs', () => {
  const url = '/test/:id'

  test('basic', () => {
    expect(parseExecArgs(url, { url_params: { id: 1 } })).toEqual({ url: '/test/1' })
  })
  test('all', () => {
    const payload = {
      url_params: { id: 1 },
      params: { abc: 'abc' },
      data: { test: 'test' }
    }
    const result = parseExecArgs(url, payload)
    const expected = {
      url: '/test/1',
      params: { abc: 'abc' },
      data: { test: 'test' }
    }
    expect(result).toEqual(expected)
  })
})