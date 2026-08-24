import { WaferData, WaferLossRecord, StationData, ProductData } from '../types';

// ─── 站点列表 ──────────────────────────────────────────────
export const mockStations: StationData[] = [
  { code: 'station1', name: '倒角' },
  { code: 'station2', name: '双面研磨' },
  { code: 'station3', name: '单面研磨' },
  { code: 'station4', name: '化学腐蚀' },
  { code: 'station5', name: '几何参数检验' },
  { code: 'station6', name: '颗粒检测' },
  { code: 'station7', name: '目检' },
  { code: 'station8', name: '正面抛光' },
  { code: 'station9', name: '清洗' },
  { code: 'station10', name: '包装' },
];

// ─── 产品列表 ──────────────────────────────────────────────
export const mockProducts: ProductData[] = [
  {
    id: 'prod-1',
    productCode: 'P001',
    productName: 'SPCZDF06BA-A625BENNN',
    productVersion: 3,
    productType: '6寸抛光片',
    specParams: 'Dia:150mm, Thickness:675±25μm',
    processPathName: '6寸标准抛光路径',
  },
  {
    id: 'prod-2',
    productCode: 'P002',
    productName: 'SPCZDF08BA-A825BENNN',
    productVersion: 2,
    productType: '8寸抛光片',
    specParams: 'Dia:200mm, Thickness:725±25μm',
    processPathName: '8寸标准抛光路径',
  },
  {
    id: 'prod-3',
    productCode: 'P003',
    productName: 'SPCZDF06BA-A612SPECIAL',
    productVersion: 1,
    productType: '6寸特种片',
    specParams: 'Dia:150mm, Thickness:650±15μm',
    processPathName: '6寸特种抛光路径',
  },
];

// ─── 晶圆损耗记录 ─────────────────────────────────────────
export const mockLossWafers: WaferLossRecord[] = [
  {
    id: 'loss-001',
    waferId: 'W-BATCH001-001',
    originalSublotId: 'BATCH001-SA0150',
    originalLotId: '1',
    originalCarrierId: 'SA0150',
    reason: '切割破片',
    lossDate: '2026-05-10',
    operator: '张工',
  },
  {
    id: 'loss-002',
    waferId: 'W-BATCH001-003',
    originalSublotId: 'BATCH001-SA0152',
    originalLotId: '1',
    originalCarrierId: 'SA0152',
    reason: '表面划伤超标',
    lossDate: '2026-05-10',
    operator: '李工',
  },
  {
    id: 'loss-003',
    waferId: 'W-BATCH002-007',
    originalSublotId: 'BATCH002-SA0156',
    originalLotId: '2',
    originalCarrierId: 'SA0156',
    reason: '厚度超出规格',
    lossDate: '2026-05-11',
    operator: '王工',
  },
  {
    id: 'loss-004',
    waferId: 'W-BATCH003-002',
    originalSublotId: 'BATCH003-SB0103',
    originalLotId: '3',
    originalCarrierId: 'SB0103',
    reason: '研磨崩边',
    lossDate: '2026-05-12',
    operator: '张工',
  },
];

// ─── 批次晶圆数据生成器 ────────────────────────────────────
// waferId = 主批次号.全批次连续序号（开批后全流程不变）
// materialCode = 设备编号-设备总炉次号-备件生命周期炉次号（炉子类型站点产生，工艺段会变化）

// 检验站点顺序（与 FinalSortingOverviewModal 中保持一致）
const INSPECTION_PROCESS_FLOW: string[] = ['几何参数检验', '颗粒检测', '目检'];

const MOCK_DEFECT_CODES = ['划伤', '崩边', '污染', '裂纹', '气泡', '厚度异常', '颗粒污染', '破片'];

// 为指定站点生成检验参数（isDefect = 该站点上判定为不良）
function buildStationParams(
  station: string,
  isDefect: boolean,
  i: number,
): { name: string; value: number; unit: string; min?: number; max?: number }[] {
  const v = i % 7;
  if (station === '几何参数检验') {
    return isDefect ? [
      { name: 'CenThk', value: 640 + v, unit: 'µm' },
      { name: 'Bow-BF', value: 45 + v, unit: 'µm' },
      { name: 'Warp-BF', value: 55 + v, unit: 'µm' },
      { name: 'TTV(GBIR)', value: parseFloat((0.45 + v * 0.01).toFixed(2)), unit: 'µm', max: 0.3 },
      { name: 'TIR-BF(GFLR NTV)', value: parseFloat((0.50 + v * 0.01).toFixed(2)), unit: 'µm' },
      { name: 'SFQR', value: parseFloat((0.15 + v * 0.01).toFixed(3)), unit: 'µm' },
      { name: 'CenRes', value: parseFloat((0.5 + v * 0.1).toFixed(1)), unit: 'ohm·cm', min: 1, max: 10 },
    ] : [
      { name: 'CenThk', value: 675 + v, unit: 'µm' },
      { name: 'Bow-BF', value: 12 + v, unit: 'µm' },
      { name: 'Warp-BF', value: 18 + v, unit: 'µm' },
      { name: 'TTV(GBIR)', value: parseFloat((0.10 + v * 0.01).toFixed(2)), unit: 'µm', max: 0.3 },
      { name: 'TIR-BF(GFLR NTV)', value: parseFloat((0.12 + v * 0.01).toFixed(2)), unit: 'µm' },
      { name: 'SFQR', value: parseFloat((0.06 + v * 0.005).toFixed(3)), unit: 'µm' },
      { name: 'CenRes', value: parseFloat((4.5 + v * 0.2).toFixed(1)), unit: 'ohm·cm', min: 1, max: 10 },
    ];
  } else if (station === '颗粒检测') {
    const v2 = i % 5;
    return isDefect ? [
      { name: '颗粒密度', value: parseFloat((0.12 + v2 * 0.02).toFixed(3)), unit: '个/cm²', max: 0.1 },
    ] : [
      { name: '颗粒密度', value: parseFloat((0.03 + v2 * 0.01).toFixed(3)), unit: '个/cm²', max: 0.1 },
    ];
  } else {
    return [
      { name: '厚度', value: isDefect ? 640 : 675, unit: 'μm', min: 650, max: 700 },
      { name: '总厚度变化', value: isDefect ? 12 : 3.2, unit: 'μm', min: 0, max: 10 },
      { name: '翘曲度', value: isDefect ? 55 : 18, unit: 'μm', min: 0, max: 50 },
      { name: '弯曲度', value: isDefect ? 42 : 15, unit: 'μm', min: 0, max: 40 },
    ];
  }
}

function makeWafers(
  batchId: string,
  batchCode: string,
  sublotId: string,
  carrierId: string,
  count: number,
  defectCount: number,
  startSeq: number,
  materialCode: string,
  station?: string,
): WaferData[] {
  return Array.from({ length: count }, (_, i) => {
    const slotNo = i + 1;
    const isDefect = i < defectCount;

    // 当前站点参数（用于 inspectionParameters 字段，兼容旧逻辑）
    const stationParams = station
      ? buildStationParams(station, isDefect, i)
      : [
          { name: '厚度', value: isDefect ? 640 : 675, unit: 'μm', min: 650, max: 700 },
          { name: '总厚度变化', value: isDefect ? 12 : 3.2, unit: 'μm', min: 0, max: 10 },
          { name: '翘曲度', value: isDefect ? 55 : 18, unit: 'μm', min: 0, max: 50 },
          { name: '弯曲度', value: isDefect ? 42 : 15, unit: 'μm', min: 0, max: 40 },
        ];

    // 构建累计检验结果：包含当前站点及所有前序检验站点
    const resultsByStation: WaferData['inspectionResultsByStation'] = {};
    if (station) {
      const currentIdx = INSPECTION_PROCESS_FLOW.indexOf(station);
      // 前序站点：晶圆已通过，均为合格值
      for (let s = 0; s < currentIdx; s++) {
        const priorStation = INSPECTION_PROCESS_FLOW[s];
        const priorParams = buildStationParams(priorStation, false, i);
        resultsByStation[priorStation] = { parameters: priorParams };
      }
      // 当前站点：记录实际检验结果
      resultsByStation[station] = {
        parameters: stationParams,
        defectType: isDefect ? '不合格' : undefined,
        defectCode: isDefect ? MOCK_DEFECT_CODES[i % 8] : undefined,
      };
    }

    return {
      id: `${batchId}-${carrierId}-${String(slotNo).padStart(2, '0')}`,
      slotNo,
      type: isDefect ? 'REJECT' : 'GOOD',
      waferId: `${batchCode}.${String(startSeq + i).padStart(4, '0')}`,
      sublotId,
      carrierId,
      lotId: batchId,
      markingCode: '',
      markingStatus: '待打标',
      disposition: isDefect ? 'HOLD' : 'NONE',
      grade: isDefect ? 'C' : 'A',
      inspectionStatus: '待检验',
      materialCode: `${materialCode}-S${String(startSeq + i).padStart(3, '0')}`,
      inspectionParameters: stationParams,
      inspectionResultsByStation: resultsByStation,
    };
  });
}

// 每个子批次 ID 对应的晶圆列表
export const mockWafersBySubBatch: Record<string, WaferData[]> = {
  // ─── BATCHQO20O3 aba03c67 ────────────────────────────────────
  'd56edb42-0000-4000-8000-000000000001': makeWafers('aba03c67-3bf4-417c-b013-43f8f4d83c8e', 'BATCHQO20O3', 'BATCHQO20O3-SUB-01', 'CARQA001', 25, 0, 1, 'HCF-A01-R01203-L00421'),
  '8202b004-0000-4000-8000-000000000002': makeWafers('aba03c67-3bf4-417c-b013-43f8f4d83c8e', 'BATCHQO20O3', 'BATCHQO20O3-SUB-02', 'CARQA002', 25, 0, 26, 'HCF-A01-R01203-L00421'),
  'cfa8b49c-0000-4000-8000-000000000003': makeWafers('aba03c67-3bf4-417c-b013-43f8f4d83c8e', 'BATCHQO20O3', 'BATCHQO20O3-SUB-03', 'CARQA003', 25, 0, 51, 'HCF-A01-R01203-L00421'),
  'f7236fc7-0000-4000-8000-000000000004': makeWafers('aba03c67-3bf4-417c-b013-43f8f4d83c8e', 'BATCHQO20O3', 'BATCHQO20O3-SUB-04', 'CARQA004', 25, 0, 76, 'HCF-A01-R01203-L00421'),
  '87b78577-0000-4000-8000-000000000005': makeWafers('aba03c67-3bf4-417c-b013-43f8f4d83c8e', 'BATCHQO20O3', 'BATCHQO20O3-SUB-05', 'CARQA005', 25, 0, 101, 'HCF-A01-R01203-L00421'),
  '665f2e21-0000-4000-8000-000000000006': makeWafers('aba03c67-3bf4-417c-b013-43f8f4d83c8e', 'BATCHQO20O3', 'BATCHQO20O3-SUB-06', 'CARQA006', 25, 0, 126, 'HCF-A01-R01203-L00421'),
  '771bbc9c-0000-4000-8000-000000000007': makeWafers('aba03c67-3bf4-417c-b013-43f8f4d83c8e', 'BATCHQO20O3', 'BATCHQO20O3-SUB-07', 'CARQA007', 25, 0, 151, 'HCF-A01-R01203-L00421'),
  '78da99e0-0000-4000-8000-000000000008': makeWafers('aba03c67-3bf4-417c-b013-43f8f4d83c8e', 'BATCHQO20O3', 'BATCHQO20O3-SUB-08', 'CARQA008', 25, 0, 176, 'HCF-A01-R01203-L00421'),
  '75b22dfe-0000-4000-8000-000000000009': makeWafers('aba03c67-3bf4-417c-b013-43f8f4d83c8e', 'BATCHQO20O3', 'BATCHQO20O3-SUB-09', 'CARQA009', 25, 0, 201, 'HCF-A01-R01203-L00421'),
  '36c12563-0000-4000-8000-000000000010': makeWafers('aba03c67-3bf4-417c-b013-43f8f4d83c8e', 'BATCHQO20O3', 'BATCHQO20O3-SUB-10', 'CARQA010', 25, 0, 226, 'HCF-A01-R01203-L00421'),
  '48fb499d-0000-4000-8000-000000000011': makeWafers('aba03c67-3bf4-417c-b013-43f8f4d83c8e', 'BATCHQO20O3', 'BATCHQO20O3-SUB-11', 'CARQA011', 25, 23, 251, 'HCF-A01-R01203-L00421'),
  '26f668fd-0000-4000-8000-000000000012': makeWafers('aba03c67-3bf4-417c-b013-43f8f4d83c8e', 'BATCHQO20O3', 'BATCHQO20O3-SUB-12', 'CARQA012', 25, 19, 276, 'HCF-A01-R01203-L00421'),
  '3292b857-0000-4000-8000-000000000013': makeWafers('aba03c67-3bf4-417c-b013-43f8f4d83c8e', 'BATCHQO20O3', 'BATCHQO20O3-SUB-13', 'CARQA013', 11, 11, 301, 'HCF-A01-R01203-L00421'),
  // ─── BATCHX5VZPH 533e00f4 ────────────────────────────────────
  'bc1cde03-0000-4000-8000-000000000001': makeWafers('533e00f4-e470-480f-90c6-0b3612572bcd', 'BATCHX5VZPH', 'BATCHX5VZPH-SUB-01', 'CARXV001', 25, 0, 1, 'HCF-A02-R00987-L00312'),
  '58f35d91-0000-4000-8000-000000000002': makeWafers('533e00f4-e470-480f-90c6-0b3612572bcd', 'BATCHX5VZPH', 'BATCHX5VZPH-SUB-02', 'CARXV002', 25, 0, 26, 'HCF-A02-R00987-L00312'),
  'bc4fda6f-0000-4000-8000-000000000003': makeWafers('533e00f4-e470-480f-90c6-0b3612572bcd', 'BATCHX5VZPH', 'BATCHX5VZPH-SUB-03', 'CARXV003', 25, 0, 51, 'HCF-A02-R00987-L00312'),
  '29fe6049-0000-4000-8000-000000000004': makeWafers('533e00f4-e470-480f-90c6-0b3612572bcd', 'BATCHX5VZPH', 'BATCHX5VZPH-SUB-04', 'CARXV004', 25, 0, 76, 'HCF-A02-R00987-L00312'),
  '5ed78d21-0000-4000-8000-000000000005': makeWafers('533e00f4-e470-480f-90c6-0b3612572bcd', 'BATCHX5VZPH', 'BATCHX5VZPH-SUB-05', 'CARXV005', 25, 0, 101, 'HCF-A02-R00987-L00312'),
  'd59d853c-0000-4000-8000-000000000006': makeWafers('533e00f4-e470-480f-90c6-0b3612572bcd', 'BATCHX5VZPH', 'BATCHX5VZPH-SUB-06', 'CARXV006', 25, 0, 126, 'HCF-A02-R00987-L00312'),
  '887893e1-0000-4000-8000-000000000007': makeWafers('533e00f4-e470-480f-90c6-0b3612572bcd', 'BATCHX5VZPH', 'BATCHX5VZPH-SUB-07', 'CARXV007', 25, 0, 151, 'HCF-A02-R00987-L00312'),
  '0b581ce4-0000-4000-8000-000000000008': makeWafers('533e00f4-e470-480f-90c6-0b3612572bcd', 'BATCHX5VZPH', 'BATCHX5VZPH-SUB-08', 'CARXV008', 25, 0, 176, 'HCF-A02-R00987-L00312'),
  '2466c679-0000-4000-8000-000000000009': makeWafers('533e00f4-e470-480f-90c6-0b3612572bcd', 'BATCHX5VZPH', 'BATCHX5VZPH-SUB-09', 'CARXV009', 25, 0, 201, 'HCF-A02-R00987-L00312'),
  '088d8544-0000-4000-8000-000000000010': makeWafers('533e00f4-e470-480f-90c6-0b3612572bcd', 'BATCHX5VZPH', 'BATCHX5VZPH-SUB-10', 'CARXV010', 25, 0, 226, 'HCF-A02-R00987-L00312'),
  '39669362-0000-4000-8000-000000000011': makeWafers('533e00f4-e470-480f-90c6-0b3612572bcd', 'BATCHX5VZPH', 'BATCHX5VZPH-SUB-11', 'CARXV011', 25, 0, 251, 'HCF-A02-R00987-L00312'),
  '67c672b6-0000-4000-8000-000000000012': makeWafers('533e00f4-e470-480f-90c6-0b3612572bcd', 'BATCHX5VZPH', 'BATCHX5VZPH-SUB-12', 'CARXV012', 25, 0, 276, 'HCF-A02-R00987-L00312'),
  '321c498d-0000-4000-8000-000000000013': makeWafers('533e00f4-e470-480f-90c6-0b3612572bcd', 'BATCHX5VZPH', 'BATCHX5VZPH-SUB-13', 'CARXV013', 14, 9, 301, 'HCF-A02-R00987-L00312'),
  // ─── BATCHG0RXA7 ddc2e9df ────────────────────────────────────
  'e5144c51-0000-4000-8000-000000000001': makeWafers('ddc2e9df-3406-4b88-9edf-099a38d0c864', 'BATCHG0RXA7', 'BATCHG0RXA7-SUB-01', 'CARGR001', 25, 0, 1, 'HCF-B01-R01456-L00187', '几何参数检验'),
  '314f6b41-0000-4000-8000-000000000002': makeWafers('ddc2e9df-3406-4b88-9edf-099a38d0c864', 'BATCHG0RXA7', 'BATCHG0RXA7-SUB-02', 'CARGR002', 25, 0, 26, 'HCF-B01-R01456-L00187', '几何参数检验'),
  'c11314d2-0000-4000-8000-000000000003': makeWafers('ddc2e9df-3406-4b88-9edf-099a38d0c864', 'BATCHG0RXA7', 'BATCHG0RXA7-SUB-03', 'CARGR003', 25, 0, 51, 'HCF-B01-R01456-L00187', '几何参数检验'),
  '87e0fd7e-0000-4000-8000-000000000004': makeWafers('ddc2e9df-3406-4b88-9edf-099a38d0c864', 'BATCHG0RXA7', 'BATCHG0RXA7-SUB-04', 'CARGR004', 25, 0, 76, 'HCF-B01-R01456-L00187', '几何参数检验'),
  '6d2a12cc-0000-4000-8000-000000000005': makeWafers('ddc2e9df-3406-4b88-9edf-099a38d0c864', 'BATCHG0RXA7', 'BATCHG0RXA7-SUB-05', 'CARGR005', 25, 0, 101, 'HCF-B01-R01456-L00187', '几何参数检验'),
  '621a0a3b-0000-4000-8000-000000000006': makeWafers('ddc2e9df-3406-4b88-9edf-099a38d0c864', 'BATCHG0RXA7', 'BATCHG0RXA7-SUB-06', 'CARGR006', 21, 1, 126, 'HCF-B01-R01456-L00187', '几何参数检验'),
  // ─── BATCHHDDTFP 207b7612 ────────────────────────────────────
  '59046524-0000-4000-8000-000000000001': makeWafers('207b7612-7e5a-4b47-914a-979fd946c52a', 'BATCHHDDTFP', 'BATCHHDDTFP-SUB-01', 'CARHD001', 25, 0, 1, 'HCF-C01-R01289-L00456', '颗粒检测'),
  'c88a9e32-0000-4000-8000-000000000002': makeWafers('207b7612-7e5a-4b47-914a-979fd946c52a', 'BATCHHDDTFP', 'BATCHHDDTFP-SUB-02', 'CARHD002', 25, 0, 26, 'HCF-C01-R01289-L00456', '颗粒检测'),
  '6e921d71-0000-4000-8000-000000000003': makeWafers('207b7612-7e5a-4b47-914a-979fd946c52a', 'BATCHHDDTFP', 'BATCHHDDTFP-SUB-03', 'CARHD003', 25, 0, 51, 'HCF-C01-R01289-L00456', '颗粒检测'),
  'e5fb5d43-0000-4000-8000-000000000004': makeWafers('207b7612-7e5a-4b47-914a-979fd946c52a', 'BATCHHDDTFP', 'BATCHHDDTFP-SUB-04', 'CARHD004', 25, 0, 76, 'HCF-C01-R01289-L00456', '颗粒检测'),
  '51a65973-0000-4000-8000-000000000005': makeWafers('207b7612-7e5a-4b47-914a-979fd946c52a', 'BATCHHDDTFP', 'BATCHHDDTFP-SUB-05', 'CARHD005', 25, 0, 101, 'HCF-C01-R01289-L00456', '颗粒检测'),
  '9130428b-0000-4000-8000-000000000006': makeWafers('207b7612-7e5a-4b47-914a-979fd946c52a', 'BATCHHDDTFP', 'BATCHHDDTFP-SUB-06', 'CARHD006', 25, 0, 126, 'HCF-C01-R01289-L00456', '颗粒检测'),
  '7796a0c3-0000-4000-8000-000000000007': makeWafers('207b7612-7e5a-4b47-914a-979fd946c52a', 'BATCHHDDTFP', 'BATCHHDDTFP-SUB-07', 'CARHD007', 25, 0, 151, 'HCF-C01-R01289-L00456', '颗粒检测'),
  'fb067a1c-0000-4000-8000-000000000008': makeWafers('207b7612-7e5a-4b47-914a-979fd946c52a', 'BATCHHDDTFP', 'BATCHHDDTFP-SUB-08', 'CARHD008', 25, 0, 176, 'HCF-C01-R01289-L00456', '颗粒检测'),
  '8db83203-0000-4000-8000-000000000009': makeWafers('207b7612-7e5a-4b47-914a-979fd946c52a', 'BATCHHDDTFP', 'BATCHHDDTFP-SUB-09', 'CARHD009', 25, 2, 201, 'HCF-C01-R01289-L00456', '颗粒检测'),
  '75065638-0000-4000-8000-000000000010': makeWafers('207b7612-7e5a-4b47-914a-979fd946c52a', 'BATCHHDDTFP', 'BATCHHDDTFP-SUB-10', 'CARHD010', 25, 25, 226, 'HCF-C01-R01289-L00456', '颗粒检测'),
  '91be0c71-0000-4000-8000-000000000011': makeWafers('207b7612-7e5a-4b47-914a-979fd946c52a', 'BATCHHDDTFP', 'BATCHHDDTFP-SUB-11', 'CARHD011', 20, 20, 251, 'HCF-C01-R01289-L00456', '颗粒检测'),
  // ─── BATCH2K1G4O 92cb17ac ────────────────────────────────────
  '3245b609-0000-4000-8000-000000000001': makeWafers('92cb17ac-2612-4112-ad4a-a4bb37b48d77', 'BATCH2K1G4O', 'BATCH2K1G4O-SUB-01', 'CAR2K001', 25, 0, 1, 'HCF-B02-R00756-L00234'),
  'ec924d97-0000-4000-8000-000000000002': makeWafers('92cb17ac-2612-4112-ad4a-a4bb37b48d77', 'BATCH2K1G4O', 'BATCH2K1G4O-SUB-02', 'CAR2K002', 25, 0, 26, 'HCF-B02-R00756-L00234'),
  'c7441bc8-0000-4000-8000-000000000003': makeWafers('92cb17ac-2612-4112-ad4a-a4bb37b48d77', 'BATCH2K1G4O', 'BATCH2K1G4O-SUB-03', 'CAR2K003', 25, 0, 51, 'HCF-B02-R00756-L00234'),
  '2f0b8881-0000-4000-8000-000000000004': makeWafers('92cb17ac-2612-4112-ad4a-a4bb37b48d77', 'BATCH2K1G4O', 'BATCH2K1G4O-SUB-04', 'CAR2K004', 25, 0, 76, 'HCF-B02-R00756-L00234'),
  'd975ee2e-0000-4000-8000-000000000005': makeWafers('92cb17ac-2612-4112-ad4a-a4bb37b48d77', 'BATCH2K1G4O', 'BATCH2K1G4O-SUB-05', 'CAR2K005', 25, 3, 101, 'HCF-B02-R00756-L00234'),
  'cd52a80c-0000-4000-8000-000000000006': makeWafers('92cb17ac-2612-4112-ad4a-a4bb37b48d77', 'BATCH2K1G4O', 'BATCH2K1G4O-SUB-06', 'CAR2K006', 25, 0, 126, 'HCF-B02-R00756-L00234'),
  'a8c761b8-0000-4000-8000-000000000007': makeWafers('92cb17ac-2612-4112-ad4a-a4bb37b48d77', 'BATCH2K1G4O', 'BATCH2K1G4O-SUB-07', 'CAR2K007', 25, 0, 151, 'HCF-B02-R00756-L00234'),
  'b4f97f68-0000-4000-8000-000000000008': makeWafers('92cb17ac-2612-4112-ad4a-a4bb37b48d77', 'BATCH2K1G4O', 'BATCH2K1G4O-SUB-08', 'CAR2K008', 20, 0, 176, 'HCF-B02-R00756-L00234'),
  // ─── BATCHPWDB3B d859503b ────────────────────────────────────
  '68f3a54f-0000-4000-8000-000000000001': makeWafers('d859503b-4f0f-48b0-b626-811873c95b16', 'BATCHPWDB3B', 'BATCHPWDB3B-SUB-01', 'CARP001', 25, 0, 1, 'HCF-A02-R01102-L00345'),
  'db7701d3-0000-4000-8000-000000000002': makeWafers('d859503b-4f0f-48b0-b626-811873c95b16', 'BATCHPWDB3B', 'BATCHPWDB3B-SUB-02', 'CARP002', 25, 0, 26, 'HCF-A02-R01102-L00345'),
  '6c288bf4-0000-4000-8000-000000000003': makeWafers('d859503b-4f0f-48b0-b626-811873c95b16', 'BATCHPWDB3B', 'BATCHPWDB3B-SUB-03', 'CARP003', 25, 0, 51, 'HCF-A02-R01102-L00345'),
  '793db3ea-0000-4000-8000-000000000004': makeWafers('d859503b-4f0f-48b0-b626-811873c95b16', 'BATCHPWDB3B', 'BATCHPWDB3B-SUB-04', 'CARP004', 25, 5, 76, 'HCF-A02-R01102-L00345'),
  '20d0db09-0000-4000-8000-000000000005': makeWafers('d859503b-4f0f-48b0-b626-811873c95b16', 'BATCHPWDB3B', 'BATCHPWDB3B-SUB-05', 'CARP005', 5, 2, 101, 'HCF-A02-R01102-L00345'),
  // ─── BATCHBWPDL8 7fbbe61b ────────────────────────────────────
  'a805126f-0000-4000-8000-000000000001': makeWafers('7fbbe61b-2514-4c64-8aae-bd2744f18262', 'BATCHBWPDL8', 'BATCHBWPDL8-SUB-01', 'CARM6GE66', 25, 0, 1, 'HCF-C02-R01521-L00098'),
  'baa7e2e1-0000-4000-8000-000000000002': makeWafers('7fbbe61b-2514-4c64-8aae-bd2744f18262', 'BATCHBWPDL8', 'BATCHBWPDL8-SUB-02', 'CARUEXW7U', 25, 0, 26, 'HCF-C02-R01521-L00098'),
  '86c0e783-0000-4000-8000-000000000003': makeWafers('7fbbe61b-2514-4c64-8aae-bd2744f18262', 'BATCHBWPDL8', 'BATCHBWPDL8-SUB-03', 'CAROHNBDF', 25, 0, 51, 'HCF-C02-R01521-L00098'),
  '75716c99-0000-4000-8000-000000000004': makeWafers('7fbbe61b-2514-4c64-8aae-bd2744f18262', 'BATCHBWPDL8', 'BATCHBWPDL8-SUB-04', 'CARPWXMSW', 25, 0, 76, 'HCF-C02-R01521-L00098'),
  'f62e0af4-0000-4000-8000-000000000005': makeWafers('7fbbe61b-2514-4c64-8aae-bd2744f18262', 'BATCHBWPDL8', 'BATCHBWPDL8-SUB-05', 'CAR0LTRAU', 25, 0, 101, 'HCF-C02-R01521-L00098'),
  '2549049e-0000-4000-8000-000000000006': makeWafers('7fbbe61b-2514-4c64-8aae-bd2744f18262', 'BATCHBWPDL8', 'BATCHBWPDL8-SUB-06', 'CARIT2R0X', 25, 0, 126, 'HCF-C02-R01521-L00098'),
  '0d01b611-0000-4000-8000-000000000007': makeWafers('7fbbe61b-2514-4c64-8aae-bd2744f18262', 'BATCHBWPDL8', 'BATCHBWPDL8-SUB-07', 'CARXUNQLP', 25, 0, 151, 'HCF-C02-R01521-L00098'),
  'a0e57079-0000-4000-8000-000000000008': makeWafers('7fbbe61b-2514-4c64-8aae-bd2744f18262', 'BATCHBWPDL8', 'BATCHBWPDL8-SUB-08', 'CARN6V8FB', 25, 0, 176, 'HCF-C02-R01521-L00098'),
  '16e34cee-0000-4000-8000-000000000009': makeWafers('7fbbe61b-2514-4c64-8aae-bd2744f18262', 'BATCHBWPDL8', 'BATCHBWPDL8-SUB-09', 'CARQT5MV5', 25, 0, 201, 'HCF-C02-R01521-L00098'),
  '2e0af199-0000-4000-8000-000000000010': makeWafers('7fbbe61b-2514-4c64-8aae-bd2744f18262', 'BATCHBWPDL8', 'BATCHBWPDL8-SUB-10', 'CARFQPEMM', 25, 0, 226, 'HCF-C02-R01521-L00098'),
  '8ffdf0fe-0000-4000-8000-000000000011': makeWafers('7fbbe61b-2514-4c64-8aae-bd2744f18262', 'BATCHBWPDL8', 'BATCHBWPDL8-SUB-11', 'CARTYAJJV', 25, 0, 251, 'HCF-C02-R01521-L00098'),
  'bde327ff-0000-4000-8000-000000000012': makeWafers('7fbbe61b-2514-4c64-8aae-bd2744f18262', 'BATCHBWPDL8', 'BATCHBWPDL8-SUB-12', 'CARMUPFOA', 25, 21, 276, 'HCF-C02-R01521-L00098'),
  '2ff4fd8e-0000-4000-8000-000000000013': makeWafers('7fbbe61b-2514-4c64-8aae-bd2744f18262', 'BATCHBWPDL8', 'BATCHBWPDL8-SUB-13', 'CAR8L2R3N', 2, 2, 301, 'HCF-C02-R01521-L00098'),
  // ─── BATCHKMFH6V a4a113ab ────────────────────────────────────
  'c5e7bba8-0000-4000-8000-000000000001': makeWafers('a4a113ab-94fc-4129-96dc-122288fe8f0b', 'BATCHKMFH6V', 'BATCHKMFH6V-SUB-01', 'CARKM001', 25, 0, 1, 'HCF-A03-R01367-L00512'),
  'afa02cae-0000-4000-8000-000000000002': makeWafers('a4a113ab-94fc-4129-96dc-122288fe8f0b', 'BATCHKMFH6V', 'BATCHKMFH6V-SUB-02', 'CARKM002', 25, 0, 26, 'HCF-A03-R01367-L00512'),
  'bab9b798-0000-4000-8000-000000000003': makeWafers('a4a113ab-94fc-4129-96dc-122288fe8f0b', 'BATCHKMFH6V', 'BATCHKMFH6V-SUB-03', 'CARKM003', 25, 0, 51, 'HCF-A03-R01367-L00512'),
  '21cc69b7-0000-4000-8000-000000000004': makeWafers('a4a113ab-94fc-4129-96dc-122288fe8f0b', 'BATCHKMFH6V', 'BATCHKMFH6V-SUB-04', 'CARKM004', 25, 0, 76, 'HCF-A03-R01367-L00512'),
  '5ea0ef36-0000-4000-8000-000000000005': makeWafers('a4a113ab-94fc-4129-96dc-122288fe8f0b', 'BATCHKMFH6V', 'BATCHKMFH6V-SUB-05', 'CARKM005', 25, 0, 101, 'HCF-A03-R01367-L00512'),
  '8553ebfe-0000-4000-8000-000000000006': makeWafers('a4a113ab-94fc-4129-96dc-122288fe8f0b', 'BATCHKMFH6V', 'BATCHKMFH6V-SUB-06', 'CARKM006', 25, 0, 126, 'HCF-A03-R01367-L00512'),
  'a750a354-0000-4000-8000-000000000007': makeWafers('a4a113ab-94fc-4129-96dc-122288fe8f0b', 'BATCHKMFH6V', 'BATCHKMFH6V-SUB-07', 'CARKM007', 25, 0, 151, 'HCF-A03-R01367-L00512'),
  '58656124-0000-4000-8000-000000000008': makeWafers('a4a113ab-94fc-4129-96dc-122288fe8f0b', 'BATCHKMFH6V', 'BATCHKMFH6V-SUB-08', 'CARKM008', 25, 23, 176, 'HCF-A03-R01367-L00512'),
  'f31ab5f6-0000-4000-8000-000000000009': makeWafers('a4a113ab-94fc-4129-96dc-122288fe8f0b', 'BATCHKMFH6V', 'BATCHKMFH6V-SUB-09', 'CARKM009', 25, 25, 201, 'HCF-A03-R01367-L00512'),
  '882ec0fc-0000-4000-8000-000000000010': makeWafers('a4a113ab-94fc-4129-96dc-122288fe8f0b', 'BATCHKMFH6V', 'BATCHKMFH6V-SUB-10', 'CARKM010', 25, 25, 226, 'HCF-A03-R01367-L00512'),
  '21c05014-0000-4000-8000-000000000011': makeWafers('a4a113ab-94fc-4129-96dc-122288fe8f0b', 'BATCHKMFH6V', 'BATCHKMFH6V-SUB-11', 'CARKM011', 25, 25, 251, 'HCF-A03-R01367-L00512'),
  // ─── BATCH52BSCJ e3f7bb6a ────────────────────────────────────
  '8cec56eb-0000-4000-8000-000000000001': makeWafers('e3f7bb6a-08d1-4ffe-8887-3a7c8cafde44', 'BATCH52BSCJ', 'BATCH52BSCJ-SUB-01', 'CAR52001', 25, 0, 1, 'HCF-B03-R00823-L00156'),
  '9301c516-0000-4000-8000-000000000002': makeWafers('e3f7bb6a-08d1-4ffe-8887-3a7c8cafde44', 'BATCH52BSCJ', 'BATCH52BSCJ-SUB-02', 'CAR52002', 25, 0, 26, 'HCF-B03-R00823-L00156'),
  '1f6739ed-0000-4000-8000-000000000003': makeWafers('e3f7bb6a-08d1-4ffe-8887-3a7c8cafde44', 'BATCH52BSCJ', 'BATCH52BSCJ-SUB-03', 'CAR52003', 25, 0, 51, 'HCF-B03-R00823-L00156'),
  '4f87efed-0000-4000-8000-000000000004': makeWafers('e3f7bb6a-08d1-4ffe-8887-3a7c8cafde44', 'BATCH52BSCJ', 'BATCH52BSCJ-SUB-04', 'CAR52004', 25, 0, 76, 'HCF-B03-R00823-L00156'),
  '88a0bfa5-0000-4000-8000-000000000005': makeWafers('e3f7bb6a-08d1-4ffe-8887-3a7c8cafde44', 'BATCH52BSCJ', 'BATCH52BSCJ-SUB-05', 'CAR52005', 25, 0, 101, 'HCF-B03-R00823-L00156'),
  'c24695a2-0000-4000-8000-000000000006': makeWafers('e3f7bb6a-08d1-4ffe-8887-3a7c8cafde44', 'BATCH52BSCJ', 'BATCH52BSCJ-SUB-06', 'CAR52006', 5, 0, 126, 'HCF-B03-R00823-L00156'),
  // ─── BATCHD7I17K 527e34c6 ────────────────────────────────────
  'a02ccce2-0000-4000-8000-000000000001': makeWafers('527e34c6-8b7d-4dc4-a69d-6b9224165315', 'BATCHD7I17K', 'BATCHD7I17K-SUB-01', 'CAR3R7OF3', 25, 0, 1, 'HCF-A01-R01247-L00441', '几何参数检验'),
  'ae775e93-0000-4000-8000-000000000002': makeWafers('527e34c6-8b7d-4dc4-a69d-6b9224165315', 'BATCHD7I17K', 'BATCHD7I17K-SUB-02', 'CARJ1BFQN', 25, 1, 26, 'HCF-A01-R01247-L00441', '几何参数检验'),
  'aa9f42b5-0000-4000-8000-000000000003': makeWafers('527e34c6-8b7d-4dc4-a69d-6b9224165315', 'BATCHD7I17K', 'BATCHD7I17K-SUB-03', 'CAR99TKDD', 25, 0, 51, 'HCF-A01-R01247-L00441', '几何参数检验'),
  '12801bf1-0000-4000-8000-000000000004': makeWafers('527e34c6-8b7d-4dc4-a69d-6b9224165315', 'BATCHD7I17K', 'BATCHD7I17K-SUB-04', 'CARUOUG3I', 25, 0, 76, 'HCF-A01-R01247-L00441', '几何参数检验'),
  '2f618aa3-0000-4000-8000-000000000005': makeWafers('527e34c6-8b7d-4dc4-a69d-6b9224165315', 'BATCHD7I17K', 'BATCHD7I17K-SUB-05', 'CAR9WLFUR', 25, 0, 101, 'HCF-A01-R01247-L00441', '几何参数检验'),
  'b52c4707-0000-4000-8000-000000000006': makeWafers('527e34c6-8b7d-4dc4-a69d-6b9224165315', 'BATCHD7I17K', 'BATCHD7I17K-SUB-06', 'CARUACADT', 3, 0, 126, 'HCF-A01-R01247-L00441', '几何参数检验'),
  // ─── 暂存批次 ─────────────────────────────────────────────────
  '10000001-0000-4000-8000-000000000001': makeWafers('1c86a9b4-85b1-41f3-ba06-022022d576fe', 'TEMP-BATCH-001', 'TEMP-BATCH-001-SUB-01', 'CARTMP001', 10, 10, 1, 'HCF-D01-R00234-L00067'),
  '10000001-0000-4000-8000-000000000002': makeWafers('a0a0b51c-5535-4512-b2c1-0b56ec1430e9', 'TEMP-BATCH-002', 'TEMP-BATCH-002-SUB-01', 'CARTMP002', 15, 0, 1, 'HCF-D01-R00234-L00067'),
  '10000001-0000-4000-8000-000000000003': makeWafers('704247da-ff88-4157-a551-b317eef14d20', 'TEMP-BATCH-003', 'TEMP-BATCH-003-SUB-01', 'CARTMP003', 8, 8, 1, 'HCF-D01-R00234-L00067'),
  '10000001-0000-4000-8000-000000000004': makeWafers('a6f1eaf4-4298-4928-b514-3017ab05dc95', 'TEMP-BATCH-004', 'TEMP-BATCH-004-SUB-01', 'CARTMP004', 12, 0, 1, 'HCF-D01-R00234-L00067'),
  '10000001-0000-4000-8000-000000000005': makeWafers('fbf9698d-8894-43d5-baa8-c94df37dc5fc', 'TEMP-BATCH-005', 'TEMP-BATCH-005-SUB-01', 'CARTMP005', 7, 7, 1, 'HCF-D01-R00234-L00067'),
  '10000001-0000-4000-8000-000000000006': makeWafers('9f4b3694-1e0a-4097-80e2-d98b1442ed05', 'TEMP-BATCH-006', 'TEMP-BATCH-006-SUB-01', 'CARTMP006', 18, 0, 1, 'HCF-D01-R00234-L00067'),
  '10000001-0000-4000-8000-000000000007': makeWafers('8fd8fb12-c9d0-4873-bae4-748c5a96c140', 'TEMP-BATCH-007', 'TEMP-BATCH-007-SUB-01', 'CARTMP007', 5, 5, 1, 'HCF-D01-R00234-L00067'),
  '10000001-0000-4000-8000-000000000008': makeWafers('d9af7e15-20f7-4d1a-a74b-6b4db38043de', 'TEMP-BATCH-008', 'TEMP-BATCH-008-SUB-01', 'CARTMP008', 11, 11, 1, 'HCF-D01-R00234-L00067'),
  '10000001-0000-4000-8000-000000000009': makeWafers('2c843903-3a57-4d01-8768-3f50ea5a0a9b', 'TEMP-BATCH-009', 'TEMP-BATCH-009-SUB-01', 'CARTMP009', 9, 9, 1, 'HCF-D01-R00234-L00067'),
  '10000001-0000-4000-8000-000000000010': makeWafers('fd993e1d-6340-4eb1-b67f-e9a48fec2344', 'TEMP-BATCH-010', 'TEMP-BATCH-010-SUB-01', 'CARTMP010', 14, 14, 1, 'HCF-D01-R00234-L00067'),
};
