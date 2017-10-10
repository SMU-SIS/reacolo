/* eslint import/no-extraneous-dependencies: ["error", { "devDependencies": true }] */
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: {
    app: ['babel-polyfill', './app'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: './[name].js',
  },
  devtool: 'source-map',
  context: path.resolve(__dirname, 'src'),
  resolve: {
    alias: {
      'reacolo-dev-model': '@quentinroy-private/reacolo-dev-model',
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre',
      },
      {
        test: /\.s?css$/,
        use: ExtractTextPlugin.extract({
          use: [
            {
              loader: 'css-loader',
              options: { sourceMap: true }
            },
            {
              loader: 'sass-loader',
              options: { sourceMap: true } // compiles Sass to CSS
            }
          ]
        })
      },
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),
        use: ['babel-loader']
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'url-loader'
          }
        ]
      }
    ]
  },

  plugins: [
    new ExtractTextPlugin({
      filename: '[name].css',
      disable: false,
      allChunks: true
    }),
    new CopyWebpackPlugin([{ from: '**/*.html', to: './' }]),
    new webpack.optimize.ModuleConcatenationPlugin(),
    // new UglifyJsPlugin({ sourceMap: true, parallel: true }),
    new webpack.optimize.OccurrenceOrderPlugin()
  ]
};
