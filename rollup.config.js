const buble = require('rollup-plugin-buble');
const cjs= require('rollup-plugin-commonjs');
import resolve from 'rollup-plugin-node-resolve';

let pkg = require('./package.json');
let external = Object.keys(pkg.dependencies);

export default {
  entry: 'lib/index.js',
  plugins: [
    buble(),
    cjs(),
    resolve()
  ],
  //external: external,
  // globals: {
  //   'path-to-regexp': 'pathToRegexp',
  //   deepmerge: 'merge'
  // },
  targets: [
    {
      dest: pkg.main,
      format: 'iife',
      moduleName: 'apipie',
      sourceMap: true
    },
    {
      dest: pkg.module,
      format: 'es',
      sourceMap: true
    }
  ]
};
