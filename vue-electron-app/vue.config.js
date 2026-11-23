const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  publicPath: './',
  productionSourceMap: false,
  configureWebpack: config => {
    if (process.env.NODE_ENV !== 'production') {
      config.devtool = 'eval-cheap-module-source-map'
    }
  },
  devServer: {
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3001',
    //     changeOrigin: true
    //   }
    // }
  },
  transpileDependencies: true
})
