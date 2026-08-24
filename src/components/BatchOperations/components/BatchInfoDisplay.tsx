// src/components/BatchInfoDisplay.tsx
import React, { useMemo, useState } from 'react';
import { BatchData, SubBatchData } from '../types';
import SubBatchDetailsModal from './SubBatchDetailsModal';

interface BatchInfoDisplayProps {
  selectedBatch: BatchData | null;
  getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>;
  getStatusColor: (status: string) => string;
  subBatches?: SubBatchData[];
}

const BatchInfoDisplay: React.FC<BatchInfoDisplayProps> = ({
  selectedBatch,
  getSubBatchesForMaster,
  getStatusColor,
  subBatches,
}) => {
  const [isSubBatchDetailsModalOpen, setIsSubBatchDetailsModalOpen] = useState(false);

  // 获取所有子批次
  const allSubBatchesOfMaster = useMemo(() => {
    return subBatches || [];
  }, [subBatches]);

  // 获取已选中的子批次ID集合
  const selectedSubLotIds = useMemo(() => {
    if (subBatches && subBatches.length > 0) {
      return new Set(subBatches.map(subBatch => subBatch.sublotId));
    }
    return new Set();
  }, [subBatches]);

  // 显示当前主批次下的所有子批次
  const displaySubBatches = allSubBatchesOfMaster;

  return (
    <div className="p-4">
      <h2 className="text-base font-medium mb-4 text-gray-700">批次信息</h2>

      {/* 主批次信息表格 */}
      <table className="w-full border-collapse border border-gray-300 rounded-lg mb-4 text-sm">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left">批次编码</th>
            <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left">台账号</th>
            <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left">产品料号</th>
            <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left">产品名称</th>
            <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left">产品版本</th>
            <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left">配方编码</th>
            <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left">晶棒ID</th>
            <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left">总片数</th>
            <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left">良品数</th>
            <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left">不良品数</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              className="border border-gray-300 px-3 py-2 bg-gray-50 text-blue-600 hover:text-blue-800 cursor-pointer hover:bg-blue-50 transition-colors font-medium select-none"
              onClick={() => setIsSubBatchDetailsModalOpen(true)}
              title={`点击查看子批次 (${subBatches?.length || 0})`}
            >
              {selectedBatch?.batchCode}
            </td>
            <td className="border border-gray-300 px-3 py-2 bg-gray-50 font-mono text-xs">{selectedBatch?.ledgerCode || '—'}</td>
            <td className="border border-gray-300 px-3 py-2 bg-gray-50">{selectedBatch?.productCode}</td>
            <td className="border border-gray-300 px-3 py-2 bg-gray-50">{selectedBatch?.productName}</td>
            <td className="border border-gray-300 px-3 py-2 bg-gray-50 text-center">{selectedBatch?.productVersion}</td>
            <td className="border border-gray-300 px-3 py-2 bg-white">{selectedBatch?.recipeCode}</td>
            <td className="border border-gray-300 px-3 py-2 bg-gray-50 text-center">{selectedBatch?.ingotId}</td>
            <td className="border border-gray-300 px-3 py-2 bg-gray-50 text-center">{selectedBatch?.totalQty}</td>
            <td className="border border-gray-300 px-3 py-2 bg-gray-50 text-center">{selectedBatch?.goodQty}</td>
            <td className="border border-gray-300 px-3 py-2 bg-gray-50 text-center">{selectedBatch?.defectQty}</td>
          </tr>
        </tbody>
      </table>

      {/* 子批次详情模态框 */}
      {isSubBatchDetailsModalOpen && (
        <SubBatchDetailsModal
          isOpen={isSubBatchDetailsModalOpen}
          onClose={() => setIsSubBatchDetailsModalOpen(false)}
          subBatches={subBatches || []}
          getStatusColor={getStatusColor}
          masterBatchCode={selectedBatch?.batchCode || ''}
        />
      )}
    </div>
  );
};

export default BatchInfoDisplay;