var index$1 = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

/**
 * Expose `pathToRegexp`.
 */
var index = pathToRegexp;
var parse_1 = parse;
var compile_1 = compile;
var tokensToFunction_1 = tokensToFunction;
var tokensToRegExp_1 = tokensToRegExp;

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
  // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
  // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
  '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))'
].join('|'), 'g');

/**
 * Parse a string for the raw tokens.
 *
 * @param  {string}  str
 * @param  {Object=} options
 * @return {!Array}
 */
function parse (str, options) {
  var tokens = [];
  var key = 0;
  var index = 0;
  var path = '';
  var defaultDelimiter = options && options.delimiter || '/';
  var res;

  while ((res = PATH_REGEXP.exec(str)) != null) {
    var m = res[0];
    var escaped = res[1];
    var offset = res.index;
    path += str.slice(index, offset);
    index = offset + m.length;

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1];
      continue
    }

    var next = str[index];
    var prefix = res[2];
    var name = res[3];
    var capture = res[4];
    var group = res[5];
    var modifier = res[6];
    var asterisk = res[7];

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path);
      path = '';
    }

    var partial = prefix != null && next != null && next !== prefix;
    var repeat = modifier === '+' || modifier === '*';
    var optional = modifier === '?' || modifier === '*';
    var delimiter = res[2] || defaultDelimiter;
    var pattern = capture || group;

    tokens.push({
      name: name || key++,
      prefix: prefix || '',
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      partial: partial,
      asterisk: !!asterisk,
      pattern: pattern ? escapeGroup(pattern) : (asterisk ? '.*' : '[^' + escapeString(delimiter) + ']+?')
    });
  }

  // Match any characters still remaining.
  if (index < str.length) {
    path += str.substr(index);
  }

  // If the path exists, push it onto the end.
  if (path) {
    tokens.push(path);
  }

  return tokens
}

/**
 * Compile a string to a template function for the path.
 *
 * @param  {string}             str
 * @param  {Object=}            options
 * @return {!function(Object=, Object=)}
 */
function compile (str, options) {
  return tokensToFunction(parse(str, options))
}

/**
 * Prettier encoding of URI path segments.
 *
 * @param  {string}
 * @return {string}
 */
function encodeURIComponentPretty (str) {
  return encodeURI(str).replace(/[\/?#]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
  })
}

/**
 * Encode the asterisk parameter. Similar to `pretty`, but allows slashes.
 *
 * @param  {string}
 * @return {string}
 */
function encodeAsterisk (str) {
  return encodeURI(str).replace(/[?#]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
  })
}

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction (tokens) {
  // Compile all the tokens into regexps.
  var matches = new Array(tokens.length);

  // Compile all the patterns before compilation.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === 'object') {
      matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$');
    }
  }

  return function (obj, opts) {
    var path = '';
    var data = obj || {};
    var options = opts || {};
    var encode = options.pretty ? encodeURIComponentPretty : encodeURIComponent;

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (typeof token === 'string') {
        path += token;

        continue
      }

      var value = data[token.name];
      var segment;

      if (value == null) {
        if (token.optional) {
          // Prepend partial segment prefixes.
          if (token.partial) {
            path += token.prefix;
          }

          continue
        } else {
          throw new TypeError('Expected "' + token.name + '" to be defined')
        }
      }

      if (index$1(value)) {
        if (!token.repeat) {
          throw new TypeError('Expected "' + token.name + '" to not repeat, but received `' + JSON.stringify(value) + '`')
        }

        if (value.length === 0) {
          if (token.optional) {
            continue
          } else {
            throw new TypeError('Expected "' + token.name + '" to not be empty')
          }
        }

        for (var j = 0; j < value.length; j++) {
          segment = encode(value[j]);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received `' + JSON.stringify(segment) + '`')
          }

          path += (j === 0 ? token.prefix : token.delimiter) + segment;
        }

        continue
      }

      segment = token.asterisk ? encodeAsterisk(value) : encode(value);

      if (!matches[i].test(segment)) {
        throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
      }

      path += token.prefix + segment;
    }

    return path
  }
}

/**
 * Escape a regular expression string.
 *
 * @param  {string} str
 * @return {string}
 */
function escapeString (str) {
  return str.replace(/([.+*?=^!:${}()[\]|\/\\])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {string} group
 * @return {string}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1')
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {!RegExp} re
 * @param  {Array}   keys
 * @return {!RegExp}
 */
function attachKeys (re, keys) {
  re.keys = keys;
  return re
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {string}
 */
function flags (options) {
  return options.sensitive ? '' : 'i'
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {!RegExp} path
 * @param  {!Array}  keys
 * @return {!RegExp}
 */
function regexpToRegexp (path, keys) {
  // Use a negative lookahead to match only capturing groups.
  var groups = path.source.match(/\((?!\?)/g);

  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: null,
        delimiter: null,
        optional: false,
        repeat: false,
        partial: false,
        asterisk: false,
        pattern: null
      });
    }
  }

  return attachKeys(path, keys)
}

/**
 * Transform an array into a regexp.
 *
 * @param  {!Array}  path
 * @param  {Array}   keys
 * @param  {!Object} options
 * @return {!RegExp}
 */
function arrayToRegexp (path, keys, options) {
  var parts = [];

  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source);
  }

  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

  return attachKeys(regexp, keys)
}

/**
 * Create a path regexp from string input.
 *
 * @param  {string}  path
 * @param  {!Array}  keys
 * @param  {!Object} options
 * @return {!RegExp}
 */
function stringToRegexp (path, keys, options) {
  return tokensToRegExp(parse(path, options), keys, options)
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {!Array}          tokens
 * @param  {(Array|Object)=} keys
 * @param  {Object=}         options
 * @return {!RegExp}
 */
function tokensToRegExp (tokens, keys, options) {
  if (!index$1(keys)) {
    options = /** @type {!Object} */ (keys || options);
    keys = [];
  }

  options = options || {};

  var strict = options.strict;
  var end = options.end !== false;
  var route = '';

  // Iterate over the tokens and create our regexp string.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];

    if (typeof token === 'string') {
      route += escapeString(token);
    } else {
      var prefix = escapeString(token.prefix);
      var capture = '(?:' + token.pattern + ')';

      keys.push(token);

      if (token.repeat) {
        capture += '(?:' + prefix + capture + ')*';
      }

      if (token.optional) {
        if (!token.partial) {
          capture = '(?:' + prefix + '(' + capture + '))?';
        } else {
          capture = prefix + '(' + capture + ')?';
        }
      } else {
        capture = prefix + '(' + capture + ')';
      }

      route += capture;
    }
  }

  var delimiter = escapeString(options.delimiter || '/');
  var endsWithDelimiter = route.slice(-delimiter.length) === delimiter;

  // In non-strict mode we allow a slash at the end of match. If the path to
  // match already ends with a slash, we remove it for consistency. The slash
  // is valid at the end of a path match, not in the middle. This is important
  // in non-ending mode, where "/test/" shouldn't match "/test//route".
  if (!strict) {
    route = (endsWithDelimiter ? route.slice(0, -delimiter.length) : route) + '(?:' + delimiter + '(?=$))?';
  }

  if (end) {
    route += '$';
  } else {
    // In non-ending mode, we need the capturing groups to match as much as
    // possible by using a positive lookahead to the end or next path segment.
    route += strict && endsWithDelimiter ? '' : '(?=' + delimiter + '|$)';
  }

  return attachKeys(new RegExp('^' + route, flags(options)), keys)
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(string|RegExp|Array)} path
 * @param  {(Array|Object)=}       keys
 * @param  {Object=}               options
 * @return {!RegExp}
 */
function pathToRegexp (path, keys, options) {
  if (!index$1(keys)) {
    options = /** @type {!Object} */ (keys || options);
    keys = [];
  }

  options = options || {};

  if (path instanceof RegExp) {
    return regexpToRegexp(path, /** @type {!Array} */ (keys))
  }

  if (index$1(path)) {
    return arrayToRegexp(/** @type {!Array} */ (path), /** @type {!Array} */ (keys), options)
  }

  return stringToRegexp(/** @type {string} */ (path), /** @type {!Array} */ (keys), options)
}

index.parse = parse_1;
index.compile = compile_1;
index.tokensToFunction = tokensToFunction_1;
index.tokensToRegExp = tokensToRegExp_1;

function parseExecArgs (url, props, ref) {
  var _require = ref._require;

  var result = { url: url };
  
  // validate query
  if (_require.query && (!props || !props.query)) {
    throw new Error('Require query!')
  }

  // validate data
  if (_require.data && (!props || !props.data)) {
    throw new Error('Require data!')
  }

  //validate params
  var requireParams = index.parse(url)
    .filter(function (token) { return [
          typeof token !== 'string',
          !token.optional, // https://github.com/pillarjs/path-to-regexp#optional
          !token.asterisk // https://github.com/pillarjs/path-to-regexp#asterisk
        ].every(Boolean); }
    )
    .map(function (ref) {
      var name = ref.name;

      return name;
  });

  if (requireParams.length && !props) {
    throw new Error('Require params!')
  }

  if (!props) {
    return result
  }

  var params = props.params;
  var query = props.query;
  var data = props.data;

  if (params) {
    requireParams.forEach(function (param) {
      if (!params[param]) {
        throw new Error(("Require " + (requireParams.join(', ')) + ", but given " + (Object.keys(params).join(', ') || 'nothing')))
      }
    });

    var toPath = index.compile(url);
    result.url = toPath(params);
  }

  // query == params for axios
  if (query) {
    result.params = query;
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

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var index$3 = createCommonjsModule(function (module, exports) {
(function (root, factory) {
    if (typeof undefined === 'function' && undefined.amd) {
        undefined(factory);
    } else {
        module.exports = factory();
    }
}(commonjsGlobal, function () {

function isMergeableObject(val) {
    var nonNullObject = val && typeof val === 'object';

    return nonNullObject
        && Object.prototype.toString.call(val) !== '[object RegExp]'
        && Object.prototype.toString.call(val) !== '[object Date]'
}

function emptyTarget(val) {
    return Array.isArray(val) ? [] : {}
}

function cloneIfNecessary(value, optionsArgument) {
    var clone = optionsArgument && optionsArgument.clone === true;
    return (clone && isMergeableObject(value)) ? deepmerge(emptyTarget(value), value, optionsArgument) : value
}

function defaultArrayMerge(target, source, optionsArgument) {
    var destination = target.slice();
    source.forEach(function(e, i) {
        if (typeof destination[i] === 'undefined') {
            destination[i] = cloneIfNecessary(e, optionsArgument);
        } else if (isMergeableObject(e)) {
            destination[i] = deepmerge(target[i], e, optionsArgument);
        } else if (target.indexOf(e) === -1) {
            destination.push(cloneIfNecessary(e, optionsArgument));
        }
    });
    return destination
}

function mergeObject(target, source, optionsArgument) {
    var destination = {};
    if (isMergeableObject(target)) {
        Object.keys(target).forEach(function (key) {
            destination[key] = cloneIfNecessary(target[key], optionsArgument);
        });
    }
    Object.keys(source).forEach(function (key) {
        if (!isMergeableObject(source[key]) || !target[key]) {
            destination[key] = cloneIfNecessary(source[key], optionsArgument);
        } else {
            destination[key] = deepmerge(target[key], source[key], optionsArgument);
        }
    });
    return destination
}

function deepmerge(target, source, optionsArgument) {
    var array = Array.isArray(source);
    var options = optionsArgument || { arrayMerge: defaultArrayMerge };
    var arrayMerge = options.arrayMerge || defaultArrayMerge;

    if (array) {
        return Array.isArray(target) ? arrayMerge(target, source, optionsArgument) : cloneIfNecessary(source, optionsArgument)
    } else {
        return mergeObject(target, source, optionsArgument)
    }
}

deepmerge.all = function deepmergeAll(array, optionsArgument) {
    if (!Array.isArray(array) || array.length < 2) {
        throw new Error('first argument should be an array with at least two elements')
    }

    // we are sure there are at least 2 values, so it is safe to have no initial value
    return array.reduce(function(prev, next) {
        return deepmerge(prev, next, optionsArgument)
    })
};

return deepmerge

}));
});

function setVal (obj, propNamesPath, val) {
  propNamesPath.reduce(function (acc, propName, i) {
    if (i === propNamesPath.length - 1) { return acc[propName] = val }
      return acc[propName]
    }, obj);
}

function getVal (obj, propNamesPath) {
  return propNamesPath.reduce(function (acc, propName) { return acc[propName]; }, obj)
}

/*
* STEP 1: Create a skeleton tree with minimal intermediate computations
*/
function createTreeSkeleton (records, baseOptions) {
  /*
  * options: {
  *   hooks,
  *   meta,
  *   options,
  *   records,
  *   axios
  * }
  */
  var tree = {};
  baseOptions.tree = tree;
  var closurePack = baseOptions;
  records.forEach(function (record, index) { return addTreeBranch(tree, record, [index], closurePack); });
  return tree
}

function addTreeBranch (branch, record, indexPath, closurePack) {
  branch[record.name] = {};
  if (record.children && record.children.length) {
    if (record.method) {
      record.children.push({
        name: record.method,
        method: record.method,
        url: record.url,
        data: !!record.data,
        query: !!record.query
      });
    }
    record.children.forEach(function (childRecord, index) { return addTreeBranch(branch[record.name], childRecord, indexPath.concat(index), closurePack); });
    return
  }
  // Create lazy calculation leaf
  branch[record.name] = lazyCalcLeafNode(indexPath, closurePack);
}

function lazyCalcLeafNode (indexPath, closurePack) {
  return function (props) {
    var tree = closurePack.tree;
    var records = closurePack.records;
    var axios = closurePack.axios;
    var ref = calculateBranchNodes(records, indexPath, [], closurePack);
    var propNamesPath = ref[0];
    var record = ref[1];
    setVal(tree, propNamesPath, createExecFunc(record, propNamesPath, axios));
    return getVal(tree, propNamesPath)(props)
  }
}
/*
* STEP 2: Сompute only the necessary nodes of the tree to execute the request
*/
function calculateBranchNodes (records, indexPath, propNamesPath, closurePack) {
  var index = indexPath.shift();
  records[index] = normalizeRecord(records[index], closurePack);
  var record = records[index];
  propNamesPath.push(record.name);
  if (record.children.length) {
    return calculateBranchNodes(record.children, indexPath, propNamesPath, record)
  }
  return [propNamesPath, record]
}

function normalizeRecord (record, props) {
  if (record._normalized) { return record }

  var options = props.options; if ( options === void 0 ) options = [];
  var meta = props.meta; if ( meta === void 0 ) meta = [];
  var hooks = props.hooks; if ( hooks === void 0 ) hooks = [];
  removeSugarSyntax(record);
  var normalizedRecord = {
    _normalized: true,
    _require: {
      data: !!record.data,
      query: !!record.query
    },
    name: record.name,
    meta: [].concat(meta, record.meta || {}),
    options: [].concat(options, record.options || {}),
    hooks: [].concat(hooks, record.hook || []),
    children: record.children || []
  };
  /*
    {
      ...,
      option: { ...,url, method },
      children: [...]
    }
    transform to
    {
      ...,
      option: { ... },
      children: [
        ...,
        { name: method, option: { url, method } }
      ]
    }
   */
  var opts = normalizedRecord.options[normalizedRecord.options.length - 1];
  if (normalizedRecord.children.length && opts.method) {
    delete opts.method;
  }
  stackUrl(normalizedRecord.options);
  return normalizedRecord
}

var arrayOfMethods = ['get', 'delete', 'head', 'post', 'options', 'put', 'patch'];

function removeSugarSyntax(record) {
  // { name, url, method } --> { name, option: { url, method } }
  if (record.options == null) { record.options = {}; }
  if (record.url) {
    record.options.url = record.url;
  }
  if (record.url && record.method) {
    record.options.method = record.method;
  }
  
  // { name, method: url } --> { name, option: { url, method } }
  var httpMethod = arrayOfMethods.find(function (key) { return key in record; });
  if (httpMethod && typeof record[httpMethod] === 'string') {
    record.options.url = record[httpMethod];
    record.options.method = httpMethod;
  }
}

function stackUrl (options) {
  options = options.filter(function (opt) { return opt.url != null; });
  var getUrl = function (arr, offset) {
    if ( offset === void 0 ) offset = 1;

    if (arr.length - offset >= 0) {
      if (arr[arr.length - offset].url == null) { return null }
      return arr[arr.length - offset].url
    }
    return null
  };
  var url = getUrl(options);
  if ((url != null) && url.startsWith('/')) { return }
  var parentUrl = getUrl(options, 2);
  if (parentUrl == null) { return }
  if (parentUrl.endsWith('/')) {
    options[options.length - 1].url = parentUrl + url;
  } else {
    options[options.length - 1].url = parentUrl + "/" + url;
  }
}

function createExecFunc (record, fullName, axios) {
  function createContext(meta, options) {
    return {
      meta: meta,
      options: options,
      response: null,
      name: record.name,
      fullName: fullName
    }
  }
  function createRequestFunc () {
    return function (ctx, next) { return axios(ctx.options)
      .then(function (response) {
        ctx.response = response;
        next();
      }); }
  }
  if (record.options instanceof Array) {
    record.options = index$3.all(record.options);
  }
  if (record.meta instanceof Array) {
    record.meta = index$3.all(record.meta);
  }
  record.hooks.push(createRequestFunc());
  var fn = compose(record.hooks);

  return function (props) {
    var tmpOptions = index$3(record.options, parseExecArgs(record.options.url, props, record), { clone: true });
    var context = createContext(record.meta, tmpOptions);
    return fn(context).then(function () { return context; })
  }
}

var Apipie = function Apipie(records, options) {
  this.records = records;
  this.hooks = [];
  this.meta = [{}];
  this.options = [{}];
  this.axios = options.axios;
};
Apipie.prototype.globalHook = function globalHook (hook) {
  this.hooks.push(hook);
};
Apipie.prototype.create = function create () {
  return createTreeSkeleton(this.records, this)
};

export default Apipie;
//# sourceMappingURL=apipie.esm.js.map
