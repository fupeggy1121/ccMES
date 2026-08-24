import React from 'react';
import { Product } from '../types/Product';

interface ProductBasicInfoFormProps {
  formData: Partial<Product>;
  onFieldChange: (field: keyof Product, value: string) => void;
  isReadOnly: boolean;
  isEditingExistingProduct: boolean;
  productCategories: string[]; // 新增：产品大类选项
  productCategoryVersions: string[]; // 新增：产品大类版本选项
  productTypes: string[]; // 新增：产品类型选项
}

const ProductBasicInfoForm: React.FC<ProductBasicInfoFormProps> = ({
  formData,
  onFieldChange,
  isReadOnly,
  isEditingExistingProduct,
  productCategories, // 解构
  productCategoryVersions, // 解构
  productTypes // 解构
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">基本信息</h3>
      <div className="grid grid-cols-3 gap-6">
        {/* 产品编号 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            产品编号 *
          </label>
          <input
            type="text"
            required
            value={formData.productCode || ''}
            onChange={(e) => onFieldChange('productCode', e.target.value)}
            disabled={isReadOnly || isEditingExistingProduct}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        {/* 产品名称 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            产品名称 *
          </label>
          <input
            type="text"
            required
            value={formData.productName || ''}
            onChange={(e) => onFieldChange('productName', e.target.value)}
            disabled={isReadOnly || isEditingExistingProduct}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        {/* 客户名称 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            客户名称 *
          </label>
          <input
            type="text"
            required
            value={formData.customerName || ''}
            onChange={(e) => onFieldChange('customerName', e.target.value)}
            disabled={isReadOnly}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        {/* 产品大类 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            产品大类
          </label>
          <div className="flex gap-2">
            <select
              value={formData.productCategory || ''}
              onChange={(e) => onFieldChange('productCategory', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              disabled={isReadOnly}
            >
              <option value="">请选择</option>
              {productCategories.map(category => ( // 使用 productCategories
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="版本号"
              value={formData.productCategoryVersion || ''}
              onChange={(e) => onFieldChange('productCategoryVersion', e.target.value)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* 产品类型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            产品类型
          </label>
          <select
            value={formData.productType || ''}
            onChange={(e) => onFieldChange('productType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            disabled={isReadOnly}
          >
            <option value="">请选择</option>
            {productTypes.map(type => ( // 使用 productTypes
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            描述
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => onFieldChange('description', e.target.value)}
            placeholder="请输入产品描述"
            rows={1}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            disabled={isReadOnly}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductBasicInfoForm;