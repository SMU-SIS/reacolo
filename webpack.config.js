var webpack = require('webpack');
var path = require('path');

const base = {
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js[x]?$/,
        include: path.resolve(__dirname, 'lib'),
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.pegjs$/,
        include: path.resolve(__dirname, 'lib'),
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
    entry: path.resolve(__dirname, 'lib/reacolo'),
    output: {
      path: path.join(__dirname, 'dist'),
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

  // reacolo-dirty-model-sync
  Object.assign({}, base, {
    entry: path.resolve(__dirname, 'lib/reacolo-model-sync-cjs-export'),
    output: {
      path: path.join(__dirname, 'dist'),
      filename: 'reacolo-model-sync.js',
      libraryTarget: 'umd',
      library: 'ReacoloModelSync'
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
