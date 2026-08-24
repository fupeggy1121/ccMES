// search-specific-class.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

function searchForProblematicClass(dir) {
  let results = [];
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(searchForProblematicClass(filePath));
    } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 搜索可能生成 [-:T.] 类名的模式
      const patterns = [
        /className=.*-:.*T/,  // 包含 -: T 的类名
        /className=.*\[.*-.*:.*T/,  // 包含 [-:T] 模式的动态类名
        /class.*-:.*T/,  // 简写的 class 属性
        /tw`.*-:.*T/,  // Tailwind 模板字符串
        /cn\(.*-:.*T/,  // clsx 或 cn 函数调用
      ];
      
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        patterns.forEach(pattern => {
          if (pattern.test(line)) {
            results.push({
              file: filePath,
              line: index + 1,
              content: line.trim(),
              pattern: pattern.toString()
            });
          }
        });
      });
    }
  });
  
  return results;
}

console.log('搜索可能生成 [-:T.] 类名的代码...');
const results = searchForProblematicClass(srcDir);

if (results.length > 0) {
  console.log('找到可能的问题代码:');
  results.forEach(result => {
    console.log(`文件: ${result.file}:${result.line}`);
    console.log(`模式: ${result.pattern}`);
    console.log(`内容: ${result.content}`);
    console.log('---');
  });
} else {
  console.log('未找到直接的问题代码');
  console.log('问题可能来自 Tailwind CSS 的自动生成或第三方库');
}