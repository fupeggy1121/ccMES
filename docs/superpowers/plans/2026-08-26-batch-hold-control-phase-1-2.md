# 批量Hold/Release（阶段①②）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 BatchOperations 模块内实现批量Hold/Release核心能力（阶段①），并新增一个"批次检索批量HOLD/解锁"页面（阶段②），让工艺/质量工程师能够勾选多个批次批量扣留、按机台/晶棒+出站时间范围检索批次一键批量HOLD、以及按产品分类/客户/料号筛选后批量解锁。

**Architecture:** 新建一个跨模块共享的 `src/services/batchHold/` 领域服务（`HoldRecord` 数据模型 + `batchHoldService`），它在 `BatchData.isHold` 之上维护结构化的扣留记录（谁、何时、为何、来源）；服务的底层写操作通过在既有 `mockBatchService`/`batchApiService` 上新增 `holdBatches`/`releaseBatches` 方法完成，保持与项目现有的 mock/真实API切换约定一致。UI 侧沿用项目现有的 Tailwind + 原生 HTML 风格，不引入新 UI 库。

**Tech Stack:** React 18 + TypeScript + Vite；Tailwind CSS；无既有测试框架（本计划新增 vitest 仅用于纯逻辑单元测试，UI 改动通过 `npm run dev` 手动验证，与项目现状一致）。

**Spec:** [docs/superpowers/specs/2026-08-26-batch-hold-control-design.md](../specs/2026-08-26-batch-hold-control-design.md)

## Global Constraints

- 不引入新的 UI 组件库（不使用 antd，虽然它是项目依赖之一，但 `BatchOperations` 模块内现有代码全部是原生 HTML + Tailwind className，本计划严格沿用这一风格）。
- 不做真实的多级审批工作流（Release 只要求一个必填的 `releaseApprovalComment` 文本字段），不做真实 RBAC 校验（与项目现状一致）。
- "工程异常反馈"通知：本轮只落一条结构化记录（Hold时手动指定的责任工艺工程师/知会质量工程师，存在 `HoldRecord` 上），不新建真实的邮件/短信/系统消息发送通道——真实发送方式和按机台/工序自动匹配责任人（阶段③b）留待后续。
- mock 服务一律遵循 `mockBatchService.ts` 现有约定：模块内内存变量 + `await delay()` 模拟异步；新写方法需要在 `_realBatchApiService` 中补一个对应的真实API占位实现，保持接口对齐（即便当前 `USE_MOCK_DATA=true` 用不到）。
- 新增/修改的 TypeScript 类型字段一律加中文行内注释，标注"新增：xxx"，与 `types.ts` 现有注释风格一致。
- 已知边界（来自 spec，需在代码注释中体现）：MES 无法获知 ERP 真实发货状态；本计划用 `status === '已出站'` 作为"已入成品库"的简化判断依据，这是一个明确标注的简化，不是真实的成品库集成。

---

## Task 1: 安装并配置 vitest 测试基础设施

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

**Interfaces:**
- Consumes: 无
- Produces: `npm run test`（对应 `vitest run`）、`npm run test:watch`（对应 `vitest`）供后续所有带单测的任务使用

- [ ] **Step 1: 安装 vitest**

Run: `npm install -D vitest`

- [ ] **Step 2: 新增 vitest 配置文件**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 3: 在 package.json 增加测试脚本**

在 `"scripts"` 对象里，`"lint": "eslint ."` 这一行后面新增两行：

```json
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 4: 验证 vitest 可以运行（此时应无测试文件，报 "No test files found"）**

Run: `npm run test`
Expected: 输出包含 `No test files found`，命令以非零状态退出属预期（后续任务补充测试文件后会变为正常通过）。

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest for unit testing batch hold service logic

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: 扩展 BatchData 类型（出站时间/客户/产品分类）并补种子数据

**Files:**
- Modify: `src/components/BatchOperations/types.ts`
- Modify: `src/components/BatchOperations/data/batches.ts`
- Test: `src/components/BatchOperations/services/mockBatchService.outstation.test.ts`

**Interfaces:**
- Produces: `BatchData.lastOutstationAt?: string`（ISO时间戳）、`BatchData.customerName?: string`、`BatchData.productCategory?: '测试片' | '正片' | '重掺片'`，供 Task 3（`confirmOutstation` 写入时间戳）和 Task 11/12（检索/解锁页面按这些字段筛选）使用。

- [ ] **Step 1: 写失败的测试（验证 `confirmOutstation` 会写入 `lastOutstationAt`，此时类型和实现都还没有这个字段）**

```ts
// src/components/BatchOperations/services/mockBatchService.outstation.test.ts
import { describe, it, expect } from 'vitest';
import { mockBatchService } from './mockBatchService';

describe('mockBatchService.confirmOutstation', () => {
  it('stamps lastOutstationAt on the batch when outstation is confirmed', async () => {
    const batches = await mockBatchService.listBatches();
    const target = batches[0];

    await mockBatchService.confirmOutstation(target.id, {});

    const updated = (await mockBatchService.listBatches()).find(b => b.id === target.id);
    expect(updated?.lastOutstationAt).toBeTruthy();
    expect(new Date(updated!.lastOutstationAt as string).toString()).not.toBe('Invalid Date');
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run src/components/BatchOperations/services/mockBatchService.outstation.test.ts`
Expected: FAIL（`updated?.lastOutstationAt` 为 `undefined`，因为字段和写入逻辑都还不存在）

- [ ] **Step 3: 在 types.ts 的 `BatchData` 接口末尾（`ledgerCode?` 字段后）新增三个字段**

在 [types.ts](../../../src/components/BatchOperations/types.ts) 中，把：

```ts
  defectDisposal?: '返工' | '报废' | '残值回收'; // 不良处置
  ledgerCode?: string; // 台账号（进站设备编号-设备总炉次-备件生命周期炉次）
}
```

改为：

```ts
  defectDisposal?: '返工' | '报废' | '残值回收'; // 不良处置
  ledgerCode?: string; // 台账号（进站设备编号-设备总炉次-备件生命周期炉次）
  lastOutstationAt?: string; // 新增：最近一次出站确认时间（ISO字符串），供批次检索按出站时间范围筛选
  customerName?: string; // 新增：客户名称，供批量解锁按客户筛选
  productCategory?: '测试片' | '正片' | '重掺片'; // 新增：产品分类，供批量解锁按分类筛选
}
```

- [ ] **Step 4: 在 mockBatchService.ts 的 `confirmOutstation` 中写入 `lastOutstationAt`**

在 [mockBatchService.ts](../../../src/components/BatchOperations/services/mockBatchService.ts) 中，把：

```ts
  /** 出站确认 */
  confirmOutstation: async (batchId: string, _payload: any) => {
    await delay();
    const idx = _batches.findIndex(b => b.id === batchId);
    if (idx !== -1) _batches[idx] = { ..._batches[idx], status: '已出站' };
    _addHistory(batchId, '出站确认');
    return { success: true };
  },
```

改为：

```ts
  /** 出站确认 */
  confirmOutstation: async (batchId: string, _payload: any) => {
    await delay();
    const idx = _batches.findIndex(b => b.id === batchId);
    if (idx !== -1) {
      _batches[idx] = { ..._batches[idx], status: '已出站', lastOutstationAt: new Date().toISOString() };
    }
    _addHistory(batchId, '出站确认');
    return { success: true };
  },
```

- [ ] **Step 5: 运行测试，确认通过**

Run: `npx vitest run src/components/BatchOperations/services/mockBatchService.outstation.test.ts`
Expected: PASS

- [ ] **Step 6: 给种子数据补充 `lastOutstationAt`/`customerName`/`productCategory`（不逐条手改，用 `.map` 派生，避免大范围改动已有约479行的字面量数组）**

在 [batches.ts](../../../src/components/BatchOperations/data/batches.ts) 顶部，把：

```ts
import { BatchData } from '../types';

export const batchList: BatchData[] = [
```

改为：

```ts
import { BatchData } from '../types';

// 新增：用于派生 customerName / productCategory 演示数据的取值池
const CUSTOMER_POOL = ['客户A', '客户B', '客户C'];
const CATEGORY_POOL: NonNullable<BatchData['productCategory']>[] = ['正片', '测试片', '重掺片'];

const _rawBatchList: BatchData[] = [
```

在文件末尾，把：

```ts
    isSmallBatch: true,
    isHold: false,
  },
];
```

改为：

```ts
    isSmallBatch: true,
    isHold: false,
  },
];

// 新增：为种子数据派生 lastOutstationAt（仅"已出站"/"待出站"批次，模拟已经过站的批次）、
// customerName、productCategory，供批次检索/批量解锁功能演示筛选效果。
export const batchList: BatchData[] = _rawBatchList.map((b, idx) => ({
  ...b,
  lastOutstationAt:
    b.status === '已出站' || b.status === '待出站'
      ? new Date(Date.UTC(2026, 7, 5 + (idx % 8), 8 + (idx % 10), 30, 0)).toISOString()
      : undefined,
  customerName: CUSTOMER_POOL[idx % CUSTOMER_POOL.length],
  productCategory: CATEGORY_POOL[idx % CATEGORY_POOL.length],
}));
```

- [ ] **Step 7: 跑一遍 TypeScript 编译确认没有类型错误**

Run: `npx tsc --noEmit`
Expected: 无与 `batches.ts`/`types.ts`/`mockBatchService.ts` 相关的报错

- [ ] **Step 8: Commit**

```bash
git add src/components/BatchOperations/types.ts src/components/BatchOperations/data/batches.ts src/components/BatchOperations/services/mockBatchService.ts src/components/BatchOperations/services/mockBatchService.outstation.test.ts
git commit -m "feat(batch-operations): add lastOutstationAt/customerName/productCategory to BatchData

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: mockBatchService / batchApiService 新增批量 Hold/Release 底层写操作

**Files:**
- Modify: `src/components/BatchOperations/services/mockBatchService.ts`
- Modify: `src/components/BatchOperations/services/batchApiService.ts`
- Test: `src/components/BatchOperations/services/mockBatchService.holdRelease.test.ts`

**Interfaces:**
- Produces: `batchApiService.holdBatches(batchIds: string[], reasonText: string): Promise<{success: boolean}>`、`batchApiService.releaseBatches(batchIds: string[]): Promise<{success: boolean}>` —— 供 Task 4 的 `batchHoldService` 调用，负责翻转 `BatchData.isHold`。

- [ ] **Step 1: 写失败的测试**

```ts
// src/components/BatchOperations/services/mockBatchService.holdRelease.test.ts
import { describe, it, expect } from 'vitest';
import { mockBatchService } from './mockBatchService';

describe('mockBatchService.holdBatches / releaseBatches', () => {
  it('holdBatches sets isHold=true on all matched batches', async () => {
    const batches = await mockBatchService.listBatches();
    const ids = [batches[0].id, batches[1].id];

    const result = await mockBatchService.holdBatches(ids, '测试原因');

    expect(result.success).toBe(true);
    const updated = await mockBatchService.listBatches();
    expect(updated.find(b => b.id === ids[0])?.isHold).toBe(true);
    expect(updated.find(b => b.id === ids[1])?.isHold).toBe(true);
  });

  it('releaseBatches sets isHold=false on all matched batches', async () => {
    const batches = await mockBatchService.listBatches();
    const id = batches[2].id;
    await mockBatchService.holdBatches([id], '测试原因');

    const result = await mockBatchService.releaseBatches([id]);

    expect(result.success).toBe(true);
    const updated = await mockBatchService.listBatches();
    expect(updated.find(b => b.id === id)?.isHold).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run src/components/BatchOperations/services/mockBatchService.holdRelease.test.ts`
Expected: FAIL（`mockBatchService.holdBatches is not a function`）

- [ ] **Step 3: 在 mockBatchService.ts 里新增两个方法（放在 `confirmMerge` 之后）**

在 [mockBatchService.ts](../../../src/components/BatchOperations/services/mockBatchService.ts) 中，把：

```ts
  /** 并批确认 */
  confirmMerge: async (payload: any) => {
    await delay();
    _addHistory(payload.batchId, '并批');
    return { success: true };
  },
```

改为：

```ts
  /** 并批确认 */
  confirmMerge: async (payload: any) => {
    await delay();
    _addHistory(payload.batchId, '并批');
    return { success: true };
  },

  /** 批量扣留（底层写操作：直接翻转 isHold，不感知 HoldRecord 结构，供上层 batchHoldService 调用） */
  holdBatches: async (batchIds: string[], reasonText: string): Promise<{ success: boolean }> => {
    await delay();
    _batches = _batches.map(b => (batchIds.includes(b.id) ? { ...b, isHold: true } : b));
    batchIds.forEach(id => _addHistory(id, `批量扣留：${reasonText}`));
    return { success: true };
  },

  /** 批量释放（底层写操作：直接翻转 isHold） */
  releaseBatches: async (batchIds: string[]): Promise<{ success: boolean }> => {
    await delay();
    _batches = _batches.map(b => (batchIds.includes(b.id) ? { ...b, isHold: false } : b));
    batchIds.forEach(id => _addHistory(id, '批量释放'));
    return { success: true };
  },
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npx vitest run src/components/BatchOperations/services/mockBatchService.holdRelease.test.ts`
Expected: PASS

- [ ] **Step 5: 在 `_realBatchApiService` 里补齐对应的真实API占位方法（保持接口对齐，即便当前用不到）**

在 [batchApiService.ts](../../../src/components/BatchOperations/services/batchApiService.ts) 中，把：

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
  confirmMerge: (payload: any) =>
    request('/confirm-merge', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * 批量扣留
   */
  holdBatches: (batchIds: string[], reasonText: string) =>
    request('/batch/hold-batches', {
      method: 'POST',
      body: JSON.stringify({ batchIds, reasonText }),
    }),

  /**
   * 批量释放
   */
  releaseBatches: (batchIds: string[]) =>
    request('/batch/release-batches', {
      method: 'POST',
      body: JSON.stringify({ batchIds }),
    }),
```

- [ ] **Step 6: 跑一遍 TypeScript 编译确认没有类型错误**

Run: `npx tsc --noEmit`
Expected: 无报错

- [ ] **Step 7: Commit**

```bash
git add src/components/BatchOperations/services/mockBatchService.ts src/components/BatchOperations/services/batchApiService.ts src/components/BatchOperations/services/mockBatchService.holdRelease.test.ts
git commit -m "feat(batch-operations): add holdBatches/releaseBatches to batch API service

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: 新建共享 BatchHold 领域服务（HoldRecord 数据模型 + 业务编排）

**Files:**
- Create: `src/services/batchHold/types.ts`
- Create: `src/services/batchHold/batchHoldService.ts`
- Test: `src/services/batchHold/batchHoldService.test.ts`

**Interfaces:**
- Consumes: `batchApiService.listBatches()`、`batchApiService.holdBatches(batchIds, reasonText)`、`batchApiService.releaseBatches(batchIds)`（Task 3 产出）
- Produces:
  - `HoldRecord`、`HoldReasonCategory`、`HoldBatchesReason` 类型
  - `batchHoldService.holdBatches(batchIds: string[], reason: HoldBatchesReason, operator: string): Promise<HoldRecord[]>`
  - `batchHoldService.releaseBatches(batchIds: string[], approvalComment: string, operator: string): Promise<HoldRecord[]>`
  - `batchHoldService.listHoldRecords(batchId: string): Promise<HoldRecord[]>`
  - `batchHoldService.listActiveHoldRecords(): Promise<HoldRecord[]>`
  - `__resetBatchHoldServiceForTests()`（仅测试使用）

  供 Task 8（BatchHoldModal）、Task 9（BatchReleaseModal）、Task 12（批量解锁列表）调用。

- [ ] **Step 1: 新建类型文件**

```ts
// src/services/batchHold/types.ts

export type HoldReasonCategory = 'SPC异常' | '客户投诉' | '辅料问题' | '其他';

export interface HoldRecord {
  id: string;
  batchId: string;
  batchCode: string;
  station: string;
  quantity: number;
  holdSource: 'manual' | 'ocap-auto';
  holdReasonCategory: HoldReasonCategory;
  holdReasonText: string;
  relatedOcapWorkOrderId?: string;
  relatedRuleId?: string;
  triggeredByEquipment?: string;
  triggeredTimeWindow?: { start: string; end: string };
  status: 'holding' | 'released';
  holdAt: string;
  holdBy: string;
  releaseAt?: string;
  releaseBy?: string;
  releaseApprovalComment?: string;
  /** 新增："工程异常反馈"通知的责任工艺工程师（结构化记录，不触发真实发送） */
  notifiedProcessEngineer?: string;
  /** 新增：知会质量工程师（结构化记录，不触发真实发送） */
  notifiedQualityEngineer?: string;
}

export interface HoldBatchesReason {
  category: HoldReasonCategory;
  text: string;
  source: 'manual' | 'ocap-auto';
  relatedOcapWorkOrderId?: string;
  relatedRuleId?: string;
  triggeredByEquipment?: string;
  triggeredTimeWindow?: { start: string; end: string };
  notifiedProcessEngineer?: string;
  notifiedQualityEngineer?: string;
}

export interface BatchHoldService {
  holdBatches(batchIds: string[], reason: HoldBatchesReason, operator: string): Promise<HoldRecord[]>;
  releaseBatches(batchIds: string[], approvalComment: string, operator: string): Promise<HoldRecord[]>;
  listHoldRecords(batchId: string): Promise<HoldRecord[]>;
  listActiveHoldRecords(): Promise<HoldRecord[]>;
}
```

- [ ] **Step 2: 写失败的测试**

```ts
// src/services/batchHold/batchHoldService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { batchHoldService, __resetBatchHoldServiceForTests } from './batchHoldService';
import { batchApiService } from '../../components/BatchOperations/services/batchApiService';

describe('batchHoldService', () => {
  beforeEach(() => {
    __resetBatchHoldServiceForTests();
  });

  it('holdBatches creates a holding record and sets BatchData.isHold to true', async () => {
    const batches = await batchApiService.listBatches();
    const targetId = batches[0].id;

    const created = await batchHoldService.holdBatches(
      [targetId],
      { category: 'SPC异常', text: '测试扣留', source: 'manual', notifiedProcessEngineer: '张伟', notifiedQualityEngineer: '李娜' },
      'tester'
    );

    expect(created).toHaveLength(1);
    expect(created[0].status).toBe('holding');
    expect(created[0].batchId).toBe(targetId);
    expect(created[0].batchCode).toBe(batches[0].batchCode);
    expect(created[0].notifiedProcessEngineer).toBe('张伟');
    expect(created[0].notifiedQualityEngineer).toBe('李娜');

    const updated = (await batchApiService.listBatches()).find(b => b.id === targetId);
    expect(updated?.isHold).toBe(true);
  });

  it('releaseBatches marks the active record released and clears BatchData.isHold', async () => {
    const batches = await batchApiService.listBatches();
    const targetId = batches[1].id;
    await batchHoldService.holdBatches([targetId], { category: '其他', text: '测试', source: 'manual' }, 'tester');

    const released = await batchHoldService.releaseBatches([targetId], '会议决议：风险已排除', 'reviewer');

    expect(released).toHaveLength(1);
    expect(released[0].status).toBe('released');
    expect(released[0].releaseApprovalComment).toBe('会议决议：风险已排除');
    expect(released[0].releaseBy).toBe('reviewer');

    const updated = (await batchApiService.listBatches()).find(b => b.id === targetId);
    expect(updated?.isHold).toBe(false);
  });

  it('releaseBatches on a batch with no active hold records is a no-op', async () => {
    const batches = await batchApiService.listBatches();
    const targetId = batches[3].id;

    const released = await batchHoldService.releaseBatches([targetId], '无意义', 'tester');

    expect(released).toHaveLength(0);
  });

  it('listActiveHoldRecords only returns records with status holding', async () => {
    const batches = await batchApiService.listBatches();
    const [a, b] = batches;
    await batchHoldService.holdBatches([a.id], { category: '其他', text: 'A', source: 'manual' }, 'tester');
    await batchHoldService.holdBatches([b.id], { category: '其他', text: 'B', source: 'manual' }, 'tester');
    await batchHoldService.releaseBatches([a.id], '解除', 'tester');

    const active = await batchHoldService.listActiveHoldRecords();
    expect(active.map(r => r.batchId)).toEqual([b.id]);
  });
});
```

- [ ] **Step 3: 运行测试，确认失败**

Run: `npx vitest run src/services/batchHold/batchHoldService.test.ts`
Expected: FAIL（`batchHoldService.ts` 尚不存在，报模块找不到）

- [ ] **Step 4: 实现 batchHoldService**

```ts
// src/services/batchHold/batchHoldService.ts
import { BatchData } from '../../components/BatchOperations/types';
import { batchApiService } from '../../components/BatchOperations/services/batchApiService';
import { BatchHoldService, HoldBatchesReason, HoldRecord } from './types';

let _holdRecords: HoldRecord[] = [];
let _seq = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${_seq++}`;

async function resolveBatchMeta(batchId: string): Promise<BatchData | undefined> {
  const batches = await batchApiService.listBatches();
  return batches.find(b => b.id === batchId);
}

export const batchHoldService: BatchHoldService = {
  async holdBatches(batchIds, reason, operator) {
    const created: HoldRecord[] = [];
    for (const batchId of batchIds) {
      const batch = await resolveBatchMeta(batchId);
      if (!batch) continue;
      const record: HoldRecord = {
        id: nextId('hold'),
        batchId,
        batchCode: batch.batchCode,
        station: batch.station,
        quantity: batch.totalQty,
        holdSource: reason.source,
        holdReasonCategory: reason.category,
        holdReasonText: reason.text,
        relatedOcapWorkOrderId: reason.relatedOcapWorkOrderId,
        relatedRuleId: reason.relatedRuleId,
        triggeredByEquipment: reason.triggeredByEquipment,
        triggeredTimeWindow: reason.triggeredTimeWindow,
        status: 'holding',
        holdAt: new Date().toISOString(),
        holdBy: operator,
        notifiedProcessEngineer: reason.notifiedProcessEngineer,
        notifiedQualityEngineer: reason.notifiedQualityEngineer,
      };
      _holdRecords.push(record);
      created.push(record);
    }
    if (created.length > 0) {
      await batchApiService.holdBatches(created.map(r => r.batchId), reason.text);
    }
    return created;
  },

  async releaseBatches(batchIds, approvalComment, operator) {
    const releasedNow: HoldRecord[] = [];
    const batchIdsToClearFlag: string[] = [];
    const releaseAt = new Date().toISOString();

    for (const batchId of batchIds) {
      const hasActive = _holdRecords.some(r => r.batchId === batchId && r.status === 'holding');
      if (!hasActive) continue;
      batchIdsToClearFlag.push(batchId);
    }

    _holdRecords = _holdRecords.map(r => {
      if (batchIdsToClearFlag.includes(r.batchId) && r.status === 'holding') {
        const updated: HoldRecord = {
          ...r,
          status: 'released',
          releaseAt,
          releaseBy: operator,
          releaseApprovalComment: approvalComment,
        };
        releasedNow.push(updated);
        return updated;
      }
      return r;
    });

    if (batchIdsToClearFlag.length > 0) {
      await batchApiService.releaseBatches(batchIdsToClearFlag);
    }
    return releasedNow;
  },

  async listHoldRecords(batchId) {
    return _holdRecords.filter(r => r.batchId === batchId);
  },

  async listActiveHoldRecords() {
    return _holdRecords.filter(r => r.status === 'holding');
  },
};

/** 仅供测试使用：重置模块内内存状态，避免测试间互相污染 */
export function __resetBatchHoldServiceForTests() {
  _holdRecords = [];
  _seq = 0;
}
```

- [ ] **Step 5: 运行测试，确认通过**

Run: `npx vitest run src/services/batchHold/batchHoldService.test.ts`
Expected: PASS（4 个用例全部通过）

- [ ] **Step 6: 跑一遍 TypeScript 编译确认没有类型错误**

Run: `npx tsc --noEmit`
Expected: 无报错

- [ ] **Step 7: Commit**

```bash
git add src/services/batchHold
git commit -m "feat(batch-hold): add shared batchHoldService with HoldRecord domain model

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: CSV 导出工具函数

**Files:**
- Create: `src/components/BatchOperations/utils/csvExport.ts`
- Test: `src/components/BatchOperations/utils/csvExport.test.ts`

**Interfaces:**
- Produces: `buildCsvContent<T>(rows: T[], columns: { key: keyof T; label: string }[]): string`、`downloadCsv(filename: string, content: string): void` —— 供 Task 11（检索结果导出）使用。

- [ ] **Step 1: 写失败的测试（只测试纯函数 `buildCsvContent`，`downloadCsv` 依赖浏览器 DOM，不在 vitest node 环境下测试，留给 Task 11 手动验证）**

```ts
// src/components/BatchOperations/utils/csvExport.test.ts
import { describe, it, expect } from 'vitest';
import { buildCsvContent } from './csvExport';

describe('buildCsvContent', () => {
  it('builds a CSV string with header row and escaped values', () => {
    const rows = [
      { batchCode: 'BATCH001', equipmentName: 'AP01', qty: 100 },
      { batchCode: 'BATCH,002', equipmentName: 'AP02', qty: 50 },
    ];
    const csv = buildCsvContent(rows, [
      { key: 'batchCode', label: '批次编码' },
      { key: 'equipmentName', label: '机台' },
      { key: 'qty', label: '数量' },
    ]);

    const lines = csv.split('\n');
    expect(lines[0]).toBe('批次编码,机台,数量');
    expect(lines[1]).toBe('BATCH001,AP01,100');
    expect(lines[2]).toBe('"BATCH,002",AP02,50');
  });

  it('returns just the header row when rows is empty', () => {
    const csv = buildCsvContent([], [{ key: 'batchCode', label: '批次编码' }]);
    expect(csv).toBe('批次编码');
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx vitest run src/components/BatchOperations/utils/csvExport.test.ts`
Expected: FAIL（`csvExport.ts` 不存在）

- [ ] **Step 3: 实现工具函数**

```ts
// src/components/BatchOperations/utils/csvExport.ts

interface CsvColumn<T> {
  key: keyof T;
  label: string;
}

/** 将字段值转为 CSV 安全的字符串：含逗号/引号/换行时用双引号包裹并转义内部引号 */
function escapeCsvValue(value: unknown): string {
  const str = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** 根据行数据和列定义生成 CSV 文本内容（含表头，不含 BOM） */
export function buildCsvContent<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map(c => escapeCsvValue(c.label)).join(',');
  const lines = rows.map(row => columns.map(c => escapeCsvValue(row[c.key])).join(','));
  return [header, ...lines].join('\n');
}

/** 触发浏览器下载一个 CSV 文件（前端生成，无需后端） */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([`﻿${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npx vitest run src/components/BatchOperations/utils/csvExport.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/BatchOperations/utils/csvExport.ts src/components/BatchOperations/utils/csvExport.test.ts
git commit -m "feat(batch-operations): add CSV export utility for batch search results

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: MasterBatchTable 增加批次多选（checkbox列）+ Hold徽标

**Files:**
- Modify: `src/components/BatchOperations/components/MasterBatchTable.tsx`

**Interfaces:**
- Consumes: 无新增外部依赖
- Produces: `MasterBatchTableProps` 新增可选字段 `checkedBatchIds?: string[]`、`onToggleBatchChecked?: (batchId: string) => void`、`onToggleAllChecked?: () => void` —— 供 Task 10（BatchListPage 接入批量勾选）使用。仅当 `onToggleBatchChecked` 存在时才渲染 checkbox 列，避免影响其他潜在调用方。

- [ ] **Step 1: 扩展 props 接口**

在 [MasterBatchTable.tsx](../../../src/components/BatchOperations/components/MasterBatchTable.tsx) 中，把：

```ts
interface MasterBatchTableProps {
  filteredBatchList: BatchData[];
  selectedMasterBatchId: string | null;
  handleMasterRowClick: (batchId: string) => void;
  getStatusColor: (status: string) => string;
  showStatusColumn?: boolean;
  showDefectDisposalColumn?: boolean;
}
```

改为：

```ts
interface MasterBatchTableProps {
  filteredBatchList: BatchData[];
  selectedMasterBatchId: string | null;
  handleMasterRowClick: (batchId: string) => void;
  getStatusColor: (status: string) => string;
  showStatusColumn?: boolean;
  showDefectDisposalColumn?: boolean;
  /** 新增：批量Hold/Release用的批次勾选态，不传时不渲染勾选列 */
  checkedBatchIds?: string[];
  onToggleBatchChecked?: (batchId: string) => void;
  onToggleAllChecked?: () => void;
}
```

- [ ] **Step 2: 解构新 props（带默认值）**

把：

```ts
const MasterBatchTable: React.FC<MasterBatchTableProps> = ({
  filteredBatchList,
  selectedMasterBatchId,
  handleMasterRowClick,
  getStatusColor,
  showStatusColumn = true,
  showDefectDisposalColumn = false,
}) => {
```

改为：

```ts
const MasterBatchTable: React.FC<MasterBatchTableProps> = ({
  filteredBatchList,
  selectedMasterBatchId,
  handleMasterRowClick,
  getStatusColor,
  showStatusColumn = true,
  showDefectDisposalColumn = false,
  checkedBatchIds,
  onToggleBatchChecked,
  onToggleAllChecked,
}) => {
  const showCheckboxColumn = typeof onToggleBatchChecked === 'function';
  const allChecked =
    showCheckboxColumn && filteredBatchList.length > 0 && (checkedBatchIds?.length ?? 0) === filteredBatchList.length;
```

- [ ] **Step 3: 在表头新增勾选列（放在"批次编码"列之前）**

把：

```tsx
          <thead className="sticky top-0 z-10">
            <tr>
              <Th field="batchCode" label="批次编码" filterEl={<FilterInput col="batchCode" placeholder="搜索批次" />} />
```

改为：

```tsx
          <thead className="sticky top-0 z-10">
            <tr>
              {showCheckboxColumn && (
                <th className="px-3 py-2 bg-gray-50 border-b w-8 text-center">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={() => onToggleAllChecked?.()}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label="全选"
                  />
                </th>
              )}
              <Th field="batchCode" label="批次编码" filterEl={<FilterInput col="batchCode" placeholder="搜索批次" />} />
```

- [ ] **Step 4: 在空列表提示行的 `colSpan` 计算中加上勾选列，并在数据行新增勾选单元格 + Hold 徽标**

把：

```tsx
            {processedList.length === 0 ? (
              <tr>
                <td colSpan={showStatusColumn ? (showDefectDisposalColumn ? 10 : 9) : (showDefectDisposalColumn ? 9 : 8)} className="px-4 py-8 text-center text-gray-400 text-sm">
                  无匹配批次
                </td>
              </tr>
            ) : (
              processedList.map(batch => (
                <tr
                  key={batch.id}
                  className={`cursor-pointer transition-colors ${
                    selectedMasterBatchId === batch.id
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleMasterRowClick(batch.id)}
                >
                  <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">{batch.batchCode}</td>
```

改为：

```tsx
            {processedList.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    (showCheckboxColumn ? 1 : 0) +
                    (showStatusColumn ? (showDefectDisposalColumn ? 10 : 9) : (showDefectDisposalColumn ? 9 : 8))
                  }
                  className="px-4 py-8 text-center text-gray-400 text-sm"
                >
                  无匹配批次
                </td>
              </tr>
            ) : (
              processedList.map(batch => (
                <tr
                  key={batch.id}
                  className={`cursor-pointer transition-colors ${
                    selectedMasterBatchId === batch.id
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleMasterRowClick(batch.id)}
                >
                  {showCheckboxColumn && (
                    <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checkedBatchIds?.includes(batch.id) ?? false}
                        onChange={() => onToggleBatchChecked?.(batch.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                  )}
                  <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">
                    {batch.batchCode}
                    {batch.isHold && (
                      <span className="ml-1.5 inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-100 text-red-700">
                        HOLD
                      </span>
                    )}
                  </td>
```

- [ ] **Step 5: 手动验证（此组件当前无自动化测试基础设施，沿用项目现状用 dev server 验证）**

Run: `npm run dev`，浏览器打开对应地址，进入"生产管理 > 在制品管理 > 批次作业"。此时页面还未接入 `checkedBatchIds` 等 props（Task 10 才接入），预期表现：**不出现勾选列**（因为 `onToggleBatchChecked` 未传，`showCheckboxColumn` 为 `false`），页面渲染与改动前完全一致，无报错。

- [ ] **Step 6: 跑一遍 TypeScript 编译确认没有类型错误**

Run: `npx tsc --noEmit`
Expected: 无报错

- [ ] **Step 7: Commit**

```bash
git add src/components/BatchOperations/components/MasterBatchTable.tsx
git commit -m "feat(batch-operations): support optional batch checkbox column and HOLD badge in MasterBatchTable

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: BatchOperationsContext 暴露 fetchBatches

**Files:**
- Modify: `src/components/BatchOperations/contexts/BatchOperationsContext.tsx`

**Interfaces:**
- Produces: `useBatchOperations().fetchBatches: () => Promise<void>` —— 供 Task 10（批量Hold/Release后刷新批次列表）使用。

- [ ] **Step 1: 在 context 类型接口里新增字段**

在 [BatchOperationsContext.tsx](../../../src/components/BatchOperations/contexts/BatchOperationsContext.tsx) 中，把：

```ts
interface BatchOperationsContextType {
  // 状态
  batchList: BatchData[];
  selectedBatch: BatchData | null;
```

改为：

```ts
interface BatchOperationsContextType {
  // 状态
  batchList: BatchData[];
  selectedBatch: BatchData | null;
  /** 新增：重新拉取批次列表，供批量Hold/Release等写操作后刷新数据 */
  fetchBatches: () => Promise<void>;
```

- [ ] **Step 2: 在 Provider 内部的 value 对象里补充这个字段**

`fetchBatches` 已经从 `useBatchData()` 解构出来（见文件第 111-116 行 `const { batchList, isLoading, error, fetchBatches } = useBatchData();`），只是没有放进 `value`。把：

```ts
  const value: BatchOperationsContextType = {
    // 状态
    batchList,
    selectedBatch,
```

改为：

```ts
  const value: BatchOperationsContextType = {
    // 状态
    batchList,
    selectedBatch,
    fetchBatches,
```

- [ ] **Step 3: 手动验证（context 无独立测试基础设施，跟随 Task 10 一起手动验证；此步骤先确认 TypeScript 编译通过）**

Run: `npx tsc --noEmit`
Expected: 无报错

- [ ] **Step 4: Commit**

```bash
git add src/components/BatchOperations/contexts/BatchOperationsContext.tsx
git commit -m "feat(batch-operations): expose fetchBatches via BatchOperationsContext

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: 新建 BatchHoldModal（批量扣留弹窗）

**Files:**
- Create: `src/components/BatchOperations/components/BatchHoldModal.tsx`

**Interfaces:**
- Consumes: `batchHoldService.holdBatches`（Task 4）、`mockOperators`（既有 `src/components/BatchOperations/data/mockOperators.ts`）
- Produces: `<BatchHoldModal isOpen batchIds onClose onConfirmed />` —— 供 Task 10（BatchListPage）、Task 11（检索页一键批量Hold）复用。

- [ ] **Step 1: 实现组件**

```tsx
// src/components/BatchOperations/components/BatchHoldModal.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { batchHoldService } from '../../../services/batchHold/batchHoldService';
import { HoldReasonCategory } from '../../../services/batchHold/types';
import { mockOperators } from '../data/mockOperators';

const REASON_CATEGORIES: HoldReasonCategory[] = ['SPC异常', '客户投诉', '辅料问题', '其他'];

interface BatchHoldModalProps {
  isOpen: boolean;
  batchIds: string[];
  onClose: () => void;
  /** 扣留成功后回调，调用方负责刷新批次列表、清空勾选态等 */
  onConfirmed: () => void;
}

const BatchHoldModal: React.FC<BatchHoldModalProps> = ({ isOpen, batchIds, onClose, onConfirmed }) => {
  const [category, setCategory] = useState<HoldReasonCategory>('SPC异常');
  const [text, setText] = useState('');
  const [processEngineer, setProcessEngineer] = useState(mockOperators[0]?.name || '');
  const [qualityEngineer, setQualityEngineer] = useState(mockOperators[1]?.name || mockOperators[0]?.name || '');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const operator = mockOperators[0]?.name || '当前用户';

  const handleConfirm = async () => {
    if (!text.trim() || !processEngineer) return;
    setSubmitting(true);
    try {
      await batchHoldService.holdBatches(
        batchIds,
        {
          category,
          text: text.trim(),
          source: 'manual',
          notifiedProcessEngineer: processEngineer,
          notifiedQualityEngineer: qualityEngineer || undefined,
        },
        operator
      );
      setText('');
      setCategory('SPC异常');
      onConfirmed();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">批量扣留</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700" aria-label="关闭">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">已选择 <span className="font-semibold text-gray-900">{batchIds.length}</span> 个批次，扣留操作无需审批，将立即生效。</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">扣留原因分类</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as HoldReasonCategory)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {REASON_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">扣留原因说明</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
              placeholder="请输入扣留原因..."
              className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">责任工艺工程师（必填）</label>
              <select
                value={processEngineer}
                onChange={e => setProcessEngineer(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">请选择</option>
                {mockOperators.map(op => (
                  <option key={op.id} value={op.name}>{op.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">知会质量工程师</label>
              <select
                value={qualityEngineer}
                onChange={e => setQualityEngineer(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">不指定</option>
                {mockOperators.map(op => (
                  <option key={op.id} value={op.name}>{op.name}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            操作人：{operator}。确认后将向责任工艺工程师自动生成一条"工程异常反馈"记录（本阶段仅结构化留存，不发送真实通知）。
          </p>
        </div>
        <div className="flex justify-end space-x-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!text.trim() || !processEngineer || submitting}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              text.trim() && processEngineer && !submitting
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? '提交中...' : '确认扣留'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchHoldModal;
```

- [ ] **Step 2: 跑一遍 TypeScript 编译确认没有类型错误**

Run: `npx tsc --noEmit`
Expected: 无报错（此组件此时未被任何页面引用，属正常的孤立新文件，Task 10/11 会接入）

- [ ] **Step 3: Commit**

```bash
git add src/components/BatchOperations/components/BatchHoldModal.tsx
git commit -m "feat(batch-operations): add BatchHoldModal for batch bulk hold

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: 新建 BatchReleaseModal（批量释放弹窗）

**Files:**
- Create: `src/components/BatchOperations/components/BatchReleaseModal.tsx`

**Interfaces:**
- Consumes: `batchHoldService.releaseBatches`（Task 4）、`mockOperators`
- Produces: `<BatchReleaseModal isOpen batchIds onClose onConfirmed />` —— 供 Task 10、Task 12 复用。

- [ ] **Step 1: 实现组件**

```tsx
// src/components/BatchOperations/components/BatchReleaseModal.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { batchHoldService } from '../../../services/batchHold/batchHoldService';
import { mockOperators } from '../data/mockOperators';

interface BatchReleaseModalProps {
  isOpen: boolean;
  batchIds: string[];
  onClose: () => void;
  /** 释放成功后回调，调用方负责刷新数据、清空勾选态等 */
  onConfirmed: () => void;
}

const BatchReleaseModal: React.FC<BatchReleaseModalProps> = ({ isOpen, batchIds, onClose, onConfirmed }) => {
  const [approvalComment, setApprovalComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const operator = mockOperators[0]?.name || '当前用户';

  const handleConfirm = async () => {
    if (!approvalComment.trim()) return;
    setSubmitting(true);
    try {
      await batchHoldService.releaseBatches(batchIds, approvalComment.trim(), operator);
      setApprovalComment('');
      onConfirmed();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">批量释放</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700" aria-label="关闭">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">已选择 <span className="font-semibold text-gray-900">{batchIds.length}</span> 个批次。释放需填写审批意见/依据（如会议决议内容）。</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">审批意见 / 决议依据（必填）</label>
            <textarea
              value={approvalComment}
              onChange={e => setApprovalComment(e.target.value)}
              rows={4}
              placeholder="请输入审批意见，例如：8.20质量评审会决议，风险已排除..."
              className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <p className="text-xs text-gray-400">操作人：{operator}</p>
        </div>
        <div className="flex justify-end space-x-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!approvalComment.trim() || submitting}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              approvalComment.trim() && !submitting
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? '提交中...' : '确认释放'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchReleaseModal;
```

- [ ] **Step 2: 跑一遍 TypeScript 编译确认没有类型错误**

Run: `npx tsc --noEmit`
Expected: 无报错

- [ ] **Step 3: Commit**

```bash
git add src/components/BatchOperations/components/BatchReleaseModal.tsx
git commit -m "feat(batch-operations): add BatchReleaseModal for batch bulk release

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 10: BatchListPage 接入批量勾选 + 状态筛选下拉 + 批量扣留/释放按钮

**Files:**
- Modify: `src/components/BatchOperations/components/BatchListPage.tsx`

**Interfaces:**
- Consumes: `MasterBatchTable` 的 `checkedBatchIds`/`onToggleBatchChecked`/`onToggleAllChecked`（Task 6）、`BatchHoldModal`/`BatchReleaseModal`（Task 8/9）、`useBatchOperations().fetchBatches`（Task 7）

- [ ] **Step 1: 引入新组件、新增勾选态和弹窗开关 state**

在 [BatchListPage.tsx](../../../src/components/BatchOperations/components/BatchListPage.tsx) 中，把：

```tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useBatchOperations } from '../contexts/BatchOperationsContext';
import FinalSortingOverviewModal from './FinalSortingOverviewModal';
import MasterBatchTable from './MasterBatchTable';
import SubBatchTable from './SubBatchTable';
import { Clock, BookOpen } from 'lucide-react';
```

改为：

```tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useBatchOperations } from '../contexts/BatchOperationsContext';
import FinalSortingOverviewModal from './FinalSortingOverviewModal';
import MasterBatchTable from './MasterBatchTable';
import SubBatchTable from './SubBatchTable';
import BatchHoldModal from './BatchHoldModal';
import BatchReleaseModal from './BatchReleaseModal';
import { Clock, BookOpen } from 'lucide-react';
```

把：

```tsx
  const {
    batchList,
    selectedBatch,
    fetchAggregatedWaferData,
    aggregatedWafersForOverview,
    isAggregatedDataLoading,
    allStations, // 新增：从上下文获取站点数据
    setIsDocumentationModalOpen,
    setCurrentFormType,
    setSelectedBatch,
  } = useBatchOperations();

  // 状态管理
  const [selectedMasterBatchId, setSelectedMasterBatchId] = useState<string | null>(null);
  const [checkedSubBatchIds, setCheckedSubBatchIds] = useState<string[]>([]);
```

改为：

```tsx
  const {
    batchList,
    selectedBatch,
    fetchAggregatedWaferData,
    aggregatedWafersForOverview,
    isAggregatedDataLoading,
    allStations, // 新增：从上下文获取站点数据
    setIsDocumentationModalOpen,
    setCurrentFormType,
    setSelectedBatch,
    fetchBatches, // 新增：批量Hold/Release后刷新批次列表
  } = useBatchOperations();

  // 状态管理
  const [selectedMasterBatchId, setSelectedMasterBatchId] = useState<string | null>(null);
  const [checkedSubBatchIds, setCheckedSubBatchIds] = useState<string[]>([]);
  // 新增：批量Hold/Release用的主批次多选态与弹窗开关
  const [checkedMasterBatchIds, setCheckedMasterBatchIds] = useState<string[]>([]);
  const [isBatchHoldModalOpen, setIsBatchHoldModalOpen] = useState(false);
  const [isBatchReleaseModalOpen, setIsBatchReleaseModalOpen] = useState(false);
```

- [ ] **Step 2: 新增勾选处理函数（放在 `handleTabSwitch` 之后、`handleMasterRowClick` 之前）**

把：

```tsx
  // 处理标签页切换
  const handleTabSwitch = (tab: 'inProcess' | 'temporary') => {
    setActiveTab(tab);
    // 切换标签页时重置选择
    setSelectedMasterBatchId(null);
    setDisplayedSubBatches([]);
    setCheckedSubBatchIds([]);
  };
```

改为：

```tsx
  // 处理标签页切换
  const handleTabSwitch = (tab: 'inProcess' | 'temporary') => {
    setActiveTab(tab);
    // 切换标签页时重置选择
    setSelectedMasterBatchId(null);
    setDisplayedSubBatches([]);
    setCheckedSubBatchIds([]);
    setCheckedMasterBatchIds([]);
  };

  // 新增：切换单个主批次的批量Hold勾选态
  const handleToggleMasterBatchChecked = (batchId: string) => {
    setCheckedMasterBatchIds(prev =>
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    );
  };

  // 新增：全选/取消全选当前列表的主批次
  const handleToggleAllMasterBatchesChecked = () => {
    if (checkedMasterBatchIds.length === currentBatchList.length) {
      setCheckedMasterBatchIds([]);
    } else {
      setCheckedMasterBatchIds(currentBatchList.map(b => b.id));
    }
  };

  // 新增：批量Hold/Release弹窗确认后的公共收尾逻辑
  const handleBatchHoldOrReleaseConfirmed = async () => {
    setIsBatchHoldModalOpen(false);
    setIsBatchReleaseModalOpen(false);
    setCheckedMasterBatchIds([]);
    await fetchBatches();
  };
```

- [ ] **Step 3: 在状态筛选处新增下拉框（放在标签页导航区域，紧挨"文档"按钮之前）**

把：

```tsx
                </nav>
                <button
                  onClick={() => setIsDocumentationModalOpen(true)}
                  className="mb-1 inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                  文档
                </button>
              </div>
            </div>
```

改为：

```tsx
                </nav>
                <div className="flex items-center gap-2 mb-1">
                  {activeTab === 'inProcess' && (
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="text-xs border border-gray-300 rounded-md px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">全部批次</option>
                      <option value="flowing">仅看流转中</option>
                      <option value="hold">仅看已Hold</option>
                    </select>
                  )}
                  <button
                    onClick={() => setIsDocumentationModalOpen(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                    文档
                  </button>
                </div>
              </div>
            </div>
```

- [ ] **Step 4: 给 `MasterBatchTable` 传入勾选相关 props（仅在制批次tab生效）**

把：

```tsx
            {/* 主批次列表 - 根据 activeTab 动态选择批次列表 */}
            <MasterBatchTable
              filteredBatchList={currentBatchList}
              selectedMasterBatchId={selectedMasterBatchId}
              handleMasterRowClick={handleMasterRowClick}
              getStatusColor={getStatusColor}
              showStatusColumn={activeTab === 'inProcess'}
              showDefectDisposalColumn={activeTab === 'temporary'}
            />
```

改为：

```tsx
            {/* 主批次列表 - 根据 activeTab 动态选择批次列表 */}
            <MasterBatchTable
              filteredBatchList={currentBatchList}
              selectedMasterBatchId={selectedMasterBatchId}
              handleMasterRowClick={handleMasterRowClick}
              getStatusColor={getStatusColor}
              showStatusColumn={activeTab === 'inProcess'}
              showDefectDisposalColumn={activeTab === 'temporary'}
              checkedBatchIds={activeTab === 'inProcess' ? checkedMasterBatchIds : undefined}
              onToggleBatchChecked={activeTab === 'inProcess' ? handleToggleMasterBatchChecked : undefined}
              onToggleAllChecked={activeTab === 'inProcess' ? handleToggleAllMasterBatchesChecked : undefined}
            />
```

- [ ] **Step 5: 在操作面板的"在制批次"按钮网格里新增"批量扣留"/"批量释放"按钮（放在网格最后，`</div>` 闭合按钮网格之前）**

把（"在制批次"分支里最后一个按钮"最终分选总览"及其后紧跟的 `</div>`）：

```tsx
                  <button
                    onClick={handleOpenFinalSortingOverviewModal}
                    disabled={!isFinalSortingOverviewEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isFinalSortingOverviewEnabled
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    最终分选总览
                  </button>
                </div>
              ) : (
```

改为：

```tsx
                  <button
                    onClick={handleOpenFinalSortingOverviewModal}
                    disabled={!isFinalSortingOverviewEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isFinalSortingOverviewEnabled
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    最终分选总览
                  </button>

                  <button
                    onClick={() => setIsBatchHoldModalOpen(true)}
                    disabled={checkedMasterBatchIds.length === 0}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                      checkedMasterBatchIds.length > 0
                        ? 'text-white bg-red-600 hover:bg-red-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    批量扣留（{checkedMasterBatchIds.length}）
                  </button>

                  <button
                    onClick={() => setIsBatchReleaseModalOpen(true)}
                    disabled={checkedMasterBatchIds.length === 0}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                      checkedMasterBatchIds.length > 0
                        ? 'text-white bg-green-600 hover:bg-green-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    批量释放（{checkedMasterBatchIds.length}）
                  </button>
                </div>
              ) : (
```

- [ ] **Step 6: 渲染两个弹窗（放在文件末尾 `<FinalSortingOverviewModal ... />` 之后）**

把：

```tsx
      {/* 最终分选参数总览模态框 */}
      <FinalSortingOverviewModal
        isOpen={isFinalSortingOverviewModalOpen}
        onClose={() => setIsFinalSortingOverviewModalOpen(false)}
        wafers={aggregatedWafersForOverview}
        selectedBatch={selectedBatch}
        isAggregatedDataLoading={isAggregatedDataLoading}
      />

      {/* 新增：片篮重组模块功能说明模态框 - 已整合至系统说明文档 */}
    </div>
  );
};
```

改为：

```tsx
      {/* 最终分选参数总览模态框 */}
      <FinalSortingOverviewModal
        isOpen={isFinalSortingOverviewModalOpen}
        onClose={() => setIsFinalSortingOverviewModalOpen(false)}
        wafers={aggregatedWafersForOverview}
        selectedBatch={selectedBatch}
        isAggregatedDataLoading={isAggregatedDataLoading}
      />

      {/* 新增：批量扣留 / 批量释放模态框 */}
      <BatchHoldModal
        isOpen={isBatchHoldModalOpen}
        batchIds={checkedMasterBatchIds}
        onClose={() => setIsBatchHoldModalOpen(false)}
        onConfirmed={handleBatchHoldOrReleaseConfirmed}
      />
      <BatchReleaseModal
        isOpen={isBatchReleaseModalOpen}
        batchIds={checkedMasterBatchIds}
        onClose={() => setIsBatchReleaseModalOpen(false)}
        onConfirmed={handleBatchHoldOrReleaseConfirmed}
      />

      {/* 新增：片篮重组模块功能说明模态框 - 已整合至系统说明文档 */}
    </div>
  );
};
```

- [ ] **Step 7: 手动验证**

Run: `npm run dev`，浏览器打开对应地址，进入"生产管理 > 在制品管理 > 批次作业"，依次验证：
1. "在制批次"标签页下，主批次表格左侧出现勾选列，表头勾选框可全选/取消全选。
2. 勾选 2-3 个批次后，右侧操作面板"批量扣留（N）"按钮变为可点击状态，点击后弹出"批量扣留"弹窗；不填原因说明或不选责任工艺工程师时"确认扣留"按钮保持禁用；填写原因、选择责任工艺工程师后点击"确认扣留"，弹窗关闭，列表刷新，刚才勾选的批次在批次编码后出现红色"HOLD"徽标。
3. 用状态筛选下拉切换到"仅看已Hold"，能看到刚才被扣留的批次；切换到"仅看流转中"，这些批次消失。
4. 重新勾选刚才被Hold的批次，点击"批量释放（N）"，不填审批意见时"确认释放"按钮禁用；填写后确认，批次的 HOLD 徽标消失。
5. "暂存在制批次"标签页下，主批次表格**不出现**勾选列，不受影响。

- [ ] **Step 8: 跑一遍 TypeScript 编译确认没有类型错误**

Run: `npx tsc --noEmit`
Expected: 无报错

- [ ] **Step 9: Commit**

```bash
git add src/components/BatchOperations/components/BatchListPage.tsx
git commit -m "feat(batch-operations): wire bulk hold/release UI into BatchListPage

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 11: 新建"批次检索批量HOLD/解锁"页面 —— 检索区（机台+晶棒+出站时间 → 一键批量HOLD + 导出）

**Files:**
- Create: `src/components/BatchHoldSearch/BatchHoldSearchModule.tsx`

**Interfaces:**
- Consumes: `batchApiService.listBatches()`（既有）、`buildCsvContent`/`downloadCsv`（Task 5）、`BatchHoldModal`（Task 8）
- Produces: 默认导出的 `BatchHoldSearchModule` 组件，供 Task 13 挂载到 App.tsx。本任务先完成"检索 + 一键批量Hold + 导出"区块；Task 12 在同一文件里追加"批量解锁"区块。

- [ ] **Step 1: 创建目录和组件文件（检索区）**

```tsx
// src/components/BatchHoldSearch/BatchHoldSearchModule.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { batchApiService } from '../BatchOperations/services/batchApiService';
import { BatchData } from '../BatchOperations/types';
import { buildCsvContent, downloadCsv } from '../BatchOperations/utils/csvExport';
import BatchHoldModal from '../BatchOperations/components/BatchHoldModal';

const BatchHoldSearchModule: React.FC = () => {
  const [allBatches, setAllBatches] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(true);

  // 检索条件
  const [selectedEquipmentCodes, setSelectedEquipmentCodes] = useState<string[]>([]);
  const [selectedIngotIds, setSelectedIngotIds] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await batchApiService.listBatches();
      setAllBatches(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const equipmentOptions = useMemo(
    () => Array.from(new Set(allBatches.map(b => b.equipmentCode).filter(Boolean))).sort(),
    [allBatches]
  );
  const ingotOptions = useMemo(
    () => Array.from(new Set(allBatches.map(b => b.ingotId).filter(Boolean))).sort(),
    [allBatches]
  );

  const searchResults = useMemo(() => {
    if (!hasSearched) return [];
    return allBatches.filter(b => {
      if (selectedEquipmentCodes.length > 0 && !selectedEquipmentCodes.includes(b.equipmentCode)) return false;
      if (selectedIngotIds.length > 0 && !selectedIngotIds.includes(b.ingotId)) return false;
      if (!b.lastOutstationAt) return false;
      const t = new Date(b.lastOutstationAt).getTime();
      if (startTime && t < new Date(startTime).getTime()) return false;
      if (endTime && t > new Date(endTime).getTime()) return false;
      return true;
    });
  }, [allBatches, hasSearched, selectedEquipmentCodes, selectedIngotIds, startTime, endTime]);

  const handleSearch = () => setHasSearched(true);

  const handleExport = () => {
    const csv = buildCsvContent(searchResults, [
      { key: 'batchCode', label: '批次编码' },
      { key: 'equipmentName', label: '机台' },
      { key: 'ingotId', label: '晶棒ID' },
      { key: 'station', label: '站点' },
      { key: 'totalQty', label: '数量' },
      { key: 'status', label: '状态' },
      { key: 'lastOutstationAt', label: '出站时间' },
    ]);
    downloadCsv(`批次检索结果_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const handleHoldConfirmed = async () => {
    setIsHoldModalOpen(false);
    await loadBatches();
    setHasSearched(false);
  };

  const toggleMultiSelect = (
    value: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-xl font-semibold text-gray-800">批次检索批量HOLD/解锁</h1>

        {/* 检索区 */}
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">按机台 / 晶棒 + 出站时间范围检索</h2>
          {loading ? (
            <p className="text-sm text-gray-400">加载批次数据中...</p>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">机台（可多选）</label>
                <select
                  multiple
                  value={selectedEquipmentCodes}
                  onChange={e =>
                    setSelectedEquipmentCodes(Array.from(e.target.selectedOptions).map(o => o.value))
                  }
                  className="w-full h-28 border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  {equipmentOptions.map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">晶棒ID（可多选）</label>
                <select
                  multiple
                  value={selectedIngotIds}
                  onChange={e => setSelectedIngotIds(Array.from(e.target.selectedOptions).map(o => o.value))}
                  className="w-full h-28 border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  {ingotOptions.map(id => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">出站时间从</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
                <label className="block text-xs font-medium text-gray-500 mb-1 mt-2">出站时间到</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  检索
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 检索结果区 */}
        {hasSearched && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700">
                检索结果（{searchResults.length}）
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  disabled={searchResults.length === 0}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border ${
                    searchResults.length > 0
                      ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      : 'border-gray-200 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  导出清单
                </button>
                <button
                  onClick={() => setIsHoldModalOpen(true)}
                  disabled={searchResults.length === 0}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                    searchResults.length > 0
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  一键批量HOLD（{searchResults.length}）
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">批次编码</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">机台</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">晶棒ID</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">站点</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase border-b">数量</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase border-b">状态</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">出站时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {searchResults.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">无匹配批次</td>
                    </tr>
                  ) : (
                    searchResults.map(b => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-medium text-gray-900">
                          {b.batchCode}
                          {b.isHold && (
                            <span className="ml-1.5 inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-100 text-red-700">HOLD</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-gray-700">{b.equipmentName}（{b.equipmentCode}）</td>
                        <td className="px-3 py-2.5 text-gray-700">{b.ingotId}</td>
                        <td className="px-3 py-2.5 text-gray-700">{b.stationName}</td>
                        <td className="px-3 py-2.5 text-center text-gray-700">{b.totalQty}</td>
                        <td className="px-3 py-2.5 text-center text-gray-700">
                          {b.status === '已出站' ? '已入库' : b.status}
                        </td>
                        <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                          {b.lastOutstationAt ? new Date(b.lastOutstationAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <BatchHoldModal
        isOpen={isHoldModalOpen}
        batchIds={searchResults.map(b => b.id)}
        onClose={() => setIsHoldModalOpen(false)}
        onConfirmed={handleHoldConfirmed}
      />
    </div>
  );
};

export default BatchHoldSearchModule;
```

> 备注：`status === '已出站'` → 显示"已入库"，是本计划采用的简化判断（MES 无法感知真实成品库/发货状态，见 spec"已知边界"），不是真实的成品库集成。

- [ ] **Step 2: 手动验证**

Run: `npm run dev`。此时页面还未挂载到菜单（Task 13 才挂载），暂时无法从 UI 导航到，跳过运行时验证，仅做静态检查：

Run: `npx tsc --noEmit`
Expected: 无报错

- [ ] **Step 3: Commit**

```bash
git add src/components/BatchHoldSearch/BatchHoldSearchModule.tsx
git commit -m "feat(batch-hold-search): add batch search page with one-click bulk hold and CSV export

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 12: "批次检索批量HOLD/解锁"页面 —— 批量解锁区块（按产品分类/客户/料号筛选）

**Files:**
- Modify: `src/components/BatchHoldSearch/BatchHoldSearchModule.tsx`

**Interfaces:**
- Consumes: `batchHoldService.listActiveHoldRecords()`（Task 4）、`BatchReleaseModal`（Task 9）

- [ ] **Step 1: 新增 state、加载当前所有Hold批次的逻辑**

把：

```tsx
import { buildCsvContent, downloadCsv } from '../BatchOperations/utils/csvExport';
import BatchHoldModal from '../BatchOperations/components/BatchHoldModal';
```

改为：

```tsx
import { buildCsvContent, downloadCsv } from '../BatchOperations/utils/csvExport';
import BatchHoldModal from '../BatchOperations/components/BatchHoldModal';
import BatchReleaseModal from '../BatchOperations/components/BatchReleaseModal';
import { batchHoldService } from '../../services/batchHold/batchHoldService';
```

把：

```tsx
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);

  const loadBatches = async () => {
```

改为：

```tsx
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);

  // 批量解锁区块的状态
  const [heldBatchIds, setHeldBatchIds] = useState<string[]>([]);
  const [releaseCategoryFilter, setReleaseCategoryFilter] = useState('');
  const [releaseCustomerFilter, setReleaseCustomerFilter] = useState('');
  const [releaseProductCodeFilter, setReleaseProductCodeFilter] = useState('');
  const [checkedReleaseBatchIds, setCheckedReleaseBatchIds] = useState<string[]>([]);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);

  const loadBatches = async () => {
```

在 `loadBatches` 函数体内，把：

```tsx
  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await batchApiService.listBatches();
      setAllBatches(data);
    } finally {
      setLoading(false);
    }
  };
```

改为：

```tsx
  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await batchApiService.listBatches();
      setAllBatches(data);
      const activeRecords = await batchHoldService.listActiveHoldRecords();
      setHeldBatchIds(Array.from(new Set(activeRecords.map(r => r.batchId))));
    } finally {
      setLoading(false);
    }
  };
```

- [ ] **Step 2: 计算可解锁批次列表 + 筛选选项（放在 `searchResults` useMemo 之后）**

把：

```tsx
  const handleSearch = () => setHasSearched(true);
```

改为：

```tsx
  const heldBatches = useMemo(
    () => allBatches.filter(b => heldBatchIds.includes(b.id)),
    [allBatches, heldBatchIds]
  );

  const releaseCategoryOptions = useMemo(
    () => Array.from(new Set(heldBatches.map(b => b.productCategory).filter(Boolean))) as string[],
    [heldBatches]
  );
  const releaseCustomerOptions = useMemo(
    () => Array.from(new Set(heldBatches.map(b => b.customerName).filter(Boolean))) as string[],
    [heldBatches]
  );

  const filteredHeldBatches = useMemo(() => {
    return heldBatches.filter(b => {
      if (releaseCategoryFilter && b.productCategory !== releaseCategoryFilter) return false;
      if (releaseCustomerFilter && b.customerName !== releaseCustomerFilter) return false;
      if (releaseProductCodeFilter && !b.productCode.toLowerCase().includes(releaseProductCodeFilter.toLowerCase())) return false;
      return true;
    });
  }, [heldBatches, releaseCategoryFilter, releaseCustomerFilter, releaseProductCodeFilter]);

  const toggleReleaseBatchChecked = (batchId: string) => {
    setCheckedReleaseBatchIds(prev =>
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    );
  };

  const handleReleaseConfirmed = async () => {
    setIsReleaseModalOpen(false);
    setCheckedReleaseBatchIds([]);
    await loadBatches();
  };

  const handleSearch = () => setHasSearched(true);
```

- [ ] **Step 3: 在 JSX 里新增"批量解锁"区块（放在检索结果区块之后，`<BatchHoldModal .../>` 之前）**

把：

```tsx
      </div>

      <BatchHoldModal
        isOpen={isHoldModalOpen}
        batchIds={searchResults.map(b => b.id)}
        onClose={() => setIsHoldModalOpen(false)}
        onConfirmed={handleHoldConfirmed}
      />
    </div>
  );
};
```

改为：

```tsx
        {/* 批量解锁区 */}
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
          <h2 className="text-sm font-medium text-gray-700">批量解锁（当前所有已Hold批次，共 {heldBatches.length}）</h2>
          <div className="grid grid-cols-4 gap-3">
            <select
              value={releaseCategoryFilter}
              onChange={e => setReleaseCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">全部产品分类</option>
              {releaseCategoryOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={releaseCustomerFilter}
              onChange={e => setReleaseCustomerFilter(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">全部客户</option>
              {releaseCustomerOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="text"
              value={releaseProductCodeFilter}
              onChange={e => setReleaseProductCodeFilter(e.target.value)}
              placeholder="按料号搜索"
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <button
              onClick={() => setIsReleaseModalOpen(true)}
              disabled={checkedReleaseBatchIds.length === 0}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                checkedReleaseBatchIds.length > 0
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              批量释放（{checkedReleaseBatchIds.length}）
            </button>
          </div>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-3 py-2 bg-gray-50 border-b w-8"></th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">批次编码</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">料号</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">产品分类</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">客户</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">站点</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredHeldBatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">当前没有符合条件的Hold批次</td>
                  </tr>
                ) : (
                  filteredHeldBatches.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={checkedReleaseBatchIds.includes(b.id)}
                          onChange={() => toggleReleaseBatchChecked(b.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-900">{b.batchCode}</td>
                      <td className="px-3 py-2.5 text-gray-700">{b.productCode}</td>
                      <td className="px-3 py-2.5 text-gray-700">{b.productCategory || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-700">{b.customerName || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-700">{b.stationName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <BatchHoldModal
        isOpen={isHoldModalOpen}
        batchIds={searchResults.map(b => b.id)}
        onClose={() => setIsHoldModalOpen(false)}
        onConfirmed={handleHoldConfirmed}
      />
      <BatchReleaseModal
        isOpen={isReleaseModalOpen}
        batchIds={checkedReleaseBatchIds}
        onClose={() => setIsReleaseModalOpen(false)}
        onConfirmed={handleReleaseConfirmed}
      />
    </div>
  );
};
```

- [ ] **Step 4: 手动验证（此时页面仍未挂载菜单，跳过运行时验证，只做静态检查；完整端到端验证放在 Task 13）**

Run: `npx tsc --noEmit`
Expected: 无报错

- [ ] **Step 5: Commit**

```bash
git add src/components/BatchHoldSearch/BatchHoldSearchModule.tsx
git commit -m "feat(batch-hold-search): add bulk unlock section filtered by category/customer/material code

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 13: 挂载新页面到菜单和路由

**Files:**
- Modify: `src/config/menuConfig.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `BatchHoldSearchModule`（Task 11/12）

- [ ] **Step 1: 在 menuConfig.ts 里新增菜单项和图标引入**

在 [menuConfig.ts](../../../src/config/menuConfig.ts) 中，把：

```ts
import {
  LayoutDashboard,
  Package,
  Truck,
  ClipboardList,
  Settings,
  Box,
  FileText,
  AlertTriangle,
  Send,
  HardDrive,
  CheckCircle,
  Warehouse,
  Wrench,
  LifeBuoy,
  Clock,
  Layers,
  Tag,
  History,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
```

改为：

```ts
import {
  LayoutDashboard,
  Package,
  Truck,
  ClipboardList,
  Settings,
  Box,
  FileText,
  AlertTriangle,
  Send,
  HardDrive,
  CheckCircle,
  Warehouse,
  Wrench,
  LifeBuoy,
  Clock,
  Layers,
  Tag,
  History,
  ShieldAlert,
  ShieldCheck,
  Lock,
} from 'lucide-react';
```

把：

```ts
        subItems: [
          { id: 'fragment-management', label: '批次作业', icon: AlertTriangle },
          { id: 'e-card', label: '批次流水卡', icon: FileText, href: 'https://oqkq2dgk7v34erk4eiqymb4jq.bolt.host' },
          { id: 'operation-log', label: '批次操作履历', icon: FileText, href: 'https://stellar-madeleine-ba4ceb.netlify.app' },
          { id: 'batch-creation', label: '本地批次创建', icon: Send, href: 'https://new-xxzc.bolt.host' },
        ]
```

改为：

```ts
        subItems: [
          { id: 'fragment-management', label: '批次作业', icon: AlertTriangle },
          { id: 'batch-hold-search', label: '批次检索批量HOLD/解锁', icon: Lock },
          { id: 'e-card', label: '批次流水卡', icon: FileText, href: 'https://oqkq2dgk7v34erk4eiqymb4jq.bolt.host' },
          { id: 'operation-log', label: '批次操作履历', icon: FileText, href: 'https://stellar-madeleine-ba4ceb.netlify.app' },
          { id: 'batch-creation', label: '本地批次创建', icon: Send, href: 'https://new-xxzc.bolt.host' },
        ]
```

- [ ] **Step 2: 在 App.tsx 引入组件并新增 case**

在 [App.tsx](../../../src/App.tsx) 中，把：

```tsx
import BatchOperationsModule from './components/BatchOperations/BatchOperationsModule';
```

改为：

```tsx
import BatchOperationsModule from './components/BatchOperations/BatchOperationsModule';
import BatchHoldSearchModule from './components/BatchHoldSearch/BatchHoldSearchModule';
```

把：

```tsx
      case 'fragment-management':
        return <BatchOperationsModule />;
```

改为：

```tsx
      case 'fragment-management':
        return <BatchOperationsModule />;
      case 'batch-hold-search':
        return <BatchHoldSearchModule />;
```

- [ ] **Step 3: 手动验证（端到端）**

Run: `npm run dev`，浏览器打开对应地址，依次验证：
1. 左侧菜单"生产管理 > 在制品管理"下出现"批次检索批量HOLD/解锁"入口，与"批次作业"并列。
2. 点击进入新页面，选择至少一个机台、设置一个较宽的出站时间范围，点击"检索"，能看到结果列表；点击"导出清单"能触发浏览器下载一个 CSV 文件，用文本编辑器打开确认内容含表头和数据行。
3. 点击"一键批量HOLD（N）"，填写原因、选择责任工艺工程师后确认，检索结果里对应批次出现"HOLD"徽标。
4. 滚动到"批量解锁"区块，能看到刚才被Hold的批次出现在列表里；用产品分类/客户/料号筛选能正确缩小列表；勾选后点击"批量释放"，填写审批意见后确认，该批次从列表消失。
5. 回到"批次作业"页面（`fragment-management`），确认在这里也能看到同一批次的 Hold 状态是同步的（因为共用同一个 `batchHoldService`/`batchApiService` 内存数据）。

- [ ] **Step 4: 跑一遍 TypeScript 编译 + 全量单测确认没有回归**

Run: `npx tsc --noEmit && npm run test`
Expected: 编译无报错；vitest 全部用例通过（Task 1-5 累计约 10 个用例）

- [ ] **Step 5: Commit**

```bash
git add src/config/menuConfig.ts src/App.tsx
git commit -m "feat(batch-hold-search): mount batch hold search page into menu and routing

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 14: 批次详情新增"Hold记录"查看面板

**Files:**
- Modify: `src/components/BatchOperations/components/BatchListPage.tsx`

**Interfaces:**
- Consumes: `batchHoldService.listHoldRecords(batchId)`（Task 4）

- [ ] **Step 1: 新增 state 和加载逻辑**

在 [BatchListPage.tsx](../../../src/components/BatchOperations/components/BatchListPage.tsx) 中，把：

```tsx
import BatchHoldModal from './BatchHoldModal';
import BatchReleaseModal from './BatchReleaseModal';
import { Clock, BookOpen } from 'lucide-react';
```

改为：

```tsx
import BatchHoldModal from './BatchHoldModal';
import BatchReleaseModal from './BatchReleaseModal';
import { batchHoldService } from '../../../services/batchHold/batchHoldService';
import { HoldRecord } from '../../../services/batchHold/types';
import { Clock, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
```

把：

```tsx
  const [isBatchHoldModalOpen, setIsBatchHoldModalOpen] = useState(false);
  const [isBatchReleaseModalOpen, setIsBatchReleaseModalOpen] = useState(false);
```

改为：

```tsx
  const [isBatchHoldModalOpen, setIsBatchHoldModalOpen] = useState(false);
  const [isBatchReleaseModalOpen, setIsBatchReleaseModalOpen] = useState(false);
  // 新增：选中批次的Hold记录查看面板
  const [holdHistoryRecords, setHoldHistoryRecords] = useState<HoldRecord[]>([]);
  const [isHoldHistoryExpanded, setIsHoldHistoryExpanded] = useState(false);
```

在 `handleMasterRowClick` 函数体内，把：

```tsx
  const handleMasterRowClick = async (batchId: string) => {
    console.log('DEBUG: handleMasterRowClick called with batchId:', batchId);
    console.log('Master batch row clicked:', batchId);
    console.log('BatchListPage: Master batch selected:', batchId);
    setSelectedMasterBatchId(batchId);
    setLoadingSubBatches(true);
    try {
      const subBatches = await getSubBatchesForMaster(batchId);
      setDisplayedSubBatches(subBatches);
      console.log('Displayed subBatches for', batchId, ':', subBatches);
      setCheckedSubBatchIds([]);
    } catch (error) {
      console.error('Failed to load sub-batches:', error);
      setDisplayedSubBatches([]);
    } finally {
      setLoadingSubBatches(false);
    }
  };
```

改为：

```tsx
  const handleMasterRowClick = async (batchId: string) => {
    console.log('DEBUG: handleMasterRowClick called with batchId:', batchId);
    console.log('Master batch row clicked:', batchId);
    console.log('BatchListPage: Master batch selected:', batchId);
    setSelectedMasterBatchId(batchId);
    setLoadingSubBatches(true);
    setIsHoldHistoryExpanded(false);
    try {
      const subBatches = await getSubBatchesForMaster(batchId);
      setDisplayedSubBatches(subBatches);
      console.log('Displayed subBatches for', batchId, ':', subBatches);
      setCheckedSubBatchIds([]);
      const records = await batchHoldService.listHoldRecords(batchId);
      setHoldHistoryRecords(records);
    } catch (error) {
      console.error('Failed to load sub-batches:', error);
      setDisplayedSubBatches([]);
    } finally {
      setLoadingSubBatches(false);
    }
  };
```

同时在批量Hold/Release确认后的收尾函数里也刷新一次（若当前选中批次正好是刚被操作的批次之一）。把：

```tsx
  // 新增：批量Hold/Release弹窗确认后的公共收尾逻辑
  const handleBatchHoldOrReleaseConfirmed = async () => {
    setIsBatchHoldModalOpen(false);
    setIsBatchReleaseModalOpen(false);
    setCheckedMasterBatchIds([]);
    await fetchBatches();
  };
```

改为：

```tsx
  // 新增：批量Hold/Release弹窗确认后的公共收尾逻辑
  const handleBatchHoldOrReleaseConfirmed = async () => {
    setIsBatchHoldModalOpen(false);
    setIsBatchReleaseModalOpen(false);
    setCheckedMasterBatchIds([]);
    await fetchBatches();
    if (selectedMasterBatchId) {
      const records = await batchHoldService.listHoldRecords(selectedMasterBatchId);
      setHoldHistoryRecords(records);
    }
  };
```

- [ ] **Step 2: 在操作面板里新增可展开的"Hold记录"区块（放在选中信息提示 `<div className="mb-4 p-3 bg-blue-50 rounded-lg">...</div>` 之后）**

把：

```tsx
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">{getSelectionDescription()}</p>
              </div>

              {activeTab === 'inProcess' ? (
```

改为：

```tsx
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">{getSelectionDescription()}</p>
              </div>

              {selectedMasterBatchId && holdHistoryRecords.length > 0 && (
                <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setIsHoldHistoryExpanded(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <span>Hold记录（{holdHistoryRecords.length}）</span>
                    {isHoldHistoryExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  {isHoldHistoryExpanded && (
                    <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                      {holdHistoryRecords.map(r => (
                        <div key={r.id} className="px-3 py-2 text-xs space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className={`font-medium ${r.status === 'holding' ? 'text-red-600' : 'text-gray-500'}`}>
                              {r.status === 'holding' ? '扣留中' : '已释放'}
                            </span>
                            <span className="text-gray-400">{r.holdSource === 'manual' ? '人工' : 'OCAP自动'}</span>
                          </div>
                          <p className="text-gray-700">{r.holdReasonCategory}：{r.holdReasonText}</p>
                          <p className="text-gray-400">扣留：{r.holdBy} · {new Date(r.holdAt).toLocaleString()}</p>
                          {r.status === 'released' && (
                            <p className="text-gray-400">
                              释放：{r.releaseBy} · {r.releaseAt ? new Date(r.releaseAt).toLocaleString() : ''}
                              {r.releaseApprovalComment ? ` · 依据：${r.releaseApprovalComment}` : ''}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'inProcess' ? (
```

- [ ] **Step 3: 手动验证**

Run: `npm run dev`，进入"批次作业"页面，对某批次执行一次批量扣留后再批量释放（可参照 Task 10 Step 7 的流程），然后点击该批次所在行选中它，确认操作面板里出现"Hold记录（1）"可展开条目，展开后能看到扣留和释放两条时间线信息（分类、原因、操作人、时间、释放依据）。

- [ ] **Step 4: 跑一遍 TypeScript 编译确认没有类型错误**

Run: `npx tsc --noEmit`
Expected: 无报错

- [ ] **Step 5: Commit**

```bash
git add src/components/BatchOperations/components/BatchListPage.tsx
git commit -m "feat(batch-operations): add collapsible hold history panel to batch detail

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## 计划完成后的验证清单

- [ ] `npx tsc --noEmit` 全量通过
- [ ] `npm run test` 全量通过
- [ ] `npm run dev` 手动走一遍 Task 10 Step 7 和 Task 13 Step 3 的完整验证清单
- [ ] 确认阶段③a（wafer血缘追溯基础设施）、③b（SPC自动触发规则引擎）不在本计划范围内，按 spec 约定作为后续独立子项目
