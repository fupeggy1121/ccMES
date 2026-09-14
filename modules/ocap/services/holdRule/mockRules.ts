import { AutoHoldRule } from './types';
import { ruleStorage } from './ruleStorage';
import { DEMO_AUTO_HOLD_EQUIPMENT } from '../../../../src/components/BatchOperations/data/mockEquipmentPassEvents';

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
    // 自动批量扣留的完整演示规则：不限料号、不限站点，命中窗口内所有流经该机台的批次，
    // 因此能同时圈到"还在制的批次"和"已包装完成入成品库的批次"两拨（对应出站履历种子数据）
    id: 'rule-mock-eq002-flatness-window',
    name: 'EQ002平坦度Monitor批次窗口扣留',
    equipmentId: DEMO_AUTO_HOLD_EQUIPMENT,
    monitorType: 'flatness',
    timeWindowMode: 'fixed',
    fixedWindowHours: 8,
    responsibleProcessEngineer: '王芳',
    responsibleQualityEngineer: '赵敏',
    enabled: true,
    createdAt: '2026-09-01T09:00:00.000Z',
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

/** 进入规则管理页/读取规则列表时补齐示例规则：按 id 逐条检查，只补本地缺失的那几条，
 *  已存在的规则（含用户改过的示例规则）一律不覆盖。
 *
 *  为什么不是"本地为空才种入"：规则存在 localStorage，早先打开过页面的浏览器里已经有旧的
 *  示例规则，"为空才种"会让后续新增的示例规则永远种不进去，演示场景缺规则可选。
 *  代价是手动删掉某条示例规则后下次进页面会被重新补上——示例数据本就以可用为先。 */
export const seedMockRulesIfMissing = (): void => {
  const existingIds = new Set(ruleStorage.getRules().map(r => r.id));
  const missing = mockAutoHoldRules.filter(r => !existingIds.has(r.id));
  missing.forEach(rule => ruleStorage.addRule(rule));
};
