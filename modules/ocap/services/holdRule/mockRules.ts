import { AutoHoldRule } from './types';
import { ruleStorage } from './ruleStorage';

/** 演示用的示例规则——覆盖"少数情况：monitor料号跑批"这个需要窗口匹配的场景，
 *  正常生产批次不需要配规则（批次扣留节点默认就是扣留当前wafer所属批次）。 */
export const mockAutoHoldRules: AutoHoldRule[] = [
  {
    id: 'rule-mock-metal-ion',
    name: 'EQ001金属离子Monitor批次窗口扣留',
    equipmentId: 'EQ001',
    productCode: 'MON-METAL-001',
    monitorType: 'metal-ion',
    timeWindowMode: 'fixed',
    fixedWindowHours: 8,
    responsibleProcessEngineer: '张伟',
    responsibleQualityEngineer: '李娜',
    enabled: true,
    createdAt: '2026-08-01T09:00:00.000Z',
    createdBy: '系统预置示例',
  },
  {
    id: 'rule-mock-particle',
    name: 'EQ002颗粒度Monitor批次窗口扣留',
    equipmentId: 'EQ002',
    station: '刻蚀',
    monitorType: 'particle',
    timeWindowMode: 'back-to-last-pass',
    responsibleProcessEngineer: '王芳',
    responsibleQualityEngineer: '赵敏',
    enabled: true,
    createdAt: '2026-08-10T09:00:00.000Z',
    createdBy: '系统预置示例',
  },
  {
    id: 'rule-mock-resistivity-disabled',
    name: 'EQ003电阻率Monitor批次窗口扣留（已停用示例）',
    equipmentId: 'EQ003',
    monitorType: 'resistivity',
    timeWindowMode: 'fixed',
    fixedWindowHours: 24,
    responsibleProcessEngineer: '刘洋',
    responsibleQualityEngineer: '陈静',
    enabled: false,
    createdAt: '2026-08-15T09:00:00.000Z',
    createdBy: '系统预置示例',
  },
];

/** 首次进入规则管理页/首次读取规则列表时，如果本地还没有任何规则数据就种入示例规则，
 *  方便直接在批次扣留节点里看到可选的真实规则；已经有真实配置后不会再覆盖。 */
export const seedMockRulesIfEmpty = (): void => {
  if (ruleStorage.getRules().length === 0) {
    ruleStorage.saveRules(mockAutoHoldRules);
  }
};
