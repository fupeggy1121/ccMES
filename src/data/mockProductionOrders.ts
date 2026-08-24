// src/data/mockProductionOrders.ts
import { ProductionOrder, BOMItem } from '../types';

// Product type to process stations mapping
const processStationsByProductType = {
  '氮化镓外延片': [
    { id: 'STATION-GAN-001', name: '衬底准备', code: 'GAN-SUBPREP' }, // 统一代码
    { id: 'STATION-GAN-002', name: '外延生长', code: 'GAN-MOCVD' },
    { id: 'STATION-GAN-003', name: '缺陷检测', code: 'GAN-ANNEAL' },
    { id: 'STATION-GAN-004', name: '清洗', code: 'GAN-METAL' },
    { id: 'STATION-GAN-005', name: '电学测试', code: 'GAN-TEST' } // 统一代码
  ],
  '砷化镓外延片': [
    { id: 'STATION-GAAS-001', name: '衬底处理', code: 'GAAS-SUBPREP' }, // 统一代码
    { id: 'STATION-GAAS-002', name: '外延沉积', code: 'GAAS-MBE' },
    { id: 'STATION-GAAS-003', name: '热处理', code: 'GAAS-ETCH' },
    { id: 'STATION-GAAS-004', name: '表面钝化', code: 'GAAS-IONIMP' },
    { id: 'STATION-GAAS-005', name: '光电测试', code: 'GAAS-PASS' } // 统一代码
  ],
  '碳化硅外延片': [
    { id: 'STATION-SIC-001', name: '衬底清洗', code: 'SIC-SUBPREP' }, // 统一代码
    { id: 'STATION-SIC-002', name: '外延生长', code: 'SIC-CVD' },
    { id: 'STATION-SIC-003', name: '高温退火', code: 'SIC-DOPING' }, // 统一代码
    { id: 'STATION-SIC-004', name: '缺陷检测', code: 'SIC-ANNEAL' }, // 统一代码
    { id: 'STATION-SIC-005', name: '测试分选', code: 'SIC-CMP' } // 统一代码
  ]
};

const generateBOMItemsForProductType = (productType: string) => {
  const stations = processStationsByProductType[productType as keyof typeof processStationsByProductType] || [];
  
  return stations.map(station => {
    let requiredQuantity;
    if (station.code.includes('SUBSTRATE') || station.code.includes('CLEANING') || station.code.includes('PROCESSING')) {
      requiredQuantity = 1;
    } else {
      requiredQuantity = Math.floor(Math.random() * 100) + 50;
    }

    return {
      id: `BOM-ITEM-${station.id}`,
      materialCode: `MAT-${station.code}`,
      materialName: `${station.name}物料`,
      specification: '标准',
      unit: '件',
      requiredQuantity: requiredQuantity,
      stockQuantity: Math.floor(Math.random() * 500) + 200,
      supplier: '供应商X',
      unitPrice: parseFloat((Math.random() * 10).toFixed(2)),
      processStationCode: station.code,
      processStationName: station.name,
      notes: `用于${station.name}工序`
    };
  });
};

export const generateMockProductionOrders = (): ProductionOrder[] => {
  const orders: ProductionOrder[] = [];
  const productTypes = [
    '氮化镓外延片',
    '砷化镓外延片',
    '碳化硅外延片'
  ];
  
  const statuses: ProductionOrder['status'][] = ['scheduled', 'partially scheduled', 'completed'];
  const priorities: ProductionOrder['priority'][] = ['high', 'medium', 'low'];
  const operators = ['张三', '李四', '王五', '赵六', '孙七'];
  const orderTypes = ['返工工单', '代工工单'];

  // Generate standard orders
  for (let i = 1; i <= 5; i++) {
    const targetQuantity = Math.floor(Math.random() * 5000) + 1000;
    const currentProgress = Math.floor(Math.random() * targetQuantity);
    const startDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + (Math.random() * 20 + 5) * 24 * 60 * 60 * 1000);
    const productType = productTypes[Math.floor(Math.random() * productTypes.length)];  
    
    const unitBomItems = generateBOMItemsForProductType(productType);
    
    const bomItems = unitBomItems.map(item => ({
      ...item,
      requiredQuantity: item.requiredQuantity * targetQuantity
    }));    

    orders.push({
      id: `ORDER-${i.toString().padStart(3, '0')}`,
      orderNumber: `WO-2024-${(i + 1000).toString()}`,
      planName: `${productType}生产计划${i}`,
      productType,
      targetQuantity,
      currentProgress,
      startDate,
      endDate,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      assignedOperator: operators[Math.floor(Math.random() * operators.length)],
      bomItems,
      notes: i % 3 === 0 ? '需要特殊工艺处理' : undefined,
      createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    });
  }

  // Add new orders with special order types
  for (let i = 6; i <= 12; i++) {
    const targetQuantity = Math.floor(Math.random() * 5000) + 1000;
    const currentProgress = Math.floor(Math.random() * targetQuantity);
    const startDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + (Math.random() * 20 + 5) * 24 * 60 * 60 * 1000);
    const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
    const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
    
    const stations = processStationsByProductType[productType as keyof typeof processStationsByProductType] || [];
    
    let startStation, endStation;
    if (stations.length >= 2) {
      const startIndex = Math.floor(Math.random() * (stations.length - 1));
      const endIndex = Math.floor(Math.random() * (stations.length - startIndex - 1)) + startIndex + 1;
      startStation = stations[startIndex];
      endStation = stations[endIndex];
    } else if (stations.length === 1) {
      startStation = stations[0];
      endStation = stations[0];
    } else {
      startStation = { id: 'STATION-DEFAULT-001', name: '默认工序', code: 'DEFAULT-001' };
      endStation = { id: 'STATION-DEFAULT-002', name: '默认工序', code: 'DEFAULT-002' };
    }

    const unitBomItems = generateBOMItemsForProductType(productType);
    
    const bomItems = unitBomItems.map(item => ({
      ...item,
      requiredQuantity: item.requiredQuantity * targetQuantity
    }));    

    orders.push({
      id: `ORDER-${i.toString().padStart(3, '0')}`,
      orderNumber: `WO-2024-${(i + 1000).toString()}`,
      planName: `${productType}${orderType}${i-15}`,
      productType,
      targetQuantity,
      currentProgress,
      startDate,
      endDate,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      assignedOperator: operators[Math.floor(Math.random() * operators.length)],
      bomItems,
      notes: `${orderType} - ${i % 2 === 0 ? '紧急订单' : '常规处理'}`,
      orderType,
      startProcessStationCode: startStation.code,
      endProcessStationCode: endStation.code,
      createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    });
  }
  return orders;
};