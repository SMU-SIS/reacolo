var webpack = require('webpack');
var path = require('path');

module.exports = {
  devtool: "source-map",
  entry: [ path.resolve(__dirname, 'lib/index.js') ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'reacolo.js',
    libraryTarget: 'umd',
    library: 'reacolo'
  },
  externals: {
      react: { root: 'React', amd: 'react', commonjs: 'react', commonjs2: 'react' },
      'sockjs-client': {
        root: 'SockJS',
        amd: 'sockjs-client',
        commonjs: 'sockjs-client',
        commonjs2: 'sockjs-client'
      }
  },
  module: {
    loaders:[
      {
        test: /\.js[x]?$/,
        include: path.resolve(__dirname, 'lib'),
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
  }
};
