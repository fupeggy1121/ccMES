// src/data/mockParameters.ts
import { ParameterDetail } from '../types';

// 模拟量测参数
export const mockMeasurementParameters: ParameterDetail[] = [
  { id: 'm1', name: '厚度', unit: 'μm', min: 100, max: 200 },
  { id: 'm2', name: '粗糙度', unit: 'nm', min: 0.5, max: 5.0 },
  { id: 'm3', name: '电阻率', unit: 'Ω·cm', min: 1, max: 100 },
  { id: 'm4', name: '翘曲度', unit: 'μm', min: 0, max: 50 },
  { id: 'm5', name: 'TTV', unit: 'μm', min: 0, max: 10 },
  { id: 'm6', name: '表面缺陷', unit: '个', min: 0, max: 10 },
];

// 模拟工艺参数
export const mockProcessParameters: ParameterDetail[] = [
  { id: 'p1', name: '温度', unit: '°C', min: 20, max: 1000 },
  { id: 'p2', name: '压力', unit: 'Pa', min: 0, max: 10000 },
  { id: 'p3', name: '时间', unit: 'min', min: 1, max: 120 },
  { id: 'p4', name: '气体流量', unit: 'sccm', min: 0, max: 1000 },
  { id: 'p5', name: '功率', unit: 'W', min: 0, max: 5000 },
  { id: 'p6', name: '转速', unit: 'rpm', min: 0, max: 5000 },
];

// 模拟SPC参数
export const mockSpcParameters: ParameterDetail[] = [
  { id: 's1', name: 'CPK', unit: '', min: 1.33, max: 2.0 },
  { id: 's2', name: 'PPK', unit: '', min: 1.33, max: 2.0 },
  { id: 's3', name: 'UCL', unit: '', value: 3.0 },
  { id: 's4', name: 'LCL', unit: '', value: -3.0 },
  { id: 's5', name: 'USL', unit: '', value: 2.5 },
  { id: 's6', name: 'LSL', unit: '', value: -2.5 },
]; 