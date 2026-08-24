// src/components/Auxiliary/AuxiliaryLifetimeManagement.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Settings, Wrench, Package, CheckSquare, Square, Edit, Trash2, Table, LayoutGrid, CornerDownLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuxiliaryMaterial } from '../../types';
import { useData } from '../../hooks/useData';
import { TreeSelect } from 'antd';
import { InstallAuxiliaryMaterialModal } from './InstallAuxiliaryMaterialModal';
import { AssignAuxiliaryModal } from './AssignAuxiliaryModal';
import { AuxiliaryReturnModal } from './AuxiliaryReturnModal'; // 导入新的退库模态框
import { AuxiliaryScrapModal } from './AuxiliaryScrapModal'; // 导入新的报废模态框

export const AuxiliaryLifetimeManagement: React.FC = () => {
  const { auxiliaryMaterials, updateAuxiliaryMaterial, deleteAuxiliaryMaterial, createAuxiliaryReturnRequest, scrapAuxiliaryMaterial, loading } = useData(); // 添加 scrapAuxiliaryMaterial
  const [searchTerm, setSearchTerm] = useState('');
  const [equipmentIdFilter, setEquipmentIdFilter] = useState('all');
  const [isInstalledFilter, setIsInstalledFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active'); // 新增状态筛选，默认显示 active
  const [currentView, setCurrentView] = useState<'table' | 'card'>('table');
  const [showAuxiliaryRequestModal, setShowAuxiliaryRequestModal] = useState(false);
  
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showScrapModal, setShowScrapModal] = useState(false); // 新增状态：控制报废模态框的显示

  const [showInstallModal, setShowInstallModal] = useState(false);
  const [materialToInstall, setMaterialToInstall] = useState<AuxiliaryMaterial | null>(null);

  const [showAssignAuxiliaryModal, setShowAssignAuxiliaryModal] = useState(false);
  const [materialToAssignAuxiliary, setMaterialToAssignAuxiliary] = useState<AuxiliaryMaterial | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 模拟设备树数据
  const mockEquipmentTree = [
    {
      title: '区域A - 清洗设备',
      value: 'area-a',
      children: [
        {
          title: 'ADGMP01系列',
          value: 'adgmp01-series',
          children: [
            { title: 'ADGMP01-2A', value: 'ADGMP01-2A' },
            { title: 'ADGMP01-2B', value: 'ADGMP01-2B' },
          ],
        },
        {
          title: 'ADGMP02系列',
          value: 'adgmp02-series',
          children: [
            { title: 'ADGMP02-3F', value: 'ADGMP02-3F' },
            { title: 'ADGMP02-3G', value: 'ADGMP02-3G' },
          ],
        },
      ],
    },
    {
      title: '区域B - 研磨设备',
      value: 'area-b',
      children: [
        {
          title: 'ADGMP03系列',
          value: 'adgmp03-series',
          children: [
            { title: 'ADGMP03-1C', value: 'ADGMP03-1C' },
            { title: 'ADGMP03-1D', value: 'ADGMP03-1D' },
          ],
        },
        {
          title: 'ADGMP04系列',
          value: 'adgmp04-series',
          children: [
            { title: 'ADGMP04-4D', value: 'ADGMP04-4D' },
            { title: 'ADGMP04-4E', value: 'ADGMP04-4E' },
          ],
        },
      ],
    },
    {
      title: '区域C - 抛光设备',
      value: 'area-c',
      children: [
        {
          title: 'ADGMP05系列',
          value: 'adgmp05-series',
          children: [
            { title: 'ADGMP05-5E', value: 'ADGMP05-5E' },
            { title: 'ADGMP05-5F', value: 'ADGMP05-5F' },
          ],
        },
        {
          title: 'ADGMP06系列',
          value: 'adgmp06-series',
          children: [
            { title: 'ADGMP06-6F', value: 'ADGMP06-6F' },
            { title: 'ADGMP06-6G', value: 'ADGMP06-6G' },
          ],
        },
      ],
    },
  ];

  // 辅助函数：在树中查找节点
  const findNodeInTree = (tree: any[], value: string): any => {
    for (const node of tree) {
      if (node.value === value) {
        return node;
      }
      if (node.children) {
        const found = findNodeInTree(node.children, value);
        if (found) return found;
      }
    }
    return null;
  };

  // 辅助函数：获取叶子节点的所有值
  const getLeafValues = (node: any): string[] => {
    if (!node) return [];
    
    if (!node.children || node.children.length === 0) {
      return [node.value];
    }
    
    const leafValues: string[] = [];
    for (const child of node.children) {
      leafValues.push(...getLeafValues(child));
    }
    return leafValues;
  };

  const filteredMaterials = useMemo(() => {
    return auxiliaryMaterials.filter(material => {
      const matchesSearch =
        (material.auxiliaryBatch ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (material.auxiliaryId ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (material.auxiliaryName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (material.equipmentId ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (material.currentWaferLot ?? '').toLowerCase().includes(searchTerm.toLowerCase());

      let matchesEquipmentId = false;
      const hasValidEquipmentId = typeof material.equipmentId === 'string' &&
                                   material.equipmentId.trim() !== '' &&
                                   material.equipmentId.toUpperCase() !== 'N/A';

      if (equipmentIdFilter === 'all') {
        matchesEquipmentId = true;
      } else if (hasValidEquipmentId) {
        const selectedNode = findNodeInTree(mockEquipmentTree, equipmentIdFilter);
        if (selectedNode) {
          const leafValues = getLeafValues(selectedNode);
          matchesEquipmentId = leafValues.includes(material.equipmentId);
        } else {
          matchesEquipmentId = material.equipmentId === equipmentIdFilter;
        }
      } else if (equipmentIdFilter === 'STOCK_AUXILIARY_MATERIALS' && !hasValidEquipmentId) {
        matchesEquipmentId = true; // Match materials without equipmentId if 'STOCK_AUXILIARY_MATERIALS' is selected
      }

      const matchesIsInstalled = isInstalledFilter === 'all' ||
        (isInstalledFilter === 'installed' && material.isInstalled) ||
        (isInstalledFilter === 'pending' && !material.isInstalled && material.equipmentId) ||
        (isInstalledFilter === 'uninstalled' && !material.isInstalled && !material.equipmentId);

      const matchesStatus = statusFilter === 'all' || material.status === statusFilter; // 新增状态筛选

      return matchesSearch && matchesEquipmentId && matchesIsInstalled && matchesStatus;
    });
  }, [auxiliaryMaterials, searchTerm, equipmentIdFilter, isInstalledFilter, statusFilter]); // 添加 statusFilter 到依赖项

  // 分页逻辑
  const paginatedMaterials = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMaterials.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMaterials, currentPage, itemsPerPage]);

  // 计算总页数
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);

  // 筛选条件变化时重置页码
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, equipmentIdFilter, isInstalledFilter]);

  // Group materials by equipmentId
  const groupedMaterials = useMemo(() => {
    const groups: Record<string, AuxiliaryMaterial[]> = {};

    filteredMaterials.forEach(material => {
      // 将没有 equipmentId 的辅料归类到 'STOCK_AUXILIARY_MATERIALS'
      const groupKey = material.equipmentId || 'STOCK_AUXILIARY_MATERIALS';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(material);
    });

    return groups;
  }, [filteredMaterials]);

  // 处理报废申请提交
  const handleScrapSubmit = (scrapItems: AuxiliaryScrapItem[], notes?: string) => {
    const materialIdsToScrap = scrapItems.map(item => item.id);
    scrapAuxiliaryMaterial(materialIdsToScrap, notes);
    alert(`辅料报废申请已提交！\n报废辅料ID: ${materialIdsToScrap.join(', ')}`);
    setShowScrapModal(false);
  };
  
  const handleDeleteMaterial = (id: string) => {
    if (window.confirm('确定要删除此辅料吗？')) {
      deleteAuxiliaryMaterial(id);
    }
  };

  // 处理安装操作
  const handleInstallMaterial = (material: AuxiliaryMaterial) => {
    setMaterialToInstall(material);
    setShowInstallModal(true);
  };

  // 更新：修改 handleInstallSubmit 函数签名和实现
  const handleInstallSubmit = (auxiliaryId: string, instanceUniqueCode: string, auxiliaryBatch: string) => {
    updateAuxiliaryMaterial(auxiliaryId, { 
      isInstalled: true,
      instanceUniqueCode,
      auxiliaryBatch
    });
    setShowInstallModal(false);
    setMaterialToInstall(null);
  };

  // 处理卸载操作
  const handleUninstallMaterial = (material: AuxiliaryMaterial) => {
    if (window.confirm('确定要卸载此辅料吗？卸载后将清除加工批次信息。')) {
      updateAuxiliaryMaterial(material.id, {
        ...material,
        isInstalled: false,
        currentWaferLot: null, // 卸载时清除加工批次信息
        subLot: null,
        consumptionBefore: null,
        consumptionAfter: null,
      });
    }
  };

  // 新增：处理分配辅料操作
  const handleAssignAuxiliary = (material: AuxiliaryMaterial) => {
    setMaterialToAssignAuxiliary(material);
    setShowAssignAuxiliaryModal(true);
  };

  // 新增：处理分配辅料提交的函数
  const handleAssignAuxiliarySubmit = (auxiliaryId: string, instanceUniqueCode: string, auxiliaryBatch: string) => {
    updateAuxiliaryMaterial(auxiliaryId, { 
      instanceUniqueCode,
      auxiliaryBatch
    });
    setShowAssignAuxiliaryModal(false);
    setMaterialToAssignAuxiliary(null);
  };

  // 处理退库申请提交
  const handleReturnSubmit = (requestData: any) => {
    const newReturnRequest = createAuxiliaryReturnRequest(requestData);
    alert(`辅料退库申请已提交！\n申请单号: ${newReturnRequest.requestNumber}`);
    setShowReturnModal(false); // 提交成功后关闭模态框
  };

  // Function to get a consistent color for each auxiliary group
  const getGroupColor = (groupName: string) => {
    const colors = [
      'bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-purple-100', 'bg-pink-100',
      'bg-indigo-100', 'bg-red-100', 'bg-teal-100'
    ];
    let hash = 0;
    for (let i = 0; i < groupName.length; i++) {
      hash = groupName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Function to get lifetime status badge
  const getLifetimeStatusBadge = (consumptionAfter: number | null, initialLifetime: number) => {
    if (consumptionAfter === null) return 'bg-gray-100 text-gray-800';

    const percentage = (consumptionAfter / initialLifetime) * 100;

    if (percentage >= 70) return 'bg-green-100 text-green-800';
    if (percentage >= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Function to get installation status badge - 简化状态显示逻辑
  const getInstallationStatusBadge = (material: AuxiliaryMaterial) => {
    if (material.status === 'scrapped') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">已报废</span>;
    } else if (material.status === 'returned') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">已退库</span>;
    } else if (material.isInstalled) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">已安装</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">待安装</span>;
    }
  };

  // 处理设备树选择变化
  const handleEquipmentTreeChange = (value: string) => {
    setEquipmentIdFilter(value || 'all');
  };

  // 分页控件渲染函数
  const renderPagination = () => {
    if (filteredMaterials.length <= itemsPerPage) return null;

    const pageNumbers = [];
    const maxPageButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">
            显示第 {((currentPage - 1) * itemsPerPage) + 1} 到 {Math.min(currentPage * itemsPerPage, filteredMaterials.length)} 条，共 {filteredMaterials.length} 条记录
          </span>
          
          <div className="flex items-center gap-2">
            <label htmlFor="itemsPerPage" className="text-sm text-gray-700">每页显示：</label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={5}>5条</option>
              <option value={10}>10条</option>
              <option value={20}>20条</option>
              <option value={50}>50条</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`p-2 rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {startPage > 1 && (
            <>
              <button
                onClick={() => setCurrentPage(1)}
                className={`px-3 py-1 rounded text-sm ${1 === currentPage ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                1
              </button>
              {startPage > 2 && <span className="px-1 text-gray-400">...</span>}
            </>
          )}

          {pageNumbers.map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded text-sm ${page === currentPage ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-1 text-gray-400">...</span>}
              <button
                onClick={() => setCurrentPage(totalPages)}
                className={`px-3 py-1 rounded text-sm ${totalPages === currentPage ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`p-2 rounded ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">辅料寿命管理</h2>
            <p className="text-gray-600 mt-1">监控和管理生产辅料的寿命状态</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCurrentView('table')}
                className={`p-2 rounded-md flex items-center gap-1 ${currentView === 'table' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
              >
                <Table className="w-4 h-4" />
                <span>列表视图</span>
              </button>
              <button
                onClick={() => setCurrentView('card')}
                className={`p-2 rounded-md flex items-center gap-1 ${currentView === 'card' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>卡片视图</span>
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowScrapModal(true)} // 新增报废按钮
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                title="报废功能"
              >
                <Trash2 className="w-4 h-4" />
                报废
              </button>
              <button
                onClick={() => setShowReturnModal(true)}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                title="退库功能"
              >
                <CornerDownLeft className="w-4 h-4" />
                退库
              </button>
              <button
                onClick={() => setShowAuxiliaryRequestModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                辅料申请
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索批号、ID、设备ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="min-w-[200px]"> 
              <TreeSelect
                style={{ width: '100%' }}
                value={equipmentIdFilter === 'all' ? undefined : equipmentIdFilter}
                dropdownStyle={{ maxHeight: 600, overflow: 'auto' }}
                treeData={mockEquipmentTree}
                placeholder="全部设备"
                treeDefaultExpandAll
                onChange={handleEquipmentTreeChange}
                allowClear
                onClear={() => setEquipmentIdFilter('all')}
              />
            </div>

            <select
              value={isInstalledFilter}
              onChange={(e) => setIsInstalledFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">安装状态 (全部)</option>
              <option value="installed">已安装</option>
              <option value="pending">待安装</option>
              <option value="uninstalled">未安装</option>
            </select>

            {/* 新增状态筛选器 */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">状态 (全部)</option>
              <option value="active">活动</option>
              <option value="scrapped">已报废</option>
              <option value="returned">已退库</option>
            </select>
          </div>
        </div>

        {/* Conditional rendering based on current view */}
        {currentView === 'table' ? (
          /* Table View */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">辅料列表</h3>
                <span className="text-sm text-gray-500">共 {filteredMaterials.length} 条记录</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">辅料ID</th>                    
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物料编码</th>                    
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物料名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">辅料组</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">计算方式</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设定值</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">剩余寿命</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">加工批次号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">子批次号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">安装状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedMaterials.map((material) => (
                    <tr key={material.id} className={`hover:bg-gray-50 ${getGroupColor(material.auxiliaryGroup)}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.auxiliaryId}</td> 
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.equipmentId || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.auxiliaryCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.auxiliaryName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{material.auxiliaryGroup}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.calculationMethod}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.initialLifetime}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.consumptionAfter !== null ? material.consumptionAfter : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.currentWaferLot || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.subLot || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getInstallationStatusBadge(material)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {/* 仅当辅料状态为 active 时显示操作按钮 */}
                          {material.status === 'active' && (
                            <>
                              {/* 分配辅料按钮 - 仅当待安装状态时显示 */}
                              {!material.isInstalled && (
                                <button
                                  onClick={() => handleAssignAuxiliary(material)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="分配辅料"
                                  disabled={material.isInstalled}
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                              )}
                              
                              {/* 安装按钮 - 仅当待安装状态且已分配设备且已绑定实例时显示 */}
                              {!material.isInstalled && (
                                <button
                                  onClick={() => handleInstallMaterial(material)}
                                  className="text-green-600 hover:text-green-900"
                                  title="安装辅料"
                                  disabled={!(!material.isInstalled && material.equipmentId && material.instanceUniqueCode && material.auxiliaryBatch)}
                                >
                                  <CheckSquare className="w-4 h-4" />
                                </button>
                              )}
                              
                              {/* 卸载按钮 - 仅当已安装状态时显示 */}
                              {material.isInstalled && (
                                <button
                                  onClick={() => handleUninstallMaterial(material)}
                                  className="text-yellow-600 hover:text-yellow-900"
                                  title="卸载辅料"
                                  disabled={!material.isInstalled}
                                >
                                  <Wrench className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredMaterials.length === 0 && (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">暂无辅料数据</h3>
                <p className="mt-1 text-sm text-gray-500">请点击"辅料申请"按钮创建第一个辅料记录。</p>
              </div>
            )}
            
            {/* 分页控件 */}
            {renderPagination()}
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(groupedMaterials)
              .filter(([equipmentId]) => equipmentId !== 'STOCK_AUXILIARY_MATERIALS') // 过滤掉库存辅料卡片
              .map(([equipmentId, materials]) => (
                <div key={equipmentId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-blue-50 p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {equipmentId === 'STOCK_AUXILIARY_MATERIALS' ? '库存辅料' : `设备 ${equipmentId}`}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">共 {materials.length} 个辅料</p>
                  </div>

                  <div className="max-h-96 overflow-y-auto p-4">
                    {materials.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">辅料ID</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物料编码</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物料名称</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">剩余寿命</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {materials.map(material => (
                            <tr key={material.id}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{material.auxiliaryId}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{material.auxiliaryCode}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{material.auxiliaryName}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLifetimeStatusBadge(material.consumptionAfter, material.initialLifetime)}`}>
                                  {material.consumptionAfter !== null ? `${material.consumptionAfter} / ${material.initialLifetime}` : 'N/A'}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {getInstallationStatusBadge(material)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">
                                <div className="flex space-x-2">
                                  {/* 分配辅料按钮 - 仅当待安装状态时显示 */}
                                  {!material.isInstalled && (
                                    <button
                                      onClick={() => handleAssignAuxiliary(material)}
                                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                      title="分配辅料"
                                      disabled={material.isInstalled}
                                    >
                                      <Settings className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  {/* 安装按钮 - 仅当待安装状态且已分配设备且已绑定实例时显示 */}
                                  {!material.isInstalled && (
                                    <button
                                      onClick={() => handleInstallMaterial(material)}
                                      className="text-green-600 hover:text-green-900 flex items-center gap-1"
                                      title="安装辅料"
                                      disabled={!(!material.isInstalled && material.equipmentId && material.instanceUniqueCode && material.auxiliaryBatch)}
                                    >
                                      <CheckSquare className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  {/* 卸载按钮 - 仅当已安装状态时显示 */}
                                  {material.isInstalled && (
                                    <button
                                      onClick={() => handleUninstallMaterial(material)}
                                      className="text-yellow-600 hover:text-yellow-900 flex items-center gap-1"
                                      title="卸载辅料"
                                      disabled={!material.isInstalled}
                                    >
                                      <Wrench className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">暂无辅料数据</h3>
                        <p className="mt-1 text-sm text-gray-500">此设备下没有辅料记录。</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 安装辅料模态框 */}
      {showInstallModal && materialToInstall && (
        <InstallAuxiliaryMaterialModal
          visible={showInstallModal}
          onClose={() => {
            setShowInstallModal(false);
            setMaterialToInstall(null);
          }}
          onSubmit={handleInstallSubmit}
          auxiliaryMaterial={materialToInstall}
        />
      )}

      {/* 分配辅料模态框 */}
      {showAssignAuxiliaryModal && materialToAssignAuxiliary && (
        <AssignAuxiliaryModal
          visible={showAssignAuxiliaryModal}
          onClose={() => {
            setShowAssignAuxiliaryModal(false);
            setMaterialToAssignAuxiliary(null);
          }}
          onSubmit={handleAssignAuxiliarySubmit}
          auxiliaryMaterial={materialToAssignAuxiliary}
        />
      )}

      {/* 辅料退库模态框 */}
      {showReturnModal && (
        <AuxiliaryReturnModal
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          onSubmit={handleReturnSubmit}
          allAuxiliaryMaterials={auxiliaryMaterials.filter(mat => mat.status === 'active')} // 传递所有活动辅料数据供选择
        />
      )}

      {/* 辅料报废模态框 */}
      {showScrapModal && (
        <AuxiliaryScrapModal
          isOpen={showScrapModal}
          onClose={() => setShowScrapModal(false)}
          onSubmit={handleScrapSubmit}
          allAuxiliaryMaterials={auxiliaryMaterials.filter(mat => mat.status === 'active')} // 传递所有活动辅料数据供选择
        />
      )}

      {/* 辅料申请模态框 */}
      {showAuxiliaryRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">辅料出库申请</h3>
                <button
                  onClick={() => setShowAuxiliaryRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* 申请信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">申请人</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="请输入申请人姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">申请日期</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* 设备选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">目标设备</label>
                  <TreeSelect
                    style={{ width: '100%' }}
                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    treeData={mockEquipmentTree}
                    placeholder="请选择设备"
                    treeDefaultExpandAll
                  />
                </div>

                {/* 辅料申请项目 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">申请辅料清单</label>
                    <button
                      type="button"
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
                    >
                      添加辅料
                    </button>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">辅料名称</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">规格</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">申请数量</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">单位</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-900">暂无申请项目</td>
                          <td colSpan={4} className="px-4 py-3 text-sm text-gray-500 text-center">
                            请点击"添加辅料"按钮添加申请项目
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 备注 */} 
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入申请备注信息"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAuxiliaryRequestModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  // 处理申请提交逻辑
                  alert('辅料申请已提交！');
                  setShowAuxiliaryRequestModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};