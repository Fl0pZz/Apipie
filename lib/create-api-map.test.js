import { normalizeRecord, createExecFunc, addApiRecord, createApiMap } from './create-api-map'

describe('Create REST Api object', () => {
  describe('normalizeRecord', () => {
    test('simple test', () => {
      const record = {
        name: 'test',
        options: {
          method: 'GET',
          url: '/test'
        },
        meta: { test: 'test' },
        children: [
          { name: 'childTest', options: { method: 'GET', url: '/test/child'} }
        ]
      }
      const payload = { options: {}, meta: { addMeta: 'addMeta' }, hooks: [] }
      const result = {
        name: 'test',
        options: {},
        meta: { test: 'test', addMeta: 'addMeta' },
        hooks: [],
        children: [
          { name: 'childTest', options: { method: 'GET', url: '/test/child' } },
          { name: 'get', options: { url: '/test', method: 'GET' } }
        ]
      }
      expect(normalizeRecord(record, payload)).toEqual(result)
    })
    test('Sugar syntax', () => {
      const payload = { options: {}, meta: {}, hooks: [] }
      const record = {
        name: 'test',
        url: '/test',
        method: 'GET'
      }
      const result = {
        name: 'test',
        options: {
          url: '/test',
          method: 'GET'
        },
        hooks: [],
        meta: {},
        children: []
      }
      expect(normalizeRecord(record, payload)).toEqual(result)
    })
    test('Sugar syntax with children', () => {
      const payload = { options: {}, meta: {}, hooks: [] }
      const record = {
        name: 'sugar_test',
        url: '/test',
        method: 'GET',
        children: [
          { name: 'child', url: '/child', method: 'GET' }
        ]
      }
      const result = {
        name: 'sugar_test',
        options: {},
        hooks: [],
        meta: {},
        children: [
          { name: 'child', url: '/child', method: 'GET' },
          { name: 'get', options: { method: 'GET', url: '/test' } },
        ],
      }
      expect(normalizeRecord(record, payload)).toEqual(result)
    })
  })
  describe('createExecFunc', () => {
    const axiosInstanceMock = () => Promise.resolve({ success: true })

    test('basic', () => {
      const expectedCtx = {
        meta: { meta: true },
        options: {
          timeout: 1000,
          headers: {'X-Custom-Header': 'foobar'},
          method: "GET",
          url: '/test/1'
        },
        response: { success: true }
      }
      const record = {
        name: 'test',
        options: {
          url: '/test/:id',
          timeout: 1000,
          headers: {'X-Custom-Header': 'foobar'},
          method: "GET"
        },
        meta: { meta: true }, hooks: [], children: []
      }
      const fn = createExecFunc(record, axiosInstanceMock)
      fn({ url_params: { id: 1 } }).then(ctx => { expect(ctx).toEqual(expectedCtx) })
    })
    test('With data and params', () => {
      const expectedCtx = {
        meta: { meta: true },
        options: {
          timeout: 1000,
          headers: {'X-Custom-Header': 'foobar'},
          method: "GET",
          url: '/test/1',
          params: { abc: 'abc' },
          data: {
            data: 'some_data'
          }
        },
        response: { success: true }
      }
      const record = {
        name: 'test',
        options: {
          url: '/test/:id',
          timeout: 1000,
          headers: {'X-Custom-Header': 'foobar'},
          method: "GET"
        },
        meta: { meta: true }, hooks: [], children: []
      }
      const fn = createExecFunc(record, axiosInstanceMock)
      fn({ url_params: {id: 1}, params: { abc: 'abc' }, data: { data: 'some_data' } })
        .then(ctx => { expect(ctx).toEqual(expectedCtx) })
    })
  })
  describe('addApiRecord', () => {
    const axiosInstanceMock = () => Promise.resolve({ success: true })
    test('Basic', () => {
      const apiMap = {}
      const record = {
        name: 'test',
        options: { url: '/test/:id', method: 'GET' }
      }
      const expectCtx = {
        options: {
          method: 'GET',
          url: '/test/1'
        },
        meta: {},
        response: { success: true }
      }
      addApiRecord(apiMap, record, {}, axiosInstanceMock )
      apiMap.test({ url_params: { id: 1 } }).then(ctx => {
        expect(ctx).toEqual(expectCtx)
      }).catch(err => console.warn(err))
    })
    test('Basic with children', () => {
      const apiMap = {}
      const record = {
        name: 'test',
        children: [
          { name: 'test1', options: { url: '/test/1', method: 'GET' } }
        ]
      }
      addApiRecord(apiMap, record, {}, axiosInstanceMock )
      const expectCtx = {
        options: {
          method: 'GET',
          url: '/test/1'
        },
        meta: {},
        response: { success: true }
      }
      apiMap.test.test1().then(ctx => {
        expect(ctx).toEqual(expectCtx)
      }).catch(err => console.warn(err))
    })
    test('With children', () => {
      const apiMap = {}
      const record = {
        name: 'test',
        options: {
          url: '/test',
          method: 'GET'
        },
        meta: { meta: true },
        children: [
          { name: 'test1', options: { url: '/test/1', method: 'GET' } },
          { name: 'test2', options: { url: '/test/2', method: 'GET' } }
        ]
      }
      addApiRecord(apiMap, record, {}, axiosInstanceMock )
      const expectCtx1 = {
        meta: { meta: true },
        options: {
          method: 'GET',
          url: '/test/1'
        },
        response: { success: true }
      }
      apiMap.test.test1().then(ctx => {
        expect(ctx).toEqual(expectCtx1)
      }).catch(err => console.warn(err))

      const expectCtx2 = {
        meta: { meta: true },
        options: {
          method: 'GET',
          url: '/test/2'
        },
        response: { success: true }
      }
      apiMap.test.test2().then(ctx => {
        expect(ctx).toEqual(expectCtx2)
      }).catch(err => console.warn(err))
    })
  })
  describe('createApiMap', () => {
    const axiosInstanceMock = () => Promise.resolve({ success: true })

    test('basic', () => {
      const records = [
        { name: 'a', options: { url: '/a', method: 'GET' }, children: [
          { name: 'a1', options: { url: '/a/1', method: 'GET' } },
          { name: 'a2', options: { url: '/a/2', method: 'GET' } }
        ]},
        { name: 'b', options: { url: '/b', method: 'GET' }, children: [
          { name: 'b1', options: { url: '/b/1', method: 'GET' } },
          { name: 'b2', options: { url: '/b/2', method: 'GET' } }
        ]},
      ]
      const options = { axiosInstance: axiosInstanceMock }
      const apiMap = createApiMap(records, options)
      expect(apiMap).toHaveProperty('a')
      expect(apiMap).toHaveProperty('a.a1')
      expect(apiMap).toHaveProperty('a.a2')
      expect(apiMap).toHaveProperty('b')
      expect(apiMap).toHaveProperty('b.b1')
      expect(apiMap).toHaveProperty('b.b2')
    })
    test('Base hook', () => {
      const hook = (ctx, next) => {
        ctx.meta.before = true
        next()
        ctx.meta.after = true
      }
      const records = [{ name: 'a', url: '/a', method: 'GET', hook }]
      const options = { axiosInstance: axiosInstanceMock }
      const apiMap = createApiMap(records, options)
      return expect(apiMap.a()).resolves.toMatchObject({ meta: { before: true, after: true } })
    })
    test('Async hook', () => {
      const hook = async (ctx, next) => {
        ctx.meta.before = true
        await next()
        ctx.meta.after = true
      }
      const records = [{ name: 'a', url: '/a', method: 'GET', hook }]
      const options = { axiosInstance: axiosInstanceMock }
      const apiMap = createApiMap(records, options)
      return expect(apiMap.a()).resolves.toMatchObject({ meta: { before: true, after: true } })
    })
    test('Composition of hook', () => {
      const hook1 = async (ctx, next) => {
        ctx.meta.test1 = true
        ctx.meta.test2 = true
        await next()
        ctx.meta.test2 = true
      }
      const hook2 = async (ctx, next) => {
        ctx.meta.test1 = false
        await next()
        ctx.meta.test2 = false
      }
      const records = [
        { name: 'a', hook: hook1, children: [
          { name: 'b', hook: hook2, url: '/b', method: 'get' }
        ] }
      ]
      const options = { axiosInstance: axiosInstanceMock }
      const apiMap = createApiMap(records, options)
      return expect(apiMap.a.b()).resolves.toMatchObject({ meta: { test1: false, test2: true } })
    })
  })
  describe('Full tests', () => {
    const axiosInstanceMock = () => Promise.resolve({ success: true })
    function hook (ctx, next) {
      if (ctx.meta.requireAuth) {
        throw new Error('Auth require')
      }
      next()
    }
    const records = [
      { name: 'user', meta: { requireAuth: true }, hook, children: [
        { name: 'get', meta: { requireAuth: false }, options: { url: '/user/:id', method: 'GET' } },
        { name: 'settings', options: { url: '/user/:id/settings', method: 'GET' } }
      ]},
      { name: 'content', meta: { contentMeta: 'content' }, children: [
        { name: 'images', meta: { imagesMeta: 'image' }, options: { url: '/images/:id', method: 'GET' } },
        { name: 'apps', options: { url: '/apps/:id', method: 'GET' } }
      ]}
    ]
    const options = { axiosInstance: axiosInstanceMock }
    const apiMap = createApiMap(records, options)
    test('Has all routes', () => {
      expect(apiMap).toHaveProperty('user')
      expect(apiMap).toHaveProperty('user.get')
      expect(apiMap).toHaveProperty('user.settings')
      expect(apiMap).toHaveProperty('content')
      expect(apiMap).toHaveProperty('content.images')
      expect(apiMap).toHaveProperty('content.apps')
    })
    test('Reject hook', () => {
      return expect(apiMap.user.settings({ url_params: { id: 1 } })).rejects.toBeInstanceOf(Error)
        // .rejects.toMatch('Auth require')
    })
    test('Access to response', () => {
      return expect(apiMap.user.get({ url_params: { id: 1 } })).resolves.toMatchObject({ response: { success: true } })
    })
    test('Meta', () => {
      const expectMeta = {
        contentMeta: 'content',
        imagesMeta: 'image'
      }
      apiMap.content.images({ url_params: { id: 1 } }).then(ctx => {
        expect(ctx.meta).toEqual(expectMeta)
      })
    })
  })
})
