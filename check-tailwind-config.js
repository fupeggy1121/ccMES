// check-tailwind-config.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tailwindConfigPath = path.join(__dirname, 'tailwind.config.js');

if (fs.existsSync(tailwindConfigPath)) {
  console.log('检查 Tailwind 配置文件...');
  const config = fs.readFileSync(tailwindConfigPath, 'utf8');
  console.log(config);
} else {
  console.log('未找到 tailwind.config.js 文件');
}

// 检查 package.json 中的依赖
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log('\n相关依赖版本:');
  console.log('Tailwind CSS:', packageJson.dependencies?.['tailwindcss'] || packageJson.devDependencies?.['tailwindcss'] || '未找到');
  console.log('PostCSS:', packageJson.dependencies?.['postcss'] || packageJson.devDependencies?.['postcss'] || '未找到');
  console.log('Autoprefixer:', packageJson.dependencies?.['autoprefixer'] || packageJson.devDependencies?.['autoprefixer'] || '未找到');
}