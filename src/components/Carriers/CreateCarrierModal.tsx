// src/components/Carriers/CreateCarrierModal.tsx
import React, { useState } from 'react';
import { X, Truck, Package, Settings, CheckCircle, MapPin } from 'lucide-react'; // 导入 MapPin
import { Carrier, CarrierGroup } from '../../types';

interface CreateCarrierModalProps {
  onClose: () => void;
  onSubmit: (carrierData: Omit<Carrier, 'id' | 'createdAt' | 'updatedAt' | 'currentLoad' | 'loadedSmallBoxes' | 'cleaningCount'>) => void; // 更新 Omit 类型
  carrierGroups: CarrierGroup[];
}

export const CreateCarrierModal: React.FC<CreateCarrierModalProps> = ({ onClose, onSubmit, carrierGroups }) => {
  const [carrierId, setCarrierId] = useState('');
  const [type, setType] = useState<Carrier['type']>('wafer-basket');
  const [cleaningStatus, setCleaningStatus] = useState<Carrier['cleaningStatus']>('good'); // 重命名为 cleaningStatus
  const [loadStatus, setLoadStatus] = useState<Carrier['status']>('unoccupied'); // 重命名为 loadStatus
  const [currentLocation, setCurrentLocation] = useState('Zone A'); // 新增 currentLocation 状态
  const [carrierGroupId, setCarrierGroupId] = useState(''); // 新增：载具组ID状态
  const [errors, setErrors] = useState<Record<string, string>>({});

  const carrierTypes: { value: Carrier['type']; label: string }[] = [
    { value: 'wafer-basket', label: '片篮' },
    { value: 'platen', label: 'Platen' },
    { value: 'stacking-box', label: '堆叠盒' },
  ];

  const cleaningStatuses: { value: Carrier['cleaningStatus']; label: string }[] = [ // 重命名为 cleaningStatuses
    { value: 'good', label: '正常' },
    { value: 'needs-cleaning', label: '待清洗' },
    { value: 'in-cleaning', label: '清洗中' },
  ];

  const loadStatuses: { value: Carrier['status']; label: string }[] = [ // 重命名为 loadStatuses
    { value: 'unoccupied', label: '未占用' },
    { value: 'occupied', label: '已占用' },
  ];

  const locations = ['Zone A', 'Zone B', 'Zone C', 'Zone C-1', 'Zone D', 'MBE-1', 'MBE-2', 'CVD-1', 'CVD-2']; // 更多位置选项

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!carrierId.trim()) newErrors.carrierId = '载具ID不能为空';
    if (!type) newErrors.type = '请选择载具模型';
    if (!cleaningStatus) newErrors.cleaningStatus = '请选择清洗状态'; // 更新验证
    if (!loadStatus) newErrors.loadStatus = '请选择占用状态'; // 更新验证
    if (!currentLocation) newErrors.currentLocation = '请选择当前位置'; // 新增验证
    if (!carrierGroupId) newErrors.carrierGroupId = '请选择载具组'; // 确保这里引用的是状态变量
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        carrierId,
        type,
        cleaningStatus, // 传递 cleaningStatus
        status: loadStatus, // 传递 loadStatus
        currentLocation, // 传递 currentLocation
        carrierGroupId, // 传递 carrierGroupId
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
            <Truck className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">创建新载具</h2>
              <p className="text-sm text-gray-600 mt-1">填写载具详细信息</p>
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
                载具ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={carrierId}
                onChange={(e) => { setCarrierId(e.target.value); setErrors(prev => ({ ...prev, carrierId: '' })); }}
                placeholder="请输入载具ID"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.carrierId ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.carrierId && <p className="text-red-500 text-xs mt-1">{errors.carrierId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                载具模型 <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => { setType(e.target.value as Carrier['type']); setErrors(prev => ({ ...prev, type: '' })); }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.type ? 'border-red-500' : 'border-gray-300'}`}
              >
                {carrierTypes.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
            </div>

            {/* 载具组选择组件 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                载具组 <span className="text-red-500">*</span>
              </label>
              <select
                value={carrierGroupId} // 绑定状态变量
                onChange={(e) => { setCarrierGroupId(e.target.value); setErrors(prev => ({ ...prev, carrierGroupId: '' })); }} // 更新状态
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.carrierGroupId ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">请选择载具组</option>
                {(carrierGroups || []).map(group => (
                  <option key={group.id} value={group.id}>{group.groupName}</option>
                ))}
              </select>
              {errors.carrierGroupId && <p className="text-red-500 text-xs mt-1">{errors.carrierGroupId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                清洗状态 <span className="text-red-500">*</span>
              </label>
              <select
                value={cleaningStatus} // 使用 cleaningStatus
                onChange={(e) => { setCleaningStatus(e.target.value as Carrier['cleaningStatus']); setErrors(prev => ({ ...prev, cleaningStatus: '' })); }} // 更新状态和验证
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.cleaningStatus ? 'border-red-500' : 'border-gray-300'}`}
              >
                {cleaningStatuses.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {errors.cleaningStatus && <p className="text-red-500 text-xs mt-1">{errors.cleaningStatus}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                占用状态 <span className="text-red-500">*</span>
              </label>
              <select
                value={loadStatus} // 使用 loadStatus
                onChange={(e) => { setLoadStatus(e.target.value as Carrier['status']); setErrors(prev => ({ ...prev, loadStatus: '' })); }} // 更新状态和验证
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.loadStatus ? 'border-red-500' : 'border-gray-300'}`}
              >
                {loadStatuses.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {errors.loadStatus && <p className="text-red-500 text-xs mt-1">{errors.loadStatus}</p>}
            </div>

            {/* 新增：当前位置字段 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                当前位置 <span className="text-red-500">*</span>
              </label>
              <select
                value={currentLocation}
                onChange={(e) => { setCurrentLocation(e.target.value); setErrors(prev => ({ ...prev, currentLocation: '' })); }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.currentLocation ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">请选择位置</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              {errors.currentLocation && <p className="text-red-500 text-xs mt-1">{errors.currentLocation}</p>}
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
            创建载具
          </button>
        </div>
      </div>
    </div>
  );
};