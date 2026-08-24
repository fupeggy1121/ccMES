// src/data/mockPreloadRecords.ts
import { PreloadRecord, Material, Carrier } from '../types';

export const generateMockPreloadRecords = (materials: Material[], carriers: Carrier[]): PreloadRecord[] => {
  const preloadRecords: PreloadRecord[] = [];
  const operators = ['张三', '李四', '王五', '赵六', '孙七'];
  const initialSteps: PreloadRecord['processStep'][] = ['not-degassed'];

  // Get substrates and platens
  const substrates = materials.filter(m => m.materialType === 'substrate');
  const platens = carriers.filter(c => c.type === 'platen');

  for (let i = 0; i < 15; i++) {
    const substrate = substrates[i % substrates.length];
    const platen = platens[i % platens.length];

    if (!substrate || !platen) continue;

    const boundPositions = Array.from({ length: 9 }, (_, idx) => {
      const s = substrates[(i + idx) % substrates.length];
      return {
        id: idx + 1,
        substrateLotNumber: s.lotNumber,
        substrateId: s.id,
      };
    });

    const record: PreloadRecord = {
      id: `MBE-PRELOAD-${(i + 1).toString().padStart(3, '0')}`,
      substrateId: boundPositions[0]?.substrateId || 'N/A',
      platenId: platen.id,
      preloadTime: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000),
      operatorId: `OP-${Math.floor(Math.random() * 1000)}`,
      operatorName: operators[Math.floor(Math.random() * operators.length)],
      status: 'active',
      processStep: initialSteps[Math.floor(Math.random() * initialSteps.length)],
      notes: i % 3 === 0 ? '特殊装片要求' : undefined,
      equipmentId: ['MD', 'ME'][Math.floor(Math.random() * 2)],
      chamberId: ['L1', 'L2'][Math.floor(Math.random() * 2)],
      rackPosition: ['X01', 'X02', 'X03', 'X04'][Math.floor(Math.random() * 4)],
      platenPositions: boundPositions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (record.processStep === 'not-degassed' && Math.random() > 0.5) {
      record.degasTime = new Date(record.preloadTime.getTime() + Math.random() * 60 * 60 * 1000);
      record.degasOperatorId = `OP-${Math.floor(Math.random() * 1000)}`;
      record.degasOperatorName = operators[Math.floor(Math.random() * operators.length)];
      record.processStep = 'degassed';
    }
    preloadRecords.push(record);
  }
  return preloadRecords;
};