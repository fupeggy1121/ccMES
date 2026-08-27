# 开卡 Prompt：wafer血缘追溯基础设施（③a）+ SPC自动触发规则引擎（③b）

> 用途：另开一个会话/任务时，把下面"粘贴内容"整段发给 Claude，用于启动 ③a③b 的设计细化 + 实施计划。本文档本身不是设计文档，只是任务入口。

---

## 粘贴内容（把下面这段发给新会话）

我要基于已有的设计 spec，针对批量Hold/Release功能的阶段③a（wafer血缘追溯基础设施）和阶段③b（SPC自动触发规则引擎），做一轮设计细化，最终产出实施计划。

**背景资料（请先读这几份文档建立上下文，不要跳过）：**
1. 总体设计 spec：`docs/superpowers/specs/2026-08-26-batch-hold-control-design.md` —— 里面的"③a wafer血缘追溯基础设施"和"③b SPC自动触发规则引擎"两节已经定了架构方向（`LineageEvent`、`resolveCurrentBatches`、`SpcAbnormalEvent`、规则维度等），本轮设计要在这个基础上细化，不是从零开始。
2. 阶段①②的实施计划（已执行完成，供参考现有代码风格/服务分层约定）：`docs/superpowers/plans/2026-08-26-batch-hold-control-phase-1-2.md`
3. 阶段①②新建的共享服务，③b 会复用：`src/services/batchHold/`（`HoldRecord`、`batchHoldService.holdBatches/releaseBatches/listActiveHoldRecords`）

**必须先核实、不能想当然的现状（阶段①②执行期间发现的真实情况，可能已经过时，请重新用 Explore/general-purpose agent 核实一遍再动手）：**
- `src/components/BatchOperations/` 里的拆批（`confirmSplit`）、合批/并批（`confirmMerge`）、返工切入子路径（`CutIntoSubpathForm`）在 mock service 和 React handler 两端**都只是占位实现**（`console.log`/`alert`，不做真实数据变更），`WaferData`/`BatchData` 也没有任何"父批次/来源批次"字段。这意味着③a要做的不是"加一个查询接口"，而是要把这几个操作从"UI演示"变成"真实数据写入"——这是③a的主要工作量所在。
- OCAP 模块（`modules/ocap/`）里已经有"批次扣留"动作节点类型（`BatchHoldActionConfig.tsx`）和"批次释放"动作类型定义，但只是设计态配置，**没有执行引擎**把配置转化为真实调用；OCAP 的 `WorkOrder.batchNumber`（自由文本）和 `BatchData.id/batchCode` 是两个独立数据世界，未打通。③b 需要新建这条执行桥接。
- 项目里**没有独立 SPC 模块**，OOC/OOS 只是 OCAP 工单 mock 数据里的展示文案。spec 已经把 SPC 判异定为黑盒（只设计触发接口输入），这轮设计延续这个边界，不要扩大范围去做真实判异算法。
- 项目**没有测试框架**，阶段①②执行期间新增了 vitest（仅用于纯逻辑单测，`vitest.config.ts` 已在仓库里），UI 改动走 `npm run dev` + 浏览器手动/自动化验证。这轮如果新增血缘相关的纯逻辑（`resolveCurrentBatches` 之类），延续同样的 TDD 方式。
- 阶段①②执行期间还发现一个通用陷阱：项目根 `tsconfig.json` 只有工程引用（`"files": []`），**`npx tsc --noEmit`（不带 `-p`）永远返回成功、什么都不检查**。正确命令是 `npx tsc --noEmit -p tsconfig.app.json`，且这个项目本身有大量历史遗留错误（跟本次改动无关），验证时要按"相对基线有没有新增错误"来判断，不要指望零错误。

**本轮任务范围：**
1. 用 `superpowers:brainstorming` 技能启动（这是架构级任务，走完整流程：摸底现状→提问→出方案→写设计文档→自查→用户审阅）。
2. ③a 和 ③b 依赖关系明确（③b 依赖③a），但如果brainstorming过程中发现范围仍然太大，可以按 brainstorming 技能自己的指导做进一步拆分（比如把"补齐拆批/合批/返工的真实数据写入"单独拆成一个前置子项目），不需要我预先替你做这个决定。
3. 设计文档产出后，我审阅通过，再用 `superpowers:writing-plans` 生成实施计划（可以是③a③b各一份，也可以合成一份分阶段的计划，视复杂度而定）。
4. 实施计划的执行方式（inline / subagent-driven）到时候再定，不用现在决定。

**几个我已经想清楚、不需要再问我的点（沿用阶段①②已确认的设计决策）：**
- 血缘粒度：不做完整多级 wafer 级追溯的"点子"设计，直接按 spec 里 `LineageEvent{eventType, fromBatchId, toBatchId, occurredAt, operatedBy}` 的单层"上一级来源"模型做，配合 `resolveCurrentBatches` 做正向追踪查询。
- SPC自动Hold规则维度：机台（必选）+ 产品/工序（可选）+ 时间窗口回溯方式（固定周期 或 回溯到上次同机台monitor合格时间点）+ 责任工艺工程师/质量工程师（规则内手动指定）。
- 权限：延续"不做真实RBAC"的现状约定。
- 跨模块执行桥接：延续"新建共享领域服务，两边都依赖它"的模式（阶段①②已经建立了 `src/services/batchHold/` 这个先例，③b 应该复用它而不是另起一套）。

请先做现状摸底（用 Explore/general-purpose agent 去核实上面提到的几点是否仍然成立，代码可能已经变化），然后开始 brainstorming 流程。

---

## 备注（给发起这次任务的人看，不是给新会话的内容）

- 本文档生成于阶段①②完成之后，日期 2026-08-27。
- 如果 phase①②之后代码又有变动（比如有人手动补了拆批/合批的真实实现），上面"必须先核实"那段可能已经过时，新会话的 Explore 摸底步骤会自然发现并更正。
