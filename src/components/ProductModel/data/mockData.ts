// src/data/mockData.ts
import { ProductCategory, StationSubPath } from '../types/Product';
import { Product } from '../types/Product'; // 导入 Product 类型

// 模拟的子路径数据 - 可能仍然是前端特有的数据
export const mockSubPaths: StationSubPath[] = [
  // 清洗相关的子路径
  { id: 'sp1', name: '常规清洗', type: 'regular', description: '标准清洗流程，用于正常生产', returnStationCode: 'CLEAN_001', canBeDisabled: true, defaultEnabled: true },
  { id: 'sp2', name: '返工清洗', type: 'rework', description: '返工清洗流程，用于返工产品', returnStationCode: 'CLEAN_001', canBeDisabled: true, defaultEnabled: true },
  { id: 'sp3', name: '抽检清洗', type: 'specialSampling', description: '质量抽检流程，用于抽样检测', returnStationCode: 'CLEAN_001', canBeDisabled: false, defaultEnabled: false },
  { id: 'sp4', name: '深度清洗', type: 'regular', description: '深度清洗流程，用于高要求产品', returnStationCode: 'CLEAN_001', canBeDisabled: true, defaultEnabled: false },
  
  // 氧化相关的子路径
  { id: 'sp5', name: '常规氧化', type: 'regular', description: '标准氧化工艺', returnStationCode: 'OXIDE_001', canBeDisabled: true, defaultEnabled: true },
  { id: 'sp6', name: '返工氧化', type: 'rework', description: '返工氧化工艺，重新氧化', returnStationCode: 'OXIDE_001', canBeDisabled: true, defaultEnabled: true },
  { id: 'sp7', name: '抽检氧化', type: 'specialSampling', description: '氧化层质量抽检', returnStationCode: 'OXIDE_001', canBeDisabled: false, defaultEnabled: false },
  { id: 'sp8', name: '薄氧化', type: 'regular', description: '薄氧化层工艺', returnStationCode: 'OXIDE_001', canBeDisabled: true, defaultEnabled: false },
  
  // 光刻相关的子路径
  { id: 'sp9', name: '常规光刻', type: 'regular', description: '标准光刻工艺', returnStationCode: 'LITHO_001', canBeDisabled: true, defaultEnabled: true },
  { id: 'sp10', name: '返工光刻', type: 'rework', description: '返工光刻，重新光刻', returnStationCode: 'LITHO_001', canBeDisabled: true, defaultEnabled: true },
  { id: 'sp11', name: '抽检光刻', type: 'specialSampling', description: '光刻精度抽检', returnStationCode: 'LITHO_001', canBeDisabled: false, defaultEnabled: false },
  { id: 'sp12', name: '精细光刻', type: 'regular', description: '精细图形光刻工艺', returnStationCode: 'LITHO_001', canBeDisabled: true, defaultEnabled: false },
  
  // 刻蚀相关的子路径
  { id: 'sp13', name: '常规刻蚀', type: 'regular', description: '标准刻蚀工艺', returnStationCode: 'ETCH_001', canBeDisabled: true, defaultEnabled: true },
  { id: 'sp14', name: '返工刻蚀', type: 'rework', description: '返工刻蚀，重新刻蚀', returnStationCode: 'ETCH_001', canBeDisabled: true, defaultEnabled: true },
  { id: 'sp15', name: '抽检测蚀', type: 'specialSampling', description: '刻蚀深度抽检', returnStationCode: 'ETCH_001', canBeDisabled: false, defaultEnabled: false },
  { id: 'sp16', name: '深度刻蚀', type: 'regular', description: '深度刻蚀工艺', returnStationCode: 'ETCH_001', canBeDisabled: true, defaultEnabled: false },
  
  // 离子注入相关的子路径
  { id: 'sp17', name: '常规注入', type: 'regular', description: '标准离子注入工艺', returnStationCode: 'IMPLANT_001', canBeDisabled: true, defaultEnabled: true },
  { id: 'sp18', name: '返工注入', type: 'rework', description: '返工离子注入', returnStationCode: 'IMPLANT_001', canBeDisabled: true, defaultEnabled: true },
  { id: 'sp19', name: '抽检注入', type: 'specialSampling', description: '注入浓度抽检', returnStationCode: 'IMPLANT_001', canBeDisabled: false, defaultEnabled: false },
  { id: 'sp20', name: '低剂量注入', type: 'regular', description: '低剂量离子注入工艺', returnStationCode: 'IMPLANT_001', canBeDisabled: true, defaultEnabled: false },
  
  // 抛光相关的子路径
  { id: 'sp21', name: '常规抛光', type: 'regular', description: '标准抛光流程', returnStationCode: 'POLISH_001', canBeDisabled: true, defaultEnabled: true },
  { id: 'sp22', name: '返工抛光', type: 'rework', description: '返工抛光流程', returnStationCode: 'POLISH_001', canBeDisabled: true, defaultEnabled: true },
  { id: 'sp23', name: '抽检抛光', type: 'specialSampling', description: '抛光质量抽检', returnStationCode: 'POLISH_001', canBeDisabled: false, defaultEnabled: false },
  { id: 'sp24', name: '精细抛光', type: 'regular', description: '高精度抛光工艺', returnStationCode: 'POLISH_001', canBeDisabled: true, defaultEnabled: false },
  
  // 厚度控制相关的子路径
  { id: 'sp25', name: '常规厚度控制', type: 'regular', description: '标准厚度控制流程', returnStationCode: 'THICKNESS_001', canBeDisabled: true, defaultEnabled: true },
  { id: 'sp26', name: '返工厚度控制', type: 'rework', description: '返工厚度调整', returnStationCode: 'THICKNESS_001', canBeDisabled: true, defaultEnabled: true },
  { id: 'sp27', name: '抽检厚度', type: 'specialSampling', description: '厚度精度抽检', returnStationCode: 'THICKNESS_001', canBeDisabled: false, defaultEnabled: false }
];

// 产品分类树状结构 - 可能仍然是前端特有的数据
export const mockCategories: ProductCategory[] = [
  {
    id: '6inch',
    name: '6寸轻掺',
    isExpanded: true,
    children: [
      { id: 'polish', name: '抛光片' },
      { id: '6inch-sub1', name: '6寸' },
      { id: '6inch-light', name: '6寸轻掺' },
      { id: '6inch-heavy', name: '6寸重掺' },
      { id: '6inch-test', name: '6寸测试' },
      { id: 'main', name: '正片' },
      { id: 'dummy', name: 'dummy片' },
      { id: 'test', name: '测试片' },
      { id: 'weight', name: '重掺片' },
      { id: 'real', name: '实验片' },
      { id: 'design', name: '设计片' },
      { id: 'internal', name: '内部实验' },
      { id: 'small-batch', name: '小批量' }
    ]
  },
  {
    id: '8inch',
    name: '8寸',
    isExpanded: false,
    children: [
      { id: '8inch-light', name: '8寸轻掺' },
      { id: '8inch-heavy', name: '8寸重掺' },
      { id: '8inch-test', name: '8寸重掺测试' },
      { id: '8inch-main', name: '正片' },
      { id: '8inch-dummy', name: 'dummy片' }
    ]
  }
];

// 产品大类选项 - 可能仍然是前端特有的数据
export const mockProductCategories = [
  'P 正片',
  'D dummy片',
  'C 测试片',
  'H 重掺片',
  'Q 实验片',
  'S 送样片',
  'E 内部实验',
  'X 小批量'
];

// 产品大类版本选项 - 可能仍然是前端特有的数据
export const mockProductCategoryVersions = [
  '01', '02', '03', '04', '05',
  '06', '07', '08', '09', '10'
];

// 产品类型分类 - 可能仍然是前端特有的数据
export const productTypes = [
  '单抛片',
  '研磨片', 
  '切割片',
  '碱腐片',
  '酸腐片',
  '双抛片'
];

// 工艺主路径列表 - 可能仍然是前端特有的数据
export const mainProcessPaths = [
  { id: 'route_1', name: '标准CMOS工艺' },
  { id: 'route_2', name: 'BiCMOS工艺' },
  { id: 'route_3', name: 'SOI工艺' },
  { id: 'route_4', name: 'FinFET工艺' },
  { id: 'route_5', name: '模拟工艺' },
  { id: 'route_6', name: '抛光衬底片工艺' }
];

// 假设您有一个函数来生成 mock 产品，或者直接定义一个数组
// 这里提供一个简化的 mockProducts 结构，以匹配 Product 类型
// 注意：这里的 mainProcessRouteId 需要是实际存在的 UUID
export const mockProducts: Partial<Product>[] = [
  {
    id: 1,
    productCode: 'P001',
    productName: '产品A',
    productCategory: '6inch',
    productCategoryVersion: '01',
    productType: '单抛片',
    customerName: '客户X',
    description: '这是产品A的描述',
    mainProcessRouteId: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', // 示例 UUID，请替换为实际存在的工艺主路径ID
    specifications: {
      type: 'N', thicknessMultiplier: 'X1', backSeal: '背封', crystal: 100, thickness: 500,
      method: '去边', diameter: 6, chamfer: '对称倒角', dopant: '磷', cleaningMethod: '酸洗',
      referenceSurface: '一条特参', polishing: '喷砂'
    },
    processStations: [], // 将由 API 填充
    stationSubPathOverrides: [],
    status: 'DRAFT',
    revisionHistory: [],
  },
  {
    id: 2,
    productCode: 'P002',
    productName: '产品B',
    productCategory: '8inch',
    productCategoryVersion: '02',
    productType: '双抛片',
    customerName: '客户Y',
    description: '这是产品B的描述',
    mainProcessRouteId: '2f2ef395-0d7e-4171-acc0-ec542403354d', // 示例 UUID
    specifications: {
      type: 'P', thicknessMultiplier: 'X2', backSeal: '无背封', crystal: 111, thickness: 725,
      method: '保边', diameter: 8, chamfer: '不对称倒角', dopant: '硼', cleaningMethod: '碱洗',
      referenceSurface: '两条特参', polishing: '不喷砂'
    },
    processStations: [],
    stationSubPathOverrides: [],
    status: 'PENDING_APPROVAL',
    revisionHistory: [],
  },
  // ... 更多 mock 产品
];

// 生成唯一ID的辅助函数 - 工具函数，保留
let stationIdCounter = 1;
export const generateStationId = (): string => {
  return `station_${stationIdCounter++}_${Date.now()}`;
};