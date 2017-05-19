var webpack = require('webpack');
var path = require('path');

module.exports = {
  devtool: 'source-map',
  entry: path.resolve(__dirname, 'src/cjs-export'),
  output: {
    path: path.join(__dirname, 'lib'),
    filename: 'reacolo-dev-model-sync.js',
    libraryTarget: 'umd',
    library: 'ReacoloDevModelSync'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
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
};
