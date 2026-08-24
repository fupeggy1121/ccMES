// src/components/FinishedProduct/FinishedProductInboundModule.tsx
import React, { useState } from 'react';
import { useData } from '../../hooks/useData';
import { FinishedProductBatch } from '../../types';
import OutboundConfirmationModal from './OutboundConfirmationModal';
import { 
  Search, Filter, Package, CheckCircle, XCircle, 
  AlertCircle, Calendar, User, Warehouse, Download, 
  QrCode, Scan, ChevronLeft, ChevronRight, ArrowUpDown,
  MoreVertical, Eye, Edit, Trash2, Printer, Share2,
  Truck
} from 'lucide-react';

const FinishedProductInboundModule: React.FC = () => {
  const { finishedProductBatches, scanOutboundFinishedProductBatches } = useData();
  
  // 状态管理
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProductCode, setFilterProductCode] = useState<string>('all');
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof FinishedProductBatch>('completionTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showOutboundModal, setShowOutboundModal] = useState(false);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState<'pending_outbound' | 'outbounded'>('pending_outbound');

  // 获取所有产品料号选项
  const productCodeOptions = React.useMemo(() => {
    const codes = Array.from(new Set(finishedProductBatches.map(batch => batch.productType)));
    return [
      { value: 'all', label: '所有料号' },
      ...codes.map(code => ({ value: code, label: code }))
    ];
  }, [finishedProductBatches]);

  // 根据活动标签页筛选批次
  const getBatchesByActiveTab = () => {
    if (activeTab === 'pending_outbound') {
      return finishedProductBatches.filter(batch => 
        batch.status === 'approved' || batch.status === 'pending_outbound'
      );
    } else {
      return finishedProductBatches.filter(batch => 
        batch.status === 'outbounded' || batch.status === 'shipped'
      );
    }
  };

  // 筛选后的批次
  const filteredBatches = getBatchesByActiveTab().filter(batch => {
    // 搜索筛选
    const matchesSearch = !searchTerm || 
      batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.productType.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 状态筛选
    const matchesStatus = filterStatus === 'all' || batch.status === filterStatus;
    
    // 产品料号筛选
    const matchesProductCode = filterProductCode === 'all' || batch.productType === filterProductCode;
    
    return matchesSearch && matchesStatus && matchesProductCode;
  });

  // 排序
  const sortedBatches = [...filteredBatches].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === 'asc'
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    }
    
    return 0;
  });

  // 分页
  const totalPages = Math.ceil(sortedBatches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBatches = sortedBatches.slice(startIndex, startIndex + itemsPerPage);

  // 动态生成状态筛选选项
  const getStatusOptions = () => {
    if (activeTab === 'pending_outbound') {
      return [
        { value: 'all', label: '所有状态', color: 'gray' },
        { value: 'approved', label: '已审批', color: 'green' },
        { value: 'pending_outbound', label: '待出库', color: 'yellow' }
      ];
    } else {
      return [
        { value: 'all', label: '所有状态', color: 'gray' },
        { value: 'outbounded', label: '已出库', color: 'blue' },
        { value: 'shipped', label: '已发货', color: 'purple' }
      ];
    }
  };

  // 处理排序
  const handleSort = (field: keyof FinishedProductBatch) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 处理批次选择
  const handleBatchSelect = (batchId: string) => {
    setSelectedBatches(prev => 
      prev.includes(batchId) 
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  // 全选/取消全选（只针对当前标签页可选择的批次）
  const handleSelectAll = () => {
    const selectableBatches = paginatedBatches.filter(batch => 
      activeTab === 'pending_outbound' ? 
      (batch.status === 'approved' || batch.status === 'pending_outbound') : 
      false
    );
    
    if (selectedBatches.length === selectableBatches.length) {
      setSelectedBatches([]);
    } else {
      setSelectedBatches(selectableBatches.map(batch => batch.id));
    }
  };

  // 处理出库按钮点击
  const handleOutbound = () => {
    
    // 验证所选批次是否可以出库
    const canOutbound = selectedBatches.every(batchId => {
      const batch = finishedProductBatches.find(b => b.id === batchId);
      return batch && (batch.status === 'approved' || batch.status === 'pending_outbound');
    });
    
    if (!canOutbound) {
      alert('只能选择状态为"已审批"或"待出库"的批次进行出库操作');
      return;
    }
    
    setShowOutboundModal(true);
  };

  // 获取审核结果对应的颜色和文本
  const getInspectionResult = (result: FinishedProductBatch['inspectionResult']) => {
    switch (result) {
      case 'pass': return { text: '通过', color: 'text-green-600' };
      case 'fail': return { text: '不通过', color: 'text-red-600' };
      case 'conditional': return { text: '特殊接收', color: 'text-yellow-600' };
      default: return { text: result, color: 'text-gray-600' };
    }
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* 标题和操作栏 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">成品入库管理</h1>
          <p className="text-gray-600 mt-1">管理成品批次，进行出库操作</p>
        </div>
        
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
            <Download className="w-4 h-4 mr-2" />
            导出数据
          </button>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending_outbound' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => {
              setActiveTab('pending_outbound');
              setCurrentPage(1);
              setSelectedBatches([]);
              setFilterStatus('all');
              setFilterProductCode('all');
            }}
          >
            待出库批次 ({finishedProductBatches.filter(b => b.status === 'approved' || b.status === 'pending_outbound').length})
          </button>
          <button
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'outbounded' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => {
              setActiveTab('outbounded');
              setCurrentPage(1);
              setSelectedBatches([]);
              setFilterStatus('all');
              setFilterProductCode('all');
            }}
          >
            已出库记录 ({finishedProductBatches.filter(b => b.status === 'outbounded' || b.status === 'shipped').length})
          </button>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-10">
          {/* 搜索框 - 占3列 */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">搜索</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索批次号、产品名称..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* 状态筛选 - 占3列 */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">状态筛选</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {getStatusOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* 产品料号筛选 - 占3列 */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">产品料号</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterProductCode}
              onChange={(e) => setFilterProductCode(e.target.value)}
            >
              {productCodeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* 操作按钮 - 占1列 */}
          <div className="flex items-end md:col-span-1">
            {activeTab === 'pending_outbound' && (
              <button 
                className={`w-full px-4 py-2 rounded-lg  bg-blue-600 text-white hover:bg-blue-700`}
                onClick={handleOutbound}
              >
                <Truck className="w-4 h-4 mr-2 inline" />
                出库
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 批次表格 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {activeTab === 'pending_outbound' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedBatches.length === paginatedBatches.filter(b => b.status === 'approved' || b.status === 'pending_outbound').length && paginatedBatches.filter(b => b.status === 'approved' || b.status === 'pending_outbound').length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
                {activeTab !== 'pending_outbound' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    序号
                  </th>
                )}
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('batchNumber')}
                >
                  <div className="flex items-center">
                    成品批次号
                    <ArrowUpDown className="w-3 h-3 ml-1" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('productType')}
                >
                  <div className="flex items-center">
                    产品料号
                    <ArrowUpDown className="w-3 h-3 ml-1" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  审核结果
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('completionTime')}
                >
                  <div className="flex items-center">
                    审批时间
                    <ArrowUpDown className="w-3 h-3 ml-1" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedBatches.map((batch, index) => {
                const inspectionResult = getInspectionResult(batch.inspectionResult);
                const canOutbound = batch.status === 'approved' || batch.status === 'pending_outbound';
                
                return (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    {activeTab === 'pending_outbound' ? (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {canOutbound ? (
                          <input
                            type="checkbox"
                            checked={selectedBatches.includes(batch.id)}
                            onChange={() => handleBatchSelect(batch.id)}
                            className="rounded border-gray-300"
                          />
                        ) : (
                          <div className="w-4 h-4"></div>
                        )}
                      </td>
                    ) : (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {startIndex + index + 1}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{batch.batchNumber}</div>
                      <div className="text-sm text-gray-500">{batch.productName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{batch.productType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-medium">{batch.totalWafers} 片</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${inspectionResult.color}`}>
                        {inspectionResult.text}
                      </span>
                      {batch.inspector && (
                        <div className="text-xs text-gray-500 mt-1">
                          <User className="w-3 h-3 inline mr-1" />
                          {batch.inspector}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(batch.completionTime)}
                      </div>
                      {batch.outboundTime && (
                        <div className="text-xs text-gray-500 mt-1">
                          出库: {formatDate(batch.outboundTime)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {activeTab === 'pending_outbound' && canOutbound && (
                          <button 
                            className="text-green-600 hover:text-green-900 flex items-center"
                            title="出库"
                            onClick={() => {
                              setSelectedBatches([batch.id]);
                              setShowOutboundModal(true);
                            }}
                          >
                            <Truck className="w-4 h-4 mr-1" />
                            出库
                          </button>
                        )}
                        <button 
                          className="text-gray-600 hover:text-gray-900"
                          title="更多操作"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              显示 {startIndex + 1} 到 {Math.min(startIndex + itemsPerPage, sortedBatches.length)} 条，共 {sortedBatches.length} 条
            </div>
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`px-3 py-1 border rounded-md text-sm ${currentPage === pageNum ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700'}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 出库确认模态框 */}
      <OutboundConfirmationModal
        isOpen={showOutboundModal}
        onClose={() => setShowOutboundModal(false)}
        selectedBatches={selectedBatches}
        allFinishedProductBatches={finishedProductBatches}
        onConfirmOutbound={scanOutboundFinishedProductBatches}
      />
    </div>
  );
};

export default FinishedProductInboundModule;