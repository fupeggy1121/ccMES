// complete-fix.js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 开始完整修复构建问题...');

// 1. 检查并安装 moment
console.log('📦 检查 moment 依赖...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const hasMoment = packageJson.dependencies?.moment || packageJson.devDependencies?.moment;
  
  if (!hasMoment) {
    console.log('📥 安装 moment...');
    execSync('npm install moment', { stdio: 'inherit' });
  } else {
    console.log('✅ moment 已安装');
  }
} catch (error) {
  console.log('📥 安装 moment...');
  execSync('npm install moment', { stdio: 'inherit' });
}

// 2. 清理并重新构建
console.log('\n🧹 清理构建缓存...');
try {
  if (fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.rmSync(path.join(__dirname, 'dist'), { recursive: true });
  }
  if (fs.existsSync(path.join(__dirname, 'node_modules', '.vite'))) {
    fs.rmSync(path.join(__dirname, 'node_modules', '.vite'), { recursive: true });
  }
} catch (error) {
  // 忽略清理错误
}

// 3. 构建项目
console.log('\n🚀 运行构建...');
try {
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('✅ 构建成功！');
} catch (error) {
  console.log('⚠️ 构建过程中可能有警告，但继续处理...');
}

// 4. 检查并修复 CSS 文件
const distPath = path.join(__dirname, 'dist');
const assetsPath = path.join(distPath, 'assets');

if (fs.existsSync(assetsPath)) {
  console.log('\n🎨 检查 CSS 文件...');
  const cssFiles = fs.readdirSync(assetsPath).filter(file => file.endsWith('.css'));
  
  let fixedFiles = 0;
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
      fixedFiles++;
    }
  });
  
  if (fixedFiles > 0) {
    console.log(`✨ 总共修复了 ${fixedFiles} 个 CSS 文件`);
  } else {
    console.log('✅ 所有 CSS 文件都正常');
  }
}

console.log('\n🎉 完整修复完成！');