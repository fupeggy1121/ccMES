# 生产异常批量管控（批量HOLD/释放）设计

- 日期：2026-08-26
- 状态：待用户审阅
- 关联模块：`src/components/BatchOperations`、`modules/ocap`、新增 `src/services/batchHold`

## 背景与目标

厂内各监控项目陆续上线 SPC，部分工序（如清洗设备的金属离子 monitor 片监控）监控频率较长（如 8 小时换液周期），一旦某次 monitor 检测异常（OOC/OOS），需要能快速锁定并管控该时间窗口内所有经过对应机台的风险批次，而不是逐个手动排查。同时，MES 已有单批次手动扣留能力，但缺少批量操作入口。

本设计覆盖三个相互依赖的能力，按复杂度分阶段推进：

1. **批量Hold/Release核心能力**（地基）：在批次作业中支持勾选多个批次，批量扣留/批量释放。
2. **检索批量HOLD/解锁**：按机台/晶棒 + 时间范围检索批次，一键批量Hold，或按产品分类/客户/料号筛选后批量解锁。
3. **SPC自动触发批量HOLD规则**：在 OCAP 中配置规则，当 SPC monitor 异常事件到达时，自动回溯时间窗口、圈定风险批次并批量Hold、通知责任人。

能力 2、3 依赖能力 1 提供的批量 Hold/Release 写服务；能力 3 还依赖一套目前完全不存在的 **wafer 血缘追溯基础设施**（见下文"现状调研结论"）。因此本轮只把能力 1、2 纳入实施计划，能力 3 及其依赖的血缘追溯作为后续独立子项目，本文档仅为其预留架构设计，不产出实施计划。

## 范围与阶段划分

| 阶段 | 内容 | 依赖 | 本轮是否产出实施计划 |
|---|---|---|---|
| ① 批量Hold/Release核心能力 | BatchOperations 内新增多选、批量扣留/释放弹窗、写服务、结构化历史 | 无 | 是 |
| ② 检索批量HOLD/解锁 | 新页面：按机台/晶棒 + 出站时间检索批次，一键批量Hold，分类筛选批量解锁 | ① | 是 |
| ③a wafer血缘追溯基础设施 | 补齐拆批/合批/返工的真实数据写入 + lineage 记录，支持"wafer现在在哪个批次"查询 | ①（复用Hold服务接口） | 否，后续子项目 |
| ③b SPC自动触发规则引擎 | OCAP新增自动Hold规则配置 + 执行桥接（消费SPC异常事件 → 回溯时间窗口 → 查血缘 → 批量Hold → 通知） | ①、③a | 否，后续子项目 |

## 现状调研结论

- `BatchData.isHold: boolean` 已存在，`utils/statusHelpers.ts` 的 `getOperationDisabledState` 已有"Hold批次禁止大部分操作，除 `releaseHold`/`view`"的判定骨架，但 `releaseHold` 全仓库只在这一处被引用——从未接线任何按钮/服务。
- `BatchListPage.tsx` 内已有 `statusFilter`（`'all'|'flowing'|'hold'`）状态和过滤逻辑，但 JSX 里没有对应的下拉/按钮组件去设置它，是死代码。
- `MasterBatchTable.tsx` 目前是单选（无 checkbox 列），不支持批次多选；`SubBatchTable.tsx` 已有 `checkedSubBatchIds` 复选框交互（服务于"片篮更换"），可作为批量勾选UI的参照实现。
- `mockBatchService.ts` / `batchApiService.ts` 均没有 `holdBatches`/`releaseBatches` 类写方法，`isHold` 字段目前无任何写入路径。
- OCAP 工作流设计器已有"批次扣留"动作节点类型（`BatchHoldActionConfig.tsx`）和"批次释放"动作类型定义（`releaseBatchId`/`batchReleaseReason` 字段），但**只是设计态配置**，没有把配置转化为真实调用 BatchOperations 数据的执行引擎；OCAP 的 `WorkOrder.batchNumber`（自由文本）和 BatchOperations 的 `BatchData.id/batchCode` 是两个完全独立的数据世界，未打通。
- 项目里**不存在独立 SPC 模块**，OOC/OOS 目前只是 OCAP 工单 mock 数据里的展示文案（`exceptionType: "SPC OOS/OOC"`），没有真实判异算法、monitor 片管理、时间窗口概念。本设计将 SPC 判异视为黑盒，只设计"消费一个 SPC 异常事件"的接口。
- **wafer 血缘追溯能力完全不存在**：拆批（`confirmSplit`）、合批/并批（`confirmMerge`/`handleConfirmMergeBatch`/`handleConfirmAccumulate`）、返工切入子路径（`CutIntoSubpathForm`）在 mock service 和 React handler 两端都只是 `console.log`/`alert` 占位实现，从未真正把 wafer 从旧批次移到新批次；`WaferData`/`BatchData` 也没有任何"父批次/来源批次"字段。`AutoAccumulateBatchForm.tsx` 表格里展示的 `sourceBatchCode` 只是组件内局部 state，基于写死的查找表渲染，提交后不落盘、随表单关闭即丢失。
- 全仓库没有真正的基于角色的权限控制（RBAC），`modules/ocap/constants/roles.ts` 只是静态角色标签数组（工艺工程师/质量工程师等），未接入任何操作守卫逻辑；也没有真正执行发送的通知服务，OCAP 的 `NotifyPersonnelActionConfig.tsx` 只是"配置通知怎么发"的表单。
- 菜单（`src/config/menuConfig.ts`）中没有"检索""锁定""解锁"相关入口。

## 数据模型

### 共享 Hold 记录（新增 `src/services/batchHold/types.ts`）

`BatchData.isHold` 保留作为快捷判断位，但新增独立的 `HoldRecord` 一对多记录——因为一个批次可能被多条规则/多次操作圈中，需要按来源分别追踪、分别释放，不能只用一个布尔位表达：

```ts
export interface HoldRecord {
  id: string;
  batchId: string;
  batchCode: string;
  station: string;
  quantity: number;
  holdSource: 'manual' | 'ocap-auto';
  holdReasonCategory: string;          // 如：'SPC异常'|'客户投诉'|'辅料问题'|'其他'
  holdReasonText: string;
  relatedOcapWorkOrderId?: string;     // holdSource='ocap-auto' 时关联的OCAP工单
  relatedRuleId?: string;              // holdSource='ocap-auto' 时关联的自动Hold规则
  triggeredByEquipment?: string;
  triggeredTimeWindow?: { start: string; end: string };
  status: 'holding' | 'released';
  holdAt: string;
  holdBy: string;
  releaseAt?: string;
  releaseBy?: string;
  releaseApprovalComment?: string;     // Release 必填：审批意见/依据
}
```

`BatchData.isHold = true` 当且仅当该批次存在至少一条 `status: 'holding'` 的 `HoldRecord`。

### 共享服务（新增 `src/services/batchHold/batchHoldService.ts`）

```ts
export interface BatchHoldService {
  holdBatches(batchIds: string[], reason: {
    category: string; text: string; source: 'manual' | 'ocap-auto';
    relatedOcapWorkOrderId?: string; relatedRuleId?: string;
    triggeredByEquipment?: string; triggeredTimeWindow?: { start: string; end: string };
  }, operator: string): Promise<HoldRecord[]>;

  releaseBatches(batchIds: string[], approvalComment: string, operator: string): Promise<HoldRecord[]>;

  listHoldRecords(batchId: string): Promise<HoldRecord[]>;
}
```

mock 实现遵循项目现有约定（`mockBatchService.ts` 风格）：模块内内存数组 + `await delay()` 模拟异步。`BatchOperations` 的 UI 层和（后续）OCAP 的规则执行引擎都直接依赖这一个服务，不各自维护 Hold 状态，避免双写不一致。

## 阶段① 批量Hold/Release核心能力（BatchOperations 模块内）

- **多选**：[MasterBatchTable.tsx](../../../src/components/BatchOperations/components/MasterBatchTable.tsx) 新增 checkbox 列，比照 `SubBatchTable.tsx` 已有的 `checkedSubBatchIds` 交互模式，支持全选。
- **操作入口**：[BatchListPage.tsx](../../../src/components/BatchOperations/components/BatchListPage.tsx) 操作面板新增"批量扣留""批量释放"按钮，仅在有勾选批次时可用；同时把死代码 `statusFilter`（`'flowing'|'hold'`）接上一个下拉/Tab，支持"仅看Hold批次"。
- **新增弹窗**：
  - `BatchHoldModal.tsx`：选择 `holdReasonCategory` + 填写 `holdReasonText`，无需审批，提交后调用 `batchHoldService.holdBatches(selectedIds, {..., source:'manual'}, currentOperator)` 直接生效。
  - `BatchReleaseModal.tsx`：`releaseApprovalComment` 必填（对应截图"待会议决议后…解锁"的场景，记录决议依据），提交后调用 `releaseBatches`。
- **联动**：`utils/statusHelpers.ts` 的 `getOperationDisabledState` 改为读取该批次是否存在 `status:'holding'` 的 `HoldRecord`（逻辑等价于现有 `isHold`），下游 `OutstationForm`/`PackagingSection` 等表单的调用方式不变。
- **历史记录**：复用现有 `_addHistory` 机制，但记录内容从纯字符串扩展为关联 `HoldRecord.id` 的结构化记录，批次详情页可展开查看每条Hold/Release的完整上下文（来源、原因、操作人、时间、审批意见）。
- 若批次正在加工中被选中Hold，本次不打断当前工序，出站后自动置为Hold（与用户原始需求"批次若加工中，则出站后自动HOLD"一致）——实现方式：写入 `HoldRecord` 时不依赖批次当前 `status`，出站环节的禁用判断始终读取最新 `HoldRecord`，天然满足这一行为，无需额外状态机。

## 阶段② 检索批量HOLD/解锁（新页面）

- **菜单入口**：挂在"生产管理 > 在制品管理"下，与现有"批次作业"并列。
- **检索条件**：机台（单/多选）+ 晶棒ID（单/多选）+ 出站时间范围。
- **结果清单**：列出命中的所有批次（在线中/已入库均列出），字段含站点、数量、状态。对已入成品库的批次，状态列标注"已入库"（**不标"已发货"**——MES 无法获知 ERP 侧真实发货状态，只能识别到"已入成品库"这一级，这是本设计的已知边界，需要与 ERP 对接才能补齐真实发货状态）。
- **导出**：结果清单支持导出为 CSV（前端生成）。
- **一键批量Hold**：复用 `batchHoldService.holdBatches`，`source:'manual'`，默认备注带上检索条件（机台+时间范围）。
- **分批解锁**：解锁前按产品分类（测试片/正片/重掺片）、客户名称、料号做二次筛选，筛选后批量调用 `releaseBatches`（同样需要 `releaseApprovalComment`）。

## 权限与"工程异常反馈"通知

- Hold 操作：工艺/质量工程师可直接执行，不做强 RBAC 校验（与项目现状一致，仅记录操作人）。
- Release 操作：`releaseApprovalComment` 必填，不做多级审批工作流引擎。
- 批量提交后触发的"工程异常反馈"：本阶段仅落一条结构化通知记录（收件人在阶段①②中手动指定；后续③b会扩展为按机台/工序的责任人映射表），**不新建真实发送通道**——项目现状本来就没有真正的通知发送服务，本设计只定义"该通知谁、通知内容是什么"的数据结构，实际发送方式留待后续对接。

## ③a wafer血缘追溯基础设施（后续子项目，本文档仅定调架构，不产出实施计划）

- `WaferData` 新增 `lineageEvents: LineageEvent[]`：
  ```ts
  interface LineageEvent {
    eventType: 'split' | 'merge' | 'rework';
    fromBatchId: string; toBatchId: string;
    occurredAt: string; operatedBy: string;
  }
  ```
- 补齐目前是占位实现的 `confirmSplit`/`confirmMerge`/`CutIntoSubpath`：真正把 wafer 记录从旧批次的内存结构移出、写入新批次，同时追加一条 `LineageEvent`。这是让拆批/合批/返工从"UI演示"变成"真实数据变更"的前提工作，是③a的主要工作量所在，血缘查询本身相对简单。
- 新增查询服务 `resolveCurrentBatches(equipmentId, timeWindow): Promise<BatchData[]>`：先找出该机台在时间窗口内出站的原始批次及其所含 wafer 列表，再沿 `lineageEvents` 正向追踪每个 wafer 当前所属批次，去重后返回"当前需要 Hold 的批次清单"（对应用户需求"围堵为wafer级，包含返工、合批等批次，追溯到出站批次所含wafer当前所在的批次"）。

## ③b SPC自动触发规则引擎（后续子项目，本文档仅定调架构，不产出实施计划）

- **触发输入**（黑盒判异，只消费事件，不设计判异算法本身）：
  ```ts
  interface SpcAbnormalEvent {
    equipmentId: string; occurredAt: string;
    parameterName: string; monitorType: string;   // 如 'metal-ion'
    judgeResult: 'OOC' | 'OOS';
  }
  ```
- **规则配置**（扩展 OCAP 工作流设计器现有的 `BatchHoldActionConfig`）：
  - 机台：必选。
  - 产品/工序：可选筛选（不填则不限制）。
  - 时间窗口回溯方式：二选一 —— 固定周期数值（如8小时），或"回溯到该机台上一次同 monitor 项合格记录的时间点"（对应用户截图例子：8.05合格 → 8.12异常，圈定这段时间内所有出站批次）。
  - 异常事件类型：固定为 `SPC OOC/OOS`，不开放自定义类型。
  - 责任工艺工程师 / 质量工程师：规则内手动指定。
- **执行链路**：`SpcAbnormalEvent` 到达 → 匹配命中的自动Hold规则（按机台+产品/工序过滤）→ 按回溯方式计算时间窗口起止 → 调用③a的 `resolveCurrentBatches(equipmentId, timeWindow)` 得到当前批次清单 → 调用 `batchHoldService.holdBatches(...)`（`source:'ocap-auto'`，带上 `relatedRuleId`/`relatedOcapWorkOrderId`）→ 按规则里配置的责任人生成"工程异常反馈"通知记录 → 生成/关联一张 OCAP 工单。

## 未覆盖 / 明确排除的范围

- SPC 判异算法、控制图、monitor 片测试记录管理：不在本设计范围内，视为黑盒输入。
- 真实的邮件/短信/系统消息发送通道：沿用项目现状（无真实发送服务），本设计只定义通知数据结构。
- 多级审批工作流引擎：Release 只要求填写审批意见字段，不做待审批队列/多级审批节点。
- 与 ERP 的真实发货状态对接：MES 侧只能识别"已入成品库"，无法识别"已发货"。
