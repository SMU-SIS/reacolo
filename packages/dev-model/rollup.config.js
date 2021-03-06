import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    file: 'lib/reacolo-dev-model.js',
    format: 'umd',
  },
  name: 'ReacoloDevModel',
  amd: {
    id: 'reacolo-dev-model',
  },
  plugins: [resolve(), commonjs(), babel()],
  external: ['sockjs-client', 'eventemitter3', 'jsonpatch'],
  globals: {
    jsonpatch: 'jsonpatch',
    'sockjs-client': 'SockJS',
    eventemitter3: 'EventEmitter',
  },
  sourcemap: true,
};
