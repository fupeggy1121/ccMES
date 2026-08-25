# 包装出站表单 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有"出站操作"弹窗（`OutstationForm`）里，为"包装"站点新增一个"包装打印"区块：勾选子批次 → 扫码/输入片篮号防呆确认 → 生成出货条码（支持合箱）→ 打印标签（mock）→ 对已打印记录重打（需填原因）。

**Architecture:** 新组件 `PackagingSection.tsx` 挂载进 `OutstationForm.tsx`（仅 `station === '包装'` 时渲染，替代晶圆信息/量测参数区块）。数据走现有 `mockBatchService` / `batchApiService` 的 `USE_MOCK_DATA` 开关模式，新增三个写方法 + 一个查询方法，内存数组存储 `PackagingRecord`。`SubBatchData` 扩展包装/打印相关字段用于表格展示。

**Tech Stack:** React 18 + TypeScript 5.5 + Tailwind（不引入 antd，保持与 `BatchOperations` 模块现有风格一致）+ lucide-react 图标 + Vite 5。项目无自动化测试框架，纯逻辑用临时 `npx tsx` smoke 脚本验证（验证后删除，不提交），UI 用 `npm run lint` + `npx tsc --noEmit` + 手动/浏览器走查验证。

**Spec:** [docs/superpowers/specs/2026-08-25-packaging-outstation-design.md](../specs/2026-08-25-packaging-outstation-design.md)

## Global Constraints

- 不引入 antd 或其它 UI 库；所有新 UI 用 Tailwind + lucide-react，与 `BatchOperations/components/` 下其它表单（`OutstationForm.tsx`、`MarkingStationForm.tsx`）风格一致。
- 打印全部 mock（`console.log` 标签内容 + 更新打印状态/次数），不对接真实打印机，不做"打印地址切换"。
- 出货条码与子批次关系为 1 对多（支持合箱）：一条 `PackagingRecord` 可关联多个 `sublotIds`。
- 出货条码生成规则：同批次已有记录则复用前缀、序号递增；否则以 batchCode 数字部分（不足 6 位左补 0，取后 6 位）为前缀，序号从 01 开始；字段完全可编辑，不做全局唯一性校验。
- 防呆扫码：合箱多选时必须对选中的每一个子批次逐个扫描/输入其片篮号，全部匹配后才能继续。
- 重打：仅"已打印"的子批次/记录可重打，重打前必须填写重打原因（必填）。
- "包装人员"无真实登录用户体系，走 mock 人员列表（`mockOperators.ts`），默认选中第一项。
- 包装站点（`station === '包装'`）的"确认出站"按钮需所有子批次 `printStatus === '已打印'` 才可点击。
- 项目无测试框架（无 vitest/jest）：纯函数/service 用临时 `*.smoke.ts` 脚本（`npx tsx` 执行，验证后删除，不提交到 git）；UI 用 `npm run lint`、`npx tsc --noEmit -p tsconfig.app.json`、以及浏览器走查（可用 `browser-automation` skill，或手动打开 `npm run dev` 页面操作）。

---

## 现状与关键发现（执行前必读）

1. **触发路径已天然存在**：`useBatchOperationsHandlers.ts` 里 `batch.status === '加工中'` 的兜底分支（约第 74-79 行）已经把非 markingStation/inspection 站点的批次路由到 `currentFormType = 'outstation'`，`station === '包装'` 的 mock 批次会走这条路，**无需改动触发逻辑**。
2. **⚠️ 但按钮本身当前是禁用的（预先存在的 bug，本计划一并修复）**：`BatchListPage.tsx` 里"进/出站"按钮的 `isPassStationEnabled`（约第 442-443 行）只在 `status === '待出站' || status === '待进站'` 时才可用，**不包含 `'加工中'`**。而唯一的"包装"mock 批次 `BATCHX5VZPH`（id `533e00f4-e470-480f-90c6-0b3612572bcd`）的 `status` 正是 `'加工中'`（见 `data/batches.ts`）。不修这个门槛条件，整个新功能在 UI 上永远打不开（连带已有的"打标出站"分支也一样打不开，这是同一个预先存在的问题）。Task 4 会做这个最小修复。
3. Mock 批次 `BATCHX5VZPH` 的子批次数据（`data/mockSubBatches.ts`，键为 batch id `533e00f4-e470-480f-90c6-0b3612572bcd`）：13 个子批次，`sublotId` 形如 `BATCHX5VZPH-SUB-01`，`carrierId` 形如 `CARXV001`，每个 `totalQty: 25`。计划中的示例/断言均基于这份真实 mock 数据。

---

### Task 1: 扩展类型定义 + 出货条码生成规则

**Files:**
- Modify: `src/components/BatchOperations/types.ts`
- Create: `src/components/BatchOperations/utils/packagingBarcode.ts`
- Test（临时，验证后删除）: `src/components/BatchOperations/utils/packagingBarcode.smoke.ts`

**Interfaces:**
- Produces: `SubBatchData`（新增 `packagingStatus?`, `packagingTime?`, `printStatus?`, `printCount?`）、`ReprintLog { id, reason, operator, time }`、`PackagingRecord { id, packagingBarcode, sublotIds: string[], carrierIds: string[], totalQty, operator, packagingTime, remark?, printStatus, printCount, reprints: ReprintLog[] }`、`generatePackagingBarcode(batchCode: string, existingRecords: PackagingRecord[]): string`

- [ ] **Step 1: 扩展 `SubBatchData`**

在 `src/components/BatchOperations/types.ts` 中找到：

```ts
export interface SubBatchData {
  id: string; // 新增：子批次的UUID
  sublotId: string;
  carrierId: string;
  totalQty: number;
  goodQty: number;
  defectQty: number;
  defectDisposal?: '返工' | '报废' | '残值回收'; // 不良处置
  status: string;
  station: string;
  stationName: string;
  equipment: string;
  packagingBarcode?: string; // 新增：包装条码，可选
}
```

替换为：

```ts
export interface SubBatchData {
  id: string; // 新增：子批次的UUID
  sublotId: string;
  carrierId: string;
  totalQty: number;
  goodQty: number;
  defectQty: number;
  defectDisposal?: '返工' | '报废' | '残值回收'; // 不良处置
  status: string;
  station: string;
  stationName: string;
  equipment: string;
  packagingBarcode?: string; // 新增：包装条码，可选
  packagingStatus?: '待包装' | '已包装'; // 新增：包装状态
  packagingTime?: string; // 新增：包装完成时间
  printStatus?: '未打印' | '已打印'; // 新增：标签打印状态
  printCount?: number; // 新增：打印次数
}
```

- [ ] **Step 2: 新增 `ReprintLog` / `PackagingRecord`**

在同文件中找到：

```ts
// 新增包装数据结构
export interface PackagingData {
  id: string; // 唯一的包装记录ID
  packagingBarcode: string; // 包装条码
  sublotId: string; // 关联的子批次ID
  productCode: string; // 产品料号，用于匹配模板
  productName: string; // 产品名称
  totalQty: number; // 包装数量
  status: 'Pending' | 'Packaged' | 'Printed'; // 包装状态
  timestamp: string; // 包装时间戳
}
```

在它后面追加（保留原有内容不变）：

```ts

// 新增：重打日志
export interface ReprintLog {
  id: string;
  reason: string; // 重打原因，必填
  operator: string; // 操作人
  time: string; // 重打时间
}

// 新增：包装出货条码记录（支持合箱，一个出货条码可关联多个子批次）
export interface PackagingRecord {
  id: string;
  packagingBarcode: string; // 出货条码（=包装条码）
  sublotIds: string[]; // 关联子批次 sublotId 列表
  carrierIds: string[]; // 关联片篮号列表，与 sublotIds 一一对应
  totalQty: number; // 合计片数
  operator: string; // 包装人员
  packagingTime: string; // 包装时间
  remark?: string;
  printStatus: '未打印' | '已打印';
  printCount: number;
  reprints: ReprintLog[];
}
```

- [ ] **Step 3: 新建出货条码生成规则文件**

创建 `src/components/BatchOperations/utils/packagingBarcode.ts`：

```ts
import { PackagingRecord } from '../types';

/**
 * 生成出货条码（包装条码）。
 * - 若同批次已存在包装记录，复用其条码前缀，序号在现有记录数量基础上 +1。
 * - 否则以 batchCode 中的数字字符（取后 6 位，不足左补 0）作为前缀，序号从 01 开始。
 * 结果仅用于表单预填展示，用户可编辑，不做全局唯一性校验。
 */
export function generatePackagingBarcode(
  batchCode: string,
  existingRecords: PackagingRecord[]
): string {
  const seq = existingRecords.length + 1;
  const seqStr = String(seq).padStart(2, '0');

  if (existingRecords.length > 0) {
    const lastBarcode = existingRecords[existingRecords.length - 1].packagingBarcode;
    const dashIdx = lastBarcode.lastIndexOf('-');
    const prefix = dashIdx !== -1 ? lastBarcode.slice(0, dashIdx) : lastBarcode;
    return `${prefix}-${seqStr}`;
  }

  const digitsOnly = batchCode.replace(/\D/g, '');
  const prefix = digitsOnly.length >= 6
    ? digitsOnly.slice(-6)
    : digitsOnly.padStart(6, '0');
  return `${prefix}-${seqStr}`;
}
```

- [ ] **Step 4: 写 smoke 脚本并先确认它在实现前会失败**

创建 `src/components/BatchOperations/utils/packagingBarcode.smoke.ts`：

```ts
import assert from 'node:assert/strict';
import { generatePackagingBarcode } from './packagingBarcode';
import type { PackagingRecord } from '../types';

// 无历史记录：前缀取批次号数字部分，序号从 01 开始
assert.equal(generatePackagingBarcode('BATCHX5VZPH', []), '000005-01');

// 已有历史记录：复用前缀，序号递增
const existing: PackagingRecord[] = [
  {
    id: 'pkg-1',
    packagingBarcode: '000005-01',
    sublotIds: ['BATCHX5VZPH-SUB-01'],
    carrierIds: ['CARXV001'],
    totalQty: 25,
    operator: 'admin',
    packagingTime: new Date().toISOString(),
    printStatus: '未打印',
    printCount: 0,
    reprints: [],
  },
];
assert.equal(generatePackagingBarcode('BATCHX5VZPH', existing), '000005-02');

console.log('packagingBarcode smoke test passed');
```

若在 Step 3 之前运行（此时应已完成 Step 3，因为文件必须先存在才能写这个 import）——正常顺序下这一步应直接通过。若想验证"失败态"，可临时把 Step 3 中 `return \`${prefix}-${seqStr}\`;`（第一个 return）改成 `return 'WRONG';` 再运行一次确认断言失败，然后改回来。

Run: `cd "/Users/fupeggy/Downloads/project 4" && npx tsx src/components/BatchOperations/utils/packagingBarcode.smoke.ts`

Expected: 输出 `packagingBarcode smoke test passed`，退出码 0。

- [ ] **Step 5: 类型检查**

Run: `cd "/Users/fupeggy/Downloads/project 4" && npx tsc --noEmit -p tsconfig.app.json`

Expected: 无新增报错。

- [ ] **Step 6: 删除临时 smoke 脚本**

```bash
rm "/Users/fupeggy/Downloads/project 4/src/components/BatchOperations/utils/packagingBarcode.smoke.ts"
```

- [ ] **Step 7: Commit**

```bash
cd "/Users/fupeggy/Downloads/project 4"
git add src/components/BatchOperations/types.ts src/components/BatchOperations/utils/packagingBarcode.ts
git commit -m "feat(packaging): add PackagingRecord types and barcode generator

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: mock 人员数据 + mockBatchService 包装接口

**Files:**
- Create: `src/components/BatchOperations/data/mockOperators.ts`
- Modify: `src/components/BatchOperations/services/mockBatchService.ts`
- Test（临时，验证后删除）: `src/components/BatchOperations/services/mockBatchService.smoke.ts`

**Interfaces:**
- Consumes: `PackagingRecord`, `ReprintLog`（Task 1）
- Produces: `mockOperators: { id: string; name: string }[]`；`mockBatchService.createPackagingRecord(batchId, payload): Promise<{ success: boolean; record: PackagingRecord }>`、`mockBatchService.getPackagingRecords(batchId): Promise<PackagingRecord[]>`、`mockBatchService.printPackagingRecord(batchId, recordId): Promise<{ success: boolean }>`、`mockBatchService.reprintPackagingRecord(batchId, recordId, reason, operator): Promise<{ success: boolean }>`

- [ ] **Step 1: 新建包装人员 mock 数据**

创建 `src/components/BatchOperations/data/mockOperators.ts`：

```ts
export interface OperatorOption {
  id: string;
  name: string;
}

// 包装人员下拉数据源。项目暂无全局登录用户体系，
// 默认选中列表第一项模拟"当前登录用户"。
export const mockOperators: OperatorOption[] = [
  { id: '0001', name: 'admin' },
  { id: '0002', name: '张伟' },
  { id: '0003', name: '李娜' },
];
```

- [ ] **Step 2: 写 smoke 脚本，先确认它在实现前失败**

创建 `src/components/BatchOperations/services/mockBatchService.smoke.ts`：

```ts
import assert from 'node:assert/strict';
import { mockBatchService } from './mockBatchService';

const batchId = '533e00f4-e470-480f-90c6-0b3612572bcd'; // BATCHX5VZPH，包装站点

async function main() {
  const before = await mockBatchService.getPackagingRecords(batchId);
  assert.equal(before.length, 0, '初始应无包装记录');

  const { success, record } = await mockBatchService.createPackagingRecord(batchId, {
    sublotIds: ['BATCHX5VZPH-SUB-01'],
    carrierIds: ['CARXV001'],
    packagingBarcode: '000005-01',
    operator: 'admin',
  });
  assert.equal(success, true);
  assert.equal(record.totalQty, 25);
  assert.equal(record.printStatus, '未打印');
  assert.equal(record.printCount, 0);

  const subsAfterCreate = await mockBatchService.getSubBatches(batchId);
  const sub1 = subsAfterCreate.find(s => s.sublotId === 'BATCHX5VZPH-SUB-01');
  assert.equal(sub1?.packagingStatus, '已包装');
  assert.equal(sub1?.packagingBarcode, '000005-01');

  const printResult = await mockBatchService.printPackagingRecord(batchId, record.id);
  assert.equal(printResult.success, true);
  const subsAfterPrint = await mockBatchService.getSubBatches(batchId);
  const sub1AfterPrint = subsAfterPrint.find(s => s.sublotId === 'BATCHX5VZPH-SUB-01');
  assert.equal(sub1AfterPrint?.printStatus, '已打印');
  assert.equal(sub1AfterPrint?.printCount, 1);

  const reprintResult = await mockBatchService.reprintPackagingRecord(batchId, record.id, '标签污损', 'admin');
  assert.equal(reprintResult.success, true);
  const subsAfterReprint = await mockBatchService.getSubBatches(batchId);
  const sub1AfterReprint = subsAfterReprint.find(s => s.sublotId === 'BATCHX5VZPH-SUB-01');
  assert.equal(sub1AfterReprint?.printCount, 2);

  const records = await mockBatchService.getPackagingRecords(batchId);
  assert.equal(records.length, 1);
  assert.equal(records[0].printCount, 2);
  assert.equal(records[0].reprints.length, 1);
  assert.equal(records[0].reprints[0].reason, '标签污损');

  console.log('mockBatchService packaging smoke test passed');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

Run: `cd "/Users/fupeggy/Downloads/project 4" && npx tsx src/components/BatchOperations/services/mockBatchService.smoke.ts`

Expected: FAIL（此时 `createPackagingRecord` 等方法尚不存在，TypeScript/运行时会报错，如 `mockBatchService.createPackagingRecord is not a function`）。

- [ ] **Step 3: 实现 mock service 方法**

在 `src/components/BatchOperations/services/mockBatchService.ts` 顶部，找到：

```ts
import { BatchData, SubBatchData, WaferData, WaferLossRecord } from '../types';
```

替换为：

```ts
import { BatchData, SubBatchData, WaferData, WaferLossRecord, PackagingRecord } from '../types';
```

找到：

```ts
// 批次备注
const _remarks: Record<string, string[]> = {};
// 操作历史
const _history: Record<string, any[]> = {};
```

替换为：

```ts
// 批次备注
const _remarks: Record<string, string[]> = {};
// 操作历史
const _history: Record<string, any[]> = {};
// 包装出货条码记录（按主批次 id 分组）
const _packagingRecords: Record<string, PackagingRecord[]> = {};
```

找到（写操作区块起始处）：

```ts
  // ── 写操作 ────────────────────────────────

  /** 出站确认 */
  confirmOutstation: async (batchId: string, _payload: any) => {
```

替换为（在其前插入四个新方法，`confirmOutstation` 保持不变）：

```ts
  // ── 写操作 ────────────────────────────────

  /** 获取指定主批次的包装出货条码记录 */
  getPackagingRecords: async (batchId: string): Promise<PackagingRecord[]> => {
    await delay();
    return _packagingRecords[batchId] || [];
  },

  /** 生成包装出货条码记录（支持合箱），并把子批次状态置为已包装 */
  createPackagingRecord: async (
    batchId: string,
    payload: {
      sublotIds: string[];
      carrierIds: string[];
      packagingBarcode: string;
      operator: string;
      remark?: string;
    }
  ): Promise<{ success: boolean; record: PackagingRecord }> => {
    await delay();
    const subs = _subBatches[batchId] || [];
    const totalQty = subs
      .filter(s => payload.sublotIds.includes(s.sublotId))
      .reduce((sum, s) => sum + s.totalQty, 0);

    const record: PackagingRecord = {
      id: `pkg-${Date.now()}`,
      packagingBarcode: payload.packagingBarcode,
      sublotIds: payload.sublotIds,
      carrierIds: payload.carrierIds,
      totalQty,
      operator: payload.operator,
      packagingTime: new Date().toISOString(),
      remark: payload.remark,
      printStatus: '未打印',
      printCount: 0,
      reprints: [],
    };

    if (!_packagingRecords[batchId]) _packagingRecords[batchId] = [];
    _packagingRecords[batchId].push(record);

    _subBatches[batchId] = subs.map(s =>
      payload.sublotIds.includes(s.sublotId)
        ? { ...s, packagingBarcode: record.packagingBarcode, packagingStatus: '已包装' as const, packagingTime: record.packagingTime }
        : s
    );

    _addHistory(batchId, `包装：生成出货条码 ${record.packagingBarcode}`);
    return { success: true, record };
  },

  /** 打印出货条码标签（mock） */
  printPackagingRecord: async (batchId: string, recordId: string): Promise<{ success: boolean }> => {
    await delay();
    const records = _packagingRecords[batchId] || [];
    const record = records.find(r => r.id === recordId);
    if (!record) return { success: false };

    record.printStatus = '已打印';
    record.printCount += 1;

    _subBatches[batchId] = (_subBatches[batchId] || []).map(s =>
      record.sublotIds.includes(s.sublotId)
        ? { ...s, printStatus: '已打印' as const, printCount: (s.printCount || 0) + 1 }
        : s
    );

    _addHistory(batchId, `打印出货条码 ${record.packagingBarcode}`);
    return { success: true };
  },

  /** 重打出货条码标签（需填重打原因） */
  reprintPackagingRecord: async (
    batchId: string,
    recordId: string,
    reason: string,
    operator: string
  ): Promise<{ success: boolean }> => {
    await delay();
    const records = _packagingRecords[batchId] || [];
    const record = records.find(r => r.id === recordId);
    if (!record) return { success: false };

    record.printCount += 1;
    record.reprints.push({
      id: `reprint-${Date.now()}`,
      reason,
      operator,
      time: new Date().toISOString(),
    });

    _subBatches[batchId] = (_subBatches[batchId] || []).map(s =>
      record.sublotIds.includes(s.sublotId)
        ? { ...s, printCount: (s.printCount || 0) + 1 }
        : s
    );

    _addHistory(batchId, `重打出货条码 ${record.packagingBarcode}（原因：${reason}）`);
    return { success: true };
  },

  /** 出站确认 */
  confirmOutstation: async (batchId: string, _payload: any) => {
```

- [ ] **Step 4: 重新运行 smoke 脚本，确认通过**

Run: `cd "/Users/fupeggy/Downloads/project 4" && npx tsx src/components/BatchOperations/services/mockBatchService.smoke.ts`

Expected: 输出 `mockBatchService packaging smoke test passed`，退出码 0。

- [ ] **Step 5: 类型检查**

Run: `cd "/Users/fupeggy/Downloads/project 4" && npx tsc --noEmit -p tsconfig.app.json`

Expected: 无新增报错。

- [ ] **Step 6: 删除临时 smoke 脚本**

```bash
rm "/Users/fupeggy/Downloads/project 4/src/components/BatchOperations/services/mockBatchService.smoke.ts"
```

- [ ] **Step 7: Commit**

```bash
cd "/Users/fupeggy/Downloads/project 4"
git add src/components/BatchOperations/data/mockOperators.ts src/components/BatchOperations/services/mockBatchService.ts
git commit -m "feat(packaging): add mock packaging record CRUD to mockBatchService

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: batchApiService 转发

**Files:**
- Modify: `src/components/BatchOperations/services/batchApiService.ts`
- Test（临时，验证后删除）: `src/components/BatchOperations/services/batchApiService.smoke.ts`

**Interfaces:**
- Consumes: `mockBatchService.createPackagingRecord/getPackagingRecords/printPackagingRecord/reprintPackagingRecord`（Task 2）
- Produces: `batchApiService.createPackagingRecord/getPackagingRecords/printPackagingRecord/reprintPackagingRecord`（与 mock 签名一致，`USE_MOCK_DATA` 开关下转发到 mock 或真实后端占位）

- [ ] **Step 1: 写 smoke 脚本，先确认它在实现前失败**

创建 `src/components/BatchOperations/services/batchApiService.smoke.ts`：

```ts
import assert from 'node:assert/strict';
import { batchApiService } from './batchApiService';

const batchId = '533e00f4-e470-480f-90c6-0b3612572bcd'; // BATCHX5VZPH

async function main() {
  const { record } = await batchApiService.createPackagingRecord(batchId, {
    sublotIds: ['BATCHX5VZPH-SUB-02'],
    carrierIds: ['CARXV002'],
    packagingBarcode: '000005-01',
    operator: 'admin',
  });
  assert.ok(record.id, '应返回带 id 的记录');

  const records = await batchApiService.getPackagingRecords(batchId);
  assert.ok(records.some(r => r.id === record.id), '新记录应能查到');

  console.log('batchApiService packaging forwarding smoke test passed');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

Run: `cd "/Users/fupeggy/Downloads/project 4" && npx tsx src/components/BatchOperations/services/batchApiService.smoke.ts`

Expected: FAIL（`batchApiService.createPackagingRecord is not a function`，因为 `batchApiService` 上尚未转发这些方法）。

- [ ] **Step 2: 在 `_realBatchApiService` 中新增占位方法**

在 `src/components/BatchOperations/services/batchApiService.ts` 中找到：

```ts
  /**
   * 更新晶圆打标信息
   */
  updateWaferMarking: (waferId: string, markingCode: string, markingStatus: string) =>
    request(`/wafers/${waferId}/marking`, {
      method: 'PUT',
      body: JSON.stringify({ markingCode, markingStatus }),
    }),
```

在它后面追加：

```ts

  /**
   * 获取包装出货条码记录列表
   */
  getPackagingRecords: (batchId: string) =>
    request(`/batch/${batchId}/packaging-records`),

  /**
   * 生成包装出货条码记录（支持合箱）
   */
  createPackagingRecord: (batchId: string, payload: any) =>
    request(`/batch/${batchId}/packaging-records`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * 打印出货条码标签
   */
  printPackagingRecord: (batchId: string, recordId: string) =>
    request(`/batch/${batchId}/packaging-records/${recordId}/print`, {
      method: 'POST',
    }),

  /**
   * 重打出货条码标签
   */
  reprintPackagingRecord: (batchId: string, recordId: string, reason: string, operator: string) =>
    request(`/batch/${batchId}/packaging-records/${recordId}/reprint`, {
      method: 'POST',
      body: JSON.stringify({ reason, operator }),
    }),
```

- [ ] **Step 3: 重新运行 smoke 脚本，确认通过**

Run: `cd "/Users/fupeggy/Downloads/project 4" && npx tsx src/components/BatchOperations/services/batchApiService.smoke.ts`

Expected: 输出 `batchApiService packaging forwarding smoke test passed`，退出码 0（`USE_MOCK_DATA = true`，实际调用的是 `mockBatchService`）。

- [ ] **Step 4: 类型检查**

Run: `cd "/Users/fupeggy/Downloads/project 4" && npx tsc --noEmit -p tsconfig.app.json`

Expected: 无新增报错。

- [ ] **Step 5: 删除临时 smoke 脚本**

```bash
rm "/Users/fupeggy/Downloads/project 4/src/components/BatchOperations/services/batchApiService.smoke.ts"
```

- [ ] **Step 6: Commit**

```bash
cd "/Users/fupeggy/Downloads/project 4"
git add src/components/BatchOperations/services/batchApiService.ts
git commit -m "feat(packaging): forward packaging record methods in batchApiService

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: 修复"进/出站"按钮的可用性门槛（预先存在的 bug，阻塞本功能）

**Files:**
- Modify: `src/components/BatchOperations/components/BatchListPage.tsx`

**Interfaces:**
- Consumes: 无新接口，纯条件表达式修改
- Produces: 无新接口

- [ ] **Step 1: 放开"加工中"状态下的按钮门槛**

在 `src/components/BatchOperations/components/BatchListPage.tsx` 中找到：

```ts
  // 检查过站按钮是否可用
  const isPassStationEnabled = selectedMasterBatchId !== null &&
  (batchList.find(b => b.id === selectedMasterBatchId)?.status === '待出站' ||
   batchList.find(b => b.id === selectedMasterBatchId)?.status === '待进站');
```

替换为：

```ts
  // 检查过站按钮是否可用
  // 注：'加工中' 也需要放开——handleSelectBatch 已经支持把 '加工中' 状态的批次
  // 路由到打标出站/各检验站点表单/包装出站表单，但此前这里没有对应放开，导致
  // 这些站点在 UI 上永远无法通过"进/出站"按钮进入。
  const isPassStationEnabled = selectedMasterBatchId !== null &&
  (batchList.find(b => b.id === selectedMasterBatchId)?.status === '待出站' ||
   batchList.find(b => b.id === selectedMasterBatchId)?.status === '待进站' ||
   batchList.find(b => b.id === selectedMasterBatchId)?.status === '加工中');
```

- [ ] **Step 2: 浏览器走查验证**

启动开发服务器（若未运行）：

```bash
cd "/Users/fupeggy/Downloads/project 4" && npm run dev
```

用 `browser-automation` skill（或手动浏览器）打开 `http://localhost:5173/`，导航到"批次作业"模块的批次列表页，在列表中找到 `batchCode` 为 `BATCHX5VZPH` 的批次（状态"加工中"，站点"包装"），点击选中该行。

Expected：
- 选中后，右侧"进/出站"按钮从禁用（灰色）变为可点击（蓝色）。
- 点击"进/出站"，弹出"出站操作"弹窗（此时内容仍是旧的晶圆信息/量测参数区块，因为 `PackagingSection` 还没接入——这是正常的，Task 7 才会替换）。
- 关闭弹窗，确认其它批次（如状态"待出站"/"待进站"的批次）的按钮行为无变化。

- [ ] **Step 3: Lint 检查**

Run: `cd "/Users/fupeggy/Downloads/project 4" && npm run lint`

Expected: 无新增报错（该文件原有的 lint 状态不变）。

- [ ] **Step 4: Commit**

```bash
cd "/Users/fupeggy/Downloads/project 4"
git add src/components/BatchOperations/components/BatchListPage.tsx
git commit -m "fix(batch-operations): enable pass-station button for in-process batches

进/出站按钮此前只对'待出站'/'待进站'状态放开，导致'加工中'状态下的打标出站/
包装出站等站点专属表单永远无法从 UI 进入。放开'加工中'状态，与
handleSelectBatch 的既有路由逻辑保持一致。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: PackagingSection 组件 —— 选择 / 防呆扫码 / 生成出货条码

**Files:**
- Create: `src/components/BatchOperations/components/PackagingSection.tsx`

**Interfaces:**
- Consumes: `BatchData`, `SubBatchData`, `PackagingRecord`（Task 1）；`batchApiService.getPackagingRecords/createPackagingRecord`（Task 2/3）；`mockOperators`（Task 2）；`generatePackagingBarcode`（Task 1）
- Produces: `PackagingSection` 组件，props `{ selectedBatch: BatchData | null; subBatches: SubBatchData[]; onSubBatchesUpdated: (updated: SubBatchData[]) => void }`

- [ ] **Step 1: 创建组件文件**

创建 `src/components/BatchOperations/components/PackagingSection.tsx`：

```tsx
// src/components/BatchOperations/components/PackagingSection.tsx
import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { BatchData, SubBatchData, PackagingRecord } from '../types';
import { batchApiService } from '../services/batchApiService';
import { mockOperators } from '../data/mockOperators';
import { generatePackagingBarcode } from '../utils/packagingBarcode';

interface PackagingSectionProps {
  selectedBatch: BatchData | null;
  subBatches: SubBatchData[];
  onSubBatchesUpdated: (updated: SubBatchData[]) => void;
}

interface PendingCarrierItem {
  sublotId: string;
  carrierId: string;
  confirmed: boolean;
}

const PackagingSection: React.FC<PackagingSectionProps> = ({
  selectedBatch,
  subBatches,
  onSubBatchesUpdated,
}) => {
  const batchId = selectedBatch?.id || '';

  const [records, setRecords] = useState<PackagingRecord[]>([]);
  const [selectedSublotIds, setSelectedSublotIds] = useState<string[]>([]);
  const [confirmMode, setConfirmMode] = useState(false);
  const [pendingChecklist, setPendingChecklist] = useState<PendingCarrierItem[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [barcodeForm, setBarcodeForm] = useState<{ packagingBarcode: string; operator: string; remark: string } | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!batchId) {
      setRecords([]);
      return;
    }
    (async () => {
      const data = await batchApiService.getPackagingRecords(batchId);
      if (!cancelled) setRecords(data);
    })();
    return () => { cancelled = true; };
  }, [batchId]);

  const handleRowSelect = (sublotId: string) => {
    setSelectedSublotIds(prev =>
      prev.includes(sublotId) ? prev.filter(id => id !== sublotId) : [...prev, sublotId]
    );
  };

  const handleStartPackaging = () => {
    if (selectedSublotIds.length === 0) return;
    const checklist = subBatches
      .filter(sb => selectedSublotIds.includes(sb.sublotId))
      .map(sb => ({ sublotId: sb.sublotId, carrierId: sb.carrierId, confirmed: false }));
    setPendingChecklist(checklist);
    setConfirmMode(true);
    setScanError(null);
    setScanInput('');
    setBarcodeForm(null);
  };

  const handleScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const value = scanInput.trim();
    if (!value) return;

    const target = pendingChecklist.find(item => item.carrierId === value && !item.confirmed);
    if (!target) {
      setScanError(`片篮号「${value}」不在所选批次中，或已确认过`);
      setScanInput('');
      return;
    }

    const updated = pendingChecklist.map(item =>
      item.carrierId === value ? { ...item, confirmed: true } : item
    );
    setPendingChecklist(updated);
    setScanError(null);
    setScanInput('');

    if (updated.every(item => item.confirmed)) {
      const nextBarcode = generatePackagingBarcode(selectedBatch?.batchCode || '', records);
      setBarcodeForm({
        packagingBarcode: nextBarcode,
        operator: mockOperators[0]?.name || '',
        remark: '',
      });
    }
  };

  const handleCancelPackaging = () => {
    setConfirmMode(false);
    setPendingChecklist([]);
    setScanInput('');
    setScanError(null);
    setBarcodeForm(null);
  };

  const handleConfirmCreateRecord = async () => {
    if (!barcodeForm || !barcodeForm.packagingBarcode.trim() || !batchId) return;
    setIsSubmitting(true);
    try {
      const carrierIds = pendingChecklist.map(item => item.carrierId);
      const { record } = await batchApiService.createPackagingRecord(batchId, {
        sublotIds: selectedSublotIds,
        carrierIds,
        packagingBarcode: barcodeForm.packagingBarcode.trim(),
        operator: barcodeForm.operator,
        remark: barcodeForm.remark || undefined,
      });

      setRecords(prev => [...prev, record]);

      const updatedSubBatches = subBatches.map(sb =>
        selectedSublotIds.includes(sb.sublotId)
          ? { ...sb, packagingBarcode: record.packagingBarcode, packagingStatus: '已包装' as const, packagingTime: record.packagingTime }
          : sb
      );
      onSubBatchesUpdated(updatedSubBatches);

      setSelectedSublotIds([]);
      handleCancelPackaging();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 border-b">
      <h2 className="text-base font-medium mb-4 text-gray-700">包装打印</h2>

      <div className="border rounded-lg overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="py-2 px-4 w-10 text-left"></th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">子批次号</th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">载具编码</th>
              <th className="py-2 px-4 text-center text-gray-700 font-medium">片数</th>
              <th className="py-2 px-4 text-center text-gray-700 font-medium">包装状态</th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">出货条码</th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">包装时间</th>
              <th className="py-2 px-4 text-center text-gray-700 font-medium">打印状态</th>
              <th className="py-2 px-4 text-center text-gray-700 font-medium">打印次数</th>
            </tr>
          </thead>
          <tbody>
            {subBatches.length > 0 ? (
              subBatches.map((sb, index) => (
                <tr key={sb.sublotId} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-2 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedSublotIds.includes(sb.sublotId)}
                      disabled={sb.packagingStatus === '已包装'}
                      onChange={() => handleRowSelect(sb.sublotId)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </td>
                  <td className="py-2 px-4">{sb.sublotId}</td>
                  <td className="py-2 px-4">{sb.carrierId}</td>
                  <td className="py-2 px-4 text-center">{sb.totalQty}</td>
                  <td className="py-2 px-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${sb.packagingStatus === '已包装' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {sb.packagingStatus || '待包装'}
                    </span>
                  </td>
                  <td className="py-2 px-4">{sb.packagingBarcode || '-'}</td>
                  <td className="py-2 px-4">{sb.packagingTime ? new Date(sb.packagingTime).toLocaleString() : '-'}</td>
                  <td className="py-2 px-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${sb.printStatus === '已打印' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {sb.printStatus || '未打印'}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-center">{sb.printCount || 0}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!confirmMode && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleStartPackaging}
            disabled={selectedSublotIds.length === 0}
            className={`inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium ${
              selectedSublotIds.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Package className="w-4 h-4 mr-2" />
            包装
          </button>
        </div>
      )}

      {confirmMode && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">防呆确认：请依次扫描/输入实际片篮号</h3>
          <ul className="space-y-1 mb-3">
            {pendingChecklist.map(item => (
              <li key={item.carrierId} className="text-sm flex items-center">
                <span className={`inline-block w-4 h-4 mr-2 rounded-full text-center text-xs leading-4 ${item.confirmed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {item.confirmed ? '✓' : ''}
                </span>
                {item.sublotId}（{item.carrierId}）
              </li>
            ))}
          </ul>
          <input
            type="text"
            value={scanInput}
            onChange={e => setScanInput(e.target.value)}
            onKeyDown={handleScanKeyDown}
            placeholder="扫描或输入片篮号，回车确认"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {scanError && <p className="text-sm text-red-600 mt-2">{scanError}</p>}
          <div className="flex justify-end mt-3">
            <button onClick={handleCancelPackaging} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
              取消
            </button>
          </div>
        </div>
      )}

      {barcodeForm && (
        <div className="border border-blue-200 bg-blue-50 rounded-md p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">出货条码</label>
              <input
                type="text"
                value={barcodeForm.packagingBarcode}
                onChange={e => setBarcodeForm({ ...barcodeForm, packagingBarcode: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">包装人员</label>
              <select
                value={barcodeForm.operator}
                onChange={e => setBarcodeForm({ ...barcodeForm, operator: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                {mockOperators.map(op => (
                  <option key={op.id} value={op.name}>{op.name}({op.id})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={barcodeForm.remark}
              onChange={e => setBarcodeForm({ ...barcodeForm, remark: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="备注（可选）"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button onClick={handleCancelPackaging} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
              取消
            </button>
            <button
              onClick={handleConfirmCreateRecord}
              disabled={isSubmitting || !barcodeForm.packagingBarcode.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '处理中...' : '确定'}
            </button>
          </div>
        </div>
      )}

      <h3 className="text-sm font-medium text-gray-700 mb-2">出货条码列表</h3>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="py-2 px-4 w-10"></th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">出货条码</th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">包装时间</th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">包装人员</th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">子批次号</th>
              <th className="py-2 px-4 text-center text-gray-700 font-medium">总片数</th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">备注</th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? (
              records.map(record => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 text-center">
                    <input
                      type="radio"
                      checked={selectedRecordId === record.id}
                      onChange={() => setSelectedRecordId(record.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300"
                    />
                  </td>
                  <td className="py-2 px-4">{record.packagingBarcode}</td>
                  <td className="py-2 px-4">{new Date(record.packagingTime).toLocaleString()}</td>
                  <td className="py-2 px-4">{record.operator}</td>
                  <td className="py-2 px-4">{record.sublotIds.join(', ')}</td>
                  <td className="py-2 px-4 text-center">{record.totalQty}</td>
                  <td className="py-2 px-4">{record.remark || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PackagingSection;
```

- [ ] **Step 2: 类型检查**

Run: `cd "/Users/fupeggy/Downloads/project 4" && npx tsc --noEmit -p tsconfig.app.json`

Expected: 无新增报错。此时组件还未被任何页面引用，属正常的"未使用变量"以外不应有类型错误（`PackagingSection` 未被 import 不会产生 TS 报错）。

- [ ] **Step 3: Lint 检查**

Run: `cd "/Users/fupeggy/Downloads/project 4" && npm run lint`

Expected: 无新增报错。

- [ ] **Step 4: Commit**

```bash
cd "/Users/fupeggy/Downloads/project 4"
git add src/components/BatchOperations/components/PackagingSection.tsx
git commit -m "feat(packaging): add PackagingSection selection + scan-confirm + barcode creation

组件尚未接入 OutstationForm，交互式浏览器验证在 Task 7 统一进行。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: PackagingSection 组件 —— 打印 / 重打

**Files:**
- Modify: `src/components/BatchOperations/components/PackagingSection.tsx`

**Interfaces:**
- Consumes: `batchApiService.printPackagingRecord/reprintPackagingRecord`（Task 2/3）、`BatchOperationModal`（已有组件）
- Produces: `PackagingSection` 组件新增"打印出货条码"、逐行"重打"能力（props 签名不变）

- [ ] **Step 1: 扩展 import**

在 `src/components/BatchOperations/components/PackagingSection.tsx` 中找到：

```tsx
import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { BatchData, SubBatchData, PackagingRecord } from '../types';
import { batchApiService } from '../services/batchApiService';
import { mockOperators } from '../data/mockOperators';
import { generatePackagingBarcode } from '../utils/packagingBarcode';
```

替换为：

```tsx
import React, { useEffect, useState } from 'react';
import { Package, Printer, RotateCcw } from 'lucide-react';
import { BatchData, SubBatchData, PackagingRecord } from '../types';
import { batchApiService } from '../services/batchApiService';
import { mockOperators } from '../data/mockOperators';
import { generatePackagingBarcode } from '../utils/packagingBarcode';
import BatchOperationModal from './BatchOperationModal';
```

- [ ] **Step 2: 新增 state**

找到：

```tsx
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
```

替换为：

```tsx
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [reprintTarget, setReprintTarget] = useState<{ sublotId: string; recordId: string } | null>(null);
  const [reprintReason, setReprintReason] = useState('');
```

- [ ] **Step 3: 新增打印/重打处理函数**

找到 `handleConfirmCreateRecord` 函数结尾处：

```tsx
      setSelectedSublotIds([]);
      handleCancelPackaging();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
```

替换为：

```tsx
      setSelectedSublotIds([]);
      handleCancelPackaging();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintSelectedRecord = async () => {
    if (!selectedRecordId || !batchId) return;
    const record = records.find(r => r.id === selectedRecordId);
    if (!record || record.printStatus === '已打印') return;

    setIsPrinting(true);
    try {
      await batchApiService.printPackagingRecord(batchId, selectedRecordId);

      console.log('--- 打印出货条码标签 ---');
      console.log(`出货条码: ${record.packagingBarcode}`);
      console.log(`子批次: ${record.sublotIds.join(', ')}`);
      console.log(`片数: ${record.totalQty}`);
      console.log('-----------------------');

      setRecords(prev => prev.map(r =>
        r.id === selectedRecordId ? { ...r, printStatus: '已打印' as const, printCount: r.printCount + 1 } : r
      ));
      onSubBatchesUpdated(subBatches.map(sb =>
        record.sublotIds.includes(sb.sublotId)
          ? { ...sb, printStatus: '已打印' as const, printCount: (sb.printCount || 0) + 1 }
          : sb
      ));
    } finally {
      setIsPrinting(false);
    }
  };

  const handleOpenReprint = (sb: SubBatchData) => {
    const record = records.find(r => r.sublotIds.includes(sb.sublotId));
    if (!record) return;
    setReprintTarget({ sublotId: sb.sublotId, recordId: record.id });
    setReprintReason('');
  };

  const handleConfirmReprint = async () => {
    if (!reprintTarget || !reprintReason.trim() || !batchId) return;
    const operator = mockOperators[0]?.name || '';
    const record = records.find(r => r.id === reprintTarget.recordId);
    if (!record) return;

    await batchApiService.reprintPackagingRecord(batchId, reprintTarget.recordId, reprintReason.trim(), operator);

    console.log(`--- 重打标签：${record.packagingBarcode}，原因：${reprintReason.trim()} ---`);

    setRecords(prev => prev.map(r =>
      r.id === reprintTarget.recordId
        ? {
            ...r,
            printCount: r.printCount + 1,
            reprints: [...r.reprints, { id: `reprint-${r.printCount + 1}`, reason: reprintReason.trim(), operator, time: new Date().toISOString() }],
          }
        : r
    ));
    onSubBatchesUpdated(subBatches.map(sb =>
      record.sublotIds.includes(sb.sublotId)
        ? { ...sb, printCount: (sb.printCount || 0) + 1 }
        : sb
    ));

    setReprintTarget(null);
    setReprintReason('');
  };

  return (
```

- [ ] **Step 4: 包装打印表格新增"操作"列**

找到表头：

```tsx
              <th className="py-2 px-4 text-center text-gray-700 font-medium">打印状态</th>
              <th className="py-2 px-4 text-center text-gray-700 font-medium">打印次数</th>
            </tr>
          </thead>
```

替换为：

```tsx
              <th className="py-2 px-4 text-center text-gray-700 font-medium">打印状态</th>
              <th className="py-2 px-4 text-center text-gray-700 font-medium">打印次数</th>
              <th className="py-2 px-4 text-center text-gray-700 font-medium">操作</th>
            </tr>
          </thead>
```

找到表格行末尾：

```tsx
                  <td className="py-2 px-4 text-center">{sb.printCount || 0}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">暂无数据</td>
              </tr>
            )}
```

替换为：

```tsx
                  <td className="py-2 px-4 text-center">{sb.printCount || 0}</td>
                  <td className="py-2 px-4 text-center">
                    {sb.printStatus === '已打印' && (
                      <button
                        onClick={() => handleOpenReprint(sb)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded hover:bg-orange-200"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        重打
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500">暂无数据</td>
              </tr>
            )}
```

- [ ] **Step 5: 出货条码列表新增"打印出货条码"按钮 + 重打原因弹窗**

找到：

```tsx
      <h3 className="text-sm font-medium text-gray-700 mb-2">出货条码列表</h3>
      <div className="border rounded-lg overflow-hidden">
```

替换为：

```tsx
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">出货条码列表</h3>
        <button
          onClick={handlePrintSelectedRecord}
          disabled={
            !selectedRecordId ||
            isPrinting ||
            records.find(r => r.id === selectedRecordId)?.printStatus === '已打印'
          }
          className={`inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium ${
            selectedRecordId && records.find(r => r.id === selectedRecordId)?.printStatus !== '已打印'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Printer className="w-4 h-4 mr-2" />
          {isPrinting ? '打印中...' : '打印出货条码'}
        </button>
      </div>
      <div className="border rounded-lg overflow-hidden">
```

在文件末尾，找到：

```tsx
        </table>
      </div>
    </div>
  );
};

export default PackagingSection;
```

替换为：

```tsx
        </table>
      </div>

      <BatchOperationModal
        isOpen={!!reprintTarget}
        title="重打标签"
        onClose={() => setReprintTarget(null)}
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">重打原因</label>
            <textarea
              value={reprintReason}
              onChange={e => setReprintReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="如：标签污损、字迹模糊..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button onClick={() => setReprintTarget(null)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
              取消
            </button>
            <button
              onClick={handleConfirmReprint}
              disabled={!reprintReason.trim()}
              className={`px-4 py-2 rounded-md text-sm font-medium ${reprintReason.trim() ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              确认重打
            </button>
          </div>
        </div>
      </BatchOperationModal>
    </div>
  );
};

export default PackagingSection;
```

- [ ] **Step 6: 类型检查 + Lint**

Run:
```bash
cd "/Users/fupeggy/Downloads/project 4"
npx tsc --noEmit -p tsconfig.app.json
npm run lint
```

Expected: 两条命令均无新增报错。

- [ ] **Step 7: Commit**

```bash
cd "/Users/fupeggy/Downloads/project 4"
git add src/components/BatchOperations/components/PackagingSection.tsx
git commit -m "feat(packaging): add print and reprint-with-reason to PackagingSection

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: 接入 OutstationForm，联动确认出站，删除孤儿组件，端到端验证

**Files:**
- Modify: `src/components/BatchOperations/components/OutstationForm.tsx`
- Modify: `src/components/BatchOperations/BatchOperationsModule.tsx`
- Delete: `src/components/BatchOperations/components/PackagingModule.tsx`

**Interfaces:**
- Consumes: `PackagingSection`（Task 5/6）
- Produces: `OutstationForm` 新增 prop `onSubBatchesUpdated: (updated: SubBatchData[]) => void`

- [ ] **Step 1: `OutstationForm.tsx` 增加 prop 与 import**

找到：

```tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import EquipmentStationInfo from './EquipmentStationInfo';
import BatchInfoDisplay from './BatchInfoDisplay';
import WaferBasketReorganizationModule from './WaferBasketReorganizationModule';
import ProcessParameters from './ProcessParameters';
import { BatchData, SubBatchData, WaferData, CarrierData } from '../types';
import { batchApiService } from '../services/batchApiService';

interface OutstationFormProps {
  selectedBatch: BatchData | null;
  displayedFormSubBatches: SubBatchData[];
  getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>;
  getStatusColor: (status: string) => string;
  handleBackToBatchList: () => void;
  handleConfirmOutstation: () => Promise<void>;
  currentBatchRemarks: string[];
  currentFormType: string;
}

const OutstationForm: React.FC<OutstationFormProps> = ({
  selectedBatch,
  displayedFormSubBatches,
  getSubBatchesForMaster,
  getStatusColor,
  handleBackToBatchList,
  handleConfirmOutstation,
  currentBatchRemarks,
  currentFormType,
}) => {
```

替换为：

```tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import EquipmentStationInfo from './EquipmentStationInfo';
import BatchInfoDisplay from './BatchInfoDisplay';
import WaferBasketReorganizationModule from './WaferBasketReorganizationModule';
import ProcessParameters from './ProcessParameters';
import PackagingSection from './PackagingSection';
import { BatchData, SubBatchData, WaferData, CarrierData } from '../types';
import { batchApiService } from '../services/batchApiService';

interface OutstationFormProps {
  selectedBatch: BatchData | null;
  displayedFormSubBatches: SubBatchData[];
  getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>;
  getStatusColor: (status: string) => string;
  handleBackToBatchList: () => void;
  handleConfirmOutstation: () => Promise<void>;
  currentBatchRemarks: string[];
  currentFormType: string;
  onSubBatchesUpdated: (updated: SubBatchData[]) => void;
}

const OutstationForm: React.FC<OutstationFormProps> = ({
  selectedBatch,
  displayedFormSubBatches,
  getSubBatchesForMaster,
  getStatusColor,
  handleBackToBatchList,
  handleConfirmOutstation,
  currentBatchRemarks,
  currentFormType,
  onSubBatchesUpdated,
}) => {
```

- [ ] **Step 2: 按站点分支渲染，隐藏晶圆信息/量测参数**

找到：

```tsx
  return (
    <>
        {/* Main content card */}
        <div className="bg-white rounded-lg shadow-sm mb-4">
          {/* 设备&站点 Section */}
          <EquipmentStationInfo selectedBatch={selectedBatch} />

          {/* 批次信息 Section */}
          <BatchInfoDisplay
            selectedBatch={selectedBatch}
            getSubBatchesForMaster={getSubBatchesForMaster}
            getStatusColor={getStatusColor}
            subBatches={displayedFormSubBatches}
          />

          {/* 晶圆信息 Section - 只读展示当前子批次及片详情 */}
          <WaferBasketReorganizationModule
            initialSourceCarriers={sourceCarriersForReorganization}
            initialWafers={wafersForCurrentForm}
            selectedMode=""
            onReorganizationStateChange={() => {}}
            readOnlyWaferDetails={true}
            hideTargetSection={true}
            hideTransferButtons={true}
            showBatchActionButtons={true}
            disableBatchWaferTypeActions={true}
            disableWaferTypeSelection={true}
            isDefectEntryMode={false}
          />
          {/* 量测参数 Section */}
          <div className="p-1 border-b">
            <ProcessParameters
              wafers={wafersForCurrentForm}
              station={selectedBatch?.station || ''}
            />
          </div>

          {/* 批次备注 Section */}
```

替换为：

```tsx
  const isPackagingStation = selectedBatch?.station === '包装';
  const hasUnprintedSubBatch = displayedFormSubBatches.some(sb => sb.printStatus !== '已打印');
  const isOutstationBlockedByPrinting = isPackagingStation && hasUnprintedSubBatch;

  return (
    <>
        {/* Main content card */}
        <div className="bg-white rounded-lg shadow-sm mb-4">
          {/* 设备&站点 Section */}
          <EquipmentStationInfo selectedBatch={selectedBatch} />

          {/* 批次信息 Section */}
          <BatchInfoDisplay
            selectedBatch={selectedBatch}
            getSubBatchesForMaster={getSubBatchesForMaster}
            getStatusColor={getStatusColor}
            subBatches={displayedFormSubBatches}
          />

          {isPackagingStation ? (
            /* 包装打印 Section - 包装站点专属，替代晶圆信息/量测参数 */
            <PackagingSection
              selectedBatch={selectedBatch}
              subBatches={displayedFormSubBatches}
              onSubBatchesUpdated={onSubBatchesUpdated}
            />
          ) : (
            <>
              {/* 晶圆信息 Section - 只读展示当前子批次及片详情 */}
              <WaferBasketReorganizationModule
                initialSourceCarriers={sourceCarriersForReorganization}
                initialWafers={wafersForCurrentForm}
                selectedMode=""
                onReorganizationStateChange={() => {}}
                readOnlyWaferDetails={true}
                hideTargetSection={true}
                hideTransferButtons={true}
                showBatchActionButtons={true}
                disableBatchWaferTypeActions={true}
                disableWaferTypeSelection={true}
                isDefectEntryMode={false}
              />
              {/* 量测参数 Section */}
              <div className="p-1 border-b">
                <ProcessParameters
                  wafers={wafersForCurrentForm}
                  station={selectedBatch?.station || ''}
                />
              </div>
            </>
          )}

          {/* 批次备注 Section */}
```

- [ ] **Step 3: "确认出站"按钮联动禁用**

找到：

```tsx
            <button
              onClick={handleConfirmOutstationClick}
              disabled={isConfirming}
              className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isConfirming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  处理中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  确认出站
                </>
              )}
            </button>
          </div>
        </div>
    </>
  );
};
```

替换为：

```tsx
            <div className="flex flex-col items-end">
              <button
                onClick={handleConfirmOutstationClick}
                disabled={isConfirming || isOutstationBlockedByPrinting}
                className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isConfirming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    处理中...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    确认出站
                  </>
                )}
              </button>
              {isOutstationBlockedByPrinting && (
                <p className="text-xs text-red-600 mt-1">还有未打印标签的子批次，无法确认出站</p>
              )}
            </div>
          </div>
        </div>
    </>
  );
};
```

- [ ] **Step 4: `BatchOperationsModule.tsx` 透传 `setDisplayedFormSubBatches`**

找到：

```tsx
    currentFormType,
    selectedBatch,
    displayedFormSubBatches,
    cancellationReason,
```

替换为：

```tsx
    currentFormType,
    selectedBatch,
    displayedFormSubBatches,
    setDisplayedFormSubBatches,
    cancellationReason,
```

找到：

```tsx
      {/* 出站操作 */}
      <BatchOperationModal
        isOpen={currentFormType === 'outstation'}
        title="出站操作"
        onClose={handleBackToBatchList}
      >
        <OutstationForm
          selectedBatch={selectedBatch}
          displayedFormSubBatches={displayedFormSubBatches}
          getSubBatchesForMaster={getSubBatchesForMaster}
          getStatusColor={getStatusColor}
          handleBackToBatchList={handleBackToBatchList}
          handleConfirmOutstation={batchOperationsContext.handleConfirmOutstation}
          currentBatchRemarks={currentBatchRemarks}
          currentFormType={currentFormType}
        />
      </BatchOperationModal>
```

替换为：

```tsx
      {/* 出站操作 */}
      <BatchOperationModal
        isOpen={currentFormType === 'outstation'}
        title="出站操作"
        onClose={handleBackToBatchList}
      >
        <OutstationForm
          selectedBatch={selectedBatch}
          displayedFormSubBatches={displayedFormSubBatches}
          getSubBatchesForMaster={getSubBatchesForMaster}
          getStatusColor={getStatusColor}
          handleBackToBatchList={handleBackToBatchList}
          handleConfirmOutstation={batchOperationsContext.handleConfirmOutstation}
          currentBatchRemarks={currentBatchRemarks}
          currentFormType={currentFormType}
          onSubBatchesUpdated={setDisplayedFormSubBatches}
        />
      </BatchOperationModal>
```

- [ ] **Step 5: 删除孤儿组件**

```bash
rm "/Users/fupeggy/Downloads/project 4/src/components/BatchOperations/components/PackagingModule.tsx"
```

确认无残留引用：

Run: `cd "/Users/fupeggy/Downloads/project 4" && grep -rn "PackagingModule" src/`

Expected: 无输出（`PackagingModule.tsx` 原本就没有被任何文件 import，删除后自然无引用）。

- [ ] **Step 6: 类型检查 + Lint**

Run:
```bash
cd "/Users/fupeggy/Downloads/project 4"
npx tsc --noEmit -p tsconfig.app.json
npm run lint
```

Expected: 两条命令均无新增报错。

- [ ] **Step 7: 端到端浏览器走查（完整流程）**

启动开发服务器（若未运行）：`cd "/Users/fupeggy/Downloads/project 4" && npm run dev`

用 `browser-automation` skill（或手动浏览器）打开 `http://localhost:5173/`，导航到批次作业模块的批次列表页，执行以下步骤并逐条核对：

1. 选中 `batchCode` 为 `BATCHX5VZPH` 的批次行，点击"进/出站"。
   - **核对**：弹出"出站操作"，不再显示晶圆信息/量测参数区块，显示"包装打印"表格，13 行子批次，全部"待包装"/"未打印"，"确认出站"按钮为禁用态且下方有"还有未打印标签的子批次，无法确认出站"提示。
2. 勾选 `BATCHX5VZPH-SUB-01` 和 `BATCHX5VZPH-SUB-02` 两行（合箱），点击"包装"。
   - **核对**：出现防呆确认区，列出两个待确认片篮号 `CARXV001`、`CARXV002`，均未打勾。
3. 在扫描框输入 `CARXV999`（不存在的片篮号）回车。
   - **核对**：显示错误提示"片篮号「CARXV999」不在所选批次中，或已确认过"，两项仍未打勾。
4. 输入 `CARXV001` 回车，再输入 `CARXV002` 回车。
   - **核对**：两项均变绿打勾；全部确认后自动出现"出货条码"表单区，出货条码预填为 `000005-01`（格式化后的批次号数字部分 + 序号 01），包装人员默认 `admin`。
5. 将出货条码改为 `SHIP-TEST-01`，备注填"合箱测试"，点击"确定"。
   - **核对**：防呆确认区与出货条码表单区收起；"包装打印"表格中 SUB-01、SUB-02 两行"包装状态"变为"已包装"，"出货条码"列显示 `SHIP-TEST-01`；下方"出货条码列表"新增一行，子批次号列显示 `BATCHX5VZPH-SUB-01, BATCHX5VZPH-SUB-02`，总片数 50。
6. 在"出货条码列表"里点中刚生成的那一行（radio），点击"打印出货条码"。
   - **核对**：按钮短暂显示"打印中..."后恢复；"包装打印"表格中 SUB-01、SUB-02 两行"打印状态"变为"已打印"，"打印次数"变为 1，且各自"操作"列出现"重打"按钮；"打印出货条码"按钮变为禁用态（该记录已打印）。
7. 点击 SUB-01 行的"重打"按钮，在弹窗中不填原因直接点"确认重打"。
   - **核对**："确认重打"按钮为禁用态（原因必填），无法提交。
8. 填写重打原因"标签污损"，点击"确认重打"。
   - **核对**：弹窗关闭；SUB-01、SUB-02 两行"打印次数"变为 2（因为合箱共用一条出货条码记录）。
9. 勾选其余 11 个未包装子批次（可分批勾选多次重复步骤 2-6），直至全部 13 个子批次都变为"已打印"。
   - **核对**：全部完成后，"确认出站"按钮从禁用变为可点击，禁用提示消失。
10. 点击"确认出站"。
    - **核对**：弹窗关闭，返回批次列表，`BATCHX5VZPH` 从"加工中"批次列表中消失（状态变为"已出站"）。

- [ ] **Step 8: Commit**

```bash
cd "/Users/fupeggy/Downloads/project 4"
git add src/components/BatchOperations/components/OutstationForm.tsx src/components/BatchOperations/BatchOperationsModule.tsx
git rm src/components/BatchOperations/components/PackagingModule.tsx
git commit -m "feat(packaging): wire PackagingSection into OutstationForm for packaging station

- 包装站点隐藏晶圆信息/量测参数区块，改为渲染包装打印区块
- 确认出站按钮在有未打印子批次时禁用
- 删除未被引用的旧 PackagingModule 孤儿组件

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 完成后自查清单

- [ ] `git log --oneline` 能看到 7 个任务对应的 7 个提交（Task 1-7 各一个）
- [ ] `npx tsc --noEmit -p tsconfig.app.json` 全仓库无新增报错
- [ ] `npm run lint` 全仓库无新增报错
- [ ] `npm run build` 能成功产出构建（`vite build`）
- [ ] 无任何 `*.smoke.ts` 临时文件被提交到 git（`git status` 确认工作区干净）
- [ ] Task 7 的端到端走查全部 10 步均按预期通过
