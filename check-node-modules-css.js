// check-node-modules-css.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nodeModulesPath = path.join(__dirname, 'node_modules');

console.log('检查 node_modules 中的 CSS 文件...');

// 只检查几个主要的库
const librariesToCheck = [
  'antd',
  '@ant-design',
  'tailwindcss'
];

librariesToCheck.forEach(lib => {
  const libPath = path.join(nodeModulesPath, lib);
  if (fs.existsSync(libPath)) {
    console.log(`\n检查库: ${lib}`);
    
    // 查找 CSS 文件
    function findCSSFiles(dir) {
      let cssFiles = [];
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            cssFiles = cssFiles.concat(findCSSFiles(filePath));
          } else if (file.endsWith('.css')) {
            cssFiles.push(filePath);
          }
        });
      } catch (e) {
        // 忽略权限错误等
      }
      return cssFiles;
    }
    
    const cssFiles = findCSSFiles(libPath);
    console.log(`  找到 ${cssFiles.length} 个 CSS 文件`);
    
    // 检查前几个文件
    cssFiles.slice(0, 3).forEach(cssFile => {
      try {
        const content = fs.readFileSync(cssFile, 'utf8');
        if (content.includes('-:')) {
          console.log(`  ⚠️  发现问题的文件: ${cssFile}`);
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes('-:')) {
              console.log(`      第 ${index + 1} 行: ${line.trim().substring(0, 100)}`);
            }
          });
        }
      } catch (e) {
        // 忽略读取错误
      }
    });
  }
});