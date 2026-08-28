# 批量Hold/Release ③a wafer血缘追溯 + ③b SPC自动触发规则引擎 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把拆批/合批/返工从 UI 占位实现变成真实数据写入并建立 wafer 血缘正向追踪（③a），在此基础上让 OCAP 侧配置"SPC监控异常自动触发批量Hold"的规则、命中后自动圈定风险批次并批量Hold、生成工单（③b）。

**Architecture:** ③a 在 `mockBatchService.ts` 已有的三层内存单例（`_batches`/`_subBatches`/`_wafers`）之上新增只增不改的 `_equipmentPassEvents` 履历和挂在 `WaferData` 上的 `lineageEvents`，把 `confirmSplit`/`confirmMerge`/新增的 `confirmCutIntoSubpath` 从占位改为真实写入，再新增 `src/services/lineage/lineageService.ts` 对外暴露 `resolveCurrentBatches` 查询。③b 新增 `src/services/spcAutoHold/`（规则 CRUD + 执行引擎）和 `modules/ocap/services/workOrderService.ts`（OCAP 侧此前完全没有的可写工单存储），执行引擎复用已实施完成的 `batchHoldService.holdBatches` 落地 Hold。

**Tech Stack:** React 18 + TypeScript + Vite；Tailwind CSS；vitest（`environment: 'node'`，只测纯逻辑，UI 改动走 `npm run dev` 手动验证）。

**Spec:** [docs/superpowers/specs/2026-08-27-batch-hold-phase-3ab-design.md](../specs/2026-08-27-batch-hold-phase-3ab-design.md)

## Global Constraints

- 不引入新的 UI 组件库，`SpcAutoHoldRulesModule` 沿用项目现有的原生 HTML + Tailwind className 风格。
- mock 写操作一律遵循 `mockBatchService.ts` 现有约定：模块内内存变量 + `await delay()` 模拟异步；新写方法需要在 `_realBatchApiService` 中补一个对应的真实 API 占位实现（`request(...)` 调用），保持接口对齐。
- 新增/修改的 TypeScript 类型字段一律加中文行内注释，标注"新增：xxx"，与 `types.ts` 现有注释风格一致。
- `AutoHoldRule` 用 `localStorage` 持久化（key `spc_auto_hold_rules`），风格照抄 [modules/ocap/utils/templateStorage.ts](../../../modules/ocap/utils/templateStorage.ts) 的 get/save/add/update/delete 模式；`HoldRecord`/`WorkOrder`/`AutoHoldExecutionRecord` 仍是纯内存单例，与现状一致。
- vitest 的 `environment: 'node'` 没有全局 `localStorage`（已用 `node -e` 验证会抛 `ReferenceError`），涉及 `ruleStorage.ts` 的测试文件需要在测试内自建一个最小的内存版 `localStorage` polyfill 挂到 `globalThis`，不修改 `vitest.config.ts`（这是本计划唯一次要用到的测试基础设施调整，刻意保持在测试文件本地，不影响其余测试环境）。
- **已知但明确不在本计划范围内的发现**：`onConfirmTransfer`/`onReorganizationStateChange` 这个 prop 名不匹配的 bug，除了本计划要修的 `SplitBatchForm.tsx` 外，`CancelDefectEntryForm.tsx`、`AccumulateBatchForm.tsx`、`DefectEntryForm.tsx` 三个文件也有同样的写法——但那三个操作不在 spec 划定的"拆批/合批/返工"范围内，本计划只修 `SplitBatchForm.tsx` 这一处，不做无关重构。
- 验证按"相对 tsc 基线是否新增错误"判断（当前基线 `npx tsc --noEmit -p tsconfig.app.json` 约 1157 个真实错误，历史遗留，与本次改动无关）；本计划顺手会让 `SplitBatchForm.tsx` 的一处 `TS2322`（prop 名不匹配）和 `modules/ocap/types/workflow.ts` 末尾游离文本的 `TS2304`/`TS6192` 从基线中消失，这属于净减少，不算新增。

---

## Task 1: 扩展 BatchOperations 类型定义（LineageEvent / EquipmentPassEvent / BatchData 新字段）

**Files:**
- Modify: `src/components/BatchOperations/types.ts`

**Interfaces:**
- Consumes: 无
- Produces: `LineageEvent`、`EquipmentPassEvent` 类型；`WaferData.lineageEvents?`；`BatchData.status` 新增 `'已合批'`；`BatchData.mergedIntoBatchId?`、`BatchData.reworkPathId?`、`BatchData.reworkReturnStationCode?`。供 Task 3-10 使用。

- [ ] **Step 1: 在 `WaferData` 接口后新增 `LineageEvent` 和 `EquipmentPassEvent` 类型**

打开 [types.ts](../../../src/components/BatchOperations/types.ts)，在 `LossWaferData` 接口（约第 123 行）之前插入：

```ts
// 新增：wafer 血缘事件——记录一次拆批/合批导致的批次归属变化。
// 不含 'rework'：返工不改变批次归属（fromBatchId 恒等于 toBatchId），
// 对血缘正向追踪没有查询价值，改用 BatchData.reworkPathId 等批次级字段表达。
export interface LineageEvent {
  eventType: 'split' | 'merge';
  fromBatchId: string;
  toBatchId: string;
  occurredAt: string;
  operatedBy: string;
}

// 新增：设备出站履历——只追加不覆盖，用于回答"某机台在某时间窗口内出站过哪些批次"。
// 与 BatchData.lastOutstationAt（单值覆盖，只保留最近一次）是两回事，不能互相替代。
export interface EquipmentPassEvent {
  batchId: string;
  batchCode: string;
  equipmentCode: string;
  station: string;
  occurredAt: string;
}
```

- [ ] **Step 2: 给 `WaferData` 新增 `lineageEvents` 字段**

在 `WaferData` 接口内，`defectDisposal?` 字段（约第 118 行）后面新增：

```ts
  defectDisposal?: '返工' | '残值回收' | '报废'; // 不良处置（不良录入专用）
  /** 新增：血缘事件——仅拆批/合批会追加，返工不产生 */
  lineageEvents?: LineageEvent[];
```

- [ ] **Step 3: 给 `BatchData` 新增合批/返工相关字段，并扩展 `status` 联合类型**

`BatchData.status` 目前是 `string` 类型（见 [types.ts:12](../../../src/components/BatchOperations/types.ts#L12)），本计划不收紧为字面量联合类型（避免引发大范围现有代码的 tsc 报错，不做无关的类型收紧重构）。改为在 `isHold` 字段（约第 29 行）后追加新字段：

```ts
  isHold: boolean;
  /** 新增：本批次已并入的目标批次ID，status='已合批'时必有值，便于UI直接展示"这个批次去哪了" */
  mergedIntoBatchId?: string;
  /** 新增：当前所处返工路径ID，非空=正在返工子路径中 */
  reworkPathId?: string;
  /** 新增：返工完成后应回流的站点编码 */
  reworkReturnStationCode?: string;
```

- [ ] **Step 4: 运行 tsc，确认没有新增错误（本步骤是本任务的验证，替代传统的失败测试——纯类型声明没有可断言的运行时行为）**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | wc -l`
Expected: 数值与改动前基线（1454）相同或更低，不应该因为这次改动新增错误行（新增字段都是可选的，`status` 保持 `string` 未收紧，不会破坏任何现有赋值）。

- [ ] **Step 5: Commit**

```bash
git add src/components/BatchOperations/types.ts
git commit -m "feat(batch-lineage): add LineageEvent/EquipmentPassEvent types and batch fields

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: 修复片篮重组结果的真实数据接线（两处既有 bug）

**Files:**
- Modify: `src/components/BatchOperations/hooks/useWafersData.ts:24`
- Modify: `src/components/BatchOperations/components/SplitBatchForm.tsx:110`

**Interfaces:**
- Consumes: `batchApiService.getWaferCarrierContents(subBatchUUIDs: string[], batchId: string): Promise<WaferData[]>`（已存在，`mockBatchService.ts:109-112` 和 `batchApiService.ts:240-244` 都已实现，只是调用方一直在调一个不存在的方法名）
- Produces: `SplitBatchForm` 拿到的 `wafersForCurrentForm` 从此是真实晶圆数据（此前因为下面的 bug 恒为空数组），供 Task 5 的拆批真实写入使用。

**背景**：`useWafersData.ts:24` 调用 `batchApiService.getWafersForSubBatches(...)`，但这个方法在 mock 和 real 两边都不存在——调用会抛错，被外层 `try/catch` 吞掉并返回 `[]`（`useWafersData.ts:25-28`），导致进出站/拆批等表单里的晶圆列表此前一直是空的。`getWaferCarrierContents` 已经是"按子批次uuid数组查晶圆"的正确实现，只是从未被接上。`SplitBatchForm.tsx:110` 另有一个独立的 prop 名不匹配：传给 `WaferBasketReorganizationModule` 的是 `onConfirmTransfer`，但该组件实际声明的 prop 是 `onReorganizationStateChange`（[WaferBasketReorganizationModule.tsx:9](../../../src/components/BatchOperations/components/WaferBasketReorganizationModule.tsx#L9)），导致片篮重组结果从未真正传给上层——这是 Task 5 做拆批真实写入的前提。

- [ ] **Step 1: 修复 `useWafersData.ts` 的方法调用**

打开 [useWafersData.ts](../../../src/components/BatchOperations/hooks/useWafersData.ts)，把：

```ts
      // 注意：这里假设 batchApiService.getWafersForSubBatches 返回的是一个 WaferData[]
      // 如果它返回的是 { data: WaferData[] } 这样的结构，也需要进行调整
      return await batchApiService.getWafersForSubBatches(subBatchIds, stationCode, firstBatch.id);
```

改为：

```ts
      // 修复：getWafersForSubBatches 从未存在过，正确的方法是 getWaferCarrierContents
      // （按子批次 uuid 数组直接查 _wafers，mock/real 两边都已实现）
      return await batchApiService.getWaferCarrierContents(subBatchIds, firstBatch.id);
```

`stationCode` 参数此后不再被使用，保留在函数签名里不动（调用方 `BatchOperationsContext.tsx:203` 仍按原样传参，不改签名，避免波及其他调用点）。

- [ ] **Step 2: 修复 `SplitBatchForm.tsx` 的 prop 名**

打开 [SplitBatchForm.tsx](../../../src/components/BatchOperations/components/SplitBatchForm.tsx)，把：

```tsx
        <WaferBasketReorganizationModule
          initialSourceCarriers={sourceCarriersForReorganization}
          onConfirmTransfer={handleConfirmWaferTransfer}
```

改为：

```tsx
        <WaferBasketReorganizationModule
          initialSourceCarriers={sourceCarriersForReorganization}
          onReorganizationStateChange={handleConfirmWaferTransfer}
```

- [ ] **Step 3: `npm run dev` 手动验证**

启动开发服务器，进入"批次作业"，选一个 `status !== '待进站'` 的批次点"拆批"。在片篮明细表格里检查"材料号"列：修复前该列因为晶圆是空数组，只会渲染占位的 `Select` 空槽位；修复后应该能看到真实的材料号字符串（如 `HCF-A01-R01203-L00421` 这类格式，来自 [mockWafers.ts](../../../src/components/BatchOperations/data/mockWafers.ts) 种子数据），且良品/不良数量应与该批次子批次的 `goodQty`/`defectQty` 对得上。

- [ ] **Step 4: Commit**

```bash
git add src/components/BatchOperations/hooks/useWafersData.ts src/components/BatchOperations/components/SplitBatchForm.tsx
git commit -m "fix(batch-operations): wire real wafer data into split flow

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: mockBatchService 新增设备出站履历（EquipmentPassEvent）

**Files:**
- Modify: `src/components/BatchOperations/services/mockBatchService.ts`
- Test: `src/components/BatchOperations/services/mockBatchService.equipmentPassEvents.test.ts`

**Interfaces:**
- Consumes: 无
- Produces: `mockBatchService.confirmOutstation` 额外产生 `EquipmentPassEvent` 履历；`mockBatchService.listEquipmentPassEvents(equipmentCode: string, timeWindow: { start: string; end: string }): Promise<EquipmentPassEvent[]>`。供 Task 10 的 `resolveCurrentBatches` 使用。

- [ ] **Step 1: 写失败的测试**

```ts
// src/components/BatchOperations/services/mockBatchService.equipmentPassEvents.test.ts
import { describe, it, expect } from 'vitest';
import { mockBatchService } from './mockBatchService';

describe('mockBatchService equipment pass events', () => {
  it('confirmOutstation appends an EquipmentPassEvent without overwriting earlier ones', async () => {
    const batches = await mockBatchService.listBatches();
    const target = batches[4];

    await mockBatchService.confirmOutstation(target.id, {});
    await new Promise(resolve => setTimeout(resolve, 5));
    await mockBatchService.confirmOutstation(target.id, {});

    const events = await mockBatchService.listEquipmentPassEvents(target.equipmentCode, {
      start: new Date(0).toISOString(),
      end: new Date(Date.now() + 60_000).toISOString(),
    });

    const forThisBatch = events.filter(e => e.batchId === target.id);
    expect(forThisBatch.length).toBe(2);
  });

  it('listEquipmentPassEvents filters by equipmentCode and time window', async () => {
    const batches = await mockBatchService.listBatches();
    const target = batches[5];
    await mockBatchService.confirmOutstation(target.id, {});

    const wrongEquipment = await mockBatchService.listEquipmentPassEvents('NON_EXISTENT_EQ', {
      start: new Date(0).toISOString(),
      end: new Date(Date.now() + 60_000).toISOString(),
    });
    expect(wrongEquipment.filter(e => e.batchId === target.id)).toHaveLength(0);

    const wrongWindow = await mockBatchService.listEquipmentPassEvents(target.equipmentCode, {
      start: new Date(Date.now() + 60_000).toISOString(),
      end: new Date(Date.now() + 120_000).toISOString(),
    });
    expect(wrongWindow.filter(e => e.batchId === target.id)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run src/components/BatchOperations/services/mockBatchService.equipmentPassEvents.test.ts`
Expected: FAIL（`listEquipmentPassEvents` 不存在）

- [ ] **Step 3: 新增内存单例数组和方法**

打开 [mockBatchService.ts](../../../src/components/BatchOperations/services/mockBatchService.ts)，在 `_packagingRecords` 声明（第 34 行）后追加：

```ts
// 新增：设备出站履历——只追加不覆盖，与 BatchData.lastOutstationAt（单值覆盖）不是一回事
let _equipmentPassEvents: EquipmentPassEvent[] = [];
```

顶部 import 里把 `WaferLossRecord, PackagingRecord` 那一行改为追加 `EquipmentPassEvent`：

```ts
import { BatchData, SubBatchData, WaferData, WaferLossRecord, PackagingRecord, EquipmentPassEvent } from '../types';
```

在 `confirmOutstation` 方法（第 236-244 行）内追加履历写入：

```ts
  /** 出站确认 */
  confirmOutstation: async (batchId: string, _payload: any) => {
    await delay();
    const idx = _batches.findIndex(b => b.id === batchId);
    if (idx !== -1) {
      const batch = _batches[idx];
      _batches[idx] = { ...batch, status: '已出站', lastOutstationAt: new Date().toISOString() };
      // 新增：追加设备出站履历，只增不改，供 resolveCurrentBatches 回溯窗口查询使用
      _equipmentPassEvents.push({
        batchId: batch.id,
        batchCode: batch.batchCode,
        equipmentCode: batch.equipmentCode,
        station: batch.station,
        occurredAt: new Date().toISOString(),
      });
    }
    _addHistory(batchId, '出站确认');
    return { success: true };
  },
```

在 `getWafersForSplit` 方法（第 115-120 行）后新增查询方法：

```ts
  /** 新增：查询某机台在时间窗口内的出站履历 */
  listEquipmentPassEvents: async (
    equipmentCode: string,
    timeWindow: { start: string; end: string }
  ): Promise<EquipmentPassEvent[]> => {
    await delay();
    const startMs = new Date(timeWindow.start).getTime();
    const endMs = new Date(timeWindow.end).getTime();
    return _equipmentPassEvents.filter(e => {
      if (e.equipmentCode !== equipmentCode) return false;
      const t = new Date(e.occurredAt).getTime();
      return t >= startMs && t <= endMs;
    });
  },
```

- [ ] **Step 4: 在 `batchApiService.ts` 补真实 API 占位方法**

打开 [batchApiService.ts](../../../src/components/BatchOperations/services/batchApiService.ts)，在 `getWafersForSplit` 方法（第 249-253 行）后新增：

```ts
  /**
   * 新增：查询设备出站履历
   */
  listEquipmentPassEvents: (equipmentCode: string, timeWindow: { start: string; end: string }) =>
    request(`/equipment/${encodeURIComponent(equipmentCode)}/pass-events?start=${encodeURIComponent(timeWindow.start)}&end=${encodeURIComponent(timeWindow.end)}`),
```

- [ ] **Step 5: 运行测试，确认通过**

Run: `npx vitest run src/components/BatchOperations/services/mockBatchService.equipmentPassEvents.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/BatchOperations/services/mockBatchService.ts src/components/BatchOperations/services/batchApiService.ts src/components/BatchOperations/services/mockBatchService.equipmentPassEvents.test.ts
git commit -m "feat(batch-lineage): track equipment pass events on outstation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: mockBatchService 真实拆批实现（confirmSplit）

**Files:**
- Modify: `src/components/BatchOperations/services/mockBatchService.ts`
- Modify: `src/components/BatchOperations/services/batchApiService.ts`
- Test: `src/components/BatchOperations/services/mockBatchService.split.test.ts`

**Interfaces:**
- Consumes: `TargetCarrier`、`WaferData`（`types.ts`，已存在）
- Produces: `mockBatchService.confirmSplit(batchId: string, payload: { targetCarriers: TargetCarrier[]; targetWafers: WaferData[]; operator: string }): Promise<{ success: boolean; newBatchId: string }>`。供 Task 5 的 UI 接线使用。

**关键实现细节（务必读完再动手）**：`WaferBasketReorganizationModule` 在把晶圆从源片篮移到目标片篮时，会把目标槽位的 `id` 覆盖成目标槽位自己预生成的占位 id（见 [WaferBasketReorganizationModule.tsx:519-524](../../../src/components/BatchOperations/components/WaferBasketReorganizationModule.tsx#L519-L524)），只有 `waferId`、`type`、`materialCode` 等字段是从源晶圆原样带过去的。因此 `payload.targetWafers` 里每条记录的 `.id` **不是**真实晶圆在 `_wafers[]` 里的 id，不能拿来做匹配键；必须用 `waferId`（真实晶圆的业务编号，移动前后不变）去 `_wafers[]` 里反查出真实记录，再移动那条真实记录。

- [ ] **Step 1: 写失败的测试**

```ts
// src/components/BatchOperations/services/mockBatchService.split.test.ts
import { describe, it, expect } from 'vitest';
import { mockBatchService } from './mockBatchService';

describe('mockBatchService.confirmSplit', () => {
  it('moves real wafers into a newly created staging batch and records a LineageEvent', async () => {
    const batches = await mockBatchService.listBatches();
    const source = batches.find(b => !b.isHold && b.totalQty > 0)!;
    const sourceWafers = await mockBatchService.getBatchWafers(source.id, source.station);
    const occupied = sourceWafers.filter(w => w.waferId);
    expect(occupied.length).toBeGreaterThan(0);

    const moved = occupied.slice(0, 2);
    const targetCarrierId = 'SA0160';
    // 模拟 WaferBasketReorganizationModule 的输出：waferId/type 原样带过去，id 被替换成目标槽位占位 id
    const targetWafers = moved.map((w, i) => ({ ...w, id: `placeholder-${i}`, carrierId: targetCarrierId }));

    const before = await mockBatchService.listBatches();
    const sourceBefore = before.find(b => b.id === source.id)!;

    const result = await mockBatchService.confirmSplit(source.id, {
      targetCarriers: [{ id: targetCarrierId, goodQty: 0, defectQty: 0 }],
      targetWafers,
      operator: 'tester',
    });

    expect(result.success).toBe(true);
    expect(result.newBatchId).toBeTruthy();

    const after = await mockBatchService.listBatches();
    const newBatch = after.find(b => b.id === result.newBatchId);
    expect(newBatch).toBeTruthy();
    expect(newBatch!.status).toBe('暂存');
    expect(newBatch!.totalQty).toBe(moved.length);

    const sourceAfter = after.find(b => b.id === source.id)!;
    expect(sourceAfter.totalQty).toBe(sourceBefore.totalQty - moved.length);

    const newBatchWafers = await mockBatchService.getBatchWafers(result.newBatchId, '');
    const movedWaferIds = new Set(moved.map(w => w.waferId));
    const relocated = newBatchWafers.filter(w => movedWaferIds.has(w.waferId));
    expect(relocated).toHaveLength(moved.length);
    relocated.forEach(w => {
      expect(w.lineageEvents?.[w.lineageEvents.length - 1]).toMatchObject({
        eventType: 'split',
        fromBatchId: source.id,
        toBatchId: result.newBatchId,
        operatedBy: 'tester',
      });
    });

    const remainingSourceWafers = await mockBatchService.getBatchWafers(source.id, source.station);
    expect(remainingSourceWafers.some(w => movedWaferIds.has(w.waferId))).toBe(false);
  });

  it('rejects a split with no real wafers assigned to any target carrier', async () => {
    const batches = await mockBatchService.listBatches();
    const source = batches.find(b => !b.isHold && b.totalQty > 0)!;

    await expect(
      mockBatchService.confirmSplit(source.id, {
        targetCarriers: [{ id: 'SA0170', goodQty: 0, defectQty: 0 }],
        targetWafers: [{ ...(await mockBatchService.getBatchWafers(source.id, source.station))[0], waferId: '', carrierId: 'SA0170' }],
        operator: 'tester',
      })
    ).rejects.toThrow('未选中任何晶圆');
  });

  it('rejects splitting a batch that is on hold', async () => {
    const batches = await mockBatchService.listBatches();
    const source = batches.find(b => !b.isHold && b.totalQty > 0)!;
    await mockBatchService.holdBatches([source.id], '测试锁定');

    await expect(
      mockBatchService.confirmSplit(source.id, {
        targetCarriers: [{ id: 'SA0180', goodQty: 0, defectQty: 0 }],
        targetWafers: [],
        operator: 'tester',
      })
    ).rejects.toThrow('已锁定');
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run src/components/BatchOperations/services/mockBatchService.split.test.ts`
Expected: FAIL（当前 `confirmSplit` 是占位实现，`newBatchId` 不存在）

- [ ] **Step 3: 实现真实 `confirmSplit`**

打开 [mockBatchService.ts](../../../src/components/BatchOperations/services/mockBatchService.ts)，把占位的：

```ts
  /** 拆批确认 */
  confirmSplit: async (payload: any) => {
    await delay();
    _addHistory(payload.batchId, '拆批');
    return { success: true };
  },
```

替换为：

```ts
  /**
   * 拆批确认：真实把选中的晶圆从源批次移出，按目标片篮分组落到一个新建的暂存批次。
   * 注意：targetWafers 里的 .id 是 WaferBasketReorganizationModule 生成的目标槽位占位 id，
   * 不是真实晶圆的 id，必须用 waferId 反查 _wafers[] 里的真实记录再移动。
   */
  confirmSplit: async (
    batchId: string,
    payload: { targetCarriers: TargetCarrier[]; targetWafers: WaferData[]; operator: string }
  ): Promise<{ success: boolean; newBatchId: string }> => {
    await delay();
    const sourceIdx = _batches.findIndex(b => b.id === batchId);
    if (sourceIdx === -1) throw new Error(`批次 ${batchId} 不存在`);
    const sourceBatch = _batches[sourceIdx];
    if (sourceBatch.isHold) throw new Error('批次已锁定，无法拆批');

    const sourceSubs = _subBatches[batchId] || [];
    const waferByWaferId = new Map<string, { wafer: WaferData; subBatchId: string }>();
    sourceSubs.forEach(sub => {
      (_wafers[sub.id] || []).forEach(w => {
        if (w.waferId) waferByWaferId.set(w.waferId, { wafer: w, subBatchId: sub.id });
      });
    });

    const occurredAt = new Date().toISOString();
    const carrierGroups = payload.targetCarriers
      .map(carrier => {
        const occupiedSlots = payload.targetWafers.filter(w => w.carrierId === carrier.id && w.waferId);
        const realWafers = occupiedSlots
          .map(slot => waferByWaferId.get(slot.waferId))
          .filter((entry): entry is { wafer: WaferData; subBatchId: string } => Boolean(entry));
        return { carrier, realWafers };
      })
      .filter(group => group.realWafers.length > 0);

    if (carrierGroups.length === 0) {
      throw new Error('未选中任何晶圆，无法拆批');
    }

    const movedWaferIds = new Set(carrierGroups.flatMap(g => g.realWafers.map(e => e.wafer.id)));
    const newBatchId = `batch-${Date.now()}`;
    const newBatchCode = `${sourceBatch.batchCode}-SPLIT-${Date.now()}`;

    const isGood = (w: WaferData) => w.type === 'GOOD' || w.type === 'GoodSample';
    const totalQty = carrierGroups.reduce((sum, g) => sum + g.realWafers.length, 0);
    const goodQty = carrierGroups.reduce((sum, g) => sum + g.realWafers.filter(e => isGood(e.wafer)).length, 0);

    const newBatch: BatchData = {
      ...sourceBatch,
      id: newBatchId,
      batchCode: newBatchCode,
      status: '暂存',
      totalQty,
      goodQty,
      defectQty: totalQty - goodQty,
      isHold: false,
      mergedIntoBatchId: undefined,
      reworkPathId: undefined,
      reworkReturnStationCode: undefined,
    };
    _batches.push(newBatch);
    _subBatches[newBatchId] = [];

    carrierGroups.forEach((group, i) => {
      const newSubBatchId = `${newBatchId}-sub-${i}`;
      const groupGoodQty = group.realWafers.filter(e => isGood(e.wafer)).length;
      _subBatches[newBatchId].push({
        id: newSubBatchId,
        sublotId: `${newBatchCode}-SUB-${String(i + 1).padStart(2, '0')}`,
        carrierId: group.carrier.id,
        totalQty: group.realWafers.length,
        goodQty: groupGoodQty,
        defectQty: group.realWafers.length - groupGoodQty,
        status: '暂存',
        station: sourceBatch.station,
        stationName: sourceBatch.stationName,
        equipment: sourceBatch.equipmentCode,
      });
      _wafers[newSubBatchId] = group.realWafers.map(e => ({
        ...e.wafer,
        carrierId: group.carrier.id,
        lineageEvents: [
          ...(e.wafer.lineageEvents || []),
          { eventType: 'split' as const, fromBatchId: batchId, toBatchId: newBatchId, occurredAt, operatedBy: payload.operator },
        ],
      }));
    });

    // 源批次：从各自原子批次里剔除已搬走的 wafer，剩余数量重新汇总（不做手工加减）
    _subBatches[batchId] = sourceSubs.map(sub => {
      const remaining = (_wafers[sub.id] || []).filter(w => !movedWaferIds.has(w.id));
      _wafers[sub.id] = remaining;
      const remainingGood = remaining.filter(isGood).length;
      return { ...sub, totalQty: remaining.length, goodQty: remainingGood, defectQty: remaining.length - remainingGood };
    });
    const sourceRemainingTotal = _subBatches[batchId].reduce((sum, s) => sum + s.totalQty, 0);
    const sourceRemainingGood = _subBatches[batchId].reduce((sum, s) => sum + s.goodQty, 0);
    _batches[sourceIdx] = {
      ...sourceBatch,
      totalQty: sourceRemainingTotal,
      goodQty: sourceRemainingGood,
      defectQty: sourceRemainingTotal - sourceRemainingGood,
    };

    _addHistory(batchId, `拆批：${totalQty}片移出至暂存批次${newBatchCode}`);
    _addHistory(newBatchId, `拆批产生（来源批次${sourceBatch.batchCode}）`);

    return { success: true, newBatchId };
  },
```

同时把顶部 import 的 `WaferData, WaferLossRecord, PackagingRecord, EquipmentPassEvent` 那一行补上 `TargetCarrier`：

```ts
import { BatchData, SubBatchData, WaferData, WaferLossRecord, PackagingRecord, EquipmentPassEvent, TargetCarrier } from '../types';
```

- [ ] **Step 4: 在 `batchApiService.ts` 更新真实 API 占位方法签名**

打开 [batchApiService.ts](../../../src/components/BatchOperations/services/batchApiService.ts)，把：

```ts
  /**
   * 拆批确认
   */
  confirmSplit: (payload: any) =>
    request('/confirm-split', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
```

改为：

```ts
  /**
   * 拆批确认
   */
  confirmSplit: (batchId: string, payload: any) =>
    request('/confirm-split', {
      method: 'POST',
      body: JSON.stringify({ batchId, ...payload }),
    }),
```

- [ ] **Step 5: 运行测试，确认通过**

Run: `npx vitest run src/components/BatchOperations/services/mockBatchService.split.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/BatchOperations/services/mockBatchService.ts src/components/BatchOperations/services/batchApiService.ts src/components/BatchOperations/services/mockBatchService.split.test.ts
git commit -m "feat(batch-lineage): implement real confirmSplit with wafer migration

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: BatchOperations UI 接线拆批

**Files:**
- Modify: `src/components/BatchOperations/components/SplitBatchForm.tsx`
- Modify: `src/components/BatchOperations/contexts/BatchOperationsContext.tsx`
- Modify: `src/components/BatchOperations/hooks/useBatchOperationsHandlers.ts`

**Interfaces:**
- Consumes: `batchApiService.confirmSplit`（Task 4）
- Produces: `onConfirmSplit: (payload: { stagingAreaId?: string; targetCarriers: TargetCarrier[]; targetWafers: WaferData[] }) => Promise<void>`（替换原 `(stagingAreaId?: string) => void` 签名）

**这个任务是纯 UI 接线，不新增 vitest 测试**（沿用项目约定：UI 改动走 `npm run dev` 手动验证）。

- [ ] **Step 1: `SplitBatchForm.tsx` 用本地 state 记录片篮重组的最新结果**

打开 [SplitBatchForm.tsx](../../../src/components/BatchOperations/components/SplitBatchForm.tsx)。把 props 接口里的：

```ts
  handleConfirmWaferTransfer: (finalTargetCarriers: TargetCarrier[], finalSourceWafers: WaferData[]) => void;
  onConfirmSplit: (stagingAreaId?: string) => void;
```

改为：

```ts
  onConfirmSplit: (payload: { stagingAreaId?: string; targetCarriers: TargetCarrier[]; targetWafers: WaferData[] }) => Promise<void>;
```

（`handleConfirmWaferTransfer` 这个 prop 不再需要——重组结果现在只被 `SplitBatchForm` 自己消费，不再经由共享 handlers hook 转发）。同时移除组件签名里的 `handleConfirmWaferTransfer` 解构：

```ts
const SplitBatchForm: React.FC<SplitBatchFormProps> = ({
  selectedBatch,
  displayedFormSubBatches,
  getSubBatchesForMaster,
  getStatusColor,
  handleBackToBatchList,
  onConfirmSplit,
}) => {
```

在现有 `const [wafersForCurrentForm, setWafersForCurrentForm] = useState<WaferData[]>([]);` 后面新增本地 state：

```ts
  const [wafersForCurrentForm, setWafersForCurrentForm] = useState<WaferData[]>([]);
  // 新增：片篮重组的最新结果，确认拆批时随暂存区选择一起提交
  const [latestReorgResult, setLatestReorgResult] = useState<{ targetCarriers: TargetCarrier[]; targetWafers: WaferData[] }>({
    targetCarriers: [],
    targetWafers: [],
  });
```

把 Task 2 已经改好的：

```tsx
          onReorganizationStateChange={handleConfirmWaferTransfer}
```

改为：

```tsx
          onReorganizationStateChange={(targetCarriers, targetWafers) => setLatestReorgResult({ targetCarriers, targetWafers })}
```

- [ ] **Step 2: "确认拆批"按钮改为提交统一 payload**

把：

```tsx
          <button
            onClick={() => onConfirmSplit(selectedStagingAreaId || undefined)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            确认拆批
          </button>
```

改为：

```tsx
          <button
            onClick={() => onConfirmSplit({
              stagingAreaId: selectedStagingAreaId || undefined,
              targetCarriers: latestReorgResult.targetCarriers,
              targetWafers: latestReorgResult.targetWafers,
            })}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            确认拆批
          </button>
```

- [ ] **Step 3: `useBatchOperationsHandlers.ts` 里 `handleConfirmSplit` 改为真实调用**

打开 [useBatchOperationsHandlers.ts](../../../src/components/BatchOperations/hooks/useBatchOperationsHandlers.ts)，把：

```ts
  const handleConfirmSplit = useCallback((stagingAreaId?: string) => {
    if (selectedBatch) {
      if (stagingAreaId) {
        console.log('确认拆批并移入暂存区:', selectedBatch.batchCode, '→', stagingAreaId);
      } else {
        console.log('确认拆批操作:', selectedBatch.batchCode);
      }
      backToBatchList();
    }
  }, [selectedBatch, backToBatchList]);
```

改为：

```ts
  const handleConfirmSplit = useCallback(async (payload: {
    stagingAreaId?: string;
    targetCarriers: TargetCarrier[];
    targetWafers: WaferData[];
  }) => {
    if (!selectedBatch) return;
    try {
      await batchApiService.confirmSplit(selectedBatch.id, {
        targetCarriers: payload.targetCarriers,
        targetWafers: payload.targetWafers,
        operator: '当前操作人',
      });
      await fetchBatches();
      backToBatchList();
    } catch (err: any) {
      console.error('Error confirming split:', err.message);
      throw err;
    }
  }, [selectedBatch, fetchBatches, backToBatchList]);
```

（`stagingAreaId` 目前只是 UI 上"移入哪个暂存区"的展示性选择，新批次统一落 `status: '暂存'`，不需要在写入逻辑里区分具体暂存区——与 spec 保持一致，不额外扩大范围）。

**`handleConfirmWaferTransfer` 本身不要删除**：虽然 `SplitBatchForm` 不再需要它（Step 1 已经改成本地 state 直接消费重组结果），但它还被 `DefectEntryForm`（"不良品录入"，`BatchOperationsModule.tsx` 第 358 行附近，不在本次③a范围内）依赖，删掉会破坏那个功能。`useBatchOperationsHandlers.ts`、`BatchOperationsContext.tsx` 里的 `handleConfirmWaferTransfer` 定义、类型声明、`return`/`value` 对象里的对应行都原样保留，本任务只改 `handleConfirmSplit`。

- [ ] **Step 4: 同步更新 `BatchOperationsContext.tsx` 的 `handleConfirmSplit` 类型声明**

打开 [BatchOperationsContext.tsx](../../../src/components/BatchOperations/contexts/BatchOperationsContext.tsx)。把接口里的：

```ts
  handleConfirmSplit: (stagingAreaId?: string) => void;
```

改为：

```ts
  handleConfirmSplit: (payload: { stagingAreaId?: string; targetCarriers: TargetCarrier[]; targetWafers: WaferData[] }) => Promise<void>;
```

`handleConfirmWaferTransfer` 的接口声明和 `value` 对象里的对应行不动（`DefectEntryForm` 仍需要它，见 Step 3 说明）。

- [ ] **Step 5: 同步更新 `BatchOperationsModule.tsx` 的 `SplitBatchForm` 挂载点**

打开 [BatchOperationsModule.tsx](../../../src/components/BatchOperations/BatchOperationsModule.tsx)。**不要删除**解构列表里的 `handleConfirmWaferTransfer: handleConfirmWaferTransferFromContext,`——`DefectEntryForm` 挂载处（约第 358 行）仍然要用它。只改 `SplitBatchForm` 挂载处（约第 239-247 行）的：

```tsx
        <SplitBatchForm
          selectedBatch={selectedBatch}
          displayedFormSubBatches={displayedFormSubBatches}
          getSubBatchesForMaster={getSubBatchesForMaster}
          getStatusColor={getStatusColor}
          handleBackToBatchList={handleBackToBatchList}
          handleConfirmWaferTransfer={handleConfirmWaferTransferFromContext}
          onConfirmSplit={handleConfirmSplitFromContext}
        />
```

改为：

```tsx
        <SplitBatchForm
          selectedBatch={selectedBatch}
          displayedFormSubBatches={displayedFormSubBatches}
          getSubBatchesForMaster={getSubBatchesForMaster}
          getStatusColor={getStatusColor}
          handleBackToBatchList={handleBackToBatchList}
          onConfirmSplit={handleConfirmSplitFromContext}
        />
```

`handleConfirmWaferTransferFromContext` 在 `BatchOperationsModule.tsx` 里还有第二处引用（`DefectEntryForm` 挂载处，约第 358 行），保持原样不动。

- [ ] **Step 6: `npm run dev` 手动验证**

进入"批次作业"，选一个 `status !== '待进站'` 且未 Hold 的批次，点"拆批"，用片篮更换模块把 1-2 片晶圆移到一个新的目标片篮（如默认的 `SA0160`），选或不选暂存区，点"确认拆批"。验证：
1. 弹窗关闭，返回批次列表；
2. 源批次的"数量"比之前少了移出的片数；
3. 批次列表里出现一条新的批次记录（`batchCode` 形如 `<原批次号>-SPLIT-<时间戳>`，状态"暂存"）；
4. 打开浏览器控制台，确认没有新的运行时报错。

- [ ] **Step 7: Commit**

```bash
git add src/components/BatchOperations/components/SplitBatchForm.tsx src/components/BatchOperations/contexts/BatchOperationsContext.tsx src/components/BatchOperations/hooks/useBatchOperationsHandlers.ts src/components/BatchOperations/BatchOperationsModule.tsx
git commit -m "feat(batch-operations): wire split confirmation to real service call

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: mockBatchService 真实合批实现（confirmMerge）

**Files:**
- Modify: `src/components/BatchOperations/services/mockBatchService.ts`
- Modify: `src/components/BatchOperations/services/batchApiService.ts`
- Test: `src/components/BatchOperations/services/mockBatchService.merge.test.ts`

**Interfaces:**
- Consumes: 无新依赖
- Produces: `mockBatchService.confirmMerge(sourceBatchId: string, payload: { targetBatchId: string; operator: string }): Promise<{ success: boolean }>`。供 Task 7 使用。

- [ ] **Step 1: 写失败的测试**

```ts
// src/components/BatchOperations/services/mockBatchService.merge.test.ts
import { describe, it, expect } from 'vitest';
import { mockBatchService } from './mockBatchService';

describe('mockBatchService.confirmMerge', () => {
  it('moves all sub-batches/wafers to the target batch and marks the source as 已合批', async () => {
    const batches = await mockBatchService.listBatches();
    const source = batches.find(b => !b.isHold && b.status !== '已合批' && b.totalQty > 0)!;
    const target = batches.find(b => b.id !== source.id && !b.isHold && b.status !== '已合批')!;

    const sourceWafersBefore = await mockBatchService.getBatchWafers(source.id, source.station);
    const targetBefore = (await mockBatchService.listBatches()).find(b => b.id === target.id)!;

    const result = await mockBatchService.confirmMerge(source.id, { targetBatchId: target.id, operator: 'tester' });
    expect(result.success).toBe(true);

    const after = await mockBatchService.listBatches();
    const sourceAfter = after.find(b => b.id === source.id)!;
    const targetAfter = after.find(b => b.id === target.id)!;

    expect(sourceAfter.status).toBe('已合批');
    expect(sourceAfter.mergedIntoBatchId).toBe(target.id);
    expect(sourceAfter.totalQty).toBe(0);
    expect(targetAfter.totalQty).toBe(targetBefore.totalQty + sourceWafersBefore.filter(w => w.waferId).length);

    const targetWafersAfter = await mockBatchService.getBatchWafers(target.id, '');
    const movedWaferIds = new Set(sourceWafersBefore.filter(w => w.waferId).map(w => w.waferId));
    const relocated = targetWafersAfter.filter(w => movedWaferIds.has(w.waferId));
    expect(relocated.length).toBe(movedWaferIds.size);
    relocated.forEach(w => {
      expect(w.lineageEvents?.[w.lineageEvents.length - 1]).toMatchObject({
        eventType: 'merge',
        fromBatchId: source.id,
        toBatchId: target.id,
        operatedBy: 'tester',
      });
    });
  });

  it('rejects merging a batch into itself', async () => {
    const batches = await mockBatchService.listBatches();
    const batch = batches.find(b => !b.isHold && b.status !== '已合批')!;
    await expect(
      mockBatchService.confirmMerge(batch.id, { targetBatchId: batch.id, operator: 'tester' })
    ).rejects.toThrow('自身');
  });

  it('rejects merging when the source is on hold', async () => {
    const batches = await mockBatchService.listBatches();
    const source = batches.find(b => !b.isHold && b.status !== '已合批')!;
    const target = batches.find(b => b.id !== source.id && !b.isHold && b.status !== '已合批')!;
    await mockBatchService.holdBatches([source.id], '测试锁定');

    await expect(
      mockBatchService.confirmMerge(source.id, { targetBatchId: target.id, operator: 'tester' })
    ).rejects.toThrow('已锁定');
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run src/components/BatchOperations/services/mockBatchService.merge.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现真实 `confirmMerge`**

把 [mockBatchService.ts](../../../src/components/BatchOperations/services/mockBatchService.ts) 里占位的：

```ts
  /** 并批确认 */
  confirmMerge: async (payload: any) => {
    await delay();
    _addHistory(payload.batchId, '并批');
    return { success: true };
  },
```

替换为：

```ts
  /** 并批确认：把源批次的全部子批次与晶圆整体挪到目标批次名下，源批次保留记录标记为已合批 */
  confirmMerge: async (
    sourceBatchId: string,
    payload: { targetBatchId: string; operator: string }
  ): Promise<{ success: boolean }> => {
    await delay();
    const sourceIdx = _batches.findIndex(b => b.id === sourceBatchId);
    const targetIdx = _batches.findIndex(b => b.id === payload.targetBatchId);
    if (sourceIdx === -1) throw new Error(`源批次 ${sourceBatchId} 不存在`);
    if (targetIdx === -1) throw new Error(`目标批次 ${payload.targetBatchId} 不存在`);
    const sourceBatch = _batches[sourceIdx];
    const targetBatch = _batches[targetIdx];
    if (sourceBatch.id === targetBatch.id) throw new Error('不能合并到批次自身');
    if (sourceBatch.isHold) throw new Error('源批次已锁定，无法并批');
    if (targetBatch.isHold) throw new Error('目标批次已锁定，无法接收并批');
    if (sourceBatch.status === '已合批') throw new Error('源批次已经合批，无法重复操作');
    if (targetBatch.status === '已合批') throw new Error('目标批次已合批，不能作为并批目标');

    const occurredAt = new Date().toISOString();
    const sourceSubs = _subBatches[sourceBatchId] || [];

    // 子批次 sublotId 保留原名不改写，归属只看 _subBatches 的 key，与现有模型一致
    _subBatches[payload.targetBatchId] = [...(_subBatches[payload.targetBatchId] || []), ...sourceSubs];
    sourceSubs.forEach(sub => {
      _wafers[sub.id] = (_wafers[sub.id] || []).map(w => ({
        ...w,
        lineageEvents: [
          ...(w.lineageEvents || []),
          { eventType: 'merge' as const, fromBatchId: sourceBatchId, toBatchId: payload.targetBatchId, occurredAt, operatedBy: payload.operator },
        ],
      }));
    });
    _subBatches[sourceBatchId] = [];

    const targetSubsAfter = _subBatches[payload.targetBatchId];
    const targetTotal = targetSubsAfter.reduce((sum, s) => sum + s.totalQty, 0);
    const targetGood = targetSubsAfter.reduce((sum, s) => sum + s.goodQty, 0);
    _batches[targetIdx] = { ...targetBatch, totalQty: targetTotal, goodQty: targetGood, defectQty: targetTotal - targetGood };
    _batches[sourceIdx] = {
      ...sourceBatch,
      status: '已合批',
      mergedIntoBatchId: payload.targetBatchId,
      totalQty: 0,
      goodQty: 0,
      defectQty: 0,
    };

    _addHistory(sourceBatchId, `并批：已合并至批次 ${targetBatch.batchCode}`);
    _addHistory(payload.targetBatchId, `并批：接收批次 ${sourceBatch.batchCode} 的全部子批次`);

    return { success: true };
  },
```

- [ ] **Step 4: 在 `batchApiService.ts` 更新真实 API 占位方法签名**

把：

```ts
  /**
   * 并批确认
   */
  confirmMerge: (payload: any) =>
    request('/confirm-merge', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
```

改为：

```ts
  /**
   * 并批确认
   */
  confirmMerge: (sourceBatchId: string, payload: any) =>
    request('/confirm-merge', {
      method: 'POST',
      body: JSON.stringify({ sourceBatchId, ...payload }),
    }),
```

- [ ] **Step 5: 运行测试，确认通过**

Run: `npx vitest run src/components/BatchOperations/services/mockBatchService.merge.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/BatchOperations/services/mockBatchService.ts src/components/BatchOperations/services/batchApiService.ts src/components/BatchOperations/services/mockBatchService.merge.test.ts
git commit -m "feat(batch-lineage): implement real confirmMerge

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: BatchOperations UI 接线合批

**Files:**
- Modify: `src/components/BatchOperations/hooks/useBatchOperationsHandlers.ts`
- Modify: `src/components/BatchOperations/contexts/BatchOperationsContext.tsx`

**Interfaces:**
- Consumes: `batchApiService.confirmMerge`（Task 6）、`targetBatchCode`（已存在于 context，由 `BatchSelectionModal` 选定）
- Produces: `handleConfirmMergeBatch: () => Promise<void>`（保持原有无参签名，目标批次通过 context 里已有的 `targetBatchCode`/`batchList` 解析）

- [ ] **Step 1: `handleConfirmMergeBatch` 改为真实调用**

`handleConfirmMergeBatch` 目前的签名是无参的（[useBatchOperationsHandlers.ts:305](../../../src/components/BatchOperations/hooks/useBatchOperationsHandlers.ts#L305)），但解析 `targetBatchCode` 需要访问 `batchList` 和 `targetBatchCode`——这两个值目前都不是 `useBatchOperationsHandlers` 的参数。给 hook 增加这两个参数：

打开 [useBatchOperationsHandlers.ts](../../../src/components/BatchOperations/hooks/useBatchOperationsHandlers.ts)，在函数参数列表最后（`backToBatchList` 后）新增两个参数：

```ts
export const useBatchOperationsHandlers = (
  batchList: BatchData[],
  selectedBatch: BatchData | null,
  displayedFormSubBatches: SubBatchData[],
  wafersForCurrentForm: WaferData[],
  setSelectedBatch: (batch: BatchData | null) => void,
  setDisplayedFormSubBatches: (subBatches: SubBatchData[]) => void,
  setCurrentFormType: (type: string) => void,
  setIsAccumulateFromStaging: (v: boolean) => void,
  setWafersForCurrentForm: (wafers: WaferData[]) => void,
  fetchBatches: () => Promise<void>,
  getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>,
  fetchWafersForSubBatches: (
    subBatches: SubBatchData[],
    stationCode: string,
    batchList: BatchData[]
  ) => Promise<WaferData[]>,
  loadBatchRemarks: (batchId: string) => Promise<void>,
  backToBatchList: () => void,
  targetBatchCode: string
) => {
```

（`batchList` 已经是第一个参数，不需要重复新增。）

把：

```ts
  const handleConfirmMergeBatch = useCallback(() => {
    if (selectedBatch) {
      console.log('确认并批:', selectedBatch.batchCode);
      backToBatchList();
    }
  }, [selectedBatch, backToBatchList]);
```

改为：

```ts
  const handleConfirmMergeBatch = useCallback(async () => {
    if (!selectedBatch) return;
    const targetBatch = batchList.find(b => b.batchCode === targetBatchCode);
    if (!targetBatch) {
      console.error('未找到目标批次:', targetBatchCode);
      throw new Error('请先选择并批目标批次');
    }
    try {
      await batchApiService.confirmMerge(selectedBatch.id, { targetBatchId: targetBatch.id, operator: '当前操作人' });
      await fetchBatches();
      backToBatchList();
    } catch (err: any) {
      console.error('Error confirming merge:', err.message);
      throw err;
    }
  }, [selectedBatch, batchList, targetBatchCode, fetchBatches, backToBatchList]);
```

- [ ] **Step 2: `BatchOperationsContext.tsx` 传入 `targetBatchCode`**

打开 [BatchOperationsContext.tsx](../../../src/components/BatchOperations/contexts/BatchOperationsContext.tsx)，在调用 `useBatchOperationsHandlers(...)`（约第 191-206 行）的参数列表末尾追加 `targetBatchCode`：

```ts
  const handlers = useBatchOperationsHandlers(
    batchList,
    selectedBatch,
    displayedFormSubBatches,
    wafersForCurrentForm,
    setSelectedBatch,
    setDisplayedFormSubBatches,
    setCurrentFormType,
    setIsAccumulateFromStaging,
    setWafersForCurrentForm,
    fetchBatches,
    getSubBatchesForMaster,
    (subBatches, stationCode) => fetchWafersForSubBatches(subBatches, stationCode, batchList),
    loadBatchRemarks,
    handleBackToBatchList,
    targetBatchCode
  );
```

把接口里的：

```ts
  handleConfirmMergeBatch: () => void;
```

改为：

```ts
  handleConfirmMergeBatch: () => Promise<void>;
```

- [ ] **Step 3: `npm run dev` 手动验证**

进入"批次作业"，选一个未 Hold、`status !== '已合批'` 的批次点"并批"，用"选择批次"弹窗挑一个同产品同站点的其他批次作为目标，点"确认并批"。验证：
1. 弹窗关闭，返回批次列表；
2. 源批次的"数量"变为 0，状态显示为"已合批"（若列表 UI 尚未特别渲染这个新状态文案，至少 `status` 字段应为 `已合批`，可通过浏览器 DevTools 检查网络面板或临时打印验证）；
3. 目标批次的数量增加了源批次原有的数量；
4. 尝试重复对同一个已合批的源批次再次操作，应看到错误提示（`console.error`/抛出的异常），不应该静默成功。

- [ ] **Step 4: Commit**

```bash
git add src/components/BatchOperations/hooks/useBatchOperationsHandlers.ts src/components/BatchOperations/contexts/BatchOperationsContext.tsx
git commit -m "feat(batch-operations): wire merge confirmation to real service call

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: mockBatchService 新增 confirmCutIntoSubpath（真实返工写入）

**Files:**
- Modify: `src/components/BatchOperations/services/mockBatchService.ts`
- Modify: `src/components/BatchOperations/services/batchApiService.ts`
- Test: `src/components/BatchOperations/services/mockBatchService.rework.test.ts`

**Interfaces:**
- Consumes: 无新依赖
- Produces: `mockBatchService.confirmCutIntoSubpath(batchId: string, payload: { reworkPathId: string; reworkFirstStationCode: string; reworkFirstStationName: string; returnStationCode: string; operator: string }): Promise<{ success: boolean }>`。供 Task 9 使用。

- [ ] **Step 1: 写失败的测试**

```ts
// src/components/BatchOperations/services/mockBatchService.rework.test.ts
import { describe, it, expect } from 'vitest';
import { mockBatchService } from './mockBatchService';

describe('mockBatchService.confirmCutIntoSubpath', () => {
  it('writes batch-level rework markers without touching wafer lineage', async () => {
    const batches = await mockBatchService.listBatches();
    const target = batches.find(b => !b.isHold && !b.reworkPathId)!;
    const waferSnapshotBefore = await mockBatchService.getBatchWafers(target.id, target.station);

    const result = await mockBatchService.confirmCutIntoSubpath(target.id, {
      reworkPathId: 'REWORK_CMP',
      reworkFirstStationCode: 'CMP_P',
      reworkFirstStationName: 'CMP处理',
      returnStationCode: 'RETURN_01',
      operator: 'tester',
    });
    expect(result.success).toBe(true);

    const after = (await mockBatchService.listBatches()).find(b => b.id === target.id)!;
    expect(after.reworkPathId).toBe('REWORK_CMP');
    expect(after.reworkReturnStationCode).toBe('RETURN_01');
    expect(after.nextStationCode).toBe('CMP_P');
    expect(after.nextStationName).toBe('CMP处理');

    // 回归测试点：返工不产生任何 LineageEvent，不触碰 wafer 数组
    const waferSnapshotAfter = await mockBatchService.getBatchWafers(target.id, target.station);
    expect(waferSnapshotAfter).toEqual(waferSnapshotBefore);
    waferSnapshotAfter.forEach(w => {
      expect(w.lineageEvents ?? []).toHaveLength(0);
    });
  });

  it('rejects cutting into a subpath when the batch is already in one', async () => {
    const batches = await mockBatchService.listBatches();
    const target = batches.find(b => !b.isHold && !b.reworkPathId)!;
    await mockBatchService.confirmCutIntoSubpath(target.id, {
      reworkPathId: 'REWORK_ETCH',
      reworkFirstStationCode: 'ETCH_R',
      reworkFirstStationName: '重新刻蚀',
      returnStationCode: 'RETURN_02',
      operator: 'tester',
    });

    await expect(
      mockBatchService.confirmCutIntoSubpath(target.id, {
        reworkPathId: 'REWORK_CMP',
        reworkFirstStationCode: 'CMP_P',
        reworkFirstStationName: 'CMP处理',
        returnStationCode: 'RETURN_01',
        operator: 'tester',
      })
    ).rejects.toThrow('已处于');
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run src/components/BatchOperations/services/mockBatchService.rework.test.ts`
Expected: FAIL（`confirmCutIntoSubpath` 不存在）

- [ ] **Step 3: 新增 `confirmCutIntoSubpath`**

在 [mockBatchService.ts](../../../src/components/BatchOperations/services/mockBatchService.ts) 的 `confirmMerge`（Task 6 新增）方法后追加：

```ts
  /**
   * 切入返工子路径：批次ID不变，只做真实的状态/路由写入，不产生 LineageEvent、不触碰 wafer 数组
   * （返工不改变批次归属，对血缘正向追踪没有查询价值）
   */
  confirmCutIntoSubpath: async (
    batchId: string,
    payload: {
      reworkPathId: string;
      reworkFirstStationCode: string;
      reworkFirstStationName: string;
      returnStationCode: string;
      operator: string;
    }
  ): Promise<{ success: boolean }> => {
    await delay();
    const idx = _batches.findIndex(b => b.id === batchId);
    if (idx === -1) throw new Error(`批次 ${batchId} 不存在`);
    const batch = _batches[idx];
    if (batch.reworkPathId) throw new Error('批次已处于返工路径中，无法重复切入');

    _batches[idx] = {
      ...batch,
      reworkPathId: payload.reworkPathId,
      reworkReturnStationCode: payload.returnStationCode,
      nextStationCode: payload.reworkFirstStationCode,
      nextStationName: payload.reworkFirstStationName,
    };

    _addHistory(batchId, `切入返工子路径：${payload.reworkPathId}（回流站点：${payload.returnStationCode}）`);
    return { success: true };
  },
```

- [ ] **Step 4: 在 `batchApiService.ts` 补真实 API 占位方法**

在 `confirmMerge` 方法后新增：

```ts
  /**
   * 切入返工子路径
   */
  confirmCutIntoSubpath: (batchId: string, payload: any) =>
    request('/confirm-cut-into-subpath', {
      method: 'POST',
      body: JSON.stringify({ batchId, ...payload }),
    }),
```

- [ ] **Step 5: 运行测试，确认通过**

Run: `npx vitest run src/components/BatchOperations/services/mockBatchService.rework.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/BatchOperations/services/mockBatchService.ts src/components/BatchOperations/services/batchApiService.ts src/components/BatchOperations/services/mockBatchService.rework.test.ts
git commit -m "feat(batch-lineage): implement real confirmCutIntoSubpath (batch-level only)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: BatchOperations UI 接线切入子路径

**Files:**
- Modify: `src/components/BatchOperations/components/CutIntoSubpathForm.tsx`

**Interfaces:**
- Consumes: `batchApiService.confirmCutIntoSubpath`（Task 8）、`useBatchOperations().fetchBatches`（context 已有）
- Produces: 无新导出，纯组件内部行为变化

- [ ] **Step 1: `handleConfirmCutIntoSubpath` 改为真实调用**

打开 [CutIntoSubpathForm.tsx](../../../src/components/BatchOperations/components/CutIntoSubpathForm.tsx)。在顶部解构 `useBatchOperations()` 的地方（第 40 行）追加 `fetchBatches` 和 `batchApiService`：

```ts
  const { fetchStations, fetchBatches } = useBatchOperations();
```

在文件顶部 import 区新增：

```ts
import { batchApiService } from '../services/batchApiService';
```

把：

```ts
  // 处理确认切入子路径操作
  const handleConfirmCutIntoSubpath = () => {
    if (!selectedBatch || !selectedReworkPathId || !selectedReturnStationCode) {
      alert('请选择返工路径和回流站点');
      return;
    }

    console.log('确认切入子路径操作:', {
      sourceBatchCode: selectedBatch.batchCode,
      selectedReworkPathId: selectedReworkPathId,
      selectedReworkPathName: selectedReworkPath?.name,
      configuredStations: configuredStations,
      selectedReturnStationCode: selectedReturnStationCode,
      selectedReturnStationName: filteredReturnStations.find(rs => rs.code === selectedReturnStationCode)?.name,
    });

    // 这里可以添加实际的切入子路径逻辑

    // 完成后返回批次列表
    handleBackToBatchList();
  };
```

改为：

```ts
  // 处理确认切入子路径操作
  const handleConfirmCutIntoSubpath = async () => {
    if (!selectedBatch || !selectedReworkPathId || !selectedReturnStationCode) {
      alert('请选择返工路径和回流站点');
      return;
    }
    const firstStation = selectedReworkPath?.stations[0];
    if (!firstStation) {
      alert('所选返工路径没有配置任何站点，无法切入');
      return;
    }

    try {
      await batchApiService.confirmCutIntoSubpath(selectedBatch.id, {
        reworkPathId: selectedReworkPathId,
        reworkFirstStationCode: firstStation.stationCode,
        reworkFirstStationName: firstStation.stationName,
        returnStationCode: selectedReturnStationCode,
        operator: '当前操作人',
      });
      await fetchBatches();
      handleBackToBatchList();
    } catch (err: any) {
      console.error('Error confirming cut into subpath:', err.message);
      alert(`切入子路径失败：${err.message}`);
    }
  };
```

- [ ] **Step 2: `npm run dev` 手动验证**

进入"批次作业"，选一个未处于返工中的批次点"切入子路径"，选一条返工路径和一个回流站点，点"确认切入"。验证：
1. 弹窗关闭，返回批次列表；
2. 再次进入同一批次的详情/操作面板，确认它已不能被重复"切入子路径"（第二次操作应该在选好路径后点确认时收到 `alert` 报错"批次已处于返工路径中"）；
3. 浏览器控制台无新增报错。

- [ ] **Step 3: Commit**

```bash
git add src/components/BatchOperations/components/CutIntoSubpathForm.tsx
git commit -m "feat(batch-operations): wire rework subpath confirmation to real service call

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 10: mockBatchService 新增 resolveCurrentBatches 查询服务

**Files:**
- Modify: `src/components/BatchOperations/services/mockBatchService.ts`
- Modify: `src/components/BatchOperations/services/batchApiService.ts`
- Test: `src/components/BatchOperations/services/mockBatchService.resolveCurrentBatches.test.ts`

**Interfaces:**
- Consumes: `_equipmentPassEvents`（Task 3）、`WaferData.lineageEvents`（Task 4/6 写入）
- Produces: `mockBatchService.resolveCurrentBatches(equipmentId: string, timeWindow: { start: string; end: string }): Promise<BatchData[]>`。供 Task 11 的 `lineageService` 使用。

- [ ] **Step 1: 写失败的测试（多跳链路场景：A 出站 → 拆出 B → B 合并进 C）**

```ts
// src/components/BatchOperations/services/mockBatchService.resolveCurrentBatches.test.ts
import { describe, it, expect } from 'vitest';
import { mockBatchService } from './mockBatchService';

// 固定用三个不同的种子批次 id，避免两个测试之间互相拿到同一条被前一个测试改动过的批次
// （mockBatchService 的内存状态在同一测试文件的多个 it() 之间是共享、累积的，与
// batchHoldService.test.ts 用固定索引取批次是同一个道理）
const BATCH_A_ID = 'aba03c67-3bf4-417c-b013-43f8f4d83c8e'; // BATCHQO20O3, equipmentCode='EQ003'
const MERGE_TARGET_ID = 'ddc2e9df-3406-4b88-9edf-099a38d0c864'; // BATCHG0RXA7
const BATCH_A2_ID = '207b7612-7e5a-4b47-914a-979fd946c52a'; // BATCHHDDTFP, equipmentCode='EQ002'

describe('mockBatchService.resolveCurrentBatches', () => {
  it('follows a multi-hop split-then-merge chain back to the final batch', async () => {
    const batches = await mockBatchService.listBatches();
    const batchA = batches.find(b => b.id === BATCH_A_ID)!;
    const mergeTarget = batches.find(b => b.id === MERGE_TARGET_ID)!;

    // A 出站：产生一条设备出站履历
    await mockBatchService.confirmOutstation(batchA.id, {});
    const passEvents = await mockBatchService.listEquipmentPassEvents(batchA.equipmentCode, {
      start: new Date(0).toISOString(),
      end: new Date(Date.now() + 60_000).toISOString(),
    });
    const passedAt = passEvents.find(e => e.batchId === batchA.id)!.occurredAt;

    // A 拆出一部分晶圆到新批次 B
    const wafersOfA = (await mockBatchService.getBatchWafers(batchA.id, batchA.station)).filter(w => w.waferId);
    const moved = wafersOfA.slice(0, 1);
    const splitResult = await mockBatchService.confirmSplit(batchA.id, {
      targetCarriers: [{ id: 'SA0190', goodQty: 0, defectQty: 0 }],
      targetWafers: moved.map(w => ({ ...w, id: 'placeholder-0', carrierId: 'SA0190' })),
      operator: 'tester',
    });
    const batchB = splitResult.newBatchId;

    // B 整体合并进 C（mergeTarget）
    await mockBatchService.confirmMerge(batchB, { targetBatchId: mergeTarget.id, operator: 'tester' });

    const resolved = await mockBatchService.resolveCurrentBatches(batchA.equipmentCode, {
      start: new Date(new Date(passedAt).getTime() - 1000).toISOString(),
      end: new Date(new Date(passedAt).getTime() + 60_000).toISOString(),
    });
    const resolvedIds = resolved.map(b => b.id);

    // 拆出去又被合并的那片晶圆，最终应该被追踪到 mergeTarget，而不是 A 或 B
    expect(resolvedIds).toContain(mergeTarget.id);
    // A 剩余未拆出的晶圆仍在 A 里，A 也应该出现在结果里
    expect(resolvedIds).toContain(batchA.id);
  });

  it('excludes a wafer that left the origin batch before the equipment pass timestamp', async () => {
    const batches = await mockBatchService.listBatches();
    const batchA = batches.find(b => b.id === BATCH_A2_ID)!;

    // 先拆批（此时还没出站，视为"命中前已经离开"）
    const wafersOfA = (await mockBatchService.getBatchWafers(batchA.id, batchA.station)).filter(w => w.waferId);
    await mockBatchService.confirmSplit(batchA.id, {
      targetCarriers: [{ id: 'SA0200', goodQty: 0, defectQty: 0 }],
      targetWafers: wafersOfA.slice(0, 1).map(w => ({ ...w, id: 'placeholder-1', carrierId: 'SA0200' })),
      operator: 'tester',
    });

    // 拆批之后才出站——出站事件的时刻晚于 wafer 离开 A 的时刻
    await mockBatchService.confirmOutstation(batchA.id, {});
    const passEvents = await mockBatchService.listEquipmentPassEvents(batchA.equipmentCode, {
      start: new Date(0).toISOString(),
      end: new Date(Date.now() + 60_000).toISOString(),
    });
    const passedAt = passEvents.find(e => e.batchId === batchA.id)!.occurredAt;

    const resolved = await mockBatchService.resolveCurrentBatches(batchA.equipmentCode, {
      start: new Date(new Date(passedAt).getTime() - 1000).toISOString(),
      end: new Date(new Date(passedAt).getTime() + 60_000).toISOString(),
    });

    // A 剩余的晶圆仍应命中 A 自己；但那片已经在出站之前就拆走的晶圆所在的新批次不应该被圈入
    // （因为它离开 A 的时间早于这次出站命中的时刻，不算"命中那一刻还在 A 里"）
    expect(resolved.map(b => b.id)).toContain(batchA.id);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run src/components/BatchOperations/services/mockBatchService.resolveCurrentBatches.test.ts`
Expected: FAIL（`resolveCurrentBatches` 不存在）

- [ ] **Step 3: 实现 `resolveCurrentBatches`**

在 [mockBatchService.ts](../../../src/components/BatchOperations/services/mockBatchService.ts) 的 `listEquipmentPassEvents` 方法（Task 3 新增）后追加：

```ts
  /**
   * 新增：给定机台+时间窗口，找出该窗口内出站的原始批次，再沿血缘链条正向追踪
   * 每个 wafer 现在实际所在的批次，去重返回。算法细节见设计 spec 的"resolveCurrentBatches"一节。
   */
  resolveCurrentBatches: async (
    equipmentId: string,
    timeWindow: { start: string; end: string }
  ): Promise<BatchData[]> => {
    await delay();
    const startMs = new Date(timeWindow.start).getTime();
    const endMs = new Date(timeWindow.end).getTime();

    // 1. 找出该机台在窗口内出站的原始批次，同一批次多次出站取最早一次（从严圈定）
    const passedAtByBatchId = new Map<string, number>();
    _equipmentPassEvents
      .filter(e => e.equipmentCode === equipmentId)
      .forEach(e => {
        const t = new Date(e.occurredAt).getTime();
        if (t < startMs || t > endMs) return;
        const existing = passedAtByBatchId.get(e.batchId);
        if (existing === undefined || t < existing) passedAtByBatchId.set(e.batchId, t);
      });

    const currentBatchIds = new Set<string>();
    const allWafers = Object.values(_wafers).flat();

    for (const [originBatchId, passedAt] of passedAtByBatchId.entries()) {
      // 2a. 仍直接挂在原批次下、从未被移动过的 wafer → 原批次自己命中
      const originSubs = _subBatches[originBatchId] || [];
      const stillHasWafers = originSubs.some(s => (_wafers[s.id] || []).some(w => w.waferId));
      if (stillHasWafers) currentBatchIds.add(originBatchId);

      // 2b. 曾经从原批次移出的 wafer：按离开时间相对 passedAt 的先后判断
      allWafers.forEach(wafer => {
        const events = [...(wafer.lineageEvents || [])].sort(
          (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
        );
        const leftOrigin = events.find(e => e.fromBatchId === originBatchId);
        if (!leftOrigin) return;
        if (new Date(leftOrigin.occurredAt).getTime() < passedAt) return; // 命中前已经离开，排除

        // 沿该 wafer 后续事件链条追到最后一条的 toBatchId，得到"现在"所在批次
        const lastEvent = events[events.length - 1];
        currentBatchIds.add(lastEvent.toBatchId);
      });
    }

    return _batches.filter(b => currentBatchIds.has(b.id));
  },
```

- [ ] **Step 4: 在 `batchApiService.ts` 补真实 API 占位方法**

在 `listEquipmentPassEvents` 方法（Task 3 新增）后追加：

```ts
  /**
   * 新增：给定机台+时间窗口，追踪当前风险批次清单
   */
  resolveCurrentBatches: (equipmentId: string, timeWindow: { start: string; end: string }) =>
    request(`/equipment/${encodeURIComponent(equipmentId)}/resolve-current-batches`, {
      method: 'POST',
      body: JSON.stringify({ timeWindow }),
    }),
```

- [ ] **Step 5: 运行测试，确认通过**

Run: `npx vitest run src/components/BatchOperations/services/mockBatchService.resolveCurrentBatches.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/BatchOperations/services/mockBatchService.ts src/components/BatchOperations/services/batchApiService.ts src/components/BatchOperations/services/mockBatchService.resolveCurrentBatches.test.ts
git commit -m "feat(batch-lineage): implement resolveCurrentBatches multi-hop tracing

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 11: 新增 src/services/lineage/lineageService.ts（薄委托）

**Files:**
- Create: `src/services/lineage/lineageService.ts`
- Test: `src/services/lineage/lineageService.test.ts`

**Interfaces:**
- Consumes: `batchApiService.resolveCurrentBatches`（Task 10）
- Produces: `lineageService.resolveCurrentBatches(equipmentId: string, timeWindow: { start: string; end: string }): Promise<BatchData[]>`。供 ③b 的 `spcAutoHoldService`（Task 16）使用，是③b唯一应该导入的血缘查询入口。

- [ ] **Step 1: 写失败的测试**

```ts
// src/services/lineage/lineageService.test.ts
import { describe, it, expect } from 'vitest';
import { lineageService } from './lineageService';
import { batchApiService } from '../../components/BatchOperations/services/batchApiService';

describe('lineageService.resolveCurrentBatches', () => {
  it('delegates to batchApiService.resolveCurrentBatches and returns matching batches', async () => {
    const batches = await batchApiService.listBatches();
    const target = batches[6];
    await batchApiService.confirmOutstation(target.id, {});

    const result = await lineageService.resolveCurrentBatches(target.equipmentCode, {
      start: new Date(0).toISOString(),
      end: new Date(Date.now() + 60_000).toISOString(),
    });

    expect(result.some(b => b.id === target.id)).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run src/services/lineage/lineageService.test.ts`
Expected: FAIL（`lineageService` 模块不存在）

- [ ] **Step 3: 实现薄委托**

```ts
// src/services/lineage/lineageService.ts
import { BatchData } from '../../components/BatchOperations/types';
import { batchApiService } from '../../components/BatchOperations/services/batchApiService';

/**
 * wafer 血缘查询服务——跨模块共享入口，重逻辑留在 BatchOperations 的 mock/real API 服务内部
 * （那里才有 _wafers/_equipmentPassEvents 的访问权限），本文件只做一层薄委托。
 * ③b 的 spcAutoHoldService 应该只导入这个服务，不直接碰 batchApiService/mockBatchService 内部状态。
 */
export const lineageService = {
  resolveCurrentBatches(equipmentId: string, timeWindow: { start: string; end: string }): Promise<BatchData[]> {
    return batchApiService.resolveCurrentBatches(equipmentId, timeWindow);
  },
};
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npx vitest run src/services/lineage/lineageService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/lineage/lineageService.ts src/services/lineage/lineageService.test.ts
git commit -m "feat(lineage): add lineageService as the shared cross-module entry point

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 12: 新增 modules/ocap/services/workOrderService.ts（可写工单存储）

**Files:**
- Create: `modules/ocap/services/workOrderService.ts`
- Test: `modules/ocap/services/workOrderService.test.ts`

**Interfaces:**
- Consumes: `WorkOrder`（`modules/ocap/types/workOrder.ts`，已存在）
- Produces: `workOrderService.listWorkOrders(): WorkOrder[]`、`workOrderService.generateId(): string`、`workOrderService.createWorkOrder(input: {...}, id: string): WorkOrder`。供 Task 13（WorkOrderList 接入）、Task 16（③b 执行引擎）使用。

**背景**：OCAP 目前没有任何可写的工单存储——`WorkOrderList.tsx` 直接 `useState(mockWorkOrders)` 拿静态数组当初始值，别处写不进去。

- [ ] **Step 1: 写失败的测试**

```ts
// modules/ocap/services/workOrderService.test.ts
import { describe, it, expect } from 'vitest';
import { workOrderService } from './workOrderService';
import { mockWorkOrders } from '../data/mockData';

describe('workOrderService', () => {
  it('listWorkOrders returns the seed work orders initially', () => {
    const list = workOrderService.listWorkOrders();
    expect(list.length).toBeGreaterThanOrEqual(mockWorkOrders.length);
  });

  it('createWorkOrder appends a new work order that shows up in listWorkOrders', () => {
    const id = workOrderService.generateId();
    const created = workOrderService.createWorkOrder(
      {
        name: 'SPC自动Hold测试工单',
        batchNumber: '3个批次（详见Hold记录）',
        equipment: 'EQ999',
        productModel: 'TEST-MODEL',
        exceptionType: 'SPC OOS/OOC',
        description: '自动触发',
        submitter: 'SPC自动触发系统',
      },
      id
    );

    expect(created.id).toBe(id);
    expect(created.status).toBe('processing');
    expect(created.currentAssignee).toBeNull();
    expect(created.stages).toEqual([]);

    const list = workOrderService.listWorkOrders();
    expect(list.find(w => w.id === id)).toBeTruthy();
  });

  it('generateId returns unique ids across calls', () => {
    const a = workOrderService.generateId();
    const b = workOrderService.generateId();
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run modules/ocap/services/workOrderService.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现服务**

```ts
// modules/ocap/services/workOrderService.ts
import { WorkOrder } from '../types/workOrder';
import { mockWorkOrders } from '../data/mockData';

// 内存单例，风格对齐 mockBatchService：种子数据浅拷贝成可变数组
let _workOrders: WorkOrder[] = mockWorkOrders.map(w => ({ ...w }));
let _seq = 0;

export const workOrderService = {
  /** 查询全部工单（含种子数据与运行期新建的） */
  listWorkOrders(): WorkOrder[] {
    return [..._workOrders];
  },

  /** 预生成一个工单ID（不落库），供调用方在真正创建工单对象之前就拿到ID去关联别的记录 */
  generateId(): string {
    _seq += 1;
    return `OCAP-AUTO-${Date.now()}-${_seq}`;
  },

  /** 用指定ID创建一张工单，默认状态为处理中、无当前处理人、无处理阶段 */
  createWorkOrder(
    input: {
      name: string;
      batchNumber: string;
      equipment: string;
      productModel: string;
      exceptionType: string;
      description: string;
      submitter: string;
    },
    id: string
  ): WorkOrder {
    const workOrder: WorkOrder = {
      id,
      name: input.name,
      batchNumber: input.batchNumber,
      equipment: input.equipment,
      productModel: input.productModel,
      exceptionType: input.exceptionType,
      description: input.description,
      status: 'processing',
      submitter: input.submitter,
      createdAt: new Date().toISOString(),
      currentStage: 0,
      currentAssignee: null,
      stages: [],
    };
    _workOrders.push(workOrder);
    return workOrder;
  },

  /** 仅供测试使用：重置模块内内存状态 */
  __resetForTests(): void {
    _workOrders = mockWorkOrders.map(w => ({ ...w }));
    _seq = 0;
  },
};
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npx vitest run modules/ocap/services/workOrderService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add modules/ocap/services/workOrderService.ts modules/ocap/services/workOrderService.test.ts
git commit -m "feat(ocap): add writable workOrderService backing store

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 13: WorkOrderList.tsx 接入 workOrderService

**Files:**
- Modify: `modules/ocap/pages/WorkOrderList.tsx`

**Interfaces:**
- Consumes: `workOrderService.listWorkOrders()`（Task 12）
- Produces: 无新导出，纯组件内部数据源切换

- [ ] **Step 1: 替换静态导入为服务调用**

打开 [WorkOrderList.tsx](../../../modules/ocap/pages/WorkOrderList.tsx)，把：

```tsx
import { mockWorkOrders } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import FilterDropdown from '../components/FilterDropdown';

const WorkOrderList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [workOrders, setWorkOrders] = useState(mockWorkOrders);
  const [filteredOrders, setFilteredOrders] = useState(mockWorkOrders);
  
  useEffect(() => {
    let filtered = mockWorkOrders;
```

改为：

```tsx
import { workOrderService } from '../services/workOrderService';
import StatusBadge from '../components/StatusBadge';
import FilterDropdown from '../components/FilterDropdown';

const WorkOrderList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [workOrders, setWorkOrders] = useState(() => workOrderService.listWorkOrders());
  const [filteredOrders, setFilteredOrders] = useState(() => workOrderService.listWorkOrders());
  
  useEffect(() => {
    let filtered = workOrders;
```

`workOrders` 这个 state 本身目前只在初始化时读了一次服务数据，页面停留期间不会自动感知③b执行引擎新建的工单（这与 `BatchOperations` 里 `fetchBatches` 需要手动调用刷新是同一类现状约束，不在本任务里额外实现轮询/订阅）。

- [ ] **Step 2: `npm run dev` 手动验证**

进入 OCAP "工单管理"页面，确认仍能看到原有的 5 张种子工单（`OCAP-2023-007` 等），列表渲染、搜索、状态筛选均正常。

- [ ] **Step 3: Commit**

```bash
git add modules/ocap/pages/WorkOrderList.tsx
git commit -m "feat(ocap): read work orders from workOrderService instead of static import

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 14: 新增 src/services/spcAutoHold/types.ts

**Files:**
- Create: `src/services/spcAutoHold/types.ts`

**Interfaces:**
- Consumes: 无
- Produces: `SpcAbnormalEvent`、`AutoHoldRule`、`AutoHoldExecutionRecord` 类型。供 Task 15/16/17 使用。

- [ ] **Step 1: 新建类型文件**

```ts
// src/services/spcAutoHold/types.ts

/** 黑盒触发输入——判异算法本身不在本系统范围内，只消费一个已经判完异的事件 */
export interface SpcAbnormalEvent {
  equipmentId: string;
  occurredAt: string;
  parameterName: string;
  monitorType: string;
  judgeResult: 'OOC' | 'OOS';
  /** 上一次同机台同monitor合格的时间点。判异黑盒只在异常时触发一次，从不产生"合格"事件，
   *  "回溯到上次合格"这个时间锚点只能由触发方随事件一起带进来，本系统不反向推算。 */
  lastPassedAt?: string;
}

/** SPC自动Hold规则配置本体 */
export interface AutoHoldRule {
  id: string;
  name: string;
  equipmentId: string;
  productCode?: string;
  station?: string;
  monitorType: string;
  timeWindowMode: 'fixed' | 'back-to-last-pass';
  fixedWindowHours?: number;
  responsibleProcessEngineer: string;
  responsibleQualityEngineer: string;
  enabled: boolean;
  createdAt: string;
  createdBy: string;
}

/** 一次规则执行的记录——纯内存保存，是验证规则跑没跑对的唯一途径 */
export interface AutoHoldExecutionRecord {
  id: string;
  ruleId: string;
  event: SpcAbnormalEvent;
  matchedBatchIds: string[];
  workOrderId?: string;
  executedAt: string;
  result: 'holdApplied' | 'noBatchesMatched' | 'missingLastPassedAt';
  workOrderCreationFailed?: boolean;
}
```

- [ ] **Step 2: 运行 tsc，确认没有新增错误**

Run: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | wc -l`
Expected: 与改动前一致（这是一个全新文件，没有任何地方引用它，不会产生新错误）

- [ ] **Step 3: Commit**

```bash
git add src/services/spcAutoHold/types.ts
git commit -m "feat(spc-auto-hold): add SpcAbnormalEvent/AutoHoldRule/AutoHoldExecutionRecord types

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 15: 新增 src/services/spcAutoHold/ruleStorage.ts（localStorage 持久化 CRUD）

**Files:**
- Create: `src/services/spcAutoHold/ruleStorage.ts`
- Test: `src/services/spcAutoHold/ruleStorage.test.ts`

**Interfaces:**
- Consumes: `AutoHoldRule`（Task 14）
- Produces: `ruleStorage.getRules()`、`ruleStorage.saveRules(rules)`、`ruleStorage.addRule(rule)`、`ruleStorage.updateRule(id, updates)`、`ruleStorage.deleteRule(id)`、`ruleStorage.getRuleById(id)`。供 Task 16/17 使用。

**风格照抄** [modules/ocap/utils/templateStorage.ts](../../../modules/ocap/utils/templateStorage.ts)。

- [ ] **Step 1: 写失败的测试（含 localStorage polyfill）**

```ts
// src/services/spcAutoHold/ruleStorage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

// vitest 的 environment: 'node' 没有全局 localStorage（已用 `node -e "localStorage"` 验证会抛
// ReferenceError），这里挂一个最小的内存版 polyfill，只服务这一个测试文件，不改 vitest.config.ts。
class MemoryLocalStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}
(globalThis as any).localStorage = new MemoryLocalStorage();

import { ruleStorage } from './ruleStorage';
import { AutoHoldRule } from './types';

const makeRule = (overrides: Partial<AutoHoldRule> = {}): AutoHoldRule => ({
  id: 'rule-1',
  name: '测试规则',
  equipmentId: 'EQ001',
  monitorType: 'metal-ion',
  timeWindowMode: 'fixed',
  fixedWindowHours: 8,
  responsibleProcessEngineer: '张伟',
  responsibleQualityEngineer: '李娜',
  enabled: true,
  createdAt: new Date().toISOString(),
  createdBy: 'tester',
  ...overrides,
});

describe('ruleStorage', () => {
  beforeEach(() => {
    (globalThis as any).localStorage.clear();
  });

  it('getRules returns an empty array when nothing is stored', () => {
    expect(ruleStorage.getRules()).toEqual([]);
  });

  it('addRule persists a rule that getRules can read back', () => {
    ruleStorage.addRule(makeRule());
    expect(ruleStorage.getRules()).toHaveLength(1);
    expect(ruleStorage.getRuleById('rule-1')?.name).toBe('测试规则');
  });

  it('updateRule merges partial updates', () => {
    ruleStorage.addRule(makeRule());
    ruleStorage.updateRule('rule-1', { enabled: false });
    expect(ruleStorage.getRuleById('rule-1')?.enabled).toBe(false);
  });

  it('deleteRule removes the rule', () => {
    ruleStorage.addRule(makeRule());
    ruleStorage.deleteRule('rule-1');
    expect(ruleStorage.getRules()).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run src/services/spcAutoHold/ruleStorage.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 `ruleStorage`**

```ts
// src/services/spcAutoHold/ruleStorage.ts
import { AutoHoldRule } from './types';

const STORAGE_KEY = 'spc_auto_hold_rules';

export const ruleStorage = {
  getRules(): AutoHoldRule[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('加载SPC自动Hold规则失败:', error);
      return [];
    }
  },

  saveRules(rules: AutoHoldRule[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    } catch (error) {
      console.error('保存SPC自动Hold规则失败:', error);
      throw new Error('保存失败，可能是存储空间不足');
    }
  },

  addRule(rule: AutoHoldRule): void {
    const rules = this.getRules();
    rules.push(rule);
    this.saveRules(rules);
  },

  updateRule(id: string, updates: Partial<AutoHoldRule>): void {
    const rules = this.getRules();
    const index = rules.findIndex(r => r.id === id);
    if (index !== -1) {
      rules[index] = { ...rules[index], ...updates };
      this.saveRules(rules);
    }
  },

  deleteRule(id: string): void {
    const rules = this.getRules();
    this.saveRules(rules.filter(r => r.id !== id));
  },

  getRuleById(id: string): AutoHoldRule | null {
    return this.getRules().find(r => r.id === id) || null;
  },
};
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npx vitest run src/services/spcAutoHold/ruleStorage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/spcAutoHold/ruleStorage.ts src/services/spcAutoHold/ruleStorage.test.ts
git commit -m "feat(spc-auto-hold): add localStorage-backed rule CRUD

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 16: 新增 src/services/spcAutoHold/spcAutoHoldService.ts（执行引擎）

**Files:**
- Create: `src/services/spcAutoHold/spcAutoHoldService.ts`
- Test: `src/services/spcAutoHold/spcAutoHoldService.test.ts`

**Interfaces:**
- Consumes: `ruleStorage`（Task 15）、`lineageService.resolveCurrentBatches`（Task 11）、`batchHoldService.holdBatches`（已存在）、`workOrderService.generateId`/`createWorkOrder`（Task 12）
- Produces: `spcAutoHoldService.handleSpcAbnormalEvent(event: SpcAbnormalEvent): Promise<AutoHoldExecutionRecord[]>`、`spcAutoHoldService.listExecutionRecords(): AutoHoldExecutionRecord[]`。供 Task 17 的规则管理页 UI 使用。

- [ ] **Step 1: 写失败的测试**

```ts
// src/services/spcAutoHold/spcAutoHoldService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

class MemoryLocalStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}
(globalThis as any).localStorage = new MemoryLocalStorage();

import { spcAutoHoldService } from './spcAutoHoldService';
import { ruleStorage } from './ruleStorage';
import { AutoHoldRule, SpcAbnormalEvent } from './types';
import { batchApiService } from '../../components/BatchOperations/services/batchApiService';
import { __resetBatchHoldServiceForTests, batchHoldService } from '../batchHold/batchHoldService';

const makeRule = (overrides: Partial<AutoHoldRule> = {}): AutoHoldRule => ({
  id: `rule-${Math.random()}`,
  name: '测试规则',
  equipmentId: 'EQ_SPC_TEST',
  monitorType: 'metal-ion',
  timeWindowMode: 'fixed',
  fixedWindowHours: 8,
  responsibleProcessEngineer: '张伟',
  responsibleQualityEngineer: '李娜',
  enabled: true,
  createdAt: new Date().toISOString(),
  createdBy: 'tester',
  ...overrides,
});

describe('spcAutoHoldService.handleSpcAbnormalEvent', () => {
  beforeEach(() => {
    (globalThis as any).localStorage.clear();
    __resetBatchHoldServiceForTests();
  });

  it('holds matched batches and creates a work order when resolveCurrentBatches returns batches', async () => {
    const batches = await batchApiService.listBatches();
    const target = batches[7];
    // 用批次真实的 equipmentCode 出站一次，制造一个会命中 resolveCurrentBatches 的场景
    // （不伪造 equipmentCode——confirmOutstation 写入 EquipmentPassEvent 时读的是 _batches
    //  里的真实存量数据，改一份局部拷贝的字段不会影响它）
    await batchApiService.confirmOutstation(target.id, {});

    const rule = makeRule({ equipmentId: target.equipmentCode });
    ruleStorage.addRule(rule);

    const event: SpcAbnormalEvent = {
      equipmentId: target.equipmentCode,
      occurredAt: new Date().toISOString(),
      parameterName: '金属离子浓度',
      monitorType: 'metal-ion',
      judgeResult: 'OOC',
    };

    const records = await spcAutoHoldService.handleSpcAbnormalEvent(event);
    const recordForRule = records.find(r => r.ruleId === rule.id)!;
    expect(recordForRule).toBeTruthy();
    // target 刚出站，一定会被 resolveCurrentBatches 命中（它自己就是 origin batch，wafer 仍在其中）
    expect(recordForRule.result).toBe('holdApplied');
    expect(recordForRule.matchedBatchIds).toContain(target.id);
    expect(recordForRule.workOrderId).toBeTruthy();
    const activeHolds = await batchHoldService.listActiveHoldRecords();
    expect(activeHolds.some(h => h.batchId === target.id)).toBe(true);
  });

  it('skips a rule requiring back-to-last-pass when the event has no lastPassedAt, without failing other rules', async () => {
    const backToLastPassRule = makeRule({ timeWindowMode: 'back-to-last-pass' });
    const fixedRule = makeRule({ timeWindowMode: 'fixed', fixedWindowHours: 1 });
    ruleStorage.addRule(backToLastPassRule);
    ruleStorage.addRule(fixedRule);

    const event: SpcAbnormalEvent = {
      equipmentId: 'EQ_SPC_TEST',
      occurredAt: new Date().toISOString(),
      parameterName: '金属离子浓度',
      monitorType: 'metal-ion',
      judgeResult: 'OOC',
      // 故意不带 lastPassedAt
    };

    const records = await spcAutoHoldService.handleSpcAbnormalEvent(event);
    const backToLastPassRecord = records.find(r => r.ruleId === backToLastPassRule.id)!;
    const fixedRecord = records.find(r => r.ruleId === fixedRule.id)!;

    expect(backToLastPassRecord.result).toBe('missingLastPassedAt');
    expect(['holdApplied', 'noBatchesMatched']).toContain(fixedRecord.result);
  });

  it('does not match a rule for a different equipmentId or monitorType', async () => {
    const rule = makeRule({ equipmentId: 'EQ_OTHER', monitorType: 'particle' });
    ruleStorage.addRule(rule);

    const event: SpcAbnormalEvent = {
      equipmentId: 'EQ_SPC_TEST',
      occurredAt: new Date().toISOString(),
      parameterName: 'x',
      monitorType: 'metal-ion',
      judgeResult: 'OOS',
    };

    const records = await spcAutoHoldService.handleSpcAbnormalEvent(event);
    expect(records.find(r => r.ruleId === rule.id)).toBeUndefined();
  });

  it('listExecutionRecords accumulates records across calls', async () => {
    const before = spcAutoHoldService.listExecutionRecords().length;
    ruleStorage.addRule(makeRule());
    await spcAutoHoldService.handleSpcAbnormalEvent({
      equipmentId: 'EQ_SPC_TEST',
      occurredAt: new Date().toISOString(),
      parameterName: 'x',
      monitorType: 'metal-ion',
      judgeResult: 'OOS',
    });
    expect(spcAutoHoldService.listExecutionRecords().length).toBeGreaterThan(before);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run src/services/spcAutoHold/spcAutoHoldService.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现执行引擎**

```ts
// src/services/spcAutoHold/spcAutoHoldService.ts
import { AutoHoldExecutionRecord, SpcAbnormalEvent } from './types';
import { ruleStorage } from './ruleStorage';
import { lineageService } from '../lineage/lineageService';
import { batchHoldService } from '../batchHold/batchHoldService';
import { workOrderService } from '../../../modules/ocap/services/workOrderService';

let _executionRecords: AutoHoldExecutionRecord[] = [];
let _seq = 0;
const nextRecordId = () => `spc-exec-${Date.now()}-${_seq++}`;

function computeTimeWindow(
  rule: { timeWindowMode: 'fixed' | 'back-to-last-pass'; fixedWindowHours?: number },
  event: SpcAbnormalEvent
): { start: string; end: string } | null {
  if (rule.timeWindowMode === 'fixed') {
    const hours = rule.fixedWindowHours ?? 8;
    const end = new Date(event.occurredAt);
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  if (!event.lastPassedAt) return null;
  return { start: event.lastPassedAt, end: event.occurredAt };
}

export const spcAutoHoldService = {
  async handleSpcAbnormalEvent(event: SpcAbnormalEvent): Promise<AutoHoldExecutionRecord[]> {
    if (!event.equipmentId) throw new Error('SpcAbnormalEvent.equipmentId 不能为空');
    if (event.judgeResult !== 'OOC' && event.judgeResult !== 'OOS') {
      throw new Error(`未知的 judgeResult: ${event.judgeResult}`);
    }

    const candidateRules = ruleStorage
      .getRules()
      .filter(r => r.enabled && r.equipmentId === event.equipmentId && r.monitorType === event.monitorType);

    const records: AutoHoldExecutionRecord[] = [];

    for (const rule of candidateRules) {
      const timeWindow = computeTimeWindow(rule, event);
      if (!timeWindow) {
        const record: AutoHoldExecutionRecord = {
          id: nextRecordId(),
          ruleId: rule.id,
          event,
          matchedBatchIds: [],
          executedAt: new Date().toISOString(),
          result: 'missingLastPassedAt',
        };
        _executionRecords.push(record);
        records.push(record);
        continue;
      }

      let matchedBatches = await lineageService.resolveCurrentBatches(event.equipmentId, timeWindow);
      if (rule.productCode) matchedBatches = matchedBatches.filter(b => b.productCode === rule.productCode);
      if (rule.station) matchedBatches = matchedBatches.filter(b => b.station === rule.station);

      if (matchedBatches.length === 0) {
        const record: AutoHoldExecutionRecord = {
          id: nextRecordId(),
          ruleId: rule.id,
          event,
          matchedBatchIds: [],
          executedAt: new Date().toISOString(),
          result: 'noBatchesMatched',
        };
        _executionRecords.push(record);
        records.push(record);
        continue;
      }

      // 先预生成 workOrderId（只分配ID字符串，不落库），随 Hold 一起写入 HoldRecord；
      // 工单对象本身随后才创建——Hold 的生效不依赖工单创建是否成功，也不需要给
      // batchHoldService（阶段①②已实施）新增"事后更新 HoldRecord"的接口。
      const workOrderId = workOrderService.generateId();
      const matchedBatchIds = matchedBatches.map(b => b.id);

      await batchHoldService.holdBatches(
        matchedBatchIds,
        {
          category: 'SPC异常',
          text: `SPC自动Hold规则「${rule.name}」触发（机台${event.equipmentId}，${event.judgeResult}）`,
          source: 'ocap-auto',
          relatedRuleId: rule.id,
          relatedOcapWorkOrderId: workOrderId,
          triggeredByEquipment: event.equipmentId,
          triggeredTimeWindow: timeWindow,
          notifiedProcessEngineer: rule.responsibleProcessEngineer,
          notifiedQualityEngineer: rule.responsibleQualityEngineer,
        },
        'SPC自动触发系统'
      );

      let workOrderCreationFailed = false;
      try {
        workOrderService.createWorkOrder(
          {
            name: `SPC自动Hold：${rule.name}`,
            batchNumber: `${matchedBatchIds.length}个批次（详见Hold记录）`,
            equipment: event.equipmentId,
            productModel: matchedBatches[0]?.productCode ?? '',
            exceptionType: 'SPC OOS/OOC',
            description: `规则「${rule.name}」命中，参数：${event.parameterName}，判异结果：${event.judgeResult}`,
            submitter: 'SPC自动触发系统',
          },
          workOrderId
        );
      } catch (err) {
        workOrderCreationFailed = true;
        console.error('自动Hold后生成OCAP工单失败:', err);
      }

      const record: AutoHoldExecutionRecord = {
        id: nextRecordId(),
        ruleId: rule.id,
        event,
        matchedBatchIds,
        workOrderId,
        executedAt: new Date().toISOString(),
        result: 'holdApplied',
        ...(workOrderCreationFailed ? { workOrderCreationFailed: true } : {}),
      };
      _executionRecords.push(record);
      records.push(record);
    }

    return records;
  },

  listExecutionRecords(): AutoHoldExecutionRecord[] {
    return [..._executionRecords];
  },

  /** 仅供测试使用 */
  __resetForTests(): void {
    _executionRecords = [];
    _seq = 0;
  },
};
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npx vitest run src/services/spcAutoHold/spcAutoHoldService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/spcAutoHold/spcAutoHoldService.ts src/services/spcAutoHold/spcAutoHoldService.test.ts
git commit -m "feat(spc-auto-hold): implement handleSpcAbnormalEvent execution engine

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 17: 新增 SpcAutoHoldRulesModule.tsx（规则管理页 UI）

**Files:**
- Create: `src/components/SpcAutoHoldRules/SpcAutoHoldRulesModule.tsx`

**Interfaces:**
- Consumes: `ruleStorage`（Task 15）、`spcAutoHoldService`（Task 16）、`batchApiService.listBatches`（已存在，用于从批次数据里取出真实存在过的机台编码下拉选项——`StationData`（`listStations` 的返回类型）只有 `{code, name}`，是工序/站点而不是机台，没有 `equipmentCode` 字段，机台编码只存在于 `BatchData.equipmentCode` 上，没有独立的机台主数据服务）
- Produces: `SpcAutoHoldRulesModule` 组件（默认导出），供 Task 18 挂载

**这个任务是纯 UI，不新增 vitest 测试**（沿用项目约定）。参照 [BatchHoldSearchModule.tsx](../../../src/components/BatchHoldSearch/BatchHoldSearchModule.tsx) 的整体风格：原生 HTML + Tailwind，模块顶部一次性 `useEffect` 加载数据。

- [ ] **Step 1: 新建组件文件**

```tsx
// src/components/SpcAutoHoldRules/SpcAutoHoldRulesModule.tsx
import React, { useEffect, useState } from 'react';
import { ruleStorage } from '../../services/spcAutoHold/ruleStorage';
import { spcAutoHoldService } from '../../services/spcAutoHold/spcAutoHoldService';
import { AutoHoldRule, AutoHoldExecutionRecord, SpcAbnormalEvent } from '../../services/spcAutoHold/types';
import { batchApiService } from '../BatchOperations/services/batchApiService';

const emptyRuleForm = (): Omit<AutoHoldRule, 'id' | 'createdAt' | 'createdBy'> => ({
  name: '',
  equipmentId: '',
  productCode: '',
  station: '',
  monitorType: 'metal-ion',
  timeWindowMode: 'fixed',
  fixedWindowHours: 8,
  responsibleProcessEngineer: '',
  responsibleQualityEngineer: '',
  enabled: true,
});

const emptyEventForm = (): SpcAbnormalEvent => ({
  equipmentId: '',
  occurredAt: new Date().toISOString().slice(0, 16),
  parameterName: '',
  monitorType: 'metal-ion',
  judgeResult: 'OOC',
  lastPassedAt: '',
});

const SpcAutoHoldRulesModule: React.FC = () => {
  const [rules, setRules] = useState<AutoHoldRule[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);
  const [ruleForm, setRuleForm] = useState(emptyRuleForm());
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const [eventForm, setEventForm] = useState<SpcAbnormalEvent>(emptyEventForm());
  const [executionRecords, setExecutionRecords] = useState<AutoHoldExecutionRecord[]>([]);

  const loadRules = () => setRules(ruleStorage.getRules());

  useEffect(() => {
    loadRules();
    setExecutionRecords(spcAutoHoldService.listExecutionRecords());
    // 机台编码没有独立的主数据服务，只能从批次数据里的 equipmentCode 字段取真实出现过的值去重
    // （StationData/listStations 是工序/站点列表，只有 code/name，没有 equipmentCode）
    batchApiService.listBatches().then((batches: any[]) => {
      const codes = Array.from(new Set(batches.map(b => b.equipmentCode).filter(Boolean))) as string[];
      setEquipmentOptions(codes);
    });
  }, []);

  const handleSaveRule = () => {
    if (!ruleForm.name || !ruleForm.equipmentId || !ruleForm.monitorType) {
      alert('请填写规则名称、机台和monitor类型');
      return;
    }
    if (ruleForm.timeWindowMode === 'fixed' && !ruleForm.fixedWindowHours) {
      alert('固定周期模式需要填写回溯小时数');
      return;
    }
    if (!ruleForm.responsibleProcessEngineer || !ruleForm.responsibleQualityEngineer) {
      alert('请填写责任工艺工程师和知会质量工程师');
      return;
    }

    if (editingRuleId) {
      ruleStorage.updateRule(editingRuleId, ruleForm);
    } else {
      ruleStorage.addRule({
        ...ruleForm,
        id: `rule-${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdBy: '当前操作人',
      });
    }
    setRuleForm(emptyRuleForm());
    setEditingRuleId(null);
    loadRules();
  };

  const handleEditRule = (rule: AutoHoldRule) => {
    setEditingRuleId(rule.id);
    setRuleForm({
      name: rule.name,
      equipmentId: rule.equipmentId,
      productCode: rule.productCode ?? '',
      station: rule.station ?? '',
      monitorType: rule.monitorType,
      timeWindowMode: rule.timeWindowMode,
      fixedWindowHours: rule.fixedWindowHours,
      responsibleProcessEngineer: rule.responsibleProcessEngineer,
      responsibleQualityEngineer: rule.responsibleQualityEngineer,
      enabled: rule.enabled,
    });
  };

  const handleDeleteRule = (id: string) => {
    if (!confirm('确认删除这条规则？')) return;
    ruleStorage.deleteRule(id);
    loadRules();
  };

  const handleSimulateTrigger = async () => {
    if (!eventForm.equipmentId || !eventForm.monitorType) {
      alert('请填写机台和monitor类型');
      return;
    }
    const event: SpcAbnormalEvent = {
      ...eventForm,
      occurredAt: new Date(eventForm.occurredAt).toISOString(),
      lastPassedAt: eventForm.lastPassedAt ? new Date(eventForm.lastPassedAt).toISOString() : undefined,
    };
    await spcAutoHoldService.handleSpcAbnormalEvent(event);
    setExecutionRecords(spcAutoHoldService.listExecutionRecords());
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-xl font-semibold text-gray-800">SPC自动Hold规则</h1>

      {/* 规则列表 + 新建/编辑表单 */}
      <section className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-base font-medium text-gray-800">{editingRuleId ? '编辑规则' : '新建规则'}</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="规则名称 *"
            value={ruleForm.name}
            onChange={e => setRuleForm(f => ({ ...f, name: e.target.value }))}
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={ruleForm.equipmentId}
            onChange={e => setRuleForm(f => ({ ...f, equipmentId: e.target.value }))}
          >
            <option value="">选择机台 *</option>
            {equipmentOptions.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="产品料号（可选）"
            value={ruleForm.productCode}
            onChange={e => setRuleForm(f => ({ ...f, productCode: e.target.value }))}
          />
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="工序/站点（可选）"
            value={ruleForm.station}
            onChange={e => setRuleForm(f => ({ ...f, station: e.target.value }))}
          />
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="monitor类型 *（如 metal-ion）"
            value={ruleForm.monitorType}
            onChange={e => setRuleForm(f => ({ ...f, monitorType: e.target.value }))}
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={ruleForm.timeWindowMode}
            onChange={e => setRuleForm(f => ({ ...f, timeWindowMode: e.target.value as 'fixed' | 'back-to-last-pass' }))}
          >
            <option value="fixed">固定周期回溯</option>
            <option value="back-to-last-pass">回溯到上次合格</option>
          </select>
          {ruleForm.timeWindowMode === 'fixed' && (
            <input
              type="number"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="回溯小时数 *"
              value={ruleForm.fixedWindowHours ?? ''}
              onChange={e => setRuleForm(f => ({ ...f, fixedWindowHours: Number(e.target.value) }))}
            />
          )}
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="责任工艺工程师 *"
            value={ruleForm.responsibleProcessEngineer}
            onChange={e => setRuleForm(f => ({ ...f, responsibleProcessEngineer: e.target.value }))}
          />
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="知会质量工程师 *"
            value={ruleForm.responsibleQualityEngineer}
            onChange={e => setRuleForm(f => ({ ...f, responsibleQualityEngineer: e.target.value }))}
          />
        </div>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            onClick={handleSaveRule}
          >
            {editingRuleId ? '保存修改' : '新建规则'}
          </button>
          {editingRuleId && (
            <button
              className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => { setEditingRuleId(null); setRuleForm(emptyRuleForm()); }}
            >
              取消编辑
            </button>
          )}
        </div>

        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-2 px-3">规则名称</th>
              <th className="py-2 px-3">机台</th>
              <th className="py-2 px-3">monitor类型</th>
              <th className="py-2 px-3">时间窗口</th>
              <th className="py-2 px-3">责任人</th>
              <th className="py-2 px-3">状态</th>
              <th className="py-2 px-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(rule => (
              <tr key={rule.id} className="border-b">
                <td className="py-2 px-3">{rule.name}</td>
                <td className="py-2 px-3">{rule.equipmentId}</td>
                <td className="py-2 px-3">{rule.monitorType}</td>
                <td className="py-2 px-3">
                  {rule.timeWindowMode === 'fixed' ? `固定${rule.fixedWindowHours}小时` : '回溯到上次合格'}
                </td>
                <td className="py-2 px-3">{rule.responsibleProcessEngineer} / {rule.responsibleQualityEngineer}</td>
                <td className="py-2 px-3">{rule.enabled ? '启用' : '停用'}</td>
                <td className="py-2 px-3 space-x-2">
                  <button className="text-blue-600 hover:underline" onClick={() => handleEditRule(rule)}>编辑</button>
                  <button className="text-red-600 hover:underline" onClick={() => handleDeleteRule(rule.id)}>删除</button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan={7} className="py-4 px-3 text-center text-gray-400">暂无规则</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* 模拟触发面板：测试用，无真实SPC接入 */}
      <section className="bg-amber-50 border border-amber-200 rounded-lg p-6 space-y-4">
        <h2 className="text-base font-medium text-amber-800">模拟触发（测试用，无真实SPC系统接入）</h2>
        <p className="text-xs text-amber-700">
          这里手填的事件和未来真实SPC系统要调用的是同一个 spcAutoHoldService.handleSpcAbnormalEvent 接口，
          唯一区别是事件来源。
        </p>
        <div className="grid grid-cols-2 gap-4">
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={eventForm.equipmentId}
            onChange={e => setEventForm(f => ({ ...f, equipmentId: e.target.value }))}
          >
            <option value="">选择机台 *</option>
            {equipmentOptions.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="monitor类型 *"
            value={eventForm.monitorType}
            onChange={e => setEventForm(f => ({ ...f, monitorType: e.target.value }))}
          />
          <input
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="参数名"
            value={eventForm.parameterName}
            onChange={e => setEventForm(f => ({ ...f, parameterName: e.target.value }))}
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            value={eventForm.judgeResult}
            onChange={e => setEventForm(f => ({ ...f, judgeResult: e.target.value as 'OOC' | 'OOS' }))}
          >
            <option value="OOC">OOC</option>
            <option value="OOS">OOS</option>
          </select>
          <label className="flex flex-col text-xs text-gray-600 gap-1">
            发生时间
            <input
              type="datetime-local"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              value={eventForm.occurredAt}
              onChange={e => setEventForm(f => ({ ...f, occurredAt: e.target.value }))}
            />
          </label>
          <label className="flex flex-col text-xs text-gray-600 gap-1">
            上次合格时间（回溯到上次合格模式需要）
            <input
              type="datetime-local"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              value={eventForm.lastPassedAt}
              onChange={e => setEventForm(f => ({ ...f, lastPassedAt: e.target.value }))}
            />
          </label>
        </div>
        <button
          className="px-4 py-2 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
          onClick={handleSimulateTrigger}
        >
          模拟触发
        </button>
      </section>

      {/* 最近触发记录 */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-base font-medium text-gray-800 mb-3">最近触发记录</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-2 px-3">时间</th>
              <th className="py-2 px-3">规则</th>
              <th className="py-2 px-3">命中批次数</th>
              <th className="py-2 px-3">结果</th>
              <th className="py-2 px-3">工单</th>
            </tr>
          </thead>
          <tbody>
            {[...executionRecords].reverse().map(record => (
              <tr key={record.id} className="border-b">
                <td className="py-2 px-3">{new Date(record.executedAt).toLocaleString()}</td>
                <td className="py-2 px-3">{rules.find(r => r.id === record.ruleId)?.name ?? record.ruleId}</td>
                <td className="py-2 px-3">{record.matchedBatchIds.length}</td>
                <td className="py-2 px-3">{record.result}</td>
                <td className="py-2 px-3">
                  {record.workOrderId ?? '—'}
                  {record.workOrderCreationFailed && <span className="text-red-600 ml-1">（生成失败）</span>}
                </td>
              </tr>
            ))}
            {executionRecords.length === 0 && (
              <tr><td colSpan={5} className="py-4 px-3 text-center text-gray-400">暂无触发记录</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default SpcAutoHoldRulesModule;
```

- [ ] **Step 2: `npm run dev` 手动验证**

（挂载点在 Task 18 完成后才能通过菜单访问，这一步先确认组件本身不报错：可以临时在 `src/App.tsx` 里加一行 `console.log` 或直接跳到 Task 18 一起验证。）

- [ ] **Step 3: Commit**

```bash
git add src/components/SpcAutoHoldRules/SpcAutoHoldRulesModule.tsx
git commit -m "feat(spc-auto-hold): add rule management page with simulate-trigger panel

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 18: 挂载新页面到菜单和路由

**Files:**
- Modify: `src/config/menuConfig.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `SpcAutoHoldRulesModule`（Task 17）
- Produces: 菜单项 `spc-auto-hold-rules`，供用户从"生产管理 > 在制品管理"下点击进入

- [ ] **Step 1: `menuConfig.ts` 新增菜单项**

打开 [menuConfig.ts](../../../src/config/menuConfig.ts)，在"在制品管理"子菜单（约第 57-61 行）里，`batch-hold-search` 后面新增一项：

```ts
        subItems: [
          { id: 'fragment-management', label: '批次作业', icon: AlertTriangle },
          { id: 'batch-hold-search', label: '批次检索批量HOLD/解锁', icon: Lock },
          { id: 'spc-auto-hold-rules', label: 'SPC自动Hold规则', icon: ShieldAlert },
          { id: 'e-card', label: '批次流水卡', icon: FileText, href: 'https://oqkq2dgk7v34erk4eiqymb4jq.bolt.host' },
```

（`ShieldAlert` 已经在文件顶部的 `lucide-react` import 列表里，见 [menuConfig.ts:22](../../../src/config/menuConfig.ts#L22)，不需要新增 import。）

- [ ] **Step 2: `App.tsx` 新增路由分支**

打开 [App.tsx](../../../src/App.tsx)，在顶部 import 区（`BatchHoldSearchModule` 那一行附近）新增：

```ts
import SpcAutoHoldRulesModule from './components/SpcAutoHoldRules/SpcAutoHoldRulesModule';
```

在 `switch (activeSubModule)` 里，`batch-hold-search` 分支后新增：

```tsx
      case 'batch-hold-search':
        return <BatchHoldSearchModule />;
      case 'spc-auto-hold-rules':
        return <SpcAutoHoldRulesModule />;
```

- [ ] **Step 3: `npm run dev` 手动验证**

启动开发服务器，左侧菜单"生产管理 > 在制品管理"下应该能看到新增的"SPC自动Hold规则"入口。点进去：
1. 新建一条规则（机台选一个真实存在的机台编码、monitor类型填 `metal-ion`、固定周期 8 小时、填两个责任人姓名），保存后应出现在规则列表里；
2. 在"模拟触发"面板填同样的机台+monitor类型，判异结果选 `OOC`，点"模拟触发"；
3. "最近触发记录"表格应该出现一条新记录，结果列显示 `holdApplied` 或 `noBatchesMatched`（取决于该机台在过去 8 小时内 mock 数据里是否恰好有出站履历——种子数据默认没有任何 `EquipmentPassEvent`，所以第一次很可能是 `noBatchesMatched`，这是预期行为，不是 bug）；
4. 若想验证 `holdApplied` 路径：先去"批次作业"选一个批次点"出站确认"产生一条真实的 `EquipmentPassEvent`，记下它的机台编码，再回到规则页用同一个机台配置规则并模拟触发，这次应该能看到 `holdApplied` 且命中批次数大于 0，同时去"批次检索批量HOLD/解锁"页面能看到对应批次处于 Hold 状态。

- [ ] **Step 4: Commit**

```bash
git add src/config/menuConfig.ts src/App.tsx
git commit -m "feat(spc-auto-hold): mount rule management page into menu and routing

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## 计划完成后的验证清单

- [ ] `npx tsc --noEmit -p tsconfig.app.json 2>&1 | wc -l` 相对基线（1454 行）没有新增错误（预期会因为 Task 2 的接线修复而略微减少）
- [ ] `npm run test` 全量通过（新增的十余个测试文件 + 阶段①②遗留的 4 个文件全部绿）
- [ ] `npm run dev` 手动走一遍 Task 5 Step 6、Task 7 Step 3、Task 9 Step 2、Task 18 Step 3 的完整验证清单
- [ ] 确认 `SplitBatchForm.tsx`、`AccumulateBatchForm.tsx`、`CombineTrayBatchForm.tsx`、`CancelDefectEntryForm.tsx`、`DefectEntryForm.tsx` 里除本计划已修的 `SplitBatchForm.tsx` 外，其余几处 `onConfirmTransfer`/`onReorganizationStateChange` 命名不一致的既有问题按计划约定保持不动，不在本轮范围内
