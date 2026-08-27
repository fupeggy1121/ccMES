import React, { useState } from 'react';
import { X } from 'lucide-react';
import { batchHoldService } from '../../../services/batchHold/batchHoldService';
import { HoldReasonCategory } from '../../../services/batchHold/types';
import { mockOperators } from '../data/mockOperators';

const REASON_CATEGORIES: HoldReasonCategory[] = ['SPC异常', '客户投诉', '辅料问题', '其他'];

interface BatchHoldModalProps {
  isOpen: boolean;
  batchIds: string[];
  onClose: () => void;
  /** 扣留成功后回调，调用方负责刷新批次列表、清空勾选态等 */
  onConfirmed: () => void;
}

const BatchHoldModal: React.FC<BatchHoldModalProps> = ({ isOpen, batchIds, onClose, onConfirmed }) => {
  const [category, setCategory] = useState<HoldReasonCategory>('SPC异常');
  const [text, setText] = useState('');
  const [processEngineer, setProcessEngineer] = useState(mockOperators[0]?.name || '');
  const [qualityEngineer, setQualityEngineer] = useState(mockOperators[1]?.name || mockOperators[0]?.name || '');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const operator = mockOperators[0]?.name || '当前用户';

  const handleConfirm = async () => {
    if (!text.trim() || !processEngineer) return;
    setSubmitting(true);
    try {
      const created = await batchHoldService.holdBatches(
        batchIds,
        {
          category,
          text: text.trim(),
          source: 'manual',
          notifiedProcessEngineer: processEngineer,
          notifiedQualityEngineer: qualityEngineer || undefined,
        },
        operator
      );
      setText('');
      setCategory('SPC异常');
      if (created.length < batchIds.length) {
        alert(`已扣留 ${created.length}/${batchIds.length} 个批次，其余批次未能找到对应记录`);
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
          <h2 className="text-lg font-semibold text-gray-800">批量扣留</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700" aria-label="关闭">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">已选择 <span className="font-semibold text-gray-900">{batchIds.length}</span> 个批次，扣留操作无需审批，将立即生效。</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">扣留原因分类</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as HoldReasonCategory)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {REASON_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">扣留原因说明</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
              placeholder="请输入扣留原因..."
              className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">责任工艺工程师（必填）</label>
              <select
                value={processEngineer}
                onChange={e => setProcessEngineer(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">请选择</option>
                {mockOperators.map(op => (
                  <option key={op.id} value={op.name}>{op.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">知会质量工程师</label>
              <select
                value={qualityEngineer}
                onChange={e => setQualityEngineer(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">不指定</option>
                {mockOperators.map(op => (
                  <option key={op.id} value={op.name}>{op.name}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            操作人：{operator}。确认后将向责任工艺工程师自动生成一条"工程异常反馈"记录（本阶段仅结构化留存，不发送真实通知）。
          </p>
        </div>
        <div className="flex justify-end space-x-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!text.trim() || !processEngineer || submitting}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              text.trim() && processEngineer && !submitting
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? '提交中...' : '确认扣留'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchHoldModal;
