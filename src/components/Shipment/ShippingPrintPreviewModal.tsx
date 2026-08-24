// src/components/Shipment/ShippingPrintPreviewModal.tsx
import React, { useMemo } from 'react';
import { 
  X, FileText, User, MapPin, Calendar, Box, Layers, 
  Printer, ClipboardList, Truck, CheckCircle, Clock 
} from 'lucide-react';
import { PalletRecord, ShippingOrderRecord, BigPackRecord } from '../../types';

interface ShippingPrintPreviewModalProps {
  order: ShippingOrderRecord;
  palletRecords: PalletRecord[];
  bigPackRecords: BigPackRecord[];
  onClose: () => void;
}

export const ShippingPrintPreviewModal: React.FC<ShippingPrintPreviewModalProps> = ({ 
  order, 
  palletRecords,
  bigPackRecords,
  onClose 
}) => {
  // 获取当前订单关联的托盘
  const relatedPallets = useMemo(() => {
    return palletRecords.filter(pallet =>
      order.palletIds.includes(pallet.id)
    );
  }, [order.palletIds, palletRecords]);

  // 生成批次编码的辅助函数
  const generateBatchCode = (productType: string, customerName: string, shippingDate: Date, sequenceNumber: number) => {
    // 产品代码映射
    const productCodeMap: Record<string, string> = {
      'HJT电池片': 'HJT',
      'Perc电池片': 'PERC',
      'Perovskite电池片': 'PSK',
      'Topcon电池片': 'TOPCON',
      'PERC电池片': 'PERC',
      'TOPCon电池片': 'TOPCON'
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

  // 聚合产品信息用于表格展示 (修改后的逻辑)
  const aggregatedProductInfo = useMemo(() => {
    // 第一步：按产品类型聚合数据（不含批次号）
    const productMapWithoutBatch: Record<string, {
      materialCode: string;
      materialName: string;
      unit: string;
      quantity: number;
      totalSmallBoxes: Set<string>;
      notes: string;
    }> = {};

    relatedPallets.forEach(pallet => {
      // 假设每个小盒包含24片晶圆
      const wafersInSmallBox = 24;
      const associatedBigPacks = bigPackRecords.filter(bp =>
        pallet.bigPackBarcodes.includes(bp.bigPackBarcode)
      );

      // 使用半导体外延片产品类型
      const productType = associatedBigPacks.length > 0 ? 
        associatedBigPacks[0].productType : 
        ['氮化镓外延片', '砷化镓外延片', '碳化硅外延片'][Math.floor(Math.random() * 3)];
      const materialCode = productType;
      const materialName = productType;

      if (!productMapWithoutBatch[materialCode]) {
        productMapWithoutBatch[materialCode] = {
          materialCode,
          materialName,
          unit: '片',
          quantity: 0,
          totalSmallBoxes: new Set(),
          notes: associatedBigPacks[0]?.notes || ''
        };
      }

      productMapWithoutBatch[materialCode].quantity += wafersInSmallBox;
      productMapWithoutBatch[materialCode].totalSmallBoxes.add(pallet.id);
    });

    // 第二步：转换为数组并按产品名称排序
    const sortedProducts = Object.values(productMapWithoutBatch)
      .sort((a, b) => a.materialName.localeCompare(b.materialName));

    // 第三步：为每个产品类型生成批次号
    return sortedProducts.map((product, index) => {
      const batch = generateBatchCode(
        product.materialCode,
        order.customerName,
        order.shippingDate,
        index + 1  // 使用排序后的索引作为序列号
      );
      
      return {
        ...product,
        batch,
        totalSmallBoxes: product.totalSmallBoxes.size
      };
    });
  }, [order, relatedPallets, bigPackRecords]);

  // 计算表格底部的总计
  const totalQuantitySum = aggregatedProductInfo.reduce((sum, item) => sum + item.quantity, 0);
  const totalSmallBoxesSum = aggregatedProductInfo.reduce((sum, item) => sum + item.totalSmallBoxes, 0);

  // 处理打印功能
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* 模态框头部 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <Printer className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-900">{order.customerName}出货单打印预览</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* 打印内容区域 */}
        <div className="p-6">
          {/* 这里放置打印预览内容 */}
          <div className="bg-white p-6">
            <h1 className="text-2xl font-bold text-center mb-8">{order.customerName}出货单</h1>
            
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-20 font-medium">发货工厂:</span>
                  <span>HaloVegaSolar工厂</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-medium">收货工厂:</span>
                  <span>{order.customerName}</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-medium">出货单号:</span>
                  <span>{order.orderNumber}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-20 font-medium">发货仓库:</span>
                  <span>W12出货仓</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-medium">收货仓库:</span>
                  <span>XXX材料仓</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-medium">出货日期:</span>
                  <span>{order.shippingDate.toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </div>
            
            {/* 发货产品信息表格 */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4">发货产品信息</h3>
            <table className="w-full border-collapse border border-gray-300 mb-6 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left text-xs font-medium text-gray-700">物料编码</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-medium text-gray-700">物料名称</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-medium text-gray-700">批次</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-medium text-gray-700">单位</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-medium text-gray-700">数量</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-medium text-gray-700">合计小盒数</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-medium text-gray-700">备注</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedProductInfo.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2 text-sm">{item.materialCode}</td>
                    <td className="border border-gray-300 p-2 text-sm">{item.materialName}</td>
                    <td className="border border-gray-300 p-2 text-sm">{item.batch}</td>
                    <td className="border border-gray-300 p-2 text-sm">{item.unit}</td>
                    <td className="border border-gray-300 p-2 text-sm">{item.quantity.toLocaleString()}</td>
                    <td className="border border-gray-300 p-2 text-sm">{item.totalSmallBoxes}</td>
                    <td className="border border-gray-300 p-2 text-sm">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-medium">
                <tr>
                  <td className="border border-gray-300 p-2 text-sm text-right" colSpan={4}>总计</td>
                  <td className="border border-gray-300 p-2 text-sm">{totalQuantitySum.toLocaleString()}</td>
                  <td className="border border-gray-300 p-2 text-sm">{totalSmallBoxesSum}</td>
                  <td className="border border-gray-300 p-2 text-sm"></td>
                </tr>
              </tfoot>
            </table>
            
            {/* 签名区域 */}
            <div className="flex justify-between mt-12 text-sm">
              <div>
                <p>仓库管理员: 张三 (仓库管理员)</p>
                <p className="mt-2">日期: ________________</p>
              </div>
              <div>
                <p>客户签收: ________________</p>
                <p className="mt-2">日期: ________________</p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end p-6 border-t border-gray-200 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            打印出货单
          </button>
        </div>
      </div>
    </div>
  );
};