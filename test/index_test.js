/* eslint no-console:0 */
import VueApify from '../lib/index'
import { normalizeRecord, addApiRecord, createApiMap } from '../lib/create-api-map'
import { expect } from 'chai'

describe('create api map', () => {
  describe('normalizeRecord', () => {
    it('simple api', () => {
      const api = { name: 'api', exec: () => {} }
      const out = {
        name: api.name,
        meta: {},
        beforeHooks: [],
        exec: api.exec,
        afterHooks: [],
        children: []
      }
      expect(normalizeRecord(api, { beforeHooks: [], afterHooks: [] }, {}))
        .to.deep.equal(out)
    })
  
    it('api with type', () => {
      const api = { name: 'api', type: 'get', exec: () => {} }
      const out = {
        name: api.name,
        meta: {},
        beforeHooks: [],
        exec: api.exec,
        afterHooks: [],
        children: [
          { name: 'get', exec: api.exec }
        ]
      }
      expect(normalizeRecord(api, { beforeHooks: [], afterHooks: [] }, {}))
        .to.deep.equal(out)
    })
  
    it('api with meta', () => {
      const api = {
        name: 'api',
        meta: { requireAuth: true },
        exec: meta => meta
      }
      const out = {
        name: api.name,
        meta: api.meta,
        beforeHooks: [],
        exec: api.exec,
        afterHooks: [],
        children: []
      }
      expect(normalizeRecord(api, { beforeHooks: [], afterHooks: [] }, {}))
        .to.deep.equal(out)
    })
    it('api with hooks', () => {
      const api = {
        name: 'api',
        beforeHook: () => {},
        exec: meta => meta,
        afterHook: () => {}
      }
      const out = {
        name: api.name,
        meta: {},
        beforeHooks: [api.beforeHook],
        exec: api.exec,
        afterHooks: [api.afterHook],
        children: []
      }
      expect(normalizeRecord(api, { beforeHooks: [], afterHooks: [] }, {}))
        .to.deep.equal(out)
    })
  })
  describe('addApiRecord', () => {
    it('simple exec', () => {
      const apiMap = {}
      const api = { name: 'name', exec: Promise.resolve('data') }
      addApiRecord(apiMap, api, { beforeHooks: [], afterHooks: [] })
      expect(apiMap).to.have.deep.property('name')
      apiMap[api.name]()
        .then(data => expect(data).to.equal('data'))
        .catch(data => { console.error(Error( 'unexpected behavior', data )) })
    })
    it('exec with resolve beforeHook', () => {
      const apiMap = {}
      const api = {
        name: 'name',
        beforeHook: () => {},
        exec: Promise.resolve('data')
      }
      addApiRecord(apiMap, api, { beforeHooks: [], afterHooks: [] })
      expect(apiMap).to.have.deep.property('name')
      apiMap[api.name]()
        .then(data => expect(data).to.equal('data'))
        .catch(data => { console.error(Error( 'unexpected behavior', data )) })
    })
    it('exec with reject beforeHook', () => {
      const apiMap = {}
      const api = {
        name: 'name',
        beforeHook: () => { throw 'reject' },
        exec: Promise.resolve('data')
      }
      addApiRecord(apiMap, api, { beforeHooks: [], afterHooks: [] })
      expect(apiMap).to.have.deep.property('name')
      apiMap[api.name]()
        .catch(data => expect(data).to.equal('reject'))
    })
    it('exec with meta and beforeHook', () => {
      let apiMap = {}
      const api = {
        name: 'name',
        meta: { requireAuth: true },
        beforeHook: (meta) => {
          const loggedIn = false
          if ( !(meta.requireAuth && loggedIn) ) { throw 'not'}
        },
        exec: Promise.resolve('data')
      }
      addApiRecord(apiMap, api, { beforeHooks: [], afterHooks: [] })
      apiMap[api.name]().catch(data => expect(data).to.equal('not'))
      
      apiMap = {}
      const api2 = {
        name: 'name',
        meta: { requireAuth: true },
        beforeHook: (meta) => {
          const loggedIn = true
          if ( !(meta.requireAuth && loggedIn) ) { throw 'not'}
        },
        exec: Promise.resolve('data')
      }
      addApiRecord(apiMap, api2, { beforeHooks: [], afterHooks: [] })
      apiMap[api.name]()
        .then(data => expect(data).to.equal('data'))
        .catch(data => { console.error(Error( 'unexpected behavior', data )) })
    })
    it('exec with meta and afterHook', () => {
      let apiMap = {}
      const api = {
        name: 'name',
        meta: { reject: false },
        exec: Promise.resolve('data'),
        afterHook: (meta) => {
          if ( meta.reject ) { throw 'not'}
        }
      }
      addApiRecord(apiMap, api, { beforeHooks: [], afterHooks: [] })
      apiMap[api.name]().catch(data => expect(data).to.equal('not'))
      
      api.meta.reject = false
      apiMap = {}
      addApiRecord(apiMap, api, { beforeHooks: [], afterHooks: [] })
      apiMap[api.name]()
        .then(data => expect(data).to.equal('data'))
        .catch(data => { console.error(Error( 'unexpected behavior', data )) })
    })
    it('exec with children api', () => {
      let apiMap = {}
      const api = {
        name: 'name',
        exec: Promise.resolve('data'),
        children: [
          { name: 'aaa', exec: Promise.resolve('aaa') },
          { name: 'bbb', exec: Promise.resolve('bbb') }
        ]
      }
      addApiRecord(apiMap, api, { beforeHooks: [], afterHooks: [] })
      
      expect(apiMap).to.have.deep.property('name.aaa')
      expect(apiMap).to.have.deep.property('name.bbb')
      
      apiMap.name.aaa()
        .then(data => { expect(data).to.equal('aaa') })
        .catch(data => { console.error(Error( 'unexpected behavior', data )) })
      apiMap
        .name.bbb().then(data => { expect(data).to.equal('bbb') })
        .catch(data => { console.error(Error( 'unexpected behavior', data )) })
    })
    it('exec api with type', () => {
      let apiMap = {}
      const api = {
        name: 'name',
        type: 'get',
        exec: Promise.resolve('data'),
      }
      addApiRecord(apiMap, api, { beforeHooks: [], afterHooks: [] })
  
      expect(apiMap).to.have.deep.property('name.get')
      apiMap.name.get()
        .then(data => { expect(data).to.equal('data') })
        .catch(data => { console.error(Error( 'unexpected behavior', data )) })
    })
  })
  describe('createApiMap', () => {
    it('test createApiMap', () => {
      const api = [
        { name: 'aaa', exec: Promise.resolve('aaa') },
        { name: 'bbb', exec: Promise.resolve('bbb') }
      ]
      const apiMap = createApiMap(api, { beforeHooks: [], afterHooks: [] })
      
      expect(apiMap).to.have.deep.property('aaa')
      expect(apiMap).to.have.deep.property('bbb')
  
      apiMap.aaa()
        .then(data => { expect(data).to.equal('aaa') })
        .catch(data => { console.error(Error( 'unexpected behavior', data )) })
      apiMap.bbb()
        .then(data => { expect(data).to.equal('bbb') })
        .catch(data => { console.error(Error( 'unexpected behavior', data )) })
    })
  })
  it ('final test', () => {
    const options = [
      {
        name: 'user',
        type: 'get',
        exec: Promise.resolve({ data: 'data' }),
        meta: { reject: true },
        children: [
          {
            name: 'settings',
            beforeHook: (meta) => { if( meta.reject) { throw 'reject beforeHook'} },
            exec: Promise.resolve({ data: 'data' })
          },
          {
            name: 'logout',
            exec: Promise.resolve({ data: 'data' }),
            afterHook: (meta) => { if (meta.reject) { throw 'reject afterHook'} }
          }
        ]
      }
    ]
    const api = createApiMap(options, { beforeHooks: [], afterHooks: [] })
    
    expect(api).to.have.deep.property('user')
    expect(api).to.have.deep.property('user.get')
    expect(api).to.have.deep.property('user.settings')
    expect(api).to.have.deep.property('user.logout')
    
    api.user.get()
      .then(data => expect(data).to.deep.equal({ data: 'data' }))
      .catch(data => { console.error(Error( 'unexpected behavior', data )) })
    api.user.settings().catch(data => expect(data).to.equal('reject beforeHook'))
    api.user.logout().catch(data => expect(data).to.equal('reject afterHook'))
  })
})

describe('class VueApify', () => {
  it ('create api', () => {
    const options = [
      {
        name: 'user',
        type: 'get',
        exec: Promise.resolve({ data: 'data' }),
        meta: { reject: true },
        children: [
          {
            name: 'settings',
            beforeHook: (meta) => { if( meta.reject) { throw 'reject beforeHook'} },
            exec: Promise.resolve({ data: 'data' })
          },
          {
            name: 'logout',
            exec: Promise.resolve({ data: 'data' }),
            afterHook: (meta) => { if (meta.reject) { throw 'reject afterHook'} }
          }
        ]
      }
    ]
    const apify = new VueApify(options)
    const api = apify.create()
  
    api.user.get()
      .then(data => expect(data).to.deep.equal({ data: 'data' }))
      .catch(data => { console.error(Error( 'unexpected behavior', data )) })
    api.user.settings().catch(data => expect(data).to.equal('reject beforeHook'))
    api.user.logout().catch(data => expect(data).to.equal('reject afterHook'))
  })
  it('beforeEach hook', () => {
    const options = [
      { name: 'aaa', exec: Promise.resolve('aaa') }
    ]
    const apify = new VueApify(options)
    apify.beforeEach(() => { throw 'reject'})
    const api = apify.create()
    api.aaa().catch(data => expect(data).to.equal('reject'))
  })
  it('afterEach hook', () => {
    const options = [
      { name: 'aaa', meta: { reject: true }, exec: Promise.resolve('aaa') }
    ]
    const apify = new VueApify(options)
    apify.afterEach((meta) => { if(meta.reject) { throw 'reject' }})
    const api = apify.create()
    api.aaa().catch(data => expect(data).to.equal('reject'))
  })
})
