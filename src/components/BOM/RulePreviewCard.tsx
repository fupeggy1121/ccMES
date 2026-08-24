import React from 'react';
import { Zap, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { MaterialSelectionRule, BOMTemplateItem } from '../../types';

interface RulePreviewCardProps {
  rule: MaterialSelectionRule;
  matchedMaterials: BOMTemplateItem[];
  isExpanded: boolean;
  onToggle: () => void;
  evaluationDetails: string;
}

export const RulePreviewCard: React.FC<RulePreviewCardProps> = ({
  rule,
  matchedMaterials,
  isExpanded,
  onToggle,
  evaluationDetails,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-lg overflow-hidden">
      <div
        className="cursor-pointer p-4 flex items-center justify-between hover:bg-blue-200 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-gray-900">规则驱动匹配</h4>
            <p className="text-sm text-gray-600 mt-1">{rule.ruleName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-bold text-blue-600">
              {matchedMaterials.length}
            </div>
            <div className="text-xs text-gray-500">匹配物料</div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-600 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-blue-300 p-4 bg-white">
          <div className="mb-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">{evaluationDetails}</div>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              匹配的物料列表
            </h5>
            {matchedMaterials.length > 0 ? (
              <div className="space-y-2">
                {matchedMaterials.map((material, index) => (
                  <div
                    key={material.id}
                    className="bg-green-50 p-2 rounded border border-green-200 text-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {index + 1}. {material.materialName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          编码: {material.materialCode} | 规格: {material.specification}
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-600">
                        <div>单价: ¥{material.unitPrice.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                暂无匹配物料
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <div className="text-xs text-blue-800">
              <strong>规则说明:</strong> {rule.notes || '未提供规则说明'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
