// src/components/ProductionPlan/PlatenSelectionModal.tsx
import React, { useState, useMemo } from 'react';
import { PreloadRecord, Carrier, Material } from '../../types';


interface Substrate {
  id: string;
  // Add other substrate properties as needed
}


interface PlatenSelectionModalProps {
  preloadRecords: PreloadRecord[];
  carriers: Carrier[];
  materials: Material[];
  onCancel: () => void;
  onConfirm: (selectedRecord: PreloadRecord) => void; // Changed to pass full record
  isOpen: boolean;
}

const PlatenSelectionModal: React.FC<PlatenSelectionModalProps> = ({
  preloadRecords,
  carriers,
  materials,
  onCancel,
  onConfirm,
  isOpen
}) => {
  console.log('PlatenSelectionModal: 组件渲染，isOpen:', isOpen);
  if (!isOpen) {
    console.log('PlatenSelectionModal: isOpen 为 false，不渲染模态框');
    return null;
  }

  const [selectedPlatenId, setSelectedPlatenId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter and process preload records
  const filteredPlatens = useMemo(() => {
    // Filter for records that are 'degassed' and not 'completed' or 'unbound'
    const degassedAndReadyPlatens = preloadRecords.filter(record =>
      record.processStep === 'degassed'
    );

    // Apply search filter
    return degassedAndReadyPlatens.filter(platen =>
      platen.platenId.toLowerCase().includes(searchQuery.toLowerCase()) || // 修改这里：从 platen.id 改为 platen.platenId
      platen.operatorName.toLowerCase().includes(searchQuery.toLowerCase()) // Use operatorName as operator field is not directly on PreloadRecord
    );
  }, [preloadRecords, searchQuery]);

  // Get bound substrates count for a platen
  const getBoundSubstratesCount = (platen: PreloadRecord): number => {
      return platen.platenPositions.length;
  };

  const handleConfirm = () => {
    const selectedRecord = preloadRecords.find(record => record.id === selectedPlatenId);
    if (selectedRecord) {
      onConfirm(selectedRecord);
      setSelectedPlatenId('');
      setSearchQuery('');
    }
  };

  const handleCancel = () => {
    onCancel();
    setSelectedPlatenId('');
    setSearchQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60]">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">选择Platen进行投料</h3>
          
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="按PlatenID或操作员搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Platen List */}
          <div className="max-h-96 overflow-y-auto mb-4">
            {filteredPlatens.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                {searchQuery ? '未找到匹配的Platen' : '没有可用于投料的Platen (需已除气)'}
              </p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      选择
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                      Platen ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作员
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      预装片时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      已绑定衬底片数
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPlatens.map((platen) => (
                    <tr key={platen.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="radio"
                          name="platenSelection"
                          checked={selectedPlatenId === platen.id}
                          onChange={() => setSelectedPlatenId(platen.id)}
                          className="h-4 w-4 text-blue-600"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{platen.platenId}</td> {/* Use platenId for display */}
                      <td className="px-6 py-4 whitespace-nowrap">{platen.operatorName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(platen.preloadTime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getBoundSubstratesCount(platen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedPlatenId}
              className={`px-4 py-2 rounded-md ${
                selectedPlatenId
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              确认选择
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatenSelectionModal;
