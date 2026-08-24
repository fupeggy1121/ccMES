// src/components/BatchOperations/components/MoveOutOfStagingForm.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { BatchData } from '../types';

interface MoveOutOfStagingFormProps {
  selectedBatch: BatchData | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const MoveOutOfStagingForm: React.FC<MoveOutOfStagingFormProps> = ({
  selectedBatch,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="p-6 space-y-5">
      {/* 批次信息 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">批次信息</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-500 w-16 flex-shrink-0">批次编号</span>
            <span className="font-medium text-gray-900">{selectedBatch?.batchCode || '—'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-16 flex-shrink-0">产品编码</span>
            <span className="font-medium text-gray-900">{selectedBatch?.productCode || '—'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-16 flex-shrink-0">产品名称</span>
            <span className="font-medium text-gray-900">{selectedBatch?.productName || '—'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-16 flex-shrink-0">当前状态</span>
            <span className="font-medium text-amber-600">暂存</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-16 flex-shrink-0">所在站点</span>
            <span className="font-medium text-gray-900">{selectedBatch?.stationName || '—'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-16 flex-shrink-0">总数量</span>
            <span className="font-medium text-gray-900">{selectedBatch?.totalQty ?? '—'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-16 flex-shrink-0">良品数</span>
            <span className="font-medium text-green-700">{selectedBatch?.goodQty ?? '—'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-500 w-16 flex-shrink-0">不良数</span>
            <span className="font-medium text-red-600">{selectedBatch?.defectQty ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 leading-relaxed">
          确认后，批次 <strong>{selectedBatch?.batchCode}</strong> 将从暂存区移出，
          恢复为在制状态，可在<strong>「在制批次」标签页</strong>中继续操作。
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end space-x-3 pt-2 border-t">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          className="px-6 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
        >
          确认移出
        </button>
      </div>
    </div>
  );
};

export default MoveOutOfStagingForm;
