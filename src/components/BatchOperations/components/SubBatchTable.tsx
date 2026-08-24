// src/components/SubBatchTable.tsx

import React from 'react';
import { SubBatchData } from '../types';

interface SubBatchTableProps {
  displayedSubBatches: SubBatchData[];
  loadingSubBatches: boolean;
  checkedSubBatchIds: string[];
  handleSubBatchCheckboxChange: (sublotId: string) => void;
  getStatusColor: (status: string) => string;
  selectedMasterBatchId: string | null;
  batchList: any[];
  showStatusColumn?: boolean;
  showDefectDisposalColumn?: boolean;
}

const SubBatchTable: React.FC<SubBatchTableProps> = ({
  displayedSubBatches,
  loadingSubBatches,
  checkedSubBatchIds,
  handleSubBatchCheckboxChange,
  getStatusColor,
  selectedMasterBatchId,
  batchList,
  showStatusColumn = true,
  showDefectDisposalColumn = false,
}) => {
  const masterCode = batchList.find(b => b.id === selectedMasterBatchId)?.batchCode;

  return (
    <div className="bg-white rounded-lg shadow-sm mt-4">
      <div className="px-4 py-2.5 border-b flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-700">
          子批次列表
          {masterCode && (
            <span className="ml-1.5 text-gray-400 font-normal text-xs">— {masterCode}</span>
          )}
          <span className="ml-1.5 text-gray-400 font-normal text-xs">({displayedSubBatches.length})</span>
        </h2>
      </div>

      <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
        {loadingSubBatches ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">加载子批次中...</div>
        ) : displayedSubBatches.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">无子批次数据</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 bg-gray-50 border-b w-8"></th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b text-left">子批次ID</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b text-left">片篮编号</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b text-center">总片数</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b text-center">良品数</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b text-center">不良品数</th>
                {showDefectDisposalColumn && (
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b text-center">不良处置</th>
                )}
                {showStatusColumn && (
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b text-center">状态</th>
                )}
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b text-left">站点</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b text-left">设备</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedSubBatches.map(subBatch => (
                <tr key={subBatch.sublotId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={checkedSubBatchIds.includes(subBatch.sublotId)}
                      onChange={() => handleSubBatchCheckboxChange(subBatch.sublotId)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">{subBatch.sublotId}</td>
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{subBatch.carrierId}</td>
                  <td className="px-3 py-2.5 text-center text-gray-700">{subBatch.totalQty}</td>
                  <td className="px-3 py-2.5 text-center text-green-600 font-medium">{subBatch.goodQty}</td>
                  <td className="px-3 py-2.5 text-center text-red-500 font-medium">{subBatch.defectQty}</td>
                  {showDefectDisposalColumn && (
                    <td className="px-3 py-2.5 text-center">
                      {subBatch.defectDisposal ? (
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          subBatch.defectDisposal === '返工' ? 'bg-blue-100 text-blue-700' :
                          subBatch.defectDisposal === '报废' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {subBatch.defectDisposal}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  )}
                  {showStatusColumn && (
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(subBatch.status)}`}>
                        {subBatch.status}
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{subBatch.stationName}</td>
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{subBatch.equipment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SubBatchTable;
