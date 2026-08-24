// src/components/ProductionPlan/CarrierBindingModule.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, Trash2, Scan, Package, Box, Grid, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { LineSideRawMaterialBox } from './MaterialFeedingForm'; // 导入物料类型
import { WaferBasketVisualizationModal } from './WaferBasketVisualizationModal'; // Import the new modal component

// 表示一个物料被分配到的片篮槽位
export interface AssignedSlot {
  materialId: string;
  basketId: string; // 新增：片篮的内部唯一ID
  slotNumber: number;
}

// 表示一个片篮的信息，包括其已分配的槽位
export interface WaferBasketInfo {
  id: string; // 内部唯一ID，用于React key和管理
  carrierId: string; // 片篮的实际编号 (例如：BASKET-001)
  capacity: number; // 片篮容量，例如 25
  assignedSlots: AssignedSlot[]; // 该片篮中已分配的槽位列表
}

interface CarrierBindingModuleProps {
  selectedMaterials: LineSideRawMaterialBox[]; // 已选的物料列表
  onBindingChange: (bindings: { materialId: string; waferBasketId?: string; slotNumber?: number }[]) => void;
}

export const CarrierBindingModule: React.FC<CarrierBindingModuleProps> = ({
  selectedMaterials,
  onBindingChange,
}) => {
  const WAFER_BASKET_CAPACITY = 25; // 每个片篮最大容量

  const [waferBaskets, setWaferBaskets] = useState<WaferBasketInfo[]>([]);
  const [currentBasketIdInput, setCurrentBasketIdInput] = useState('');
  const [assignedSlots, setAssignedSlots] = useState<AssignedSlot[]>([]); // materialId -> { basketId, slotNumber }
  
  // State for the visualization modal
  const [showVisualizationModal, setShowVisualizationModal] = useState(false);
  const [modalBasket, setModalBasket] = useState<WaferBasketInfo | null>(null);

  // State for the tooltip
  const [showTooltip, setShowTooltip] = useState(false);

  // 辅助函数：获取物料当前分配的片篮内部ID
  const getMaterialBasketInternalId = (materialId: string): string | undefined => {
    const assigned = assignedSlots.find(slot => slot.materialId === materialId);
    return assigned?.basketId;
  };

  // 辅助函数：获取物料当前分配的槽位
  const getMaterialSlotNumber = (materialId: string): number | undefined => {
    const assigned = assignedSlots.find(slot => slot.materialId === materialId);
    return assigned?.slotNumber;
  };

  // 辅助函数：更新片篮的已分配槽位列表
  const updateBasketAssignedSlots = (currentAssignedSlots: AssignedSlot[], currentWaferBaskets: WaferBasketInfo[]) => {
    const updatedBaskets = currentWaferBaskets.map(basket => ({
      ...basket,
      assignedSlots: currentAssignedSlots.filter(slot => {
        const isValidSlot = typeof slot.slotNumber === 'number' && slot.slotNumber >= 1 && slot.slotNumber <= WAFER_BASKET_CAPACITY;
        return isValidSlot && slot.basketId === basket.id; // 过滤属于当前片篮的有效槽位
      }),
    }));
    return updatedBaskets;
  };

  // Effect 1: 当 selectedMaterials 变化时，过滤 assignedSlots，移除不再选中的物料的绑定
  useEffect(() => {
    const currentSelectedMaterialIds = new Set(selectedMaterials.map(m => m.id));
    const filteredAssignedSlots = assignedSlots.filter(slot =>
      currentSelectedMaterialIds.has(slot.materialId)
    );

    // 只有当过滤后的列表与当前 assignedSlots 不同时才更新，避免不必要的渲染
    if (filteredAssignedSlots.length !== assignedSlots.length ||
        JSON.stringify(filteredAssignedSlots) !== JSON.stringify(assignedSlots)) { // 简易深比较
      setAssignedSlots(filteredAssignedSlots);
    }
  }, [selectedMaterials, assignedSlots]); // 依赖 assignedSlots 确保在 assignedSlots 自身变化时也能触发过滤

  // Effect 2: 当 assignedSlots 或 waferBaskets 变化时，更新 waferBaskets 内部的 assignedSlots 列表
  useEffect(() => {
    const updatedBaskets = updateBasketAssignedSlots(assignedSlots, waferBaskets);
    // 只有当更新后的片篮列表与当前状态不同时才更新，避免不必要的渲染
    if (JSON.stringify(updatedBaskets) !== JSON.stringify(waferBaskets)) { // 简易深比较
      setWaferBaskets(updatedBaskets);
    }
  }, [assignedSlots, waferBaskets]); // 依赖 waferBaskets 自身，因为 updateBasketAssignedSlots 需要其当前值

  // Effect 3: 实时向父组件传递绑定数据
  useEffect(() => {
    const finalBindings = selectedMaterials.map(material => {
      const assigned = assignedSlots.find(slot => slot.materialId === material.id);
      const basketInfo = assigned ? waferBaskets.find(b => b.id === assigned.basketId) : undefined;
      return {
        materialId: material.id,
        waferBasketId: basketInfo?.carrierId, // 传递片篮的实际编号
        slotNumber: assigned?.slotNumber,
      };
    });
    onBindingChange(finalBindings);
  }, [assignedSlots, selectedMaterials, waferBaskets, onBindingChange]); // 确保 onBindingChange 也在依赖数组中

  // 处理片篮添加
  const handleAddBasket = () => {
    const carrierId = currentBasketIdInput.trim();
    if (!carrierId) {
      alert('请输入片篮编号');
      return;
    }
    if (waferBaskets.some(b => b.carrierId === carrierId)) {
      alert('该片篮已存在');
      return;
    }
    const newBasket: WaferBasketInfo = {
      id: `basket-${Date.now()}`, // 生成一个唯一的内部ID
      carrierId,
      capacity: WAFER_BASKET_CAPACITY,
      assignedSlots: [], // 初始为空
    };
    setWaferBaskets(prev => [...prev, newBasket]);
    setCurrentBasketIdInput('');
  };

  // 模拟扫描片篮
  const handleScanBasket = () => {
    const mockBasketIds = ['BASKET-001', 'BASKET-002', 'BASKET-003', 'BASKET-004', 'BASKET-005'];
    const randomId = mockBasketIds[Math.floor(Math.random() * mockBasketIds.length)];
    setCurrentBasketIdInput(randomId);
  };

  // 处理片篮删除
  const handleRemoveBasket = (basketInternalId: string) => {
    // 检查是否有物料分配到该片篮
    const isBasketOccupied = assignedSlots.some(slot => slot.basketId === basketInternalId);
    if (isBasketOccupied) {
      alert('该片篮中仍有已分配的物料，请先解除绑定。');
      return;
    }
    setWaferBaskets(prev => prev.filter(b => b.id !== basketInternalId));
    // If the deleted basket was the one in the modal, close the modal
    if (modalBasket?.id === basketInternalId) {
      setShowVisualizationModal(false);
      setModalBasket(null);
    }
  };

  // 处理物料分配到片篮槽位
  const handleAssignSlot = (materialId: string, basketInternalId: string, slotNumber: number | '') => {
    const targetBasket = waferBaskets.find(b => b.id === basketInternalId);
    if (!targetBasket) return;

    const newSlotNumber = slotNumber === '' ? undefined : Number(slotNumber);

    // 校验槽位号是否在有效范围内
    if (newSlotNumber !== undefined && (newSlotNumber < 1 || newSlotNumber > WAFER_BASKET_CAPACITY)) {
      alert(`槽位编号必须在 1 到 ${WAFER_BASKET_CAPACITY} 之间`);
      return;
    }

    // 检查槽位是否已被占用 (在当前片篮中)
    const isSlotOccupied = assignedSlots.some(
      slot => slot.basketId === basketInternalId && slot.slotNumber === newSlotNumber && slot.materialId !== materialId
    );
    if (newSlotNumber !== undefined && isSlotOccupied) {
      alert(`槽位 ${newSlotNumber} 已被占用，请选择其他槽位。`);
      return;
    }

    // 更新 assignedSlots
    setAssignedSlots(prev => {
      const updatedAssignedSlots = prev.filter(slot => slot.materialId !== materialId); // 移除旧的分配
      if (newSlotNumber !== undefined) {
        updatedAssignedSlots.push({ materialId, basketId: targetBasket.id, slotNumber: newSlotNumber }); // 存储片篮内部ID
      }
      return updatedAssignedSlots;
    });
  };

  // Function to open the visualization modal
  const openVisualizationModal = (basketId: string) => {
    const basketToVisualize = waferBaskets.find(b => b.id === basketId);
    if (basketToVisualize) {
      setModalBasket(basketToVisualize);
      setShowVisualizationModal(true);
    }
  };

  // Tooltip content
  const tooltipContent = (
    <div className="text-sm text-blue-800 space-y-1 ">
      <p>• 请先添加片篮，然后为每个物料分配片篮和槽位。</p>
      <p>• 每个片篮最多可容纳 {WAFER_BASKET_CAPACITY} 片衬底。</p>
      <p>• 槽位编号必须是 1 到 {WAFER_BASKET_CAPACITY} 之间的整数。</p>
      <p>• 槽位可视化区域将显示当前片篮的占用情况。</p>
    </div>
  );

  return (
    <div className="space-y-6 mb-4">
      {/* 主标题：片篮绑定 */}
      <div className="flex items-center">
        <Package className="w-5 h-5 text-blue-600 mr-2" />        
        <h3 className="text-lg font-semibold text-gray-900">片篮绑定</h3>
        <div className="relative">
          <Info
            className="w-5 h-5 text-gray-500 cursor-pointer hover:text-blue-600"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(prev => !prev)}
          />
          {showTooltip && (
            <div className="absolute z-10 left-full ml-2 w-80 p-4 mt-2 bg-blue-50 border border-blue-200 rounded-lg shadow-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">载具绑定说明</h4>
              {tooltipContent}
            </div>
          )}
        </div>
      </div>

      {/* 片篮管理 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={currentBasketIdInput}
            onChange={(e) => setCurrentBasketIdInput(e.target.value)}
            placeholder="输入或扫描片篮编号"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleScanBasket}
            className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Scan className="w-4 h-4" /> 扫描
          </button>
          <button
            onClick={handleAddBasket}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> 添加片篮
          </button>
        </div>

        {waferBaskets.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 mb-4">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">片篮编号</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">容量</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">已分配槽位</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {waferBaskets.map(basket => (
                  <tr key={basket.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{basket.carrierId}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{basket.capacity}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {basket.assignedSlots.length} / {basket.capacity}
                      {basket.assignedSlots.length > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({basket.assignedSlots.map(s => s.slotNumber).join(', ')})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <button
                        onClick={() => openVisualizationModal(basket.id)} // Open modal
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        <Grid className="w-4 h-4 inline-block" /> 查看槽位
                      </button>
                      <button
                        onClick={() => handleRemoveBasket(basket.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4 inline-block" /> 删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* 物料分配到片篮槽位 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* 调整标题样式为小标题 */}
        <h4 className="text-md font-semibold text-gray-900 mb-4">物料分配</h4>
        {selectedMaterials.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p>请先在上方选择需要投料的物料。</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">衬底片编码</th>    
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物料编码</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物料名称</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分配片篮</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">槽位编号 (1-25)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedMaterials.map(material => {
                  const currentBasketInternalId = getMaterialBasketInternalId(material.id);
                  const currentSlotNumber = getMaterialSlotNumber(material.id);
                  const assignedToBasket = waferBaskets.find(b => b.id === currentBasketInternalId);
                  // 注意：isCapacityExceeded 的判断逻辑需要更精确，这里只是一个示例
                  const isCapacityExceeded = assignedToBasket && assignedToBasket.assignedSlots.length >= WAFER_BASKET_CAPACITY && !assignedToBasket.assignedSlots.some(s => s.materialId === material.id);

                  return (
                    <tr key={material.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{material.materialCode}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{material.materialName}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{material.lotNumber}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <select
                          value={currentBasketInternalId || ''} // 使用内部ID作为value
                          onChange={(e) => {
                            const newBasketInternalId = e.target.value;
                            // 直接更新 assignedSlots，改变片篮并清除槽位号
                            setAssignedSlots(prev => {
                              const updated = prev.filter(slot => slot.materialId !== material.id); // 移除现有绑定
                              if (newBasketInternalId) {
                                updated.push({ materialId: material.id, basketId: newBasketInternalId, slotNumber: undefined }); // 添加新绑定，槽位号清空
                              }
                              return updated;
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">请选择片篮</option>
                          {waferBaskets.map(basket => (
                            <option key={basket.id} value={basket.id}>{basket.carrierId}</option> // option的value是内部ID，显示是carrierId
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <input
                          type="number"
                          min="1"
                          max={WAFER_BASKET_CAPACITY}
                          value={currentSlotNumber || ''}
                          onChange={(e) => handleAssignSlot(material.id, currentBasketInternalId || '', Number(e.target.value))}
                          className={`w-24 px-2 py-1 border rounded-lg text-sm ${isCapacityExceeded ? 'border-red-500' : 'border-gray-300'}`}
                          disabled={!currentBasketInternalId} // 必须先选择片篮
                        /> 
                        {isCapacityExceeded && (
                          <p className="text-red-500 text-xs mt-1">片篮容量已满！</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>        
        
      </div>



      {/* Wafer Basket Visualization Modal */}
      <WaferBasketVisualizationModal
        isOpen={showVisualizationModal}
        onClose={() => setShowVisualizationModal(false)}
        basket={modalBasket}
        allMaterials={selectedMaterials}
      />
    </div>
  );
};
