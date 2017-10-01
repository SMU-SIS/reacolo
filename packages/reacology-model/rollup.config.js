import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/index.js',
  format: 'umd',
  moduleName: 'ReacologyModel',
  amd: {
    id: 'reacology-model'
  },
  plugins: [
    resolve(),
    commonjs(),
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    })
  ],
  dest: 'lib/reacology-model.js',
  exports: 'named',
  external: ['eventemitter3', 'babel-runtime/regenerator'],
  globals: {
    'babel-runtime/regenerator': 'regeneratorRuntime',
    eventemitter3: 'EventEmitter'
  },
  sourceMap: true
};
