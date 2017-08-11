import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pegjs from 'rollup-plugin-pegjs';
import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/index.js',
  format: 'umd',
  amd: {
    id: 'reacolo'
  },
  moduleName: 'Reacolo',
  plugins: [resolve(), commonjs(), pegjs(), babel({
    exclude: 'node_modules/**' // only transpile our source code
  })],
  dest: 'lib/reacolo.js',
  external: ['react', 'prop-types'],
  globals: {
    'prop-types': 'PropTypes',
    react: 'React'
  },
  sourceMap: true
};
