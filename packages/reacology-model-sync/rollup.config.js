import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/index.js',
  format: 'umd',
  moduleName: 'ReacologyModelSync',
  amd: {
    id: 'reacology-model-sync'
  },
  plugins: [
    resolve(),
    commonjs(),
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    })
  ],
  dest: 'lib/reacology-model-sync.js',
  exports: 'named',
  external: ['eventemitter3', 'babel-runtime/regenerator'],
  globals: {
    'babel-runtime/regenerator': 'regeneratorRuntime',
    eventemitter3: 'EventEmitter'
  },
  sourceMap: true
};
