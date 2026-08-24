// src/components/Carriers/SingleCarrierCleaningModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Droplet, User, Settings, Clock, CheckCircle, Play, Scan } from 'lucide-react';
import { Select } from 'antd';
import { Carrier, CleaningRecord } from '../../types';
import { useData } from '../../hooks/useData';

interface SingleCarrierCleaningModalProps {
  isOpen: boolean;
  onClose: () => void;
  carrier: Carrier;
}

export const SingleCarrierCleaningModal: React.FC<SingleCarrierCleaningModalProps> = ({
  isOpen,
  onClose,
  carrier,
}) => {
  const { startCleaning, completeCleaning, getCleaningRecordsForCarrier } = useData();
  const [operator, setOperator] = useState('张三');
  const [equipment, setEquipment] = useState('清洗机A');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [currentCleaningRecord, setCurrentCleaningRecord] = useState<CleaningRecord | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const operators = ['张三', '李四', '王五'];
  const equipments = ['清洗机A', '清洗机B', '超声波清洗机'];

  // 第一个 useEffect: 模态框打开时初始化状态并检查进行中的记录
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened for carrier ID:', carrier.id);
      // Reset state when modal opens
      setOperator('张三');
      setEquipment('清洗机A');
      setStartTime(null);
      setEndTime(null); // 确保这里重置 endTime
      setErrors({});

      const allCleaningRecordsForCarrier = getCleaningRecordsForCarrier(carrier.id);
      console.log('Fetched all cleaning records for this carrier:', allCleaningRecordsForCarrier);

      // Check if there's an ongoing cleaning record for this carrier
      const ongoingRecords = allCleaningRecordsForCarrier.filter(
        (rec) => rec.status === 'in-progress'
      );
      console.log('Filtered ongoing records:', ongoingRecords);

      if (ongoingRecords.length > 0) {
        const record = ongoingRecords[0];
        setCurrentCleaningRecord(record);
        setStartTime(record.startTime);
        setOperator(record.operator);
        setEquipment(record.equipment);
        // *** 关键修改：在这里立即设置 endTime ***
        setEndTime(new Date()); // 初始化 endTime 为当前时间
        console.log('Detected ongoing cleaning record and set currentCleaningRecord and initial endTime:', record);
      } else {
        setCurrentCleaningRecord(null);
        console.log('No ongoing cleaning record detected. currentCleaningRecord set to null.');
      }
    }
  }, [isOpen, carrier.id, getCleaningRecordsForCarrier]);

  // 第二个 useEffect: 实时更新 endTime，依赖于 currentCleaningRecord
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (currentCleaningRecord) {
      console.log('Second useEffect: currentCleaningRecord is set. Starting interval for real-time endTime updates.');
      // 首次设置 endTime 已在第一个 useEffect 中完成，这里只负责启动定时器
      intervalId = setInterval(() => {
        setEndTime(new Date());
        // console.log('Interval: Updating endTime to', new Date()); // 可以保留此日志用于调试定时器
      }, 1000);
    } else {
      console.log('Second useEffect: currentCleaningRecord is null. Clearing interval and setting endTime to null.');
      setEndTime(null); // 确保 endTime 在没有进行中记录时为 null
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('Second useEffect cleanup: Cleared endTime update interval.');
      }
    };
  }, [currentCleaningRecord]); // 依赖 currentCleaningRecord

  // 调试日志：观察所有相关状态的最终值
  useEffect(() => {
    console.log('SingleCarrierCleaningModal: Current state values for rendering:', {
      currentCleaningRecord: currentCleaningRecord ? { id: currentCleaningRecord.id, status: currentCleaningRecord.status } : null,
      startTime: startTime?.toLocaleString(),
      operator,
      equipment,
      endTime: endTime?.toLocaleString(),
    });
  }, [currentCleaningRecord, startTime, operator, equipment, endTime]);

  const validateStartForm = () => {
    const newErrors: Record<string, string> = {};
    if (!operator.trim()) newErrors.operator = '请选择清洗人员';
    if (!equipment.trim()) newErrors.equipment = '请选择清洗设备';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartCleaning = () => {
    if (!validateStartForm()) return;

    const newRecord = startCleaning(carrier.id, operator, equipment);
    setCurrentCleaningRecord(newRecord);
    setStartTime(newRecord.startTime);
    alert(`载具 ${carrier.carrierId} 已开始清洗！`);
  };

  const handleCompleteCleaning = () => {
    console.log('Attempting to complete cleaning for carrier:', carrier.carrierId);
    console.log('Current cleaning record state:', currentCleaningRecord);
    console.log('Current end time state:', endTime);

    if (!currentCleaningRecord || !endTime) {
      alert('清洗记录或结束时间无效，无法完成清洗。');
      return;
    }

    if (endTime <= currentCleaningRecord.startTime) {
      alert('结束时间必须晚于开始时间');
      return;
    }

    completeCleaning(currentCleaningRecord.id, operator, endTime);
    alert(`载具 ${carrier.carrierId} 清洗完成！`);
    onClose();
  };

  const handleScanEquipment = () => {
    const scannedEquipment = equipments[Math.floor(Math.random() * equipments.length)];
    setEquipment(scannedEquipment);
    setErrors(prev => ({ ...prev, equipment: '' }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Droplet className="w-6 h-6 text-purple-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">片篮清洗</h2>
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
            {/* 新增：清洗记录号 */}
            {currentCleaningRecord && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">清洗记录号</label>
                <input
                  type="text"
                  value={currentCleaningRecord.id}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            )}

            {/* 载具ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">载具ID</label>
              <input
                type="text"
                value={carrier.carrierId}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                清洗人员 <span className="text-red-500">*</span>
              </label>
              <Select
                value={operator}
                onChange={(value: string) => { setOperator(value); setErrors(prev => ({ ...prev, operator: '' })); }}
                className={`w-full ${errors.operator ? 'border-red-500' : ''}`}
                disabled={!!currentCleaningRecord}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as string)?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                <Select.Option value="">请选择清洗人员</Select.Option>
                {operators.map(op => <Select.Option key={op} value={op}>{op}</Select.Option>)}
              </Select>
              {errors.operator && <p className="text-red-500 text-xs mt-1">{errors.operator}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                清洗设备 <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <Select
                  value={equipment}
                  onChange={(value: string) => { setEquipment(value); setErrors(prev => ({ ...prev, equipment: '' })); }}
                  className={`flex-1 ${errors.equipment ? 'border-red-500' : ''}`}
                  disabled={!!currentCleaningRecord}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as string)?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  <Select.Option value="">请选择清洗设备</Select.Option>
                  {equipments.map(eq => <Select.Option key={eq} value={eq}>{eq}</Select.Option>)}
                </Select>
                <button
                  onClick={handleScanEquipment}
                  className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors flex items-center"
                  disabled={!!currentCleaningRecord}
                >
                  <Scan className="w-4 h-4" />
                </button>
              </div>
              {errors.equipment && <p className="text-red-500 text-xs mt-1">{errors.equipment}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">清洗开始时间</label>
              <input
                type="datetime-local"
                value={startTime ? startTime.toISOString().slice(0, 16) : ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            {currentCleaningRecord && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">清洗结束时间</label>
                {console.log('Rendering endTime input. currentCleaningRecord:', currentCleaningRecord, 'endTime:', endTime)}
                <input
                  type="datetime-local"
                  value={endTime && !isNaN(endTime.getTime()) ? endTime.toISOString().slice(0, 16) : ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            )}
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
          {!currentCleaningRecord ? (
            <button
              onClick={handleStartCleaning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              开始清洗
            </button>
          ) : (
            <button
              onClick={handleCompleteCleaning}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              结束清洗
            </button>
          )}
        </div>
      </div>
    </div>
  );
};