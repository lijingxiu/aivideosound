const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  publicPath:'./',
  configureWebpack: {
    devtool: 'source-map'
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
