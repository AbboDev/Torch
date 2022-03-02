const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env) => {
  const config = {
    entry: {
      game: './src/Game.ts'
    },
    output: {
      path: path.resolve(__dirname, 'build'),
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
        Config: path.resolve(__dirname, 'src/Config/'),
        Plugins: path.resolve(__dirname, 'src/Plugins/'),
        Entities: path.resolve(__dirname, 'src/Entities/'),
        Bullets: path.resolve(__dirname, 'src/Entities/Bullets'),
        Weapons: path.resolve(__dirname, 'src/Entities/Weapons'),
        Hitboxes: path.resolve(__dirname, 'src/Entities/Hitboxes'),
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
    ],
  };

  return merge(config, require(`./webpack.${env}.js`));
};
