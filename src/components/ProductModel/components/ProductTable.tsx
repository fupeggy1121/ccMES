// src/components/ProductTable.tsx
import React from 'react';
import { Edit, FileText, Upload, Database, Download, Copy, Trash2, Eye, History } from 'lucide-react';
import { Product, ProductStatus } from '../types/Product';
import { Dropdown, Button } from 'antd'; // 导入 Button 组件
import { EllipsisOutlined } from '@ant-design/icons';

interface ProductTableProps {
  products: Product[];
  selectedProductIds: number[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onToggleProductSelection: (productId: number) => void;
  onToggleAllProductSelection: (productIds: number[]) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  onPreviewCP: (productId: number) => void;
  onUploadCP: (productId: number) => void;
  onCreateCP: (productId: number) => void;
  onQueryData: (productId: number) => void;
  onImportConfig: (productId: number) => void;
  onCopyProduct: (productId: number) => void;
  onDeleteRow: (productId: number) => void;
  onViewSpecifications: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onSubmitForApproval: (productId: number) => void;
  onViewRevisionHistory: (productId: number) => void;
  onConfigureExperimentalDeviation: (product: Product) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  selectedProductIds,
  currentPage,
  pageSize,
  totalCount,
  onToggleProductSelection,
  onToggleAllProductSelection,
  onPageChange,
  onPageSizeChange,
  onEditProduct,
  onDeleteProduct,
  onPreviewCP,
  onUploadCP,
  onCreateCP,
  onQueryData,
  onImportConfig,
  onCopyProduct,
  onDeleteRow,
  onViewSpecifications,
  onViewProduct,
  onSubmitForApproval,
  onViewRevisionHistory,
  onConfigureExperimentalDeviation,
}) => {
  
  const totalPages = Math.ceil(totalCount / pageSize);
  const selectedSet = new Set(selectedProductIds);
  const pageProductIds = products.map(product => product.id);
  const isAllSelectedOnPage = pageProductIds.length > 0 && pageProductIds.every(id => selectedSet.has(id));

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`
            px-3 py-1 text-sm border
            ${currentPage === i 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  const formatSpecificationSummary = (product: Product) => {
    const specs = product.specifications;
    return `型号:${specs.type} 晶向:${specs.crystal} 直径:${specs.diameter} 厚度:${specs.thickness} 掺杂剂:${specs.dopant}`;
  };

  const getStatusStyle = (status: ProductStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'ARCHIVED':
        return 'bg-gray-300 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: ProductStatus) => {
    switch (status) {
      case 'DRAFT': return '草稿';
      case 'PENDING_APPROVAL': return '待审批';
      case 'ACTIVE': return '激活';
      case 'REJECTED': return '已驳回';
      case 'ARCHIVED': return '已归档';
      default: return status;
    }
  };

  const handleSubmitForApproval = (productId: number) => {
    if (window.confirm('确定要提交审批吗？')) {
      onSubmitForApproval(productId);
    }
  };

  return (
    <div className="flex flex-col h-full">

      <div className="flex-1 overflow-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-12">
                <input
                  type="checkbox"
                  checked={isAllSelectedOnPage}
                  onChange={() => onToggleAllProductSelection(pageProductIds)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                产品编号
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                产品名称
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                产品规格
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                产品版本
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                产品类型
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                审批状态
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                客户名称
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                工艺主路径
              </th>

              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-56">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product, index) => {
              const renderMenu = () => { // 修改这里
                const menuItems = [];

                if (product.status === 'DRAFT' || product.status === 'REJECTED') {
                  menuItems.push({
                    key: 'submit_approval',
                    label: '提交审批',
                    onClick: () => handleSubmitForApproval(product.id),
                  });
                }
                
                if (product.status !== 'ARCHIVED') {
                  menuItems.push({
                    key: 'import_config',
                    label: '入库判定配置',
                    onClick: () => onImportConfig(product.id),
                  });
                }
                
                if (product.status !== 'ARCHIVED') {
                  menuItems.push({
                    key: 'upload_cp',
                    label: '上传文件',
                    onClick: () => onUploadCP(product.id),
                  });
                }
                
                if (product.status !== 'ARCHIVED') {
                  menuItems.push({
                    key: 'experimental_deviation',
                    label: '实验偏离配置',
                    onClick: () => onConfigureExperimentalDeviation(product),
                  });
                }
                
                if (product.status === 'PENDING_APPROVAL' || product.status === 'ACTIVE') {
                  menuItems.push({
                    key: 'view_details',
                    label: '查看详情',
                    onClick: () => onViewProduct(product),
                  });
                }
                
                menuItems.push({
                  key: 'copy',
                  label: '复制',
                  onClick: () => onCopyProduct(product.id),
                });
                
                menuItems.push({
                  key: 'revision_history',
                  label: '查看修订历史',
                  onClick: () => onViewRevisionHistory(product.id),
                });
                
                if (product.status === 'DRAFT' || product.status === 'REJECTED') {
                  menuItems.push({
                    key: 'delete',
                    label: '删除',
                    danger: true,
                    onClick: () => onDeleteRow(product.id),
                  });
                }

                return { items: menuItems }; // 返回一个包含 'items' 属性的对象
              };

              return (
                <tr 
                  key={product.id}
                  className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(product.id)}
                      onChange={() => onToggleProductSelection(product.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{product.productCode}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{product.productName}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="w-36">
                      <div 
                        className="truncate cursor-pointer text-blue-600 hover:text-blue-800"
                        onClick={() => onViewSpecifications(product)}
                        title="点击查看完整规格"
                      >
                        {formatSpecificationSummary(product)}
                      </div>
                    </div>
                  </td>
<td className="px-4 py-3 text-sm text-gray-900">
  {(product.productCategory ? product.productCategory.charAt(0) : '') + (product.productCategoryVersion || '')}
</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{product.productType}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(product.status)}`}>
                      {getStatusText(product.status)}
                    </span>
                  </td>
                  <td className="w-24 px-4 py-3 text-sm text-gray-900">{product.customerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{product.mainProcessPath}</td>

                  <td className="px-4 py-3 w-56">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onPreviewCP(product.id)}
                        className="px-2 py-1 text-xs text-green-500 rounded"
                        title="预览CP文件"
                      >
                        预览文件
                      </button>
                      
                      {product.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => onCreateCP(product.id)}
                          className="px-2 py-1 text-xs text-orange-500 rounded"
                          title="修改参数"
                        >
                          修改参数
                        </button>
                      )}
                      
                      {(product.status === 'DRAFT' || product.status === 'REJECTED' || product.status === 'ACTIVE') && (
                        <button
                          onClick={() => onEditProduct(product)}
                          className="px-2 py-1 text-xs text-blue-600 rounded"
                          title="编辑"
                        >
                          编辑
                        </button>
                      )}
                      
                      <Dropdown menu={renderMenu()} trigger={['click']}>
                        {/* 替换原生 button 为 Ant Design Button */}
                        <Button
                          type="text" // 使用 text 类型以保持相似的视觉样式
                          icon={<EllipsisOutlined />} // 将图标作为 prop 传递
                          title="更多操作"
                          // 移除自定义 className，以避免潜在冲突
                          // className="px-2 py-1 text-xs text-gray-500 rounded"
                        />
                      </Dropdown>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">
            Total {totalCount}
          </span>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={10}>10/page</option>
              <option value={20}>20/page</option>
              <option value={50}>50/page</option>
              <option value={100}>100/page</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ‹
          </button>
          
          {renderPaginationButtons()}
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ›
          </button>

          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-gray-700">Go to</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const page = parseInt((e.target as HTMLInputElement).value);
                  if (page >= 1 && page <= totalPages) {
                    onPageChange(page);
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTable;
