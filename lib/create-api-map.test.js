import { normalizeRecord, createExecFunc, addApiRecord, createApiMap } from './create-api-map'

describe('Create REST Api object', () => {
  describe('normalizeRecord', () => {
    const r = {
      name: 'test',
      options: {
        method: 'GET',
        url: '/test'
      },
      meta: { test: 'test' },
      children: [
        {
          name: 'childTest',
          options: {
            method: 'GET',
            url: '/test/child'
          }
        }
      ]
    }
    const payload = { options: {}, meta: { addMeta: 'addMeta' }, hooks: [] }
    const result = {
      name: 'test',
      options: {
        method: 'GET',
        url: '/test'
      },
      meta: { test: 'test', addMeta: 'addMeta' },
      hooks: [],
      children: [
        {
          name: 'childTest',
          options: {
            method: 'GET',
            url: '/test/child'
          }
        }
      ]
    }

    test('simple test', () => {
      expect(normalizeRecord(r, payload)).toEqual(result)
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
  })
})
