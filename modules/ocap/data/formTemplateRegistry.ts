import { FormTemplate, FormTemplateCategoryConfig } from '../types/form';

export const categoryConfigs: FormTemplateCategoryConfig[] = [
  {
    category: 'quality_check',
    label: '质量检查',
    color: 'bg-blue-100 text-blue-800',
    icon: 'CheckCircle',
    description: '产品质量检查和验收表单'
  },
  {
    category: 'equipment_maintenance',
    label: '设备维护',
    color: 'bg-green-100 text-green-800',
    icon: 'Wrench',
    description: '设备保养和维护记录表单'
  },
  {
    category: 'production_record',
    label: '生产记录',
    color: 'bg-purple-100 text-purple-800',
    icon: 'FileText',
    description: '生产过程记录和数据采集'
  },
  {
    category: 'exception_handling',
    label: '异常处理',
    color: 'bg-red-100 text-red-800',
    icon: 'AlertTriangle',
    description: '异常情况记录和处理表单'
  },
  {
    category: 'calibration',
    label: '设备校准',
    color: 'bg-yellow-100 text-yellow-800',
    icon: 'Settings',
    description: '设备校准和验证表单'
  },
  {
    category: 'custom',
    label: '自定义',
    color: 'bg-gray-100 text-gray-800',
    icon: 'Package',
    description: '其他自定义表单模版'
  }
];

export const systemFormTemplates: FormTemplate[] = [
  {
    id: 'system-quality-check-001',
    name: '产品质量检查表',
    category: 'quality_check',
    description: '用于产品质量检查和验收的标准表单',
    status: 'active',
    version: '1.0.0',
    isSystemTemplate: true,
    metadata: {
      createdAt: '2024-01-01',
      createdBy: 'System',
      lastModified: '2024-01-01',
      lastModifiedBy: 'System',
      department: '质量部',
      tags: ['质量', '检查', '验收']
    },
    fields: [
      {
        id: 'field-1',
        type: 'text',
        label: '批次号',
        name: 'batchNumber',
        placeholder: '请输入批次号',
        validation: {
          required: true,
          minLength: 5,
          maxLength: 20
        }
      },
      {
        id: 'field-2',
        type: 'text',
        label: '产品名称',
        name: 'productName',
        placeholder: '请输入产品名称',
        validation: {
          required: true
        }
      },
      {
        id: 'field-3',
        type: 'number',
        label: '检查数量',
        name: 'inspectionQuantity',
        placeholder: '请输入检查数量',
        validation: {
          required: true,
          min: 1
        }
      },
      {
        id: 'field-4',
        type: 'select',
        label: '检查结果',
        name: 'inspectionResult',
        validation: {
          required: true
        },
        options: [
          { label: '合格', value: 'pass' },
          { label: '不合格', value: 'fail' },
          { label: '待复检', value: 'recheck' }
        ]
      },
      {
        id: 'field-5',
        type: 'textarea',
        label: '质量问题描述',
        name: 'qualityIssues',
        placeholder: '如有质量问题，请详细描述',
        rows: 4
      },
      {
        id: 'field-6',
        type: 'file',
        label: '检查照片',
        name: 'photos',
        helpText: '上传产品检查照片，支持JPG、PNG格式',
        acceptedFileTypes: ['image/jpeg', 'image/png'],
        maxFileSize: 5,
        maxFiles: 5
      }
    ]
  },
  {
    id: 'system-equipment-maintenance-001',
    name: '设备维护记录表',
    category: 'equipment_maintenance',
    description: '设备日常维护和保养记录表单',
    status: 'active',
    version: '1.0.0',
    isSystemTemplate: true,
    metadata: {
      createdAt: '2024-01-01',
      createdBy: 'System',
      lastModified: '2024-01-01',
      lastModifiedBy: 'System',
      department: '设备部',
      tags: ['设备', '维护', '保养']
    },
    fields: [
      {
        id: 'field-1',
        type: 'text',
        label: '设备编号',
        name: 'equipmentId',
        placeholder: '请输入设备编号',
        validation: {
          required: true
        }
      },
      {
        id: 'field-2',
        type: 'text',
        label: '设备名称',
        name: 'equipmentName',
        placeholder: '请输入设备名称',
        validation: {
          required: true
        }
      },
      {
        id: 'field-3',
        type: 'date',
        label: '维护日期',
        name: 'maintenanceDate',
        validation: {
          required: true
        }
      },
      {
        id: 'field-4',
        type: 'select',
        label: '维护类型',
        name: 'maintenanceType',
        validation: {
          required: true
        },
        options: [
          { label: '日常保养', value: 'daily' },
          { label: '定期维护', value: 'regular' },
          { label: '故障维修', value: 'repair' },
          { label: '预防性维护', value: 'preventive' }
        ]
      },
      {
        id: 'field-5',
        type: 'checkbox',
        label: '维护项目',
        name: 'maintenanceItems',
        validation: {
          required: true
        },
        multiple: true,
        options: [
          { label: '清洁设备', value: 'clean' },
          { label: '润滑部件', value: 'lubricate' },
          { label: '检查电气系统', value: 'electrical' },
          { label: '检查机械部件', value: 'mechanical' },
          { label: '更换易损件', value: 'replace' },
          { label: '校准参数', value: 'calibrate' }
        ]
      },
      {
        id: 'field-6',
        type: 'textarea',
        label: '维护内容详情',
        name: 'maintenanceDetails',
        placeholder: '请详细描述维护内容和发现的问题',
        rows: 5,
        validation: {
          required: true
        }
      },
      {
        id: 'field-7',
        type: 'select',
        label: '设备状态',
        name: 'equipmentStatus',
        validation: {
          required: true
        },
        options: [
          { label: '正常', value: 'normal' },
          { label: '需要关注', value: 'attention' },
          { label: '需要维修', value: 'repair_needed' }
        ]
      }
    ]
  },
  {
    id: 'system-exception-handling-001',
    name: '异常处理记录表',
    category: 'exception_handling',
    description: '生产异常情况记录和处理表单',
    status: 'active',
    version: '1.0.0',
    isSystemTemplate: true,
    metadata: {
      createdAt: '2024-01-01',
      createdBy: 'System',
      lastModified: '2024-01-01',
      lastModifiedBy: 'System',
      department: '生产部',
      tags: ['异常', '处理', 'OCAP']
    },
    fields: [
      {
        id: 'field-1',
        type: 'select',
        label: '异常类型',
        name: 'exceptionType',
        validation: {
          required: true
        },
        options: [
          { label: '超温异常', value: 'temperature' },
          { label: '超压异常', value: 'pressure' },
          { label: '质量异常', value: 'quality' },
          { label: '设备故障', value: 'equipment' },
          { label: '其他', value: 'other' }
        ]
      },
      {
        id: 'field-2',
        type: 'text',
        label: '批次号',
        name: 'batchNumber',
        placeholder: '请输入批次号',
        validation: {
          required: true
        }
      },
      {
        id: 'field-3',
        type: 'text',
        label: '设备编号',
        name: 'equipmentId',
        placeholder: '请输入设备编号',
        validation: {
          required: true
        }
      },
      {
        id: 'field-4',
        type: 'datetime',
        label: '发现时间',
        name: 'discoveryTime',
        validation: {
          required: true
        }
      },
      {
        id: 'field-5',
        type: 'textarea',
        label: '异常描述',
        name: 'exceptionDescription',
        placeholder: '请详细描述异常情况',
        rows: 4,
        validation: {
          required: true,
          minLength: 10
        }
      },
      {
        id: 'field-6',
        type: 'radio',
        label: '影响程度',
        name: 'impactLevel',
        validation: {
          required: true
        },
        options: [
          { label: '轻微', value: 'low' },
          { label: '中等', value: 'medium' },
          { label: '严重', value: 'high' },
          { label: '紧急', value: 'critical' }
        ]
      },
      {
        id: 'field-7',
        type: 'textarea',
        label: '原因分析',
        name: 'rootCauseAnalysis',
        placeholder: '请分析异常产生的根本原因',
        rows: 4,
        validation: {
          required: true
        }
      },
      {
        id: 'field-8',
        type: 'textarea',
        label: '处理措施',
        name: 'correctionActions',
        placeholder: '请描述采取的处理措施',
        rows: 4,
        validation: {
          required: true
        }
      },
      {
        id: 'field-9',
        type: 'file',
        label: '附件',
        name: 'attachments',
        helpText: '上传相关照片、数据等附件',
        maxFileSize: 10,
        maxFiles: 10
      }
    ]
  },
  {
    id: 'system-calibration-001',
    name: '设备校准记录表',
    category: 'calibration',
    description: '测量设备校准和验证记录表单',
    status: 'active',
    version: '1.0.0',
    isSystemTemplate: true,
    metadata: {
      createdAt: '2024-01-01',
      createdBy: 'System',
      lastModified: '2024-01-01',
      lastModifiedBy: 'System',
      department: '质量部',
      tags: ['校准', '计量', '设备']
    },
    fields: [
      {
        id: 'field-1',
        type: 'text',
        label: '设备编号',
        name: 'equipmentId',
        placeholder: '请输入设备编号',
        validation: {
          required: true
        }
      },
      {
        id: 'field-2',
        type: 'text',
        label: '设备名称',
        name: 'equipmentName',
        placeholder: '根据设备编号自动获取',
        disabled: true,
        validation: {
          required: true
        }
      },
      {
        id: 'field-3',
        type: 'datetime',
        label: '校准日期',
        name: 'calibrationDate',
        defaultValue: 'CURRENT_DATETIME',
        validation: {
          required: true
        }
      },
      {
        id: 'field-8',
        type: 'textarea',
        label: '校准结果',
        name: 'calibrationResults',
        placeholder: '请记录校准测试数据和结果',
        rows: 5,
        validation: {
          required: true
        }
      },
      {
        id: 'field-10',
        type: 'text',
        label: '校准人员',
        name: 'calibratedBy',
        placeholder: '请输入校准人员姓名',
        defaultValue: 'CURRENT_USER',
        validation: {
          required: true
        }
      }
    ]
  },
  {
    id: 'system-retest-data-entry-001',
    name: '复测数据录入',
    category: 'quality_check',
    description: '用于复测节点复测数据的录入，支持复测站点的参数录入',
    status: 'active',
    version: '1.0.0',
    isSystemTemplate: true,
    metadata: {
      createdAt: '2024-01-01',
      createdBy: 'System',
      lastModified: '2024-01-01',
      lastModifiedBy: 'System',
      department: '质量部',
      tags: ['复测', '数据录入', '质量检查']
    },
    fields: [
      {
        id: 'field-1',
        type: 'measurement_entry',
        label: '复测数据录入',
        name: 'retestData',
        validation: {
          required: true
        },
        measurementConfig: {
          measurementSourceType: 'retest_site_params',
          systemColumns: ['sublotId', 'waferId']
        }
      },
      {
        id: 'field-2',
        type: 'textarea',
        label: '复测备注',
        name: 'retestNotes',
        placeholder: '请输入复测相关备注信息',
        rows: 4
      }
    ]
  }
];