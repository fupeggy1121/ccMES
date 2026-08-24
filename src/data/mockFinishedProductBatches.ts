// src/data/mockFinishedProductBatches.ts
import { FinishedProductBatch } from '../types';

export const generateMockFinishedProductBatches = (count: number = 20): FinishedProductBatch[] => {
  const productTypes = ['4-inch Epitaxial Wafer', '6-inch Epitaxial Wafer', '8-inch Epitaxial Wafer'];
  const productNames = ['标准外延片', '高性能外延片', '低阻外延片', '高阻外延片'];
  const qualityGrades = ['A', 'B', 'C', 'D'] as const;
  const statuses = ['approved', 'pending_outbound', 'outbounded'] as const;
  const inspectors = ['张三', '李四', '王五', '赵六'];
  const warehouseLocations = ['A区-01-01', 'A区-01-02', 'B区-02-01', 'B区-02-02', 'C区-03-01'];
  
  const batches: FinishedProductBatch[] = [];
  
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - 30); // 从30天前开始
  
  for (let i = 0; i < count; i++) {
    const batchIndex = i + 1;
    const batchDate = new Date(startDate);
    batchDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
    
    const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
    const productName = productNames[Math.floor(Math.random() * productNames.length)];
    const qualityGrade = qualityGrades[Math.floor(Math.random() * qualityGrades.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const inspector = inspectors[Math.floor(Math.random() * inspectors.length)];
    const warehouseLocation = warehouseLocations[Math.floor(Math.random() * warehouseLocations.length)];
    
    const packageCount = Math.floor(Math.random() * 10) + 1; // 1-10盒
    const totalWafers = 25; // 固定总片数为25
    
    const batch: FinishedProductBatch = {
      id: `FBP-${batchIndex.toString().padStart(3, '0')}`,
      batchNumber: `BATCH-FIN-2024-${batchIndex.toString().padStart(4, '0')}`,
      productType,
      productName,
      packageCount,
      productCount: packageCount,
      totalWafers,
      qualityGrade,
      status,
      completionTime: batchDate,
      inboundTime: status !== 'pending_outbound' ? 
        new Date(batchDate.getTime() + 24 * 60 * 60 * 1000) : undefined,
      outboundTime: status === 'outbounded' ? 
        new Date(batchDate.getTime() + 48 * 60 * 60 * 1000) : undefined,
      warehouseLocation: status !== 'pending_outbound' ? warehouseLocation : undefined,
      inspectionResult: Math.random() > 0.1 ? 'pass' : (Math.random() > 0.5 ? 'conditional' : 'fail'),
      inspector: Math.random() > 0.2 ? inspector : undefined,
      inspectionDate: Math.random() > 0.2 ? 
        new Date(batchDate.getTime() + 2 * 60 * 60 * 1000) : undefined,
      notes: Math.random() > 0.7 ? `特殊要求：${['防潮', '防静电', '轻拿轻放', '避光'][Math.floor(Math.random() * 4)]}` : undefined,
      createdAt: batchDate,
      updatedAt: new Date(batchDate.getTime() + Math.floor(Math.random() * 24 * 60 * 60 * 1000)),
      productionOrderId: `ORDER-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      operatorId: `OP-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      operatorName: ['张三', '李四', '王五'][Math.floor(Math.random() * 3)],
      packagingTemplate: ['标准包装', '防静电包装', '真空包装'][Math.floor(Math.random() * 3)],
      storageConditions: {
        temperature: Math.random() > 0.5 ? '常温' : '10-25°C',
        humidity: Math.random() > 0.5 ? '<60%' : '40-60%',
        specialRequirements: Math.random() > 0.7 ? '避光保存' : undefined
      }
    };
    
    batches.push(batch);
  }
  
  // 按完成时间排序
  return batches.sort((a, b) => b.completionTime.getTime() - a.completionTime.getTime());
};