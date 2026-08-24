// src/components/SubBatchDetailsModal.tsx
import React from 'react';
import { X } from 'lucide-react';
import { SubBatchData } from '../types';
import SubBatchDisplayTable from './SubBatchDisplayTable';

interface SubBatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subBatches: SubBatchData[];
  getStatusColor: (status: string) => string;
  masterBatchCode: string;
}

const SubBatchDetailsModal: React.FC<SubBatchDetailsModalProps> = ({
  isOpen,
  onClose,
  subBatches,
  getStatusColor,
  masterBatchCode,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* 模态框头部 */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            批次 {masterBatchCode} 的子批次详情
          </h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 模态框内容 */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="h-full">
            <SubBatchDisplayTable
              subBatches={subBatches}
              getStatusColor={getStatusColor}
            />
          </div>
        </div>

        {/* 模态框底部 */}
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubBatchDetailsModal;