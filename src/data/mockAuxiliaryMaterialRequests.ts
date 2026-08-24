// src/data/mockAuxiliaryMaterialRequests.ts
import { AuxiliaryMaterialRequest } from '../types';

// Auxiliary material request generator
export const generateMockAuxiliaryMaterialRequests = (): AuxiliaryMaterialRequest[] => {
  const requests: AuxiliaryMaterialRequest[] = [];
  const requesters = ['张三', '李四', '王五', '赵六'];
  const statuses: AuxiliaryMaterialRequest['status'][] = ['pending', 'approved', 'rejected', 'completed'];
  const equipmentIds = ['ADGMP02-3F', 'ADGMP01-2A', 'ADGMP03-1C', 'ADGMP04-4D'];

  for (let i = 1; i <= 10; i++) {
    const requestDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const items = [
      {
        id: `ITEM-${i}-1`,
        auxiliaryId: `GL${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`,
        auxiliaryCode: `AUX-AAA-${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`,
        auxiliaryName: `研磨液 ${i}`,
        requestedQuantity: Math.floor(Math.random() * 10) + 1,
        unit: '瓶',
        specifications: { capacity: '500ml' }
      }
    ];

    const totalAmount = items.reduce((sum, item) => sum + item.requestedQuantity, 0);

    requests.push({
      id: `AMR-${i.toString().padStart(3, '0')}`,
      requestNumber: `AMR-2024-${(i + 1000).toString()}`,
      requestedBy: requesters[Math.floor(Math.random() * requesters.length)],
      requestDate,
      targetEquipmentId: equipmentIds[Math.floor(Math.random() * equipmentIds.length)],
      status,
      items,
      totalAmount,
      notes: i % 3 === 0 ? '急需使用' : undefined,
      createdAt: requestDate,
      updatedAt: new Date(requestDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
    });
  }
  return requests;
};