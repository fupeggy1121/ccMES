// build-analysis.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== 构建分析 ===');

// 检查 dist 目录是否存在
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.log('❌ dist 目录不存在，请先运行: npx vite build');
  process.exit(1);
}

// 列出所有文件
console.log('\n📁 dist 目录内容:');
const distFiles = fs.readdirSync(distPath);
distFiles.forEach(file => {
  const filePath = path.join(distPath, file);
  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    console.log(`   📂 ${file}/`);
    const subFiles = fs.readdirSync(filePath);
    subFiles.forEach(subFile => {
      const subFilePath = path.join(filePath, subFile);
      const subStat = fs.statSync(subFilePath);
      console.log(`      📄 ${subFile} (${(subStat.size / 1024).toFixed(2)} KB)`);
    });
  } else {
    console.log(`   📄 ${file} (${(stat.size / 1024).toFixed(2)} KB)`);
  }
});

// 检查 CSS 文件
const assetsPath = path.join(distPath, 'assets');
if (fs.existsSync(assetsPath)) {
  console.log('\n🎨 CSS 文件分析:');
  const cssFiles = fs.readdirSync(assetsPath).filter(file => file.endsWith('.css'));
  cssFiles.forEach(cssFile => {
    const cssPath = path.join(assetsPath, cssFile);
    const content = fs.readFileSync(cssPath, 'utf8');
    const lines = content.split('\n');
    
    console.log(`\n🔍 检查文件: ${cssFile}`);
    console.log(`   大小: ${(fs.statSync(cssPath).size / 1024).toFixed(2)} KB`);
    console.log(`   行数: ${lines.length}`);
    
    // 查找有问题的行
    let problemLines = [];
    lines.forEach((line, index) => {
      if (line.includes('-:')) {
        problemLines.push({
          line: index + 1,
          content: line.trim()
        });
      }
    });
    
    if (problemLines.length > 0) {
      console.log(`   ⚠️  发现 ${problemLines.length} 个有问题的 CSS 规则:`);
      problemLines.forEach(problem => {
        console.log(`      第 ${problem.line} 行: ${problem.content.substring(0, 50)}...`);
      });
    } else {
      console.log('   ✅ 未发现明显的 CSS 语法错误');
    }
  });
}

console.log('\n=== 分析完成 ===');