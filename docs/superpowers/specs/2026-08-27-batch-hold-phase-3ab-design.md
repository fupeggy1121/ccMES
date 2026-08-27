# 批量Hold/Release ③a wafer血缘追溯基础设施 + ③b SPC自动触发规则引擎 —— 细化设计

- 日期：2026-08-27
- 状态：待用户审阅
- 前置文档：[2026-08-26-batch-hold-control-design.md](2026-08-26-batch-hold-control-design.md)（总体设计，本文档是其中"③a wafer血缘追溯基础设施"与"③b SPC自动触发规则引擎"两节的细化，替代那两节里"仅定调架构"的简略描述，本文档产出实施计划）
- 关联模块：`src/components/BatchOperations`、`modules/ocap`、`src/services/batchHold`（已存在，复用）、新增 `src/services/lineage`、新增 `src/services/spcAutoHold`

## 背景

阶段①②（批量Hold/Release核心能力 + 检索批量HOLD/解锁）已实施完成。本文档推进总体设计中标注为"后续独立子项目"的③a、③b两项能力：

- ③a：把拆批/合批/返工三个目前只是 UI 演示的操作变成真实数据写入，并在此基础上建立"wafer 现在在哪个批次"的正向追踪能力。
- ③b：在 OCAP 侧配置"SPC监控异常自动触发批量Hold"的规则，命中后自动圈定风险批次、批量Hold、生成工单。

③b 依赖③a 提供的追踪能力，两者在本文档中一并设计，实施计划阶段可拆可合。

## 现状调研结论（2026-08-27 复核，部分内容已与 2026-08-26 时不同）

- 拆批（`confirmSplit`）、合批（`confirmMerge`）在 mock service 与 React handler 两端仍然都是占位——且 `confirmSplit`/`confirmMerge` 这两个 service 函数**全仓库零调用点**（handler 只 `console.log`，从未真正调用它们）。返工切入子路径（`CutIntoSubpathForm`）连 service 函数都不存在。
- `BatchData`/`SubBatchData`/`WaferData` 三个类型（均在 [types.ts](../../../src/components/BatchOperations/types.ts)）上没有任何父批次/来源批次字段。数据是三层内存单例：`_batches: BatchData[]` → `_subBatches: Record<主批次id, SubBatchData[]>` → `_wafers: Record<子批次uuid, WaferData[]>`（[mockBatchService.ts:19-34](../../../src/components/BatchOperations/services/mockBatchService.ts#L19-L34)），wafer 的批次归属完全靠 Record 的 key 表达，没有反向外键。
- 发现一个必须先修的接线 bug：[SplitBatchForm.tsx:110](../../../src/components/BatchOperations/components/SplitBatchForm.tsx#L110) 把片篮重组结果传给了 prop 名 `onConfirmTransfer`，但 `WaferBasketReorganizationModule` 实际声明的 prop 是 `onReorganizationStateChange`（真实 tsc `TS2322` 错误）——效果是重组结果从未真正传给上层，拆批要做真实写入必须先修这个接线。
- OCAP 侧：`BatchHoldActionConfig.tsx` 只有一个 `holdRemarks` 文本域，是工作流**节点动作**配置，与③b规则维度（机台/产品工序/时间窗口/责任人）这种**触发条件**语义不同，不适合复用同一套配置界面。全仓库不存在任何 executor/runner/engine 把 OCAP 工作流节点配置转化为真实调用。`WorkOrder.batchNumber` 是自由文本单值，与 `BatchData.id` 无关联。
- **OCAP 没有可写的工单存储**：`WorkOrderList.tsx` 用 `useState(mockWorkOrders)` 直接拿静态数组当初始值，其余地方写不进去——③b 若要"生成一张 OCAP 工单"，必须先补一个可写的工单服务。
- 项目里不存在独立 SPC 模块，OOC/OOS 只是 mock 展示文案，无判异算法、无 monitor 测试记录管理，本设计延续把 SPC 判异视为黑盒的边界。
- 项目已有 vitest（`environment: 'node'`，只能测纯逻辑，不能测 React 组件），`src/services/batchHold/` 是已实施完成的跨模块共享服务范例，本设计的 `lineage`、`spcAutoHold` 两个新服务延续同样的分层与编码风格。
- `npx tsc --noEmit -p tsconfig.app.json` 当前基线约 1157 个真实错误（历史遗留，与本次改动无关），验证按"相对基线是否新增"判断。本设计顺手修复的两处已知 bug（`SplitBatchForm.tsx` 接线、`modules/ocap/types/workflow.ts` 末尾游离文本）会让错误数**减少**，不计入"新增"。

## ③a wafer血缘追溯基础设施

### 数据模型

```ts
// src/components/BatchOperations/types.ts 新增

export interface LineageEvent {
  eventType: 'split' | 'merge';   // 注意：不含 'rework'，见下方"返工为何不用血缘事件"
  fromBatchId: string;
  toBatchId: string;
  occurredAt: string;
  operatedBy: string;
}

export interface EquipmentPassEvent {
  batchId: string;
  batchCode: string;
  equipmentCode: string;
  station: string;
  occurredAt: string;   // 出站时间
}

// WaferData 新增
lineageEvents?: LineageEvent[];   // 仅 split/merge 产生，只增不改

// BatchData 新增
status: '加工中' | '待出站' | '待进站' | '暂存' | '已合批';  // 新增终态：已合批
mergedIntoBatchId?: string;        // status='已合批' 时必有值，指向合并目标批次
reworkPathId?: string;             // 非空=当前正处于该返工路径中
reworkReturnStationCode?: string;  // 返工完成后应回流的站点
```

**返工为何不产生 `LineageEvent`**：返工不改变批次归属（`fromBatchId` 恒等于 `toBatchId`），对"wafer 现在在哪个批次"这个追踪目标没有任何查询价值。如果仍然要求遍历该批次全部 wafer 逐个追加事件，只是纯开销、换不来任何血缘能力。因此返工改用批次级的 `reworkPathId`/`reworkReturnStationCode` 轻量标记，不写 `WaferData.lineageEvents`，也不需要遍历该批次的 wafer 数组。

**设备出站履历为何独立于 `lastOutstationAt`**：`lastOutstationAt`（阶段①②新增）是单值覆盖字段，只保留"最近一次"，无法回答"某机台在过去某个时间窗口内出站过哪些批次"。`EquipmentPassEvent` 是只增不改的追加日志，专门服务这个查询，两者不是同一件事，不能互相替代。

**已知边界**：`EquipmentPassEvent` 从功能上线那一刻起才开始累积，不为种子数据补历史记录；`resolveCurrentBatches` 刚上线时只能查到之后真实点击"确认出站"产生的记录。

### 拆批（`confirmSplit`）真实写入

前置修复：[SplitBatchForm.tsx:110](../../../src/components/BatchOperations/components/SplitBatchForm.tsx#L110) 的 prop 名从 `onConfirmTransfer` 改为 `onReorganizationStateChange`，并把片篮重组结果（`targetCarriers`/`sourceWafers`）与暂存区选择合并为一次原子提交：`onConfirmSplit({ stagingAreaId?, targetCarriers, sourceWafers })`。

`mockBatchService.confirmSplit` 实现：

1. 新建一条 `BatchData`（新 `id`/`batchCode`，`status: '暂存'`），`totalQty/goodQty/defectQty` 按实际移动的 wafer 重新汇总（不做手工加减，避免与真实数据漂移）。
2. 按 `targetCarriers` 新建对应的 `SubBatchData`，挂到 `_subBatches[新批次id]`。
3. 把 `sourceWafers` 从原 `_wafers[原子批次id]` 移出，按其重组后归属的 `carrierId` 分发进 `_wafers[新子批次id]`。
4. 给每个被移动的 wafer 追加 `LineageEvent{eventType:'split', fromBatchId, toBatchId}`。
5. 源批次的数量字段按剩余 wafer 重新汇总；被搬空的子批次保留记录（数量归零）而非物理删除，保持可审计。

**校验**：目标载具里一片 wafer 都没选中时拒绝，不生成空的"暂存"批次；批次已 `isHold` 时服务层也做防御性校验（不完全依赖 UI 层 `getOperationDisabledState`）。

### 合批（`confirmMerge`）真实写入

目标批次已经通过现有 `BatchSelectionModal` 选定（按 `productCode`/`station` 过滤、排除自身）。真实写入：

1. 把源批次全部 `_subBatches`/`_wafers` 整体挪到目标批次名下（`sublotId` 字符串保留原名不改写，归属只看 Record key，与现有模型一致）。
2. 给源批次里的每个 wafer 追加 `LineageEvent{eventType:'merge'}`。
3. 目标批次数量重新汇总。
4. 源批次不删除：`status → '已合批'`，数量清零，`mergedIntoBatchId` 指向目标批次（这是一个便捷字段，UI 上"这个批次去哪了"不用绕道血缘查询就能直接显示）。

**校验**：目标批次不存在、目标等于源批次自身、目标或源批次已是 `isHold`/`已合批` 均拒绝并给出中文错误（`BatchSelectionModal` 目前只在 UI 层排除自身，服务层需要再补一层）。

### 返工切入子路径（`confirmCutIntoSubpath`，新增服务函数，目前完全不存在）

1. 写入 `reworkPathId`（选中的返工路径）、`reworkReturnStationCode`（选中的回流站点），并把 `nextStationCode/nextStationName` 指向返工路径第一站，使其成为真实的路由变化。
2. 批次沿返工路径继续走时，复用现有机制——每次出站操作员手动选下一站（现状 `confirmOutstation` 本来就是这样，不是自动路由表驱动的状态机），不新建自动化状态机。
3. 追加一条 `_addHistory` 记录。

**校验**：批次已处于另一条返工路径中（`reworkPathId` 已非空）时拒绝重复切入，避免 `reworkReturnStationCode` 被覆盖导致追不回主路径。

### `resolveCurrentBatches` 查询服务

```ts
// src/services/lineage/lineageService.ts（新增）
resolveCurrentBatches(equipmentId: string, timeWindow: { start: string; end: string }): Promise<BatchData[]>
```

算法（不做通用的任意时刻快照重建，只利用 `LineageEvent` 只增不改的性质）：

```
1. 从 _equipmentPassEvents 找出该机台在 timeWindow 内的出站事件
   → { originBatchId, passedAt }[]（同一批次窗口内多次出站，取最早一次，从严圈定）

2. 对每个 originBatchId：
   a. 仍直接挂在该批次下、从未被移动过的 wafer → 直接命中，当前批次 = originBatchId
   b. 曾经从该批次被移出的 wafer（存在 lineageEvent.fromBatchId === originBatchId）：
      - 移出时间 < passedAt → 排除（设备命中那一刻它已经不在这个批次里了）
      - 移出时间 >= passedAt → 命中，沿该 wafer 后续 lineageEvents 链条追到最后一条的 toBatchId，
        得到"现在"所在批次（可能经过不止一次拆批/合批）

3. 汇总所有命中 wafer 的"当前批次id"，去重，按 id 查出完整 BatchData 返回
```

返工的 `reworkPathId` 标记完全不参与这个算法——它从不产生 `fromBatchId !== toBatchId` 的事件，一个正在返工的批次本来就还是它自己，天然会在第 2a 步被直接命中。

**分层**：重逻辑（直接访问 `_batches`/`_wafers`/`_equipmentPassEvents`）留在 `mockBatchService.ts` 内部新增方法，风格对齐现有 `getBatchWafers`/`getWafersForSplit`。`src/services/lineage/lineageService.ts` 只做一层薄委托 `resolveCurrentBatches(...) → batchApiService.resolveCurrentBatches(...)`，是③b和其他模块唯一应该导入的入口，延续 `batchHoldService` 包 `batchApiService` 的既有分层模式。

**已知边界**：对全部带血缘记录的 wafer 线性扫描，无索引/缓存，mock 数据量级下足够，不做提前优化。

### ③a 测试策略

延续 vitest 纯逻辑约定（`environment: 'node'`，这批测试全是 service 层逻辑，不需要渲染组件）：

- `confirmSplit`：wafer 物理搬家、新批次数量重新汇总、`LineageEvent` 正确写入。
- `confirmMerge`：目标批次吸收数量、源批次 `status→'已合批'` + `mergedIntoBatchId` 落地、`LineageEvent` 写入。
- `confirmCutIntoSubpath`：**回归测试点**——断言不产生任何 `LineageEvent`、不触碰 wafer 数组，只写批次级字段，直接验证"返工不用血缘事件"这个设计决策不被后续改动破坏。
- `resolveCurrentBatches`：核心场景是多跳链路——批次 A 出站后被拆出一部分到 B，B 又被合并进 C，断言查询 A 经过的设备+窗口最终返回 C；再加"wafer 在设备命中时刻之前/之后离开"的边界用例。

## ③b SPC自动触发规则引擎

### 数据模型

```ts
// 黑盒触发输入（消费方视角，不涉及判异算法本身）
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

// 规则配置本体（新增，src/services/spcAutoHold/types.ts）
export interface AutoHoldRule {
  id: string;
  name: string;
  equipmentId: string;          // 必选
  productCode?: string;         // 可选：产品筛选
  station?: string;             // 可选：工序筛选
  monitorType: string;          // 匹配 SpcAbnormalEvent.monitorType
  timeWindowMode: 'fixed' | 'back-to-last-pass';
  fixedWindowHours?: number;    // timeWindowMode === 'fixed' 时必填
  responsibleProcessEngineer: string;
  responsibleQualityEngineer: string;
  enabled: boolean;
  createdAt: string;
  createdBy: string;
}

// 执行记录（新增，纯内存，用于"最近触发记录"面板，是验证规则跑没跑对的唯一途径）
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

**持久化**：`AutoHoldRule` 用 `localStorage` 持久化，参照 OCAP 工作流模板/表单模板的既有先例（规则是配置而非运行时状态，刷新页面不应该丢失）。`HoldRecord`（复用阶段①②已有服务）、`WorkOrder`、`AutoHoldExecutionRecord` 仍保持纯内存，与现状一致。

**新增服务**：
- `src/services/spcAutoHold/`（新增，跨模块共享）：规则 CRUD + 执行引擎 `handleSpcAbnormalEvent(event)`。
- `modules/ocap/services/workOrderService.ts`（新增，补基础设施缺口）：`listWorkOrders`/`createWorkOrder` 内存单例，供 `WorkOrderList.tsx` 改为从这里读（替换当前直接读静态 `mockWorkOrders` 常量的写法），也供③b执行引擎写入自动生成的工单。

### 规则管理页面

新增 `src/components/SpcAutoHoldRules/SpcAutoHoldRulesModule.tsx`（原生 HTML + Tailwind，不引入新组件库），挂载到 `src/App.tsx`，菜单挂在"生产管理 > 在制品管理"下，与"批次作业""批次检索批量HOLD/解锁"并列（沿用阶段①②挂载惯例，见 [menuConfig.ts:52-61](../../../src/config/menuConfig.ts#L52-L61)）。

页面分两块：
1. **规则列表 + 新建/编辑表单**：对应 `AutoHoldRule` 的 CRUD。
2. **模拟触发面板**（明确标注"测试用，无真实SPC接入"）：手填 `SpcAbnormalEvent` 字段的表单 + "模拟触发"按钮。这不只是测试工具——它调用的函数和未来真实 SPC 系统要调用的是同一个 `spcAutoHoldService.handleSpcAbnormalEvent(event)`，区别只是事件从表单来还是从真实系统来。没有这个面板，规则引擎写完后无法验证效果，因为项目里不存在任何真实触发源。

### 执行引擎 `handleSpcAbnormalEvent(event)`

```
1. 从 localStorage 读所有 enabled=true 的规则，按 equipmentId（必须相等）+ monitorType（必须相等）过滤出候选规则
2. 对每条候选规则计算时间窗口：
   - fixed → [event.occurredAt - fixedWindowHours, event.occurredAt]
   - back-to-last-pass → [event.lastPassedAt, event.occurredAt]
     （event 未带 lastPassedAt → 跳过该规则，记 result: 'missingLastPassedAt'，不影响其他规则）
3. 调 lineageService.resolveCurrentBatches(event.equipmentId, timeWindow) → 批次清单
   （规则填了 productCode/station 时在此对结果做二次过滤）
4. 批次清单非空：
   a. 预生成一个 workOrderId（`workOrderService.generateId()`，只分配 ID 字符串，不落库），
      带着这个 ID 调 batchHoldService.holdBatches(批次ids, {
        source: 'ocap-auto', relatedRuleId: rule.id, relatedOcapWorkOrderId: workOrderId,
        triggeredByEquipment: event.equipmentId, triggeredTimeWindow: timeWindow,
        notifiedProcessEngineer: rule.responsibleProcessEngineer,
        notifiedQualityEngineer: rule.responsibleQualityEngineer,
      }, operator: 'SPC自动触发系统')   // operator 是"谁执行了这个动作"，用系统标识，不冒充责任工程师
   b. 用同一个 workOrderId 调 workOrderService.createWorkOrder(...)，生成 1 张 OCAP 工单
      （batchNumber 写"N个批次（详见Hold记录）"汇总摘要）。若这一步失败，
      HoldRecord 里已经落库的 relatedOcapWorkOrderId 会指向一个不存在的工单（悬空引用），
      通过 AutoHoldExecutionRecord.workOrderCreationFailed: true 标记出来供排查——
      不回滚已生效的 Hold（Hold 的管控价值独立于工单系统是否正常，mock service 也没有
      事务能力做安全回滚），也不需要因此扩展 batchHoldService 现有接口（阶段①②已实施，
      没有"事后更新 HoldRecord"的方法，预生成 ID 这个做法刚好绕开了这个限制）
5. 无论命中与否都追加一条 AutoHoldExecutionRecord，纯内存保存
```

**顺序说明**：`workOrderId` 预生成、随 Hold 一起落库，工单对象本身随后才创建——不是"先 Hold 再回填"，是"ID 先分配、对象后创建"，这样 Hold 的生效完全不依赖工单创建是否成功，也不需要改动 `batchHoldService` 已经实施完成的接口。

**基数处理**：一个 `SpcAbnormalEvent` 可能圈出 N 个批次，但 OCAP `WorkOrder.batchNumber` 是单个 string——本设计选择一个事件生成一张工单（`batchNumber` 写汇总摘要），完整批次清单通过 `relatedRuleId`/`relatedOcapWorkOrderId` 反查 `HoldRecord` 获得，不改动 `WorkOrder` 现有类型，不拆成 N 张工单打散"一次异常对应一个处置事件"的语义。

### ③b 错误处理与测试策略

**错误处理**：
- `handleSpcAbnormalEvent` 入口做基本防御性校验（`equipmentId` 非空、`judgeResult` 必须是 `OOC`/`OOS`）——它不仅服务未来真实接入，也直接接"模拟触发"表单的人工输入。
- `back-to-last-pass` 规则缺 `lastPassedAt` 不让整条链路失败，只跳过该规则。
- `resolveCurrentBatches` 返回空数组是正常结果，不抛异常。

**测试**（vitest，`spcAutoHoldService`/`workOrderService` 都是内存 mock，直接联调测试比隔离 mock 更真实）：
- 规则命中且结果非空 → 断言 `HoldRecord`、`WorkOrder` 产生，执行记录 `holdApplied`。
- 命中但结果为空 → 不产生 Hold/工单，执行记录 `noBatchesMatched`。
- `back-to-last-pass` 缺 `lastPassedAt` → 该规则跳过，不影响同事件命中的其他规则。
- 一个事件同时命中多条规则 → 各自独立生成 Hold/工单，不合并去重（不同规则代表不同责任人和时间窗口）。
- `workOrderService.createWorkOrder`/`listWorkOrders` 读写往返测试。
- `AutoHoldRule` 的 localStorage 读写往返测试。

## 未覆盖 / 明确排除的范围

- SPC 判异算法、控制图、monitor 片测试记录的真实管理：延续黑盒边界，本设计只多要了一个 `lastPassedAt` 字段，不做真实的合格记录时间序列存储。
- 真实的 SPC 系统接入通道：本轮只提供"模拟触发"表单作为唯一触发入口，不建 webhook/事件总线等真实集成。
- OCAP 工作流设计器的通用执行引擎：本设计的自动Hold执行链路是独立的、专用的，不依赖也不驱动 `BatchHoldActionConfig` 所在的 reactflow 节点图执行——那是一个更大的、和本次任务无关的能力缺口。
- 真实的邮件/短信/系统消息发送通道、多级审批、RBAC：延续项目现状约定。
- `EquipmentPassEvent` 历史数据补种：功能上线前的出站记录不可追溯。
