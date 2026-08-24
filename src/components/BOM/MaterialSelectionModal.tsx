import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, CheckCircle, Package, AlertCircle, Shield, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { BOMItem, MaterialSelectionRule, ProductProcessSpec } from '../../types';
import { evaluateMaterialCompliance, RuleEvaluationResult } from '../../utils/ruleEvaluator';
import { materialRulesService } from '../../services/materialRulesService';

interface MaterialWithCompliance extends BOMItem {
  compliance: RuleEvaluationResult;
}

interface MaterialSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (material: BOMItem) => void;
  allMaterials: BOMItem[];
  processStationCode: string;
  productProcessSpec: ProductProcessSpec | null;
  materialCategory: string;
  existingMaterialCode?: string;
}

export const MaterialSelectionModal: React.FC<MaterialSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  allMaterials,
  processStationCode,
  productProcessSpec,
  materialCategory,
  existingMaterialCode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialWithCompliance | null>(null);
  const [rules, setRules] = useState<MaterialSelectionRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [expandedViolations, setExpandedViolations] = useState<string | null>(null);
  const [showNonCompliant, setShowNonCompliant] = useState(false);

  useEffect(() => {
    if (!isOpen || !processStationCode || !materialCategory) return;
    setRulesLoading(true);
    materialRulesService
      .fetchRulesByProcessStationAndCategory(processStationCode, materialCategory)
      .then(setRules)
      .catch(() => setRules([]))
      .finally(() => setRulesLoading(false));
  }, [isOpen, processStationCode, materialCategory]);

  const materialsWithCompliance = useMemo<MaterialWithCompliance[]>(() => {
    const filtered = allMaterials.filter(
      m =>
        m.processStationCode === processStationCode &&
        (m as any).attributes?.some(
          (attr: any) => attr.key === 'materialCategory' && attr.value === materialCategory
        )
    );

    return filtered.map(m => ({
      ...m,
      compliance: evaluateMaterialCompliance(m, rules, productProcessSpec),
    }));
  }, [allMaterials, processStationCode, materialCategory, rules, productProcessSpec]);

  const compliantMaterials = useMemo(
    () => materialsWithCompliance.filter(m => m.compliance.compliant),
    [materialsWithCompliance]
  );

  const nonCompliantMaterials = useMemo(
    () => materialsWithCompliance.filter(m => !m.compliance.compliant),
    [materialsWithCompliance]
  );

  const displayMaterials = useMemo(() => {
    const base = showNonCompliant ? materialsWithCompliance : compliantMaterials;
    if (!searchTerm) return base;
    const term = searchTerm.toLowerCase();
    return base.filter(
      m =>
        m.materialCode.toLowerCase().includes(term) ||
        m.materialName.toLowerCase().includes(term) ||
        m.specification.toLowerCase().includes(term)
    );
  }, [materialsWithCompliance, compliantMaterials, showNonCompliant, searchTerm]);

  useEffect(() => {
    if (existingMaterialCode && materialsWithCompliance.length > 0) {
      const initial = materialsWithCompliance.find(m => m.materialCode === existingMaterialCode);
      if (initial) setSelectedMaterial(initial);
    }
  }, [existingMaterialCode, materialsWithCompliance]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedMaterial(null);
      setExpandedViolations(null);
      setShowNonCompliant(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (selectedMaterial && selectedMaterial.compliance.compliant) {
      onSelect(selectedMaterial);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">选择物料 — {materialCategory}</h2>
              <p className="text-xs text-gray-500 mt-0.5">工艺站点: {processStationCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {rules.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-100 bg-blue-50">
            <div className="flex items-center gap-2 text-xs text-blue-800">
              <Shield className="w-3.5 h-3.5" />
              <span className="font-medium">已启用 {rules.length} 条选料规则</span>
              <span className="text-blue-600">—</span>
              <span>{compliantMaterials.length} 种合规 / {nonCompliantMaterials.length} 种不合规</span>
            </div>
            {rulesLoading && <p className="text-xs text-blue-600 mt-1">正在加载规则...</p>}
          </div>
        )}

        <div className="px-6 py-3 border-b border-gray-100 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜索物料编码、名称或规格..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {nonCompliantMaterials.length > 0 && (
            <button
              onClick={() => setShowNonCompliant(v => !v)}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors flex items-center gap-1.5 ${showNonCompliant ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {showNonCompliant ? '隐藏不合规' : `显示不合规 (${nonCompliantMaterials.length})`}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {displayMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Package className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                {compliantMaterials.length === 0 && rules.length > 0
                  ? '当前规则下没有合规物料'
                  : '未找到匹配的物料'}
              </p>
              {compliantMaterials.length === 0 && rules.length > 0 && (
                <button
                  onClick={() => setShowNonCompliant(true)}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  查看不合规物料
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {displayMaterials.map(material => {
                const isSelected = selectedMaterial?.id === material.id;
                const compliant = material.compliance.compliant;
                const showingViolations = expandedViolations === material.id;

                return (
                  <div
                    key={material.id}
                    onClick={() => compliant && setSelectedMaterial(material)}
                    className={[
                      'border rounded-xl p-4 transition-all',
                      compliant ? 'cursor-pointer' : 'cursor-not-allowed',
                      isSelected && compliant
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : compliant
                        ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                        : 'border-red-200 bg-red-50/50 opacity-70',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="materialSelection"
                        checked={isSelected}
                        disabled={!compliant}
                        onChange={() => compliant && setSelectedMaterial(material)}
                        className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 text-sm">{material.materialName}</span>
                          <span className="text-xs text-gray-500 font-mono">{material.materialCode}</span>
                          {compliant ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              <CheckCircle className="w-3 h-3" /> 合规
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                              <AlertCircle className="w-3 h-3" /> 不合规
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{material.specification}</p>

                        {(material as any).attributes && (material as any).attributes.length > 0 && (
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                            {(material as any).attributes
                              .filter((a: any) => a.key !== 'materialCategory')
                              .map((attr: any) => (
                                <span key={attr.key} className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-mono">
                                  {attr.key}: {attr.value}{attr.unit ? ` ${attr.unit}` : ''}
                                </span>
                              ))}
                          </div>
                        )}

                        {!compliant && material.compliance.violations.length > 0 && (
                          <div className="mt-2">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setExpandedViolations(showingViolations ? null : material.id);
                              }}
                              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                            >
                              <Info className="w-3 h-3" />
                              查看 {material.compliance.violations.length} 条违规原因
                              {showingViolations ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {showingViolations && (
                              <ul className="mt-1.5 space-y-1">
                                {material.compliance.violations.map(v => (
                                  <li key={v.ruleId} className="flex items-start gap-1.5 text-xs text-red-700 bg-red-100 rounded px-2 py-1.5">
                                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                                    <span><strong>{v.ruleName}：</strong>{v.message}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-gray-900">¥{material.unitPrice?.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">库存: {material.stockQuantity} {material.unit}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {selectedMaterial
              ? <span>已选: <strong className="text-gray-900">{selectedMaterial.materialName}</strong></span>
              : <span>请选择一个合规物料</span>
            }
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedMaterial || !selectedMaterial.compliance.compliant}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              确认选择
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
