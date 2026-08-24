// src/components/ApprovalTemplateConfig.tsx

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ProductModelExtended, ApprovalTemplateConfig as ApprovalTemplateConfigType, ApprovalItem, AggregationMethod, StationSpecification } from '../types';
import { Settings, Edit, Eye, Plus, Save, X, ToggleLeft as Toggle, AlertTriangle, CheckCircle } from 'lucide-react';

interface ApprovalTemplateConfigProps {
  productModels: ProductModelExtended[];
  onUpdateTemplate: (modelId: string, template: ApprovalTemplateConfigType) => void;
  initialSelectedModelId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// 聚合方法选项配置
const aggregationOptions = [
  { value: 'min', label: '最小值' },
  { value: 'max', label: '最大值' },
  { value: 'avg', label: '平均值' },
  { value: 'std', label: '标准差' },
  { value: 'median', label: '中位数' }
];

export const ApprovalTemplateConfig: React.FC<ApprovalTemplateConfigProps> = ({
  productModels,
  onUpdateTemplate,
  initialSelectedModelId = null,
  isOpen,
  onClose
}) => {
  const [selectedModel, setSelectedModel] = useState<ProductModelExtended | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ApprovalTemplateConfigType | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // 使用 useMemo 对站点进行分组
  const groupedStations = useMemo(() => {
    console.log("[ApprovalTemplateConfig] ==== groupedStations计算开始 ====");
    console.log("[ApprovalTemplateConfig] selectedModel是否存在:", !!selectedModel);
    
    if (!selectedModel) {
      console.log("[ApprovalTemplateConfig] 没有选中的模型，返回默认分组");
      return { main: [], specialSampling: {}, monitor: {} };
    }
    
    console.log("[ApprovalTemplateConfig] 选中的模型规格数量:", selectedModel.specifications?.length || 0);
    
    const groups = {
      main: [] as StationSpecification[],
      specialSampling: {} as { [subPathId: string]: { pathName: string; stations: StationSpecification[] } },
      monitor: {} as { [subPathId: string]: { pathName: string; stations: StationSpecification[] } }
    };
    
    console.log("[ApprovalTemplateConfig] 开始处理模型规格...");
    selectedModel.specifications.forEach((station, index) => {
      console.log(`[ApprovalTemplateConfig] 处理站点 ${index + 1}:`, {
        stationId: station.stationId,
        stationName: station.stationName,
        category: station.category,
        subPathId: station.subPathId,
        subPathName: station.subPathName,
        parametersCount: station.parameters?.length || 0
      });
      
      if (station.category === 'main') {
        console.log(`[ApprovalTemplateConfig] 站点 ${station.stationName} 添加到主路径`);
        groups.main.push(station);
      } else if (station.category === 'specialSampling' && station.subPathId && station.subPathName) {
        console.log(`[ApprovalTemplateConfig] 站点 ${station.stationName} 添加到特殊抽样路径: ${station.subPathName}`);
        if (!groups.specialSampling[station.subPathId]) {
          groups.specialSampling[station.subPathId] = { pathName: station.subPathName, stations: [] };
        }
        groups.specialSampling[station.subPathId].stations.push(station);
      } else if (station.category === 'monitor' && station.subPathId && station.subPathName) {
        console.log(`[ApprovalTemplateConfig] 站点 ${station.stationName} 添加到监控路径: ${station.subPathName}`);
        if (!groups.monitor[station.subPathId]) {
          groups.monitor[station.subPathId] = { pathName: station.subPathName, stations: [] };
        }
        groups.monitor[station.subPathId].stations.push(station);
      } else {
        console.log(`[ApprovalTemplateConfig] 站点 ${station.stationName} 无明确分类或缺少子路径信息，添加到主路径作为后备`);
        groups.main.push(station);
      }
    });
    
    console.log("[ApprovalTemplateConfig] ==== 分组结果 ====");
    console.log("[ApprovalTemplateConfig] 主路径站点数:", groups.main.length);
    console.log("[ApprovalTemplateConfig] 特殊抽样路径数:", Object.keys(groups.specialSampling).length);
    console.log("[ApprovalTemplateConfig] 监控路径数:", Object.keys(groups.monitor).length);
    
    Object.entries(groups.specialSampling).forEach(([id, group]) => {
      console.log(`[ApprovalTemplateConfig] 特殊抽样路径 ${group.pathName} (${id}): ${group.stations.length}个站点`);
    });
    
    Object.entries(groups.monitor).forEach(([id, group]) => {
      console.log(`[ApprovalTemplateConfig] 监控路径 ${group.pathName} (${id}): ${group.stations.length}个站点`);
    });
    
    console.log("[ApprovalTemplateConfig] ==== groupedStations计算结束 ====");
    return groups;
  }, [selectedModel]);

  // 使用 useCallback 包装 createDefaultTemplate
  const createDefaultTemplate = useCallback((model: ProductModelExtended): ApprovalTemplateConfigType => {
    console.log("[ApprovalTemplateConfig] ==== createDefaultTemplate开始 ====");
    console.log("[ApprovalTemplateConfig] 为模型创建默认模板:", model.name);
    console.log("[ApprovalTemplateConfig] 模型规格数量:", model.specifications?.length || 0);
    
    const approvalItems: ApprovalItem[] = [];
    
    model.specifications.forEach((station, stationIndex) => {
      console.log(`[ApprovalTemplateConfig] 处理站点 ${stationIndex + 1}/${model.specifications.length}: ${station.stationName} (ID: ${station.stationId})`);
      console.log(`[ApprovalTemplateConfig] 站点参数数量: ${station.parameters?.length || 0}`);
      
      station.parameters.forEach((parameter, paramIndex) => {
        console.log(`[ApprovalTemplateConfig]  参数 ${paramIndex + 1}/${station.parameters.length}: ${parameter.parameterName}, 类型: ${parameter.type}`);
        
        // 仅为 measurement 类型的参数创建审批项
        if (parameter.type === 'measurement') {
          console.log(`[ApprovalTemplateConfig]   参数 ${parameter.parameterName} 是'measurement'类型，创建审批项`);
          
          // 只创建一个默认聚合方法（平均值）
          const aggregationMethods: AggregationMethod[] = [
            {
              id: `${parameter.parameterId}_avg_${Math.random().toString(36).substr(2, 5)}`,
              type: 'avg',
              name: '平均值',
              isEnabled: true,
              specification: {
                upperLimit: parameter.upperLimit,
                lowerLimit: parameter.lowerLimit,
                target: parameter.target,
                tolerance: (parameter.upperLimit - parameter.lowerLimit) * 0.1
              }
            }
          ];

          const approvalItem = {
            id: `${station.stationId}_${parameter.parameterId}`,
            stationId: station.stationId,
            stationName: station.stationName,
            parameterId: parameter.parameterId,
            parameterName: parameter.parameterName,
            unit: parameter.unit,
            isEnabled: true,
            aggregationMethods
          };
          
          approvalItems.push(approvalItem);
          console.log(`[ApprovalTemplateConfig]   添加审批项: ${parameter.parameterName} (${parameter.unit})`);
          console.log(`[ApprovalTemplateConfig]   审批项详情:`, approvalItem);
        } else {
          console.log(`[ApprovalTemplateConfig]   参数 ${parameter.parameterName} 不是'measurement'类型 (${parameter.type})，跳过`);
        }
      });
    });

    console.log("[ApprovalTemplateConfig] 总共创建的审批项数量:", approvalItems.length);
    
    if (approvalItems.length === 0) {
      console.warn("[ApprovalTemplateConfig] 警告: 没有创建任何审批项！可能原因:");
      console.warn("[ApprovalTemplateConfig] 1. 模型没有规格定义");
      console.warn("[ApprovalTemplateConfig] 2. 规格中没有measurement类型的参数");
      console.warn("[ApprovalTemplateConfig] 3. 参数数据结构不正确");
    } else {
      console.log("[ApprovalTemplateConfig] 创建的审批项列表:");
      approvalItems.forEach((item, index) => {
        console.log(`[ApprovalTemplateConfig]   ${index + 1}. ${item.stationName} - ${item.parameterName}: stationId=${item.stationId}`);
      });
    }
    
    const template = {
      id: `template_${model.id}_${Date.now()}`,
      productModelId: model.id,
      version: '1.0',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvalItems
    };
    
    console.log("[ApprovalTemplateConfig] 创建的模板详情:", template);
    console.log("[ApprovalTemplateConfig] ==== createDefaultTemplate结束 ====");
    
    return template;
  }, []);

  // 使用 useCallback 包装 handleEditTemplate - 已修改逻辑
  const handleEditTemplate = useCallback((modelId: string) => {
    console.log("[ApprovalTemplateConfig] ==== handleEditTemplate开始 ====");
    console.log("[ApprovalTemplateConfig] 处理模型ID:", modelId);
    console.log("[ApprovalTemplateConfig] 产品模型总数:", productModels.length);
    
    const model = productModels.find(m => m.id === modelId);
    if (!model) {
      console.error(`[ApprovalTemplateConfig] 错误: 找不到ID为 ${modelId} 的模型`);
      return;
    }
    
    console.log("[ApprovalTemplateConfig] 找到模型:", model.name);
    console.log("[ApprovalTemplateConfig] 模型是否有approvalTemplate:", !!model.approvalTemplate);
    if (model.approvalTemplate) {
      console.log("[ApprovalTemplateConfig] 现有模板的approvalItems数量:", model.approvalTemplate.approvalItems?.length || 0);
    }
    console.log("[ApprovalTemplateConfig] 模型规格数量:", model.specifications?.length || 0);
    
    setSelectedModel(model);
    
    // 修改逻辑：如果模型已有审批模板，并且其 approvalItems 数组不为空，则使用现有模板
    let templateToUse: ApprovalTemplateConfigType;
    if (model.approvalTemplate && model.approvalTemplate.approvalItems && model.approvalTemplate.approvalItems.length > 0) {
      templateToUse = model.approvalTemplate;
      console.log("[ApprovalTemplateConfig] 使用现有审批模板（包含审批项）。");
    } else {
      // 否则（没有模板，或者模板存在但 approvalItems 为空），创建默认模板
      templateToUse = createDefaultTemplate(model);
      console.log("[ApprovalTemplateConfig] 创建默认审批模板（或填充空审批项）。");
    }
    
    console.log("[ApprovalTemplateConfig] 设置的模板审批项数量:", templateToUse.approvalItems.length);
    console.log("[ApprovalTemplateConfig] handleEditTemplate - Set Editing Template:", templateToUse);
    
    setEditingTemplate(templateToUse);
    
    // 初始化选中的站点：第一个站点的ID（如果存在）
    if (model.specifications && model.specifications.length > 0) {
      const firstStationId = model.specifications[0].stationId;
      console.log(`[ApprovalTemplateConfig] 设置初始选中站点ID: ${firstStationId} (${model.specifications[0].stationName})`);
      setSelectedStationId(firstStationId);
      
      // 检查该站点是否有对应的审批项
      const stationApprovalItems = templateToUse.approvalItems.filter(item => item.stationId === firstStationId);
      console.log(`[ApprovalTemplateConfig] 初始站点 ${firstStationId} 对应的审批项数量: ${stationApprovalItems.length}`);
      
      if (stationApprovalItems.length === 0) {
        console.warn(`[ApprovalTemplateConfig] 警告: 初始站点 ${firstStationId} 没有对应的审批项！`);
      }
    } else {
      console.warn("[ApprovalTemplateConfig] 警告: 模型没有规格定义，无法设置初始站点");
      setSelectedStationId(null);
    }
    
    console.log("[ApprovalTemplateConfig] ==== handleEditTemplate结束 ====");
  }, [productModels, createDefaultTemplate]);

  // 调整 useEffect 逻辑，根据 isOpen 和 initialSelectedModelId 自动加载配置
  useEffect(() => {
    console.log("[ApprovalTemplateConfig] ==== useEffect开始 ====");
    console.log("[ApprovalTemplateConfig] isOpen:", isOpen);
    console.log("[ApprovalTemplateConfig] initialSelectedModelId:", initialSelectedModelId);
    console.log("[ApprovalTemplateConfig] productModels数量:", productModels.length);
    
    if (isOpen && initialSelectedModelId && productModels.length > 0) {
      console.log("[ApprovalTemplateConfig] 自动加载模型配置");
      const model = productModels.find(m => m.id === initialSelectedModelId);
      if (model) {
        console.log("[ApprovalTemplateConfig] 找到模型，调用handleEditTemplate");
        handleEditTemplate(initialSelectedModelId);
      } else {
        console.error(`[ApprovalTemplateConfig] 错误: 找不到ID为 ${initialSelectedModelId} 的模型`);
      }
    } else {
      console.log("[ApprovalTemplateConfig] 重置状态");
      // 关闭模态框时重置状态
      setSelectedModel(null);
      setEditingTemplate(null);
      setSelectedStationId(null);
    }
    
    console.log("[ApprovalTemplateConfig] ==== useEffect结束 ====");
  }, [isOpen, initialSelectedModelId, productModels, handleEditTemplate]);

  const handleSaveTemplate = () => {
    console.log("[ApprovalTemplateConfig] ==== handleSaveTemplate开始 ====");
    console.log("[ApprovalTemplateConfig] editingTemplate是否存在:", !!editingTemplate);
    console.log("[ApprovalTemplateConfig] selectedModel是否存在:", !!selectedModel);
    
    if (editingTemplate && selectedModel) {
      console.log("[ApprovalTemplateConfig] 保存模板，审批项数量:", editingTemplate.approvalItems.length);
      const updatedTemplate = {
        ...editingTemplate,
        updatedAt: new Date().toISOString()
      };
      onUpdateTemplate(selectedModel.id, updatedTemplate);
      onClose();
    } else {
      console.error("[ApprovalTemplateConfig] 错误: 无法保存，缺少editingTemplate或selectedModel");
    }
    
    console.log("[ApprovalTemplateConfig] ==== handleSaveTemplate结束 ====");
  };

  const updateApprovalItem = (itemId: string, updates: Partial<ApprovalItem>) => {
    if (!editingTemplate) return;
    
    setEditingTemplate({
      ...editingTemplate,
      approvalItems: editingTemplate.approvalItems.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    });
  };

  const updateAggregationMethod = (itemId: string, methodId: string, updates: Partial<AggregationMethod>) => {
    if (!editingTemplate) return;
    
    setEditingTemplate({
      ...editingTemplate,
      approvalItems: editingTemplate.approvalItems.map(item =>
        item.id === itemId
          ? {
              ...item,
              aggregationMethods: item.aggregationMethods.map(method =>
                method.id === methodId ? { ...method, ...updates } : method
              )
            }
          : item
      )
    });
  };

  // 添加新的聚合方法
  const addAggregationMethod = (itemId: string) => {
    if (!editingTemplate) return;
    
    setEditingTemplate({
      ...editingTemplate,
      approvalItems: editingTemplate.approvalItems.map(item => {
        if (item.id === itemId) {
          const newMethod: AggregationMethod = {
            id: `method_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: 'avg',
            name: '平均值',
            isEnabled: true,
            specification: {
              upperLimit: 0,
              lowerLimit: 0,
              target: 0,
              tolerance: 0
            }
          };
          return {
            ...item,
            aggregationMethods: [...item.aggregationMethods, newMethod]
          };
        }
        return item;
      })
    });
  };

  // 删除聚合方法
  const removeAggregationMethod = (itemId: string, methodId: string) => {
    if (!editingTemplate) return;
    
    setEditingTemplate({
      ...editingTemplate,
      approvalItems: editingTemplate.approvalItems.map(item => 
        item.id === itemId
          ? {
              ...item,
              aggregationMethods: item.aggregationMethods.filter(m => m.id !== methodId)
            }
          : item
      )
    });
  };

  // 检查产品模型是否有可配置的站点
  const hasConfigurableStations = useMemo(() => {
    return productModels.some(model => 
      model.specifications && model.specifications.length > 0
    );
  }, [productModels]);

  // 如果不显示，直接返回 null
  if (!isOpen) return null;

  console.log("[ApprovalTemplateConfig] ==== 渲染开始 ====");
  console.log("[ApprovalTemplateConfig] 当前选中的模型:", selectedModel?.name || "无");
  console.log("[ApprovalTemplateConfig] 当前选中的站点ID:", selectedStationId);
  console.log("[ApprovalTemplateConfig] editingTemplate是否存在:", !!editingTemplate);
  
  if (editingTemplate) {
    console.log("[ApprovalTemplateConfig] 模板中的审批项总数:", editingTemplate.approvalItems.length);
    
    if (selectedStationId) {
      const stationApprovalItems = editingTemplate.approvalItems.filter(item => item.stationId === selectedStationId);
      console.log(`[ApprovalTemplateConfig] 选中站点 ${selectedStationId} 对应的审批项数量:`, stationApprovalItems.length);
      
      if (stationApprovalItems.length === 0) {
        console.warn(`[ApprovalTemplateConfig] 警告: 选中站点 ${selectedStationId} 没有审批项！`);
        
        // 检查该站点在模型规格中是否存在
        const stationSpec = selectedModel?.specifications.find(s => s.stationId === selectedStationId);
        if (stationSpec) {
          console.log(`[ApprovalTemplateConfig] 站点 ${stationSpec.stationName} 详情:`, {
            parametersCount: stationSpec.parameters?.length || 0,
            parameters: stationSpec.parameters?.map(p => ({ name: p.parameterName, type: p.type }))
          });
        } else {
          console.error(`[ApprovalTemplateConfig] 错误: 找不到ID为 ${selectedStationId} 的站点规格`);
        }
      } else {
        console.log("[ApprovalTemplateConfig] 该站点的审批项详情:", stationApprovalItems);
      }
    }
  }
  
  console.log("[ApprovalTemplateConfig] ==== 渲染结束 ====");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">入库审批项配置</h2>
            <p className="mt-1 text-sm text-gray-500">
              产品型号: {selectedModel?.name || '未选择'} | 型号编号: {selectedModel?.modelNumber || '未选择'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              审批项总数: {editingTemplate?.approvalItems.length || 0} | 
              当前站点审批项: {editingTemplate?.approvalItems.filter(item => item.stationId === selectedStationId).length || 0}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            {/* 创建两列布局 */}
            <div className="flex space-x-6">
              {/* 左列 - 站点列表（按类别分组） */}
              <div className="w-1/3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">站点列表</h3>
                <div className="space-y-2">
                  {/* 主路径站点 */}
                  {groupedStations.main.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-2 px-1 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-orange-600 mr-2"></span>
                        主路径站点 ({groupedStations.main.length})
                      </h4>
                      <div className="space-y-1">
                        {groupedStations.main.map(station => {
                          const stationApprovalItems = editingTemplate?.approvalItems.filter(
                            item => item.stationId === station.stationId
                          ) || [];
                          return (
                            <button
                              key={station.stationId}
                              className={`w-full text-left p-3 rounded-md border ${
                                selectedStationId === station.stationId
                                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                              onClick={() => {
                                console.log(`[ApprovalTemplateConfig] 点击站点: ${station.stationName} (ID: ${station.stationId})`);
                                console.log(`[ApprovalTemplateConfig] 该站点的审批项数量: ${stationApprovalItems.length}`);
                                setSelectedStationId(station.stationId);
                              }}
                            >
                              <div className="font-medium">{station.stationName}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 特殊抽样站点 */}
                  {Object.keys(groupedStations.specialSampling).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-2 px-1 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-purple-600 mr-2"></span>
                        特殊抽样路径 ({Object.keys(groupedStations.specialSampling).length})
                      </h4>
                      <div className="space-y-2 pl-4">
                        {Object.values(groupedStations.specialSampling).map(pathGroup => (
                          <div key={pathGroup.pathName} className="mb-2">
                            <h5 className="text-sm font-medium text-gray-700 mb-1">
                              {pathGroup.pathName} ({pathGroup.stations.length})
                            </h5>
                            <div className="space-y-1 pl-4">
                              {pathGroup.stations.map(station => {
                                const stationApprovalItems = editingTemplate?.approvalItems.filter(
                                  item => item.stationId === station.stationId
                                ) || [];
                                return (
                                  <button
                                    key={station.stationId}
                                    className={`w-full text-left p-3 rounded-md border ${
                                      selectedStationId === station.stationId
                                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                                        : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                    onClick={() => {
                                      console.log(`[ApprovalTemplateConfig] 点击特殊抽样站点: ${station.stationName} (ID: ${station.stationId})`);
                                      console.log(`[ApprovalTemplateConfig] 该站点的审批项数量: ${stationApprovalItems.length}`);
                                      setSelectedStationId(station.stationId);
                                    }}
                                  >
                                    <div className="font-medium">{station.stationName}</div>

                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 监控站点 */}
                  {Object.keys(groupedStations.monitor).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-2 px-1 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-600 mr-2"></span>
                        监控路径站点 ({Object.keys(groupedStations.monitor).length})
                      </h4>
                      <div className="space-y-2 pl-4">
                        {Object.values(groupedStations.monitor).map(pathGroup => (
                          <div key={pathGroup.pathName} className="mb-2">
                            <h5 className="text-sm font-medium text-gray-700 mb-1">
                              {pathGroup.pathName} ({pathGroup.stations.length})
                            </h5>
                            <div className="space-y-1 pl-4">
                              {pathGroup.stations.map(station => {
                                const stationApprovalItems = editingTemplate?.approvalItems.filter(
                                  item => item.stationId === station.stationId
                                ) || [];
                                return (
                                  <button
                                    key={station.stationId}
                                    className={`w-full text-left p-3 rounded-md border ${
                                      selectedStationId === station.stationId
                                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                                        : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                    onClick={() => {
                                      console.log(`[ApprovalTemplateConfig] 点击监控站点: ${station.stationName} (ID: ${station.stationId})`);
                                      console.log(`[ApprovalTemplateConfig] 该站点的审批项数量: ${stationApprovalItems.length}`);
                                      setSelectedStationId(station.stationId);
                                    }}
                                  >
                                    <div className="font-medium">{station.stationName}</div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 如果没有站点 */}
                  {groupedStations.main.length === 0 && 
                   Object.keys(groupedStations.specialSampling).length === 0 && 
                   Object.keys(groupedStations.monitor).length === 0 && (
                    <div className="text-center p-4 text-gray-500">
                      暂无可配置的站点
                    </div>
                  )}
                </div>
              </div>

              {/* 右列 - 参数配置 */}
              <div className="w-2/3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">审批项配置</h3>
                  {selectedStationId && (
                    <div className="text-sm text-gray-600">
                      当前站点: {selectedModel?.specifications.find(s => s.stationId === selectedStationId)?.stationName || '未知站点'}
                    </div>
                  )}
                </div>
                
                {selectedStationId ? (
                  <div className="space-y-4">
                    {(() => {
                      const stationApprovalItems = editingTemplate?.approvalItems.filter(
                        item => item.stationId === selectedStationId
                      ) || [];
                      
                      console.log(`[ApprovalTemplateConfig] 渲染右列 - 站点审批项数量: ${stationApprovalItems.length}`);
                      
                      if (stationApprovalItems.length === 0) {
                        // 找到对应的站点信息
                        const stationSpec = selectedModel?.specifications.find(
                          s => s.stationId === selectedStationId
                        );
                        
                        // 统计参数类型
                        const paramTypeCounts: Record<string, number> = {};
                        stationSpec?.parameters?.forEach(param => {
                          paramTypeCounts[param.type] = (paramTypeCounts[param.type] || 0) + 1;
                        });
                        
                        return (
                          <div className="flex flex-col items-center justify-center h-48 border border-dashed border-gray-300 rounded-lg p-6">
                            <AlertTriangle className="w-12 h-12 text-yellow-500 mb-3" />
                            <p className="text-gray-700 font-medium mb-1">
                              {stationSpec?.stationName || "该站点"}暂无测量类型参数
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                              仅 "measurement" 类型的参数需要配置入库审批
                            </p>
                            <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-md w-full">
                              <p className="font-medium mb-1">站点参数类型分布:</p>
                              <ul className="list-disc list-inside mt-1">
                                {Object.entries(paramTypeCounts).map(([type, count]) => (
                                  <li key={type}>
                                    {type}: {count}个参数
                                  </li>
                                ))}
                              </ul>
                              {stationSpec?.parameters && stationSpec.parameters.length === 0 && (
                                <p className="mt-2 text-red-400">⚠️ 此站点没有任何参数定义</p>
                              )}
                            </div>
                          </div>
                        );
                      }
                      
                      return stationApprovalItems.map((item) => (
                        <div key={item.id} className="border border-gray-100 rounded-lg p-4">
                          <div className="mb-3">
                            <span className="font-medium text-gray-900">
                              {item.parameterName} ({item.unit})
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              站点: {item.stationName}
                            </span>
                          </div>
                          
                          {/* 聚合方法配置 */}
                          <div className="space-y-3">
                            {item.aggregationMethods.map((method) => (
                              <div key={method.id} className="bg-gray-50 rounded-md p-3 space-y-2">
                                <div className="flex items-center space-x-2">
                                  {/* 聚合方法类型下拉框 */}
                                  <div className="flex-1">
                                    <h5 className="block text-xs text-gray-600 mb-1">聚合方式</h5>                              
                                    <select
                                      value={method.type}
                                      onChange={(e) => updateAggregationMethod(
                                        item.id, 
                                        method.id, 
                                        { 
                                          type: e.target.value,
                                          name: aggregationOptions.find(opt => opt.value === e.target.value)?.label || ''
                                        }
                                      )}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                      {aggregationOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* 规格输入框组 */}
                                  <div className="flex-1">
                                    <label className="block text-xs text-gray-600 mb-1">上限值</label>
                                    <input
                                      type="number"
                                      step="0.001"
                                      value={method.specification.upperLimit}
                                      onChange={(e) => updateAggregationMethod(
                                        item.id,
                                        method.id,
                                        {
                                          specification: {
                                            ...method.specification,
                                            upperLimit: parseFloat(e.target.value) || 0
                                          }
                                        }
                                      )}
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="block text-xs text-gray-600 mb-1">下限值</label>
                                    <input
                                      type="number"
                                      step="0.001"
                                      value={method.specification.lowerLimit}
                                      onChange={(e) => updateAggregationMethod(
                                        item.id,
                                        method.id,
                                        {
                                          specification: {
                                            ...method.specification,
                                            lowerLimit: parseFloat(e.target.value) || 0
                                          }
                                        }
                                      )}
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="block text-xs text-gray-600 mb-1">目标值</label>
                                    <input
                                      type="number"
                                      step="0.001"
                                      value={method.specification.target}
                                      onChange={(e) => updateAggregationMethod(
                                        item.id,
                                        method.id,
                                        {
                                          specification: {
                                            ...method.specification,
                                            target: parseFloat(e.target.value) || 0
                                          }
                                        }
                                      )}
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="block text-xs text-gray-600 mb-1">公差</label>
                                    <input
                                      type="number"
                                      step="0.001"
                                      value={method.specification.tolerance}
                                      onChange={(e) => updateAggregationMethod(
                                        item.id,
                                        method.id,
                                        {
                                          specification: {
                                            ...method.specification,
                                            tolerance: parseFloat(e.target.value) || 0
                                          }
                                        }
                                      )}
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>

                                  {/* 删除按钮 */}
                                  <button
                                    onClick={() => removeAggregationMethod(item.id, method.id)}
                                    className="text-red-600 hover:text-red-800 transition-colors p-1"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {/* 添加聚合方法按钮 */}
                            <button
                              onClick={() => addAggregationMethod(item.id)}
                              className="flex items-center text-sm text-blue-600 hover:text-blue-800 mt-2"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              添加
                            </button>
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 border border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">请从左侧选择一个站点</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSaveTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>保存配置</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};