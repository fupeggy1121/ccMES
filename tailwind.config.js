/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    './modules/mes/**/*.{js,ts,jsx,tsx}', // 添加此行 - MES组件路径
  ],
  theme: {
    extend: {
      // 确保没有自定义的无效配置
    },
  },
  plugins: [],
  // 更严格的安全列表配置
  safelist: [],
  // 禁用可能产生问题的功能
  corePlugins: {
    // 可以尝试禁用某些核心插件来排查问题
    // float: false,
    // clear: false,
  },
  // 实验性功能可能不稳定，确保禁用
  experimental: {
    optimizeUniversalDefaults: false
  }
}