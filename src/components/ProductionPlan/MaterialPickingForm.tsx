// src/components/ProductionPlan/MaterialPickingForm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, Package, Calculator, FileText, AlertCircle, CheckCircle, Minus, Plus, List, ChevronLeft, ChevronRight, Warehouse, Eye } from 'lucide-react';
import { BOMItem, PickedMaterialBatch } from '../../types';
import { CreatePickingRequestModal } from './CreatePickingRequestModal';
import { InboundMaterialModal } from './InboundMaterialModal';
import { IncomingMaterialParamsModal } from './IncomingMaterialParamsModal';
import { ProcessStation } from '../../services/processRouteService'; // 导入 ProcessStation 接口

interface BOMPickingItem extends BOMItem {
  requestedQuantity: number;
  availableQuantity: number;
  pickingQuantity: number;
  alreadyPickedQuantity: number;
}

interface MaterialPickingFormProps {
  workOrderId: string;
  workOrderNumber: string;
  bomItems: BOMItem[];
  productType: string;
  targetQuantity: number;
  onClose: () => void;
  onSubmit: (workOrderId: string, workOrderNumber: string, requestedBy: string, bomPickingItems: BOMPickingItem[], notes?: string) => void;
  actualPickedBatches: PickedMaterialBatch[];
  currentProductProcessStations: ProcessStation[]; // 新增：接收工艺站点
  fetchAndSetProductProcessStations: (productSupabaseId: string) => void; // 新增：接收获取函数
}

export const MaterialPickingForm: React.FC<MaterialPickingFormProps> = ({
  workOrderId,
  workOrderNumber,
  bomItems,
  productType,
  targetQuantity,
  onClose,
  onSubmit,
  actualPickedBatches: allActualPickedBatches,
  currentProductProcessStations, // 使用传入的工艺站点
  fetchAndSetProductProcessStations, // 使用传入的获取函数
}) => {
  const [pickingItems, setPickingItems] = useState<BOMPickingItem[]>([]);

  const [showCreatePickingRequestModal, setShowCreatePickingRequestModal] = useState(false);
  const [showInboundMaterialModal, setShowInboundMaterialModal] = useState(false);
  const [showIncomingParamsModal, setShowIncomingParamsModal] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  const [activeProcessStationCode, setActiveProcessStationCode] = useState<string>('');

  // Pagination states for "已备料物料批次"
  const [pickedMaterialsCurrentPage, setPickedMaterialsCurrentPage] = useState(1);
  const pickedMaterialsItemsPerPage = 5; // 每页最多显示5行

  // 根据产品类型初始化工艺站点和备料项
  useEffect(() => {
    // currentProductProcessStations 已经从 props 传入，直接使用
    if (currentProductProcessStations.length > 0) {
      setActiveProcessStationCode(currentProductProcessStations[0].code);
    } else {
      setActiveProcessStationCode('');
    }

    // 根据传入的 bomItems 和 allActualPickedBatches 初始化 pickingItems
    const initialPickingItems: BOMPickingItem[] = bomItems.map(item => {
      const alreadyPickedQuantity = allActualPickedBatches
        .filter(batch => batch.workOrderId === workOrderId && batch.bomItemId === item.id && batch.inboundStatus === 'completed')
        .reduce((sum, batch) => sum + batch.pickedQuantity, 0);

      return {
        ...item,
        requestedQuantity: item.requiredQuantity,
        availableQuantity: item.stockQuantity, // 假设 stockQuantity 是总库存
        pickingQuantity: 0,
        alreadyPickedQuantity: alreadyPickedQuantity,
        processStationCode: item.processStationCode || ''
      };
    });
    setPickingItems(initialPickingItems);

  }, [productType, bomItems, workOrderId, allActualPickedBatches, currentProductProcessStations]); // 依赖项更新

  // Filter picked materials for the current work order and active process station
  const pickedMaterials = useMemo(() => {
    return allActualPickedBatches.filter(batch => {
      if (batch.workOrderId !== workOrderId) return false;
      // 如果能通过 bomItemId 找到 BOM 项，则按站点过滤；否则全部展示（兜底）
      const bomItem = pickingItems.find(item => item.id === batch.bomItemId);
      if (bomItem && activeProcessStationCode) {
        return bomItem.processStationCode === activeProcessStationCode;
      }
      return true;
    });
  }, [allActualPickedBatches, activeProcessStationCode, pickingItems, workOrderId]);

  // Pagination logic for picked materials
  const pickedMaterialsTotalPages = useMemo(() => Math.max(1, Math.ceil(pickedMaterials.length / pickedMaterialsItemsPerPage)), [pickedMaterials.length, pickedMaterialsItemsPerPage]);
  const pickedMaterialsIndexOfLastItem = useMemo(() => pickedMaterialsCurrentPage * pickedMaterialsItemsPerPage, [pickedMaterialsCurrentPage, pickedMaterialsItemsPerPage]);
  const pickedMaterialsIndexOfFirstItem = useMemo(() => pickedMaterialsIndexOfLastItem - pickedMaterialsItemsPerPage, [pickedMaterialsIndexOfLastItem, pickedMaterialsItemsPerPage]);
  const paginatedPickedMaterials = useMemo(() => pickedMaterials.slice(pickedMaterialsIndexOfFirstItem, pickedMaterialsIndexOfLastItem), [pickedMaterials, pickedMaterialsIndexOfFirstItem, pickedMaterialsIndexOfLastItem]);

  // Reset picked materials page when active process station changes
  useEffect(() => {
    setPickedMaterialsCurrentPage(1);
  }, [activeProcessStationCode]);

  // 计算总计已领料可生产产品数 (基于 alreadyPickedQuantity)
  const totalProducibleFromAlreadyPicked = useMemo(() => {
    return pickingItems.reduce((sum, item) => {
      const unitRequiredQuantity = targetQuantity > 0 ? item.requiredQuantity / targetQuantity : 0; // 使用 item.requiredQuantity
      return sum + (unitRequiredQuantity > 0 ? item.alreadyPickedQuantity / unitRequiredQuantity : 0);
    }, 0);
  }, [pickingItems, targetQuantity]);

  // 处理 CreatePickingRequestModal 提交
  const handleCreatePickingRequestSubmit = (
    workOrderId: string,
    workOrderNumber: string,
    requestedBy: string,
    bomPickingItems: BOMPickingItem[],
    notes?: string
  ) => {
    // 模拟生成新的已备料批次记录
    const newPickedBatches: PickedMaterialBatch[] = bomPickingItems.map(item => ({
      id: `PB-NEW-${Date.now()}-${item.id}-${Math.random().toString(36).substr(2, 5)}`,
      workOrderId: workOrderId, // 确保关联到工单ID
      bomItemId: item.id,
      materialCode: item.materialCode,
      materialName: item.materialName,
      specification: item.specification,
      unit: item.unit,
      pickedQuantity: item.pickingQuantity,
      batchNumber: `BATCH-REQ-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, // 模拟新的批次号
      supplier: item.supplier,
      pickedDate: new Date(),
      location: `WH-LOC-${Math.floor(Math.random() * 10)}`,
      inboundStatus: 'pending' // 新创建的批次默认为待入库状态
    }));

    // 这里不直接修改 local state，而是调用父组件的 onSubmit，让 useData 更新 allActualPickedBatches
    onSubmit(workOrderId, workOrderNumber, requestedBy, bomPickingItems, notes); // 调用父组件的 onSubmit
    setShowCreatePickingRequestModal(false); // 关闭新模态框
  };

  // 处理入库确认
  const handleInboundConfirm = (inboundDetails: { batchId: string; operator: string; inboundDate: Date; location: string; }[]) => {
    // 这里需要调用 useData 中的函数来更新 actualPickedBatches 的状态
    // 由于 useData 中没有直接的 updatePickedMaterialBatchStatus 函数，这里暂时模拟
    // 实际应用中，您会有一个类似 `updatePickedMaterialBatchStatus(batchId, 'completed', operator, inboundDate, location)` 的函数
    console.log('模拟入库确认:', inboundDetails);
    alert('物料已成功入库 (模拟操作)');
    
    // 重新获取数据或触发 useData 重新渲染以更新列表
    // 例如：可以调用一个从 useData 传递下来的刷新函数
    // 或者在 useData 的 updatePickedMaterialBatchStatus 中直接更新状态
    
    setSelectedBatchIds([]);
    setShowInboundMaterialModal(false);
  };

  // 处理批次选择
  const handleBatchSelect = (batchId: string, checked: boolean) => {
    if (checked) {
      setSelectedBatchIds(prev => [...prev, batchId]);
    } else {
      setSelectedBatchIds(prev => prev.filter(id => id !== batchId));
    }
  };

  // 处理全选/取消全选当前页
  const handleSelectAll = () => {
    const currentPageBatchIds = paginatedPickedMaterials
      .filter(batch => batch.inboundStatus !== 'completed')
      .map(batch => batch.id);
    
    if (currentPageBatchIds.every(id => selectedBatchIds.includes(id))) {
      // 如果当前页所有可选项都已选择，则取消选择当前页所有项
      setSelectedBatchIds(prev => prev.filter(id => !currentPageBatchIds.includes(id)));
    } else {
      // 否则选择当前页所有可选项
      setSelectedBatchIds(prev => {
        const newSelection = [...prev];
        currentPageBatchIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  // 获取入库状态徽章
  const getInboundStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          已入库
        </span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          已取消
        </span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          待入库
        </span>;
    }
  };

  // 获取站点名称
  const getProcessStationName = (code: string) => {
    const station = currentProductProcessStations.find(s => s.code === code);
    return station ? station.name : '未知站点';
  };

  // 检查是否可以选择入库（至少选择了一个非已入库状态的批次）
  const canInbound = selectedBatchIds.length > 0 &&
    selectedBatchIds.some(id => {
      const batch = allActualPickedBatches.find(b => b.id === id);
      return batch && batch.inboundStatus !== 'completed';
    });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-7xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">工单备料单</h2>
            <p className="text-sm text-gray-600 mt-1">工单号: {workOrderNumber} | 产品类型: {productType}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] flex">
          {/* 左侧：工艺站点列表 */}
          <div className="w-1/4 pr-4 border-r border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">工艺站点</h3>
            <div className="space-y-2">
              {currentProductProcessStations.length > 0 ? (
                currentProductProcessStations.map(station => (
                  <div
                    key={station.code}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      activeProcessStationCode === station.code
                        ? 'bg-blue-100 border border-blue-300'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveProcessStationCode(station.code)}
                  >
                    <div className="flex items-center">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{station.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">编码: {station.code}</p>
                      </div>
                      {activeProcessStationCode === station.code && (
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  该产品类型未定义工艺站点
                </div>
              )}
            </div>
          </div>

          {/* 右侧：领料表单内容 */}
          <div className="flex-1 pl-6">
            {/* 已备料物料批次 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <List className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">已备料物料批次 - {getProcessStationName(activeProcessStationCode)}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowInboundMaterialModal(true)}
                    disabled={!canInbound}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Warehouse className="w-4 h-4" />
                    入库 ({selectedBatchIds.length})
                  </button>
                  <button
                    onClick={() => setShowIncomingParamsModal(true)}
                    disabled={selectedBatchIds.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    查看来料参数
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={paginatedPickedMaterials.length > 0 &&
                            paginatedPickedMaterials
                              .filter(batch => batch.inboundStatus !== 'completed')
                              .every(batch => selectedBatchIds.includes(batch.id))}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
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
                        规格
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        数量
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        供应商
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        领取日期
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        入库状态
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedPickedMaterials.length > 0 ? (
                      paginatedPickedMaterials.map((batch) => (
                        <tr key={batch.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedBatchIds.includes(batch.id)}
                              onChange={() => handleBatchSelect(batch.id, !selectedBatchIds.includes(batch.id))}
                              disabled={batch.inboundStatus === 'completed'}
                              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{batch.batchNumber}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{batch.materialCode}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{batch.materialName}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{batch.specification}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{batch.pickedQuantity.toLocaleString()} {batch.unit}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{batch.supplier}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{batch.pickedDate.toLocaleDateString('zh-CN')}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {getInboundStatusBadge(batch.inboundStatus)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                          <List className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">当前站点暂无已备料物料批次</h3>
                          <p className="mt-1 text-sm text-gray-500">请点击"领料申请"按钮进行备料申请。</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination controls for picked materials */}
              {pickedMaterialsTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="text-sm text-gray-700">
                    显示 {pickedMaterialsIndexOfFirstItem + 1} 到 {Math.min(pickedMaterialsIndexOfLastItem, pickedMaterials.length)} 条，
                    共 {pickedMaterials.length} 条记录
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPickedMaterialsCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={pickedMaterialsCurrentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      上一页
                    </button>
                    <span className="text-sm text-gray-700">
                      第 {pickedMaterialsCurrentPage} 页 / 共 {pickedMaterialsTotalPages} 页
                    </span>
                    <button
                      onClick={() => setPickedMaterialsCurrentPage(prev => Math.min(pickedMaterialsTotalPages, prev + 1))}
                      disabled={pickedMaterialsCurrentPage === pickedMaterialsTotalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 flex items-center gap-1"
                    >
                      下一页
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 总计已领料可生产产品数 */}
            <div className="mt-4 flex justify-end mb-6">
              <div className="bg-blue-50 px-4 py-2 rounded-lg flex items-center">
                <span className="text-sm font-medium text-blue-900">
                  总计已领料可生产产品数: {totalProducibleFromAlreadyPicked.toFixed(2)} 个
                </span>
              </div>
            </div>

            {/* Process Flow Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <FileText className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-2">流程说明</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• 工单备料单用于为生产工单申请所需物料。</p>
                    <p>• 提交备料申请后，系统将自动生成出库申请。</p>
                    <p>• 库管人员审批出库申请。</p>
                    <p>• 审批通过后，库管人员创建出库单并输入具体物料批次。</p>
                    <p>• 完成物料出库流程。</p>
                    <p>• **注意：当前"总计已领料可生产产品数"的计算未考虑替代料，仅基于主料信息。**</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowCreatePickingRequestModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            领料申请
          </button>
        </div>
      </div>

      {/* Create Picking Request Modal */}
      {showCreatePickingRequestModal && (
        <CreatePickingRequestModal
          workOrderId={workOrderId}
          workOrderNumber={workOrderNumber}
          bomItems={bomItems}
          productType={productType}
          targetQuantity={targetQuantity}
          onClose={() => setShowCreatePickingRequestModal(false)}
          onSubmit={handleCreatePickingRequestSubmit}
          currentProductProcessStations={currentProductProcessStations} // 新增：传递工艺站点
          activeProcessStationCode={activeProcessStationCode}
          setActiveProcessStationCode={setActiveProcessStationCode}
          getProcessStationName={getProcessStationName}
        />
      )}

      {/* Inbound Material Modal */}
      {showInboundMaterialModal && (
        <InboundMaterialModal
          selectedBatches={allActualPickedBatches.filter(batch => selectedBatchIds.includes(batch.id))}
          onClose={() => setShowInboundMaterialModal(false)}
          onInboundConfirm={handleInboundConfirm}
        />
      )}

      {/* Incoming Material Params Modal */}
      {showIncomingParamsModal && (
        <IncomingMaterialParamsModal
          title={`来料参数 — ${getProcessStationName(activeProcessStationCode)}`}
          waferCodes={
            allActualPickedBatches
              .filter(batch => selectedBatchIds.includes(batch.id))
              .map(batch => batch.batchNumber)
          }
          onClose={() => setShowIncomingParamsModal(false)}
        />
      )}
    </div>
  );
};
