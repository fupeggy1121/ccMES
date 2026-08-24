// src/data/mockProcessingHistoryRecords.ts
import { ProcessingHistoryRecord, AuxiliaryMaterial } from '../types';

// Processing history record generator
export const generateMockProcessingHistoryRecords = (auxiliaryMaterials: AuxiliaryMaterial[]): ProcessingHistoryRecord[] => {
  const records: ProcessingHistoryRecord[] = [];
  const operators = ['张三', '李四', '王五', '赵六'];

  auxiliaryMaterials.forEach(aux => {
    const numRecords = Math.floor(Math.random() * 6);
    for (let i = 0; i < numRecords; i++) {
      const processingTime = new Date(aux.createdAt.getTime() + Math.random() * (Date.now() - aux.createdAt.getTime()));
      const lotNumber = `LOT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      const consumptionChange = Math.floor(Math.random() * 100) + 1;

      records.push({
        id: `PHR-${records.length + 1}`,
        auxiliaryId: aux.id,
        lotNumber: lotNumber,
        processingTime: processingTime,
        equipmentId: aux.equipmentId || 'N/A',
        operator: operators[Math.floor(Math.random() * operators.length)],
        parameters: {
          temperature: `${Math.floor(Math.random() * 50) + 20}°C`,
          duration: `${Math.floor(Math.random() * 120) + 30}min`,
          pressure: `${(Math.random() * 10 + 1).toFixed(1)}atm`
        },
        consumptionChange: consumptionChange
      });
    }
  });
  return records.sort((a, b) => b.processingTime.getTime() - a.processingTime.getTime());
};