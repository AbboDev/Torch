const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    game: './src/Game.ts'
  },
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'build'),
    publicPath: './',
    filename: '[name].min.js'
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader'
      },
      {
        test: [ /\.vert$/, /\.frag$/ ],
        use: 'raw-loader'
      }
    ]
  },
  optimization: {
    minimize: true,
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
    alias: {
      Config: path.resolve(__dirname, 'src/config/'),
      Entities: path.resolve(__dirname, 'src/entities/'),
      Bullets: path.resolve(__dirname, 'src/entities/bullets'),
      Weapons: path.resolve(__dirname, 'src/entities/weapons'),
      Miscellaneous: path.resolve(__dirname, 'src/miscellaneous/'),
      Scenes: path.resolve(__dirname, 'src/scenes/')
    }
  },
  stats: false,
  plugins: [
    new webpack.DefinePlugin({
      'typeof SHADER_REQUIRE': JSON.stringify(false),
      'typeof CANVAS_RENDERER': JSON.stringify(true),
      'typeof WEBGL_RENDERER': JSON.stringify(true)
    }),
    new CopyWebpackPlugin([
      {
        from: './assets',
        to: './assets',
        force: true
      },
      {
        from: './app.css',
        to: './app.css',
        force: true
      }
    ]),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html'
    })
  ]
};
