// src/data/mockData.ts
import { WorkOrder } from '../types/workOrder';
import { acidEtchingWorkflow } from './acidEtchingWorkflow';
import { temperatureWorkflow } from './temperatureWorkflow';

// Helper to get config from workflow nodes
const getWorkflowNodeConfig = (workflow: any[], nodeId: string) => {
  const node = workflow.find(n => n.id === nodeId);
  return node ? node.config : undefined;
};

// Helper to get node type from workflow nodes
const getWorkflowNodeType = (workflow: any[], nodeId: string) => {
  const node = workflow.find(n => n.id === nodeId);
  return node ? node.type : 'action'; // Default to action if not found
};

// Helper to get node description from workflow nodes
const getWorkflowNodeDescription = (workflow: any[], nodeId: string) => {
  const node = workflow.find(n => n.id === nodeId);
  return node ? node.description : undefined;
};

export const mockWorkOrders: WorkOrder[] = [
  {
    id: "OCAP-2023-007",
    name: "酸腐去除量异常处理工单",
    batchNumber: "BT23310782",
    equipment: "酸蚀机 AE-3000",
    productModel: "W22-7",
    exceptionType: "SPC OOS/OOC",
    description: "酸腐去除量超出规格范围，需要立即处理",
    status: "completed",
    submitter: "张工",
    createdAt: "2025-11-01T06:15:10.000Z",
    currentStage: 4, // This means stages 0, 1, 2, 3, 4 are completed/current
    currentAssignee: null,
    stages: [
      {
        id: "ae-1",
        name: "停止加工",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-1"),
        role: "系统",
        status: "completed",
        completedAt: "2025-10-26T09:15:10.000Z",
        assignee: "王工",
        analysis: "确认酸腐去除量超出规格上限，立即停止生产",
        actions: "暂停酸蚀工艺，隔离当前批次产品",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-1"),
        actionType: "equipmentDisable",
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-1")
      },
      {
        id: "ae-2",
        name: "复测",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-2"),
        role: "生产人员",
        status: "completed",
        completedAt: "2025-10-28T02:15:10.000Z",
        assignee: "XSD",
        analysis: "重新测量酸腐去除量数据，确认异常情况",
        actions: "使用多点测量方法重新检测去除量",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-2"),
        actionType: "remeasure",
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-2")
      },
      {
        id: "ae-3",
        name: "去除量是否超规?",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-3"),
        role: "系统",
        status: "completed",
        completedAt: "2025-10-30T01:15:10.000Z",
        analysis: "复测数据确认去除量确实超出规格范围",
        actions: "确认异常，继续下一步分析流程",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-3"),
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-3")
      },
      {
        id: "ae-4",
        name: "是否校对单片测厚仪?",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-4"),
        role: "工艺工程师",
        status: "completed",
        completedAt: "2025-10-27T06:15:10.000Z",
        assignee: "李工",
        analysis: "确认纠正措施有效后解除产品扣留状态",
        actions: "更新产品状态，允许继续后续工艺",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-4"),
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-4")
      },
      {
        id: "ae-5",
        name: "校对单片测厚仪",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-5"),
        role: "工艺工程师",
        status: "completed",
        completedAt: "2025-10-29T03:15:10.000Z",
        assignee: "王工",
        analysis: "通知设备部门进行预防性维护",
        actions: "发送设备维护通知，安排定期检查",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-5"),
        actionType: "equipmentCalibration",
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-5")
      }
    ]
  },
  {
    id: "OCAP-2023-008",
    name: "酸腐去除量异常处理工单",
    batchNumber: "BT23286869",
    equipment: "酸蚀机 AE-3000",
    productModel: "M58-T3",
    exceptionType: "SPC OOS/OOC",
    description: "酸蚀速率异常，表面均匀性不达标",
    status: "processing",
    submitter: "王工",
    createdAt: "2025-10-31T03:15:10.000Z",
    currentStage: 1,
    currentAssignee: {
      name: "测量员A",
      department: "测量中心",
      role: "测量员"
    },
    stages: [
      {
        id: "ae-1",
        name: "停止加工",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-1"),
        role: "工艺工程师",
        status: "completed",
        completedAt: "2025-10-31T01:15:10.000Z",
        assignee: "王工",
        analysis: "发现酸蚀速率异常，立即停止当前生产批次",
        actions: "暂停酸蚀机运行，隔离受影响产品",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-1"),
        actionType: "equipmentDisable",
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-1")
      },
      {
        id: "ae-2",
        name: "复测",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-2"),
        role: "测量员",
        status: "processing",
        assignee: "测量员A",
        analysis: "正在进行去除量复测，确认异常程度",
        actions: "执行多点厚度测量，收集详细数据",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-2"),
        actionType: "remeasure",
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-2")
      },
      {
        id: "ae-3",
        name: "去除量是否超规?",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-3"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-3"),
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-3")
      },
      {
        id: "ae-4",
        name: "是否校对单片测厚仪?",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-4"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-4"),
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-4")
      },
      {
        id: "ae-5",
        name: "校对单片测厚仪",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-5"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-5"),
        actionType: "equipmentCalibration",
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-5")
      }
    ]
  },
  {
    id: "OCAP-2023-009",
    name: "温度异常监控处理工单",
    batchNumber: "BT23271778",
    equipment: "扩散炉 DF-3200",
    productModel: "W22-7",
    exceptionType: "SPC OOS/OOC",
    description: "温度控制参数超出规格上限，测量值偏高",
    parameters: "目标温度: 845°C\n加热功率: 68%\n保温时间: 112min",
    spcParameters: {
      controlParameter: "炉温",
      specification: "845±20°C",
      measuredValue: "856°C",
      controlLimits: {
        ucl: "855°C",
        lcl: "835°C",
        usl: "865°C",
        lsl: "825°C"
      }
    },
    abnormalValue: {
      value: "856°C",
      deviation: "+11°C",
      deviationPercent: "1%"
    },
    outOfLimitRule: {
      ruleName: "单点超出控制上限",
      ruleDescription: "单个测量点超出UCL控制上限",
      triggerCondition: "测量值 > UCL (855°C)"
    },
    status: "completed",
    submitter: "李工",
    createdAt: "2025-11-02T21:15:10.000Z",
    currentStage: 4,
    currentAssignee: null,
    stages: [
      {
        id: "temp-confirm",
        name: "确认异常告警",
        description: getWorkflowNodeDescription(temperatureWorkflow, "temp-confirm"),
        role: "系统",
        status: "completed",
        completedAt: "2025-10-29T06:15:10.000Z",
        assignee: "系统",
        analysis: "系统自动确认温度异常告警",
        actions: "记录告警信息并继续流程",
        type: getWorkflowNodeType(temperatureWorkflow, "temp-confirm"),
        actionType: "confirmAlert",
        config: getWorkflowNodeConfig(temperatureWorkflow, "temp-confirm")
      },
      {
        id: "temp-2",
        name: "温度偏差程度?",
        description: getWorkflowNodeDescription(temperatureWorkflow, "temp-2"),
        role: "工艺工程师",
        status: "completed",
        completedAt: "2025-10-29T06:15:10.000Z",
        assignee: "张工",
        analysis: "分析温度偏差程度，确认属于轻微超出控制上限",
        actions: "记录偏差数据，评估对产品质量影响",
        type: getWorkflowNodeType(temperatureWorkflow, "temp-2"),
        config: getWorkflowNodeConfig(temperatureWorkflow, "temp-2")
      },
      {
        id: "temp-3",
        name: "记录并继续",
        description: getWorkflowNodeDescription(temperatureWorkflow, "temp-3"),
        role: "工艺工程师",
        status: "completed",
        completedAt: "2025-10-25T07:15:10.000Z",
        assignee: "王工",
        analysis: "确认温度偏差在可接受范围内，不影响产品质量",
        actions: "记录异常数据，继续生产并加强监控",
        type: getWorkflowNodeType(temperatureWorkflow, "temp-3"),
        actionType: "dataLogging",
        config: getWorkflowNodeConfig(temperatureWorkflow, "temp-3")
      },
      {
        id: "temp-4",
        name: "调整参数",
        description: getWorkflowNodeDescription(temperatureWorkflow, "temp-4"),
        role: "工艺工程师",
        status: "completed",
        completedAt: "2025-10-30T01:15:10.000Z",
        assignee: "王工",
        analysis: "微调加热功率参数，优化温度控制精度",
        actions: "调整功率设定值，重新校准温度控制系统",
        type: getWorkflowNodeType(temperatureWorkflow, "temp-4"),
        actionType: "parameterAdjustment",
        config: getWorkflowNodeConfig(temperatureWorkflow, "temp-4")
      },
      {
        id: "temp-5",
        name: "停机检修",
        description: getWorkflowNodeDescription(temperatureWorkflow, "temp-5"),
        role: "工艺工程师",
        status: "completed",
        completedAt: "2025-10-30T01:15:10.000Z",
        assignee: "王工",
        analysis: "安排预防性维护，检查加热元件和温控系统",
        actions: "停机进行设备检修，更换老化部件",
        type: getWorkflowNodeType(temperatureWorkflow, "temp-5"),
        actionType: "notifyPersonnel",
        config: getWorkflowNodeConfig(temperatureWorkflow, "temp-5")
      }
    ]
  },
  {
    id: "OCAP-2023-010",
    name: "温度异常监控处理工单",
    batchNumber: "BT23268981",
    equipment: "加热炉 HF-4500",
    productModel: "K72-5",
    exceptionType: "SPC OOS/OOC",
    description: "炉温分布不均匀，局部温度超标",
    parameters: "目标温度: 973°C\n加热功率: 56%\n保温时间: 80min",
    spcParameters: {
      controlParameter: "炉温",
      specification: "973±20°C",
      measuredValue: "986°C",
      controlLimits: {
        ucl: "983°C",
        lcl: "963°C",
        usl: "993°C",
        lsl: "953°C"
      }
    },
    abnormalValue: {
      value: "986°C",
      deviation: "+13°C",
      deviationPercent: "1%"
    },
    outOfLimitRule: {
      ruleName: "单点超出控制上限",
      ruleDescription: "单个测量点超出UCL控制上限",
      triggerCondition: "测量值 > UCL (983°C)"
    },
    status: "processing",
    submitter: "李工",
    createdAt: "2025-10-31T23:15:10.000Z",
    currentStage: 1,
    currentAssignee: {
      name: "李工",
      department: "工艺部",
      role: "工艺工程师"
    },
    stages: [
      {
        id: "temp-confirm",
        name: "确认异常告警",
        description: getWorkflowNodeDescription(temperatureWorkflow, "temp-confirm"),
        role: "系统",
        status: "completed",
        completedAt: "2025-10-31T23:15:10.000Z",
        assignee: "系统",
        analysis: "系统自动确认温度异常告警",
        actions: "记录告警信息并继续流程",
        type: getWorkflowNodeType(temperatureWorkflow, "temp-confirm"),
        actionType: "confirmAlert",
        config: getWorkflowNodeConfig(temperatureWorkflow, "temp-confirm")
      },
      {
        id: "temp-2",
        name: "温度偏差程度?",
        description: getWorkflowNodeDescription(temperatureWorkflow, "temp-2"),
        role: "工艺工程师",
        status: "processing",
        assignee: "李工",
        analysis: "正在评估温度偏差程度和对产品质量的影响",
        actions: "收集多点温度数据，分析温度分布均匀性",
        type: getWorkflowNodeType(temperatureWorkflow, "temp-2"),
        config: getWorkflowNodeConfig(temperatureWorkflow, "temp-2")
      },
      {
        id: "temp-3",
        name: "记录并继续",
        description: getWorkflowNodeDescription(temperatureWorkflow, "temp-3"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(temperatureWorkflow, "temp-3"),
        actionType: "dataLogging",
        config: getWorkflowNodeConfig(temperatureWorkflow, "temp-3")
      },
      {
        id: "temp-4",
        name: "调整参数",
        description: getWorkflowNodeDescription(temperatureWorkflow, "temp-4"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(temperatureWorkflow, "temp-4"),
        actionType: "parameterAdjustment",
        config: getWorkflowNodeConfig(temperatureWorkflow, "temp-4")
      },
      {
        id: "temp-5",
        name: "停机检修",
        description: getWorkflowNodeDescription(temperatureWorkflow, "temp-5"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(temperatureWorkflow, "temp-5"),
        actionType: "notifyPersonnel",
        config: getWorkflowNodeConfig(temperatureWorkflow, "temp-5")
      }
    ]
  },
  {
    id: "OCAP-2023-011",
    name: "酸腐去除量异常处理工单",
    batchNumber: "BT23278901",
    equipment: "酸蚀机 AE-5500",
    productModel: "W22-7",
    exceptionType: "SPC OOS/OOC",
    description: "酸蚀速率异常，表面均匀性不达标",
    status: "processing",
    submitter: "李工",
    createdAt: "2025-10-30T23:15:10.000Z",
    currentStage: 1,
    currentAssignee: {
      name: "测量员B",
      department: "测量中心",
      role: "测量员"
    },
    stages: [
      {
        id: "ae-1",
        name: "停止加工",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-1"),
        role: "工艺工程师",
        status: "completed",
        completedAt: "2025-10-30T21:15:10.000Z",
        assignee: "李工",
        analysis: "检测到酸蚀去除量异常，立即停止生产流程",
        actions: "暂停酸蚀机运行，隔离当前批次产品",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-1"),
        actionType: "equipmentDisable",
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-1")
      },
      {
        id: "ae-2",
        name: "复测",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-2"),
        role: "测量员",
        status: "processing",
        assignee: "测量员B",
        analysis: "正在进行详细的去除量复测和数据收集",
        actions: "执行多点厚度测量，验证测量准确性",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-2"),
        actionType: "remeasure",
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-2")
      },
      {
        id: "ae-3",
        name: "去除量是否超规?",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-3"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-3"),
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-3")
      },
      {
        id: "ae-4",
        name: "是否校对单片测厚仪?",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-4"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-4"),
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-4")
      },
      {
        id: "ae-5",
        name: "校对单片测厚仪",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-5"),
        role: "测量工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-5"),
        actionType: "equipmentCalibration",
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-5")
      },
      {
        id: "ae-6",
        name: "去除量是否超规?",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-6"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-6"),
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-6")
      },
      {
        id: "ae-7",
        name: "工艺是否选择错误?",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-7"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-7"),
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-7")
      },
      {
        id: "ae-8",
        name: "更改正确Recipe",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-8"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-8"),
        actionType: "recipeCorrection",
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-8")
      },
      {
        id: "ae-9",
        name: "去除量是否超规?",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-9"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-9"),
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-9")
      },
      {
        id: "ae-10",
        name: "是否试化腐计算腐蚀时间?",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-10"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-10"),
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-10")
      },
      {
        id: "ae-11",
        name: "试化腐",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-11"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-11"),
        actionType: "trialGrinding",
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-11")
      },
      {
        id: "ae-12",
        name: "去除量是否超规?",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-12"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-12"),
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-12")
      },
      {
        id: "ae-13",
        name: "设备是否有异常?",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-13"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-13"),
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-13")
      },
      {
        id: "ae-14",
        name: "通知设备工程师",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-14"),
        role: "设备工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-14"),
        actionType: "notifyPersonnel",
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-14")
      },
      {
        id: "ae-15",
        name: "去除量是否超规?",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-15"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-15"),
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-15")
      },
      {
        id: "ae-16",
        name: "通知工艺工程师",
        description: getWorkflowNodeDescription(acidEtchingWorkflow, "ae-16"),
        role: "工艺工程师",
        status: "pending",
        analysis: "",
        actions: "",
        type: getWorkflowNodeType(acidEtchingWorkflow, "ae-16"),
        actionType: "notifyPersonnel",
        config: getWorkflowNodeConfig(acidEtchingWorkflow, "ae-16")
      }
    ]
  },
  {
    // 自动批量扣留触发的工单示例：批次扣留节点带完整的批次清单快照，
    // 其中在制批次是真正执行了扣留的对象，已包装入成品库的批次只登记"已入库"。
    // 这张是静态种子工单，方便不跑"扣留规则 > 模拟触发"也能直接看到节点展示效果；
    // 真实触发生成的工单由 spcAutoHoldService 写入 workOrderService 内存存储。
    id: "OCAP-AUTO-2026-0912-001",
    name: "SPC自动Hold：EQ002平坦度Monitor批次窗口扣留",
    batchNumber: "6个批次（在制3个/已入库3个，详见批次扣留节点）",
    equipment: "EQ002",
    productModel: "P004",
    exceptionType: "SPC OOS/OOC",
    description: "规则「EQ002平坦度Monitor批次窗口扣留」命中，参数：平坦度TTV，判异结果：OOC",
    status: "processing",
    submitter: "SPC自动触发系统",
    createdAt: "2026-09-12T08:20:00.000Z",
    currentStage: 1,
    currentAssignee: {
      name: "王芳",
      department: "工艺技术部",
      role: "工艺工程师"
    },
    stages: [
      {
        id: "auto-hold-batch-hold",
        name: "批次扣留",
        description: "按扣留规则「EQ002平坦度Monitor批次窗口扣留」圈定时间窗口内流经机台EQ002的批次并执行扣留",
        role: "系统",
        status: "completed",
        completedAt: "2026-09-12T08:20:00.000Z",
        assignee: "SPC自动触发系统",
        analysis: "平坦度TTV 判异结果 OOC，规则命中 6 个批次",
        actions: "在制批次 3 个已执行扣留；已包装入成品库批次 3 个仅登记已入库，待质量侧在成品库/出货环节处置",
        type: "action",
        actionType: "batchHold",
        config: {
          actionType: "batchHold",
          holdRuleConfig: "rule-mock-eq002-flatness-window",
          holdRemarks: "SPC自动Hold规则「EQ002平坦度Monitor批次窗口扣留」触发（机台EQ002，OOC）"
        },
        batchHoldExecution: {
          ruleId: "rule-mock-eq002-flatness-window",
          ruleName: "EQ002平坦度Monitor批次窗口扣留",
          triggeredByEquipment: "EQ002",
          monitorType: "flatness",
          timeWindow: {
            start: "2026-09-12T00:15:00.000Z",
            end: "2026-09-12T08:15:00.000Z"
          },
          notifiedProcessEngineer: "王芳",
          notifiedQualityEngineer: "赵敏",
          batches: [
            {
              batchId: "527e34c6-8b7d-4dc4-a69d-6b9224165315",
              batchCode: "BATCHD7I17K",
              productCode: "P003",
              productName: "Product Gamma",
              quantity: 128,
              ingotId: "ING005",
              holdResult: "held",
              stationName: "几何参数检验",
              equipmentName: "测试设备",
              lastOutstationAt: "2026-09-12T02:20:00.000Z",
              holdAt: "2026-09-12T08:20:00.000Z"
            },
            {
              batchId: "a4a113ab-94fc-4129-96dc-122288fe8f0b",
              batchCode: "BATCHKMFH6V",
              productCode: "P006",
              productName: "Product Zeta",
              quantity: 275,
              ingotId: "ING005",
              holdResult: "held",
              stationName: "包装",
              lastOutstationAt: "2026-09-12T05:40:00.000Z",
              holdAt: "2026-09-12T08:20:00.000Z"
            },
            {
              batchId: "e3f7bb6a-08d1-4ffe-8887-3a7c8cafde44",
              batchCode: "BATCH52BSCJ",
              productCode: "P006",
              productName: "Product Zeta",
              quantity: 130,
              ingotId: "ING002",
              holdResult: "held",
              stationName: "硬打标",
              lastOutstationAt: "2026-09-12T06:10:00.000Z",
              holdAt: "2026-09-12T08:20:00.000Z"
            },
            {
              batchId: "fg-7a1d4c02-9b6e-4f51-8d33-2c61a0f7b5e1",
              batchCode: "BATCHFG0731",
              productCode: "P002",
              productName: "Product Beta",
              quantity: 296,
              ingotId: "ING002",
              holdResult: "stockedOnly",
              packagingBarcode: "PKG-20260912-0731",
              warehouseLocation: "成品库 A 区-03-12",
              inboundAt: "2026-09-12T03:30:00.000Z"
            },
            {
              batchId: "fg-3e58b9d7-41af-4c8a-b0d2-95e7c31684fa",
              batchCode: "BATCHFG0864",
              productCode: "P002",
              productName: "Product Beta",
              quantity: 288,
              ingotId: "ING002",
              holdResult: "stockedOnly",
              packagingBarcode: "PKG-20260912-0864",
              warehouseLocation: "成品库 A 区-03-14",
              inboundAt: "2026-09-12T04:20:00.000Z"
            },
            {
              batchId: "fg-c204f8ab-6d13-4e79-9a55-7b8e0d2f3c46",
              batchCode: "BATCHFG0912",
              productCode: "P004",
              productName: "Product Delta",
              quantity: 312,
              ingotId: "ING003",
              holdResult: "stockedOnly",
              packagingBarcode: "PKG-20260912-0912",
              warehouseLocation: "成品库 B 区-01-05",
              inboundAt: "2026-09-12T05:50:00.000Z"
            }
          ]
        }
      },
      {
        id: "auto-hold-notify",
        name: "工程异常反馈",
        description: "通知责任工艺工程师处理，并知会质量工程师",
        role: "工艺工程师",
        status: "processing",
        assignee: "王芳",
        analysis: "",
        actions: "",
        type: "action",
        actionType: "notifyPersonnel",
        config: {
          actionType: "notifyPersonnel",
          notificationMethods: ["email", "systemMessage"],
          emailConfig: {
            subject: "【SPC自动Hold】EQ002平坦度Monitor异常，已扣留3个在制批次",
            bodyTemplate: "规则「EQ002平坦度Monitor批次窗口扣留」命中6个批次，其中在制3个已扣留、已入库3个仅登记，请确认处置措施。",
            recipients: ["王芳"],
            cc: ["赵敏"]
          }
        }
      }
    ]
  }
];
