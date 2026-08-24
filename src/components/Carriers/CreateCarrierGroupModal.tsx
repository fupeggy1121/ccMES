// src/components/Carriers/CreateCarrierGroupModal.tsx
import React, { useState } from 'react';
import { X, Box, CheckCircle, Settings } from 'lucide-react';
import { CarrierGroup } from '../../types';

interface CreateCarrierGroupModalProps {
  onClose: () => void;
  onSubmit: (groupData: Omit<CarrierGroup, 'id' | 'carrierCount' | 'carrierIds' | 'status' | 'createdBy' | 'createdAt' | 'updatedAt'>) => void;
}

export const CreateCarrierGroupModal: React.FC<CreateCarrierGroupModalProps> = ({ onClose, onSubmit }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [maintenanceCycle, setMaintenanceCycle] = useState<number | ''>('');
  const [maintenanceCycleUnit, setMaintenanceCycleUnit] = useState('天'); // Default unit
  const [errors, setErrors] = useState<Record<string, string>>({});

  const maintenanceUnits = ['天', '周', '月', '年'];
  const groupTypes = ['production', 'maintenance', 'storage']; // Mock group types

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!groupName.trim()) newErrors.groupName = '载具组名称不能为空';
    if (!description.trim()) newErrors.description = '描述不能为空';
    if (maintenanceCycle !== '' && (isNaN(Number(maintenanceCycle)) || Number(maintenanceCycle) <= 0)) {
      newErrors.maintenanceCycle = '保养周期必须是大于0的数字';
    }
    if (maintenanceCycle !== '' && !maintenanceCycleUnit) {
      newErrors.maintenanceCycleUnit = '请选择保养周期单位';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        groupName,
        description,
        groupType: 'production', // Default to production
        maintenanceCycle: maintenanceCycle === '' ? undefined : Number(maintenanceCycle),
        maintenanceCycleUnit: maintenanceCycle === '' ? undefined : maintenanceCycleUnit,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Box className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">新建载具组</h2>
              <p className="text-sm text-gray-600 mt-1">填写载具组详细信息</p>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                载具组名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => { setGroupName(e.target.value); setErrors(prev => ({ ...prev, groupName: '' })); }}
                placeholder="请输入载具组名称"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.groupName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.groupName && <p className="text-red-500 text-xs mt-1">{errors.groupName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); setErrors(prev => ({ ...prev, description: '' })); }}
                placeholder="请输入载具组描述"
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  保养周期
                </label>
                <input
                  type="number"
                  value={maintenanceCycle}
                  onChange={(e) => { setMaintenanceCycle(e.target.value === '' ? '' : Number(e.target.value)); setErrors(prev => ({ ...prev, maintenanceCycle: '' })); }}
                  placeholder="请输入保养周期"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.maintenanceCycle ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.maintenanceCycle && <p className="text-red-500 text-xs mt-1">{errors.maintenanceCycle}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  周期单位
                </label>
                <select
                  value={maintenanceCycleUnit}
                  onChange={(e) => { setMaintenanceCycleUnit(e.target.value); setErrors(prev => ({ ...prev, maintenanceCycleUnit: '' })); }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.maintenanceCycleUnit ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={maintenanceCycle === ''}
                >
                  {maintenanceUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                {errors.maintenanceCycleUnit && <p className="text-red-500 text-xs mt-1">{errors.maintenanceCycleUnit}</p>}
              </div>
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
            创建载具组
          </button>
        </div>
      </div>
    </div>
  );
};
