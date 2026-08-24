// src/hooks/useApprovalTemplateData.ts
import { useState, useEffect, useCallback } from 'react';
import {
  ProductModelExtended,
  ApprovalTemplateConfig as ApprovalTemplateConfigType,
  StationSpecification,
  Product,
  Station,
  StationSubPath,
  ProductStationSubPathOverride
} from '../types';
import api from '../api'; // 导入新的 API 客户端
import { mockMonitorStations, populateStationsForSubPath } from '../data/mockData'; // 导入 mockMonitorStations

// 创建默认模板的函数
const createDefaultTemplate = (model: ProductModelExtended): ApprovalTemplateConfigType => {
  const approvalItems = model.specifications.flatMap(station =>
    station.parameters.map(param => ({
      id: `${station.stationId}_${param.parameterId}`,
      stationId: station.stationId,
      stationName: station.stationName,
      parameterId: param.parameterId,
      parameterName: param.parameterName,
      unit: param.unit,
      isEnabled: true, // 默认启用
      aggregationMethods: [
        {
          id: `${param.parameterId}_avg_${Math.random().toString(36).substr(2, 9)}`,
          type: 'avg',
          name: '平均值',
          isEnabled: true,
          specification: {
            upperLimit: param.upperLimit,
            lowerLimit: param.lowerLimit,
            target: param.target,
            tolerance: (param.upperLimit - param.lowerLimit) * 0.1
          }
        }
      ]
    }))
  );

  return {
    id: `template_${model.id}`,
    productModelId: model.id,
    version: '1.0',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvalItems
  };
};

export const useApprovalTemplateData = () => {
  const [productModels, setProductModels] = useState<ProductModelExtended[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchProductModels = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const fetchedModels = await api.products.getProductModels();
      setProductModels(fetchedModels);
      setFetched(true);
    } catch (error) {
      console.error('Failed to fetch product models for approval template:', error);
    } finally {
      setLoading(false);
    }
  }, [fetched]);

  const updateTemplate = useCallback(async (modelId: string, template: ApprovalTemplateConfigType) => {
    try {
      await api.products.updateApprovalTemplate(modelId, template);
      setProductModels(prev => prev.map(model =>
        model.id === modelId
          ? { ...model, approvalTemplate: template }
          : model
      ));
    } catch (error) {
      console.error('Failed to update approval template:', error);
    }
  }, []);

  return {
    productModels,
    loading,
    updateTemplate,
    fetchProductModels,
  };
};