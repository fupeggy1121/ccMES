// src/components/Carriers/CleaningRecordsModule.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Filter, Droplet, History, CheckCircle, Clock, X, Eye, Play, StopCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { CleaningRecord } from '../../types';
import { BatchCleaningModal } from './BatchCleaningModal';
import { Tooltip } from 'antd';

export const CleaningRecordsModule: React.FC = () => {
  const { cleaningRecords, carriers, loading, completeCleaningTask } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showBatchCleaningModal, setShowBatchCleaningModal] = useState(false);
  const [recordToComplete, setRecordToComplete] = useState<CleaningRecord | null>(null);

  // 新增：getCarrierDisplayName 辅助函数
  const getCarrierDisplayName = useCallback((id: string): string => {
    const carrier = carriers.find(c => c.id === id);
    return carrier ? carrier.carrierId : '未知载具';
  }, [carriers]);

  const getStatusBadge = useCallback((status: CleaningRecord['status']) => {
    const styles = {
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
    };
    const labels = {
      'in-progress': '执行中',
      'completed': '已完成',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  }, []);

  const getStatusIcon = useCallback((status: CleaningRecord['status']) => {
    switch (status) {
      case 'in-progress':
        return <Play className="w-4 h-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  }, []);

  const filteredAndSortedRecords = useMemo(() => {
    let filtered = cleaningRecords.filter(record => {
      const matchesSearch =
        record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.carrierId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.equipment.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // 排序规则：执行中的任务置顶，然后按结束时间倒序
    filtered.sort((a, b) => {
      if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
      if (a.status !== 'in-progress' && b.status === 'in-progress') return 1;
      // 如果都有结束时间，按结束时间倒序
      if (a.endTime && b.endTime) {
        return b.endTime.getTime() - a.endTime.getTime();
      }
      // 如果只有其中一个有结束时间，有结束时间的排在后面
      if (a.endTime && !b.endTime) return 1;
      if (!a.endTime && b.endTime) return -1;
      // 如果都没有结束时间，按开始时间倒序
      return b.startTime.getTime() - a.startTime.getTime();
    });

    return filtered;
  }, [cleaningRecords, searchTerm, statusFilter]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredAndSortedRecords.length / itemsPerPage)), [filteredAndSortedRecords.length, itemsPerPage]);
  const indexOfLastItem = useMemo(() => currentPage * itemsPerPage, [currentPage, itemsPerPage]);
  const indexOfFirstItem = useMemo(() => indexOfLastItem - itemsPerPage, [indexOfLastItem, itemsPerPage]);
  const paginatedRecords = useMemo(() => filteredAndSortedRecords.slice(indexOfFirstItem, indexOfLastItem), [filteredAndSortedRecords, indexOfFirstItem, indexOfLastItem]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const paginate = useCallback((pageNumber: number) => setCurrentPage(pageNumber), []);
  const handlePrevPage = useCallback(() => setCurrentPage(p => Math.max(1, p - 1)), []);
  const handleNextPage = useCallback(() => setCurrentPage(p => Math.min(totalPages, p + 1)), [totalPages]);
  const handleItemsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  }, []);

  const handleEndCleaning = useCallback((record: CleaningRecord) => {
    setRecordToComplete(record);
    setShowBatchCleaningModal(true);
  }, []);

  const handleViewDetails = useCallback((record: CleaningRecord) => {
    alert(`查看清洗任务详情：\n任务ID: ${record.id}\n载具ID: ${record.carrierId}\n状态: ${record.status}`);
    // 可以在这里打开一个详情模态框
  }, []);

  const handleCompleteBatchCleaning = useCallback((recordId: string, operator: string, endTime: Date) => {
    if (window.confirm('确定要结束此清洗任务吗？')) {
      completeCleaningTask(recordId, operator, endTime);
      setShowBatchCleaningModal(false);
      setRecordToComplete(null);
      alert('清洗任务已成功结束！');
    }
  }, [completeCleaningTask]);

  const handleBatchCleaning = useCallback(() => {
    setShowBatchCleaningModal(true);
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
          <h2 className="text-2xl font-bold text-gray-900">清洗任务记录</h2>
          <p className="text-gray-600 mt-1">所有片篮清洗任务的追踪与管理</p>
        </div>
        <button
          onClick={handleBatchCleaning}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Droplet className="w-4 h-4" />
          清洗片篮
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索任务ID、载具ID、操作员或设备..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部状态</option>
              <option value="in-progress">执行中</option>
              <option value="completed">已完成</option>
            </select>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
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

      {/* Cleaning Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">清洗任务列表</h3>
            <span className="text-sm text-gray-500">共 {filteredAndSortedRecords.length} 条记录</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  任务ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  载具信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  清洗人员
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  清洗设备
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  开始时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  结束时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(record.status)}
                        <div className="ml-2 text-sm font-medium text-gray-900">{record.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <Tooltip
                        title={
                          record.carrierIds && record.carrierIds.length > 0 ? (
                            <ul className="list-disc list-inside p-0 m-0">
                              {record.carrierIds.map((id, index) => (
                                <li key={index}>{getCarrierDisplayName(id)}</li>
                              ))}
                            </ul>
                          ) : (
                            <span>无载具</span>
                          )
                        }
                        placement="right"
                      >
                        <span className="cursor-pointer hover:underline">
                          {record.carrierIds?.length ?? 0} 个载具
                        </span>
                      </Tooltip>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.operator}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.equipment}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.startTime.toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.endTime ? record.endTime.toLocaleString('zh-CN') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {record.status === 'in-progress' ? (
                          <button
                            onClick={() => handleEndCleaning(record)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1 text-sm font-medium"
                          >
                            <StopCircle className="w-4 h-4" />
                            结束清洗
                          </button>
                        ) : (
                          <button
                            onClick={() => handleViewDetails(record)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            查看详情
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <History className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">暂无清洗任务记录</h3>
                    <p className="mt-1 text-sm text-gray-500">请开始新的清洗任务。</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Cleaning Modal for ending tasks */}
      {showBatchCleaningModal && recordToComplete && (
        <BatchCleaningModal
          isOpen={showBatchCleaningModal}
          onClose={() => { setShowBatchCleaningModal(false); setRecordToComplete(null); }}
          allCarriers={carriers.filter(c => recordToComplete.carrierIds?.includes(c.id))}
          initialCleaningRecord={recordToComplete}
          onCompleteCleaning={handleCompleteBatchCleaning}
        />
      )}

      {/* Batch Cleaning Modal for starting new batch cleaning */}
      {showBatchCleaningModal && !recordToComplete && (
        <BatchCleaningModal
          isOpen={showBatchCleaningModal}
          onClose={() => setShowBatchCleaningModal(false)}
          allCarriers={carriers.filter(c => c.type === 'wafer-basket' || c.type === 'platen')}
        />
      )}
    </div>
  );
};