var webpack = require('webpack');
var path = require('path');

const base = {
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js[x]?$/,
        include: path.resolve(__dirname, 'src'),
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.pegjs$/,
        include: path.resolve(__dirname, 'src'),
        exclude: /node_modules/,
        loader: ['babel-loader', 'pegjs-loader']
      },
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  }
};

module.exports = [
  // reacolo
  Object.assign({}, base, {
    entry: path.resolve(__dirname, 'src/reacolo'),
    output: {
      path: path.join(__dirname, 'lib'),
      filename: 'reacolo.js',
      libraryTarget: 'umd',
      library: 'reacolo'
    },
    externals: {
      react: {
        root: 'React',
        amd: 'react',
        commonjs: 'react',
        commonjs2: 'react'
      }
    }
  }),

  // reacolo-dev-model-sync
  Object.assign({}, base, {
    entry: path.resolve(__dirname, 'src/reacolo-dev-model-sync/cjs-export'),
    output: {
      path: path.join(__dirname, 'lib'),
      filename: 'reacolo-dev-model-sync.js',
      libraryTarget: 'umd',
      library: 'ReacoloDevModelSync'
    },
    externals: {
      'sockjs-client': {
        root: 'SockJS',
        amd: 'sockjs-client',
        commonjs: 'sockjs-client',
        commonjs2: 'sockjs-client'
      },
      eventemitter3: {
        root: 'EventEmitter',
        amd: 'eventemitter3',
        commonjs: 'eventemitter3',
        commonjs2: 'eventemitter3'
      }
    }
  })
];
