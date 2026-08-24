import React from 'react';
import { X, Eye } from 'lucide-react';
import { ProductVersionSnapshot } from '../types/Product';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productSnapshot: ProductVersionSnapshot | null;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  isOpen,
  onClose,
  productSnapshot
}) => {
  if (!isOpen || !productSnapshot) return null;

  // 渲染站点配置表格（只读）
  const renderStationTable = (stations: any[]) => {
    if (!stations || stations.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">暂无站点配置</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                站点名称
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                设备组
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                配方
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                量测参数
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                工艺参数
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                SPC管控
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                备注
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stations.map((station, index) => (
              <tr key={station.id || index}>
                <td className="px-4 py-2 text-sm text-gray-900 border-b">
                  {station.stationName}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 border-b">
                  {station.equipmentGroup || '-'}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 border-b">
                  {station.recipe || '-'}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 border-b">
                  {station.measurementParameters?.length > 0 
                    ? `${station.measurementParameters.length} 个参数`
                    : '-'
                  }
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 border-b">
                  {station.processParameters?.length > 0 
                    ? `${station.processParameters.length} 个参数`
                    : '-'
                  }
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 border-b">
                  {station.spcParameters?.length > 0 
                    ? `${station.spcParameters.length} 个参数`
                    : '-'
                  }
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 border-b">
                  {station.remarks?.length > 0 
                    ? `${station.remarks.length} 条备注`
                    : '-'
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl m-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              产品模型详情预览 - {productSnapshot.systemVersion}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-8">
            {/* 基本信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">基本信息</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    产品编号
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {productSnapshot.productCode}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    产品名称
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {productSnapshot.productName}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    客户名称
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {productSnapshot.customerName}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    产品大类
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {productSnapshot.productCategory} - {productSnapshot.productCategoryVersion}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    产品类型
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {productSnapshot.productType}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    系统版本
                  </label>
                  <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm font-medium text-blue-800">
                    {productSnapshot.systemVersion}
                  </div>
                </div>
              </div>
            </div>

            {/* 产品规格参数 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">产品规格参数</h3>
              <div className="grid grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">型号</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {productSnapshot.specifications?.type || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">厚度倍数</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {productSnapshot.specifications?.thicknessMultiplier || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">背封</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {productSnapshot.specifications?.backSeal || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">晶向</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {productSnapshot.specifications?.crystal || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">厚度</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {productSnapshot.specifications?.thickness || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">去边</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {productSnapshot.specifications?.method || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">直径</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {productSnapshot.specifications?.diameter || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">倒角</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {productSnapshot.specifications?.chamfer || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">掺杂剂</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {productSnapshot.specifications?.dopant || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">清洗或腐蚀方式</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {productSnapshot.specifications?.cleaningMethod || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">参考面</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {productSnapshot.specifications?.referenceSurface || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">喷砂</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                    {productSnapshot.specifications?.polishing || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* 工艺配置 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">工艺配置</h3>
              
              {/* 工艺主路径 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  工艺主路径
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {productSnapshot.mainProcessPath || '-'}
                </div>
              </div>

              {/* 主路径站点配置 */}
              {productSnapshot.mainProcessPath && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">主路径站点配置</h4>
                  {renderStationTable(productSnapshot.processStations || [])}
                </div>
              )}

              {/* 子路径配置 */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">工艺子路径配置</h4>
                
                {productSnapshot.subProcessConfigs && productSnapshot.subProcessConfigs.length > 0 ? (
                  <div className="space-y-6">
                    {productSnapshot.subProcessConfigs.map((config, index) => (
                      <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">子路径配置 {index + 1}</h5>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                            {config.path}
                          </div>
                        </div>
                        
                        {config.stations && config.stations.length > 0 && (
                          <div>
                            <h6 className="text-sm font-medium text-gray-900 mb-3">站点配置</h6>
                            {renderStationTable(config.stations)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">暂无子路径配置</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;