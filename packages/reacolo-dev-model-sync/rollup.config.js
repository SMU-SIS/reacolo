import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/model-sync.js',
  format: 'umd',
  moduleId: 'reacolo-dev-model-sync',
  moduleName: 'ReacoloDevModelSync',
  plugins: [resolve(), commonjs(), babel({
    exclude: 'node_modules/**' // only transpile our source code
  })],
  dest: 'lib/reacolo-dev-model-sync.js',
  exports: 'default',
  external: ['sockjs-client', 'eventemitter3'],
  globals: {
    'sockjs-client': 'SockJS',
    eventemitter3: 'EventEmitter'
  },
  sourceMap: true
};
