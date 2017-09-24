import babel from 'rollup-plugin-babel'
import cjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'

let pkg = require('./package.json')

export default {
  entry: 'lib/index.js',
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    cjs(),
    resolve({
      preferBuiltins: false
    })
  ],
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
}
