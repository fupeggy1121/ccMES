// src/components/MBE/DegasOperationModal.tsx
import React, { useState } from 'react';
import { X, Clock, User, CheckCircle } from 'lucide-react';
import { PreloadRecord } from '../../types';

interface DegasOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PreloadRecord;
  onSubmit: (recordId: string, degasTime: Date, degasOperatorId: string, degasOperatorName: string) => void;
}

export const DegasOperationModal: React.FC<DegasOperationModalProps> = ({
  isOpen,
  onClose,
  record,
  onSubmit,
}) => {
  const [degasTime, setDegasTime] = useState(new Date());
  const [degasOperatorName, setDegasOperatorName] = useState('张三'); // 默认当前登录用户
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!degasOperatorName.trim()) newErrors.degasOperatorName = '操作人不能为空';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(record.id, degasTime, 'OP-001', degasOperatorName); // 假设操作员ID为'OP-001'
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Clock className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">除气操作</h2>
              <p className="text-sm text-gray-600 mt-1">为Platen {record.platenId} 记录除气信息</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">除气时间</label>
              <input
                type="datetime-local"
                value={degasTime.toISOString().slice(0, 16)}
                onChange={(e) => setDegasTime(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                操作人 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={degasOperatorName}
                onChange={(e) => { setDegasOperatorName(e.target.value); setErrors(prev => ({ ...prev, degasOperatorName: '' })); }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.degasOperatorName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.degasOperatorName && <p className="text-red-500 text-xs mt-1">{errors.degasOperatorName}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            确认除气
          </button>
        </div>
      </div>
    </div>
  );
};
