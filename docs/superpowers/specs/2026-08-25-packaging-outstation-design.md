# 包装出站表单设计

- 日期：2026-08-25
- 状态：已批准设计，待写实施计划
- 关联模块：`src/components/BatchOperations`

## 背景与目标

现有出站流程（[OutstationForm.tsx](../../../src/components/BatchOperations/components/OutstationForm.tsx)）没有覆盖"包装"这一站点的业务：现场人员需要把子批次按盒装入包装盒，生成包装条码（即出货条码）并打印标签，且需要对已打印但标签污损的子批次支持重打。

本设计新增一个挂载在出站表单内的"包装打印"区块，覆盖：
1. 选中子批次 → 手动/扫码输入实际片篮号防呆确认 → 生成出货条码
2. 打印出货条码标签（mock）
3. 对已打印记录重打标签（需填重打原因）
4. 出货条码支持合箱（一个出货条码可关联多个子批次）

参考截图：出站弹窗内含"包装打印"表格（子批次号/载具编码/片数/包装状态/出货条码/包装时间/打印状态/打印次数/操作）+ 出货条码新增表单（出货条码/包装人员/包装时间/备注）+ 出货条码列表（汇总视图，单选+打印）。

## 现状调研结论

- 出站表单入口：`BatchListPage.tsx` "进/出站"按钮 → `useBatchOperationsHandlers.ts` 的 `handleSelectBatch`（[useBatchOperationsHandlers.ts:47-90](../../../src/components/BatchOperations/hooks/useBatchOperationsHandlers.ts#L47-L90)）按 `batch.status`/`batch.station` 路由 `currentFormType`。
- **`station === '包装'` 的批次已天然落入 `outstation` 分支**（第 74-79 行的兜底 else），mock 数据中已存在这类批次（`data/mockSubBatches.ts` 的 `BATCHX5VZPH` 系列，`station: '包装'`）。因此**不需要新增触发逻辑**，只需在 `OutstationForm.tsx` 内按 `selectedBatch?.station === '包装'` 条件分支渲染。
- 现有孤儿组件 `PackagingModule.tsx`（未被任何页面引用）是"选中即生成条码"的旧雏形，不含防呆扫码、合箱、重打，**本次不复用，实施时删除**。
- 打印目前全项目都是 mock（`console.log` + 状态字段），没有真实打印机对接，本设计延续这个约定。
- 项目没有全局登录用户 / Auth Context（`currentUser` 目前只在个别组件里以 props 硬传，且是未接线的示例代码）。"包装人员"字段采用 mock 常量 + 下拉可切换的方式实现，不依赖真实登录态。
- 扫码/枪输入的既有模式参考 `src/components/FinishedProduct/OutboundConfirmationModal.tsx:253-268`（`onKeyPress`/回车触发查找+入列表），本设计沿用相同交互（建议在新代码里改用未废弃的 `onKeyDown`）。

## 数据模型

### 类型扩展（`src/components/BatchOperations/types.ts`）

```ts
export interface SubBatchData {
  // ...已有字段不变
  packagingStatus?: '待包装' | '已包装';   // 新增：包装状态，默认 '待包装'
  printStatus?: '未打印' | '已打印';       // 新增：标签打印状态，默认 '未打印'
  printCount?: number;                     // 新增：打印次数，默认 0
  packagingTime?: string;                  // 新增：包装完成时间
  // packagingBarcode 字段已存在，复用
}

export interface ReprintLog {
  id: string;
  reason: string;      // 重打原因，必填
  operator: string;    // 操作人
  time: string;         // 重打时间
}

export interface PackagingRecord {
  id: string;
  packagingBarcode: string;   // 出货条码（=包装条码）
  sublotIds: string[];        // 关联子批次 sublotId，支持合箱（长度 >= 1）
  carrierIds: string[];       // 关联片篮号，与 sublotIds 一一对应
  totalQty: number;           // 合计片数
  operator: string;           // 包装人员
  packagingTime: string;      // 包装时间
  remark?: string;
  printStatus: '未打印' | '已打印';
  printCount: number;
  reprints: ReprintLog[];
}
```

### mock 数据/人员来源

- 新增 `src/components/BatchOperations/data/mockOperators.ts`：`[{ id: '0001', name: 'admin' }, ...]`，供"包装人员"下拉使用，默认选中列表第一项模拟"当前登录用户"。
- `PackagingRecord` 列表运行时从已包装子批次派生/存储在 mock service 内存数组（`_packagingRecords`），不需要预置种子数据（初始为空，由用户操作产生）。

## 交互流程详解

### 组件结构

新增 `src/components/BatchOperations/components/PackagingSection.tsx`，props：

```ts
interface PackagingSectionProps {
  selectedBatch: BatchData | null;
  subBatches: SubBatchData[];               // = displayedFormSubBatches
  onSubBatchesUpdated: (updated: SubBatchData[]) => void; // 回写到表单级 state
}
```

嵌入点：`OutstationForm.tsx`，当 `selectedBatch?.station === '包装'` 时：
- 隐藏 `WaferBasketReorganizationModule`（晶圆信息）与 `ProcessParameters`（量测参数）两个区块
- 在原位置渲染 `<PackagingSection selectedBatch={selectedBatch} subBatches={displayedFormSubBatches} onSubBatchesUpdated={...} />`
- 其余区块（批次备注、底部取消/确认出站按钮）保持不变，但"确认出站"按钮增加联动规则（见下）

### 状态机（`PackagingSection` 内部 state）

```
selectedSublotIds: string[]              // 包装打印表格勾选的子批次
confirmMode: boolean                     // 是否处于"防呆扫码确认"态
pendingCarrierChecklist: { sublotId, carrierId, confirmed: boolean }[]
scanInput: string                        // 扫码/输入框当前值
barcodeForm: { packagingBarcode, operator, remark } | null  // 全部确认后展开
```

流程：

1. **勾选**：包装打印表格里，仅 `packagingStatus !== '已包装'` 的行可勾选（复选框），可多选（合箱）。
2. **点击"包装"**：`selectedSublotIds.length === 0` 时按钮禁用。点击后 `confirmMode = true`，`pendingCarrierChecklist` 按选中子批次的 `carrierId` 初始化（全部 `confirmed: false`），渲染待确认清单 + 一个扫码/输入框。
3. **扫码/输入确认**：输入框回车（`onKeyDown`，`e.key === 'Enter'`）触发匹配：
   - 在 `pendingCarrierChecklist` 中查找 `carrierId === scanInput.trim()` 且 `confirmed === false` 的项
   - 命中：置为 `confirmed: true`，清空输入框
   - 未命中（不在清单里，或已确认过重复扫描）：提示错误（沿用页面内 toast/alert 风格，不阻断输入，允许重试）
   - 全部 `confirmed === true` 时，自动展开出货条码表单区（`barcodeForm` 初始化）
4. **出货条码表单**：
   - `packagingBarcode`：调用生成规则预填（见下），可编辑
   - `operator`：默认 `mockOperators[0]`，下拉可切换
   - `packagingTime`：只读展示当前时间（确定时取真实提交时刻）
   - `remark`：可选文本域
5. **点击"确定"**：
   - 校验 `packagingBarcode` 非空
   - 调用 `batchApiService.createPackagingRecord(payload)`
   - 成功后：`onSubBatchesUpdated` 回写所有关联子批次的 `packagingBarcode`/`packagingStatus='已包装'`/`packagingTime`；重置 `selectedSublotIds`/`confirmMode`/`pendingCarrierChecklist`/`barcodeForm`
6. **出货条码列表**（汇总视图，来自 `PackagingRecord[]`）：单选（radio，对齐截图），选中一条后"打印出货条码"按钮可用
7. **打印**：点击"打印出货条码" → `batchApiService.printPackagingRecord(recordId)` → mock（`console.log` 标签内容）→ 该记录及关联子批次 `printStatus='已打印'`，`printCount += 1`
8. **重打**：包装打印表格每行，仅 `printStatus === '已打印'` 时显示"重打"按钮。点击弹出小弹窗（沿用 `BatchOperationModal` 或简单内联弹层）要求填写"重打原因"（必填 textarea）。确认后：
   - 找到该子批次所属的 `PackagingRecord`
   - `batchApiService.reprintPackagingRecord(recordId, reason, operator)`
   - `printCount += 1`，`reprints` 追加一条日志，mock 打印

### 出货条码生成规则

`generatePackagingBarcode(batchCode: string, existingRecords: PackagingRecord[]): string`：
- 若当前批次已存在 `PackagingRecord`，复用其出货条码前缀，序号 = 现有记录数 + 1（两位数字，`01/02/...`）
- 若没有，前缀取 `batchCode` 去除非数字字符后的后 6 位（不足则左补0），序号从 `01` 开始
- 结果格式：`{prefix}-{seq:02d}`，纯前端展示用途，完全可编辑，不作为业务唯一性约束的强依赖（mock 阶段不做全局唯一性校验）

### "确认出站"联动规则

当 `selectedBatch?.station === '包装'` 时，"确认出站"按钮新增禁用条件：`subBatches.some(sb => sb.printStatus !== '已打印')` → disabled，并在按钮旁提示"还有未打印标签的子批次"。非包装站点的出站表单行为不变。

## Mock Service 扩展

`src/components/BatchOperations/services/mockBatchService.ts` 新增（遵循现有 `USE_MOCK_DATA` 开关与 `await delay()` 异步模拟约定，参考 `confirmOutstation` 写法）：

```ts
createPackagingRecord(payload: {
  sublotIds: string[]; packagingBarcode: string; operator: string; remark?: string;
}): Promise<{ success: boolean; record: PackagingRecord }>

printPackagingRecord(recordId: string): Promise<{ success: boolean }>

reprintPackagingRecord(recordId: string, reason: string, operator: string): Promise<{ success: boolean }>
```

`batchApiService.ts` 对应转发（与 `USE_MOCK_DATA` 开关下的 `_realBatchApiService` 占位一致，真实后端接口本次不实现，占位方法可直接抛 `Not implemented` 或复用 mock）。

## 文件改动清单

| 文件 | 改动 |
|---|---|
| `src/components/BatchOperations/types.ts` | 新增 `PackagingRecord`、`ReprintLog`；扩展 `SubBatchData` |
| `src/components/BatchOperations/components/PackagingSection.tsx` | 新建，核心交互组件 |
| `src/components/BatchOperations/components/OutstationForm.tsx` | 按 `station === '包装'` 分支隐藏晶圆/量测区块、插入 `PackagingSection`、"确认出站"按钮增加联动禁用规则 |
| `src/components/BatchOperations/services/mockBatchService.ts` | 新增 `createPackagingRecord`/`printPackagingRecord`/`reprintPackagingRecord`，内存数组 `_packagingRecords` |
| `src/components/BatchOperations/services/batchApiService.ts` | 转发上述三个方法（mock/real 切换） |
| `src/components/BatchOperations/data/mockOperators.ts` | 新建，包装人员下拉数据源 |
| `src/components/BatchOperations/components/PackagingModule.tsx` | 删除（孤儿组件，被新方案取代） |

## 范围之外（本次不做）

- 真实打印机 / 打印地址切换 / 标签模板对接
- 出货条码全局唯一性校验、与外部 ERP/发货系统联动
- 真实登录用户体系（包装人员用 mock 列表代替）
- "打标信息"按钮的详情弹窗（保留占位，不在本次范围）

## 测试注意

项目当前无测试框架（无 vitest/jest），验证方式为手动通过 `npm run dev` 走查交互流程：勾选子批次 → 包装 → 扫码防呆（含匹配失败场景）→ 生成条码 → 打印 → 重打 → 确认出站按钮的联动禁用/启用。
