module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    contentBase: './build'
  },
  output: {
    pathinfo: false,
    filename: '[name].js',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  stats: true,
};
