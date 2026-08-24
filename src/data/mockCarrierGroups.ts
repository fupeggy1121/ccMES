// src/data/mockCarrierGroups.ts
import { CarrierGroup } from '../types';

// Mock data generator for carrier groups
export const generateMockCarrierGroups = (): CarrierGroup[] => {
  const groups: CarrierGroup[] = [];
  const groupTypes: CarrierGroup['groupType'][] = ['production', 'maintenance', 'storage'];
  const statuses: CarrierGroup['status'][] = ['active', 'inactive'];
  const creators = ['张三', '李四', '王五', '赵六'];
  const maintenanceUnits = ['天', '周', '月'];

  const groupTemplates = [
    { name: '脱胶清洗点PP白', description: '脱胶清洗站点PP白盒' },
    { name: '外延生长点MD设备', description: 'MD设备外延生长载具组' },
    { name: '测试分选点TE站', description: '测试分选站点载具管理' },
    { name: '质检点QC白盒', description: '质检站点专用白盒载具' },
    { name: '包装点PK载具', description: '包装站点载具组管理' },
  ];

  groupTemplates.forEach((template, index) => {
    const carrierCount = Math.floor(Math.random() * 500) + 100; // 随机载具数量
    const hasMaintenance = Math.random() > 0.5;
    const maintenanceCycle = hasMaintenance ? Math.floor(Math.random() * 30) + 1 : undefined;
    const maintenanceCycleUnit = hasMaintenance ? maintenanceUnits[Math.floor(Math.random() * maintenanceUnits.length)] : undefined;

    groups.push({
      id: `GROUP-${(index + 1).toString().padStart(3, '0')}`,
      groupName: template.name,
      description: template.description,
      carrierCount: carrierCount,
      carrierIds: Array.from({ length: carrierCount }, (_, i) => 
        `CARRIER-${index + 1}-${(i + 1).toString().padStart(3, '0')}`
      ),
      groupType: groupTypes[Math.floor(Math.random() * groupTypes.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdBy: creators[Math.floor(Math.random() * creators.length)],
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      maintenanceCycle,
      maintenanceCycleUnit,
    });
  });

  return groups;
};