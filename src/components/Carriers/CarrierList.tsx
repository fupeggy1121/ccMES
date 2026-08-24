// src/components/Carriers/CarrierList.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Truck, MapPin, Battery, Settings, Package, Box, Grid, CheckCircle, Wrench, Circle, Hash, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Droplet, History, FileText } from 'lucide-react'; // 确保导入 FileText
import { Carrier } from '../../types';
import { useData } from '../../hooks/useData';
import { CreateCarrierModal } from './CreateCarrierModal';
import { ViewCleaningRecordsModal } from './ViewCleaningRecordsModal';
import { DocumentModal } from './DocumentModal'; // 新增此行

export const CarrierList: React.FC = () => {
  const { carriers, loading, preloadRecords, addCarrier, carrierGroups, startCleaning, completeCleaning, getCleaningRecordsForCarrier } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [loadStatusFilter, setLoadStatusFilter] = useState<string>('all');
  const [cleaningStatusFilter, setCleaningStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showCreateCarrierModal, setShowCreateCarrierModal] = useState(false);
  const [showViewRecordsModal, setShowViewRecordsModal] = useState(false);
  const [carrierToViewRecords, setCarrierToViewRecords] = useState<Carrier | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false); // 新增此行

  // 将派生状态计算包裹在 useMemo 中
  const filteredCarriers = useMemo(() => {
    return carriers.filter(carrier => {
      const matchesSearch = carrier.carrierId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLoadStatus = loadStatusFilter === 'all' || carrier.status === loadStatusFilter;
      const matchesCleaningStatus = cleaningStatusFilter === 'all' || carrier.cleaningStatus === cleaningStatusFilter;
      const matchesType = typeFilter === 'all' || carrier.type === typeFilter;
      return matchesSearch && matchesLoadStatus && matchesCleaningStatus && matchesType;
    });
  }, [carriers, searchTerm, loadStatusFilter, cleaningStatusFilter, typeFilter]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredCarriers.length / itemsPerPage)), [filteredCarriers.length, itemsPerPage]);
  const indexOfLastItem = useMemo(() => currentPage * itemsPerPage, [currentPage, itemsPerPage]);
  const indexOfFirstItem = useMemo(() => indexOfLastItem - itemsPerPage, [indexOfLastItem, itemsPerPage]);
  const paginatedCarriers = useMemo(() => filteredCarriers.slice(indexOfFirstItem, indexOfLastItem), [filteredCarriers, indexOfFirstItem, indexOfLastItem]);

  // useEffect 钩子用于在筛选条件变化时重置页码
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, loadStatusFilter, cleaningStatusFilter, typeFilter]);

  // 将事件处理函数和辅助函数包裹在 useCallback 中
  const paginate = useCallback((pageNumber: number) => setCurrentPage(pageNumber), []);
  const handlePrevPage = useCallback(() => setCurrentPage(p => Math.max(1, p - 1)), []);
  const handleNextPage = useCallback(() => setCurrentPage(p => Math.min(totalPages, p + 1)), [totalPages]);
  const handleItemsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  }, []);

  const getLoadStatusBadge = useCallback((status: Carrier['status']) => {
    const styles = {
      unoccupied: 'bg-green-100 text-green-800',
      occupied: 'bg-red-100 text-red-800',
    };
    const labels = {
      unoccupied: '未占用',
      occupied: '已占用',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  }, []);

  const getCleaningStatusBadge = useCallback((cleaningStatus: Carrier['cleaningStatus']) => {
    const styles = {
      good: 'bg-green-100 text-green-800',
      'needs-cleaning': 'bg-yellow-100 text-yellow-800',
      'in-cleaning': 'bg-blue-100 text-blue-800',
    };
    const labels = {
      good: '正常',
      'needs-cleaning': '待清洗',
      'in-cleaning': '清洗中',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[cleaningStatus]}`}>
        {labels[cleaningStatus]}
      </span>
    );
  }, []);

  const getCarrierTypeName = useCallback((type: Carrier['type']) => {
    switch (type) {
      case 'stacking-box': return '堆叠盒';
      case 'wafer-basket': return '片篮';
      case 'platen': return 'Platen';
      default: return '未知类型';
    }
  }, []);

  const getCarrierGroupName = useCallback((carrierGroupId?: string) => {
    if (!Array.isArray(carrierGroups)) {
      return '未分组';
    }
    const group = carrierGroups.find(g => g.id === carrierGroupId);
    return group ? group.groupName : '未分组';
  }, [carrierGroups]); // 依赖 carrierGroups

  const getCurrentBatchId = useCallback((carrierId: string) => {
    const carrier = carriers.find(c => c.id === carrierId);
    if (!carrier) return 'N/A';
    if (carrier.type === 'platen') {
      const activePreload = preloadRecords.find(preload =>
        preload.status === 'active' &&
        preload.platenId === carrier.id
      );
      if (activePreload) {
        return activePreload.platenPositions[0]?.substrateLotNumber || 'N/A';
      }
    }
    if (carrier.currentLoad > 0) {
        return `BATCH-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }
    return 'N/A';
  }, [carriers, preloadRecords]); // 依赖 carriers 和 preloadRecords

  const carrierTypes = useMemo(() => [...new Set(carriers.map(c => c.type))], [carriers]);

  const handleCreateCarrierSubmit = useCallback((carrierData: Omit<Carrier, 'id' | 'createdAt' | 'updatedAt' | 'currentLoad' | 'loadedSmallBoxes' | 'cleaningCount'>) => {
    const newCarrier = addCarrier(carrierData);
    alert(`载具 ${newCarrier.carrierId} 创建成功！`);
    setShowCreateCarrierModal(false);
  }, [addCarrier]);

  const handleEditCarrier = useCallback((carrier: Carrier) => {
    alert(`编辑载具: ${carrier.carrierId}`);
  }, []);

  const handleDeleteCarrier = useCallback((carrier: Carrier) => {
    if (window.confirm(`确定要删除载具 ${carrier.carrierId} 吗？`)) {
      alert(`载具 ${carrier.carrierId} 已删除 (模拟操作)`);
    }
  }, []);

  const handleViewCleaningRecords = useCallback((carrier: Carrier) => {
    setCarrierToViewRecords(carrier);
    setShowViewRecordsModal(true);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">载具管理</h2>
          <p className="text-gray-600 mt-1">半导体衬底片生产载具状态监控与管理</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDocumentModal(true)} // 新增此行
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            文档
          </button>
          <button
            onClick={() => setShowCreateCarrierModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建载具
          </button>
        </div>
      </div>

      {/* Create Carrier Modal */}
      {showCreateCarrierModal && (
        <CreateCarrierModal
          onClose={() => setShowCreateCarrierModal(false)}
          onSubmit={handleCreateCarrierSubmit}
          carrierGroups={carrierGroups}
        />
      )}

      {/* View Cleaning Records Modal */}
      {showViewRecordsModal && carrierToViewRecords && (
        <ViewCleaningRecordsModal
          isOpen={showViewRecordsModal}
          onClose={() => { setShowViewRecordsModal(false); setCarrierToViewRecords(null); }}
          carrier={carrierToViewRecords}
        />
      )}

      {/* Document Modal */}
      <DocumentModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
      />

      {/* 搜索框 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索载具ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 载具类型筛选 */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">全部类型</option>
            {carrierTypes.map(type => (
              <option key={type} value={type}>{getCarrierTypeName(type)}</option>
            ))}
          </select>

          {/* 占用状态筛选 */}
          <select
            value={loadStatusFilter}
            onChange={(e) => setLoadStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">全部占用状态</option>
            <option value="unoccupied">未占用</option>
            <option value="occupied">已占用</option>
          </select>

          {/* 清洗状态筛选 */}
          <select
            value={cleaningStatusFilter}
            onChange={(e) => setCleaningStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">全部清洗状态</option>
            <option value="good">正常</option>
            <option value="needs-cleaning">待清洗</option>
            <option value="in-cleaning">清洗中</option>
          </select>
        </div>
      </div>

      {/* 分页控件 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          第 {currentPage} 页 / 共 {totalPages} 页
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            上一页
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            下一页
          </button>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="border rounded px-2 py-1"
          >
            <option value={10}>每页 10 条</option>
            <option value={20}>每页 20 条</option>
            <option value={50}>每页 50 条</option>
          </select>
        </div>
      </div>

      {/* 载具表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {paginatedCarriers.length === 0 ? (
          <div className="text-center text-gray-500 py-8">暂无载具数据</div>
        ) : (
          <table className="w-full text-sm text-left text-gray-600">
            <thead>
              <tr>
                <th className="px-4 py-2">载具ID</th>
                <th className="px-4 py-2">载具模型</th>
                <th className="px-4 py-2">载具组</th>
                <th className="px-4 py-2">清洗状态</th>
                <th className="px-4 py-2">占用状态</th>
                <th className="px-4 py-2">当前位置</th>
                <th className="px-4 py-2">当前批次</th>
                <th className="px-4 py-2">清洗次数</th>
                <th className="px-4 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCarriers.map((carrier) => {
                const showDegasButton = !carrier.degasTime && carrier.processStep === 'not-degassed';
                const showUnbindButton = carrier.processStep === 'not-degassed' || carrier.processStep === 'degassed';

                return (
                  <tr key={carrier.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2">{carrier.carrierId}</td>
                    <td className="px-4 py-2">{getCarrierTypeName(carrier.type)}</td>
                    <td className="px-4 py-2">{getCarrierGroupName(carrier.carrierGroupId)}</td>
                    <td className="px-4 py-2">{getCleaningStatusBadge(carrier.cleaningStatus)}</td>
                    <td className="px-4 py-2">{getLoadStatusBadge(carrier.status)}</td>
                    <td className="px-4 py-2">{carrier.currentLocation || 'N/A'}</td>
                    <td className="px-4 py-2">{getCurrentBatchId(carrier.id)}</td>
                    <td className="px-4 py-2">{carrier.cleaningCount}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewCleaningRecords(carrier)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm font-medium"
                        >
                          <History className="w-4 h-4" />
                          记录
                        </button>
                        <button
                          onClick={() => handleEditCarrier(carrier)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm font-medium"
                        >
                          <Edit className="w-4 h-4" />
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteCarrier(carrier)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1 text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {/* Bottom Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-700">
              显示 {indexOfFirstItem + 1} 到 {Math.min(indexOfLastItem, filteredCarriers.length)} 条，
              共 {filteredCarriers.length} 条记录
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

        {paginatedCarriers.length === 0 && (
          <div className="text-center text-gray-500 py-8">暂无载具数据</div>
        )}
      </div>
    </div>
  );
};