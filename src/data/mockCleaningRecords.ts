// src/data/mockCleaningRecords.ts
import { CleaningRecord, Carrier } from '../types';

// Mock cleaning records generator - MODIFIED to include multiple carrier IDs
export const generateMockCleaningRecords = (mockCarriers: Carrier[]): CleaningRecord[] => {
  const operators = ['张三', '李四', '王五', '赵六'];
  const equipments = ['清洗机A', '清洗机B', '超声波清洗机', '自动清洗线'];
  
  const records: CleaningRecord[] = [];
  
  // Generate some completed cleaning records with multiple carriers
  for (let i = 1; i <= 8; i++) {
    // Randomly select 1-3 carriers for this cleaning record
    const numCarriers = Math.floor(Math.random() * 3) + 1;
    const selectedCarriers = [...mockCarriers]
      .sort(() => 0.5 - Math.random())
      .slice(0, numCarriers);
    
    const carrierIds = selectedCarriers.map(c => c.id);
    const primaryCarrierId = carrierIds[0];
    
    const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + (Math.random() * 120 + 30) * 60 * 1000); // 30-150 minutes later
    
    records.push({
      id: `CLEAN-${i.toString().padStart(3, '0')}`,
      carrierId: primaryCarrierId, // Keep for backward compatibility
      carrierIds: carrierIds, // New field with multiple carrier IDs
      operator: operators[Math.floor(Math.random() * operators.length)],
      equipment: equipments[Math.floor(Math.random() * equipments.length)],
      startTime: startTime,
      endTime: endTime,
      status: 'completed',
      notes: numCarriers > 1 ? `批量清洗，包含 ${numCarriers} 个载具` : '常规清洗',
      createdAt: startTime,
      updatedAt: endTime,
    });
  }
  
  // Generate some in-progress cleaning records
  for (let i = 9; i <= 12; i++) {
    const numCarriers = Math.floor(Math.random() * 2) + 1; // 1-2 carriers for in-progress
    const selectedCarriers = [...mockCarriers]
      .sort(() => 0.5 - Math.random())
      .slice(0, numCarriers);
    
    const carrierIds = selectedCarriers.map(c => c.id);
    const primaryCarrierId = carrierIds[0];
    
    const startTime = new Date(Date.now() - Math.random() * 60 * 60 * 1000); // Started within last hour
    
    records.push({
      id: `CLEAN-${i.toString().padStart(3, '0')}`,
      carrierId: primaryCarrierId,
      carrierIds: carrierIds,
      operator: operators[Math.floor(Math.random() * operators.length)],
      equipment: equipments[Math.floor(Math.random() * equipments.length)],
      startTime: startTime,
      status: 'in-progress',
      notes: numCarriers > 1 ? `批量清洗进行中，包含 ${numCarriers} 个载具` : '清洗进行中',
      createdAt: startTime,
      updatedAt: startTime,
    });
  }
  
  return records;
};