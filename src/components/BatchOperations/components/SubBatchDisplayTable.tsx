// src/components/SubBatchDisplayTable.tsx
import React from 'react';
import { SubBatchData } from '../types';

interface SubBatchDisplayTableProps {
  subBatches: SubBatchData[];
  getStatusColor: (status: string) => string;
}

const SubBatchDisplayTable: React.FC<SubBatchDisplayTableProps> = ({
  subBatches,
  getStatusColor,
}) => {
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr className="border-b">
              <th className="py-2 px-4 w-50 text-left text-gray-700 font-medium">子批次ID</th>
              <th className="py-2 px-4 w-50 text-left text-gray-700 font-medium">片篮编号</th>
              <th className="py-2 px-4 w-40 text-center text-gray-700 font-medium">总片数</th>
              <th className="py-2 px-4 w-40 text-center text-gray-700 font-medium">良品数</th>
              <th className="py-2 px-4 w-40 text-center text-gray-700 font-medium">不良品数</th>
              <th className="py-2 px-4 w-30 text-left text-gray-700 font-medium">状态</th>
              <th className="py-2 px-4 w-30 text-left text-gray-700 font-medium">站点</th>
              <th className="py-2 px-4 w-30 text-left text-gray-700 font-medium">设备</th>
            </tr>
          </thead>
          <tbody>
            {subBatches.length > 0 ? (
              subBatches.map((item, index) => (
                <tr
                  key={item.sublotId}
                  className={`border-b hover:bg-gray-50 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="py-2 px-4 w-50">{item.sublotId}</td>
                  <td className="py-2 px-4 w-50">{item.carrierId}</td>
                  <td className="py-2 px-4 w-40 text-center">{item.totalQty}</td>
                  <td className="py-2 px-4 w-40 text-center">{item.goodQty}</td>
                  <td className="py-2 px-4 w-40 text-center">{item.defectQty}</td>
                  <td className="py-2 px-4 w-30">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 w-30">{item.stationName}</td>
                  <td className="py-2 px-4 w-30">{item.equipment}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  无子批次数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {subBatches.length > 0 && (
        <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-t">
          共 {subBatches.length} 个子批次
        </div>
      )}
    </div>
  );
};

export default SubBatchDisplayTable;