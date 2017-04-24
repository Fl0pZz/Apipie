/* eslint no-console:0 */
import {
  createExecFunc,
  normalizeRecord,
  createRequestFunc,
  addApiRecord,
  createApiMap
} from '../lib/create-api-map'
import h from '../lib/utils/helper'
import parseExecArgs, { mergeArraysToObject } from '../lib/utils/args-parser'
import { expect } from 'chai'
import axios from 'axios'

describe('utils', () => {
  it('helper', () => {
    const fn = () => {}
    const record = h('test', 'GET', '/test', fn, { meta: true }, [
      h('test1', 'GET', '/test/1',),
      h('test2', 'GET', '/test/2',)
    ])
    const out = {
      name: 'test', url: '/test',
      method: 'GET', meta: { meta: true },
      hooks: [fn], children: [
        {
          name: 'test1', url: '/test/1', method: 'GET',
          meta: {}, hooks: [], children: []
        },
        {
          name: 'test2', url: '/test/2', method: 'GET',
          meta: {}, hooks: [], children: []
        }
      ]
    }
    expect(record).to.deep.equal(out)
  })
  describe('args-parser', () => {
    it('mergeArraysToObject', () => {
      const names = ['1', '2', '3']
      const values = [1, 2, 3]
      const result = mergeArraysToObject(names, values)
      const expected = {
        '1': 1,
        '2': 2,
        '3': 3
      }
      expect(result).to.deep.equal(expected)
    })
    it('parseExecArgs', () => {
      const url = '/test/:id'
      const payload = { params: { id: 1 }, data: { test: 'test' } }
      const result = parseExecArgs(url, [1], payload)
      const expected = {
        url: '/test/1',
        params: { id: 1},
        data: { test: 'test' }
      }
      expect(result).to.deep.equal(expected)
    })
  })
})

describe('create-api-map', () => {
  const axiosInstanceMock = () => Promise.resolve({ success: true })
  it('normalizeRecord', () => {
    const record = h('test', 'GET', { path: '/test', options: { timeout: 1000 }})
    const fn = () => {}
    const payload = {
      options: { headers: {'X-Custom-Header': 'foobar'} },
      meta: { meta: true }, hooks: [fn]
    }
    const result = normalizeRecord(record, payload)
    const expected = {
      name: 'test', url: '/test',
      options: {
        timeout: 1000,
        headers: {'X-Custom-Header': 'foobar'},
        method: "GET"
      },
      meta: { meta: true }, hooks: [fn], children: []
    }
    expect(result).to.deep.equal(expected)
  })
  it('createRequestFunc', () => {
    const record = {
      name: 'test', url: '/test/:id',
      options: {
        timeout: 1000,
        headers: {'X-Custom-Header': 'foobar'},
        method: "GET"
      },
      meta: { meta: true }, hooks: [], children: []
    }
    const fn = createRequestFunc(record, axiosInstanceMock)
    const context = {}
    const expectedCtx = {
      response: { success: true }
    }
    fn(context, () => {}).then(() => {
      expect(context).to.deep.equal(expectedCtx)
    })
  })
  it('createExecFunc', () => {
    const record = {
      name: 'test', url: '/test/:id',
      options: {
        timeout: 1000,
        headers: {'X-Custom-Header': 'foobar'},
        method: "GET"
      },
      meta: { meta: true }, hooks: [], children: []
    }
    const fn = createExecFunc(record, axiosInstanceMock)
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
    fn([1]).then(ctx => { expect(ctx).to.deep.equal(expectedCtx) })
  })
  it('addApiRecord', () => {
    const apiMap = {}
    const record = h('test', 'GET', '/test', { meta: true }, [
      h('test1', 'GET', '/test/1',),
      h('test2', 'GET', '/test/2',)
    ])
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
      expect(ctx).to.deep.equal(expectCtx1)
    }).catch(err => console.log(err))
    const expectCtx2 = {
      meta: { meta: true },
      options: {
        method: 'GET',
        url: '/test/2'
      },
      response: { success: true }
    }
    apiMap.test.test2().then(ctx => {
      expect(ctx).to.deep.equal(expectCtx2)
    }).catch(err => console.log(err))
  })
  it('createApiMap', () => {
    const records = [
      h('test', 'GET', '/test', { meta: true }, [
        h('test1', 'GET', '/test/1'),
        h('test2', 'GET', '/test/2')
      ]),
      h('a', 'GET', '/test', { meta: true }, [
        h('b', 'GET', '/test/1')
      ])
    ]
    const options = { axiosInstance: axiosInstanceMock }
    const apiMap = createApiMap(records, options)
    expect(apiMap).to.have.deep.property('test')
    expect(apiMap).to.have.deep.property('test.test1')
    expect(apiMap).to.have.deep.property('test.test2')
    expect(apiMap).to.have.deep.property('a')
    expect(apiMap).to.have.deep.property('a.b')
  })
})

it('check stacking of meta and hooks', () => {
  const axiosInstanceMock = () => Promise.resolve({ success: true })
  const baseHook = (ctx, next) => {
    if (ctx.meta.base) {
      ctx.meta.baseHook = 'baseHook'
      next()
    } else {
      throw 'reject baseHook'
    }
  }
  const hook = (ctx, next) => {
    if (ctx.meta.test) {
      ctx.meta.hook = 'hook'
      next()
    } else {
      throw 'reject hook'
    }
  }
  const records = [
    h('test', 'GET', '/test', { base: false }, baseHook, [
      h('test1', 'GET', '/test/1', { base: true, test: true }, hook),
      h('test2', 'GET', '/test/2', { test: false }, hook)
    ])
  ]
  const options = { axiosInstance: axiosInstanceMock }
  const apiMap = createApiMap(records, options)
  
  apiMap.test.test1().then(ctx => {
    const expectedCtx = {
      meta: {
        base: true,
        test: true,
        baseHook: 'baseHook',
        hook: 'hook'
      },
      options: { method: 'GET', url: '/test/1' },
      response: { success: true }
    }
    expect(ctx).to.deep.equal(expectedCtx)
  }).catch(e => console.error(e))
  
  apiMap.test.test2().catch(e => {
    expect(e).to.equal('reject baseHook')
  })
})

