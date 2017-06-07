import VueApify from './index'
import axios from 'axios'
import httpAdapter from 'axios/lib/adapters/http'

const host = 'http://localhost';

axios.defaults.host = host;
axios.defaults.adapter = httpAdapter;


describe('VueApify', () => {
  describe('GlobalHook', () => {
    const axiosMock = () => Promise.resolve({ success: true })
    test('Base', () => {
      const records = [{ name: 'test', url: 'url', method: 'get' }]
      const hook = (ctx, next) => {
        ctx.meta.hook = 'hook!'
        next()
      }
      const apify = new VueApify(records, { axios: axiosMock })
      apify.globalHook(hook)
      const api = apify.create()
      return expect(api.test()).resolves.toMatchObject({ meta: { hook: 'hook!' } })
    })
    test('Async base', () => {
      const records = [{ name: 'test', url: 'url', method: 'get' }]
      const hook = async (ctx, next) => {
        ctx.meta.hook = 'hook!'
        await next()
      }
      const apify = new VueApify(records, { axios: axiosMock })
      apify.globalHook(hook)
      const api = apify.create()
      return expect(api.test()).resolves.toMatchObject({ meta: { hook: 'hook!' } })
    })
    test('Composition', () => {
      const globalHook = async (ctx, next) => {
        ctx.meta.beforeGlobalHook = 'beforeGlobalHook'
        await next()
        ctx.meta.afterGlobalHook = 'afterGlobalHook'
      }
      const hook = async (ctx, next) => {
        ctx.meta.beforeHook = 'beforeHook'
        await next()
        ctx.meta.afterHook = 'afterHook'
      }
      const records = [{ name: 'test', url: 'url', method: 'get', hook }]
      const apify = new VueApify(records, { axios: axiosMock })
      apify.globalHook(globalHook)
      const api = apify.create()
      const expectedMeta = {
        beforeGlobalHook: 'beforeGlobalHook',
        afterGlobalHook: 'afterGlobalHook',
        beforeHook: 'beforeHook',
        afterHook:'afterHook'
      }
      return expect(api.test()).resolves.toMatchObject({ meta: expectedMeta })
    })
  })
})

describe('Full tests', () => {
  const axiosMock = () => Promise.resolve({ success: true })
  function hook(ctx, next) {
    if (ctx.meta.requireAuth) {
      throw new Error('Auth require')
    }
    next()
  }
  const records = [
    {
      name: 'user', meta: {requireAuth: true}, hook, children: [
        {name: 'get', meta: {requireAuth: false}, options: {url: '/user/:id', method: 'GET'}},
        {name: 'settings', options: {url: '/user/:id/settings', method: 'GET'}}
      ]
    },
    {
      name: 'content', meta: {contentMeta: 'content'}, children: [
        {name: 'images', meta: {imagesMeta: 'image'}, options: {url: '/images/:id', method: 'GET'}},
        {name: 'apps', options: {url: '/apps/:id', method: 'GET'}}
      ]
    }
  ]

  const apify = new VueApify(records, { axios: axiosMock })
  const api = apify.create()

  test('Has all routes', () => {
    expect(api).toHaveProperty('user')
    expect(api).toHaveProperty('user.get')
    expect(api).toHaveProperty('user.settings')
    expect(api).toHaveProperty('content')
    expect(api).toHaveProperty('content.images')
    expect(api).toHaveProperty('content.apps')
  })
  test('Reject hook', () => {
    return expect(api.user.settings({url_params: {id: 1}})).rejects.toBeInstanceOf(Error)
  })
  test('Access to response', () => {
    return expect(api.user.get({url_params: {id: 1}})).resolves.toMatchObject({response: {success: true}})
  })
  test('Meta', () => {
    const expectMeta = {
      contentMeta: 'content',
      imagesMeta: 'image'
    }
    api.content.images({url_params: {id: 1}}).then(ctx => {
      expect(ctx.meta).toEqual(expectMeta)
    })
  })
})
describe('Test with axios', () => {
  describe('Test', () => {
    const globalHook = async (ctx, next) => {
      ctx.meta.beforeGlobalHook = 'beforeGlobalHook'
      await next()
      ctx.meta.afterGlobalHook = 'afterGlobalHook'
    }
    const hook = async (ctx, next) => {
      ctx.meta.beforeHook = 'beforeHook'
      await next()
      ctx.meta.afterHook = 'afterHook'
    }
    const hook1 = async (ctx, next) => {
      ctx.meta.beforeHook1 = 'beforeHook1'
      await next()
      ctx.meta.afterHook1 = 'afterHook1'
    }
    const records = [
      { name: 'test', url: 'https://httpbin.org/get', method: 'get', hook },
      { name: 'test2', url: 'https://httpbin.org/get', method: 'get', hook },
      { name: 'rejected', url: 'https://httpbin.org/get1', method: 'get', hook },
      { name: 'parent', url: 'https://httpbin.org/get', method: 'get', hook,
        children: [
          { name: 'child', url: 'https://httpbin.org/get', method: 'get', hook: hook1 }
        ]
      }
    ]
    const apify = new VueApify(records, { axios })
    apify.globalHook(globalHook)
    const api = apify.create()

    const expectedMeta = {
      beforeGlobalHook: 'beforeGlobalHook',
      afterGlobalHook: 'afterGlobalHook',
      beforeHook: 'beforeHook',
      afterHook:'afterHook'
    }
    test('Simple request', () => {
      return expect(api.test()).resolves.toMatchObject({ meta: expectedMeta })
    })
    test('Reject request', () => {
      return expect(api.rejected()).rejects.toBeInstanceOf(Error)
    })
    test('Request with params', () => {
      return expect(api.test({ params: { test: 'test' } })).resolves.toMatchObject({ meta: expectedMeta })
    })
    test('Composition', () => {
      const expectedMeta = {
        beforeGlobalHook: 'beforeGlobalHook',
        afterGlobalHook: 'afterGlobalHook',
        beforeHook: 'beforeHook',
        afterHook:'afterHook',
        beforeHook1: 'beforeHook1',
        afterHook1: 'afterHook1'
      }
      return expect(api.parent.child()).resolves.toMatchObject({ meta: expectedMeta })
    })
  })
})