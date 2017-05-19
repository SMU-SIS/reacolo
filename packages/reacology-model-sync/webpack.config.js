var webpack = require('webpack');
var path = require('path');

module.exports = {
  devtool: 'source-map',
  entry: path.resolve(__dirname, 'src'),
  output: {
    path: path.join(__dirname, 'lib'),
    filename: 'reacology-model-sync.js',
    libraryTarget: 'umd',
    library: 'ReacologyModelSync'
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
    eventemitter3: {
      root: 'EventEmitter',
      amd: 'eventemitter3',
      commonjs: 'eventemitter3',
      commonjs2: 'eventemitter3'
    }
  }
};
