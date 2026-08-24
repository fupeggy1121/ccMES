// src/components/MBE/PreloadModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, User, Settings, Grid, Plus, Minus, QrCode, Scan, CheckCircle, AlertTriangle } from 'lucide-react';
import { Material, Carrier } from '../../types'; // 导入 Material 和 Carrier 类型

interface PreloadModalProps {
  onClose: () => void;
  onSubmit: (preloadData: any) => void;
  materials: Material[]; // 传入所有材料数据
  carriers: Carrier[]; // 传入所有载具数据
}

interface PlatenPosition {
  id: number; // 1-9
  substrateLotNumber: string | null; // 绑定的衬底片批次号
  substrateId: string | null; // 绑定的衬底片ID
}

export const PreloadModal: React.FC<PreloadModalProps> = ({ onClose, onSubmit, materials, carriers }) => {
  const [preloadTime, setPreloadTime] = useState(new Date());
  const [operator, setOperator] = useState('张三');
  const [equipmentId, setEquipmentId] = useState(''); // 设备ID (MD/ME)
  const [chamberId, setChamberId] = useState('L1'); // 腔室 (L1/L2)
  const [rackPosition, setRackPosition] = useState('X01'); // 架子位置 (X01-X04)
  const [selectedPlatenId, setSelectedPlatenId] = useState(''); // 选中的 Platen ID
  const [platenPositions, setPlatenPositions] = useState<PlatenPosition[]>(
    Array.from({ length: 9 }, (_, i) => ({ id: i + 1, substrateLotNumber: null, substrateId: null }))
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPositionForInput, setSelectedPositionForInput] = useState<number | null>(1); // 新增状态：当前选中的位置ID，默认选中1
  const [substrateLotNumberInput, setSubstrateLotNumberInput] = useState(''); // 新增状态：衬底片号输入

  // 定义辅助函数：根据内部id返回显示标签
  const getDisplayLabel = (id: number): string => {
    if (id === 5) return 'A'; // 中心位置显示为A
    return id < 5 ? id.toString() : (id - 1).toString(); // 其他位置显示为1-8
  };

  // 模拟数据：设备和腔室
  const equipmentOptions = ['MD', 'ME'];
  const chamberOptions = ['L1', 'L2'];
  const rackPositionOptions = ['X01', 'X02', 'X03', 'X04'];

  // 过滤出可用的 Platen
  const availablePlatens = carriers.filter(c => c.type === 'platen' && c.status === 'available');

  // 过滤出可用的衬底片 (materialType === 'substrate')
  const availableSubstrates = materials.filter(m => m.materialType === 'substrate' && m.status === 'pending');

  // 获取选中 Platen 的显示名称
  const selectedPlatenDisplayName = useMemo(() => {
    const platen = carriers.find(c => c.id === selectedPlatenId);
    return platen ? platen.carrierId : '';
  }, [selectedPlatenId, carriers]);

  // Effect to initialize substrateLotNumberInput when component mounts or selectedPositionForInput changes
  useEffect(() => {
    if (selectedPositionForInput !== null) {
      const position = platenPositions.find(p => p.id === selectedPositionForInput);
      setSubstrateLotNumberInput(position?.substrateLotNumber || '');
    }
  }, [selectedPositionForInput, platenPositions]); // Add platenPositions to dependency array

  // 验证表单
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!operator.trim()) newErrors.operator = '请选择装片人';
    if (!equipmentId) newErrors.equipmentId = '请选择设备';
    if (!chamberId) newErrors.chamberId = '请选择腔室';
    if (!rackPosition) newErrors.rackPosition = '请选择架子位置';
    if (!selectedPlatenId) newErrors.selectedPlatenId = '请选择Platen';

    const boundSubstratesCount = platenPositions.filter(p => p.substrateId !== null).length;
    if (boundSubstratesCount === 0) {
      newErrors.platenPositions = '请至少绑定一片衬底片到Platen位置';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理衬底片绑定到 Platen 位置
  const handleBindSubstrate = (positionId: number, substrateLotNumber: string) => {
    const substrate = availableSubstrates.find(s => s.lotNumber === substrateLotNumber);
    if (!substrate) {
      alert('未找到该衬底片批次号或衬底片不可用。');
      return;
    }
    if (platenPositions.some(p => p.substrateId === substrate.id)) {
      alert('该衬底片已绑定到其他位置。');
      return;
    }

    setPlatenPositions(prev =>
      prev.map(pos =>
        pos.id === positionId
          ? { ...pos, substrateLotNumber: substrate.lotNumber, substrateId: substrate.id }
          : pos
      )
    );

    // 清空输入状态
    setSelectedPositionForInput(null); // 绑定成功后清空选中位置
    setSubstrateLotNumberInput('');
  };

  // 处理解除衬底片绑定
  const handleUnbindSubstrate = (positionId: number) => {
    setPlatenPositions(prev =>
      prev.map(pos =>
        pos.id === positionId
          ? { ...pos, substrateLotNumber: null, substrateId: null }
          : pos
      )
    );
  };

  // 处理位置选择
  const handlePositionSelect = (positionId: number) => {
    setSelectedPositionForInput(positionId);
    // 如果该位置已有绑定，预填充批次号
    const position = platenPositions.find(p => p.id === positionId);
    setSubstrateLotNumberInput(position?.substrateLotNumber || '');
  };

  // 处理扫描按钮点击
  const handleScan = () => {
    // 模拟扫描操作，这里可以替换为实际的扫描逻辑
    const simulatedScan = 'SIM' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setSubstrateLotNumberInput(simulatedScan);
  };

  // 提交表单
  const handleSubmit = () => {
    if (validateForm()) {
      const preloadData = {
        preloadTime,
        operator,
        equipmentId,
        chamberId,
        rackPosition,
        platenId: selectedPlatenId,
        boundPositions: platenPositions.filter(p => p.substrateId !== null),
      };
      onSubmit(preloadData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Settings className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">预装片准备</h2>
              <p className="text-sm text-gray-600 mt-1">配置装片信息并管理Platen衬底片绑定</p>
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
          {/* 基础信息配置区域 */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              基础信息配置
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">装片时间</label>
                <input
                  type="datetime-local"
                  value={preloadTime.toISOString().slice(0, 16)}
                  onChange={(e) => setPreloadTime(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  装片人 <span className="text-red-500">*</span>
                </label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.operator ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">请选择装片人</option>
                  <option value="张三">张三</option>
                  <option value="李四">李四</option>
                </select>
                {errors.operator && <p className="text-red-500 text-xs mt-1">{errors.operator}</p>}
              </div>

              {/* 设备位置配置 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  设备位置 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <div>
                    <select
                      value={equipmentId}
                      onChange={(e) => setEquipmentId(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.equipmentId ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">选择设备</option>
                      {equipmentOptions.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                    </select>
                    {errors.equipmentId && <p className="text-red-500 text-xs mt-1">{errors.equipmentId}</p>}
                  </div>
                  <div>
                    <select
                      value={chamberId}
                      onChange={(e) => setChamberId(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.chamberId ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      {chamberOptions.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                    </select>
                    {errors.chamberId && <p className="text-red-500 text-xs mt-1">{errors.chamberId}</p>}
                  </div>
                  <div>
                    <select
                      value={rackPosition}
                      onChange={(e) => setRackPosition(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.rackPosition ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      {rackPositionOptions.map(rp => <option key={rp} value={rp}>{rp}</option>)}
                    </select>
                    {errors.rackPosition && <p className="text-red-500 text-xs mt-1">{errors.rackPosition}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 装片Platen管理区域 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              装片Platen管理
            </h3>

                {/* Platen 选择 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择Platen <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPlatenId}
                    onChange={(e) => setSelectedPlatenId(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.selectedPlatenId ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">请选择Platen</option>
                    {availablePlatens.map(platen => (
                      <option key={platen.id} value={platen.id}>{platen.carrierId}</option>
                    ))}
                  </select>
                  {errors.selectedPlatenId && <p className="text-red-500 text-xs mt-1">{errors.selectedPlatenId}</p>}
                </div>
            
            {/* 修改为左右布局 */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 左侧：Platen 选择和可视化 */}
              <div className="lg:w-2/3 space-y-6">

                
                {/* Platen 可视化展示 */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Platen 衬底片绑定 {selectedPlatenDisplayName && `- ${selectedPlatenDisplayName}`} </h4>
                  {errors.platenPositions && <p className="text-red-500 text-xs mt-1 mb-2">{errors.platenPositions}</p>}
                  <div className="relative w-64 h-64 mx-auto flex items-center justify-center rounded-full bg-gray-200 border-4 border-gray-300">
                    {/* 中心位置 */}
                    <div
                      className={`absolute w-16 h-16 rounded-full bg-white border flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-blue-100
                        ${selectedPositionForInput === 5 ? 'border-blue-500 ring-2 ring-500' : 'border-gray-400'}
                      `}
                      onClick={() => handlePositionSelect(5)}
                    >
                      {platenPositions[4].substrateLotNumber ? (
                        <span className="text-blue-600 text-center text-xs break-all p-1">{platenPositions[4].substrateLotNumber}</span>
                      ) : (
                        getDisplayLabel(5)
                      )}
                      {platenPositions[4].substrateLotNumber && (
                        <button
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                          onClick={(e) => { e.stopPropagation(); handleUnbindSubstrate(5); }}
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>

                    {/* 圆周位置 */}
                    {platenPositions.map((pos, index) => {
                      if (pos.id === 5) return null; // 中心位置已单独处理
                      const displayLabel = getDisplayLabel(pos.id);
                      const angle = (index < 4 ? index : index - 1) * (360 / 8); // 调整索引以跳过中心位置
                      const radian = (angle * Math.PI) / 180;
                      const radius = 80; // 距离中心点的半径
                      const x = radius * Math.cos(radian);
                      const y = radius * Math.sin(radian);

                      return (
                        <div
                          key={pos.id}
                          className={`absolute w-16 h-16 rounded-full bg-white border flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-blue-100
                            ${selectedPositionForInput === pos.id ? 'border-blue-500 ring-2 ring-500' : 'border-gray-400'}
                          `}
                          style={{
                            transform: `translate(${x}px, ${y}px)`,
                          }}
                          onClick={() => handlePositionSelect(pos.id)}
                        >
                          {pos.substrateLotNumber ? (
                            <span className="text-blue-600 text-center text-xs break-all p-1">{pos.substrateLotNumber}</span>
                          ) : (
                            displayLabel
                          )}
                          {pos.substrateLotNumber && (
                            <button
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                              onClick={(e) => { e.stopPropagation(); handleUnbindSubstrate(pos.id); }}
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-center text-sm text-gray-600 mt-4">点击位置选择要绑定的衬底片</p>
                </div>
              </div>

              {/* 右侧：衬底片号输入区域 */}
              <div className="lg:w-1/3">
                {selectedPositionForInput !== null ? (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 h-full">
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      为位置 {getDisplayLabel(selectedPositionForInput)} 输入衬底片号
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          衬底片批次号
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={substrateLotNumberInput}
                            onChange={(e) => setSubstrateLotNumberInput(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="输入或扫描衬底片批次号"
                          />
                          <button
                            onClick={handleScan}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                          >
                            <Scan className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex space-x-3 pt-2">
                        <button
                          onClick={() => {
                            if (substrateLotNumberInput) {
                              handleBindSubstrate(selectedPositionForInput, substrateLotNumberInput);
                            } else {
                              alert('请输入衬底片批次号');
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          绑定
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPositionForInput(null);
                            setSubstrateLotNumberInput('');
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 h-full flex items-center justify-center">
                    <p className="text-gray-500 text-center">请先选择一个位置进行绑定</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 操作确认提示 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-2">操作说明</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• 请确保所有必填信息已填写完整。</p>
                  <p>• Platen可视化区域支持点击位置进行衬底片绑定，每个位置只能绑定一片衬底片。</p>
                  <p>• 提交后，Platen和衬底片的状态将更新。</p>
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
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            确认预装片
          </button>
        </div>
      </div>
    </div>
  );
};