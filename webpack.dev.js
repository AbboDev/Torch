module.exports = {
  mode: 'development',
  devtool: 'eval-nosources-cheap-source-map',
  devServer: {
    static: './build',
    open: true
    // contentBase: './build',
  },
  output: {
    pathinfo: false,
    filename: '[name].js',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  stats: true
};
