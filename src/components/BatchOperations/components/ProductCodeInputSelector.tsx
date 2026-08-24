// src/components/ProductCodeInputSelector.tsx
import React, { useState } from 'react';
import ProductSelectionModal from './ProductSelectionModal'; // 导入产品选择模态框
import { ProductData } from '../types'; // 导入 ProductData 接口

interface ProductCodeInputSelectorProps {
  value: string; // 当前选中的产品编码
  onSelect: (product: ProductData) => void; // 选择产品后的回调 
  allProducts: ProductData[]; // 传递给 ProductSelectionModal 的所有产品列表
  placeholder?: string; // 输入框的占位符
  readOnly?: boolean; // 新增：只读属性
  disabled?: boolean; // 新增：禁用属性
}

const ProductCodeInputSelector: React.FC<ProductCodeInputSelectorProps> = ({
  value,
  onSelect,
  allProducts,
  placeholder = '请选择产品料号',
  readOnly = false,
  disabled = false,
}) => {
  const [isProductSelectionModalOpen, setIsProductSelectionModalOpen] = useState(false);

  const handleOpenModal = () => {
    // 如果组件是只读或禁用状态，阻止打开模态框
    if (readOnly || disabled) {
      return;
    }
    setIsProductSelectionModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsProductSelectionModalOpen(false);
  };

  const handleProductSelected = (product: ProductData) => {
    onSelect(product);
    handleCloseModal();
  };

  return (
    <>
      <div className="flex">
        <input
          type="text"
          value={value}
          readOnly={readOnly}
          disabled={disabled}
          // 保持输入框的 py-1 px-2 样式
          className="flex-grow block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-2 border"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={handleOpenModal}
          disabled={readOnly || disabled}
          // 将 py-2 改为 py-1，并添加 whitespace-nowrap
          className={`ml-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap ${
            readOnly || disabled
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          选择
        </button>
      </div>

      <ProductSelectionModal
        isOpen={isProductSelectionModalOpen}
        onClose={handleCloseModal}
        onSelectProduct={handleProductSelected}
        products={allProducts}
      />
    </>
  );
};

export default ProductCodeInputSelector;