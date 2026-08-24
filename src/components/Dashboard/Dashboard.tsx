// src/components/Dashboard/Dashboard.tsx
import React, { useState } from 'react';
import { Package, Truck, User, Calendar, Search, Filter, CheckCircle, Clock, AlertTriangle, Plus, QrCode, Scan, Box, Layers, X, Eye, Unlink, Thermometer } from 'lucide-react'; // 导入 Thermometer 图标
import { useData } from '../../hooks/useData';
import { PreloadModal } from '../MBE/PreloadModal';
import { DegasOperationModal } from '../MBE/DegasOperationModal'; // 导入新的除气模态框

export const Dashboard: React.FC = () => {
  const { preloadRecords, materials, carriers, loading, createPreloadRecord, updatePreloadRecordDegasInfo, unbindPreloadRecord } = useData();// 更新 useData 钩子
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 将默认值改为 'all'，因为现在有标签页控制主要状态
  const [activeTab, setActiveTab] = useState<'not-fed' | 'completed'>('not-fed'); // 新增：控制激活的标签页
  const [showPreloadModal, setShowPreloadModal] = useState(false);
  const [showPlatenDetail, setShowPlatenDetail] = useState(false);
  const [selectedPreloadRecord, setSelectedPreloadRecord] = useState<any>(null);

  const [showDegasModal, setShowDegasModal] = useState(false); // 新增：控制除气模态框显示
  const [selectedRecordForDegas, setSelectedRecordForDegas] = useState<any>(null); // 新增：存储待除气记录

  const filteredPreloadRecords = preloadRecords.filter(record => {
    // Step 1: Filter by active tab
    let matchesActiveTab = false;
    if (activeTab === 'not-fed') {
      matchesActiveTab = record.processStep === 'not-degassed' || record.processStep === 'degassed' || record.processStep === 'unbound';
    } else if (activeTab === 'completed') {
      matchesActiveTab = record.processStep === 'completed';
    }

    if (!matchesActiveTab) return false; // If it doesn't match the active tab, skip further filtering

    // Step 2: Filter by search term
    const matchesSearch =
      record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.platenId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.operatorName.toLowerCase().includes(searchTerm.toLowerCase());

    // Step 3: Filter by status dropdown (within the active tab's context)
    let matchesStatusFilter = false;
    if (statusFilter === 'all') {
      matchesStatusFilter = true;
    } else {
      matchesStatusFilter = record.processStep === statusFilter;
    }

    return matchesSearch && matchesStatusFilter;
  }); 

  const getPreloadStatusBadge = (step: string) => {
    const styles = {
      'not-degassed': 'bg-gray-100 text-gray-800', // 未除气
      degassed: 'bg-purple-100 text-purple-800', // 已除气
      completed: 'bg-green-100 text-green-800', // 已完成
      unbound: 'bg-red-100 text-red-800' // 已解绑
    };
    const labels = {
      'not-degassed': '未除气',
      degassed: '已除气',
      completed: '已投料', // Changed label to '已投料'
      unbound: '已解绑'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[step as keyof typeof styles]}`}>
        {labels[step as keyof typeof styles]}
      </span>
    );
  };

  const getPreloadStatusIcon = (step: string) => {
    switch (step) {
      case 'not-degassed':
        return <Clock className="w-4 h-4 text-gray-600" />; // 未除气
      case 'degassed':
        return <Thermometer className="w-4 h-4 text-purple-600" />; // 已除气图标
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />; // 已完成
      case 'unbound':
        return <Unlink className="w-4 h-4 text-red-600" />; // 已解绑图标
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  // These functions are no longer used in the current context, but kept for completeness if needed elsewhere.
  const addPlatenPositionInput = () => { /* ... */ };
  const removePlatenPositionInput = (index: number) => { /* ... */ };
  const updatePlatenPositionInput = (index: number, value: string) => { /* ... */ };
  const handleScanPlaten = (index: number) => { /* ... */ };
  const handleScanSubstrate = () => { /* ... */ };
  const handlePreloadSubmit = (preloadData: any) => { /* ... */ };


  const handleViewPlatenDetails = (record: any) => { // 更新函数名称
    setSelectedPreloadRecord(record);
    setShowPlatenDetail(true);
  };

  const handleUnload = (record: any) => {
    // 允许解绑的条件：状态为 'not-degassed' 或 'degassed'
    const canUnload = record.processStep === 'not-degassed' || record.processStep === 'degassed';

    if (!canUnload) {
      alert(`该装片记录状态为 "${getPreloadStatusBadge(record.processStep).props.children}"，无法解绑。`);
      return;
    }

    if (confirm(`确定要解绑预装片记录吗？\n记录ID: ${record.id}\n解绑后Platen和衬底片将恢复可用状态。`)) {
      unbindPreloadRecord(record.id); // 调用新的解绑函数
      alert('解绑成功！Platen和衬底片已恢复可用状态。');
    }
  };

  // 新增：处理除气操作
  const handleDegasOperation = (record: any) => {
    setSelectedRecordForDegas(record);
    setShowDegasModal(true);
  };

  // 新增：除气模态框提交回调
  const handleDegasSubmit = (recordId: string, degasTime: Date, degasOperatorId: string, degasOperatorName: string) => {
    updatePreloadRecordDegasInfo(recordId, degasTime, degasOperatorId, degasOperatorName);
    setShowDegasModal(false);
    setSelectedRecordForDegas(null);
    alert('除气信息已记录！');
  };
  

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
          <h2 className="text-2xl font-bold text-gray-900">MBE装片准备</h2>
          <p className="text-gray-600 mt-1">MBE设备预装片操作管理，衬底片和Platen绑定管理</p>
        </div>
        <button
          onClick={() => setShowPreloadModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          预装片
        </button>
      </div>

      {/* Preload Modal */}
      {showPreloadModal && (
        <PreloadModal
          onClose={() => setShowPreloadModal(false)}
          onSubmit={createPreloadRecord} // 直接传递 createPreloadRecord
          materials={materials}
          carriers={carriers}
        />
      )}

      {/* Degas Operation Modal */}
      {showDegasModal && selectedRecordForDegas && (
        <DegasOperationModal
          isOpen={showDegasModal}
          onClose={() => { setShowDegasModal(false); setSelectedRecordForDegas(null); }}
          record={selectedRecordForDegas}
          onSubmit={handleDegasSubmit}
        />
      )}

      {/* Platen Detail Modal */}
      {showPlatenDetail && selectedPreloadRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Platen 装片详情</h2> {/* 修改标题 */}
                <p className="text-sm text-gray-600 mt-1">记录ID: {selectedPreloadRecord.id} | Platen编号: {selectedPreloadRecord.platenId}</p> {/* 显示Platen编号 */}
              </div>
              <button
                onClick={() => setShowPlatenDetail(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">已绑定衬底片列表 ({selectedPreloadRecord.platenPositions?.length || 0}片)</h3> {/* 修改标题 */}
                  <div className="space-y-3">
                    {selectedPreloadRecord.platenPositions?.length > 0 ? (
                      selectedPreloadRecord.platenPositions.map((pos: any, index: number) => (
                        <div key={pos.id} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-blue-900">{pos.id}</span> {/* 显示槽位号 */}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-400">衬底片ID: <span className="text-sm text-gray-800">{pos.substrateId || 'N/A'}</span></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        暂无衬底片绑定信息。
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}


      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索记录ID、Platen ID或操作员..."
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
              {activeTab === 'not-fed' && (
                <>
                  <option value="not-degassed">未除气</option>
                  <option value="degassed">已除气</option>
                  <option value="unbound">已解绑</option>
                </>
              )}
              {activeTab === 'completed' && (
                <option value="completed">已投料</option>
              )}
            </select>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="rounded-xl p-1 flex flex-row space-x-2 mb-4 w-fit"> {/* Modified: removed flex, added flex-row, space-x-2, and w-fit */}
        <button
          onClick={() => { setActiveTab('not-fed'); setStatusFilter('all'); }} // 切换标签时重置筛选器
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'not-fed'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-700 hover:text-blue-700 border-transparent'
          }`}
        >
          未投料记录
        </button>
        <button
          onClick={() => { setActiveTab('completed'); setStatusFilter('all'); }} // 切换标签时重置筛选器
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'completed'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-700 hover:text-blue-700 border-transparent'
          }`}
        >
          已投料记录
        </button>
      </div>      
      
      {/* Preload Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">MBE装片准备记录</h3>
            <span className="text-sm text-gray-500">共 {filteredPreloadRecords.length} 条记录</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  记录ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platen编号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  衬底片信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作员
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  除气信息
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
              {filteredPreloadRecords.map((record) => {
                // const substrate = materials.find(m => m.id === record.substrateId); // This is not needed here
                // const boundPlatens = carriers.filter(c => record.platenPositions?.some(pos => pos.platenId === c.id)); // This is not needed here

                // 除气按钮的显示条件：未除气且状态为未除气
                const showDegasButton = !record.degasTime && record.processStep === 'not-degassed';
                // 解绑按钮的显示条件：状态为未除气或已除气
                const showUnbindButton = record.processStep === 'not-degassed' || record.processStep === 'degassed';

                return (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getPreloadStatusIcon(record.processStep)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{record.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.platenId}</div> {/* 显示Platen编号 */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewPlatenDetails(record)}
                        className="text-blue-600 hover:text-blue-900 font-medium text-sm flex items-center gap-1"
                      >
                        {record.platenPositions?.length || 0} 片
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.operatorName}</div>
                          <div className="text-sm text-gray-500">{record.operatorId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        <div>
                          <div className="text-sm text-gray-900">
                            {record.preloadTime?.toLocaleDateString('zh-CN')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {record.preloadTime?.toLocaleTimeString('zh-CN')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.degasTime ? (
                        <div className="flex items-center text-sm text-gray-500">
                          <Thermometer className="w-4 h-4 mr-1 text-orange-500" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {record.degasTime.toLocaleDateString('zh-CN')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {record.degasTime.toLocaleTimeString('zh-CN')} ({record.degasOperatorName})
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">未除气</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPreloadStatusBadge(record.processStep)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {showDegasButton && (
                          <button
                            onClick={() => handleDegasOperation(record)}
                            className="text-orange-600 hover:text-orange-900 flex items-center gap-1 text-sm font-medium"
                          >
                            <Thermometer className="w-4 h-4" />
                            除气
                          </button>
                        )}
                        {showUnbindButton && (
                          <button
                            onClick={() => handleUnload(record)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1 text-sm font-medium"
                          >
                            <Unlink className="w-4 h-4" />
                            解绑
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPreloadRecords.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无MBE装片准备记录</h3>
            <p className="mt-1 text-sm text-gray-500">点击"预装片"按钮开始创建绑定记录。</p>
          </div>
        )}
      </div>
    </div>
  );
};
