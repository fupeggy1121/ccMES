// src/components/Carriers/ViewCleaningRecordsModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, History, Search, Filter, Clock, User, Settings } from 'lucide-react';
import { Carrier, CleaningRecord } from '../../types';
import { useData } from '../../hooks/useData';

interface ViewCleaningRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  carrier: Carrier;
}

export const ViewCleaningRecordsModal: React.FC<ViewCleaningRecordsModalProps> = ({
  isOpen,
  onClose,
  carrier,
}) => {
  const { getCleaningRecordsForCarrier } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [records, setRecords] = useState<CleaningRecord[]>([]);

  const allEquipments = useMemo(() => {
    const equipments = new Set<string>();
    getCleaningRecordsForCarrier(carrier.id).forEach(record => {
      if (record.equipment) equipments.add(record.equipment);
    });
    return Array.from(equipments);
  }, [carrier.id, getCleaningRecordsForCarrier]);

  useEffect(() => {
    if (isOpen) {
      setRecords(getCleaningRecordsForCarrier(carrier.id));
      setSearchTerm('');
      setEquipmentFilter('all');
    }
  }, [isOpen, carrier.id, getCleaningRecordsForCarrier]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch =
        record.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEquipment = equipmentFilter === 'all' || record.equipment === equipmentFilter;

      return matchesSearch && matchesEquipment;
    });
  }, [records, searchTerm, equipmentFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <History className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">清洗记录</h2>
              <p className="text-sm text-gray-600 mt-1">载具ID: {carrier.carrierId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索操作员、设备或备注..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={equipmentFilter}
              onChange={(e) => setEquipmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部设备</option>
              {allEquipments.map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
          </div>
        </div>

        {/* Records Table */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <History className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无清洗记录</h3>
              <p className="mt-1 text-sm text-gray-500">此载具尚未有清洗记录。</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">清洗记录号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">清洗人员</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">清洗设备</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">开始时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">结束时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.operator}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.equipment}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.startTime.toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.endTime ? record.endTime.toLocaleString('zh-CN') : '进行中'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${record.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                          {record.status === 'completed' ? '已完成' : '进行中'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.notes || '无'}</td>
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