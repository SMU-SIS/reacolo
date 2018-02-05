import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pegjs from 'rollup-plugin-pegjs';
import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    file: 'lib/reacolo-react.js',
    format: 'umd',
    name: 'ReacoloReact',
    sourcemap: true,
    globals: {
      '@reacolo/match': 'ReacoloMatch',
      'prop-types': 'PropTypes',
      react: 'React',
    },
  },
  amd: {
    id: 'reacolo-react',
  },
  plugins: [
    resolve(),
    commonjs(),
    pegjs(),
    babel({
      exclude: 'node_modules/**', // only transpile our source code
    }),
  ],
  external: ['react', 'prop-types', '@reacolo/match'],
};
