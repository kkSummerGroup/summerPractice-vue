module.exports = {
  transpileDependencies: true,
  lintOnSave: false,
  devServer: {
    port: 8012,  // 设置开发服务器的端口为 8012
    open: true,  // 启动时自动打开浏览器
    proxy: {
      '/api': {
        target: 'http://39.106.228.188:8031',  // 设置 API 请求的代理地址
        changeOrigin: true,  // 修改源头
        pathRewrite: {
          '^/api': ''  // 重写路径，去掉 /api
        }
      }
    }
  }
}
