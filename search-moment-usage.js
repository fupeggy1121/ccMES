// search-moment-usage.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

function searchMomentUsage(dir) {
  let results = [];
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(searchMomentUsage(filePath));
    } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 搜索 moment 的使用
      if (content.includes('moment') || content.includes("from 'moment") || content.includes('from "moment')) {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('moment')) {
            results.push({
              file: filePath,
              line: index + 1,
              content: line.trim()
            });
          }
        });
      }
    }
  });
  
  return results;
}

console.log('搜索 moment 使用情况...');
const results = searchMomentUsage(srcDir);

if (results.length > 0) {
  console.log('找到 moment 使用:');
  results.forEach(result => {
    console.log(`文件: ${result.file}:${result.line}`);
    console.log(`内容: ${result.content}`);
    console.log('---');
  });
} else {
  console.log('未找到 moment 使用');
}