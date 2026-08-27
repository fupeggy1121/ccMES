// src/components/BatchOperations/components/BatchReleaseModal.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { batchHoldService } from '../../../services/batchHold/batchHoldService';
import { mockOperators } from '../data/mockOperators';

interface BatchReleaseModalProps {
  isOpen: boolean;
  batchIds: string[];
  onClose: () => void;
  /** 释放成功后回调，调用方负责刷新数据、清空勾选态等 */
  onConfirmed: () => void;
}

const BatchReleaseModal: React.FC<BatchReleaseModalProps> = ({ isOpen, batchIds, onClose, onConfirmed }) => {
  const [approvalComment, setApprovalComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const operator = mockOperators[0]?.name || '当前用户';

  const handleConfirm = async () => {
    if (!approvalComment.trim()) return;
    setSubmitting(true);
    try {
      const released = await batchHoldService.releaseBatches(batchIds, approvalComment.trim(), operator);
      setApprovalComment('');
      if (released.length < batchIds.length) {
        alert(`已释放 ${released.length}/${batchIds.length} 个批次，其余批次当前无扣留记录`);
      }
      onConfirmed();
    } catch (error) {
      alert(`操作失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">批量释放</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700" aria-label="关闭">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">已选择 <span className="font-semibold text-gray-900">{batchIds.length}</span> 个批次。释放需填写审批意见/依据（如会议决议内容）。</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">审批意见 / 决议依据（必填）</label>
            <textarea
              value={approvalComment}
              onChange={e => setApprovalComment(e.target.value)}
              rows={4}
              placeholder="请输入审批意见，例如：8.20质量评审会决议，风险已排除..."
              className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <p className="text-xs text-gray-400">操作人：{operator}</p>
        </div>
        <div className="flex justify-end space-x-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!approvalComment.trim() || submitting}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              approvalComment.trim() && !submitting
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? '提交中...' : '确认释放'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchReleaseModal;
