// src/components/Shipment/ShippingOrderDetailModal.tsx
import React, { useMemo } from 'react';
import { 
  X, FileText, User, MapPin, Calendar, Box, Layers, Battery, 
  ClipboardList, Truck, CheckCircle, Clock, AlertTriangle, ArrowRight,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { PalletRecord, ShippingOrderRecord, BigPackRecord } from '../../types';

// 新增晶圆数据接口
interface Wafer {
  id: string;
  packagingBoxBarcode: string;
  slot: number;
}

// 新增模拟晶圆数据函数
const generateMockWafers = (smallBoxBarcode: string, count: number = 24): Wafer[] => {
  const wafers: Wafer[] = [];
  for (let i = 1; i <= count; i++) {
    wafers.push({
      id: `${smallBoxBarcode}-W${i.toString().padStart(2, '0')}`,
      packagingBoxBarcode: smallBoxBarcode,
      slot: i,
    });
  }
  return wafers;
};

interface ShippingOrderDetailModalProps {
  order: ShippingOrderRecord;
  palletRecords: PalletRecord[];
  bigPackRecords: BigPackRecord[];
  onClose: () => void;
}

export const ShippingOrderDetailModal: React.FC<ShippingOrderDetailModalProps> = ({ 
  order, 
  palletRecords,
  bigPackRecords,
  onClose 
}) => {
  const [expandedSmallBoxes, setExpandedSmallBoxes] = React.useState<Record<string, boolean>>({});

  const toggleSmallBoxExpansion = (smallBoxId: string) => {
    setExpandedSmallBoxes(prev => ({
      ...prev,
      [smallBoxId]: !prev[smallBoxId]
    }));
  };

  // 获取当前订单关联的托盘
  const relatedSmallBoxes = palletRecords.filter(pallet => 
    order.palletIds.includes(pallet.id)
  );

  // 生成批次编码的辅助函数
  const generateBatchCode = (productType: string, customerName: string, shippingDate: Date, sequenceNumber: number) => {
    // 产品代码映射
    const productCodeMap: Record<string, string> = {
      'HJT电池片': 'HJT',
      'Perc电池片': 'PERC',
      'Perovskite电池片': 'PSK',
      'Topcon电池片': 'TOPCON',
      'PERC电池片': 'PERC',
      'TOPCon电池片': 'TOPCON',
      '未知产品': 'UNKNOWN'
    };

    // 客户代码映射
    const customerCodeMap: Record<string, string> = {
      '客户A': 'CA',
      '客户B': 'CB',
      '客户C': 'CC',
      '客户D': 'CD',
      '客户E': 'CE'
    };

    const productCode = productCodeMap[productType] || 'CELL';
    const customerCode = customerCodeMap[customerName] || 'CX';
    const dateCode = shippingDate.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const sequence = sequenceNumber.toString().padStart(3, '0');

    return `${productCode}-${customerCode}-${dateCode}-${sequence}`;
  };

  const productSummary = useMemo(() => {
    const summaryMap: Record<string, {
      productCode: string;
      productName: string;
      batchCode: string;
      quantity: number; // Total wafers
      totalSmallBoxes: Set<string>; // Use a Set to count unique small boxes
    }> = {};

    relatedSmallBoxes.forEach(smallBox => {
      // 假设每个小盒包含24片晶圆
      const wafersInSmallBox = 24;
      // 查找与当前小盒关联的大包，以获取产品类型
      const associatedBigPacks = bigPackRecords.filter(bp =>
        smallBox.bigPackBarcodes.includes(bp.bigPackBarcode)
      );

      // 使用半导体外延片产品类型
      const productType = associatedBigPacks.length > 0 ? 
        associatedBigPacks[0].productType : 
        ['氮化镓外延片', '砷化镓外延片', '碳化硅外延片'][Math.floor(Math.random() * 3)];
      const productCode = productType;
      const productName = productType;

      if (!summaryMap[productType]) {
        summaryMap[productType] = {
          productCode,
          productName,
          batchCode: '', // Will be filled after aggregation
          quantity: 0,
          totalSmallBoxes: new Set(),
        };
      }

      summaryMap[productType].quantity += wafersInSmallBox;
      summaryMap[productType].totalSmallBoxes.add(smallBox.id);
    });

    // Convert map to array and generate batch codes
    const sortedProducts = Object.values(summaryMap).sort((a, b) => a.productName.localeCompare(b.productName));

    return sortedProducts.map((product, index) => {
      const batch = generateBatchCode(
        product.productCode,
        order.customerName,
        order.shippingDate,
        index + 1
      );
      return {
        ...product,
        batchCode: batch,
        totalSmallBoxes: product.totalSmallBoxes.size
      };
    });
  }, [order, relatedSmallBoxes, bigPackRecords]);

  // 获取状态图标和文本
  const getStatusInfo = () => {
    switch (order.status) {
      case 'draft':
        return { icon: <ClipboardList className="w-5 h-5 text-gray-600" />, text: '草稿' };
      case 'confirmed':
      case 'pending_shipment':
        return { icon: <Clock className="w-5 h-5 text-yellow-600" />, text: '待发货' };
      case 'partially_shipped':
        return { icon: <AlertTriangle className="w-5 h-5 text-orange-600" />, text: '部分发货' };
      case 'shipped':
      case 'delivered':
        return { icon: <Truck className="w-5 h-5 text-green-600" />, text: '已发货' };
      default:
        return { icon: <ClipboardList className="w-5 h-5 text-gray-600" />, text: order.status };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* 模态框头部 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">出货单详情</h3>
            <div className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center">
              {statusInfo.icon}
              <span className="ml-2">{statusInfo.text}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* 基本信息区域 */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ClipboardList className="w-5 h-5 text-gray-600 mr-2" />
            基本信息
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 text-gray-500 mt-0.5">
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">发货工厂</p>
                <p className="text-base font-medium text-gray-900">HaloVegaSolar工厂</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 text-gray-500 mt-0.5">
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">发货仓库</p>
                <p className="text-base font-medium text-gray-900">W12出货仓</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 text-gray-500 mt-0.5">
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">收货工厂</p>
                <p className="text-base font-medium text-gray-900">{order.customerName}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 text-gray-500 mt-0.5">
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">收货仓库</p>
                <p className="text-base font-medium text-gray-900">XXX材料仓</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 text-gray-500 mt-0.5">
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">出货单号</p>
                <p className="text-base font-medium text-gray-900">{order.orderNumber}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 text-gray-500 mt-0.5">
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">出货日期</p>
                <p className="text-base font-medium text-gray-900">
                  {order.shippingDate.toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
             
            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 text-gray-500 mt-0.5">
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">创建人</p>
                <p className="text-base font-medium text-gray-900">{order.createdBy || '系统管理员'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 产品信息区域 */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Box className="w-5 h-5 text-gray-600 mr-2" />
            产品汇总
          </h4>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    产品编码
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    产品名称
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    批次号
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    片数
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    小盒数
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productSummary.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.productCode}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.productName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.batchCode}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity.toLocaleString()} 片
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.totalSmallBoxes} 个
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-medium">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900" colSpan={3}>总计</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {order.totalCellQuantity.toLocaleString()} 片
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {order.totalPallets} 个
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 小盒信息区域 */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Layers className="w-5 h-5 text-gray-600 mr-2" />
            小盒信息
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({relatedSmallBoxes.length} 个小盒)
            </span>
          </h4>
          
          <div className="space-y-4">
            {relatedSmallBoxes.map((smallBox, index) => {
              const wafers = generateMockWafers(smallBox.palletNumber);

              return (
                <div key={smallBox.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSmallBoxExpansion(smallBox.id)}
                  >
                    <div className="flex items-center">
                      {expandedSmallBoxes[smallBox.id] ? (
                        <ChevronDown className="w-4 h-4 text-gray-600 mr-2" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-600 mr-2" />
                      )}
                      <Layers className="w-4 h-4 text-gray-600 mr-2" />
                      <span className="font-medium text-gray-900">
                        小盒 #{index + 1}: {smallBox.palletNumber}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {wafers.length} 片晶圆
                    </div>
                  </div>

                  {expandedSmallBoxes[smallBox.id] && (
                    <div className="p-4">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              晶圆 ID
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              包装盒条码标签
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              槽位
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {wafers.map(wafer => (
                            <tr key={wafer.id}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {wafer.id}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {wafer.packagingBoxBarcode}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {wafer.slot}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};