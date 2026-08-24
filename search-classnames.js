// search-classnames.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

function searchFiles(dir, pattern) {
  let results = [];
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(searchFiles(filePath, pattern));
    } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          results.push({
            file: filePath,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    }
  });
  
  return results;
}

console.log('搜索包含特殊字符的类名...');
const specialCharResults = searchFiles(srcDir, /className.*\[.*:.*T/);
if (specialCharResults.length > 0) {
  console.log('找到可能的问题类名:');
  specialCharResults.forEach(result => {
    console.log(`文件: ${result.file}:${result.line}`);
    console.log(`内容: ${result.content}`);
    console.log('---');
  });
} else {
  console.log('未找到包含特殊字符的类名');
}

console.log('\n搜索动态类名...');
const dynamicClassResults = searchFiles(srcDir, /className.*\[/);
if (dynamicClassResults.length > 0) {
  console.log('找到动态类名:');
  dynamicClassResults.forEach(result => {
    console.log(`文件: ${result.file}:${result.line}`);
    console.log(`内容: ${result.content}`);
    console.log('---');
  });
} else {
  console.log('未找到动态类名');
}