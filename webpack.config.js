/* eslint-disable global-require */
/* eslint-disable import/no-extraneous-dependencies */
const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env) => {
  const config = {
    entry: {
      game: path.resolve(__dirname, 'src/Game.ts')
    },
    output: {
      path: path.resolve(__dirname, 'build')
    },
    module: {
      rules: [
        {
          test: /\.ts?$/,
          use: 'ts-loader'
        },
        {
          test: [/\.vert$/, /\.frag$/],
          use: 'raw-loader'
        }
      ]
    },
    optimization: {
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
      extensions: ['.ts', '.js'],
      alias: {
        Config: path.resolve(__dirname, 'src/Config/'),
        Plugins: path.resolve(__dirname, 'src/Plugins/'),
        Entities: path.resolve(__dirname, 'src/Entities/'),
        Miscellaneous: path.resolve(__dirname, 'src/Miscellaneous/'),
        HUD: path.resolve(__dirname, 'src/HUD/'),
        Scenes: path.resolve(__dirname, 'src/Scenes/')
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        'typeof SHADER_REQUIRE': JSON.stringify(false),
        'typeof CANVAS_RENDERER': JSON.stringify(true),
        'typeof WEBGL_RENDERER': JSON.stringify(true)
      }),
      new CopyWebpackPlugin({
        patterns: [
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
        ]
      }),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'index.html'
      })
    ]
  };

  const currentEnv = env && env.production ? 'prod' : 'dev';
  const file = `./webpack.${currentEnv}.js`;

  // eslint-disable-next-line import/no-dynamic-require
  return merge(config, require(file));
};
