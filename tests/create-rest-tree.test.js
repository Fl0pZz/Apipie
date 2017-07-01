import {
  createRESTApiTree,
  addTreeBranch,
  normalizeStackRecords,
  prenormalizeRecord,
  normalizeRecord,
  createExecFunc,  } from '../lib/create-rest-tree'

describe('Create REST Api routing', () => {
  describe('prenormalizeRecord', () => {
    test('Base', () => {
      const record = { name: 'test', options: { url: 'url', method: 'get' } }
      const expected = { name: 'test', options: { url: 'url', method: 'get' } }
      prenormalizeRecord(record)
      expect(record).toEqual(expected)
    })
    test('Base with sugar syntax', () => {
      const record = { name: 'test', url: 'url', method: 'get' }
      const expected = { name: 'test', url: 'url', method: 'get' }
      prenormalizeRecord(record)
      expect(record).toEqual(expected)
    })
    test('Without request options and with children', () => {
      const record = { name: 'test', children: [{ name: 'test', url: 'url', method: 'get' }] }
      const expected = { name: 'test', children: [{ name: 'test', url: 'url', method: 'get' }] }
      prenormalizeRecord(record)
      expect(record).toEqual(expected)
    })
    test('With request options and children', () => {
      const record = { name: 'test', url: 'url', method: 'get',
        children: [{ name: 'child', url: 'url', method: 'get' }] }
      const expected = { name: 'test', url: 'url', method: 'get',
        children: [
          { name: 'child', url: 'url', method: 'get' },
          { name: 'get', options: { url: 'url', method: 'get' } }
          ]
      }
      prenormalizeRecord(record)
      expect(record).toEqual(expected)
    })
  })
  describe('normalizeRecord', () => {
    test('Base', () => {
      const record = { name: 'test', options: { url: 'url', method: 'get' } }
      const props = {}
      const expected = {
        normalized: true,
        name: 'test',
        meta: [{}],
        options: [{ url: 'url', method: 'get' }],
        hooks: [],
        children: []
      }
      expect(normalizeRecord(record, props)).toEqual(expected)
    })
    test('Base with sugar syntax', () => {
      const record = { name: 'test', url: 'url', method: 'get' }
      const props = {}
      const expected = {
        normalized: true,
        name: 'test',
        meta: [{}],
        options: [{}, { url: 'url', method: 'get' }],
        hooks: [],
        children: []
      }
      expect(normalizeRecord(record, props)).toEqual(expected)
    })
    test('Without request options, but with children', () => {
      const record = { name: 'test', children: [{ name: 'child', url: 'url', method: 'get' }] }
      const props = {}
      const expected = {
        normalized: true,
        name: 'test',
        meta: [{}],
        options: [{}],
        hooks: [],
        children: [{ name: 'child', url: 'url', method: 'get' }]
      }
      expect(normalizeRecord(record, props)).toEqual(expected)
    })
    test('Prenormalize and children', () => {
      const record = { name: 'test', url: 'url', method: 'get',
        children: [{ name: 'child', url: 'url', method: 'get' }] }
      const props = {}
      const expected = {
        normalized: true,
        name: 'test',
        meta: [{}],
        options: [{}, {}],
        hooks: [],
        children: [
          { name: 'child', url: 'url', method: 'get' },
          { name: 'get', options: { url: 'url', method: 'get' } }
        ]
      }
      prenormalizeRecord(record)
      expect(normalizeRecord(record, props)).toEqual(expected)
    })
    test('Stacking of meta, options and hooks', () => {
      const record = {
        name: 'test', url: 'url', method: 'get',
        meta: { test: 'test' },
        options: { test: 'test' },
        hook: { test: 'test' }
      }
      const props = {
        meta: [{ props: 'props', test: "123" }],
        options: [{ props: 'props' }],
        hooks: [{ props: 'props' }]
      }
      const expected = {
        normalized: true,
        name: 'test',
        meta: [{ props: 'props', test: "123" }, { test: 'test' }],
        options: [{ props: 'props' }, { test: 'test' }, { url: 'url', method: 'get' }],
        hooks: [{ props: 'props' }, { test: 'test' }],
        children: []
      }
      expect(normalizeRecord(record, props)).toEqual(expected)
    })
  })
  describe('createExecFunc', () => {
    const axiosInstanceMock = () => Promise.resolve({ success: true })
    test('Basic', () => {
      const record = {
        name: 'test',
        options: [{}, {
          url: '/test/:id',
          timeout: 1000,
          headers: {'X-Custom-Header': 'foobar'},
          method: "GET"
        }],
        meta: [{}, { meta: true }], hooks: [], children: []
      }
      const expectedCtx = {
        meta: { meta: true },
        options: {
          timeout: 1000,
          headers: {'X-Custom-Header': 'foobar'},
          method: "GET",
          url: '/test/1'
        },
        name: 'test',
        fullName: ['test'],
        response: { success: true }
      }
      const fn = createExecFunc(record, ['test'], axiosInstanceMock)
      return expect(fn({ url_params: { id: 1 } })).resolves.toEqual(expectedCtx)
    })
    test('With data and params', () => {
      const record = {
        name: 'test',
        options: [{}, {
          url: '/test/:id',
          timeout: 1000,
          headers: {'X-Custom-Header': 'foobar'},
          method: "GET"
        }],
        meta: { meta: true }, hooks: [], children: []
      }
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
        name: 'test',
        fullName: ['test'],
        response: { success: true }
      }

      const fn = createExecFunc(record, ['test'], axiosInstanceMock)
      // fn({ url_params: {id: 1}, params: { abc: 'abc' }, data: { data: 'some_data' } })
      //   .then(ctx => { expect(ctx).toEqual(expectedCtx) })
      return expect(fn({ url_params: {id: 1}, params: { abc: 'abc' }, data: { data: 'some_data' } }))
        .resolves.toEqual(expectedCtx)
    })
    describe('Copying of options, hooks and meta', () => {
      let props = {
        meta: [{ props: 'props', test: '123' }],
        options: [{ props: 'props' }],
        hooks: [(ctx, next) => { next() }]
      }
      const record1 = {
        normalized: true,
        name: 'test',
        meta: [props.meta[0], { test: 'test' }],
        options: [props.options[0], { test: 'test' }, { url: '/test/:id', method: 'get' }],
        hooks: [(ctx, next) => { next() }, (ctx, next) => { next() }],
        children: []
      }
      const record2 = {
        normalized: true,
        name: 'test',
        meta: [props.meta[0], { test: 'test' }],
        options: [props.options[0], { test: 'test' }, { url: '/test/:id', method: 'get' }],
        hooks: [(ctx, next) => { next() }, (ctx, next) => { next() }],
        children: []
      }
      let expectedCtx = {
        meta: { props: 'props', test: 'test' },
        options: {
          test: 'test',
          props: 'props',
          method: 'get',
          url: '/test/1'
        },
        name: 'test',
        fullName: ['test'],
        response: { success: true }
      }
      const fn1 = createExecFunc(record1, ['test'], axiosInstanceMock)
      const fn2 = createExecFunc(record2, ['test'], axiosInstanceMock)
      test('Resolve of test1', () => {
        return expect(fn1({ url_params: { id: 1 } })).resolves.toEqual(expectedCtx)
      })
      test('Resolve of test2', () => {
        return expect(fn2({ url_params: { id: 1 } })).resolves.toEqual(expectedCtx)
      })

      props.meta[0].props = 'not_props'
      props.options[0].props = 'not_props'

      expectedCtx = {
        meta: { props: 'not_props', test: 'test' },
        options: {
          props: 'not_props',
          test: 'test',
          method: 'get',
          url: '/test/1'
        },
        name: 'test',
        fullName: ['test'],
        response: { success: true }
      }

      test('Mutable of meta, options of record1', () => {
        return expect(fn1({ url_params: { id: 1 } })).resolves.toEqual(expectedCtx)
      })
      test('Mutable of meta, options of record1', () => {
        return expect(fn2({ url_params: { id: 1 } })).resolves.toEqual(expectedCtx)
      })
    })
    test('Base hook', () => {
      const hook = (ctx, next) => {
        ctx.meta.before = true
        next()
        ctx.meta.after = true
      }
      const record = { name: 'a', url: '/a', method: 'GET', hook }
      const fn = createExecFunc(normalizeRecord(record, { meta: {} }), ['a'], axiosInstanceMock)
      return expect(fn()).resolves.toMatchObject({ meta: { before: true, after: true } })
    })
    test('Async hook', () => {
      const hook = async (ctx, next) => {
        ctx.meta.before = true
        await next()
        ctx.meta.after = true
      }
      const record = { name: 'a', url: '/a', method: 'GET', hook }
      const fn = createExecFunc(normalizeRecord(record, { meta: {} }), ['a'], axiosInstanceMock)
      return expect(fn()).resolves.toMatchObject({ meta: { before: true, after: true } })
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
      const record = { name: 'a', url: '/a', method: 'GET' }
      const props = { hooks: [ hook1, hook2 ], meta: {}, options: {} }
      const fn = createExecFunc(normalizeRecord(record, props), ['a'], axiosInstanceMock)
      return expect(fn()).resolves.toMatchObject({ meta: { test1: false, test2: true } })
    })
  })
  describe('normalaizeStackRecords', () => {
    test('Basic', () => {
      const records = [{
        name: 'test', url: '/test', method: 'get',
        children: [
          { name: 'test1', url: '/test/1', method: 'get' },
          { name: 'test2', url: '/test/2', method: 'get' }
        ]
      }]
      const expectedRecord = {
        normalized: true,
        name: 'test1',
        meta: [ {}, {} ],
        options: [ {}, {}, {}, { url: '/test/1', method: 'get' } ],
        hooks: [],
        children: []
      }
      const acc = { meta: [], options: [], hooks: [] }
      const path = [0, 0]
      const [names, record] = normalizeStackRecords(records, acc, path, [])
      expect(names).toEqual(['test', 'test1'])
      expect(record).toEqual(expectedRecord)
    })
    test('With meta, options', () => {
      const acc = {
        meta: [{ acc: 'acc' }],
        options: [{ acc: 'acc' }],
        hooks: []
      }
      const records = [{
        name: 'test', url: '/test', method: 'get',
        meta: { test: 'test' },
        options: { test: 'test' },
        children: [
          {
            name: 'test1', url: '/test/1', method: 'get',
            meta: { test1: 'test1' },
            options: { test1: 'test1' }
          },
          { name: 'test2', url: '/test/2', method: 'get' }
        ]
      }]
      const path = [0, 0]
      const expectedRecord = {
        normalized: true,
        name: 'test1',
        meta: [ { acc: 'acc' }, { test: 'test' }, { test1: 'test1' } ],
        options:
          [ { acc: 'acc' },
            { test: 'test' },
            {},
            { test1: 'test1' },
            { url: '/test/1', method: 'get' } ],
        hooks: [],
        children: []
      }
      const [names, record] = normalizeStackRecords(records, acc, path, [])
      expect(names).toEqual(['test', 'test1'])
      expect(record).toEqual(expectedRecord)
    })
  })
  describe('addTreeBranch', () => {
    const axiosInstanceMock = () => Promise.resolve({ success: true })
    describe('Basic', () => {
      const records = [{
        name: 'test', url: '/test', method: 'get',
        children: [
          { name: 'test1', url: '/test/1', method: 'get' },
          { name: 'test2', url: '/test/2', method: 'get' }
        ]
      }]
      const tree = {}
      const acc = { meta: [], options: [], hooks: [] }
      const path = [0]
      const record = records[0]
      addTreeBranch({ tree, records }, path, record, acc, tree, axiosInstanceMock)
      test('Tree properties', () => {
        expect(tree).toHaveProperty('test')
        expect(tree).toHaveProperty('test.get')
        expect(tree).toHaveProperty('test.test1')
        expect(tree).toHaveProperty('test.test2')
      })
      test('Leafs of tree is a Function', () => {
        expect(tree.test.get).toBeInstanceOf(Function)
        expect(tree.test.test1).toBeInstanceOf(Function)
        expect(tree.test.test2).toBeInstanceOf(Function)
      })
      test('Execution of leaf', () => {
        const expectedCtx = {
          meta: {},
          options: { method: 'get', url: '/test' },
          response: { success: true },
          name: 'get',
          fullName: ['test', 'get']
        }
        const fn = tree.test.get
        return expect(fn()).resolves.toEqual(expectedCtx)
      })
    })
  })
  describe('createRESTApiTree', () => {
    const axiosInstanceMock = () => Promise.resolve({ success: true })
    test('Basic', () => {
      const records = [{
        name: 'test', url: '/test', method: 'get',
        children: [
          { name: 'test1', url: '/test/1', method: 'get' },
          { name: 'test2', url: '/test/2', method: 'get' }
        ]
      }]
      const acc = { meta: [], options: [], hooks: [] }
      const tree = createRESTApiTree(records, acc, axiosInstanceMock)
      expect(tree).toHaveProperty('test')
      expect(tree).toHaveProperty('test.get')
      expect(tree).toHaveProperty('test.test1')
      expect(tree).toHaveProperty('test.test2')
    })
  })
})
