// src/components/ProductionPlan/CreatePickingRequestModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, Package, Calculator, FileText, AlertCircle, CheckCircle, Minus, Plus, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { BOMItem } from '../../types';
import { ProcessStation } from '../../services/processRouteService'; // 导入 ProcessStation 接口

interface BOMPickingItem extends BOMItem {
  requestedQuantity: number;
  availableQuantity: number;
  pickingQuantity: number;
}

interface CreatePickingRequestModalProps {
  workOrderId: string;
  workOrderNumber: string;
  bomItems: BOMItem[];
  productType: string;
  targetQuantity: number;
  onClose: () => void;
  onSubmit: (workOrderId: string, workOrderNumber: string, requestedBy: string, bomPickingItems: BOMPickingItem[], notes?: string) => void;
  // 传递工艺站点数据和相关函数
  currentProductProcessStations: ProcessStation[]; // 接收当前产品工艺站点列表
  activeProcessStationCode: string;
  setActiveProcessStationCode: (code: string) => void;
  getProcessStationName: (code: string) => string;
}

export const CreatePickingRequestModal: React.FC<CreatePickingRequestModalProps> = ({
  workOrderId,
  workOrderNumber,
  bomItems,
  productType,
  targetQuantity,
  onClose,
  onSubmit,
  currentProductProcessStations, // 使用传入的工艺站点
  activeProcessStationCode,
  setActiveProcessStationCode,
  getProcessStationName,
}) => {
  const [requestedBy, setRequestedBy] = useState('张三');
  const [notes, setNotes] = useState('');
  const [pickingItems, setPickingItems] = useState<BOMPickingItem[]>(
    bomItems.map(item => ({
      ...item,
      requestedQuantity: item.requiredQuantity,
      availableQuantity: item.stockQuantity,
      pickingQuantity: 0, // 初始本次领料数量为0
      processStationCode: item.processStationCode || ''
    }))
  );

  // 根据当前选中的工艺站点过滤BOM物料
  const displayedPickingItems = activeProcessStationCode
    ? pickingItems.filter(item => item.processStationCode === activeProcessStationCode)
    : pickingItems;

  const updatePickingQuantity = (itemId: string, quantity: number) => {
    setPickingItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const maxPicking = Math.min(item.availableQuantity, item.requestedQuantity);
        const validQuantity = Math.max(0, Math.min(quantity, maxPicking));
        return { ...item, pickingQuantity: validQuantity };
      }
      return item;
    }));
  };

  const adjustQuantity = (itemId: string, delta: number) => {
    const item = pickingItems.find(i => i.id === itemId);
    if (item) {
      updatePickingQuantity(itemId, item.pickingQuantity + delta);
    }
  };

  const getTotalAmount = () => {
    return pickingItems.reduce((sum, item) => sum + (item.pickingQuantity * item.unitPrice), 0);
  };

  // 计算总计本次领料可生产产品数 (基于 pickingQuantity)
  const totalProducibleFromThisPicking = useMemo(() => {
    return pickingItems.reduce((sum, item) => {
      const unitRequiredQuantity = targetQuantity > 0 ? item.requestedQuantity / targetQuantity : 0;
      return sum + (unitRequiredQuantity > 0 ? item.pickingQuantity / unitRequiredQuantity : 0);
    }, 0);
  }, [pickingItems, targetQuantity]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!requestedBy.trim()) {
      newErrors.requestedBy = '申请人不能为空';
    }
    const hasPickingQuantity = pickingItems.some(item => item.pickingQuantity > 0);
    if (!hasPickingQuantity) {
      newErrors.pickingItems = '请至少选择一项物料进行领料';
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const validItems = pickingItems.filter(item => item.pickingQuantity > 0);
      onSubmit(workOrderId, workOrderNumber, requestedBy, validItems, notes || undefined);
      onClose();
    } else {
      alert('请检查表单填写，确保所有必填项已填写且至少选择一项物料进行领料。');
    }
  };

  const canSubmit = pickingItems.some(item => item.pickingQuantity > 0) && requestedBy.trim();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-7xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">领料申请</h2>
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
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">申请人</label>
                <input
                  type="text"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">申请日期</label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString('zh-CN')}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            {/* BOM Items Table */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-4">
                <Package className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  物料清单 - {getProcessStationName(activeProcessStationCode)}
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">
                        物料编码
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        物料名称
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        规格
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        单位
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        需求数量
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        本次领料数量
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        单价
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">
                        小计
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayedPickingItems.length > 0 ? (
                      displayedPickingItems.map((item) => {
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.materialCode}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.materialName}</div>
                              <div className="text-xs text-gray-500">{item.supplier}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.specification}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.unit}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.requestedQuantity.toLocaleString()}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => adjustQuantity(item.id, -1)}
                                  disabled={item.pickingQuantity <= 0}
                                  className="p-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  max={Math.min(item.availableQuantity, item.requestedQuantity)}
                                  value={item.pickingQuantity}
                                  onChange={(e) => updatePickingQuantity(item.id, parseInt(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                  onClick={() => adjustQuantity(item.id, 1)}
                                  disabled={item.pickingQuantity >= Math.min(item.availableQuantity, item.requestedQuantity)}
                                  className="p-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">¥{item.unitPrice.toFixed(2)}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                ¥{(item.pickingQuantity * item.unitPrice).toFixed(2)}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          <List className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">当前站点暂无物料</h3>
                          <p className="mt-1 text-sm text-gray-500">请选择其他工艺站点或检查BOM配置。</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Amount and new statistics */}
              <div className="mt-4 flex justify-end">
                <div className="bg-blue-50 px-4 py-2 rounded-lg flex items-center space-x-4">
                  <div className="flex items-center mr-4">
                    <span className="text-sm font-medium text-blue-900">
                      总计本次领料可生产产品数: {totalProducibleFromThisPicking.toFixed(2)} 个
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-blue-900">
                      总金额: ¥{getTotalAmount().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">备注说明</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="请输入备注信息（可选）"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
                    <p>• **注意：当前"总计本次领料可生产产品数"的计算未考虑替代料，仅基于主料信息。**</p>
                    <p>• **本次领料数量的上限为：min(当前可用库存, 工单需求量)。**</p>
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
    </div>
  );
};
