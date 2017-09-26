import createApi from '../lib/index'

describe('Apipie', () => {
  describe('GlobalHook', () => {
    const axiosMock = () => Promise.resolve({ success: true })
    test('Base', () => {
      const records = [{ name: 'test', url: '/url', method: 'get' }]
      const hook = (ctx, next) => {
        ctx.meta.hook = 'hook!'
        next()
      }
      const api = createApi(records, axiosMock, { hooks: [hook] })
      return expect(api.test()).resolves.toMatchObject({ meta: { hook: 'hook!' } })
    })
    test('Async base', () => {
      const records = [{ name: 'test', url: '/url', method: 'get' }]
      const hook = async (ctx, next) => {
        ctx.meta.hook = 'hook!'
        await next()
      }
      const api = createApi(records, axiosMock, { hooks: [hook] })
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
      const records = [{ name: 'test', url: '/url', method: 'get', hook }]
      const api = createApi(records, axiosMock, { hooks: [globalHook] })
      const expectedMeta = {
        beforeGlobalHook: 'beforeGlobalHook',
        afterGlobalHook: 'afterGlobalHook',
        beforeHook: 'beforeHook',
        afterHook: 'afterHook'
      }
      return expect(api.test()).resolves.toMatchObject({ meta: expectedMeta })
    })
  })
})

describe('Full tests', () => {
  const axiosMock = () => Promise.resolve({ success: true })
  function hook (ctx, next) {
    if (ctx.meta.requireAuth) {
      throw new Error('Auth require')
    }
    next()
  }
  const records = [
    {
      name: 'user',
      meta: {requireAuth: true},
      hook,
      children: [
        {name: 'get', meta: {requireAuth: false}, options: {url: '/user/:id', method: 'GET'}},
        {name: 'settings', options: {url: '/user/:id/settings', method: 'GET'}}
      ]
    },
    {
      name: 'content',
      meta: {contentMeta: 'content'},
      children: [
        {name: 'images', meta: {imagesMeta: 'image'}, options: {url: '/images/:id', method: 'GET'}},
        {name: 'apps', options: {url: '/apps/:id', method: 'GET'}}
      ]
    }
  ]

  const api = createApi(records, axiosMock)

  test('Has all routes', () => {
    expect(api).toHaveProperty('user')
    expect(api).toHaveProperty('user.get')
    expect(api).toHaveProperty('user.settings')
    expect(api).toHaveProperty('content')
    expect(api).toHaveProperty('content.images')
    expect(api).toHaveProperty('content.apps')
  })
  test('Reject hook', () => {
    return expect(api.user.settings({params: {id: 1}})).rejects.toBeInstanceOf(Error)
  })
  test('Access to response', () => {
    return expect(api.user.get({params: {id: 1}})).resolves.toMatchObject({response: {success: true}})
  })
  test('Meta', () => {
    const expectMeta = {
      contentMeta: 'content',
      imagesMeta: 'image'
    }
    api.content.images({params: {id: 1}}).then(ctx => {
      expect(ctx.meta).toEqual(expectMeta)
    })
  })
})
