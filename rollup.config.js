import buble from 'rollup-plugin-buble';
import cjs from'rollup-plugin-commonjs';
import node from 'rollup-plugin-node-resolve';

let pkg = require('./package.json');
let external = Object.keys(pkg.dependencies);

export default {
  entry: 'lib/index.js',
  plugins: [
    node({
      jsnext: true,
      main: true,
      browser: true,
    }),
    cjs(),
    buble()
  ],
  external: external,
  globals: {
    'path-to-regexp': 'pathToRegexp',
    deepmerge: 'merge'
  },
  targets: [
    {
      dest: pkg.main,
      format: 'iife',
      moduleName: 'VueApify',
      sourceMap: true
    },
    {
      dest: pkg.module,
      format: 'es',
      sourceMap: true
    }
  ]
};
