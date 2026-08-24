// src/components/ProductionPlan/WaferBasketVisualizationModal.tsx
import React, { useMemo } from 'react';
import { X, Grid, Info } from 'lucide-react';
import { WaferBasketInfo, MaterialAllocation } from './CarrierBindingModule'; // Import necessary types
import { LineSideRawMaterialBox } from './MaterialFeedingForm'; // Import material type

interface WaferBasketVisualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  basket: WaferBasketInfo | null; // The specific basket to visualize
  allMaterials: LineSideRawMaterialBox[]; // All selected materials to find lot numbers
}

export const WaferBasketVisualizationModal: React.FC<WaferBasketVisualizationModalProps> = ({
  isOpen,
  onClose,
  basket,
  allMaterials,
}) => {
  if (!isOpen || !basket) return null;

  const WAFER_BASKET_CAPACITY = basket.capacity; // Use the actual basket capacity

  // Memoize visualization slots to avoid re-calculation on every render
  const visualizationSlots = useMemo(() => {
    const slots: ({ number: number; materialId: string | null; materialLotNumber: string | null; isRange: boolean; rangeInfo?: string })[] = [];
    
    // Create a map for quick lookup of which material occupies which slot
    const slotOccupancyMap = new Map<number, { materialId: string; allocationId: string; materialLotNumber: string; isRange: boolean; rangeInfo?: string }>();

    basket.assignedSlots.forEach(alloc => {
      const material = allMaterials.find(m => m.id === alloc.materialId);
      const materialLotNumber = material?.lotNumber || 'N/A';
      const isRange = alloc.endSlot !== undefined && alloc.endSlot !== alloc.startSlot;
      const rangeInfo = isRange ? ` (${alloc.startSlot}-${alloc.endSlot})` : '';

      for (let i = alloc.startSlot; i <= (alloc.endSlot !== undefined ? alloc.endSlot : alloc.startSlot); i++) {
        if (i >= 1 && i <= WAFER_BASKET_CAPACITY) {
          slotOccupancyMap.set(i, {
            materialId: alloc.materialId,
            allocationId: alloc.id,
            materialLotNumber: materialLotNumber,
            isRange: isRange,
            rangeInfo: rangeInfo
          });
        }
      }
    });

    for (let i = 1; i <= WAFER_BASKET_CAPACITY; i++) {
      const occupiedBy = slotOccupancyMap.get(i);
      slots.push({
        number: i,
        materialId: occupiedBy?.materialId || null,
        materialLotNumber: occupiedBy?.materialLotNumber || null,
        isRange: occupiedBy?.isRange || false,
        rangeInfo: occupiedBy?.rangeInfo,
      });
    }
    return slots;
  }, [basket, WAFER_BASKET_CAPACITY, allMaterials]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Grid className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                片篮 {basket.carrierId} 槽位状态
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                已分配 {basket.assignedSlots.length} 个分配 / {WAFER_BASKET_CAPACITY} 个槽位
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
          <div className="grid grid-cols-5 gap-4">
            {visualizationSlots.map(slot => (
              <div
                key={slot.number}
                className={`p-3 border rounded-lg text-center text-sm font-medium
                  ${slot.materialId ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-500'}
                  ${slot.isRange ? 'border-dashed' : ''}
                `}
              >
                <div className="text-xs text-gray-600">槽位 {slot.number}</div>
                {slot.materialLotNumber ? (
                  <div className="mt-1 font-bold break-all">
                    {slot.materialLotNumber}
                    {slot.isRange && <span className="text-xs text-gray-600">{slot.rangeInfo}</span>}
                  </div>
                ) : (
                  <div className="mt-1">空闲</div>
                )}
              </div>
            ))}
          </div>
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
