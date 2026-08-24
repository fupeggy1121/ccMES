// src/data/mockLifetimeControlModels.ts
import { LifetimeControlModel, AuxiliaryMaterial } from '../types';

// Lifetime control model generator
export const generateMockLifetimeControlModels = (auxiliaryMaterials: AuxiliaryMaterial[]): LifetimeControlModel[] => {
  const models: LifetimeControlModel[] = [];
  const calculationMethods = ['按片数', '按时间', '按次数', '按产量'];
  const modelNames = ['砂轮寿命模型', '研磨液寿命模型', '抛光垫寿命模型', '清洗剂寿命模型', '化学药剂寿命模型'];
  const equipmentIds = ['ADGMP02-3F', 'ADGMP01-2A', 'ADGMP03-1C', 'ADGMP04-4D', 'ADGMP05-5E'];

  for (let i = 1; i <= 15; i++) {
    const method = calculationMethods[Math.floor(Math.random() * calculationMethods.length)];
    const modelName = modelNames[Math.floor(Math.random() * modelNames.length)];
    const initialLifetime = Math.floor(Math.random() * 10000) + 1000;
    const warningThreshold = Math.floor(initialLifetime * 0.2);

    const relatedMaterials = auxiliaryMaterials
      .filter(m => m.auxiliaryGroup.toLowerCase().includes(modelName.substring(0, 2).toLowerCase()))
      .slice(0, Math.floor(Math.random() * 3) + 2);

    const materialConfigs = relatedMaterials.map(material => ({
      auxiliaryId: material.auxiliaryId,
      auxiliaryCode: material.auxiliaryCode,
      auxiliaryName: material.auxiliaryName,
      auxiliaryGroup: material.auxiliaryGroup,
      calculationMethod: material.calculationMethod,
      ratedLifetime: material.initialLifetime, // Use initialLifetime as ratedLifetime for mock
      warningThreshold: Math.floor(material.initialLifetime * 0.2)
    }));

    const selectedEquipmentIds = equipmentIds
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 1);

    models.push({
      id: `LCM-${i.toString().padStart(3, '0')}`,
      modelName: `${modelName}-${i}`,
      description: `${modelName}的寿命管控模型，使用${method}计算，适用于${selectedEquipmentIds.join(', ')}设备`,
      equipmentIds: selectedEquipmentIds,
      materialConfigs: materialConfigs,
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    });
  }
  return models;
};