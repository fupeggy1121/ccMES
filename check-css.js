// check-css.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 在 ES 模块中获取 __dirname 的等价物
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');
const assetsDir = path.join(distDir, 'assets');

// 检查 assets 目录是否存在
if (!fs.existsSync(assetsDir)) {
  console.log('dist/assets 目录不存在，请先运行构建命令');
  process.exit(1);
}

// 读取所有 CSS 文件
try {
  const files = fs.readdirSync(assetsDir);
  let foundIssues = false;
  
  files.forEach(file => {
    if (file.endsWith('.css')) {
      const filePath = path.join(assetsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      console.log(`检查文件: ${file}`);
      lines.forEach((line, index) => {
        if (line.includes('-:')) {
          foundIssues = true;
          console.log(`第 ${index + 1} 行发现错误: ${line.trim()}`);
          // 显示上下文
          const start = Math.max(0, index - 2);
          const end = Math.min(lines.length - 1, index + 2);
          for (let i = start; i <= end; i++) {
            console.log(`${i + 1}: ${lines[i]}`);
          }
          console.log('---');
        }
      });
    }
  });
  
  if (!foundIssues) {
    console.log('未发现 CSS 语法错误');
  }
} catch (error) {
  console.error('检查 CSS 文件时出错:', error);
}