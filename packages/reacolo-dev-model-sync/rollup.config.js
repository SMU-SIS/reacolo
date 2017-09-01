import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/model-sync.js',
  format: 'umd',
  moduleName: 'ReacoloDevModelSync',
  amd: {
    id: 'reacolo-dev-model-sync'
  },
  plugins: [
    resolve(),
    commonjs(),
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    })
  ],
  dest: 'lib/reacolo-dev-model-sync.js',
  exports: 'default',
  external: ['babel-runtime/regenerator', 'sockjs-client', 'eventemitter3', 'jsonpatch'],
  globals: {
    'jsonpatch': 'jsonpatch',
    'sockjs-client': 'SockJS',
    eventemitter3: 'EventEmitter',
    'babel-runtime/regenerator': 'regeneratorRuntime'
  },
  sourceMap: true
};
