import pathToRegexp from 'path-to-regexp';
import merge from 'deepmerge';

function parseExecArgs (url, props) {
  var result = { url: url };
  if (!props) {
    return result
  }
  var url_params = props.url_params;
  var params = props.params;
  var data = props.data;
  if (url_params) {
    /*
      TODO: add validations of url_params
      let names = pathToRegexp.parse(url)
        .filter(token => typeof token !== 'string' )
        .map(({ name }) => name)
      names === Object.keys(url_params)
    */
    var toPath = pathToRegexp.compile(url);
    result.url = toPath(url_params);
  }
  if (params) {
    result.params = params;
  }
  if (data) {
    result.data = data;
  }
  return result
}

function compose (hooks) {
  if (!Array.isArray(hooks)) { throw new TypeError('Hooks stack must be an array!') }
  hooks.forEach(function (fn) { if (typeof fn !== 'function') { throw new TypeError('Hooks must be composed of functions!') } });
  // for (const fn of hooks) {
  //   if (typeof fn !== 'function') throw new TypeError('Hooks must be composed of functions!')
  // }
  
  return function (context, next) {
    // last called middleware #
    var index = -1;
    return dispatch(0)
    function dispatch (i) {
      if (i <= index) { return Promise.reject(new Error('next() called multiple times')) }
      index = i;
      var fn = hooks[i];
      if (i === hooks.length) { fn = next; }
      if (!fn) { return Promise.resolve() }
      try {
        return Promise.resolve(fn(context, function next () {
          return dispatch(i + 1)
        }))
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}

function createApiMap (records, ref) {
  var axiosInstance = ref.axiosInstance;

  var apiMap = {};
  records.forEach(function (api) { return addApiRecord(apiMap, api, {}, axiosInstance ); });
  return apiMap
}

function addApiRecord (apiMap, record, acc, axiosInstance) {
  record = normalizeRecord(record, acc);
  apiMap[record.name] = {};

  if (record.children.length) {
    record.children.forEach(function (child) { addApiRecord(apiMap[record.name], child, record, axiosInstance); });
    return
  }
  apiMap[record.name] = createExecFunc(record, axiosInstance);
}

function normalizeRecord (record, props) {
  var options = props.options; if ( options === void 0 ) options = {};
  var meta = props.meta; if ( meta === void 0 ) meta = {};
  var hooks = props.hooks; if ( hooks === void 0 ) hooks = [];
  var createSimpleChildRecord = function (url, method) { return ({ name: method.toLowerCase(), options: { url: url, method: method } }); };
  var normalizedRecord = {
    name: record.name,
    children: record.children || [],
    options: merge.all([options, record.options || {}]),
    meta: merge.all([meta, record.meta || {}]),
    hooks: record.hooks && record.hooks.length
      ? hooks.concat(record.hooks)
      : hooks.slice()
  };
  if (record.url && record.method) {
    normalizedRecord.options = merge.all([normalizedRecord.options, { url: record.url, method: record.method }]);
  }
  if (normalizedRecord.children.length && normalizedRecord.options.method && normalizedRecord.options.url) {
    normalizedRecord.children.push(createSimpleChildRecord(normalizedRecord.options.url, normalizedRecord.options.method));
    delete normalizedRecord.options.url;
    delete normalizedRecord.options.method;
  }
  return normalizedRecord
}

function createExecFunc (record, axiosInstance) {
  function createContext(ref) {
    var meta = ref.meta;
    var options = ref.options;

    return {
      meta: meta,
      options: options,
      response: null
    }
  }
  function createRequestFunc () {
    return function (ctx, next) {
      return axiosInstance(record.options)
        .then(function (response) {
          ctx.response = response;
          next();
        })
    }
  }
  return function (payload) {
    record.options = merge(record.options, parseExecArgs(record.options.url, payload));
    record.hooks.push(createRequestFunc());

    var fn = compose(record.hooks);
    var context = createContext(record);

    return fn(context).then(function () { return context; })
  }
}

function install (Vue) {
  Object.defineProperty(Vue.prototype, '$api', {
    get: function get () { return this.$options.api }
  });
}

var VueApify = function VueApify () {};

VueApify.create = function create (records, axiosInstance) {
  return createApiMap(records, axiosInstance)
};

VueApify.install = install;

export default VueApify;
//# sourceMappingURL=vue-apify.esm.js.map
