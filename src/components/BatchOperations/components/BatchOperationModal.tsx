import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BatchOperationModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** 宽度，默认 max-w-5xl */
  maxWidth?: string;
  /** 展示在标题右侧的附加内容（如步骤条） */
  headerRight?: React.ReactNode;
}

/**
 * 批次作业通用模态弹框
 * 提供遮罩 + 居中面板 + 可滚动内容区域。
 * 各操作表单内容直接作为 children 传入，无需改动表单本身的卡片结构。
 */
const BatchOperationModal: React.FC<BatchOperationModalProps> = ({
  isOpen,
  title,
  onClose,
  children,
  maxWidth = 'max-w-7xl',
  headerRight,
}) => {
  // 打开时锁定背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 py-6 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`relative w-full ${maxWidth} bg-white rounded-xl shadow-2xl flex flex-col`}>
        {/* 模态标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-4 min-w-0">
            <h2 className="text-lg font-semibold text-gray-800 flex-shrink-0">{title}</h2>
            {headerRight}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域（可滚动） */}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BatchOperationModal;
