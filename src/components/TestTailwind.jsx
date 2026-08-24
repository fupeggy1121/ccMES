
// 测试各种可能的 Tailwind 类名模式
const TestComponent = () => {
  return (
    <div>
      {/* 正常的任意值 */}
      <div className="w-[200px] h-[100px] bg-[#ff0000]"></div>
      <div className="max-h-[90vh] min-w-[200px]"></div>
      
      {/* 可能产生问题的模式 */}
      <div className="test-class"></div>
      <div className={`dynamic-${variable}`}></div>
      
      {/* 复杂的模板字符串 */}
      <div className={`bg-white p-4 ${isActive ? 'text-blue-500' : 'text-gray-500'}`}></div>
    </div>
  );
};

export default TestComponent;
