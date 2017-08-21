import normalizeRecord from '../lib/normalizeRecord'

describe('normalizeRecord', () => {
  test('Base', () => {
    const record = { name: 'test', options: { url: '/url', method: 'get' } }
    const expected = {
      _normalized: true,
      _require: { data: false, query: false },
      name: 'test',
      meta: {},
      options: { url: '/url', method: 'get' },
      hooks: [],
      children: []
    }
    expect(normalizeRecord(record, {})).toEqual(expected)
  })
  test('Base with sugar syntax', () => {
    const record = { name: 'test', url: '/url', method: 'get' }
    const expected = {
      _normalized: true,
      _require: { data: false, query: false },
      name: 'test',
      meta: {},
      options: { url: '/url', method: 'get' },
      hooks: [],
      children: []
    }
    expect(normalizeRecord(record, {})).toEqual(expected)
  })
  test('Base with METHOD sugar syntax', () => {
    const record = { name: 'test', get: '/url' }
    const expected = {
      _normalized: true,
      _require: { data: false, query: false },
      name: 'test',
      meta: {},
      options: { url: '/url', method: 'get' },
      hooks: [],
      children: []
    }
    expect(normalizeRecord(record, {})).toEqual(expected)
  })
  test('Without request options, but with child', () => {
    const record = {
      name: 'test',
      children: [
        { name: 'child', url: '/url', method: 'get' }
      ]
    }
    const expected = {
      _normalized: true,
      _require: { data: false, query: false },
      name: 'test',
      meta: {},
      options: {},
      hooks: [],
      children: [
        { name: 'child', url: '/url', method: 'get' }
      ]
    }
    expect(normalizeRecord(record, {})).toEqual(expected)
  })
  test('Stacking of meta, hook, options', () => {
    const hook = async (ctx, next) => {
      ctx.push('hook')
      await next()
    }
    const record = {
      name: 'test',
      url: '/url',
      method: 'get',
      meta: { test: 'test' },
      options: { test: 'test' },
      hook
    }
    const props = {
      meta: { props: 'props', test: '123' },
      options: { props: 'props' },
      hooks: [hook]
    }
    const expected = {
      _normalized: true,
      _require: { data: false, query: false },
      name: 'test',
      meta: { props: 'props', test: 'test' },
      options: { props: 'props', test: 'test', url: '/url', method: 'get' },
      hooks: [hook, hook],
      children: []
    }
    expect(normalizeRecord(record, props)).toEqual(expected)
  })
})
