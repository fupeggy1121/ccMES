// src/components/ProductionPlan/BOMViewModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Package, FileText } from 'lucide-react';
import { BOMItem } from '../../types';

// 定义工艺站点接口
interface ProcessStation {
  id: string;
  name: string;
  code: string;
}

interface BOMViewModalProps {
  workOrderNumber: string;
  bomItems: BOMItem[];
  productType: string; // 新增 productType 属性
  currentProductProcessStations?: ProcessStation[]; // 新增：从props接收工艺站点数据
  onClose: () => void;
}

export const BOMViewModal: React.FC<BOMViewModalProps> = ({
  workOrderNumber,
  bomItems,
  productType,
  currentProductProcessStations = [], // 默认值设为空数组
  onClose
}) => {
  console.log('DEBUG: BOMViewModal - 接收到的bomItems:', bomItems);  
  console.log('DEBUG: BOMViewModal - 接收到的currentProductProcessStations:', currentProductProcessStations);
  
  // 状态管理
  const [activeProcessStationCode, setActiveProcessStationCode] = useState<string>('');
  
  // 根据工艺站点编码获取站点名称
  const getProcessStationName = (code: string) => {
    const station = currentProductProcessStations.find(s => s.code === code);
    return station ? station.name : '未知站点';
  };
  
  // 根据当前选中的工艺站点过滤物料
  const filteredBomItems = bomItems.filter(item => 
    item.processStationCode === activeProcessStationCode
  );
  
  // 计算当前显示的物料总金额
  const getTotalAmount = () => {
    return filteredBomItems.reduce((sum, item) => sum + (item.requiredQuantity * item.unitPrice), 0);
  };
  
  // 初始化工艺站点
  useEffect(() => {
    // 如果传入了工艺站点数据，使用第一个作为默认选中
    if (currentProductProcessStations.length > 0) {
      setActiveProcessStationCode(currentProductProcessStations[0].code);
    }
  }, [currentProductProcessStations]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-7xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">BOM物料清单</h2>
            <p className="text-sm text-gray-600 mt-1">工单号: {workOrderNumber}</p>
            <p className="text-sm text-gray-600">产品类型: {productType}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - 调整为左右两栏布局 */}
        <div className="flex p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 左侧栏 - 工艺站点列表 */}
          <div className="w-1/5 pr-4 border-r border-gray-200">
            <div className="mb-4">
              <h3 className="text-md font-semibold text-gray-700 mb-2">工艺站点</h3>
              <div className="space-y-2">
                {currentProductProcessStations.map(station => (
                  <div
                    key={station.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      activeProcessStationCode === station.code
                        ? 'bg-blue-100 border border-blue-500'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveProcessStationCode(station.code)}
                  >
                    <div className="font-medium text-gray-900">{station.name}</div>
                    <div className="text-xs text-gray-500">{station.code}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧栏 - 物料清单 */}
          <div className="w-4/5 pl-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Package className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    物料明细 - {getProcessStationName(activeProcessStationCode)}
                  </h3>
                </div>
                <span className="text-sm text-gray-500">
                  {filteredBomItems.length} 项物料
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead className="bg-white">
                    <tr>
                      <th className="w-2/12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg overflow-hidden text-ellipsis">
                        物料编码
                      </th>
                      <th className="w-2/12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider overflow-hidden text-ellipsis">
                        物料名称
                      </th>
                      <th className="w-1/12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-normal break-words">
                        规格
                      </th>
                      <th className="w-2/12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider overflow-hidden text-ellipsis">
                        供应商
                      </th>                     
                      <th className="w-2/12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider overflow-hidden text-ellipsis">
                        单位
                      </th>
                      <th className="w-2/12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider overflow-hidden text-ellipsis">
                        需求数量
                      </th>
                      <th className="w-1/12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider overflow-hidden text-ellipsis">
                        单价
                      </th>
                      <th className="w-1/12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg overflow-hidden text-ellipsis">
                        小计
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBomItems.length > 0 ? (
                      filteredBomItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="w-2/12 px-4 py-4 overflow-hidden text-ellipsis">
                            <div className="text-sm font-medium text-gray-900 overflow-hidden text-ellipsis">{item.materialCode}</div>
                          </td>
                          <td className="w-2/12 px-4 py-4 overflow-hidden text-ellipsis">
                            <div className="text-sm text-gray-900 overflow-hidden text-ellipsis">{item.materialName}</div>
                          </td>
                          <td className="w-2/12 px-4 py-4 whitespace-normal break-words">
                            <div className="text-sm text-gray-900">{item.specification}</div>
                          </td>
                          <td className="w-2/12 px-4 py-4 overflow-hidden text-ellipsis">
                            <div className="text-sm text-gray-900 overflow-hidden text-ellipsis">{item.supplier}</div>
                          </td>                          
                          <td className="w-1/12 px-4 py-4 overflow-hidden text-ellipsis">
                            <div className="text-sm text-gray-900 overflow-hidden text-ellipsis">{item.unit}</div>
                          </td>
                          <td className="w-1/12 px-4 py-4 overflow-hidden text-ellipsis">
                            <div className="text-sm font-medium text-gray-900 overflow-hidden text-ellipsis">{item.requiredQuantity.toLocaleString()}</div>
                          </td>
                          <td className="w-1/12 px-4 py-4 overflow-hidden text-ellipsis">
                            <div className="text-sm text-gray-900 overflow-hidden text-ellipsis">¥{item.unitPrice.toFixed(2)}</div>
                          </td>
                          <td className="w-1/12 px-4 py-4 overflow-hidden text-ellipsis">
                            <div className="text-sm font-medium text-gray-900 overflow-hidden text-ellipsis">
                              ¥{(item.requiredQuantity * item.unitPrice).toFixed(2)}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                          当前工艺站点没有物料数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={7} className="px-4 py-4 text-right text-sm font-medium text-gray-900">
                        总计金额:
                      </td>
                      <td colSpan={2} className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          ¥{getTotalAmount().toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};