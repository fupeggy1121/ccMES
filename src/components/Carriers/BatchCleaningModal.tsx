// src/components/Carriers/BatchCleaningModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, Droplet, Scan, Plus, Trash2, User, Settings, Play, StopCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { Select, Input, Button as AntdButton } from 'antd'; // 导入 Input 和 AntdButton
import { Carrier, CleaningRecord } from '../../types';
import { useData } from '../../hooks/useData';

interface BatchCleaningModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCarriers: Carrier[]; // All available carriers for selection
  initialCleaningRecord?: CleaningRecord | null; // 新增可选属性
  onCompleteCleaning?: (recordId: string, operator: string, endTime: Date) => void; // 新增回调
}

export const BatchCleaningModal: React.FC<BatchCleaningModalProps> = ({
  isOpen,
  onClose,
  allCarriers,
  initialCleaningRecord = null, // 默认值为 null
  onCompleteCleaning, // 接收回调
}) => {
  const { startCleaning } = useData(); // 仅保留 startCleaning，completeCleaningTask 将通过 onCompleteCleaning 传递
  const [selectedCarrierIds, setSelectedCarrierIds] = useState<string[]>([]);
  const [carrierIdInput, setCarrierIdInput] = useState('');
  const [operator, setOperator] = useState('张三');
  const [equipment, setEquipment] = useState('清洗机A');
  const [isCleaningStarted, setIsCleaningStarted] = useState(false);
  const [cleaningStartTime, setCleaningStartTime] = useState<Date | null>(null);
  const [cleaningEndTime, setCleaningEndTime] = useState<Date | null>(null);
  const [ongoingCleaningRecords, setOngoingCleaningRecords] = useState<Record<string, CleaningRecord>>({}); // carrierId -> CleaningRecord
  const [errors, setErrors] = useState<Record<string, string>>({});

  const operators = ['张三', '李四', '王五'];
  const equipments = ['清洗机A', '清洗机B', '超声波清洗机'];

  useEffect(() => {
    if (isOpen) {
      if (initialCleaningRecord) {
        // 如果是结束现有任务，预填充数据并进入"已开始"状态
        setOperator(initialCleaningRecord.operator);
        setEquipment(initialCleaningRecord.equipment);
        setCleaningStartTime(initialCleaningRecord.startTime);
        setCleaningEndTime(new Date()); // 默认结束时间为当前时间
        setSelectedCarrierIds(initialCleaningRecord.carrierIds);
        setIsCleaningStarted(true);
        setOngoingCleaningRecords({ [initialCleaningRecord.id]: initialCleaningRecord }); // 填充当前记录
      } else {
        // 否则，重置为新建任务状态
        setSelectedCarrierIds([]);
        setCarrierIdInput('');
        setOperator('张三');
        setEquipment('清洗机A');
        setIsCleaningStarted(false);
        setCleaningStartTime(null);
        setCleaningEndTime(null);
        setOngoingCleaningRecords({});
      }
      setErrors({});
    }
  }, [isOpen, initialCleaningRecord]); // 依赖 initialCleaningRecord

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (selectedCarrierIds.length === 0) newErrors.carriers = '请至少选择一个载具进行清洗';
    if (!operator.trim()) newErrors.operator = '请选择清洗人员';
    if (!equipment.trim()) newErrors.equipment = '请选择清洗设备';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCarrier = () => {
    const id = carrierIdInput.trim();
    if (!id) {
      alert('请输入载具ID');
      return;
    }
    const carrier = allCarriers.find(c => c.carrierId === id);
    if (!carrier) {
      alert('未找到该载具');
      return;
    }
    if (selectedCarrierIds.includes(carrier.id)) {
      alert('该载具已在列表中');
      return;
    }
    if (carrier.cleaningStatus === 'in-cleaning') {
      alert(`载具 ${carrier.carrierId} 正在清洗中，无法重复添加`);
      return;
    }
    if (carrier.status === 'occupied') {
      alert(`载具 ${carrier.carrierId} 处于已占用状态，无法清洗`);
      return;
    }

    setSelectedCarrierIds(prev => [...prev, carrier.id]);
    setCarrierIdInput('');
  };

  const handleRemoveCarrier = (carrierId: string) => {
    setSelectedCarrierIds(prev => prev.filter(id => id !== carrierId));
    setOngoingCleaningRecords(prev => {
      const newRecords = { ...prev };
      delete newRecords[carrierId];
      return newRecords;
    });
  };

  const handleScanCarrier = () => {
    // Simulate scanning
    const mockCarrierIds = allCarriers.filter(c => !selectedCarrierIds.includes(c.id) && c.status === 'unoccupied' && c.cleaningStatus !== 'in-cleaning').map(c => c.carrierId);
    if (mockCarrierIds.length > 0) {
      const randomId = mockCarrierIds[Math.floor(Math.random() * mockCarrierIds.length)];
      setCarrierIdInput(randomId);
    } else {
      alert('没有可供扫描的空闲载具了');
    }
  };

  const handleScanEquipment = () => {
    // Simulate scanning
    const scannedEquipment = equipments[Math.floor(Math.random() * equipments.length)];
    setEquipment(scannedEquipment);
    setErrors(prev => ({ ...prev, equipment: '' })); // Clear equipment error on scan
  };

  const handleStartBatchCleaning = () => {
    if (!validateForm()) return;

    const newOngoingRecords: Record<string, CleaningRecord> = {};
    selectedCarrierIds.forEach(carrierId => {
      const newRecord = startCleaning(carrierId, operator, equipment);
      newOngoingRecords[carrierId] = newRecord;
    });
    setOngoingCleaningRecords(newOngoingRecords);
    setIsCleaningStarted(true);
    setCleaningStartTime(new Date());
    alert(`已开始批量清洗 ${selectedCarrierIds.length} 个载具！`);
  };

  const handleCompleteBatchCleaning = () => {
    if (!isCleaningStarted || Object.keys(ongoingCleaningRecords).length === 0) return;

    const newEndTime = cleaningEndTime || new Date();
    setCleaningEndTime(newEndTime);

    if (initialCleaningRecord && onCompleteCleaning) {
      // 如果是结束现有任务，调用回调函数
      onCompleteCleaning(initialCleaningRecord.id, operator, newEndTime);
    } else {
      // 否则，使用原有的 completeCleaning 逻辑（如果需要的话）
      // 注意：这里移除了对 completeCleaning 的调用，因为 useData 中的 completeCleaning 已被移除
      // 如果需要，可以在这里添加其他逻辑
    }
    
    alert(`批量清洗完成！`);
    onClose();
  };

  const selectedCarriers = useMemo(() => {
    return allCarriers.filter(c => selectedCarrierIds.includes(c.id));
  }, [selectedCarrierIds, allCarriers]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Droplet className="w-6 h-6 text-purple-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {initialCleaningRecord ? '结束批量清洗' : '片篮批量清洗'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {initialCleaningRecord ? '完成现有的批量清洗任务' : '选择多个片篮进行批量清洗操作'}
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* 清洗信息 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">清洗信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    清洗人员 <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={operator}
                    onChange={(value: string) => { setOperator(value); setErrors(prev => ({ ...prev, operator: '' })); }}
                    className={`w-full ${errors.operator ? 'border-red-500' : ''}`}
                    disabled={isCleaningStarted}
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
                      disabled={isCleaningStarted}
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
                      disabled={isCleaningStarted}
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
                    value={cleaningStartTime ? cleaningStartTime.toISOString().slice(0, 16) : ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                {isCleaningStarted && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">清洗结束时间</label>
                    <input
                      type="datetime-local"
                      value={cleaningEndTime ? cleaningEndTime.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)}
                      onChange={(e) => setCleaningEndTime(new Date(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* 新增：清洗记录号 */}
                {isCleaningStarted && Object.keys(ongoingCleaningRecords).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">清洗记录号</label>
                    <input
                      type="text"
                      value={Object.values(ongoingCleaningRecords)[0]?.id || ''} // 显示第一个进行中记录的ID
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 载具选择 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">选择载具 <span className="text-red-500">*</span></h3>
              {!initialCleaningRecord && (
                <div className="flex space-x-2 mb-4">
                  <Input // 使用 Ant Design Input 组件
                    value={carrierIdInput}
                    onChange={(e) => setCarrierIdInput(e.target.value)}
                    placeholder="输入或扫描载具ID"
                    className="flex-1" // 保持 flex-1 样式，让输入框占据可用空间
                    disabled={isCleaningStarted}
                    onPressEnter={handleAddCarrier} // 添加回车事件
                    addonAfter={ // 将扫描按钮作为 addonAfter
                      <AntdButton
                        type="text" // 使用 text 类型按钮，使其更融入输入框
                        icon={<Scan className="w-4 h-4" />} // Lucide Icon
                        onClick={handleScanCarrier}
                        disabled={isCleaningStarted}
                      >
                        扫描
                      </AntdButton>
                    }
                  />
                  <button // "添加"按钮保持不变
                    onClick={handleAddCarrier}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    disabled={isCleaningStarted}
                  >
                    <Plus className="w-4 h-4" /> 添加
                  </button>
                </div>
              )}
              {errors.carriers && <p className="text-red-500 text-xs mt-1 mb-2">{errors.carriers}</p>}

              {selectedCarriers.length > 0 && (
                <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">载具ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前状态</th>
                        {!initialCleaningRecord && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedCarriers.map(carrier => (
                        <tr key={carrier.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{carrier.carrierId}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{carrier.type}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${ongoingCleaningRecords[carrier.id] ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                              {ongoingCleaningRecords[carrier.id] ? '清洗中' : '待清洗'}
                            </span>
                          </td>
                          {!initialCleaningRecord && (
                            <td className="px-4 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleRemoveCarrier(carrier.id)}
                                className="text-red-600 hover:text-red-900"
                                disabled={isCleaningStarted}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    {initialCleaningRecord ? '结束批量清洗说明' : '批量清洗说明'}
                  </h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    {initialCleaningRecord ? (
                      <>
                        <p>• 此操作将结束当前进行中的批量清洗任务。</p>
                        <p>• 清洗结束时间可以手动调整，默认为当前时间。</p>
                        <p>• 结束清洗后，所有载具的清洗状态将变为"正常"，清洗次数将增加。</p>
                      </>
                    ) : (
                      <>
                        <p>• 只能选择处于"未占用"且"非清洗中"状态的载具进行清洗。</p>
                        <p>• 开始清洗后，所有选定载具的清洗状态将变为"清洗中"。</p>
                        <p>• 结束清洗后，所有载具的清洗状态将变为"正常"，清洗次数将增加。</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isCleaningStarted && !initialCleaningRecord}
          >
            取消
          </button>
          {!isCleaningStarted ? (
            <button
              onClick={handleStartBatchCleaning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              disabled={selectedCarrierIds.length === 0 || !operator || !equipment}
            >
              <Play className="w-4 h-4" />
              开始批量清洗
            </button>
          ) : (
            <button
              onClick={handleCompleteBatchCleaning}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              disabled={!cleaningEndTime}
            >
              <CheckCircle className="w-4 h-4" />
              结束批量清洗
            </button>
          )}
        </div>
      </div>
    </div>
  );
};