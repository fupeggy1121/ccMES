// src/data/mockMaterials.ts
import { Material } from '../types';

// Mock data generator for material boxes (1200 wafers per box)
export const generateMockMaterials = (): Material[] => {
  const materials: Material[] = [];
  const statuses: Material['status'][] = ['pending', 'assigned', 'bound', 'processing'];
  const grades = ['A+', 'A', 'B+', 'B'];

  // Generate substrate materials (for MBE)
  for (let i = 1; i <= 50; i++) {
    materials.push({
      id: `SUB-${i.toString().padStart(3, '0')}`,
      lotNumber: `SUB-LOT-2024-${(i + 100).toString()}`,
      materialType: 'substrate',
      quantity: 1,
      waferCount: 1,
      batchId: `MBE-BATCH-${Math.floor(i / 10) + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      qrCode: `QR-SUB-${i.toString().padStart(6, '0')}`,
      specifications: {
        width: 2 + Math.random() * 0.1,
        height: 2 + Math.random() * 0.1,
        thickness: 0.0005 + Math.random() * 0.0001,
        grade: grades[Math.floor(Math.random() * grades.length)]
      }
    });
  }

  // Generate material boxes (each contains 1200 wafers)
  for (let i = 1; i <= 20; i++) {
    materials.push({
      id: `MAT-BOX-${i.toString().padStart(3, '0')}`,
      lotNumber: `LOT-2024-${(i + 100).toString()}`,
      materialType: 'material-box',
      quantity: 1,
      waferCount: 1200,
      batchId: `BATCH-${Math.floor(i / 5) + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      qrCode: `QR${i.toString().padStart(6, '0')}`,
      boxNumber: `BOX-2024-${i.toString().padStart(3, '0')}`,
      specifications: {
        width: 156 + Math.random() * 10,
        height: 156 + Math.random() * 10,
        thickness: 0.18 + Math.random() * 0.02,
        grade: grades[Math.floor(Math.random() * grades.length)]
      }
    });
  }

  // Generate some small boxes for backward compatibility
  for (let i = 21; i <= 40; i++) {
    materials.push({
      id: `MAT-SMALL-${i.toString().padStart(3, '0')}`,
      lotNumber: `LOT-2024-${(i + 100).toString()}`,
      materialType: 'small-box',
      quantity: 1,
      waferCount: 100,
      batchId: `BATCH-${Math.floor(i / 5) + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      qrCode: `QR${i.toString().padStart(6, '0')}`,
      specifications: {
        width: 156 + Math.random() * 10,
        height: 156 + Math.random() * 10,
        thickness: 0.18 + Math.random() * 0.02,
        grade: grades[Math.floor(Math.random() * grades.length)]
      }
    });
  }
  
  return materials;
};