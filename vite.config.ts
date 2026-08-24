// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    cssMinify: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 根据 node_modules 中的包来分块
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor'
            }
            if (id.includes('antd') || id.includes('@ant-design')) {
              return 'antd'
            }
            if (id.includes('lodash')) {
              return 'lodash'
            }
            // 其他大的依赖包
            return 'vendor-others'
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      // 如果你使用 CSS 预处理器，在这里配置
      scss: {
        // scss 配置
      }
    }
  }
})