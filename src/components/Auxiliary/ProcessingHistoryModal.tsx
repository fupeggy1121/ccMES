// src/components/Auxiliary/ProcessingHistoryModal.tsx
import React from 'react';
import { X, Clock, Package, User, Settings, Eye } from 'lucide-react'; // 导入 Eye 图标
import { AuxiliaryMaterial, ProcessingHistoryRecord } from '../../types';

interface ProcessingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  auxiliaryMaterial: AuxiliaryMaterial;
  processingHistoryRecords: ProcessingHistoryRecord[]; // All history records
}

export const ProcessingHistoryModal: React.FC<ProcessingHistoryModalProps> = ({
  isOpen,
  onClose,
  auxiliaryMaterial,
  processingHistoryRecords,
}) => {
  if (!isOpen) return null;

  // Filter history records for the specific auxiliary material
  const filteredHistory = processingHistoryRecords.filter(
    (record) => record.auxiliaryId === auxiliaryMaterial.id
  ).sort((a, b) => b.processingTime.getTime() - a.processingTime.getTime()); // Ensure descending order

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Clock className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">加工历史详情</h2>
              <p className="text-sm text-gray-600 mt-1">
                辅料: {auxiliaryMaterial.auxiliaryName} ({auxiliaryMaterial.auxiliaryCode})
              </p>
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
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无加工历史记录</h3>
              <p className="mt-1 text-sm text-gray-500">该辅料尚未有加工批次记录。</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">批次号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">加工时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作员</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">寿命消耗</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">参数</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.lotNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.processingTime.toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.equipmentId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.operator}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.consumptionChange} {auxiliaryMaterial.calculationMethod.split(' ')[1] || '单位'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {Object.entries(record.parameters).map(([key, value]) => (
                          <div key={key} className="text-xs text-gray-600">
                            {key}: {value}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
