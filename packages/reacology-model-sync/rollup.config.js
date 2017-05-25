import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/index.js',
  format: 'umd',
  moduleId: 'reacology-model-sync',
  moduleName: 'ReacologyModelSync',
  plugins: [resolve(), commonjs(), babel({
    exclude: 'node_modules/**' // only transpile our source code
  })],
  dest: 'lib/reacology-model-sync.js',
  exports: 'named',
  external: ['eventemitter3'],
  globals: {
    eventemitter3: 'EventEmitter'
  },
  sourceMap: true
};
