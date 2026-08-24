import React from 'react';
import { X, Info } from 'lucide-react';

interface ShippingProcessModalProps {
  onClose: () => void;
}

export const ShippingProcessModal: React.FC<ShippingProcessModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Info className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">发货业务流程</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">业务流程图</h3>
          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm text-gray-800">
            <p className="font-medium mb-2">简化流程示意：</p>
            <p>1. 运营人员创建出货单</p>
            <p className="ml-4">↓</p>
            <p>2. QMS模块生成出货检验报告 (下载/打印)</p>
            <p className="ml-4">↓</p>
            <p>3. 线边仓自动生成出库单</p>
            <p className="ml-4">↓</p>
            <p>4. 仓管人员清点批次 & 打印出货单</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">业务流程说明</h3>
          <div className="space-y-3 text-gray-700 text-base">
            <p>1. <strong>运营人员创建出货单:</strong> 运营人员在系统中录入客户信息、出货产品、数量等，生成正式的出货单。</p>
            <p>2. <strong>出货单触发QMS模块生成出货检验报告:</strong> 出货单创建后，系统会自动触发质量管理系统（QMS），根据出货批次生成对应的质量检验报告。此报告可供下载和打印，用于随货同行或客户查验。</p>
            <p>3. <strong>出货单触发线边仓自动生成出库单:</strong> 同时，出货单也会自动通知线边仓管理系统，生成相应的出库单。仓管人员依据此出库单进行出货批次的清点、核对，并打印最终的出货单据，完成发货准备工作。</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
