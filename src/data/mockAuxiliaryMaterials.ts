// src/data/mockAuxiliaryMaterials.ts
import { AuxiliaryMaterial } from '../types';

// Auxiliary material data generator
export const generateMockAuxiliaryMaterials = (): AuxiliaryMaterial[] => {
  const materials: AuxiliaryMaterial[] = [];
  const auxiliaryGroups = ['AAA', 'Glue', 'Grinding Wheel', 'Polishing Pad', 'Cleaning Solution', 'Chemical', 'Abrasive', 'Lubricant'];
  const auxiliaryNames = ['砂轮', '研磨液', '抛光垫', '清洗剂', '化学药剂', '磨料', '润滑剂', '粘合剂'];
  const calculationMethods = ['3 Wafer number', '8 days number', '1000 hours', '500 cycles', '2000 wafers', '30 days'];
  const equipmentIds = ['ADGMP02-3F', 'ADGMP01-2A', 'ADGMP03-1C', 'ADGMP04-4D', 'ADGMP05-5E', 'ADGMP06-6F'];
  const suppliers = ['供应商A', '供应商B', '供应商C', '供应商D', '供应商E'];

  // 新增：独立的模拟辅料编码列表
  const mockAuxiliaryCodes = [
    'AUX-GRIND-001', 'AUX-POLISH-002', 'AUX-CLEAN-003', 'AUX-CHEM-004',
    'AUX-ABRA-005', 'AUX-LUBE-006', 'AUX-ADH-007', 'AUX-GRIND-008',
    'AUX-POLISH-009', 'AUX-CLEAN-010', 'AUX-CHEM-011', 'AUX-ABRA-012',
    'AUX-LUBE-013', 'AUX-ADH-014', 'AUX-GRIND-015', 'AUX-POLISH-016',
    'AUX-CLEAN-017', 'AUX-CHEM-018', 'AUX-ABRA-019', 'AUX-LUBE-020',
    'AUX-ADH-021', 'AUX-GRIND-022', 'AUX-POLISH-023', 'AUX-CLEAN-024',
    'AUX-CHEM-025', 'AUX-ABRA-026', 'AUX-LUBE-027', 'AUX-ADH-028',
    'AUX-GRIND-029', 'AUX-POLISH-030', 'AUX-CLEAN-031', 'AUX-CHEM-032',
    'AUX-ABRA-033', 'AUX-LUBE-034', 'AUX-ADH-035', 'AUX-GRIND-036',
    'AUX-POLISH-037', 'AUX-CLEAN-038', 'AUX-CHEM-039', 'AUX-ABRA-040'
  ];
  
  for (let i = 1; i <= 40; i++) {
    const group = auxiliaryGroups[Math.floor(Math.random() * auxiliaryGroups.length)];
    const nameIndex = Math.floor(Math.random() * auxiliaryNames.length);
    const name = auxiliaryNames[nameIndex];
    const method = calculationMethods[Math.floor(Math.random() * calculationMethods.length)];
    const equipment = equipmentIds[Math.floor(Math.random() * equipmentIds.length)]; // 用于 equipmentId
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];

    // 修改：从独立的 mockAuxiliaryCodes 列表中获取值
    const auxiliaryCode = mockAuxiliaryCodes[i - 1]; // 确保索引不越界
    const auxiliaryName = `${group} ${name}`;

    const specifications = {
      size: `${Math.floor(Math.random() * 100) + 50}mm`,
      thickness: `${(Math.random() * 5 + 1).toFixed(2)}mm`,
      material: ['陶瓷', '金刚石', '氧化铝', '碳化硅'][Math.floor(Math.random() * 4)],
      hardness: `${Math.floor(Math.random() * 50) + 50} HRC`
    };

    const isInstalled = Math.random() > 0.4;
    const finalEquipmentId = isInstalled ? equipment : (Math.random() > 0.3 ? equipment : null);

    const initialLifetime = Math.floor(Math.random() * 1000) + 100;

    let currentWaferLot: string | null = null;
    let subLot: string | null = null;
    let consumptionBefore: number | null = null;
    let consumptionAfter: number | null = null;

    if (isInstalled && Math.random() > 0.3) {
      currentWaferLot = `LOT-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`;
      subLot = `SUB-${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
      consumptionBefore = initialLifetime - Math.floor(Math.random() * (initialLifetime / 2));
      consumptionAfter = consumptionBefore - Math.floor(Math.random() * 50);
      if (consumptionAfter < 0) consumptionAfter = 0;
    } else if (!isInstalled) {
      currentWaferLot = null;
      subLot = null;
      consumptionBefore = null;
      consumptionAfter = null;
    }

    const shouldGenerateInstanceCode = Math.random() > 0.3;
    const instanceUniqueCode = shouldGenerateInstanceCode
      ? `INST-${auxiliaryCode}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
      : undefined;

    materials.push({
      id: `AUX-${i.toString().padStart(3, '0')}`,
      auxiliaryBatch: `AUX-BATCH-${i.toString().padStart(3, '0')}`,
      auxiliaryGroup: group,
      auxiliaryId: `GL${i.toString().padStart(3, '0')}`,
      auxiliaryCode: auxiliaryCode,
      auxiliaryDescription: `${auxiliaryName}`,
      auxiliaryName: auxiliaryName,
      calculationMethod: method,
      initialLifetime: initialLifetime,
      currentWaferLot: currentWaferLot,
      subLot: subLot,
      consumptionBefore: consumptionBefore,
      consumptionAfter: consumptionAfter,
      equipmentId: finalEquipmentId,
      isInstalled: isInstalled,
      specifications: specifications,
      supplier: supplier,
      instanceUniqueCode,
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      status: 'active', // 默认状态为 active
    });
  }
  return materials;
};