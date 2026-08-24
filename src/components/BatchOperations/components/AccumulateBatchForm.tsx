// src/components/AccumulateBatchForm.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { X, Combine, Search } from 'lucide-react';
import { BatchData, SubBatchData, BatchDataItem, ProductData, CarrierData, WaferData, TargetCarrier } from '../types'; // 导入新增的类型
import ProductCodeInputSelector from './ProductCodeInputSelector'; // 导入产品选择器
import AccumulateWaferReorganizationModule from './AccumulateWaferReorganizationModule'; // 导入新的攒批片重组组件

// 移除对 SelectedAccumulateBatchesTable 的导入
// import SelectedAccumulateBatchesTable from './SelectedAccumulateBatchesTable'; 

interface AccumulateBatchFormProps {
  handleBackToBatchList: () => void;
  getSubBatchesForMaster: (masterBatchId: string) => SubBatchData[];
  getStatusColor: (status: string) => string;
  isFromStaging?: boolean;
  // batchData 和 subBatches 不再直接作为 props 传入，而是由内部管理或通过其他方式获取
}

// 模拟所有可供攒批的批次数据 (增加到10条以上)
const mockAllAccumulateBatches: BatchData[] = [
  {
    id: 'ACCUM001',
    batchCode: 'ACCUM-A-001',
    productCode: 'P001',
    productName: 'Product Alpha',
    totalQty: 10,
    goodQty: 9,
    defectQty: 1,
    status: '待进站', // 修改为三种状态之一
    station: 'station1',
    stationName: '倒角',
    equipmentCode: 'EQ001',
    equipmentName: 'Equipment A',
    equipmentChamber: 'Chamber 1',
    nextStationCode: 'station2',
    nextStationName: '双面研磨',
    productVersion: 1,
    recipeCode: 'REC001',
    ingotId: 'ING001',
    isSmallBatch: true,
    isHold: true,
  },
  {
    id: 'ACCUM002',
    batchCode: 'ACCUM-A-002',
    productCode: 'P001',
    productName: 'Product Alpha',
    totalQty: 12,
    goodQty: 11,
    defectQty: 1,
    status: '待进站', // 修改为三种状态之一
    station: 'station1',
    stationName: '倒角',
    equipmentCode: 'EQ001',
    equipmentName: 'Equipment A',
    equipmentChamber: 'Chamber 1',
    nextStationCode: 'station2',
    nextStationName: '双面研磨',
    productVersion: 1,
    recipeCode: 'REC001',
    ingotId: 'ING002',
    isSmallBatch: true,
    isHold: true,
  },
  {
    id: 'ACCUM003',
    batchCode: 'ACCUM-B-001',
    productCode: 'P002',
    productName: 'Product Beta',
    totalQty: 8,
    goodQty: 8,
    defectQty: 0,
    status: '待进站', // 修改为三种状态之一
    station: 'station2',
    stationName: '双面研磨',
    equipmentCode: 'EQ002',
    equipmentName: 'Equipment B',
    equipmentChamber: 'Chamber 2',
    nextStationCode: 'station3',
    nextStationName: '双面研磨',
    productVersion: 1,
    recipeCode: 'REC002',
    ingotId: 'ING003',
    isSmallBatch: true,
    isHold: true,
  },
  {
    id: 'ACCUM004',
    batchCode: 'ACCUM-A-003',
    productCode: 'P001',
    productName: 'Product Alpha',
    totalQty: 15,
    goodQty: 14,
    defectQty: 1,
    status: '加工中', // 已经是三种状态之一
    station: 'station1',
    stationName: '倒角',
    equipmentCode: 'EQ001',
    equipmentName: 'Equipment A',
    equipmentChamber: 'Chamber 1',
    nextStationCode: 'station2',
    nextStationName: '双面研磨',
    productVersion: 1,
    recipeCode: 'REC001',
    ingotId: 'ING004',
    isSmallBatch: true,
    isHold: false,
  },
  {
    id: 'ACCUM005',
    batchCode: 'ACCUM-A-004',
    productCode: 'P001',
    productName: 'Product Alpha',
    totalQty: 25, // Not small batch
    goodQty: 24,
    defectQty: 1,
    status: '待进站', // 修改为三种状态之一
    station: 'station1',
    stationName: '倒角',
    equipmentCode: 'EQ001',
    equipmentName: 'Equipment A',
    equipmentChamber: 'Chamber 1',
    nextStationCode: 'station2',
    nextStationName: '双面研磨',
    productVersion: 1,
    recipeCode: 'REC001',
    ingotId: 'ING005',
    isSmallBatch: false,
    isHold: true,
  },
  {
    id: 'ACCUM006',
    batchCode: 'ACCUM-A-005',
    productCode: 'P001',
    productName: 'Product Alpha',
    totalQty: 10,
    goodQty: 9,
    defectQty: 1,
    status: '待进站', // 修改为三种状态之一
    station: 'station3', // Different station
    stationName: '双面研磨',
    equipmentCode: 'EQ003',
    equipmentName: 'Equipment C',
    equipmentChamber: 'Chamber 3',
    nextStationCode: 'thqfhjy',
    nextStationName: '退火前腐后检验',
    productVersion: 1,
    recipeCode: 'REC001',
    ingotId: 'ING006',
    isSmallBatch: true,
    isHold: true,
  },
  {
    id: 'ACCUM007',
    batchCode: 'ACCUM-C-001',
    productCode: 'P001',
    productName: 'Product Alpha',
    totalQty: 18,
    goodQty: 17,
    defectQty: 1,
    status: '待进站', // 修改为三种状态之一
    station: 'station1',
    stationName: '倒角',
    equipmentCode: 'EQ001',
    equipmentName: 'Equipment A',
    equipmentChamber: 'Chamber 1',
    nextStationCode: 'station2',
    nextStationName: '双面研磨',
    productVersion: 1,
    recipeCode: 'REC001',
    ingotId: 'ING007',
    isSmallBatch: true,
    isHold: true,
  },
  {
    id: 'ACCUM008',
    batchCode: 'ACCUM-D-001',
    productCode: 'P001',
    productName: 'Product Alpha',
    totalQty: 11,
    goodQty: 10,
    defectQty: 1,
    status: '待进站', // 修改为三种状态之一
    station: 'station1',
    stationName: '倒角',
    equipmentCode: 'EQ001',
    equipmentName: 'Equipment A',
    equipmentChamber: 'Chamber 1',
    nextStationCode: 'station2',
    nextStationName: '双面研磨',
    productVersion: 1,
    recipeCode: 'REC001',
    ingotId: 'ING008',
    isSmallBatch: true,
    isHold: true,
  },
  {
    id: 'ACCUM009',
    batchCode: 'ACCUM-E-001',
    productCode: 'P001',
    productName: 'Product Alpha',
    totalQty: 9,
    goodQty: 9,
    defectQty: 0,
    status: '待进站', // 修改为三种状态之一
    station: 'station1',
    stationName: '倒角',
    equipmentCode: 'EQ001',
    equipmentName: 'Equipment A',
    equipmentChamber: 'Chamber 1',
    nextStationCode: 'station2',
    nextStationName: '双面研磨',
    productVersion: 1,
    recipeCode: 'REC001',
    ingotId: 'ING009',
    isSmallBatch: true,
    isHold: true,
  },
  {
    id: 'ACCUM010',
    batchCode: 'ACCUM-F-001',
    productCode: 'P001',
    productName: 'Product Alpha',
    totalQty: 14,
    goodQty: 13,
    defectQty: 1,
    status: '待进站', // 修改为三种状态之一
    station: 'station1',
    stationName: '倒角',
    equipmentCode: 'EQ001',
    equipmentName: 'Equipment A',
    equipmentChamber: 'Chamber 1',
    nextStationCode: 'station2',
    nextStationName: '双面研磨',
    productVersion: 1,
    recipeCode: 'REC001',
    ingotId: 'ING010',
    isSmallBatch: true,
    isHold: true,
  },
  {
    id: 'ACCUM011',
    batchCode: 'ACCUM-G-001',
    productCode: 'P001',
    productName: 'Product Alpha',
    totalQty: 16,
    goodQty: 15,
    defectQty: 1,
    status: '待进站', // 修改为三种状态之一
    station: 'station1',
    stationName: '倒角',
    equipmentCode: 'EQ001',
    equipmentName: 'Equipment A',
    equipmentChamber: 'Chamber 1',
    nextStationCode: 'station2',
    nextStationName: '双面研磨',
    productVersion: 1,
    recipeCode: 'REC001',
    ingotId: 'ING011',
    isSmallBatch: true,
    isHold: true,
  },
  {
    id: 'ACCUM012',
    batchCode: 'ACCUM-H-001',
    productCode: 'P002',
    productName: 'Product Beta',
    totalQty: 7,
    goodQty: 7,
    defectQty: 0,
    status: '待进站', // 修改为三种状态之一
    station: 'station2',
    stationName: '双面研磨',
    equipmentCode: 'EQ002',
    equipmentName: 'Equipment B',
    equipmentChamber: 'Chamber 2',
    nextStationCode: 'station3',
    productVersion: 1,
    recipeCode: 'REC002',
    ingotId: 'ING012',
    isSmallBatch: true,
    isHold: true,
  },
];

// 模拟所有产品数据 (用于 ProductCodeInputSelector)
const mockAllProducts: ProductData[] = [
  {
    id: 'prod1',
    productCode: 'P001',
    productName: 'Product Alpha',
    productVersion: 1,
    productType: 'Type A',
    specParams: 'Spec A',
    processPathName: 'Path A',
  },
  {
    id: 'prod2',
    productCode: 'P002',
    productName: 'Product Beta',
    productVersion: 1,
    productType: 'Type B',
    specParams: 'Spec B',
    processPathName: 'Path B',
  },
];

// 模拟站点数据
const mockStations = [
  { code: 'station1', name: '倒角' },
  { code: 'station2', name: '双面研磨' },
  { code: 'station3', name: '双面研磨' },
  { code: 'thqfhjy', name: '退火前腐后检验' },
  { code: 'packagingStation', name: '包装站点' },
  { code: 'markingStation', name: '打标站点' },
  { code: 'geometricInspection', name: '几何参数检验' },
  { code: 'visualInspection', name: '目检' },
  { code: 'particleInspection', name: '颗粒检测' },
];


const AccumulateBatchForm: React.FC<AccumulateBatchFormProps> = ({
  handleBackToBatchList,
  getSubBatchesForMaster,
  getStatusColor,
  isFromStaging = false,
}) => {
  // 筛选条件状态
  const [productCodeFilter, setProductCodeFilter] = useState<string>('');
  const [stationFilter, setStationFilter] = useState<string>('');
  const [isSmallBatchFilter, setIsSmallBatchFilter] = useState<boolean>(true); // 默认勾选小批量
  const [isHoldFilter, setIsHoldFilter] = useState<boolean>(true); // 默认勾选Hold状态

  // 已选择的攒批批次
  const [selectedAccumulateBatches, setSelectedAccumulateBatches] = useState<BatchData[]>([]);
  // 虚拟批次是否已确认
  const [isVirtualBatchConfirmed, setIsVirtualBatchConfirmed] = useState<boolean>(false);
  // 攻批后目标站点（仅当来自暂存批次时需要）
  const [targetAccumulateStation, setTargetAccumulateStation] = useState<string>('');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // 每页显示5条

  // 过滤可用的批次
  const filteredBatches = useMemo(() => {
    return mockAllAccumulateBatches.filter(batch => {
      const matchesProductCode = productCodeFilter ? batch.productCode === productCodeFilter : true;
      const matchesStation = stationFilter ? batch.station === stationFilter : true;
      const matchesSmallBatch = isSmallBatchFilter ? batch.isSmallBatch : true;
      const matchesHold = isHoldFilter ? batch.isHold : true;

      // 如果已经有选中的批次，则只显示与第一个选中批次产品料号、站点、Hold状态、小批量属性一致的批次
      // 这样确保了表格中显示的批次都是可以被选择的（符合一致性规则）
      if (selectedAccumulateBatches.length > 0) {
        const firstSelectedBatch = selectedAccumulateBatches[0];
        return (
          matchesProductCode &&
          matchesStation &&
          matchesSmallBatch &&
          matchesHold &&
          batch.productCode === firstSelectedBatch.productCode &&
          batch.station === firstSelectedBatch.station &&
          batch.isHold && // 必须是Hold状态
          batch.isSmallBatch // 必须是小批量
        );
      }

      // 如果还没有选中的批次，则只应用筛选条件
      // 第一次选择时，handleToggleBatchSelection 会强制检查 isHold 和 isSmallBatch
      return matchesProductCode && matchesStation && matchesSmallBatch && matchesHold;
    });
  }, [productCodeFilter, stationFilter, isSmallBatchFilter, isHoldFilter, selectedAccumulateBatches]);

  // 计算当前页要显示的批次
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBatches = filteredBatches.slice(indexOfFirstItem, indexOfLastItem);

  // 计算总页数
  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);

  // 改变页码
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // 虚拟批次汇总信息
  const virtualBatchSummary = useMemo(() => {
    if (selectedAccumulateBatches.length === 0) {
      return null;
    }

    const totalQty = selectedAccumulateBatches.reduce((sum, batch) => sum + batch.totalQty, 0);
    const goodQty = selectedAccumulateBatches.reduce((sum, batch) => sum + batch.goodQty, 0);
    const defectQty = selectedAccumulateBatches.reduce((sum, batch) => sum + batch.defectQty, 0);
    const firstBatch = selectedAccumulateBatches[0];

    return {
      batchCode: `VIRTUAL-${firstBatch.productCode}-${firstBatch.station}-${Date.now()}`, // 示例虚拟批次编码
      productCode: firstBatch.productCode,
      productName: firstBatch.productName,
      stationName: firstBatch.stationName,
      equipmentName: firstBatch.equipmentName,
      totalQty,
      goodQty,
      defectQty,
      status: firstBatch.status, // 虚拟批次状态可以根据业务逻辑定义，这里简化为第一个批次的状态
    };
  }, [selectedAccumulateBatches]);

  // 处理批次选择/取消选择
  const handleToggleBatchSelection = (batch: BatchData) => {
    setSelectedAccumulateBatches(prevSelected => {
      const isAlreadySelected = prevSelected.some(b => b.id === batch.id);

      if (isAlreadySelected) {
        // 如果已选中，则取消选中
        return prevSelected.filter(b => b.id !== batch.id);
      } else {
        // 如果未选中，则尝试选中
        // 检查新选择的批次是否与已选择的批次保持一致性
        if (prevSelected.length > 0) {
          const firstSelected = prevSelected[0];
          if (
            batch.productCode !== firstSelected.productCode ||
            batch.station !== firstSelected.station ||
            !batch.isHold ||
            !batch.isSmallBatch
          ) {
            alert('所选批次必须处于Hold状态、为小批量，且与已选批次具有相同的产品料号和站点。');
            return prevSelected; // 不添加不符合条件的批次
          }
        } else {
          // 如果是第一个选择的批次，也需要检查其是否为Hold状态和小批量
          if (!batch.isHold || !batch.isSmallBatch) {
            alert('所选批次必须处于Hold状态且为小批量。');
            return prevSelected;
          }
        }
        return [...prevSelected, batch];
      }
    });
  };

  // 确认攒批操作
  const handleConfirmAccumulate = () => {
    if (selectedAccumulateBatches.length < 2) {
      alert('请至少选择两个批次进行攒批操作。');
      return;
    }
    // 模拟攒批逻辑，例如发送API请求
    console.log('确认攒批操作，批次ID:', selectedAccumulateBatches.map(b => b.id));
    setIsVirtualBatchConfirmed(true);
    alert('攒批成功，已形成虚拟批次！');
  };

  // 确认攒批按钮是否可用
  const isConfirmAccumulateEnabled = selectedAccumulateBatches.length >= 2 && !isVirtualBatchConfirmed;

  // 为 WaferBasketReorganizationModule 准备源片篮数据
  const sourceCarriersForReorganization = useMemo(() => {
    const allSubBatches: SubBatchData[] = [];
    selectedAccumulateBatches.forEach(batch => {
      const subBatches = getSubBatchesForMaster(batch.id);
      // 将主批次编码添加到每个子批次的 CarrierData 中
      subBatches.forEach(subBatch => {
        allSubBatches.push({ ...subBatch, masterBatchCode: batch.batchCode });
      });
    });

    // 将 SubBatchData 映射为 WaferBasketReorganizationModule 所需的 CarrierData
    return allSubBatches.map(subBatch => ({
      id: subBatch.carrierId, // 使用 subBatch 的 carrierId 作为 CarrierData 的 id
      sublotId: subBatch.sublotId, // 使用 subBatch 的 sublotId 作为 CarrierData 的 sublotId
      goodQty: subBatch.goodQty,
      defectQty: subBatch.defectQty,
      masterBatchCode: subBatch.masterBatchCode, // 传递 masterBatchCode
    }));
  }, [selectedAccumulateBatches, getSubBatchesForMaster]);

  // 处理 WaferBasketReorganizationModule 的确认回调
  const handleConfirmWaferTransfer = (finalTargetCarriers: TargetCarrier[], finalSourceWafers: WaferData[]) => {
    console.log('Wafer transfer confirmed from AccumulateBatchForm!');
    console.log('Final Target Carriers:', finalTargetCarriers);
    console.log('Final Source Wafers:', finalSourceWafers);
    alert('片子移动重组操作已确认！');
    // 在这里可以添加将数据发送到后端API或更新应用状态的逻辑
  };

  return (
    <>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 space-y-6">
            {/* 批次筛选与选择 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="font-medium mb-4 text-gray-800">批次选择</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* 产品料号筛选 */}
                <div>
                  <label htmlFor="productCodeFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    产品料号:
                  </label>
                  <ProductCodeInputSelector
                    value={productCodeFilter}
                    onSelect={(product) => setProductCodeFilter(product.productCode)}
                    allProducts={mockAllProducts}
                    placeholder="选择产品料号"
                  />
                </div>
                {/* 站点筛选 */}
                <div>
                  <label htmlFor="stationFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    站点:
                  </label>
                  <select
                    id="stationFilter"
                    value={stationFilter}
                    onChange={(e) => setStationFilter(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
                  >
                    <option value="">所有站点</option>
                    {mockStations.map(station => (
                      <option key={station.code} value={station.code}>{station.name}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* 合并后的批次列表 */}
              <h3 className="text-md font-medium mb-2 text-gray-700">批次列表:</h3>
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="py-2 px-4 w-10 text-left text-gray-700 font-medium"></th>
                        <th className="py-2 px-4 text-left text-gray-700 font-medium">批次编码</th>
                        <th className="py-2 px-4 text-left text-gray-700 font-medium">产品料号</th>
                        <th className="py-2 px-4 text-left text-gray-700 font-medium">站点</th>
                        <th className="py-2 px-4 text-center text-gray-700 font-medium">总片数</th>
                        <th className="py-2 px-4 text-center text-gray-700 font-medium">良品数</th>
                        <th className="py-2 px-4 text-center text-gray-700 font-medium">不良品数</th>
                        <th className="py-2 px-4 text-center text-gray-700 font-medium">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBatches.length > 0 ? (
                        currentBatches.map((batch, index) => (
                          <tr key={batch.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="py-2 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={selectedAccumulateBatches.some(b => b.id === batch.id)}
                                onChange={() => handleToggleBatchSelection(batch)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="py-2 px-4">{batch.batchCode}</td>
                            <td className="py-2 px-4">{batch.productCode}</td>
                            <td className="py-2 px-4">{batch.stationName}</td>
                            <td className="py-2 px-4 text-center">{batch.totalQty}</td>
                            <td className="py-2 px-4 text-center">{batch.goodQty}</td>
                            <td className="py-2 px-4 text-center">{batch.defectQty}</td>
                            <td className="py-2 px-4 text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(batch.status)}`}>
                                {batch.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500">
                            没有符合条件的批次可供选择
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* 新的 Flex 容器，包含分页控件和汇总信息 */}
                <div className="flex justify-between items-center p-3 border-t bg-gray-50">
                  {/* 新增的汇总信息展示 */}
                  {virtualBatchSummary && (
                    <div className="p-3 bg-blue-50 rounded-lg text-sm text-gray-700 flex justify-around">
                      <span>总片数: <span className="font-semibold">{virtualBatchSummary.totalQty}</span></span>
                      <span>良品数: <span className="font-semibold text-green-700">{virtualBatchSummary.goodQty}</span></span>
                      <span>不良品数: <span className="font-semibold text-red-700">{virtualBatchSummary.defectQty}</span></span>
                    </div>
                  )}
                  {/* 分页控件 */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        上一页
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => paginate(i + 1)}
                          className={`px-3 py-1 border rounded-md text-sm ${
                            currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        下一页
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 攻批后目标站点（仅暂存批次攻批时显示） */}
            {isFromStaging && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h2 className="font-medium mb-3 text-gray-800">攒批目标站点</h2>
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    选择攒批后进入的目标站点
                  </label>
                  <select
                    value={targetAccumulateStation}
                    onChange={e => setTargetAccumulateStation(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  >
                    <option value="">— 请选择目标站点 —</option>
                    {mockStations.map(s => (
                      <option key={s.code} value={s.code}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Accumulate Wafer Reorganization Module */}
            {selectedAccumulateBatches.length > 0 && (
              <AccumulateWaferReorganizationModule
                initialSourceCarriers={sourceCarriersForReorganization}
                onConfirmTransfer={handleConfirmWaferTransfer}
                disableWaferTypeSelection={false} // 在攒批操作中保持片类型选择启用
                showBatchActionButtons={true} // 在攒批操作中显示批量操作按钮
              />
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                onClick={handleBackToBatchList}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                关闭
              </button>
              <button
                onClick={handleConfirmAccumulate}
                disabled={!isConfirmAccumulateEnabled}
                className={`px-6 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isConfirmAccumulateEnabled
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                确认攒批
              </button>
            </div>
          </div>
        </div>
    </>
  );
};

export default AccumulateBatchForm;