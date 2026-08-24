export default {
  plugins: {
    tailwindcss: {}, // 确保存在 - Tailwind CSS插件
    autoprefixer: {}, // 确保存在 - Autoprefixer插件
    // 可以添加 cssnano 但禁用某些优化
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
          normalizeWhitespace: false // 禁用空格标准化
        }]
      }
    } : {})
  }
}