// src/components/Carriers/CarrierGroupModule.tsx
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight, 
  Box, Users, Settings, Package, CheckSquare, Square 
} from 'lucide-react';
import { CarrierGroup } from '../../types';
import { useData } from '../../hooks/useData'; // 导入 useData 钩子
import { CreateCarrierGroupModal } from './CreateCarrierGroupModal'; // 导入新的模态框

// Mock data generator for carrier groups (moved to useData.ts)

export const CarrierGroupModule: React.FC = () => {
  const { carrierGroups, addCarrierGroup } = useData(); // 从 useData 获取 carrierGroups 和 addCarrierGroup
  const [loading, setLoading] = useState(true); // 保持 loading 状态，但实际数据加载由 useData 处理
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false); // 控制新建模态框显示

  // 模拟数据加载完成
  useEffect(() => {
    if (carrierGroups) {
      setLoading(false);
    }
  }, [carrierGroups]);

  // Filter carrier groups based on search term
  const filteredGroups = carrierGroups.filter(group =>
    group.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedGroups = filteredGroups.slice(indexOfFirstItem, indexOfLastItem);

  // Handle checkbox selection
  const handleSelectGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSelectAll = () => {
    if (selectedGroups.length === paginatedGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(paginatedGroups.map(group => group.id));
    }
  };

  const handleEdit = (group: CarrierGroup) => {
    alert(`编辑载具组: ${group.groupName}`);
  };

  const handleDelete = (group: CarrierGroup) => {
    if (confirm(`确定要删除载具组 "${group.groupName}" 吗？`)) {
      // 实际应用中会调用 deleteCarrierGroup 函数
      alert('载具组删除成功 (模拟操作)');
    }
  };

  const handleCreateGroup = () => {
    setShowCreateGroupModal(true); // 确保这里设置为 true
  };

  const handleCreateGroupSubmit = (groupData: Omit<CarrierGroup, 'id' | 'carrierCount' | 'carrierIds' | 'status' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    addCarrierGroup(groupData);
    alert(`载具组 "${groupData.groupName}" 创建成功！`);
    setShowCreateGroupModal(false);
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">载具组</h2>
          <p className="text-gray-600 mt-1">载具组配置与管理</p>
        </div>
        <button 
          onClick={handleCreateGroup} // 确保这里绑定了 handleCreateGroup
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Top Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            {/* Pagination Info */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredGroups.length)} of {filteredGroups.length} 载具组
              </span>
              
              {/* Pagination Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600">{currentPage}</span>
                  <span className="text-sm text-gray-400">/</span>
                  <span className="text-sm text-gray-600">{totalPages}</span>
                </div>
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Items per page selector */}
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setCurrentPage(1);
                  // In a real implementation, you'd update itemsPerPage state
                }}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={10}>10 条/页</option>
                <option value={20}>20 条/页</option>
                <option value={50}>50 条/页</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="载具组名称"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedGroups.length === paginatedGroups.length && paginatedGroups.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  载具组
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  描述
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  载具数
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  保养周期
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedGroups.length > 0 ? (
                paginatedGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group.id)}
                        onChange={() => handleSelectGroup(group.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Box className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                            {group.groupName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {group.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {group.carrierCount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {group.maintenanceCycle ? `${group.maintenanceCycle} ${group.maintenanceCycleUnit}` : '未设置'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => handleEdit(group)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          编辑
                        </button>
                        <button 
                          onClick={() => handleDelete(group)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Box className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900">暂无载具组数据</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm ? '未找到匹配的载具组，请调整搜索条件' : '请点击"新建"按钮创建第一个载具组'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination (if needed for large datasets) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-700">
              显示 {indexOfFirstItem + 1} 到 {Math.min(indexOfLastItem, filteredGroups.length)} 条，
              共 {filteredGroups.length} 条记录
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                上一页
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 flex items-center gap-1"
              >
                下一页
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Carrier Group Modal */}
      {showCreateGroupModal && ( // 确保这里是条件渲染
        <CreateCarrierGroupModal
          onClose={() => setShowCreateGroupModal(false)}
          onSubmit={handleCreateGroupSubmit}
        />
      )}
    </div>
  );
};
