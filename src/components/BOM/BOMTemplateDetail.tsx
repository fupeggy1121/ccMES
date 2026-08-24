// src/components/BOM/BOMTemplateDetail.tsx
import React, { useState, useEffect } from 'react';
import { X, Package, Users, Calendar, FileText } from 'lucide-react';
import { ProcessStation } from '../../services/processRouteService'; // 导入 ProcessStation 接口
// import { processStationsByProductName } from '../../config/processConfig'; // 移除此行

// BOM物料项接口
interface BOMTemplateItem {
  id: string;
  materialCode: string;
  materialName: string;
  specification: string;
  unit: string;
  requiredQuantity: number;
  unitPrice: number;
  supplier: string;
  notes: string;
  processStationCode: string; // 工艺站点编码
  materialType: string; // 物料类型
}

// BOM模板接口
interface BOMTemplate {
  id: string;
  templateName: string;
  templateCode: string;
  version: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'archived'; // 状态：激活/已归档
  productType: string; // 产品类型
  bomItems: BOMTemplateItem[]; // BOM物料列表
}

interface BOMTemplateDetailProps {
  template: BOMTemplate;
  onClose: () => void;
  currentProductProcessStations: ProcessStation[]; // 新增：接收工艺站点
}

export const BOMTemplateDetail: React.FC<BOMTemplateDetailProps> = ({ template, onClose, currentProductProcessStations }) => {
  // 状态管理
  const [activeProcessStationCode, setActiveProcessStationCode] = useState<string>('');
  // const [currentProductProcessStations, setCurrentProductProcessStations] = useState<ProcessStation[]>([]); // 移除此行

  // 根据产品类型初始化工艺站点
  useEffect(() => {
    // const stations = processStationsByProductName[template.productType] || []; // 使用导入的配置
    // setCurrentProductProcessStations(stations); // 移除此行

    if (currentProductProcessStations.length > 0) {
      setActiveProcessStationCode(currentProductProcessStations[0].code);
    } else {
      setActiveProcessStationCode('');
    }
  }, [template.productType, currentProductProcessStations]); // 依赖项更新

  // 根据当前选中的工艺站点过滤物料
  const filteredBomItems = activeProcessStationCode
    ? template.bomItems.filter(item => item.processStationCode === activeProcessStationCode)
    : template.bomItems;

  // 计算物料总成本
  const totalCost = filteredBomItems.reduce(
    (sum, material) => sum + (material.requiredQuantity * material.unitPrice), 
    0
  );

  // 获取站点名称
  const getStationName = (code: string) => {
    const station = currentProductProcessStations.find(s => s.code === code);
    return station ? station.name : '未知站点';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{template.templateName}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {template.templateCode} | 版本 {template.version}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="关闭"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 模板基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">模板描述</p>
                  <p className="text-sm text-gray-600">{template.description || '无描述信息'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">创建人</p>
                  <p className="text-sm text-gray-600">{template.createdBy}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">创建时间</p>
                  <p className="text-sm text-gray-600">{template.createdAt.toLocaleDateString('zh-CN')}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">最后更新</p>
                  <p className="text-sm text-gray-600">{template.updatedAt.toLocaleDateString('zh-CN')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div>
              <span className="text-sm font-medium text-gray-900">产品类型：</span>
              <span className="text-sm text-gray-600 ml-2">{template.productType}</span>
            </div>
            <div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                template.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {template.status === 'active' ? '激活状态' : '已归档'}
              </span>
            </div>
          </div>

          {/* 工艺站点与物料清单布局 */}
          <div className="flex flex-col md:flex-row gap-6 mt-8">
            {/* 左侧 - 工艺站点列表 */}
            <div className="md:w-1/4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">工艺站点</h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {currentProductProcessStations.length > 0 ? (
                    currentProductProcessStations.map(station => (
                      <li 
                        key={station.code}
                        className={`p-4 cursor-pointer transition-colors ${
                          station.code === activeProcessStationCode
                            ? 'bg-blue-50 border-l-4 border-blue-500'
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => setActiveProcessStationCode(station.code)}
                      >
                        <div className="font-medium text-gray-900">{station.name}</div>
                        <div className="text-sm text-gray-500">{station.code}</div>
                      </li>
                    ))
                  ) : (
                    <li className="p-4 text-center text-gray-500">
                      该产品类型未定义工艺站点
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* 右侧 - 物料清单 */}
            <div className="md:w-3/4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-500" />
                  物料清单 ({filteredBomItems.length})
                  {activeProcessStationCode && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({getStationName(activeProcessStationCode)})
                    </span>
                  )}
                </h3>
                <div className="text-right">
                  <p className="text-sm text-gray-500">物料总成本</p>
                  <p className="text-lg font-bold text-gray-900">¥{totalCost.toFixed(2)}</p>
                </div>
              </div>

              {filteredBomItems.length > 0 ? (
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            物料名称
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            所属站点
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            数量
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            单价
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            总价
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredBomItems.map((material) => (
                          <tr key={material.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{material.materialName}</div>
                              <div className="text-sm text-gray-500">编码: {material.materialCode}</div>
                              <div className="text-sm text-gray-500">规格: {material.specification}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {getStationName(material.processStationCode)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {material.materialType}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {material.requiredQuantity} {material.unit}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                ¥{material.unitPrice.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-500">
                                供应商: {material.supplier}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                ¥{(material.requiredQuantity * material.unitPrice).toFixed(2)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                  <Package className="h-12 w-12 mx-auto text-gray-400" />
                  <h4 className="mt-4 text-lg font-medium text-gray-900">
                    未找到物料信息
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    {activeProcessStationCode
                      ? `${getStationName(activeProcessStationCode)}暂无物料分配`
                      : '此模板尚未定义物料'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
