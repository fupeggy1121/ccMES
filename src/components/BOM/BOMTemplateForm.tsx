// src/components/BOM/BOMTemplateForm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Package, Calculator, FileText, AlertCircle, Save, Copy, Zap, Settings } from 'lucide-react';
import { ProcessStation } from '../../services/processRouteService';
import { processRouteService } from '../../services/processRouteService';
import { MaterialSelectionModal } from './MaterialSelectionModal';
import { generateMockMaterialMaster } from '../../data/mockMaterialMaster';
import { MaterialSelectionRule, ProductProcessSpec, BOMItem } from '../../types';
import { RuleDefinitionForm } from '../MaterialRules/RuleDefinitionForm';

interface BOMTemplateFormProps {
  template?: any;
  isEdit: boolean;
  onClose: () => void;
  onSubmit: (templateData: any) => void;
  products: any[];
}

interface AlternativeMaterial {
  id: string;
  materialCode: string;
  materialName: string;
  specification: string;
  unit: string;
  requiredQuantity: number;
  unitPrice: number;
  supplier: string;
  notes?: string;
  parentId: string;
}

export const BOMTemplateForm: React.FC<BOMTemplateFormProps> = ({
  template,
  isEdit,
  onClose,
  onSubmit,
  products,
}) => {
  const [formData, setFormData] = useState({
    templateName: '',
    templateCode: '',
    productType: '',
    productRefId: '',
    version: '1.0',
    description: '',
    status: 'active'
  });

  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeProcessStationCode, setActiveProcessStationCode] = useState<string>('');
  const [currentProductProcessStations, setCurrentProductProcessStations] = useState<ProcessStation[]>([]);
  const [showMaterialSelectionModal, setShowMaterialSelectionModal] = useState(false);
  const [currentMaterialEditIndex, setCurrentMaterialEditIndex] = useState<number | null>(null);
  const [currentMaterialCategory, setCurrentMaterialCategory] = useState<string>('');
  const [itemErrors, setItemErrors] = useState<Record<string, Record<string, string>>>({});

  const allMaterialMasterData = useMemo(() => generateMockMaterialMaster(), []);
  
  // 提取唯一的物料类别
  const materialCategories = useMemo(() => {
    const categories = new Set<string>();
    allMaterialMasterData.forEach(material => {
      if (material.materialCategory) {
        categories.add(material.materialCategory);
      }
    });
    return Array.from(categories).sort();
  }, [allMaterialMasterData]);

  const mockProductProcessSpec: ProductProcessSpec = {
    productRefId: formData.productRefId,
    slicingThicknessTarget: 10,
  };

  useEffect(() => {
    if (template) {
      setFormData({
        templateName: template.templateName || '',
        templateCode: template.templateCode || '',
        productType: template.productType || '',
        productRefId: template.productRefId || '',
        version: template.version || '1.0',
        description: template.description || '',
        status: template.status || 'active'
      });

      const convertedItems = template.bomItems?.map((item: any) => ({
        ...item,
        requiredQuantity: item.requiredQuantity || 0,
        alternatives: item.alternatives?.map((alt: any) => ({
          ...alt,
          requiredQuantity: alt.requiredQuantity || 0,
        })) || [],
        attributes: item.attributes || [],
        processStationCode: item.processStationCode || '',
        selectionMode: item.selectionMode || 'manual',
        ruleConfig: item.ruleConfig || undefined
      })) || [];

      setBomItems(convertedItems);
    } else {
      setBomItems([]);
    }
  }, [template]);

  useEffect(() => {
    if (formData.productType) {
      const selectedProduct = products.find(p => p.product_name === formData.productType);
      if (selectedProduct && selectedProduct.supabase_id) {
        const fetchStations = async () => {
          try {
            const stations = await processRouteService.fetchProcessStationsForProduct(selectedProduct.supabase_id);
            setCurrentProductProcessStations(stations);
            if (stations.length > 0) {
              setActiveProcessStationCode(stations[0].code);
            } else {
              setActiveProcessStationCode('');
            }
          } catch (error) {
            console.error('Failed to fetch process stations for product:', error);
            setCurrentProductProcessStations([]);
            setActiveProcessStationCode('');
          }
        };
        fetchStations();
      } else {
        setCurrentProductProcessStations([]);
        setActiveProcessStationCode('');
      }
    } else {
      setCurrentProductProcessStations([]);
      setActiveProcessStationCode('');
    }
  }, [formData.productType, products]);

  useEffect(() => {
    if (formData.productType && !isEdit && bomItems.length === 0) {
      const stations = currentProductProcessStations;
      if (stations.length > 0) {
        const newItem: BOMItem = {
          id: Date.now().toString(),
          materialCode: '',
          materialName: '',
          specification: '',
          unit: '',
          requiredQuantity: 0,
          unitPrice: 0,
          supplier: '',
          notes: '',
          alternatives: [],
          processStationCode: stations[0].code,
          attributes: [],
          selectionMode: 'manual',
          ruleConfig: undefined
        };
        setBomItems([newItem]);
      }
    }
  }, [formData.productType, isEdit, currentProductProcessStations, bomItems.length]);

  const units = ['片', 'g', 'kg', '张', '个', 'L', 'ml', 'm', 'cm'];
  const suppliers = ['供应商A', '供应商B', '供应商C', '供应商D', '供应商E'];

  const getProcessStationName = (code: string) => {
    const station = currentProductProcessStations.find(s => s.code === code);
    return station ? station.name : '未知站点';
  };

  const addBOMItem = () => {
    let stationCode = activeProcessStationCode;
    if (!stationCode && currentProductProcessStations.length > 0) {
      stationCode = currentProductProcessStations[0].code;
    }
    const newItem: BOMItem = {
      id: Date.now().toString(),
      materialCode: '',
      materialName: '',
      specification: '',
      unit: '',
      requiredQuantity: 0,
      unitPrice: 0,
      supplier: '',
      notes: '',
      alternatives: [],
      processStationCode: stationCode,
      attributes: [],
      selectionMode: 'manual',
      ruleConfig: undefined
    };
    setBomItems([...bomItems, newItem]);
  };

  const removeBOMItem = (id: string) => {
    if (bomItems.length > 0) {
      setBomItems(bomItems.filter(item => item.id !== id));
    }
  };

  const updateBOMItem = (id: string, field: keyof BOMItem, value: any) => {
    setBomItems(bomItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleRuleDefinitionChange = (itemId: string, field: string, value: any) => {
    updateBOMItem(itemId, 'ruleConfig', {
      ...bomItems.find(item => item.id === itemId)?.ruleConfig,
      [field]: value
    });
  };

  const handleProductAttributeChange = (itemId: string, value: string) => {
    updateBOMItem(itemId, 'ruleConfig', {
      ...bomItems.find(item => item.id === itemId)?.ruleConfig,
      drivingProductAttribute: value
    });
  };

  const handleLogicExpressionChange = (itemId: string, value: string) => {
    updateBOMItem(itemId, 'ruleConfig', {
      ...bomItems.find(item => item.id === itemId)?.ruleConfig,
      drivingLogicExpression: value
    });
  };

  const addAlternativeMaterial = (parentId: string) => {
    const parentItem = bomItems.find(item => item.id === parentId);
    const stationCode = parentItem?.processStationCode || activeProcessStationCode;
    
    const newAlternative: AlternativeMaterial = {
      id: 'alt-' + Date.now(),  // 修改为字符串拼接，避免模板字符串解析错误
      materialCode: '',
      materialName: '',
      specification: '',
      unit: '',
      requiredQuantity: 0,
      unitPrice: 0,
      supplier: '',
      notes: '',
      parentId
    };

    setBomItems(bomItems.map(item => 
      item.id === parentId 
        ? { 
            ...item, 
            alternatives: [...(item.alternatives || []), newAlternative] 
          }
        : item
    ));
  };

  const removeAlternativeMaterial = (parentId: string, alternativeId: string) => {
    setBomItems(bomItems.map(item => 
      item.id === parentId 
        ? { 
            ...item, 
            alternatives: (item.alternatives || []).filter(alt => alt.id !== alternativeId) 
          }
        : item
    ));
  };

  const updateAlternativeMaterial = (parentId: string, alternativeId: string, field: keyof AlternativeMaterial, value: any) => {
    setBomItems(bomItems.map(item => 
      item.id === parentId 
        ? {
            ...item,
            alternatives: (item.alternatives || []).map(alt => 
              alt.id === alternativeId ? { ...alt, [field]: value } : alt
            )
          }
        : item
    ));
  };

  const handleMaterialCodeChange = (
    id: string, 
    newMaterialCode: string, 
    isAlternative: boolean,
    parentId?: string
  ) => {
    const matchedMaterial = allMaterialMasterData.find(
      material => material.materialCode === newMaterialCode
    );

    if (matchedMaterial) {
      if (!isAlternative) {
        updateBOMItem(id, 'materialName', matchedMaterial.materialName);
        updateBOMItem(id, 'specification', matchedMaterial.specification);
        updateBOMItem(id, 'unit', matchedMaterial.unit);
        updateBOMItem(id, 'attributes', matchedMaterial.attributes);
      } else if (parentId) {
        updateAlternativeMaterial(parentId, id, 'materialName', matchedMaterial.materialName);
        updateAlternativeMaterial(parentId, id, 'specification', matchedMaterial.specification);
        updateAlternativeMaterial(parentId, id, 'unit', matchedMaterial.unit);
      }
    } else {
      if (!isAlternative) {
        updateBOMItem(id, 'materialName', '');
        updateBOMItem(id, 'specification', '');
        updateBOMItem(id, 'unit', '');
        updateBOMItem(id, 'attributes', []);
      } else if (parentId) {
        updateAlternativeMaterial(parentId, id, 'materialName', '');
        updateAlternativeMaterial(parentId, id, 'specification', '');
        updateAlternativeMaterial(parentId, id, 'unit', '');
      }
    }
  };

  const handleOpenMaterialSelection = (itemIndex: number, category: string) => {
    setCurrentMaterialEditIndex(itemIndex);
    setCurrentMaterialCategory(category);
    setShowMaterialSelectionModal(true);
  };

  const handleMaterialSelected = (selectedMaterial: BOMItem) => {
    if (currentMaterialEditIndex !== null) {
      const updatedItems = [...bomItems];
      updatedItems[currentMaterialEditIndex] = {
        ...selectedMaterial,
        id: updatedItems[currentMaterialEditIndex].id,
        requiredQuantity: updatedItems[currentMaterialEditIndex].requiredQuantity,
        processStationCode: updatedItems[currentMaterialEditIndex].processStationCode,
        alternatives: updatedItems[currentMaterialEditIndex].alternatives,
      };
      setBomItems(updatedItems);
    }
    setShowMaterialSelectionModal(false);
    setCurrentMaterialEditIndex(null);
    setCurrentMaterialCategory('');
  };

  const validateRuleConfig = (ruleConfig: any): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!ruleConfig.materialCategory?.trim()) {
      errors.materialCategory = '请输入物料类别';
    }
    if (!ruleConfig.targetMaterialAttribute?.trim()) {
      errors.targetMaterialAttribute = '请输入目标物料属性';
    }
    if (!ruleConfig.ruleType) {
      errors.ruleType = '请选择规则类型';
    }

    const ruleDef = ruleConfig.ruleDefinition || {};

    if (ruleConfig.ruleType === 'range') {
      if (ruleDef.min === '' || ruleDef.min === null) {
        if (!ruleConfig.drivingProductAttribute?.trim()) {
          errors.min = '请输入最小值或驱动产品属性';
        }
      }
      if (ruleDef.max === '' || ruleDef.max === null) {
        if (!ruleConfig.drivingProductAttribute?.trim()) {
          errors.max = '请输入最大值或驱动产品属性';
        }
      }
    } else if (ruleConfig.ruleType === 'comparison') {
      if (!ruleDef.operator) {
        errors.operator = '请选择比较运算符';
      }
      if (ruleDef.value === '' || ruleDef.value === null) {
        errors.compValue = '请输入比较值';
      }
    } else if (ruleConfig.ruleType === 'enum_match') {
      if (!ruleDef.allowedValues || ruleDef.allowedValues.length === 0) {
        errors.allowedValues = '请输入至少一个允许的值';
      }
    } else if (ruleConfig.ruleType === 'custom_expression') {
      if (!ruleConfig.drivingProductAttribute?.trim()) {
        errors.drivingProductAttribute = '请输入驱动产品属性';
      }
      if (!ruleConfig.drivingLogicExpression?.trim()) {
        errors.drivingLogicExpression = '请输入计算表达式';
      }
    }

    return errors;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const newItemErrors: Record<string, Record<string, string>> = {};

    if (!formData.templateName.trim()) {
      newErrors.templateName = '请输入模板名称';
    }
    if (!formData.templateCode.trim()) {
      newErrors.templateCode = '请输入模板编码';
    }
    if (!formData.productRefId) {
      newErrors.productRefId = '请选择产品料号';
    }

    if (bomItems.length === 0) {
      newErrors.bomItems = '请至少添加一个物料项';
    } else {
      let hasValidItems = false;
      for (const item of bomItems) {
        if (item.selectionMode === 'manual') {
          if (item.materialCode.trim() && item.materialName.trim() && item.requiredQuantity > 0 && item.unitPrice > 0) {
            hasValidItems = true;
          }
        } else if (item.selectionMode === 'rule') {
          if (item.ruleConfig) {
            const ruleErrors = validateRuleConfig(item.ruleConfig);
            if (Object.keys(ruleErrors).length === 0) {
              hasValidItems = true;
            } else {
              newItemErrors[item.id] = ruleErrors;
            }
          }
        }
      }
      if (!hasValidItems) {
        newErrors.bomItems = '请至少配置一个有效的物料项';
      }
    }

    setErrors(newErrors);
    setItemErrors(newItemErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newItemErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const manualItems = bomItems.filter(item => item.selectionMode === 'manual' && item.materialCode.trim());
      const totalAmount = manualItems.reduce((sum, item) => {
        const itemTotal = item.requiredQuantity * item.unitPrice;
        const alternativesTotal = (item.alternatives || []).reduce((altSum, alt) =>
          altSum + (alt.requiredQuantity * alt.unitPrice), 0
        );
        return sum + itemTotal + alternativesTotal;
      }, 0);

      const templateData = {
        ...formData,
        bomItems,
        totalAmount
      };

      onSubmit(templateData);
    }
  };

  const getTotalAmount = () => {
    return bomItems.reduce((sum, item) => {
      const itemTotal = item.requiredQuantity * item.unitPrice;
      const alternativesTotal = (item.alternatives || []).reduce((altSum, alt) => 
        altSum + (alt.requiredQuantity * alt.unitPrice), 0
      );
      return sum + itemTotal + alternativesTotal;
    }, 0);
  };

  const filteredBomItems = activeProcessStationCode 
    ? bomItems.filter(item => item.processStationCode === activeProcessStationCode)
    : bomItems;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white flex flex-col rounded-xl shadow-lg w-full max-w-7xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEdit ? '编辑BOM模板' : '新建BOM模板'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-8 border-b border-gray-200">
          {/* Basic Information */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">基本信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模板名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.templateName}
                  onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
                  placeholder="请输入模板名称"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.templateName ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.templateName && (
                  <p className="text-red-500 text-xs mt-1">{errors.templateName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模板编码 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.templateCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, templateCode: e.target.value }))}
                  placeholder="请输入模板编码"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.templateCode ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.templateCode && (
                  <p className="text-red-500 text-xs mt-1">{errors.templateCode}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  产品料号 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.productRefId}
                  onChange={(e) => {
                    const selectedProduct = products.find(p => p.supabase_id === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      productRefId: e.target.value,
                      productType: selectedProduct ? selectedProduct.product_name : ''
                    }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.productRefId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">请选择产品料号</option>
                  {products.map(product => (
                    <option key={product.supabase_id} value={product.supabase_id}>{product.product_name}</option>
                  ))}
                </select>
                {errors.productRefId && (
                  <p className="text-red-500 text-xs mt-1">{errors.productRefId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">版本号</label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="请输入版本号"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">启用</option>
                  <option value="archived">禁用</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      
        <div className="flex flex-1 flex-col md:flex-row p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 左侧：工艺站点列表 */}
          <div className="w-full md:w-1/4 lg:w-1/5 mb-6 md:mb-0 md:pr-6 border-r border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">工艺站点</h3>
            
            {errors.processStation && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-sm text-red-600">{errors.processStation}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {currentProductProcessStations.length > 0 ? (
                currentProductProcessStations.map((station) => (
                  <div
                    key={station.code}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      activeProcessStationCode === station.code
                        ? 'bg-blue-100 border border-blue-300'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveProcessStationCode(station.code)}
                  >
                    <div className="flex items-center">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{station.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">工序号: {station.sequence}</p>
                      </div>
                      {activeProcessStationCode === station.code && (
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {formData.productRefId 
                    ? '该产品料号暂无工艺站点数据' 
                    : '请先选择产品料号'}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：物料清单 */}
          <div className="w-full md:w-3/4 lg:w-4/5 pl-0 md:pl-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    物料清单 - {activeProcessStationCode ? getProcessStationName(activeProcessStationCode) : '所有物料'}
                  </h3>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <div className="flex items-center">
                      <Calculator className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-900">
                        单位产品总成本: ¥{getTotalAmount().toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={addBOMItem}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    添加物料
                  </button>
                </div>
              </div>

              {errors.bomItems && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                    <span className="text-sm text-red-600">{errors.bomItems}</span>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {filteredBomItems.map((item, index) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h4 className="text-md font-medium text-gray-900">主料 #{index + 1}</h4>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {item.processStationCode ? getProcessStationName(item.processStationCode) : '未分配站点'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                            <button
                              onClick={() => updateBOMItem(item.id, 'selectionMode', 'manual')}
                              className="px-3 py-1 rounded text-sm font-medium transition-colors"
                              style={item.selectionMode === 'manual' ? {background: 'white', color: '#2563eb'} : {}}
                            >
                              手动
                            </button>
                            <button
                              onClick={() => updateBOMItem(item.id, 'selectionMode', 'rule')}
                              className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1"
                              style={item.selectionMode === 'rule' ? {background: 'white', color: '#2563eb'} : {}}
                            >
                              <Zap className="w-3.5 h-3.5" />
                              规则
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            {item.selectionMode === 'manual' && (
                              <>
                                <button
                                  onClick={() => addAlternativeMaterial(item.id)}
                                  className="text-green-600 hover:text-green-900 flex items-center gap-1 text-sm font-medium"
                                >
                                  <Plus className="w-4 h-4" />
                                  替代
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => removeBOMItem(item.id)}
                              disabled={bomItems.length <= 0}
                              className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {item.selectionMode === 'manual' && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="grid grid-cols-8 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">物料编码 *</label>
                              <input
                                type="text"
                                value={item.materialCode}
                                onChange={(e) => {
                                  updateBOMItem(item.id, 'materialCode', e.target.value);
                                  handleMaterialCodeChange(item.id, e.target.value, false);
                                }}
                                placeholder="物料编码"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">物料名称 *</label>
                              <input
                                type="text"
                                value={item.materialName}
                                onChange={(e) => updateBOMItem(item.id, 'materialName', e.target.value)}
                                placeholder="物料名称"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">规格</label>
                              <input
                                type="text"
                                value={item.specification}
                                onChange={(e) => updateBOMItem(item.id, 'specification', e.target.value)}
                                placeholder="规格"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">单位</label>
                              <select
                                value={item.unit}
                                onChange={(e) => updateBOMItem(item.id, 'unit', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value=""></option>
                                {units.map(unit => (
                                  <option key={unit} value={unit}>{unit}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">单位产品需求数 *</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.requiredQuantity}
                                onChange={(e) => updateBOMItem(item.id, 'requiredQuantity', parseFloat(e.target.value) || 0)}
                                placeholder="数量"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">单价 *</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => updateBOMItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                placeholder="单价"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">供应商</label>
                              <select
                                value={item.supplier}
                                onChange={(e) => updateBOMItem(item.id, 'supplier', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value=""></option>
                                {suppliers.map(supplier => (
                                  <option key={supplier} value={supplier}>{supplier}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">小计</label>
                              <div className="text-sm font-medium text-gray-900 py-1">
                                ¥{(item.requiredQuantity * item.unitPrice).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {item.selectionMode === 'rule' && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="space-y-4">
                            {/* 横向排列三个核心字段 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  物料类别 <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={item.ruleConfig?.materialCategory || ''}
                                  onChange={(e) => updateBOMItem(item.id, 'ruleConfig', {
                                    ...item.ruleConfig,
                                    materialCategory: e.target.value
                                  })}
                                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    itemErrors[item.id]?.materialCategory ? 'border-red-300' : 'border-gray-300'
                                  }`}
                                >
                                  <option value="">请选择物料类别</option>
                                  {materialCategories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                  ))}
                                </select>
                                {itemErrors[item.id]?.materialCategory && (
                                  <p className="text-red-500 text-xs mt-1">{itemErrors[item.id].materialCategory}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  目标物料属性 <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={item.ruleConfig?.targetMaterialAttribute || ''}
                                  onChange={(e) => updateBOMItem(item.id, 'ruleConfig', {
                                    ...item.ruleConfig,
                                    targetMaterialAttribute: e.target.value
                                  })}
                                  placeholder="例：groovePitch"
                                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    itemErrors[item.id]?.targetMaterialAttribute ? 'border-red-300' : 'border-gray-300'
                                  }`}
                                />
                                {itemErrors[item.id]?.targetMaterialAttribute && (
                                  <p className="text-red-500 text-xs mt-1">{itemErrors[item.id].targetMaterialAttribute}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  规则类型 <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={item.ruleConfig?.ruleType || ''}
                                  onChange={(e) => updateBOMItem(item.id, 'ruleConfig', {
                                    ...item.ruleConfig,
                                    ruleType: e.target.value as any,
                                    ruleDefinition: {}
                                  })}
                                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    itemErrors[item.id]?.ruleType ? 'border-red-300' : 'border-gray-300'
                                  }`}
                                >
                                  <option value="">请选择规则类型</option>
                                  <option value="range">范围匹配</option>
                                  <option value="comparison">比较运算</option>
                                  <option value="enum_match">枚举匹配</option>
                                  <option value="custom_expression">自定义表达式</option>
                                </select>
                                {itemErrors[item.id]?.ruleType && (
                                  <p className="text-red-500 text-xs mt-1">{itemErrors[item.id].ruleType}</p>
                                )}
                              </div>
                            </div>

                            {item.ruleConfig?.ruleType && (
                              <RuleDefinitionForm
                                ruleType={item.ruleConfig.ruleType as 'range' | 'comparison' | 'enum_match' | 'custom_expression'}
                                ruleDefinition={item.ruleConfig.ruleDefinition || {}}
                                drivingProductAttribute={item.ruleConfig.drivingProductAttribute || ''}
                                drivingLogicExpression={item.ruleConfig.drivingLogicExpression || ''}
                                onRuleDefinitionChange={(field, value) => handleRuleDefinitionChange(item.id, field, value)}
                                onProductAttributeChange={(value) => handleProductAttributeChange(item.id, value)}
                                onLogicExpressionChange={(value) => handleLogicExpressionChange(item.id, value)}
                                errors={itemErrors[item.id] || {}}
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {/* 替代料部分 */}
                      {item.selectionMode === 'manual' && item.alternatives && item.alternatives.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {item.alternatives.map((alt, altIndex) => (
                            <div key={alt.id} className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-medium text-yellow-800">替代料 #{altIndex + 1}</h5>
                                <button
                                  onClick={() => removeAlternativeMaterial(item.id, alt.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-8 gap-3">
                                <div>
                                  <input
                                    type="text"
                                    value={alt.materialCode}
                                    onChange={(e) => {
                                      updateAlternativeMaterial(item.id, alt.id, 'materialCode', e.target.value);
                                      handleMaterialCodeChange(alt.id, e.target.value, true, item.id);
                                    }}
                                    placeholder="物料编码"
                                    className="w-full px-2 py-1 text-xs border border-yellow-300 rounded focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    value={alt.materialName}
                                    onChange={(e) => updateAlternativeMaterial(item.id, alt.id, 'materialName', e.target.value)}
                                    placeholder="物料名称"
                                    className="w-full px-2 py-1 text-xs border border-yellow-300 rounded focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    value={alt.specification}
                                    onChange={(e) => updateAlternativeMaterial(item.id, alt.id, 'specification', e.target.value)}
                                    placeholder="规格"
                                    className="w-full px-2 py-1 text-xs border border-yellow-300 rounded focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <select
                                    value={alt.unit}
                                    onChange={(e) => updateAlternativeMaterial(item.id, alt.id, 'unit', e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-yellow-300 rounded focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                                  >
                                    <option value=""></option>
                                    {units.map(unit => (
                                      <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={alt.requiredQuantity}
                                    onChange={(e) => updateAlternativeMaterial(item.id, alt.id, 'requiredQuantity', parseFloat(e.target.value) || 0)}
                                    placeholder="数量"
                                    className="w-full px-2 py-1 text-xs border border-yellow-300 rounded focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={alt.unitPrice}
                                    onChange={(e) => updateAlternativeMaterial(item.id, alt.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    placeholder="单价"
                                    className="w-full px-2 py-1 text-xs border border-yellow-300 rounded focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <select
                                    value={alt.supplier}
                                    onChange={(e) => updateAlternativeMaterial(item.id, alt.id, 'supplier', e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-yellow-300 rounded focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                                  >
                                    <option value=""></option>
                                    {suppliers.map(supplier => (
                                      <option key={supplier} value={supplier}>{supplier}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-yellow-900 py-1">
                                    ¥{(alt.requiredQuantity * alt.unitPrice).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <FileText className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-2">BOM模板说明</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• BOM模板中维护的是生产每个单位产品所需的物料数量</p>
                    <p>• 替代料可以在主料缺货时使用，支持添加多种替代料</p>
                    <p>• 只有主料可以添加替代料</p>
                    <p>• 创建工单时可选择BOM模板并根据目标数量自动计算总需求</p>
                    <p>• 模板状态为"启用"时才能在工单中使用</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isEdit ? '保存修改' : '创建模板'}
          </button>
        </div>
      </div>

      {/* Material Selection Modal */}
      {showMaterialSelectionModal && currentMaterialEditIndex !== null && (
        <MaterialSelectionModal
          isOpen={showMaterialSelectionModal}
          onClose={() => setShowMaterialSelectionModal(false)}
          onSelect={handleMaterialSelected}
          allMaterials={allMaterialMasterData}
          processStationCode={activeProcessStationCode}
          productProcessSpec={mockProductProcessSpec}
          materialCategory={currentMaterialCategory}
          existingMaterialCode={bomItems[currentMaterialEditIndex]?.materialCode}
        />
      )}
    </div>
  );
};