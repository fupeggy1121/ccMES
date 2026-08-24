// src/components/ProductionPlan/MaterialSelectionModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, CheckSquare, Square, CheckCircle, Package, ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon, Eye } from 'lucide-react';
import { LineSideRawMaterialBox, MaterialCategoryNode } from './MaterialFeedingForm';
import { IncomingMaterialParamsModal } from './IncomingMaterialParamsModal';

interface MaterialSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
  availableMaterials: LineSideRawMaterialBox[]; // All materials
  initialSelectedIds: string[];
  hierarchicalCategories: MaterialCategoryNode[]; // New prop for the tree structure
}

export const MaterialSelectionModal: React.FC<MaterialSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  availableMaterials,
  initialSelectedIds, // This is the prop from the parent
  hierarchicalCategories,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  // 修复：添加 selectedFilterKey 的声明
  const [selectedFilterKey, setSelectedFilterKey] = useState<string | null>(null);
  const [currentSelectedIds, setCurrentSelectedIds] = useState<string[]>(initialSelectedIds);
  const [showIncomingParams, setShowIncomingParams] = useState(false);

  // State for expanded nodes in the tree
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Effect to reset state when modal opens
  useEffect(() => {
    // 当模态框打开时 (isOpen 变为 true)，才重新初始化内部状态。
    // 这样可以避免在模态框打开期间，父组件的重新渲染导致的选择重置。
    if (isOpen) {
      setCurrentSelectedIds(initialSelectedIds);
      setCurrentPage(1);
      // 默认展开第一个顶级节点（如果存在）
      if (hierarchicalCategories.length > 0) {
        setExpandedNodes(prev => ({ ...prev, [hierarchicalCategories[0].id]: true }));
      }
      // 确保 selectedFilterKey 在模态框打开时被重置或初始化
      setSelectedFilterKey(null); // 或者根据需要设置为默认值
    }
  }, [isOpen]); // 仅依赖 isOpen，不依赖 initialSelectedIds

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilterKey]);


  const filteredMaterials = useMemo(() => {
    let filtered = availableMaterials;

    // 1. Filter by selected category (leaf node's filterKey)
    if (selectedFilterKey) {
      filtered = filtered.filter(material => material.smallCategoryFilterKey === selectedFilterKey);
    }

    // 2. Filter by search term
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(material =>
        material.lotNumber.toLowerCase().includes(lowerCaseSearchTerm) ||
        material.materialCode.toLowerCase().includes(lowerCaseSearchTerm) ||
        material.materialName.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }
    return filtered;
  }, [availableMaterials, searchTerm, selectedFilterKey]);

  // Pagination logic (keep as is)
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedMaterials = filteredMaterials.slice(indexOfFirstItem, indexOfLastItem);

  const handleCheckboxChange = (materialId: string) => {
    setCurrentSelectedIds(prev =>
      prev.includes(materialId) ? prev.filter(id => id !== materialId) : [...prev, materialId]
    );
  };

  const handleConfirmSelection = () => {
    onConfirm(currentSelectedIds);
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Toggle tree node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Recursive component to render the category tree
  const renderCategoryTree = (nodes: MaterialCategoryNode[]) => {
    return (
      <ul className="space-y-1">
        {nodes.map(node => (
          <li key={node.id}>
            <div
              className={`flex items-center cursor-pointer px-3 py-2 rounded-lg transition-colors
                ${node.filterKey === selectedFilterKey ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-50'}
              `}
              onClick={() => {
                if (node.children && node.children.length > 0) {
                  toggleNode(node.id); // Expand/collapse if it has children
                } else if (node.filterKey) {
                  setSelectedFilterKey(node.filterKey); // Select leaf node for filtering
                }
              }}
            >
              {node.children && node.children.length > 0 && (
                expandedNodes[node.id] ? (
                  <ChevronDown className="w-4 h-4 mr-2 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 mr-2 text-gray-500" />
                )
              )}
              <span className="flex-1">{node.name}</span>
              {node.filterKey === selectedFilterKey && <CheckCircle className="w-4 h-4 text-blue-600 ml-2" />}
            </div>
            {node.children && expandedNodes[node.id] && (
              <div className="ml-6 mt-1">
                {renderCategoryTree(node.children)}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Fixed height h-[80vh] */}
      <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl h-[80vh] mx-4 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Package className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">选择线边仓物料</h2>
              <p className="text-sm text-gray-600 mt-1">从可用物料中选择要投料的衬底片</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content Area: Left Sidebar + Right Search/Table */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar: Material Categories */}
          <div className="w-1/4 border-r border-gray-200 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">物料分类</h3>
            {renderCategoryTree(hierarchicalCategories)} {/* Render the tree */}

          </div>

          {/* Right Content: Search and Table */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="搜索衬底片编码、物料编码或物料名称..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowIncomingParams(true)}
                  disabled={currentSelectedIds.length === 0}
                  className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Eye className="w-4 h-4" />
                  查看来料参数
                </button>
              </div>
            </div>

            {/* Material List Table */}
            <div className="flex-1 overflow-y-auto"> {/* This div handles table scrolling */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      选择
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      衬底片编码
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      批次号
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      物料编码
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      物料名称
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      单位
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      数量
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      库存位置
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedMaterials.length > 0 ? (
                    paginatedMaterials.map(material => (
                      <tr key={material.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={currentSelectedIds.includes(material.id)}
                            onChange={() => handleCheckboxChange(material.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {material.lotNumber}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {material.batchNumber}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {material.materialCode}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {material.materialName}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {material.unit}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {material.boxQuantity}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {material.location}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">未找到匹配物料</h3>
                        <p className="mt-1 text-sm text-gray-500">请调整搜索条件或物料分类。</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-700">
                  显示 {indexOfFirstItem + 1} 到 {Math.min(indexOfLastItem, filteredMaterials.length)} 条，
                  共 {filteredMaterials.length} 条记录
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-700">
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirmSelection}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            确认 ({currentSelectedIds.length})
          </button>
        </div>
      </div>

      {/* Incoming Material Params Modal */}
      {showIncomingParams && (
        <IncomingMaterialParamsModal
          title="来料参数"
          waferCodes={
            availableMaterials
              .filter(m => currentSelectedIds.includes(m.id))
              .map(m => m.lotNumber || m.materialCode)
          }
          onClose={() => setShowIncomingParams(false)}
        />
      )}
    </div>
  );
};
