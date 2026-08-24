export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file'
  | 'custom_input' // 新增：自定义输入框类型
  | 'custom_selector' // 新增：自定义选择器类型
  | 'measurement_entry' // 新增：量测参数录入类型
  | 'equipment_entry'; // 新增：设备录入类型

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
  customValidator?: string;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface MeasurementColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date';
  editable?: boolean;
  unit?: string;
  options?: SelectOption[];
  validation?: FieldValidation;
  
  // 表格列配置
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  sortable?: boolean;
  resizable?: boolean;
  hidden?: boolean;
  tooltip?: string;
  className?: string;
  headerClassName?: string;
  formatter?: (value: any, row: any, index: number) => any;
  editor?: {
    type: 'input' | 'select' | 'number' | 'date';
    options?: SelectOption[];
    props?: Record<string, any>;
  };
  
  // 新增：系统默认列的标识
  isSystem?: boolean;
}

export interface MeasurementConfig {
  // 基础配置
  columns: MeasurementColumn[];
  defaultRows: number;
  minRows?: number;
  maxRows?: number;
  showRowNumbers?: boolean;
  allowAddRemove?: boolean;
  
  // 表格功能配置
  showSummary?: boolean;
  summaryColumns?: string[];
  stickyHeader?: boolean;
  rowHeight?: number;
  autoSave?: boolean;
  editMode?: 'inline' | 'dialog';
  showIndex?: boolean;
  pagination?: boolean;
  pageSize?: number;
  virtualScroll?: boolean;
  
  // 样式配置
  rowClassName?: string | ((row: any, index: number) => string);
  cellClassName?: string | ((row: any, column: MeasurementColumn, index: number) => string);
  
  // 交互配置
  onRowClick?: string;
  onCellClick?: string;
  customActions?: Array<{
    label: string;
    action: string;
    icon?: string;
    className?: string;
  }>;
  
  // 导入导出配置
  exportable?: boolean;
  importable?: boolean;
  
  // 验证配置
  validationRules?: Record<string, FieldValidation>;
  
  // 新增：量测参数项选择逻辑类型
  measurementSourceType?: 'retest_station_params' | 'manual_selection';
}

// 新增：设备录入配置接口
export interface EquipmentEntryConfig {
  // 数据源配置
  equipmentSource: string | string[]; // URL 或预定义列表名
  
  // 搜索与筛选配置
  searchable?: boolean;
  searchFields?: string[]; // 搜索字段列表
  filterable?: boolean;
  
  // 输入方式配置
  allowBarcodeScan?: boolean;
  allowManualInput?: boolean;
  allowMultipleSelection?: boolean;
  
  // 字段映射配置
  displayField: string; // 显示字段名
  valueField: string; // 值字段名
  additionalFields?: string[]; // 需要获取的额外字段
  
  // 显示配置
  showEquipmentImage?: boolean;
  imageField?: string;
  showEquipmentInfo?: boolean;
  infoFields?: string[];
  
  // 验证配置
  maxSelected?: number;
  requireEquipmentOnline?: boolean;
  
  // 自定义配置
  customFilter?: (equipment: any) => boolean;
  onEquipmentSelect?: (equipment: any) => void;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: any;
  helpText?: string;
  validation?: FieldValidation;
  disabled?: boolean; // 新增：控制字段禁用状态

  options?: SelectOption[];
  multiple?: boolean;

  rows?: number;

  step?: number;
  decimalPlaces?: number;

  dateFormat?: string;
  minDate?: string;
  maxDate?: string;

  acceptedFileTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;

  // 量测参数录入组件的配置
  measurementConfig?: MeasurementConfig;
  
  // 新增：设备录入组件的配置
  equipmentEntryConfig?: EquipmentEntryConfig;
}

export type FormTemplateCategory =
  | 'quality_check'
  | 'equipment_maintenance'
  | 'production_record'
  | 'exception_handling'
  | 'calibration'
  | 'custom';

export type FormTemplateStatus = 'active' | 'draft' | 'archived';

export interface FormTemplate {
  id: string;
  name: string;
  category: FormTemplateCategory;
  description: string;
  fields: FormField[];
  status: FormTemplateStatus;
  version: string;
  metadata: {
    createdAt: string;
    createdBy: string;
    lastModified: string;
    lastModifiedBy: string;
    department?: string;
    tags?: string[];
  };
  isSystemTemplate: boolean;
}

export interface FormTemplateCategoryConfig {
  category: FormTemplateCategory;
  label: string;
  color: string;
  icon: string;
  description: string;
}