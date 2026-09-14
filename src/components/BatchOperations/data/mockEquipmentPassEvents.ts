import { EquipmentPassEvent } from '../types';

/**
 * 设备出站履历种子数据。
 *
 * 为什么需要种子：`_equipmentPassEvents` 原先只在 confirmOutstation 时追加，初始为空，
 * 于是"SPC异常自动批量扣留"按机台+时间窗口反查批次时永远命中 0 条，功能无法演示。
 * 这里预置一段 EQ002（刻蚀站）的过站履历，覆盖两类批次：
 *   - 仍在制的批次 → 会被 resolveCurrentBatches 命中，可真正执行扣留；
 *   - 已包装完成入成品库的批次 → 会被 resolveFinishedGoodsBatches 命中，仅登记"已入库"。
 *
 * 时间相对模块加载时刻生成，而不是写死绝对时间戳：扣留规则按"异常发生时间往前推 N 小时"
 * 圈定批次，而模拟触发面板的发生时间默认取当前时刻，写死的历史时间会永远落在窗口外。
 */
const HOUR = 60 * 60 * 1000;
const _loadedAt = Date.now();
const hoursAgo = (h: number): string => new Date(_loadedAt - h * HOUR).toISOString();

/** 自动批量扣留演示用的机台——与 mockRules 里 EQ002 规则、finishedGoodsBatches 的过站履历对应 */
export const DEMO_AUTO_HOLD_EQUIPMENT = 'EQ002';

/** 演示机台的过站站点 */
const DEMO_STATION = '刻蚀';

export const mockEquipmentPassEvents: EquipmentPassEvent[] = [
  // ─── 仍在制的批次（命中后可执行扣留）────────────────────────────
  // 只能挑 mockWafers 里有晶圆数据的批次：resolveCurrentBatches 是按 wafer 血缘正向追踪的，
  // 没有晶圆数据的批次（例如 BATCHVJ8K2P）即使有出站履历也追踪不到，命中不了。
  // 同时避开被现有测试按下标取用的前 7 个批次，免得给它们凭空多出一条出站履历。
  {
    batchId: '527e34c6-8b7d-4dc4-a69d-6b9224165315',
    batchCode: 'BATCHD7I17K',
    equipmentCode: DEMO_AUTO_HOLD_EQUIPMENT,
    station: DEMO_STATION,
    occurredAt: hoursAgo(6),
  },
  {
    batchId: 'a4a113ab-94fc-4129-96dc-122288fe8f0b',
    batchCode: 'BATCHKMFH6V',
    equipmentCode: DEMO_AUTO_HOLD_EQUIPMENT,
    station: DEMO_STATION,
    occurredAt: hoursAgo(2.5),
  },
  {
    batchId: 'e3f7bb6a-08d1-4ffe-8887-3a7c8cafde44',
    batchCode: 'BATCH52BSCJ',
    equipmentCode: DEMO_AUTO_HOLD_EQUIPMENT,
    station: DEMO_STATION,
    occurredAt: hoursAgo(2),
  },

  // ─── 已包装完成入成品库的批次（命中后仅登记"已入库"）──────────────
  // 过站时间必须早于各自的 packagedAt，否则"先包装后过站"的时间线自相矛盾
  {
    batchId: 'fg-7a1d4c02-9b6e-4f51-8d33-2c61a0f7b5e1',
    batchCode: 'BATCHFG0731',
    equipmentCode: DEMO_AUTO_HOLD_EQUIPMENT,
    station: DEMO_STATION,
    occurredAt: hoursAgo(7.5),
  },
  {
    batchId: 'fg-3e58b9d7-41af-4c8a-b0d2-95e7c31684fa',
    batchCode: 'BATCHFG0864',
    equipmentCode: DEMO_AUTO_HOLD_EQUIPMENT,
    station: DEMO_STATION,
    occurredAt: hoursAgo(6.5),
  },
  {
    batchId: 'fg-c204f8ab-6d13-4e79-9a55-7b8e0d2f3c46',
    batchCode: 'BATCHFG0912',
    equipmentCode: DEMO_AUTO_HOLD_EQUIPMENT,
    station: DEMO_STATION,
    occurredAt: hoursAgo(5.5),
  },
];
