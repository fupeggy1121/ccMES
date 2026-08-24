export interface ProductModel {
  id: string;
  name: string;
  specifications: StationSpecification[];
}

export interface StationSpecification {
  stationId: string;
  stationName: string;
  category?: 'main' | 'specialSampling' | 'monitor';
  parameters: ParameterSpecification[];
}

export interface ParameterSpecification {
  parameterId: string;
  parameterName: string;
  unit: string;
  lowerLimit: number;
  upperLimit: number;
  target: number;
}

export interface ProductBatch {
  id: string;
  productModelId: string;
  productModelName: string;
  batchNumber: string;
  quantity: number;
  completedAt: string;
  status: 'pending' | 'auto_approved' | 'manual_review' | 'approved' | 'rejected';
  products: Product[];
}

export interface Product {
  id: string;
  serialNumber: string;
  lotId: string;
  sublotId: string;
  packageBarcodeId: string;
  measurements: Measurement[];
  isCompliant: boolean;
  nonCompliantItems: NonCompliantItem[];
}

export interface Measurement {
  stationId: string;
  stationName: string;
  parameterId: string;
  parameterName: string;
  value: number;
  unit: string;
  isCompliant: boolean;
  specification: ParameterSpecification;
}

export interface NonCompliantItem {
  stationId: string;
  stationName: string;
  parameterId: string;
  parameterName: string;
  value: number;
  lowerLimit: number;
  upperLimit: number;
  unit: string;
  deviation: number;
}

export interface AuditRecord {
  id: string;
  batchId: string;
  batchNumber: string;
  auditType: 'auto' | 'manual';
  status: 'approved' | 'rejected' | 'pending';
  auditorId?: string;
  auditorName?: string;
  auditedAt: string;
  comments?: string;
  nonCompliantCount: number;
  totalProductCount: number;
  auditReport: AuditReport;
}

export interface AuditReport {
  batchSummary: {
    totalProducts: number;
    compliantProducts: number;
    nonCompliantProducts: number;
    complianceRate: number;
  };
  stationSummary: {
    stationId: string;
    stationName: string;
    totalMeasurements: number;
    compliantMeasurements: number;
    complianceRate: number;
  }[];
  nonCompliantDetails: NonCompliantItem[];
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'quality_inspector' | 'operator';
}

export interface ApprovalTemplateConfig {
  id: string;
  productModelId: string;
  version: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  approvalItems: ApprovalItem[];
}

export interface ApprovalItem {
  id: string;
  stationId: string;
  stationName: string;
  parameterId: string;
  parameterName: string;
  unit: string;
  isEnabled: boolean;
  aggregationMethods: AggregationMethod[];
}

export interface AggregationMethod {
  id: string;
  type: 'min' | 'max' | 'avg' | 'std' | 'range' | 'cp' | 'cpk' | 'median';
  name: string;
  isEnabled: boolean;
  specification: SpecificationLimit;
}

export interface SpecificationLimit {
  upperLimit: number;
  lowerLimit: number;
  target: number;
  tolerance: number;
}

export interface ProductModelExtended extends ProductModel {
  modelNumber: string;
  version: string;
  productType: string;
  productUsage: string;
  processRoute: string;
  updatedAt: string;
  approvalTemplate?: ApprovalTemplateConfig;
}

export interface WaferBox {
  id: string;
  boxId: string;
  position: string;
  wafers: Wafer[];
  complianceRate: number;
  inspectedAt: string;
  status: 'pending' | 'passed' | 'failed';
}

export interface Wafer {
  id: string;
  productModelId: string;
  status: 'pending' | 'passed' | 'failed';
  inspectionResult?: string;
  inspectedAt?: string;
}
