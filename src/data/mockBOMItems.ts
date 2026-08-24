// src/data/mockBOMItems.ts
import { BOMItem } from '../types';

// Mock BOM data generator
export const generateMockBOMItems = (): BOMItem[] => {
  const bomItems: BOMItem[] = [
    {
      id: 'BOM-001',
      materialCode: 'MAT-WAFER-001',
      materialName: '硅片原料',
      specification: '156×156×0.18mm A级',
      unit: '片',
      requiredQuantity: 1000,
      stockQuantity: 5000,
      supplier: '供应商A',
      unitPrice: 2.5,
      notes: '主要原料',
      processStationCode: 'SUBSTRATE_PREP'
    },
    {
      id: 'BOM-002',
      materialCode: 'MAT-PASTE-001',
      materialName: '银浆',
      specification: 'AG-8010 导电银浆',
      unit: 'g',
      requiredQuantity: 500,
      stockQuantity: 2000,
      supplier: '供应商B',
      unitPrice: 0.8,
      processStationCode: 'EPI_GROWTH'
    },
    {
      id: 'BOM-003',
      materialCode: 'MAT-PASTE-002',
      materialName: '铝浆',
      specification: 'AL-2020 背面铝浆',
      unit: 'g',
      requiredQuantity: 300,
      stockQuantity: 1500,
      supplier: '供应商B',
      unitPrice: 0.3,
      processStationCode: 'DEFECT_INSPECTION'
    },
    {
      id: 'BOM-004',
      materialCode: 'MAT-SCREEN-001',
      materialName: '网版',
      specification: '正面电极网版 325目',
      unit: '张',
      requiredQuantity: 2,
      stockQuantity: 10,
      supplier: '供应商C',
      unitPrice: 450.0,
      processStationCode: 'CLEANING'
    },
    {
      id: 'BOM-005',
      materialCode: 'MAT-SCREEN-002',
      materialName: '网版',
      specification: '背面电极网版 280目',
      unit: '张',
      requiredQuantity: 2,
      stockQuantity: 8,
      supplier: '供应商C',
      unitPrice: 420.0,
      processStationCode: 'TESTING'
    },
    {
      id: 'BOM-006',
      materialCode: 'MAT-SUB-GAAS-001',
      materialName: '砷化镓衬底',
      specification: '4英寸, 半绝缘',
      unit: '片',
      requiredQuantity: 1,
      stockQuantity: 100,
      supplier: '供应商D',
      unitPrice: 200.0,
      processStationCode: 'SUBSTRATE_PROCESSING'
    },
    {
      id: 'BOM-007',
      materialCode: 'MAT-GAS-N2',
      materialName: '高纯氮气',
      specification: '99.999%',
      unit: '瓶',
      requiredQuantity: 1,
      stockQuantity: 50,
      supplier: '供应商E',
      unitPrice: 150.0,
      processStationCode: 'EPI_DEPOSITION'
    },
    {
      id: 'BOM-008',
      materialCode: 'MAT-SIC-WAFER-001',
      materialName: '碳化硅衬底',
      specification: '4H-SiC, 4英寸',
      unit: '片',
      requiredQuantity: 1,
      stockQuantity: 80,
      supplier: '供应商F',
      unitPrice: 500.0,
      processStationCode: 'SUBSTRATE_CLEANING'
    }
  ];
  return bomItems;
};