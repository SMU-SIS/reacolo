import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pegjs from 'rollup-plugin-pegjs';
import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    file: 'lib/reacolo.js',
    format: 'umd'
  },
  amd: {
    id: 'reacolo'
  },
  name: 'Reacolo',
  plugins: [
    resolve(),
    commonjs(),
    pegjs(),
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    })
  ],
  external: ['react', 'prop-types'],
  globals: {
    'prop-types': 'PropTypes',
    react: 'React'
  },
  sourcemap: true
};
