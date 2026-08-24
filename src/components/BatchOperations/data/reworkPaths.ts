// src/data/reworkPaths.ts

import { ReworkPath, ReturnStation } from '../types';

export const mockReworkPaths: ReworkPath[] = [
  {
    id: 'REWORK_CMP',
    name: '化学机械抛光(CMP)返工',
    description: '针对晶圆表面缺陷的CMP返工路径',
    stations: [
      {
        id: 'CMP_PROCESS',
        stationCode: 'CMP_P',
        stationName: 'CMP处理',
        equipmentGroup: '金属化设备组',
        recipe: 'Recipe_Metal_007',
        measurementParameters: [{ name: '厚度', unit: 'um', value: 100 }],
        processParameters: [{ name: '压力', unit: 'psi', value: 5 }],
        spcParameters: [],
        remarks: [],
      },
      {
        id: 'CMP_CLEAN',
        stationCode: 'CMP_C',
        stationName: 'CMP后清洗',
        equipmentGroup: '清洗设备组',
        recipe: 'Recipe_Clean_001',
        measurementParameters: [],
        processParameters: [{ name: '温度', unit: 'C', value: 25 }],
        spcParameters: [],
        remarks: [],
      },
    ],
  },
  {
    id: 'REWORK_ETCH',
    name: '刻蚀返工',
    description: '针对刻蚀不足的返工路径',
    stations: [
      {
        id: 'ETCH_REDO',
        stationCode: 'ETCH_R',
        stationName: '重新刻蚀',
        equipmentGroup: '刻蚀设备组',
        recipe: 'Recipe_Etch_002',
        measurementParameters: [],
        processParameters: [],
        spcParameters: [],
        remarks: [],
      },
      {
        id: 'ETCH_CLEAN',
        stationCode: 'ETCH_C',
        stationName: '刻蚀后清洗',
        equipmentGroup: '清洗设备组',
        recipe: 'Recipe_Clean_002',
        measurementParameters: [],
        processParameters: [],
        spcParameters: [],
        remarks: [],
      },
    ],
  },
];

export const mockReturnStations: ReturnStation[] = [
  { code: 'MAIN_PATH_A', name: '主路径A-站点1' },
  { code: 'MAIN_PATH_B', name: '主路径B-站点2' },
  { code: 'MAIN_PATH_C', name: '主路径C-站点3' },
];

export const mockEquipmentGroups: string[] = ['金属化设备组', '清洗设备组', '刻蚀设备组', '扩散设备组'];
export const mockRecipes: string[] = ['Recipe_Metal_007', 'Recipe_Clean_001', 'Recipe_Etch_002', 'Recipe_Clean_002', 'Recipe_Diff_001'];