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

describe('parseExecArgs - testing urlToParse', () => {
  const url = '/api/v1/foo/:id/bar/:test'
  const requiredProps = { _require: { query: false, data: false } }

  test('test - 1, put all args', () => {
    const props = {
      url: 'http://test-site.com/api/v1/foo/1/bar/test?page=1&limit=10'
    }

    const expectResult = {
      url: '/api/v1/foo/1/bar/test',
      params: {
        page: '1',
        limit: '10'
      }
    }

    const result = parseExecArgs(url, props, requiredProps)
    expect(result).toEqual(expectResult)
  })

  test('test - 2, put without query', () => {
    const props = {
      url: 'http://test-site.com/api/v1/foo/1/bar/foobar'
    }

    const expectResult = {
      url: '/api/v1/foo/1/bar/foobar',
      params: {}
    }

    const result = parseExecArgs(url, props, requiredProps)
    expect(result).toEqual(expectResult)
  })

  test('test - 3, put not enogth params', () => {
    const props = {
      url: 'http://test-site.com/api/v1/foo/1/bar'
    }

    const result = () => {
      parseExecArgs(url, props, requiredProps)
    }

    expect(result).toThrowError(/Mismatch the path or not enough params for this url: /)
  })

  test('test - 4, mismatch path', () => {
    const props = {
      url: 'http://test-site.com/api/v1/users/'
    }

    const result = () => {
      parseExecArgs(url, props, requiredProps)
    }

    expect(result).toThrowError(/Mismatch the path or not enough params for this url: /)
  })
})
