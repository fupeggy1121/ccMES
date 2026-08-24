// src/components/ProductSelectionModal.tsx
import React, { useState, useEffect } from 'react';
import { ProductData } from '../types'; 


interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: ProductData) => void;
  products: ProductData[];
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  products,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredProducts, setFilteredProducts] = useState<ProductData[]>(products);

  // 当模态框打开时重置选择和搜索
  useEffect(() => {
    if (isOpen) {
      setSelectedProduct(null);
      setSearchTerm('');
      setFilteredProducts(products);
    }
  }, [isOpen, products]);

  // 根据搜索词过滤产品列表
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const results = products.filter(product =>
      product.productCode.toLowerCase().includes(lowerCaseSearchTerm) ||
      product.productName.toLowerCase().includes(lowerCaseSearchTerm) ||
      product.processPathName.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  const handleConfirm = () => {
    if (selectedProduct) {
      onSelectProduct(selectedProduct);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* 模态框内容 */}
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b flex-shrink-0">
          <h2 className="text-xl font-bold">选择产品料号</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex-shrink-0">
          <input
            type="text"
            placeholder="搜索产品编码、名称或工艺路径..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-grow overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">选择</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品编码</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品版本</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品规格参数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工艺路径名称</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedProduct?.id === product.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="radio"
                        name="product-select"
                        checked={selectedProduct?.id === product.id}
                        onChange={() => setSelectedProduct(product)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.productCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.productVersion}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.productType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.specParams}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.processPathName}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    没有符合条件的产品数据可供选择
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end p-5 border-t flex-shrink-0">
          <button
            onClick={onClose}
            className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedProduct}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
              selectedProduct
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSelectionModal;
