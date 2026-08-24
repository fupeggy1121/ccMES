// src/data/mockQTimeData.ts
import { QTimeRule, BatchQTimeInfo } from '../types';

// 模拟Q-Time规则数据 - 更新站点代码以匹配现有系统
export const mockQTimeRules: QTimeRule[] = [
  { id: '1', sourceStation: 'station1', targetStation: 'station2', maxDurationHours: 4, description: '粘棒后固化时间限制', isActive: true },
  { id: '2', sourceStation: 'station1', targetStation: 'packagingStation', maxDurationHours: 6, description: '固化后包装时间限制', isActive: true },
  { id: '3', sourceStation: 'thqfhjy', targetStation: 'packagingStation', maxDurationHours: 1, description: '清洗后包装时间限制', isActive: true },
  { id: '4', sourceStation: 'markingStation', targetStation: 'thqfhjy', maxDurationHours: 2, description: '蚀刻后清洗时间限制', isActive: true },
  { id: '5', sourceStation: 'geometricInspection02', targetStation: 'thqfhjy', maxDurationHours: 0.5, description: '抛光后清洗时间限制', isActive: true },
  { id: '6', sourceStation: 'visualInspection', targetStation: 'packagingStation', maxDurationHours: 3, description: '外观检查后包装时间限制', isActive: true },
  { id: '7', sourceStation: 'particleInspection02', targetStation: 'packagingStation', maxDurationHours: 2, description: '颗粒检查后包装时间限制', isActive: true }
];

// 模拟批次Q-Time数据 - 简化结构，只包含Q-Time相关字段
export const mockBatchQTimeData: BatchQTimeInfo[] = [
  {
    batchCode: 'BATCH-001',
    qTimeRemainingHours: 0.5,
    currentStation: 'station1',
    rules: [
      { id: '1', sourceStation: 'station1', targetStation: 'station2', maxDurationHours: 4, description: '粘棒后固化时间限制', isActive: true },
      { id: '2', sourceStation: 'station1', targetStation: 'packagingStation', maxDurationHours: 6, description: '固化后包装时间限制', isActive: true }
    ],
    minRemainingHours: 0.5
  },
  {
    batchCode: 'BATCH-002',
    qTimeRemainingHours: 2.5,
    currentStation: 'thqfhjy',
    rules: [
      { id: '3', sourceStation: 'thqfhjy', targetStation: 'packagingStation', maxDurationHours: 1, description: '清洗后包装时间限制', isActive: true }
    ],
    minRemainingHours: 2.5
  },
  {
    batchCode: 'BATCH-003',
    qTimeRemainingHours: 3.8,
    currentStation: 'station1',
    rules: [
      { id: '1', sourceStation: 'station1', targetStation: 'station2', maxDurationHours: 4, description: '粘棒后固化时间限制', isActive: true }
    ],
    minRemainingHours: 3.8
  },
  {
    batchCode: 'BATCH-004',
    qTimeRemainingHours: 0.2,
    currentStation: 'thqfhjy',
    rules: [
      { id: '3', sourceStation: 'thqfhjy', targetStation: 'packagingStation', maxDurationHours: 1, description: '清洗后包装时间限制', isActive: true }
    ],
    minRemainingHours: 0.2
  },
  {
    batchCode: 'BATCH-006',
    qTimeRemainingHours: 1.2,
    currentStation: 'geometricInspection02',
    rules: [
      { id: '5', sourceStation: 'geometricInspection02', targetStation: 'thqfhjy', maxDurationHours: 0.5, description: '抛光后清洗时间限制', isActive: true }
    ],
    minRemainingHours: 1.2
  },
  {
    batchCode: 'BATCH-007',
    qTimeRemainingHours: 4.5,
    currentStation: 'station1',
    rules: [
      { id: '1', sourceStation: 'station1', targetStation: 'station2', maxDurationHours: 4, description: '粘棒后固化时间限制', isActive: true },
      { id: '2', sourceStation: 'station1', targetStation: 'packagingStation', maxDurationHours: 6, description: '固化后包装时间限制', isActive: true }
    ],
    minRemainingHours: 4.5
  },
  {
    batchCode: 'BATCH-008',
    qTimeRemainingHours: 0.8,
    currentStation: 'visualInspection',
    rules: [
      { id: '6', sourceStation: 'visualInspection', targetStation: 'packagingStation', maxDurationHours: 3, description: '外观检查后包装时间限制', isActive: true }
    ],
    minRemainingHours: 0.8
  },
  {
    batchCode: 'BATCH-009',
    qTimeRemainingHours: 1.5,
    currentStation: 'particleInspection02',
    rules: [
      { id: '7', sourceStation: 'particleInspection02', targetStation: 'packagingStation', maxDurationHours: 2, description: '颗粒检查后包装时间限制', isActive: true }
    ],
    minRemainingHours: 1.5
  }
];