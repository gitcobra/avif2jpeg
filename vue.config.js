module.exports = {
  productionSourceMap: false,
  publicPath: './',
  chainWebpack: config => {
    config.plugin('html').tap(options => {
      options[0].title = 'AVIF to JPEG "Offline" Batch Converter';
      options[0].minify = {
        removeComments: true,
        collapseWhitespace: false,
        removeAttributeQuotes: false,
        collapseBooleanAttributes: false,
        removeScriptTypeAttributes: false
      };
      return options;
    })
  }
};