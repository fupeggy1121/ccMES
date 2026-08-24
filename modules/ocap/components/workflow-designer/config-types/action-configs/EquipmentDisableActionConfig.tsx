// src/components/workflow-designer/config-types/action-configs/EquipmentDisableActionConfig.tsx
import React from 'react';
import { Node as RFNode } from 'reactflow'; // 导入 RFNode
import { WorkflowNodeData } from '../../../../types/workflow'; // 导入 WorkflowNodeData
import { HelpCircle } from 'lucide-react';

interface EquipmentDisableActionConfigProps {
  node: RFNode<WorkflowNodeData>; // 修改类型
  onUpdateNode: (updatedNode: RFNode<WorkflowNodeData>) => void; // 修改类型
}

const EquipmentDisableActionConfig: React.FC<EquipmentDisableActionConfigProps> = ({ node, onUpdateNode }) => {
  // 定义预设的扣留原因列表
  const predefinedReasons = ['SPC OOS', '工艺参数超限', '设备故障'];

  // 获取当前节点的扣留原因类型
  const currentDisableReasonType = node.data.config?.disableReasonType || ''; // 访问 node.data.config

  // 判断是否为“其他原因”
  const isOtherReasonSelected = !predefinedReasons.includes(currentDisableReasonType) && currentDisableReasonType !== '';
  const showOtherInput = isOtherReasonSelected || currentDisableReasonType === '其他原因';

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <label className="block text-sm font-medium text-gray-700">扣留原因</label>
          <div className="relative group">
            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="space-y-1">
                <p><strong>SPC OOS:</strong> 统计过程控制超出规格</p>
                <p><strong>工艺参数超限:</strong> 工艺参数超出允许范围</p>
                <p><strong>设备故障:</strong> 设备发生故障</p>
                <p><strong>其他原因:</strong> 其他特殊情况</p>
              </div>
            </div>
          </div>
        </div>
        <select
          value={showOtherInput ? '其他原因' : currentDisableReasonType}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onChange={(e) => {
            const selectedValue = e.target.value;
            if (selectedValue === '其他原因') {
              onUpdateNode({
                ...node,
                data: { // 更新 node.data
                  ...node.data,
                  config: {
                    ...node.data.config, // 访问 node.data.config
                    disableReasonType: '其他原因',
                    disableReasonDetail: node.data.config?.disableReasonDetail || '' // 访问 node.data.config
                  }
                }
              });
            } else {
              onUpdateNode({
                ...node,
                data: { // 更新 node.data
                  ...node.data,
                  config: {
                    ...node.data.config, // 访问 node.data.config
                    disableReasonType: selectedValue,
                    disableReasonDetail: undefined // 清除详细说明
                  }
                }
              });
            }
          }}
        >
          <option value="">请选择扣留原因</option>
          {predefinedReasons.map(reason => (
            <option key={reason} value={reason}>{reason}</option>
          ))}
          <option value="其他原因">其他原因</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">选择设备扣留的原因类型</p>
      </div>

      {showOtherInput && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">详细说明</label>
          <textarea
            value={node.data.config?.disableReasonDetail || ''} // 访问 node.data.config
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            maxLength={200}
            placeholder="请详细说明扣留原因"
            onChange={(e) => {
              onUpdateNode({
                ...node,
                data: { // 更新 node.data
                  ...node.data,
                  config: {
                    ...node.data.config, // 访问 node.data.config
                    disableReasonDetail: e.target.value,
                    disableReasonType: node.data.config?.disableReasonType === '其他原因' ? '其他原因' : currentDisableReasonType // 访问 node.data.config
                  }
                }
              });
            }}
          />
          <p className="text-xs text-gray-500 mt-1">
            {node.data.config?.disableReasonDetail?.length || 0} / 200 字符 {/* 访问 node.data.config */}
          </p>
        </div>
      )}
    </div>
  );
};

export default EquipmentDisableActionConfig;
