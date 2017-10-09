import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    format: 'umd',
    file: 'lib/reacology-model.js',
    exports: 'named',
  },
  name: 'ReacologyModel',
  amd: {
    id: 'reacology-model',
  },
  plugins: [
    resolve(),
    commonjs(),
    babel({
      exclude: 'node_modules/**', // only transpile our source code
    }),
  ],
  external: ['eventemitter3', 'babel-runtime/regenerator'],
  globals: {
    'babel-runtime/regenerator': 'regeneratorRuntime',
    eventemitter3: 'EventEmitter',
  },
  sourcemap: true,
};
