import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pegjs from 'rollup-plugin-pegjs';
import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    file: 'lib/reacolo-match.js',
    format: 'umd',
    name: 'ReacoloMatch',
    sourcemap: true,
  },
  amd: {
    id: 'reacolo-match',
  },
  plugins: [
    resolve(),
    commonjs(),
    pegjs(),
    babel({
      exclude: 'node_modules/**', // only transpile our source code
    }),
  ],
};
