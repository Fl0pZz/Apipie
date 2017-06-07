import VueApify from './index'

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