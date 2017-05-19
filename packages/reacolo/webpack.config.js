var webpack = require('webpack');
var path = require('path');

module.exports = {
  devtool: 'source-map',
  entry: path.resolve(__dirname, 'src'),
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
  },
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
