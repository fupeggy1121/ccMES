// src/components/FinishedProduct/OutboundConfirmationModal.tsx
import React, { useState, useEffect } from 'react';
import { FinishedProductBatch } from '../../types';
import { 
  CheckCircle, AlertCircle, Calendar, User, Truck, 
  Plus, Check, X
} from 'lucide-react';

interface OutboundConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBatches: string[];
  allFinishedProductBatches: FinishedProductBatch[];
  onConfirmOutbound: (batchIds: string[], operator: string, location: string) => boolean;
}

const OutboundConfirmationModal: React.FC<OutboundConfirmationModalProps> = ({
  isOpen,
  onClose,
  selectedBatches,
  allFinishedProductBatches,
  onConfirmOutbound
}) => {
  // 状态管理
  const [scannedBatchNumber, setScannedBatchNumber] = useState('');
  const [scannedBatches, setScannedBatches] = useState<FinishedProductBatch[]>([]);
  const [outboundOperator, setOutboundOperator] = useState('张三');
  const [outboundLocation, setOutboundLocation] = useState('');

  // 初始化出库位置
  useEffect(() => {
    if (isOpen) {
      setOutboundLocation('成品库');
      setScannedBatchNumber('');
      setScannedBatches([]);
    }
  }, [isOpen]);

  // 处理添加现场出库批次
  const handleAddScannedBatch = () => {
    if (!scannedBatchNumber.trim()) {
      alert('请输入批次号');
      return;
    }
    
    // 查找批次
    const batch = allFinishedProductBatches.find(b => 
      b.batchNumber === scannedBatchNumber.trim()
    );
    
    if (!batch) {
      alert('无效的批次号');
      return;
    }
    
    // 检查批次是否可以出库
    if (!(batch.status === 'approved' || batch.status === 'pending_outbound')) {
      alert('该批次状态不允许出库');
      return;
    }
    
    // 检查是否已添加到现场出库批次中
    if (scannedBatches.some(b => b.id === batch.id)) {
      alert('该批次已添加到现场出库列表中');
      return;
    }
    
    // 添加到现场出库批次
    setScannedBatches(prev => [...prev, batch]);
    setScannedBatchNumber('');
  };

  // 从现场出库批次中移除
  const handleRemoveScannedBatch = (batchId: string) => {
    setScannedBatches(prev => prev.filter(batch => batch.id !== batchId));
  };

  // 确认出库操作
  const confirmOutbound = () => {
    // 确定最终出库批次列表
    let finalBatchIds: string[] = [];
    
    // 情况一：selectedBatches 为空，用户仅通过扫描添加批次
    if (selectedBatches.length === 0) {
      if (scannedBatches.length === 0) {
        alert('请扫描或输入批次号添加出库批次');
        return;
      }
      // 直接使用扫描的批次
      finalBatchIds = scannedBatches.map(batch => batch.id);
    } 
    // 情况二：selectedBatches 不为空，执行核对逻辑
    else {
      const selectedBatchIds = [...selectedBatches].sort();
      const scannedBatchIds = scannedBatches.map(batch => batch.id).sort();
      
      // 检查批次是否一致
      const batchMatch = selectedBatchIds.length === scannedBatchIds.length && 
        selectedBatchIds.every((id, index) => id === scannedBatchIds[index]);
      
      // 如果批次不一致，提示用户确认
      if (!batchMatch) {
        const userConfirmed = window.confirm(
          `批次核对不一致！\n已选择${selectedBatchIds.length}个批次，现场出库${scannedBatchIds.length}个批次。\n是否继续出库？`
        );
        
        if (!userConfirmed) {
          return; // 用户取消出库
        }
      }
      
      // 使用扫描的批次（用户可能添加或移除了批次）
      finalBatchIds = scannedBatchIds;
    }
    
    // 确保最终出库批次列表不为空
    if (finalBatchIds.length === 0) {
      alert('出库批次列表为空，请添加出库批次');
      return;
    }
    
    // 执行出库操作
    const success = onConfirmOutbound(finalBatchIds, outboundOperator, outboundLocation);
    
    if (success) {
      onClose();
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

  // 获取已选择批次的详细信息
  const getSelectedBatchDetails = () => {
    return allFinishedProductBatches.filter(batch => selectedBatches.includes(batch.id));
  };

  // 检查是否可以确认出库
  const canConfirmOutbound = () => {
    // 如果操作员未填写，不能出库
    if (outboundOperator.trim() === '') {
      return false;
    }
    
    // 如果 selectedBatches 为空，需要 scannedBatches 不为空
    if (selectedBatches.length === 0) {
      return scannedBatches.length > 0;
    }
    
    // 如果 selectedBatches 不为空，需要至少有一个批次可以出库
    // (可能是 scannedBatches 或 selectedBatches)
    return scannedBatches.length > 0 || selectedBatches.length > 0;
  };

  // 获取核对状态文本和样式
  const getCheckStatus = () => {
    if (selectedBatches.length === 0) {
      return {
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: <CheckCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />,
        title: '扫描出库模式',
        message: '未从列表中选择批次，请在右侧扫描添加出库批次。'
      };
    }
    
    if (selectedBatches.length === scannedBatches.length) {
      return {
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />,
        title: '批次核对成功',
        message: `已选择${selectedBatches.length}个批次，现场出库${scannedBatches.length}个批次，数量一致。`
      };
    } else {
      return {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        icon: <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />,
        title: '批次核对中',
        message: `已选择${selectedBatches.length}个批次，现场出库${scannedBatches.length}个批次，数量不一致。`
      };
    }
  };

  if (!isOpen) return null;

  const checkStatus = getCheckStatus();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">成品出库核对</h3>
          <p className="text-gray-600 mb-6">
            {selectedBatches.length === 0 
              ? "请扫描添加要出库的成品批次" 
              : "请核对已选择的成品批次与现场出库批次是否一致"}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* 左侧栏：已选择批次 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-600" />
                {selectedBatches.length === 0 ? '已选择批次 (0个)' : `已选择批次 (${selectedBatches.length}个)`}
              </h4>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {selectedBatches.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    未从列表中选择批次，请在右侧扫描添加
                  </div>
                ) : (
                  getSelectedBatchDetails().map(batch => (
                    <div key={batch.id} className="border border-gray-200 rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-gray-900">{batch.batchNumber}</div>
                          <div className="text-sm text-gray-500">{batch.productName}</div>
                        </div>
                        <div className="text-sm text-gray-700">
                          <div className="font-medium">{batch.totalWafers} 片</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        <div>料号: {batch.productType}</div>
                        <div>审批时间: {formatDate(batch.completionTime)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* 右侧栏：现场出库批次 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                <Truck className="w-4 h-4 mr-2 text-blue-600" />
                现场出库批次 ({scannedBatches.length}个)
              </h4>
              
              <div className="mb-4">
                <div className="flex">
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="扫描或输入批次号"
                    value={scannedBatchNumber}
                    onChange={(e) => setScannedBatchNumber(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddScannedBatch()}
                  />
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 flex items-center"
                    onClick={handleAddScannedBatch}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    添加
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {scannedBatches.map(batch => (
                  <div key={batch.id} className="border border-gray-200 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-gray-900">{batch.batchNumber}</div>
                        <div className="text-sm text-gray-500">{batch.productName}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm text-gray-700">
                          <div className="font-medium">{batch.totalWafers} 片</div>
                        </div>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleRemoveScannedBatch(batch.id)}
                          title="移除"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <div>料号: {batch.productType}</div>
                      <div>添加时间: {new Date().toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
                
                {scannedBatches.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    请扫描或输入批次号添加现场出库批次
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 核对状态 */}
          <div className={`rounded-lg p-4 mb-6 ${checkStatus.bgColor} border ${checkStatus.borderColor}`}>
            <div className="flex">
              {checkStatus.icon}
              <div className="text-sm">
                <p className={`font-medium ${selectedBatches.length === 0 ? 'text-blue-700' : selectedBatches.length === scannedBatches.length ? 'text-green-700' : 'text-yellow-700'}`}>
                  {checkStatus.title}
                </p>
                <p className="mt-1 text-gray-600">
                  {checkStatus.message}
                  {selectedBatches.length > 0 && selectedBatches.length !== scannedBatches.length && (
                    <span> 如果批次不一致，确认出库时会提示您是否继续。</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          {/* 操作员和位置信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                操作员
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={outboundOperator}
                onChange={(e) => setOutboundOperator(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目标仓库位置
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
                value={outboundLocation}
                onChange={(e) => setOutboundLocation(e.target.value)}
                disabled
              >
                <option value="成品库">成品库</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">成品出库默认位置为成品库</p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              onClick={onClose}
            >
              取消
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${canConfirmOutbound() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              onClick={confirmOutbound}
              disabled={!canConfirmOutbound()}
            >
              确认出库
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutboundConfirmationModal;