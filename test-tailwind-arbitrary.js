// test-tailwind-arbitrary.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建一个测试文件来验证 Tailwind 处理
const testContent = `
// 测试各种可能的 Tailwind 类名模式
const TestComponent = () => {
  return (
    <div>
      {/* 正常的任意值 */}
      <div className="w-[200px] h-[100px] bg-[#ff0000]"></div>
      <div className="max-h-[90vh] min-w-[200px]"></div>
      
      {/* 可能产生问题的模式 */}
      <div className="test-class"></div>
      <div className={\`dynamic-\${variable}\`}></div>
      
      {/* 复杂的模板字符串 */}
      <div className={\`bg-white p-4 \${isActive ? 'text-blue-500' : 'text-gray-500'}\`}></div>
    </div>
  );
};

export default TestComponent;
`;

const testFilePath = path.join(__dirname, 'src', 'components', 'TestTailwind.jsx');
fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
fs.writeFileSync(testFilePath, testContent);

console.log('✅ 创建了测试文件: src/components/TestTailwind.jsx');
console.log('现在运行构建来测试 Tailwind 处理...');