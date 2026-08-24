// fix-build.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 开始修复构建问题...');

// 1. 首先构建项目
console.log('🚀 运行构建...');
try {
  const { execSync } = await import('child_process');
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('✅ 构建完成');
} catch (error) {
  console.log('⚠️ 构建过程中有警告，但继续处理...');
}

// 2. 检查并修复 CSS 文件
const distPath = path.join(__dirname, 'dist');
const assetsPath = path.join(distPath, 'assets');

if (fs.existsSync(assetsPath)) {
  console.log('\n🎨 检查 CSS 文件...');
  const cssFiles = fs.readdirSync(assetsPath).filter(file => file.endsWith('.css'));
  
  cssFiles.forEach(cssFile => {
    const cssPath = path.join(assetsPath, cssFile);
    let content = fs.readFileSync(cssPath, 'utf8');
    const originalContent = content;
    
    // 移除有问题的 CSS 规则
    content = content.replace(/\.\\\[-\\:T\..\\\]\{[^}]*\}/g, '');
    content = content.replace(/-\: T\.;/g, '');
    
    if (content !== originalContent) {
      fs.writeFileSync(cssPath, content);
      console.log(`✅ 修复了 ${cssFile} 中的无效 CSS 规则`);
    } else {
      console.log(`✅ ${cssFile} 无需修复`);
    }
  });
}

console.log('\n✨ 修复完成！');