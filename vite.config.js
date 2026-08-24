// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1500,
    cssMinify: false, // 暂时禁用 CSS 压缩
    rollupOptions: {
      output: {
        manualChunks: {
          'antd-vendor': ['antd', '@ant-design/icons'],
          'react-vendor': ['react', 'react-dom'],
          'utils-vendor': ['lodash', 'moment', 'dayjs'] // 确保 moment 在这里
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
      less: {
        modifyVars: {
          // 自定义 antd 主题配置（可选）
        },
        javascriptEnabled: true,
      }
    }
  },
  // 忽略模块级别指令的警告
  esbuild: {
    supported: {
      'top-level-await': true
    }
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd', '@ant-design/icons', 'moment'],
    exclude: [] // 确保没有排除必要的依赖
  },
  // 添加 resolve 配置
  resolve: {
    alias: {
      // 如果 moment 有问题，可以添加别名
    }
  }
})