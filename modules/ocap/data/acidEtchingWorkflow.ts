// src/data/acidEtchingWorkflow.ts
import { WorkflowNode } from '../types/workflow';

export const acidEtchingWorkflow: WorkflowNode[] = [
  {
    id: 'ae-start',
    type: 'start',
    title: '开始',
    description: '工作流开始',
    position: { x: 100, y: 100 },
    connections: [{ targetNodeId: 'ae-1', sourceHandleId: 'right-source', targetHandleId: 'left-target' }]
  },
  {
    id: 'ae-1',
    type: 'action',
    title: '停止加工',
    description: '设备扣留，停止当前批次加工',
    position: { x: 280, y: 100 },
    config: {
      actionType: 'equipmentDisable',
      disableReason: '酸腐去除量可能异常，需停机检查',
      holdRule: 'immediate_hold',
      parameters: {
        operation: 'stop_processing',
        holdBatch: true,
        isolateEquipment: true,
        requireApproval: false
      },
      timeout: 300000
    },
    connections: [{ targetNodeId: 'ae-2', sourceHandleId: 'right-source', targetHandleId: 'left-target' }]
  },
  {
    id: 'ae-2',
    type: 'action',
    title: '复测',
    description: '复测硅片厚度计算去除量',
    position: { x: 460, y: 100 },
    config: {
      actionType: 'remeasure',
      testPath: 'Thickness_Remeasurement',
      parameters: {
        operation: 'thickness_remeasurement',
        calculation: 'removal_amount',
        sampleSize: 5,
        measurementPoints: ['center', 'edge_north', 'edge_south', 'edge_east', 'edge_west'],
        equipment: '单片测厚仪',
        recordData: true
      },
      responsiblePersonnel: ['测量员'],
      dataCollection: {
        parameters: ['thickness_before', 'thickness_after', 'removal_amount'],
        accuracy: 0.001
      },
      timeout: 600000,
      formTemplateId: 'system-retest-data-entry-001', // 新增：关联复测数据录入表单
      formTemplateName: '复测数据录入' // 新增：表单名称
    },
    connections: [{ targetNodeId: 'ae-3', sourceHandleId: 'right-source', targetHandleId: 'left-target' }]
  },
  {
    id: 'ae-3',
    type: 'condition',
    title: '去除量是否超规?',
    description: '异常产品复测后去除量超规判断',
    position: { x: 642, y: 90 },
    config: {
      dataSources: [{
        name: '厚度测量系统',
        parameters: ['removal_amount', 'spec_upper', 'spec_lower'],
        validationRules: {
          removal_amount: { required: true, type: 'number' },
          spec_upper: { required: true, type: 'number' },
          spec_lower: { required: true, type: 'number' }
        }
      }],
      conditionExpressions: [
        {
          expression: 'removal_amount >= spec_lower && removal_amount <= spec_upper',
          resultLabel: 'NO',
          description: '去除量在规格范围内'
        },
        {
          expression: 'removal_amount < spec_lower || removal_amount > spec_upper',
          resultLabel: 'YES',
          description: '去除量超出规格范围'
        }
      ],
      branchMappings: [
        { result: 'NO', targetNodeId: 'ae-end-normal', description: '正常流转' },
        { result: 'YES', targetNodeId: 'ae-4', description: '进入异常处理' }
      ],
      evaluationLogic: {
        operator: 'firstMatch',
        timeout: 30000
      }
    },
    connections: [
      { targetNodeId: 'ae-end-normal', sourceHandleId: 'right-source', targetHandleId: 'left-target' },
      { targetNodeId: 'ae-4', sourceHandleId: 'bottom-source', targetHandleId: 'top-target' }
    ]
  },
  {
    id: 'ae-4',
    type: 'condition',
    title: '是否校对单片测厚仪?',
    description: '检查测厚仪该班次校准记录',
    position: { x: 642, y: 240 },
    config: {
      dataSources: [{
        name: '设备校准记录',
        parameters: ['needCalibration', 'lastCalibrationDate', 'calibrationDueDate']
      }],
      conditionExpressions: [
        {
          expression: 'needCalibration == true',
          resultLabel: 'YES',
          description: '需要校准测厚仪'
        },
        {
          expression: 'needCalibration == false',
          resultLabel: 'NO',
          description: '测厚仪已校准'
        }
      ],
      branchMappings: [
        { result: 'NO', targetNodeId: 'ae-5', description: '返回正常流程' },
        { result: 'YES', targetNodeId: 'ae-7', description: '进行测厚仪校准' }
      ],
      fallbackAction: {
        condition: 'dataUnavailable',
        targetNodeId: 'ae-5',
        description: '数据不可用时默认校准'
      }
    },
    connections: [
      { targetNodeId: 'ae-5', sourceHandleId: 'right-source', targetHandleId: 'left-target' },
      { targetNodeId: 'ae-7', sourceHandleId: 'bottom-source', targetHandleId: 'top-target' }
    ]
  },
  {
    id: 'ae-5',
    type: 'action',
    title: '校对单片测厚仪',
    description: '量测标片片厚度，计算去除量',
    position: { x: 908, y: 250 },
    config: {
      actionType: 'equipmentCalibration',
      calibrationType: 'manual',
      equipmentList: ['单片测厚仪'],
      calibrationStandards: 'SEMI标准片',
      responsiblePersonnel: ['测量工程师'],
      parameters: {
        calibrationProcedure: 'SEMI_STD_001',
        tolerance: 0.001,
        verificationSamples: 5
      },
      validationRules: {
        calibrationResult: { required: true, type: 'boolean' },
        calibrationCertificate: { required: true, type: 'string' }
      },
      timeout: 3600000,
      retryConfig: {
        maxRetries: 2,
        retryDelay: 300000
      }
    },
    connections: [{ targetNodeId: 'ae-6', sourceHandleId: 'right-source', targetHandleId: 'left-target' }]
  },
  {
    id: 'ae-6',
    type: 'condition',
    title: '去除量是否超规?',
    description: '设备校准后针对异常产品去除量超规判断',
    position: { x: 1120, y: 240 },
    config: {
      dataSources: [{
        name: '厚度测量系统',
        parameters: ['removal_amount_calibrated', 'spec_upper', 'spec_lower']
      }],
      conditionExpressions: [
        {
          expression: 'removal_amount_calibrated >= spec_lower && removal_amount_calibrated <= spec_upper',
          resultLabel: 'NO',
          description: '校准后去除量正常'
        },
        {
          expression: 'removal_amount_calibrated < spec_lower || removal_amount_calibrated > spec_upper',
          resultLabel: 'YES',
          description: '校准后去除量仍异常'
        }
      ],
      branchMappings: [
        { result: 'NO', targetNodeId: 'ae-end-normal', description: '问题解决' },
        { result: 'YES', targetNodeId: 'ae-7', description: '继续排查' }
      ],
      evaluationLogic: {
        operator: 'firstMatch',
        requireAllData: true
      }
    },
    connections: [
      { targetNodeId: 'ae-end-normal', sourceHandleId: 'right-source', targetHandleId: 'left-target' },
      { targetNodeId: 'ae-7', sourceHandleId: 'bottom-source', targetHandleId: 'top-target' }
    ]
  },
  {
    id: 'ae-7',
    type: 'condition',
    title: '工艺是否选择错误?',
    description: '检查工艺配方设置',
    position: { x: 643, y: 390 },
    config: {
      dataSources: [
        {
          name: '工艺配方系统',
          parameters: ['recipeError', 'currentRecipe', 'expectedRecipe']
        },
        {
          name: '设备运行记录',
          parameters: ['recipeHistory', 'parameterDeviations']
        }
      ],
      conditionExpressions: [
        {
          expression: 'recipeError == true',
          resultLabel: 'YES',
          description: '工艺配方设置错误'
        },
        {
          expression: 'recipeError == false',
          resultLabel: 'NO',
          description: '工艺配方设置正确'
        }
      ],
      branchMappings: [
        { result: 'YES', targetNodeId: 'ae-8', description: '修正工艺配方' },
        { result: 'NO', targetNodeId: 'ae-10', description: '检查其他因素' }
      ],
      validationRules: {
        recipeError: { required: true, type: 'boolean' },
        currentRecipe: { required: true, type: 'string' }
      }
    },
    connections: [
      { targetNodeId: 'ae-8', sourceHandleId: 'right-source', targetHandleId: 'left-target' },
      { targetNodeId: 'ae-10', sourceHandleId: 'bottom-source', targetHandleId: 'top-target' }
    ]
  },
  {
    id: 'ae-8',
    type: 'action',
    title: '更改正确Recipe',
    description: '试化腐，计算修磨时间',
    position: { x: 908, y: 400 },
    config: {
      actionType: 'recipeCorrection',
      testPath: 'Recipe_Correction',
      parameters: {
        operation: 'change_recipe',
        trialGrinding: true,
        calculatePolishTime: true,
        recipeValidation: true,
        safetyChecks: ['chemical_compatibility', 'temperature_range', 'time_parameters']
      },
      responsiblePersonnel: ['工艺工程师'],
      approvalRequired: true,
      approvalRoles: ['工艺主管'],
      executionSteps: [
        '备份当前配方',
        '验证新配方参数',
        '执行试化腐操作',
        '计算修磨时间',
        '记录调整结果'
      ],
      timeout: 7200000
    },
    connections: [{ targetNodeId: 'ae-9', sourceHandleId: 'right-source', targetHandleId: 'left-target' }]
  },
  {
    id: 'ae-9',
    type: 'condition',
    title: '去除量是否超规?',
    description: '第3次判断（Recipe更改后）',
    position: { x: 1120, y: 390 },
    config: {
      dataSources: [{
        name: '厚度测量系统',
        parameters: ['removal_amount_recipe_corrected', 'spec_upper', 'spec_lower']
      }],
      conditionExpressions: [
        {
          expression: 'removal_amount_recipe_corrected >= spec_lower && removal_amount_recipe_corrected <= spec_upper',
          resultLabel: 'NO',
          description: '配方修正后去除量正常'
        },
        {
          expression: 'removal_amount_recipe_corrected < spec_lower || removal_amount_recipe_corrected > spec_upper',
          resultLabel: 'YES',
          description: '配方修正后去除量仍异常'
        }
      ],
      branchMappings: [
        { result: 'NO', targetNodeId: 'ae-end-hold', description: '问题解决' },
        { result: 'YES', targetNodeId: 'ae-10', description: '继续排查' }
      ],
      evaluationLogic: {
        operator: 'firstMatch',
        confidenceThreshold: 0.95
      }
    },
    connections: [
      { targetNodeId: 'ae-end-hold', sourceHandleId: 'right-source', targetHandleId: 'top-target' },
      { targetNodeId: 'ae-10', sourceHandleId: 'bottom-source', targetHandleId: 'top-target' }
    ]
  },
  {
    id: 'ae-10',
    type: 'condition',
    title: '是否试化腐计算腐蚀时间?',
    description: '评估试化腐必要性',
    position: { x: 642, y: 530 },
    config: {
      dataSources: [
        {
          name: '工艺参数系统',
          parameters: ['needTrialGrinding', 'grindingHistory', 'polishCurveData']
        },
        {
          name: '质量评估',
          parameters: ['deviationSeverity', 'batchPriority']
        }
      ],
      conditionExpressions: [
        {
          expression: 'needTrialGrinding == true',
          resultLabel: 'YES',
          description: '需要执行试化腐'
        },
        {
          expression: 'needTrialGrinding == false',
          resultLabel: 'NO',
          description: '无需试化腐'
        }
      ],
      branchMappings: [
        { result: 'NO', targetNodeId: 'ae-13', description: '跳过试化腐' },
        { result: 'YES', targetNodeId: 'ae-11', description: '执行试化腐' }
      ],
      decisionCriteria: {
        factors: ['historical_success_rate', 'time_constraints', 'material_availability'],
        weight: [0.4, 0.3, 0.3]
      }
    },
    connections: [
      { targetNodeId: 'ae-13', sourceHandleId: 'bottom-source', targetHandleId: 'top-target' },
      { targetNodeId: 'ae-11', sourceHandleId: 'right-source', targetHandleId: 'left-target' }
    ]
  },
  {
    id: 'ae-11',
    type: 'action',
    title: '试化腐',
    description: '根据修磨曲线计算修磨时间',
    position: { x: 914, y: 540 },
    config: {
      actionType: 'trialGrinding',
      testPath: 'Trial_Grinding',
      parameters: {
        operation: 'trial_grinding',
        calculatePolishTime: true,
        useCurveData: true,
        sampleSize: 3,
        measurementInterval: 30,
        curveParameters: ['removal_rate', 'time_coefficient', 'quality_factor']
      },
      responsiblePersonnel: ['工艺工程师', '操作员'],
      safetyMeasures: [
        '佩戴防护装备',
        '检查化学品浓度',
        '监控温度压力'
      ],
      dataCollection: {
        parameters: ['removal_amount_samples', 'time_data', 'quality_metrics'],
        frequency: 'continuous',
        duration: 1800000
      },
      timeout: 5400000
    },
    connections: [{ targetNodeId: 'ae-12', sourceHandleId: 'right-source', targetHandleId: 'left-target' }]
  },
  {
    id: 'ae-12',
    type: 'condition',
    title: '去除量是否超规?',
    description: '第4次判断（试化腐后）',
    position: { x: 1120, y: 530 },
    config: {
      dataSources: [{
        name: '试化腐结果',
        parameters: ['removal_amount_trial', 'spec_upper', 'spec_lower', 'polish_time_calculated']
      }],
      conditionExpressions: [
        {
          expression: 'removal_amount_trial >= spec_lower && removal_amount_trial <= spec_upper',
          resultLabel: 'NO',
          description: '试化腐后去除量正常'
        },
        {
          expression: 'removal_amount_trial < spec_lower || removal_amount_trial > spec_upper',
          resultLabel: 'YES',
          description: '试化腐后去除量仍异常'
        }
      ],
      branchMappings: [
        { result: 'NO', targetNodeId: 'ae-end-hold', description: '应用计算出的修磨时间' },
        { result: 'YES', targetNodeId: 'ae-13', description: '检查设备状态' }
      ],
      additionalOutputs: {
        polishTime: 'polish_time_calculated',
        confidenceLevel: 'calculated_confidence'
      }
    },
    connections: [
      { targetNodeId: 'ae-end-hold', sourceHandleId: 'right-source', targetHandleId: 'top-target' },
      { targetNodeId: 'ae-13', sourceHandleId: 'bottom-source', targetHandleId: 'top-target' }
    ]
  },
  {
    id: 'ae-13',
    type: 'condition',
    title: '设备是否有异常?',
    description: '检查设备运行状态',
    position: { x: 642, y: 690 },
    config: {
      dataSources: [
        {
          name: '设备监控系统',
          parameters: ['equipmentAbnormal', 'errorCodes', 'sensorReadings']
        },
        {
          name: '维护记录',
          parameters: ['lastMaintenance', 'maintenanceDue', 'historicalIssues']
        }
      ],
      conditionExpressions: [
        {
          expression: 'equipmentAbnormal == true',
          resultLabel: 'YES',
          description: '设备存在异常'
        },
        {
          expression: 'equipmentAbnormal == false',
          resultLabel: 'NO',
          description: '设备运行正常'
        }
      ],
      branchMappings: [
        { result: 'YES', targetNodeId: 'ae-14', description: '通知设备工程师' },
        { result: 'NO', targetNodeId: 'ae-16', description: '通知工艺工程师' }
      ],
      equipmentChecks: [
        'chemical_pump_pressure',
        'temperature_stability',
        'flow_rate_consistency',
        'sensor_calibration'
      ]
    },
    connections: [
      { targetNodeId: 'ae-14', sourceHandleId: 'right-source', targetHandleId: 'left-target' },
      { targetNodeId: 'ae-16', sourceHandleId: 'bottom-source', targetHandleId: 'top-target' }
    ]
  },
  {
    id: 'ae-14',
    type: 'action',
    title: '通知设备工程师',
    description: '异常恢复后重新测厚度',
    position: { x: 908, y: 700 },
    config: {
      actionType: 'notifyPersonnel',
      notificationMethods: ['email', 'systemMessage', 'mobileApp'],
      responsibleRoles: ['设备工程师'],
      escalationRules: {
        initialTimeout: 900000,
        escalationLevels: [
          { level: 1, timeout: 900000, roles: ['设备主管'] },
          { level: 2, timeout: 1800000, roles: ['生产经理'] }
        ]
      },
      emailConfig: {
        recipients: [],
        recipientGroups: ['设备工程师组'],
        subject: '酸腐设备异常-批次{{batchNumber}}',
        bodyTemplate: `设备异常需要处理
批次号：{{batchNumber}}
设备ID：{{equipmentId}}
去除量偏差：{{deviation}}
错误代码：{{errorCodes}}
发生时间：{{timestamp}}`,
        attachments: ['equipment_logs', 'sensor_data']
      },
      systemMessageConfig: {
        recipientIds: [],
        priority: 'urgent',
        messageTemplate: '酸腐设备异常需要立即处理 - 批次: {{batchNumber}}',
        autoAcknowledge: false,
        requireConfirmation: true
      },
      mobileAppConfig: {
        pushNotification: true,
        vibration: true,
        sound: 'alert'
      },
      responseRequirements: {
        required: true,
        timeout: 1800000,
        expectedActions: ['investigate', 'repair', 'document']
      }
    },
    connections: [{ targetNodeId: 'ae-15', sourceHandleId: 'right-source', targetHandleId: 'left-target' }]
  },
  {
    id: 'ae-15',
    type: 'condition',
    title: '去除量是否超规?',
    description: '第5次判断（设备恢复后）',
    position: { x: 1120, y: 690 },
    config: {
      dataSources: [{
        name: '厚度测量系统',
        parameters: ['removal_amount_after_repair', 'spec_upper', 'spec_lower']
      }],
      conditionExpressions: [
        {
          expression: 'removal_amount_after_repair >= spec_lower && removal_amount_after_repair <= spec_upper',
          resultLabel: 'NO',
          description: '设备修复后去除量正常'
        },
        {
          expression: 'removal_amount_after_repair < spec_lower || removal_amount_after_repair > spec_upper',
          resultLabel: 'YES',
          description: '设备修复后去除量仍异常'
        }
      ],
      branchMappings: [
        { result: 'NO', targetNodeId: 'ae-end-hold', description: '恢复生产' },
        { result: 'YES', targetNodeId: 'ae-16', description: '升级处理' }
      ],
      postRepairChecks: [
        'equipment_calibration_verified',
        'sensor_readings_normal',
        'process_parameters_stable'
      ]
    },
    connections: [
      { targetNodeId: 'ae-end-hold', sourceHandleId: 'right-source', targetHandleId: 'top-target' },
      { targetNodeId: 'ae-16', sourceHandleId: 'bottom-source', targetHandleId: 'top-target' }
    ]
  },
  {
    id: 'ae-16',
    type: 'action',
    title: '通知工艺工程师',
    description: '确认异常原因',
    position: { x: 672, y: 850 },
    config: {
      actionType: 'notifyPersonnel',
      notificationMethods: ['email', 'systemMessage'],
      responsibleRoles: ['工艺工程师'],
      escalationRules: {
        initialTimeout: 1200000,
        escalationLevels: [
          { level: 1, timeout: 1200000, roles: ['工艺主管'] },
          { level: 2, timeout: 2400000, roles: ['质量经理'] }
        ]
      },
      emailConfig: {
        recipients: [],
        recipientGroups: ['工艺工程师组'],
        cc: [],
        ccGroups: ['质量管理组'],
        subject: '酸腐去除量异常确认-批次{{batchNumber}}',
        bodyTemplate: `需要确认异常根本原因
批次号：{{batchNumber}}
产品型号：{{productModel}}
去除量实测：{{actualRemoval}}
规格范围：{{specRange}}
已执行措施：{{actionsTaken}}
设备状态：{{equipmentStatus}}
建议分析方向：{{analysisSuggestions}}`,
        attachments: ['process_data', 'quality_metrics', 'equipment_logs']
      },
      systemMessageConfig: {
        recipientIds: [],
        priority: 'high',
        messageTemplate: '酸腐去除量异常需要工艺分析 - 批次: {{batchNumber}}',
        requireResponse: true,
        responseOptions: ['root_cause_identified', 'further_investigation', 'process_adjustment']
      },
      dataRequirements: {
        requiredDocuments: ['root_cause_analysis', 'corrective_action_plan', 'preventive_measures'],
        analysisTools: ['fishbone_diagram', '5_whys', 'pareto_analysis']
      },
      isProcessEnd: true
    },
  },
  {
    id: 'ae-end-normal',
    type: 'end',
    title: '产品正常流转',
    description: '机台继续加工',
    position: { x: 1400, y: 82 },
    config: {
      endType: 'success',
      completionActions: [
        {
          type: 'resumeProduction',
          parameters: {
            operation: 'normal_processing',
            qualityCheck: 'passed',
            documentation: 'completed'
          }
        },
        {
          type: 'updateBatchStatus',
          parameters: {
            status: 'released',
            qualityGrade: 'A',
            nextOperation: 'next_process_step'
          }
        },
        {
          type: 'generateReport',
          parameters: {
            reportType: 'incident_resolution',
            includeData: ['measurements', 'adjustments', 'final_quality']
          }
        }
      ],
      successCriteria: {
        removalAmountInSpec: true,
        equipmentStable: true,
        documentationComplete: true
      }
    },
    connections: []
  },
  {
    id: 'ae-end-hold',
    type: 'action', // 修改为 'action' 类型
    title: '批次扣留', // 修改标题
    description: '执行批次扣留操作，并记录详细备注', // 修改描述
    position: { x: 1360, y: 850 },
    config: {
      actionType: 'batchHold', // 指定动作类型为 'batchHold'
      holdRemarks: '因去除量超出规格（OOS）而执行批次扣留，需提交工程师异常单确认。', // 添加扣留备注内容
      holdActions: [
        {
          type: 'placeOnHold',
          parameters: {
            holdReason: 'removal_amount_oos',
            holdCategory: 'quality_issue',
            requiredApprovals: ['quality_engineer', 'process_engineer']
          }
        },
        {
          type: 'createExceptionReport',
          parameters: {
            reportType: 'quality_exception',
            severity: 'high',
            investigationRequired: true
          }
        },
        {
          type: 'notifyStakeholders',
          parameters: {
            groups: ['quality_management', 'production_supervision', 'engineering_team'],
            urgency: 'immediate'
          }
        }
      ],
      resolutionRequirements: {
        requiredActions: ['root_cause_analysis', 'corrective_action', 'preventive_measure'],
        approvalWorkflow: 'engineering_approval',
        documentation: 'complete_investigation_report'
      },
      escalationPath: {
        level1: { role: 'quality_manager', timeout: 86400000 },
        level2: { role: 'plant_manager', timeout: 172800000 }
      },
      isProcessEnd: true
    },
    connections: []
  }
];

export const acidEtchingWorkflowMetadata = {
  name: '酸腐去除量异常处理流程',
  version: '1.1',
  description: '处理酸腐工艺中去除量OOC/OOS的OCAP处置流程',
  lastModified: '2024-01-20',
  createdBy: 'Process Engineering Team',
  department: 'Manufacturing Engineering',
  applicableProcesses: ['acid_etching', 'chemical_polishing'],
  supportedProducts: ['silicon_wafers', 'compound_semiconductors'],
  qualityStandards: ['SEMI', 'ISO9001', 'IATF16949'],
  performanceMetrics: {
    targetResolutionTime: 14400000,
    successRate: 0.95,
    falsePositiveRate: 0.02
  },
  changeHistory: [
    {
      version: '1.1',
      date: '2024-01-20',
      changes: ['优化节点结构，分离停止加工和复测操作', '重新布局流程节点，实现一屏显示', '更新节点ID和连接关系'],
      author: 'Process Engineering'
    },
    {
      version: '1.0',
      date: '2024-01-20',
      changes: ['初始版本创建', '基于历史数据优化判断逻辑'],
      author: 'Process Engineering'
    }
  ],
  trainingRequirements: [
    '酸腐工艺基础',
    '测量系统分析',
    '异常处理流程',
    '设备操作培训'
  ],
  referenceDocuments: [
    'SOP-ACID-001: 酸腐工艺标准操作流程',
    'WI-OCAP-005: 异常处理工作指导书',
    'FMEA-ETCH-003: 酸腐工艺失效模式分析'
  ]
};