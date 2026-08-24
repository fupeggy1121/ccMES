import { WorkflowTemplate } from '../types/workflow';
import { WorkOrder, WorkOrderStage, SPCParameters, AbnormalValue, OutOfLimitRule } from '../types/workOrder';

const batchPrefixes = ['BT231', 'BT232', 'BT233'];
const productModels = ['F28H-12', 'W22-7', 'D35-9', 'M58-T3', 'K72-5', 'L45-8'];

const equipmentByCategory = {
  acid_etching: ['酸蚀机 AE-3000', '酸蚀机 AE-5500', '酸腐设备 AC-2800'],
  temperature: ['扩散炉 DF-3200', '加热炉 HF-4500', '退火炉 AF-6000'],
  pressure: ['真空泵 VP-8000', '压力腔 PC-5000', '真空炉 VF-3500'],
  quality: ['检测仪 QI-7000', '测量机 MM-4000', '扫描仪 SI-9000'],
  equipment: ['镀膜机 SP-9200', '离子注入机 II-8000', '抛光机 PL-4500'],
  custom: ['通用设备 GE-1000', '测试设备 TE-2000']
};

const exceptionTypeByCategory = {
  acid_etching: '工艺异常',
  temperature: 'SPC OCAP',
  pressure: 'SPC OCAP',
  quality: '质量缺陷',
  equipment: '设备异常',
  custom: '工艺异常'
};

const personnelByRole = {
  '工艺工程师': ['张工', '李工', '王工', '刘工', '陈工'],
  '设备工程师': ['赵工', '周工', '孙工', '钱工', '郑工'],
  '质量工程师': ['李经理', '王经理', '张经理'],
  '测量员': ['测量员A', '测量员B', '测量员C'],
  '质量检验员': ['检验员A', '检验员B'],
  '质量部': ['王总监', '李总监'],
  '材料工程师': ['吴工', '冯工', '马工']
};

const departmentByRole = {
  '工艺工程师': '工艺部',
  '设备工程师': '设备部',
  '质量工程师': '质量部',
  '测量员': '测量中心',
  '质量检验员': '质量部',
  '质量部': '质量部',
  '材料工程师': '材料部'
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateBatchNumber(): string {
  const prefix = randomChoice(batchPrefixes);
  const suffix = String(randomInt(10000, 99999));
  return prefix + suffix;
}

function generateEquipment(category: string): string {
  const equipment = equipmentByCategory[category as keyof typeof equipmentByCategory] || equipmentByCategory.custom;
  return randomChoice(equipment);
}

function generateProductModel(): string {
  return randomChoice(productModels);
}

function getExceptionType(category: string): string {
  return exceptionTypeByCategory[category as keyof typeof exceptionTypeByCategory] || '工艺异常';
}

function generatePersonnelByRole(role: string): string {
  const personnel = personnelByRole[role as keyof typeof personnelByRole];
  if (!personnel || personnel.length === 0) {
    return randomChoice(['张工', '李工', '王工']);
  }
  return randomChoice(personnel);
}

function getDepartmentByRole(role: string): string {
  return departmentByRole[role as keyof typeof departmentByRole] || '工艺部';
}

function generateDescription(category: string, exceptionType: string): string {
  const descriptions = {
    acid_etching: [
      '酸腐去除量超出规格范围，需要立即处理',
      '酸蚀速率异常，表面均匀性不达标',
      '酸液浓度偏离标准值，影响加工质量'
    ],
    temperature: [
      '温度控制参数超出规格上限，测量值偏高',
      '炉温分布不均匀，局部温度超标',
      '温度控制系统出现波动，需要校准'
    ],
    pressure: [
      '真空度低于标准值，可能存在泄漏',
      '压力控制不稳定，波动超出允许范围',
      '腔体压力异常，影响工艺质量'
    ],
    quality: [
      '产品外观出现缺陷，需要分析原因',
      '尺寸测量超出公差范围',
      '表面质量检测不合格'
    ],
    equipment: [
      '设备运行参数异常，需要检修',
      '关键部件磨损严重，影响加工精度',
      '设备故障报警，需要维护'
    ],
    custom: [
      '工艺参数异常，需要调查原因',
      '生产过程中发现质量问题',
      '设备性能下降，需要评估'
    ]
  };

  const categoryDescriptions = descriptions[category as keyof typeof descriptions] || descriptions.custom;
  return randomChoice(categoryDescriptions);
}

function generateSPCParameters(category: string): {
  spcParameters: SPCParameters;
  abnormalValue: AbnormalValue;
  outOfLimitRule: OutOfLimitRule;
  parameters: string;
} | null {
  if (category !== 'temperature' && category !== 'pressure') {
    return null;
  }

  if (category === 'temperature') {
    const targetTemp = randomInt(800, 1200);
    const deviation = randomInt(5, 15);
    const measuredTemp = targetTemp + deviation;
    const ucl = targetTemp + 10;
    const lcl = targetTemp - 10;
    const usl = targetTemp + 20;
    const lsl = targetTemp - 20;

    return {
      spcParameters: {
        controlParameter: '炉温',
        specification: `${targetTemp}±20°C`,
        measuredValue: `${measuredTemp}°C`,
        controlLimits: {
          ucl: `${ucl}°C`,
          lcl: `${lcl}°C`,
          usl: `${usl}°C`,
          lsl: `${lsl}°C`
        }
      },
      abnormalValue: {
        value: `${measuredTemp}°C`,
        deviation: `+${deviation}°C`,
        deviationPercent: `${Math.round((deviation / targetTemp) * 100)}%`
      },
      outOfLimitRule: {
        ruleName: '单点超出控制上限',
        ruleDescription: '单个测量点超出UCL控制上限',
        triggerCondition: `测量值 > UCL (${ucl}°C)`
      },
      parameters: `目标温度: ${targetTemp}°C\n加热功率: ${randomInt(50, 90)}%\n保温时间: ${randomInt(30, 120)}min`
    };
  } else {
    const targetPressure = randomInt(10, 50);
    const deviation = randomInt(3, 8);
    const measuredPressure = targetPressure - deviation;
    const ucl = targetPressure + 5;
    const lcl = targetPressure - 5;
    const usl = targetPressure + 10;
    const lsl = targetPressure - 10;

    return {
      spcParameters: {
        controlParameter: '真空压力',
        specification: `${targetPressure}±10Pa`,
        measuredValue: `${measuredPressure}Pa`,
        controlLimits: {
          ucl: `${ucl}Pa`,
          lcl: `${lcl}Pa`,
          usl: `${usl}Pa`,
          lsl: `${lsl}Pa`
        }
      },
      abnormalValue: {
        value: `${measuredPressure}Pa`,
        deviation: `-${deviation}Pa`,
        deviationPercent: `${Math.round((deviation / targetPressure) * 100)}%`
      },
      outOfLimitRule: {
        ruleName: '单点低于控制下限',
        ruleDescription: '单个测量点低于LCL控制下限',
        triggerCondition: `测量值 < LCL (${lcl}Pa)`
      },
      parameters: `目标压力: ${targetPressure}Pa\n抽气速率: ${randomInt(100, 500)}L/s\n稳定时间: ${randomInt(10, 30)}min`
    };
  }
}

function generateWorkOrderStages(
  template: WorkflowTemplate,
  createDate: (daysOffset: number, hoursOffset?: number) => string
): { stages: WorkOrderStage[]; currentStage: number; currentAssignee: any } {
  const stages: WorkOrderStage[] = [];
  const actionNodes = template.workflowData.filter(node =>
    node.type === 'action' || node.type === 'condition'
  );

  actionNodes.forEach((node, index) => {
    // 关键修改点：重新设计角色和动作类型的分配逻辑
    let stageRole: string;
    let stageActionType: string | undefined;

    if (node.type === 'condition') {
      // 条件节点：角色固定为"系统"，无动作类型
      stageRole = '系统';
      stageActionType = undefined;
    } else {
      // 动作节点：从 workflowData 传递 actionType
      stageActionType = node.config?.actionType;
      
      // 检查是否为需要系统处理的特殊动作类型
      const systemActionTypes = ['batchHold', 'equipmentDisable'];
      if (stageActionType && systemActionTypes.includes(stageActionType)) {
        // batchHold 和 equipmentDisable 类型的动作由系统处理
        stageRole = '系统';
      } else {
        // 其他动作类型使用配置的责任人或默认值
        stageRole = node.config?.responsiblePersonnel?.[0] || '工艺工程师';
      }
    }

    const stage: WorkOrderStage = {
      id: node.id,
      name: node.title,
      role: stageRole,
      status: 'processing',
      type: node.type,
      actionType: stageActionType,
      config: node.config  // 新增：将原始节点的配置信息复制到阶段中
    };

    stages.push(stage);
  });

  if (stages.length === 0) {
    stages.push({
      id: 'default-stage',
      name: '异常处理',
      role: '工艺工程师',
      status: 'processing',
      type: 'action',
      config: {}  // 新增：为默认阶段添加空的配置对象
    });
  }

  let currentStage = 0;
  let currentAssignee = null;

  // 随机决定工单进度
  const progressType = randomInt(0, 2); // 0: 刚开始, 1: 进行中, 2: 已完成

  if (progressType === 0) {
    // 刚开始：只有第一个阶段是 processing
    currentStage = 0;
    stages[0].status = 'processing';
    
    // 系统角色的阶段不分配人类负责人
    if (stages[0].role !== '系统') {
      const assigneeName = generatePersonnelByRole(stages[0].role);
      stages[0].assignee = assigneeName;
      currentAssignee = {
        name: assigneeName,
        department: getDepartmentByRole(stages[0].role),
        role: stages[0].role
      };
    }
  } else if (progressType === 1) {
    // 进行中：部分阶段完成，当前阶段 processing
    currentStage = randomInt(1, Math.max(1, stages.length - 2));

    for (let i = 0; i < currentStage; i++) {
      stages[i].status = 'completed';
      stages[i].completedAt = createDate(randomInt(3, 7), randomInt(0, 12));
      
      // 系统角色的阶段不分配人类负责人
      if (stages[i].role !== '系统') {
        stages[i].assignee = generatePersonnelByRole(stages[i].role);
      }
    }

    stages[currentStage].status = 'processing';
    
    // 系统角色的阶段不分配人类负责人
    if (stages[currentStage].role !== '系统') {
      const assigneeName = generatePersonnelByRole(stages[currentStage].role);
      stages[currentStage].assignee = assigneeName;
      currentAssignee = {
        name: assigneeName,
        department: getDepartmentByRole(stages[currentStage].role),
        role: stages[currentStage].role
      };
    }
  } else {
    // 已完成：所有阶段都是 completed
    currentStage = stages.length - 1;
    stages.forEach((stage, index) => {
      stage.status = 'completed';
      stage.completedAt = createDate(randomInt(5, 10) - index, randomInt(0, 8));
      
      // 系统角色的阶段不分配人类负责人
      if (stage.role !== '系统') {
        stage.assignee = generatePersonnelByRole(stage.role);
      }
    });
    currentAssignee = null;
  }

  return { stages, currentStage, currentAssignee };
}

export function generateWorkOrderFromTemplate(
  template: WorkflowTemplate,
  orderNumber: number,
  createDate: (daysOffset: number, hoursOffset?: number) => string
): WorkOrder {
  const batchNumber = generateBatchNumber();
  const equipment = generateEquipment(template.category);
  const productModel = generateProductModel();
  const exceptionType = getExceptionType(template.category);
  const description = generateDescription(template.category, exceptionType);

  const spcData = generateSPCParameters(template.category);
  const { stages, currentStage, currentAssignee } = generateWorkOrderStages(template, createDate);

  const submitterRole = stages[0]?.role || '工艺工程师';
  const submitter = generatePersonnelByRole(submitterRole);

  // 根据 stages 状态派生出工单整体状态
  const allStagesCompleted = stages.every(stage => stage.status === 'completed');
  const status = allStagesCompleted ? 'completed' : 'processing';

  const workOrder: WorkOrder = {
    id: `OCAP-2023-${String(orderNumber).padStart(3, '0')}`,
    name: `${template.name.replace('工作流', '')}处理工单`,
    batchNumber,
    equipment,
    productModel,
    exceptionType,
    description,
    status,
    submitter,
    createdAt: createDate(randomInt(1, 6), randomInt(0, 12)),
    currentStage,
    currentAssignee,
    stages
  };

  if (spcData) {
    workOrder.spcParameters = spcData.spcParameters;
    workOrder.abnormalValue = spcData.abnormalValue;
    workOrder.outOfLimitRule = spcData.outOfLimitRule;
    workOrder.parameters = spcData.parameters;
  }

  return workOrder;
}

export function generateWorkOrdersFromTemplates(
  templates: WorkflowTemplate[],
  ordersPerTemplate: number,
  startOrderNumber: number,
  createDate: (daysOffset: number, hoursOffset?: number) => string
): WorkOrder[] {
  const workOrders: WorkOrder[] = [];
  let orderNumber = startOrderNumber;

  templates.forEach(template => {
    for (let i = 0; i < ordersPerTemplate; i++) {
      const workOrder = generateWorkOrderFromTemplate(template, orderNumber, createDate);
      workOrders.push(workOrder);
      orderNumber++;
    }
  });

  return workOrders;
}