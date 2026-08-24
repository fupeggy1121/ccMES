// src/components/Auxiliary/AddAuxiliaryMaterialModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Package, Hash, Settings } from 'lucide-react';
import { AuxiliaryMaterial } from '../../types';
import { mockEquipmentTree } from '../../data/mockEquipmentTree';

interface AddAuxiliaryMaterialModalProps {
  onClose: () => void;
  onSubmit: (materialData: Omit<AuxiliaryMaterial, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: AuxiliaryMaterial | null;
}

export const AddAuxiliaryMaterialModal: React.FC<AddAuxiliaryMaterialModalProps> = ({
  onClose,
  onSubmit,
  initialData,
}) => {
  const [auxiliaryBatch, setAuxiliaryBatch] = useState('');
  const [auxiliaryGroup, setAuxiliaryGroup] = useState('');
  const [auxiliaryId, setAuxiliaryId] = useState('');
  const [auxiliaryName, setAuxiliaryName] = useState('');
  const [auxiliaryDescription, setAuxiliaryDescription] = useState('');
  const [calculationMethod, setCalculationMethod] = useState('');
  const [initialLifetime, setInitialLifetime] = useState<number>(0);
  const [equipmentId, setEquipmentId] = useState('');
  const [isInstalled, setIsInstalled] = useState(false);
  const [auxiliaryCode, setAuxiliaryCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setAuxiliaryBatch(initialData.auxiliaryBatch);
      setAuxiliaryGroup(initialData.auxiliaryGroup);
      setAuxiliaryId(initialData.auxiliaryId);
      setAuxiliaryName(initialData.auxiliaryName);
      setAuxiliaryDescription(initialData.auxiliaryDescription);
      setCalculationMethod(initialData.calculationMethod);
      setInitialLifetime(initialData.initialLifetime);
      setEquipmentId(initialData.equipmentId || '');
      setIsInstalled(initialData.isInstalled);
      setAuxiliaryCode(initialData.auxiliaryCode || '');
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!auxiliaryBatch.trim()) newErrors.auxiliaryBatch = '辅料批号不能为空';
    if (!auxiliaryGroup.trim()) newErrors.auxiliaryGroup = '辅料组不能为空';
    if (!auxiliaryId.trim()) newErrors.auxiliaryId = '辅料ID不能为空';
    if (!auxiliaryName.trim()) newErrors.auxiliaryName = '辅料名称不能为空';
    if (!auxiliaryCode.trim()) newErrors.auxiliaryCode = '辅料代码不能为空';
    if (!calculationMethod.trim()) newErrors.calculationMethod = '计算方式不能为空';
    if (initialLifetime <= 0) newErrors.initialLifetime = '初始寿命值必须大于0';
    if (isInstalled && !equipmentId.trim()) newErrors.equipmentId = '如果已安装，设备ID不能为空';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        auxiliaryBatch,
        auxiliaryGroup,
        auxiliaryId,
        auxiliaryName,
        auxiliaryDescription,
        auxiliaryCode,
        calculationMethod,
        initialLifetime,
        currentWaferLot: null, // New materials start without processed lots
        subLot: null,
        consumptionBefore: null,
        consumptionAfter: null,
        equipmentId: equipmentId || null,
        isInstalled,
      });
    }
  };

  // Extract equipment IDs from mockEquipmentTree
  const extractEquipmentIds = (tree: any[]): string[] => {
    const ids: string[] = [];
    
    const traverse = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.type === 'equipment' && node.id) {
          ids.push(node.id);
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    
    traverse(tree);
    return ids;
  };

  const equipmentOptions = extractEquipmentIds(mockEquipmentTree);
  const auxiliaryGroupOptions = ['AAA', 'Glue', 'Grinding Wheel']; // Mock auxiliary groups
  const calculationMethodOptions = ['3 Wafer number', '8 days number', '1000 hours']; // Mock calculation methods

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Package className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{initialData ? '编辑辅料' : '添加新辅料'}</h2>
              <p className="text-sm text-gray-600 mt-1">填写辅料详细信息</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                辅料批号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={auxiliaryBatch}
                onChange={(e) => { setAuxiliaryBatch(e.target.value); setErrors(prev => ({ ...prev, auxiliaryBatch: '' })); }}
                placeholder="请输入辅料批号"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.auxiliaryBatch ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.auxiliaryBatch && <p className="text-red-500 text-xs mt-1">{errors.auxiliaryBatch}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                辅料组 <span className="text-red-500">*</span>
              </label>
              <select
                value={auxiliaryGroup}
                onChange={(e) => { setAuxiliaryGroup(e.target.value); setErrors(prev => ({ ...prev, auxiliaryGroup: '' })); }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.auxiliaryGroup ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">请选择辅料组</option>
                {auxiliaryGroupOptions.map(group => <option key={group} value={group}>{group}</option>)}
              </select>
              {errors.auxiliaryGroup && <p className="text-red-500 text-xs mt-1">{errors.auxiliaryGroup}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                辅料ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={auxiliaryId}
                onChange={(e) => { setAuxiliaryId(e.target.value); setErrors(prev => ({ ...prev, auxiliaryId: '' })); }}
                placeholder="请输入辅料ID"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.auxiliaryId ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.auxiliaryId && <p className="text-red-500 text-xs mt-1">{errors.auxiliaryId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                辅料代码 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={auxiliaryCode}
                onChange={(e) => { setAuxiliaryCode(e.target.value); setErrors(prev => ({ ...prev, auxiliaryCode: '' })); }}
                placeholder="请输入辅料代码"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.auxiliaryCode ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.auxiliaryCode && <p className="text-red-500 text-xs mt-1">{errors.auxiliaryCode}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                辅料名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={auxiliaryName}
                onChange={(e) => { setAuxiliaryName(e.target.value); setErrors(prev => ({ ...prev, auxiliaryName: '' })); }}
                placeholder="请输入辅料名称"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.auxiliaryName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.auxiliaryName && <p className="text-red-500 text-xs mt-1">{errors.auxiliaryName}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">辅料描述</label>
              <textarea
                value={auxiliaryDescription}
                onChange={(e) => setAuxiliaryDescription(e.target.value)}
                placeholder="请输入辅料描述"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                计算方式 <span className="text-red-500">*</span>
              </label>
              <select
                value={calculationMethod}
                onChange={(e) => { setCalculationMethod(e.target.value); setErrors(prev => ({ ...prev, calculationMethod: '' })); }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.calculationMethod ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">请选择计算方式</option>
                {calculationMethodOptions.map(method => <option key={method} value={method}>{method}</option>)}
              </select>
              {errors.calculationMethod && <p className="text-red-500 text-xs mt-1">{errors.calculationMethod}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                初始寿命值 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={initialLifetime}
                onChange={(e) => { setInitialLifetime(parseFloat(e.target.value) || 0); setErrors(prev => ({ ...prev, initialLifetime: '' })); }}
                placeholder="请输入初始寿命值"
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.initialLifetime ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.initialLifetime && <p className="text-red-500 text-xs mt-1">{errors.initialLifetime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                设备ID
              </label>
              <select
                value={equipmentId}
                onChange={(e) => { setEquipmentId(e.target.value); setErrors(prev => ({ ...prev, equipmentId: '' })); }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.equipmentId ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">请选择设备ID（可选）</option>
                {equipmentOptions.map(id => <option key={id} value={id}>{id}</option>)}
              </select>
              {errors.equipmentId && <p className="text-red-500 text-xs mt-1">{errors.equipmentId}</p>}
            </div>
            <div className="md:col-span-2 flex items-center mt-4">
              <input
                type="checkbox"
                id="isInstalled"
                checked={isInstalled}
                onChange={(e) => { 
                  setIsInstalled(e.target.checked); 
                  if (!e.target.checked) setEquipmentId(''); 
                  setErrors(prev => ({ ...prev, equipmentId: '' })); 
                }}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isInstalled" className="ml-2 block text-sm font-medium text-gray-900">
                是否已安装到设备
              </label>
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
            <Save className="w-4 h-4" />
            {initialData ? '保存修改' : '添加辅料'}
          </button>
        </div>
      </div>
    </div>
  );
};