module.exports = {
  mode: 'production',
  output: {
    publicPath: './',
    filename: '[name].min.js'
  },
  optimization: {
    minimize: true
  },
  stats: false
};
