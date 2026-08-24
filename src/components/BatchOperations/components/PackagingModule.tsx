// src/components/PackagingModule.tsx
import React, { useState, useEffect } from 'react';
import { Package, Printer, RotateCcw } from 'lucide-react'; // 导入 RotateCcw 图标
import { SubBatchData, PackagingData } from '../types';

interface PackagingModuleProps {
  subBatches: SubBatchData[];
  productCode: string;
  productName: string;
  getStatusColor: (status: string) => string;
  onSubBatchesUpdated: (updatedSubBatches: SubBatchData[]) => void;
}

const PackagingModule: React.FC<PackagingModuleProps> = ({
  subBatches,
  productCode,
  productName,
  getStatusColor,
  onSubBatchesUpdated,
}) => {
  const [selectedSublotIds, setSelectedSublotIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedSublotIds([]);
  }, [subBatches]);

  const handleSublotSelect = (sublotId: string) => {
    setSelectedSublotIds(prev =>
      prev.includes(sublotId)
        ? prev.filter(id => id !== sublotId)
        : [...prev, sublotId]
    );
  };

  const generatePackagingBarcode = (): string => {
    const timestamp = Date.now().toString();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PKG-${productCode.replace(/-/g, '')}-${timestamp.slice(-6)}-${randomSuffix}`;
  };

  const handlePackage = () => {
    const sublotsToPackage = selectedSublotIds.filter(id =>
      !subBatches.find(sb => sb.sublotId === id)?.packagingBarcode
    );

    if (sublotsToPackage.length === 0) {
      alert('请选择至少一个未包装的子批次进行包装。');
      return;
    }

    const updatedSubBatches = subBatches.map(sb => {
      if (sublotsToPackage.includes(sb.sublotId)) {
        return { ...sb, packagingBarcode: generatePackagingBarcode(), status: '已包装' };
      }
      return sb;
    });

    onSubBatchesUpdated(updatedSubBatches);
    setSelectedSublotIds([]);
    alert(`成功生成 ${sublotsToPackage.length} 个包装条码！`);
  };

  const handlePrintLabels = () => {
    const sublotsToPrint = selectedSublotIds.filter(id =>
      subBatches.find(sb => sb.sublotId === id)?.packagingBarcode &&
      subBatches.find(sb => sb.sublotId === id)?.status === '已包装'
    );

    if (sublotsToPrint.length === 0) {
      alert('请选择至少一个已包装且未打印的子批次进行打印。');
      return;
    }

    const updatedSubBatches = subBatches.map(sb => {
      if (sublotsToPrint.includes(sb.sublotId)) {
        // 模拟打印逻辑
        console.log(`--- 打印标签 ---`);
        console.log(`产品料号: ${productCode}`);
        console.log(`产品名称: ${productName}`);
        console.log(`包装条码: ${sb.packagingBarcode}`);
        console.log(`子批次ID: ${sb.sublotId}`);
        console.log(`数量: ${sb.totalQty}`);
        console.log(`打印时间: ${new Date().toLocaleString()}`);
        console.log(`-----------------`);
        return { ...sb, status: '已打印' };
      }
      return sb;
    });

    onSubBatchesUpdated(updatedSubBatches);
    setSelectedSublotIds([]);
    alert(`成功打印 ${sublotsToPrint.length} 个标签！请查看控制台输出。`);
  };

  const handleRepack = () => {
    const sublotsToRepack = selectedSublotIds.filter(id =>
      !!subBatches.find(sb => sb.sublotId === id)?.packagingBarcode
    );

    if (sublotsToRepack.length === 0) {
      alert('请选择至少一个已包装的子批次进行重包。');
      return;
    }

    const updatedSubBatches = subBatches.map(sb => {
      if (sublotsToRepack.includes(sb.sublotId)) {
        return { ...sb, packagingBarcode: undefined, status: '待包装' };
      }
      return sb;
    });

    onSubBatchesUpdated(updatedSubBatches);
    setSelectedSublotIds([]);
    alert(`成功重置 ${sublotsToRepack.length} 个子批次的包装状态！`);
  };

  // 按钮禁用逻辑
  const isPackageEnabled = selectedSublotIds.some(id => !subBatches.find(sb => sb.sublotId === id)?.packagingBarcode);
  const isPrintEnabled = selectedSublotIds.some(id =>
    subBatches.find(sb => sb.sublotId === id)?.packagingBarcode &&
    subBatches.find(sb => sb.sublotId === id)?.status === '已包装'
  );
  const isRepackEnabled = selectedSublotIds.some(id => !!subBatches.find(sb => sb.sublotId === id)?.packagingBarcode);


  return (
    <div className="bg-white rounded-lg shadow-sm mb-4">
      <div className="px-6 py-3 border-b">
        <h2 className="text-base font-medium text-gray-700">包装组件</h2>
      </div>
      <div className="p-6">
        {/* 子批次列表 */}
        <h3 className="text-sm font-medium mb-2">子批次列表</h3>
        <div className="border rounded-lg overflow-hidden mb-4">
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="py-2 px-4 w-10 text-left text-gray-700 font-medium"></th>
                  <th className="py-2 px-4 text-left text-gray-700 font-medium">子批次ID</th>
                  <th className="py-2 px-4 text-left text-gray-700 font-medium">片篮编号</th>
                  <th className="py-2 px-4 text-center text-gray-700 font-medium">总片数</th>
                  <th className="py-2 px-4 text-left text-gray-700 font-medium">包装条码</th>
                  <th className="py-2 px-4 text-center text-gray-700 font-medium">包装状态</th>
                </tr>
              </thead>
              <tbody>
                {subBatches.length > 0 ? (
                  subBatches.map((subBatch, index) => (
                    <tr key={subBatch.sublotId} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="py-2 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedSublotIds.includes(subBatch.sublotId)}
                          onChange={() => handleSublotSelect(subBatch.sublotId)}
                          disabled={!!subBatch.packagingBarcode && subBatch.status !== '已打印'} // 禁用已包装且未打印的子批次
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="py-2 px-4">{subBatch.sublotId}</td>
                      <td className="py-2 px-4">{subBatch.carrierId}</td>
                      <td className="py-2 px-4 text-center">{subBatch.totalQty}</td>
                      <td className="py-2 px-4">{subBatch.packagingBarcode || '-'}</td>
                      <td className="py-2 px-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subBatch.status)}`}>
                          {subBatch.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      无子批次数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handlePrintLabels}
            disabled={!isPrintEnabled}
            className={`inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium ${
              isPrintEnabled
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Printer className="w-4 h-4 mr-2" />
            打印标签
          </button>
          <button
            onClick={handlePackage}
            disabled={!isPackageEnabled}
            className={`inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium ${
              isPackageEnabled
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Package className="w-4 h-4 mr-2" />
            包装
          </button>
          <button
            onClick={handleRepack}
            disabled={!isRepackEnabled}
            className={`inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium ${
              isRepackEnabled
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4 mr-2" /> {/* 使用 RotateCcw 图标 */}
            重包
          </button>
        </div>
      </div>
    </div>
  );
};

export default PackagingModule;
