// src/components/Auxiliary/AuxiliaryScrapModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Package, User, Calendar, Scan, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { AuxiliaryMaterial } from '../../types';
import AuxiliaryMaterialSelectionModal from './AuxiliaryMaterialSelectionModal';

interface AuxiliaryScrapItem {
  id: string; // AuxiliaryMaterial.id
  auxiliaryId: string;
  auxiliaryCode: string;
  auxiliaryName: string;
  instanceUniqueCode?: string;
  auxiliaryBatch?: string;
  quantityToScrap: number; // Quantity to scrap (for non-unique items)
  unit?: string;
}

interface AuxiliaryScrapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (scrapItems: AuxiliaryScrapItem[], notes?: string) => void;
  allAuxiliaryMaterials: AuxiliaryMaterial[]; // All available auxiliary materials
}

export const AuxiliaryScrapModal: React.FC<AuxiliaryScrapModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  allAuxiliaryMaterials,
}) => {
  const [scrapItems, setScrapItems] = useState<AuxiliaryScrapItem[]>([]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMaterialSelectionModal, setShowMaterialSelectionModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setScrapItems([]);
      setNotes('');
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (scrapItems.length === 0) newErrors.scrapItems = '请至少添加一项报废辅料';

    scrapItems.forEach((item, index) => {
      if (item.quantityToScrap <= 0) {
        newErrors[`itemQuantity-${index}`] = '报废数量必须大于0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(scrapItems, notes || undefined);
    }
  };

  const handleMaterialSelect = (selectedMaterial: AuxiliaryMaterial) => {
    if (scrapItems.some(item => item.auxiliaryId === selectedMaterial.auxiliaryId)) {
      alert('该辅料已在列表中');
      return;
    }

    setScrapItems(prev => [
      ...prev,
      {
        id: selectedMaterial.id,
        auxiliaryId: selectedMaterial.auxiliaryId,
        auxiliaryCode: selectedMaterial.auxiliaryCode,
        auxiliaryName: selectedMaterial.auxiliaryName,
        instanceUniqueCode: selectedMaterial.instanceUniqueCode,
        auxiliaryBatch: selectedMaterial.auxiliaryBatch,
        quantityToScrap: 1, // Default quantity
        unit: selectedMaterial.unit, // Assuming unit is part of AuxiliaryMaterial
      }
    ]);
    setShowMaterialSelectionModal(false);
  };

  const handleRemoveItem = (id: string) => {
    setScrapItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof AuxiliaryScrapItem, value: any) => {
    setScrapItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleScanUniqueCode = (itemId: string) => {
    const scannedCode = `INST-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    handleItemChange(itemId, 'instanceUniqueCode', scannedCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">辅料报废申请</h2>
              <p className="text-sm text-gray-600 mt-1">填写报废辅料信息</p>
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
        <div className="p-6 overflow-y-auto flex-1">
          {/* Auxiliary Materials List */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                申请报废清单 <span className="text-red-500">*</span>
              </h3>
              <button
                onClick={() => setShowMaterialSelectionModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加辅料
              </button>
            </div>
            {errors.scrapItems && <p className="text-red-500 text-xs mt-1 mb-2">{errors.scrapItems}</p>}

            <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">辅料编码</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">辅料名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">唯一码</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">批次号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">报废数量</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scrapItems.length > 0 ? (
                    scrapItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.auxiliaryCode}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.auxiliaryName}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={item.instanceUniqueCode || ''}
                              onChange={(e) => handleItemChange(item.id, 'instanceUniqueCode', e.target.value)}
                              placeholder="唯一码"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleScanUniqueCode(item.id)}
                              className="ml-2 p-1 rounded-lg hover:bg-gray-100"
                              title="扫码"
                            >
                              <Scan className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={item.auxiliaryBatch || ''}
                            onChange={(e) => handleItemChange(item.id, 'auxiliaryBatch', e.target.value)}
                            placeholder="批次号"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="1"
                            value={item.quantityToScrap}
                            onChange={(e) => handleItemChange(item.id, 'quantityToScrap', parseInt(e.target.value) || 0)}
                            className={`w-24 px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors[`itemQuantity-${index}`] ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {item.unit && <span className="ml-1 text-sm text-gray-600">{item.unit}</span>}
                          {errors[`itemQuantity-${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`itemQuantity-${index}`]}</p>}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">暂无报废辅料</h3>
                        <p className="mt-1 text-sm text-gray-500">请点击"添加辅料"按钮选择要报废的辅料。</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">备注说明</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="请输入备注信息（可选）"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            提交报废申请
          </button>
        </div>
      </div>

      {/* Auxiliary Material Selection Modal */}
      <AuxiliaryMaterialSelectionModal
        visible={showMaterialSelectionModal}
        onCancel={() => setShowMaterialSelectionModal(false)}
        onSelect={handleMaterialSelect}
        dataSource={allAuxiliaryMaterials.filter(mat => mat.status === 'active')} // Only allow scrapping active materials
      />
    </div>
  );
};
