import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Package, Calendar, User, ArrowRight, MapPin, Plus, Trash2 } from 'lucide-react';
import { PickedMaterialBatch, ProductionOrder } from '../../types';
import { MaterialBatchSelectionModal } from './MaterialBatchSelectionModal';

// 定义工艺站点接口
interface ProcessStation {
  code: string;
  name: string;
  description?: string;
}

interface WorkOrderMaterialTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceWorkOrder: ProductionOrder;
  productionOrders: ProductionOrder[];
  actualPickedBatches: PickedMaterialBatch[];
  onTransferSubmit: (
    sourceWorkOrderId: string,
    batchIdsToTransfer: string[],
    targetWorkOrderId: string,
    targetLocation: string,
    transferringOperator: string
  ) => void;
}

// 物料转移行数据类型
interface MaterialTransferRow {
  id: string;
  processStationCode: string;
  materialCode: string;
  materialName: string;
  transferQuantity: number;
  selectedBatches: PickedMaterialBatch[];
}

export const WorkOrderMaterialTransferModal: React.FC<WorkOrderMaterialTransferModalProps> = ({
  isOpen,
  onClose,
  sourceWorkOrder,
  productionOrders,
  actualPickedBatches,
  onTransferSubmit
}) => {
  const [materialsToTransfer, setMaterialsToTransfer] = useState<MaterialTransferRow[]>([]);
  const [targetWorkOrderId, setTargetWorkOrderId] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [transferringOperator, setTransferringOperator] = useState('');
  const [notes, setNotes] = useState('');
  
  // 新增状态管理
  const [showBatchSelectionModal, setShowBatchSelectionModal] = useState(false);
  const [currentMaterialRowIndex, setCurrentMaterialRowIndex] = useState<number>(-1);
  const [availableBatchesForCurrentMaterial, setAvailableBatchesForCurrentMaterial] = useState<PickedMaterialBatch[]>([]);
  const [initialSelectedBatchIds, setInitialSelectedBatchIds] = useState<string[]>([]);

  // 线边仓位置选项
  const locationOptions = [
    '线边仓-A区',
    '线边仓-B区', 
    '线边仓-C区',
    '线边仓-D区',
    '线边仓-临时区',
    '线边仓-待检区'
  ];

  // 根据产品类型定义工艺站点
  const getProcessStationsByProductType = (productType: string): ProcessStation[] => {
    // 这里可以根据不同的产品类型返回不同的工艺站点
    // 暂时返回通用的工艺站点
    return [
      { code: 'STATION-001', name: '清洗站点' },
      { code: 'STATION-002', name: '沉积站点' },
      { code: 'STATION-003', name: '蚀刻站点' },
      { code: 'STATION-004', name: '测试站点' },
      { code: 'STATION-005', name: '包装站点' }
    ];
  };

  // 获取源工单可用的物料编码
  const getAvailableMaterialCodes = (processStationCode: string): string[] => {
    const availableBatches = actualPickedBatches.filter(batch => 
      batch.workOrderId === sourceWorkOrder.id && 
      batch.inboundStatus === 'completed'
    );
    
    // 根据工艺站点过滤物料（这里可以根据实际业务逻辑调整）
    const materialCodes = Array.from(new Set(availableBatches.map(batch => batch.materialCode)));
    return materialCodes;
  };

  // 根据物料编码获取物料名称
  const getMaterialNameByCode = (materialCode: string): string => {
    const batch = actualPickedBatches.find(batch => batch.materialCode === materialCode);
    return batch?.materialName || '未知物料';
  };

  // 过滤可用的目标工单
  const targetWorkOrders = productionOrders.filter(order => 
    order.id !== sourceWorkOrder.id && 
    (order.status === 'scheduled' || order.status === 'partially scheduled')
  );

  // 重置表单
  const resetForm = () => {
    setMaterialsToTransfer([]);
    setTargetWorkOrderId('');
    setTargetLocation('');
    setTransferringOperator('');
    setNotes('');
    setShowBatchSelectionModal(false);
    setCurrentMaterialRowIndex(-1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 添加新的物料行
  const handleAddRow = () => {
    const newRow: MaterialTransferRow = {
      id: `row-${Date.now()}`,
      processStationCode: '',
      materialCode: '',
      materialName: '',
      transferQuantity: 0,
      selectedBatches: []
    };
    setMaterialsToTransfer(prev => [...prev, newRow]);
  };

  // 删除物料行
  const handleRemoveRow = (rowId: string) => {
    setMaterialsToTransfer(prev => prev.filter(row => row.id !== rowId));
  };

  // 处理工艺站点变更
  const handleProcessStationChange = (rowIndex: number, stationCode: string) => {
    setMaterialsToTransfer(prev => prev.map((row, index) => {
      if (index === rowIndex) {
        return {
          ...row,
          processStationCode: stationCode,
          materialCode: '', // 重置物料编码
          materialName: '', // 重置物料名称
          transferQuantity: 0, // 重置转移数量
          selectedBatches: [] // 重置选中的批次
        };
      }
      return row;
    }));
  };

  // 处理物料编码变更
  const handleMaterialCodeChange = (rowIndex: number, materialCode: string) => {
    setMaterialsToTransfer(prev => prev.map((row, index) => {
      if (index === rowIndex) {
        return {
          ...row,
          materialCode,
          materialName: getMaterialNameByCode(materialCode)
        };
      }
      return row;
    }));
  };

  // 打开批次选择模态框
  const handleOpenBatchSelection = (rowIndex: number) => {
    const row = materialsToTransfer[rowIndex];
    if (!row.processStationCode || !row.materialCode) {
      alert('请先选择工艺站点和物料编码');
      return;
    }

    // 获取可用的批次
    const availableBatches = actualPickedBatches.filter(batch => 
      batch.workOrderId === sourceWorkOrder.id &&
      batch.materialCode === row.materialCode &&
      batch.inboundStatus === 'completed'
    );

    if (availableBatches.length === 0) {
      alert('当前物料没有可用的批次');
      return;
    }

    setAvailableBatchesForCurrentMaterial(availableBatches);
    setInitialSelectedBatchIds(row.selectedBatches.map(batch => batch.id));
    setCurrentMaterialRowIndex(rowIndex);
    setShowBatchSelectionModal(true);
  };

  // 处理批次选择确认
  const handleBatchSelectionConfirm = (selectedBatchIds: string[]) => {
    if (currentMaterialRowIndex === -1) return;

    const selectedBatches = availableBatchesForCurrentMaterial.filter(batch => 
      selectedBatchIds.includes(batch.id)
    );

    const transferQuantity = selectedBatches.reduce((sum, batch) => sum + batch.pickedQuantity, 0);

    setMaterialsToTransfer(prev => prev.map((row, index) => {
      if (index === currentMaterialRowIndex) {
        return {
          ...row,
          selectedBatches,
          transferQuantity
        };
      }
      return row;
    }));

    setShowBatchSelectionModal(false);
    setCurrentMaterialRowIndex(-1);
  };

  // 提交转移申请
  const handleSubmit = () => {
    // 验证表单
    if (materialsToTransfer.length === 0) {
      alert('请至少添加一个物料转移行');
      return;
    }

    for (const row of materialsToTransfer) {
      if (!row.processStationCode || !row.materialCode || row.selectedBatches.length === 0) {
        alert('请完善所有物料行的信息并选择批次');
        return;
      }
    }

    if (!targetWorkOrderId) {
      alert('请选择目标工单');
      return;
    }

    if (!targetLocation) {
      alert('请选择目标位置');
      return;
    }

    if (!transferringOperator.trim()) {
      alert('请输入转移操作员');
      return;
    }

    // 收集所有选中的批次ID
    const allBatchIds = materialsToTransfer.flatMap(row => 
      row.selectedBatches.map(batch => batch.id)
    );

    onTransferSubmit(
      sourceWorkOrder.id,
      allBatchIds,
      targetWorkOrderId,
      targetLocation,
      transferringOperator
    );
    
    alert(`物料转移申请已提交！\n共转移 ${allBatchIds.length} 个物料批次`);
    handleClose();
  };

  // 获取所有选中批次的总数量
  const getAllSelectedBatchesTotal = () => {
    return materialsToTransfer.reduce((sum, row) => sum + row.transferQuantity, 0);
  };

  if (!isOpen) return null;

  const processStations = getProcessStationsByProductType(sourceWorkOrder.productName);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ArrowRight className="w-6 h-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">工单物料转移</h2>
              <p className="text-sm text-gray-500 mt-1">
                从工单: {sourceWorkOrder.orderNumber} | 产品: {sourceWorkOrder.productName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* 目标工单信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">目标工单信息</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="targetWorkOrder" className="block text-sm font-medium text-gray-700 mb-1">
                  选择目标工单 <span className="text-red-500">*</span>
                </label>
                <select
                  id="targetWorkOrder"
                  value={targetWorkOrderId}
                  onChange={(e) => setTargetWorkOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">请选择目标工单</option>
                  {targetWorkOrders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber} - {order.productType} ({order.assignedOperator})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="transferringOperator" className="block text-sm font-medium text-gray-700 mb-1">
                  转移操作员 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="transferringOperator"
                  value={transferringOperator}
                  onChange={(e) => setTransferringOperator(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="请输入操作员姓名"
                />
              </div>
              
              <div>
                <label htmlFor="targetLocation" className="block text-sm font-medium text-gray-700 mb-1">
                  目标位置 <span className="text-red-500">*</span>
                </label>
                <select
                  id="targetLocation"
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">请选择目标位置</option>
                  {locationOptions.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="transferDate" className="block text-sm font-medium text-gray-700 mb-1">
                  转移日期
                </label>
                <div className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{new Date().toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                转移原因/备注
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="请输入转移原因或备注信息..."
              />
            </div>              
            </div>   

          </div>          

          {/* 物料转移表格 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">物料转移明细</h3>
              <button
                onClick={handleAddRow}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                物料
              </button>
            </div>

            {materialsToTransfer.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">暂无物料转移明细</p>
                <p className="text-xs text-gray-400 mt-1">点击"添加行"按钮开始添加物料</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        工艺站点
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        物料编码
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        物料名称
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        转移数量
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {materialsToTransfer.map((row, index) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <select
                            value={row.processStationCode}
                            onChange={(e) => handleProcessStationChange(index, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">选择工艺站点</option>
                            {processStations.map(station => (
                              <option key={station.code} value={station.code}>
                                {station.name} ({station.code})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={row.materialCode}
                            onChange={(e) => handleMaterialCodeChange(index, e.target.value)}
                            disabled={!row.processStationCode}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          >
                            <option value="">选择物料编码</option>
                            {row.processStationCode && 
                              getAvailableMaterialCodes(row.processStationCode).map(materialCode => (
                                <option key={materialCode} value={materialCode}>
                                  {materialCode}
                                </option>
                              ))
                            }
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {row.materialName || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {row.transferQuantity > 0 ? (
                              <>
                                {row.transferQuantity} 
                                <span className="text-xs text-gray-500 ml-1">
                                  ({row.selectedBatches.length}个批次)
                                </span>
                              </>
                            ) : (
                              '-'
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleOpenBatchSelection(index)}
                              disabled={!row.processStationCode || !row.materialCode}
                              className={`px-3 py-1 text-sm rounded ${
                                row.processStationCode && row.materialCode
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              +物料批次
                            </button>
                            <button
                              onClick={() => handleRemoveRow(row.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 统计信息 */}
          {materialsToTransfer.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-orange-700">
                  <Package className="w-5 h-5" />
                  <span className="font-medium">
                    已选择 {materialsToTransfer.length} 个物料类型，共 {getAllSelectedBatchesTotal()} 个物料单位
                  </span>
                </div>
                <div className="text-orange-700 font-medium">
                  总批次: {materialsToTransfer.reduce((sum, row) => sum + row.selectedBatches.length, 0)} 个
                </div>
              </div>
              <div className="mt-2 text-sm text-orange-600">
                <p>从: {sourceWorkOrder.orderNumber} → 到: {targetWorkOrderId ? targetWorkOrders.find(order => order.id === targetWorkOrderId)?.orderNumber : '未选择'}</p>
                <p>目标位置: {targetLocation || '未选择'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            共 {materialsToTransfer.length} 个物料转移行
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={materialsToTransfer.length === 0 || !targetWorkOrderId || !targetLocation || !transferringOperator.trim()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>确认转移</span>
            </button>
          </div>
        </div>

        {/* 批次选择模态框 */}
        {showBatchSelectionModal && currentMaterialRowIndex !== -1 && (
          <MaterialBatchSelectionModal
            isOpen={showBatchSelectionModal}
            onClose={() => setShowBatchSelectionModal(false)}
            onConfirm={handleBatchSelectionConfirm}
            availableBatchesForMaterial={availableBatchesForCurrentMaterial}
            initialSelectedBatchIds={initialSelectedBatchIds}
            materialCode={materialsToTransfer[currentMaterialRowIndex].materialCode}
            materialName={materialsToTransfer[currentMaterialRowIndex].materialName}
            processStationCode={materialsToTransfer[currentMaterialRowIndex].processStationCode}
          />
        )}
      </div>
    </div>
  );
};