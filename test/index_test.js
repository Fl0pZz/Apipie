// import VueApify from '../lib/index'
import { normalizeRecord, addApiRecord } from '../lib/create-api-map'
import { expect } from 'chai'
// const apify = new VueApify(a)
// const ap = apify.create()
/*const a = [
  {
    name: 'user',
    type: 'get',
    exec: () => Promise.resolve({ data: 'data' }),
    meta: { requireAuth: true },
    children: [
      {
        name: 'settings',
        meta: { settings: 'settings' },
        beforeHook: (meta, next) => {
          console.log('beforeHook UserSettings', meta)
          next()
        },
        exec: (meta) => {
          console.log('user settings', meta)
          return Promise.resolve({ data: 'data' })
        },
        afterHook: (meta, next) => {
          console.log('afterHook UserSettings', meta)
          next()
        }
      },
      {
        name: 'logout',
        meta: { logout: 'logout' },
        beforeHook: (meta, next) => {
          console.log('beforeHook UserLogout', meta)
          next()
        },
        exec: (meta) => {
          console.log('user logout', meta)
          return Promise.resolve({ data: 'data' })
        },
        afterHook: (meta, next) => {
          console.log('afterHook UserLogout', meta)
          next()
        }
      }
    ]
  }
]*/

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
    it('')
  })
})
//
// describe('multiply', () => {
//   it('returns 0 when either argument is 0', () => {
//     strictEqual(multiply(0, 2), 0);
//     strictEqual(multiply(4, 0), 0);
//   });
//
//   it('returns the value of one number if the other is 1', () => {
//     strictEqual(multiply(1, 8), 8);
//     strictEqual(multiply(5, 1), 5);
//   });
//
//   it('is commutative', () => {
//     strictEqual(multiply(2, 4), multiply(4, 2));
//   });
//
//   it('returns the product of the two numbers', () => {
//     strictEqual(multiply(11, 9), 99);
//   });
//
//   it('handles negative numbers', () => {
//     strictEqual(multiply(-2, 2), -4);
//     strictEqual(multiply(2, -2), -4);
//     strictEqual(multiply(-2, -2), 4);
//   });
// });
