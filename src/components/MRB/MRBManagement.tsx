import React, { useState, useMemo } from 'react';
import {
  ShieldAlert, Plus, Search, Filter, ChevronDown, X, Eye,
  ClipboardCheck, AlertTriangle, CheckCircle, XCircle, Clock,
  User, ArrowRight, PenLine, Send, RefreshCw, AlertCircle,
  TrendingUp, Layers, GitBranch,
} from 'lucide-react';
import DefectFlowOverlay from '../DefectFlowOverlay';

// ─── Types ───────────────────────────────────────────────────────────
type MRBStatus = '待评审' | '已完成';
type Priority = '紧急' | '高' | '中' | '低';
type DispositionCode = 'SCRAP' | 'REWORK' | 'USE_AS_IS' | 'SORT' | 'RETURN_TO_VENDOR' | '';
type DefectClass = 'A' | 'B' | 'C' | '';

interface WaferInfo {
  slotId: string;
  waferId: string;
  type: string;
  defectCode: string;
  dispositionMark: string;  // 不良处置标记，工程师手动录入
  defectClass: DefectClass; // 不良分类 A/B/C，工程师手动录入
}
interface SubBatch {
  carrierId: string;    // 片篮编号
  subBatchCode: string; // 子批次编码
  wafers: WaferInfo[];
}
interface DefectiveBatch {
  id: string;
  batchNo: string;
  productCode: string;
  productName: string;
  station: string;
  defectType: string;
  subBatches: SubBatch[];
}
interface ReviewComment {
  reviewer: string; role: string; comment: string;
  recommendation: DispositionCode; timestamp: string; signed: boolean;
}
interface ApprovalStep {
  role: string; approver: string; status: 'pending' | 'approved' | 'rejected';
  comment?: string; timestamp?: string;
}
interface ProcessHistory {
  step: string; operator: string; equipment: string; timestamp: string; result: string;
}
interface MRBItem {
  id: string; mrbNo: string; batchNo: string; productCode: string; productName: string;
  defectType: string; defectDescription: string; quantity: number; affectedWafers: number;
  station: string; priority: Priority; status: MRBStatus; submittedBy: string;
  submittedDate: string; slaDeadline: string; reviewComments: ReviewComment[];
  approvalChain: ApprovalStep[]; disposition: DispositionCode; dispositionNote?: string;
  closedDate?: string; capaId?: string; processHistory: ProcessHistory[];
  subBatches?: SubBatch[];
}

// ─── Mock Defective Batches ─────────────────────────────────────────
const mockDefectiveBatches: DefectiveBatch[] = [
  {
    id: 'db-001', batchNo: 'LOT-20260513-007', productCode: 'EP-A001',
    productName: '外延片 A 型', station: 'EPI-01', defectType: '表面缺陷',
    subBatches: [
      {
        carrierId: 'CAR-2026-0421', subBatchCode: 'SUB-20260513-007-01',
        wafers: [
          { slotId: 'S01', waferId: 'WFR-A001-001', type: 'Prime', defectCode: 'SC-001', dispositionMark: '', defectClass: '' },
          { slotId: 'S02', waferId: 'WFR-A001-002', type: 'Prime', defectCode: 'SC-001', dispositionMark: '', defectClass: '' },
          { slotId: 'S03', waferId: 'WFR-A001-003', type: 'Prime', defectCode: 'SC-002', dispositionMark: '', defectClass: '' },
          { slotId: 'S04', waferId: 'WFR-A001-004', type: 'Test',  defectCode: 'SC-001', dispositionMark: '', defectClass: '' },
          { slotId: 'S05', waferId: 'WFR-A001-005', type: 'Prime', defectCode: 'SC-003', dispositionMark: '', defectClass: '' },
        ],
      },
      {
        carrierId: 'CAR-2026-0422', subBatchCode: 'SUB-20260513-007-02',
        wafers: [
          { slotId: 'S01', waferId: 'WFR-A001-006', type: 'Prime', defectCode: 'SC-001', dispositionMark: '', defectClass: '' },
          { slotId: 'S02', waferId: 'WFR-A001-007', type: 'Prime', defectCode: 'SC-004', dispositionMark: '', defectClass: '' },
          { slotId: 'S03', waferId: 'WFR-A001-008', type: 'Test',  defectCode: 'SC-001', dispositionMark: '', defectClass: '' },
        ],
      },
    ],
  },
  {
    id: 'db-002', batchNo: 'LOT-20260512-003', productCode: 'EP-B002',
    productName: '外延片 B 型', station: 'QC-02', defectType: '电性能异常',
    subBatches: [
      {
        carrierId: 'CAR-2026-0415', subBatchCode: 'SUB-20260512-003-01',
        wafers: [
          { slotId: 'S01', waferId: 'WFR-B002-001', type: 'Prime', defectCode: 'EL-002', dispositionMark: '', defectClass: '' },
          { slotId: 'S02', waferId: 'WFR-B002-002', type: 'Prime', defectCode: 'EL-002', dispositionMark: '', defectClass: '' },
          { slotId: 'S03', waferId: 'WFR-B002-003', type: 'Prime', defectCode: 'EL-003', dispositionMark: '', defectClass: '' },
          { slotId: 'S04', waferId: 'WFR-B002-004', type: 'Test',  defectCode: 'EL-002', dispositionMark: '', defectClass: '' },
        ],
      },
      {
        carrierId: 'CAR-2026-0416', subBatchCode: 'SUB-20260512-003-02',
        wafers: [
          { slotId: 'S01', waferId: 'WFR-B002-005', type: 'Prime', defectCode: 'EL-001', dispositionMark: '', defectClass: '' },
          { slotId: 'S02', waferId: 'WFR-B002-006', type: 'Prime', defectCode: 'EL-002', dispositionMark: '', defectClass: '' },
          { slotId: 'S03', waferId: 'WFR-B002-007', type: 'Prime', defectCode: 'EL-002', dispositionMark: '', defectClass: '' },
          { slotId: 'S04', waferId: 'WFR-B002-008', type: 'Test',  defectCode: 'EL-003', dispositionMark: '', defectClass: '' },
        ],
      },
    ],
  },
  {
    id: 'db-003', batchNo: 'LOT-20260511-009', productCode: 'EP-C001',
    productName: '外延片 C 型', station: 'CLEAN-01', defectType: '污染',
    subBatches: [
      {
        carrierId: 'CAR-2026-0430', subBatchCode: 'SUB-20260511-009-01',
        wafers: [
          { slotId: 'S01', waferId: 'WFR-C001-001', type: 'Prime', defectCode: 'CT-001', dispositionMark: '', defectClass: '' },
          { slotId: 'S02', waferId: 'WFR-C001-002', type: 'Prime', defectCode: 'CT-001', dispositionMark: '', defectClass: '' },
          { slotId: 'S03', waferId: 'WFR-C001-003', type: 'Prime', defectCode: 'CT-002', dispositionMark: '', defectClass: '' },
          { slotId: 'S04', waferId: 'WFR-C001-004', type: 'Prime', defectCode: 'CT-001', dispositionMark: '', defectClass: '' },
          { slotId: 'S05', waferId: 'WFR-C001-005', type: 'Test',  defectCode: 'CT-001', dispositionMark: '', defectClass: '' },
          { slotId: 'S06', waferId: 'WFR-C001-006', type: 'Prime', defectCode: 'CT-003', dispositionMark: '', defectClass: '' },
        ],
      },
    ],
  },
];

// ─── Mock Data ───────────────────────────────────────────────────────
const mockMRBData: MRBItem[] = [
  {
    id: '1', mrbNo: 'MRB-2026-001', batchNo: 'LOT-20260501-001',
    productCode: 'EP-A001', productName: '外延片 A 型', defectType: '表面缺陷',
    defectDescription: '表面划伤，划伤长度 >500μm，超出规格上限 200μm，共 25 片',
    quantity: 25, affectedWafers: 25, station: 'EPI-01', priority: '紧急',
    status: '待评审', submittedBy: '张工', submittedDate: '2026-05-10', slaDeadline: '2026-05-12',
    reviewComments: [],
    approvalChain: [
      { role: '工艺工程师', approver: '陈工艺', status: 'pending' },
      { role: 'QA 主管', approver: '王主管', status: 'pending' },
    ],
    disposition: '',
    processHistory: [
      { step: '外延生长', operator: '张操作', equipment: 'EPI-01', timestamp: '2026-05-01 08:32', result: '合格' },
      { step: '量测', operator: '检测仪器', equipment: 'MP-03', timestamp: '2026-05-01 14:15', result: '异常 – 划伤超标' },
    ],
  },
  {
    id: '2', mrbNo: 'MRB-2026-002', batchNo: 'LOT-20260502-003',
    productCode: 'EP-B002', productName: '外延片 B 型', defectType: '电性能异常',
    defectDescription: '电阻率偏低（测量值 0.8 Ω·cm，规格下限 1.2 Ω·cm），影响 12 片',
    quantity: 12, affectedWafers: 12, station: 'QC-02', priority: '高',
    status: '待评审', submittedBy: '李工', submittedDate: '2026-05-11', slaDeadline: '2026-05-14',
    reviewComments: [
      { reviewer: '陈工艺', role: '工艺工程师', comment: '温度曲线存在 5℃ 偏差，建议返工重新外延。',
        recommendation: 'REWORK', timestamp: '2026-05-12 09:20', signed: true },
    ],
    approvalChain: [
      { role: '工艺工程师', approver: '陈工艺', status: 'approved', comment: '同意返工', timestamp: '2026-05-12 09:20' },
      { role: 'QA 主管', approver: '王主管', status: 'pending' },
    ],
    disposition: 'REWORK',
    processHistory: [
      { step: '外延生长', operator: '李操作', equipment: 'EPI-02', timestamp: '2026-05-02 10:00', result: '参数偏移' },
      { step: '电阻率测量', operator: '检测仪器', equipment: 'RS-01', timestamp: '2026-05-02 16:30', result: '不合格' },
    ],
  },
  {
    id: '3', mrbNo: 'MRB-2026-003', batchNo: 'LOT-20260503-002',
    productCode: 'EP-A003', productName: '外延片 A 型', defectType: '边缘缺口',
    defectDescription: '晶圆边缘存在崩角，缺口尺寸 <300μm，符合降级使用条件',
    quantity: 8, affectedWafers: 8, station: 'INSP-01', priority: '中',
    status: '已完成', submittedBy: '陈工', submittedDate: '2026-05-08', slaDeadline: '2026-05-11',
    reviewComments: [
      { reviewer: '陈工艺', role: '工艺工程师', comment: '缺口在允许范围内，可降级作为科研片使用。',
        recommendation: 'USE_AS_IS', timestamp: '2026-05-09 11:00', signed: true },
      { reviewer: '王主管', role: 'QA 主管', comment: '同意降级，需打降级标识后方可流转。',
        recommendation: 'USE_AS_IS', timestamp: '2026-05-09 14:30', signed: true },
    ],
    approvalChain: [
      { role: '工艺工程师', approver: '陈工艺', status: 'approved', timestamp: '2026-05-09 11:00' },
      { role: 'QA 主管', approver: '王主管', status: 'approved', timestamp: '2026-05-09 14:30' },
    ],
    disposition: 'USE_AS_IS', dispositionNote: '让步接收，降级为科研片，需标注 "Downgrade" 标签',
    processHistory: [
      { step: '外延生长', operator: '赵操作', equipment: 'EPI-03', timestamp: '2026-05-03 09:00', result: '合格' },
      { step: '外观检验', operator: '检验员甲', equipment: 'OPT-02', timestamp: '2026-05-03 15:00', result: '边缘崩角' },
    ],
  },
  {
    id: '4', mrbNo: 'MRB-2026-004', batchNo: 'LOT-20260501-005',
    productCode: 'EP-C001', productName: '外延片 C 型', defectType: '污染',
    defectDescription: '金属污染物超标（Fe 浓度 3.2×10¹¹ atoms/cm²，规格上限 1×10¹¹），全批不合格',
    quantity: 30, affectedWafers: 30, station: 'CLEAN-01', priority: '紧急',
    status: '已完成', submittedBy: '赵工', submittedDate: '2026-05-07', slaDeadline: '2026-05-09',
    reviewComments: [
      { reviewer: '陈工艺', role: '工艺工程师', comment: '污染超标严重，建议报废。',
        recommendation: 'SCRAP', timestamp: '2026-05-08 10:00', signed: true },
      { reviewer: '王主管', role: 'QA 主管', comment: '确认报废，并发起 8D 调查。',
        recommendation: 'SCRAP', timestamp: '2026-05-08 11:30', signed: true },
    ],
    approvalChain: [
      { role: '工艺工程师', approver: '陈工艺', status: 'approved', timestamp: '2026-05-08 10:00' },
      { role: 'QA 主管', approver: '王主管', status: 'approved', timestamp: '2026-05-08 11:30' },
    ],
    disposition: 'SCRAP', dispositionNote: '全批报废，已记入废品损失科目',
    closedDate: '2026-05-09', capaId: 'CAPA-2026-012',
    processHistory: [
      { step: '清洗', operator: '张操作', equipment: 'CLEAN-01', timestamp: '2026-05-01 07:00', result: '疑似设备污染' },
      { step: 'TXRF 分析', operator: '检测仪器', equipment: 'TXRF-01', timestamp: '2026-05-07 10:00', result: 'Fe 超标' },
    ],
  },
  {
    id: '5', mrbNo: 'MRB-2026-005', batchNo: 'LOT-20260509-002',
    productCode: 'EP-B003', productName: '外延片 B 型', defectType: '厚度异常',
    defectDescription: '外延层厚度超出规格上限 15%，10 片中有 6 片超标',
    quantity: 10, affectedWafers: 6, station: 'EPI-02', priority: '高',
    status: '待评审', submittedBy: '刘工', submittedDate: '2026-05-12', slaDeadline: '2026-05-14',
    reviewComments: [],
    approvalChain: [
      { role: '工艺工程师', approver: '陈工艺', status: 'pending' },
      { role: 'QA 主管', approver: '王主管', status: 'pending' },
    ],
    disposition: '',
    processHistory: [
      { step: '外延生长', operator: '刘操作', equipment: 'EPI-02', timestamp: '2026-05-09 08:00', result: '参数异常' },
      { step: '厚度测量', operator: '检测仪器', equipment: 'FTIR-01', timestamp: '2026-05-09 16:00', result: '厚度超标' },
    ],
  },
];

// ─── Config ──────────────────────────────────────────────────────────
const statusConfig: Record<MRBStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  '待评审': { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: <Clock className="w-3 h-3" /> },
  '已完成': { color: 'text-green-700', bg: 'bg-green-100', icon: <CheckCircle className="w-3 h-3" /> },
};
const priorityConfig: Record<Priority, { color: string; bg: string }> = {
  '紧急': { color: 'text-red-700', bg: 'bg-red-100' },
  '高': { color: 'text-orange-700', bg: 'bg-orange-100' },
  '中': { color: 'text-yellow-700', bg: 'bg-yellow-100' },
  '低': { color: 'text-gray-600', bg: 'bg-gray-100' },
};
const dispositionLabels: Record<string, string> = {
  SCRAP: '报废', REWORK: '返工', USE_AS_IS: '让步接收',
  SORT: '分选', RETURN_TO_VENDOR: '退货', '': '待定',
};
const dispositionColors: Record<string, string> = {
  SCRAP: 'text-red-600', REWORK: 'text-orange-600', USE_AS_IS: 'text-green-600',
  SORT: 'text-blue-600', RETURN_TO_VENDOR: 'text-purple-600', '': 'text-gray-400',
};
const defectTypes = ['表面缺陷', '电性能异常', '边缘缺口', '污染', '厚度异常', '掺杂异常', '其他'];
const stationOptions = ['EPI-01', 'EPI-02', 'EPI-03', 'QC-01', 'QC-02', 'INSP-01', 'CLEAN-01', 'MP-01', 'TXRF-01'];

function isPastSLA(deadline: string, status: MRBStatus): boolean {
  if (status === '已完成') return false;
  return new Date(deadline) < new Date();
}

// ─── CreateMRBModal ──────────────────────────────────────────────────
function CreateMRBModal({ onClose, onCreate }: {
  onClose: () => void; onCreate: (item: MRBItem) => void;
}) {
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedSubBatchCode, setSelectedSubBatchCode] = useState('');
  // Editable wafer data keyed by subBatchCode
  const [waferEdits, setWaferEdits] = useState<Record<string, WaferInfo[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedBatch = mockDefectiveBatches.find(b => b.id === selectedBatchId) ?? null;

  // When batch changes, initialise editable wafer copies
  const handleBatchChange = (id: string) => {
    setSelectedBatchId(id);
    setSelectedSubBatchCode('');
    const batch = mockDefectiveBatches.find(b => b.id === id);
    if (!batch) return;
    const edits: Record<string, WaferInfo[]> = {};
    batch.subBatches.forEach(sb => {
      edits[sb.subBatchCode] = sb.wafers.map(w => ({ ...w }));
    });
    setWaferEdits(edits);
  };

  const activeWafers: WaferInfo[] = selectedSubBatchCode ? (waferEdits[selectedSubBatchCode] ?? []) : [];

  const updateWafer = (idx: number, field: keyof WaferInfo, value: string) => {
    setWaferEdits(prev => {
      const list = [...(prev[selectedSubBatchCode] ?? [])];
      list[idx] = { ...list[idx], [field]: value };
      return { ...prev, [selectedSubBatchCode]: list };
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedBatchId) e.batch = '请选择不良批次';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    const batch = selectedBatch!;
    const today = new Date();
    const deadline = new Date(today);
    deadline.setDate(deadline.getDate() + 3);
    const finalSubBatches: SubBatch[] = batch.subBatches.map(sb => ({
      ...sb,
      wafers: waferEdits[sb.subBatchCode] ?? sb.wafers,
    }));
    const totalWafers = finalSubBatches.reduce((s, sb) => s + sb.wafers.length, 0);
    const affectedWafers = finalSubBatches.reduce(
      (s, sb) => s + sb.wafers.filter(w => w.defectClass !== '').length, 0
    );
    const newItem: MRBItem = {
      id: String(Date.now()),
      mrbNo: `MRB-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      batchNo: batch.batchNo, productCode: batch.productCode, productName: batch.productName,
      defectType: batch.defectType, defectDescription: '',
      quantity: totalWafers, affectedWafers,
      station: batch.station, priority: '中', status: '待评审',
      submittedBy: '当前用户', submittedDate: today.toISOString().slice(0, 10),
      slaDeadline: deadline.toISOString().slice(0, 10),
      reviewComments: [],
      approvalChain: [
        { role: '工艺工程师', approver: '陈工艺', status: 'pending' },
        { role: 'QA 主管', approver: '王主管', status: 'pending' },
      ],
      disposition: '', processHistory: [], subBatches: finalSubBatches,
    };
    onCreate(newItem);
  };

  const defectClassColor: Record<DefectClass, string> = {
    A: 'text-red-600 bg-red-50', B: 'text-orange-600 bg-orange-50',
    C: 'text-yellow-600 bg-yellow-50', '': 'text-gray-400 bg-gray-50',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">新建 MRB 工单</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">

            {/* ── 批次选择 ── */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-1">
                <Layers className="w-4 h-4 text-blue-500" /><span>选择不良批次</span>
                <span className="text-red-500 font-normal"> *</span>
              </h4>
              <select
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                  errors.batch ? 'border-red-400' : 'border-gray-300'
                }`}
                value={selectedBatchId}
                onChange={e => handleBatchChange(e.target.value)}
              >
                <option value="">-- 请选择待判定不良批次 --</option>
                {mockDefectiveBatches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.batchNo}　|　{b.productCode}　{b.productName}　|　{b.station}　|　{b.defectType}
                  </option>
                ))}
              </select>
              {errors.batch && <p className="text-xs text-red-500 mt-1">{errors.batch}</p>}
            </div>

            {/* ── 批次基本信息（带出展示）── */}
            {selectedBatch && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-blue-700 mb-3">批次基本信息</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    ['批次号',   selectedBatch.batchNo],
                    ['产品代码', selectedBatch.productCode],
                    ['产品名称', selectedBatch.productName],
                    ['当前站点', selectedBatch.station],
                    ['缺陷类型', selectedBatch.defectType],
                    ['子批次数', String(selectedBatch.subBatches.length)],
                    ['Wafer 总数', String(selectedBatch.subBatches.reduce((s, sb) => s + sb.wafers.length, 0))],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-xs text-blue-600 mb-0.5">{label}</p>
                      <p className="text-sm font-medium text-gray-800">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 子批次 & Wafer 明细 ── */}
            {selectedBatch && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span>子批次 &amp; Wafer 明细</span>
                  <span className="text-xs font-normal text-gray-400 ml-1">（点击子批次行查看 Wafer 列表）</span>
                </h4>
                <div className="flex gap-4" style={{ minHeight: 260 }}>

                  {/* 子批次列表 */}
                  <div className="w-64 flex-shrink-0">
                    <p className="text-xs font-medium text-gray-500 mb-1">子批次列表</p>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-3 py-2 text-left font-medium text-gray-600">片篮编号</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">子批次编码</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-600">片数</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBatch.subBatches.map(sb => (
                            <tr
                              key={sb.subBatchCode}
                              onClick={() => setSelectedSubBatchCode(sb.subBatchCode)}
                              className={`cursor-pointer border-b border-gray-100 last:border-0 transition-colors ${
                                selectedSubBatchCode === sb.subBatchCode
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <td className="px-3 py-2 font-mono">{sb.carrierId}</td>
                              <td className="px-3 py-2">{sb.subBatchCode}</td>
                              <td className="px-3 py-2 text-center">{sb.wafers.length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Wafer 明细 */}
                  <div className="flex-1 min-w-0">
                    {selectedSubBatchCode
                      ? (
                        <>
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Wafer 明细 — {selectedSubBatchCode}
                            <span className="ml-2 text-gray-400">共 {activeWafers.length} 片</span>
                          </p>
                          <div className="border border-gray-200 rounded-lg overflow-auto max-h-56">
                            <table className="w-full text-xs">
                              <thead className="sticky top-0 bg-gray-50 z-10">
                                <tr className="border-b border-gray-200">
                                  <th className="px-3 py-2 text-left font-medium text-gray-600">SlotID</th>
                                  <th className="px-3 py-2 text-left font-medium text-gray-600">WaferID</th>
                                  <th className="px-3 py-2 text-left font-medium text-gray-600">类型</th>
                                  <th className="px-3 py-2 text-left font-medium text-gray-600">不良代码</th>
                                  <th className="px-3 py-2 text-left font-medium text-gray-600">不良处置标记</th>
                                  <th className="px-3 py-2 text-center font-medium text-gray-600">不良等级</th>
                                </tr>
                              </thead>
                              <tbody>
                                {activeWafers.map((w, idx) => (
                                  <tr key={w.slotId} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                    <td className="px-3 py-1.5 font-mono">{w.slotId}</td>
                                    <td className="px-3 py-1.5 font-mono text-gray-600">{w.waferId}</td>
                                    <td className="px-3 py-1.5">{w.type}</td>
                                    <td className="px-3 py-1.5">
                                      <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded font-mono">{w.defectCode}</span>
                                    </td>
                                    <td className="px-3 py-1.5">
                                      <input
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="录入处置标记..."
                                        value={w.dispositionMark}
                                        onChange={e => updateWafer(idx, 'dispositionMark', e.target.value)}
                                      />
                                    </td>
                                    <td className="px-3 py-1.5 text-center">
                                      <select
                                        className={`border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold ${
                                          defectClassColor[w.defectClass]
                                        }`}
                                        value={w.defectClass}
                                        onChange={e => updateWafer(idx, 'defectClass', e.target.value as DefectClass)}
                                      >
                                        <option value="">—</option>
                                        <option value="A">A 级</option>
                                        <option value="B">B 级</option>
                                        <option value="C">C 级</option>
                                      </select>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )
                      : (
                        <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                          <div className="text-center">
                            <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">点击左侧子批次查看 Wafer 列表</p>
                          </div>
                        </div>
                      )
                    }
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
              <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                根据优先级，系统将自动设定 SLA：紧急 = 1 天，高 = 2 天，中/低 = 3 天。评审超时将自动升级告警。
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">取消</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">提交 MRB</button>
        </div>
      </div>
    </div>
  );
}

// ─── DetailModal ─────────────────────────────────────────────────────
function DetailModal({ item, onClose, onOpenReview, onTriggerCAPA }: {
  item: MRBItem; onClose: () => void; onOpenReview: () => void; onTriggerCAPA: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'process' | 'review' | 'approval'>('overview');
  const sc = statusConfig[item.status];
  const pc = priorityConfig[item.priority];
  const overdue = isPastSLA(item.slaDeadline, item.status);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <ShieldAlert className="w-5 h-5 text-orange-500" />
            <span className="text-lg font-semibold text-gray-800">{item.mrbNo}</span>
            <span className="text-sm text-gray-500">{item.batchNo}</span>
            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
              {sc.icon}<span>{item.status}</span>
            </span>
            {overdue && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                <AlertCircle className="w-3 h-3" /><span>SLA 超时</span>
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
          {([['overview', '概览'], ['process', '制程历史'], ['review', '评审意见'], ['approval', '审批链']] as [typeof activeTab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {([
                  ['产品代码', item.productCode], ['产品名称', item.productName], ['责任站点', item.station],
                  ['缺陷类型', item.defectType], ['批次总量', `${item.quantity} 片`], ['受影响片数', `${item.affectedWafers} 片`],
                  ['提交人', item.submittedBy], ['提交日期', item.submittedDate], ['SLA 截止', item.slaDeadline],
                ] as [string, string][]).map(([label, val]) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{val}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">优先级：</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${pc.bg} ${pc.color}`}>{item.priority}</span>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-orange-700 mb-1 flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4" /><span>缺陷描述</span>
                </p>
                <p className="text-sm text-gray-700">{item.defectDescription}</p>
              </div>
              {item.disposition && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">处置决定</p>
                  <div className="flex items-center space-x-2">
                    <span className={`text-base font-bold ${dispositionColors[item.disposition]}`}>{dispositionLabels[item.disposition]}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{item.disposition}</span>
                  </div>
                  {item.dispositionNote && <p className="mt-2 text-sm text-gray-600">{item.dispositionNote}</p>}
                </div>
              )}
              {item.capaId ? (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-purple-700">已关联 CAPA</p>
                    <p className="text-sm font-medium text-purple-800 mt-0.5">{item.capaId}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-purple-400" />
                </div>
              ) : item.status === '待评审' && (
                <button onClick={() => onTriggerCAPA(item.id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700">
                  <TrendingUp className="w-4 h-4" /><span>发起纠正措施 (CAPA / 8D)</span>
                </button>
              )}
            </div>
          )}

          {activeTab === 'process' && (
            <div>
              <p className="text-xs text-gray-500 mb-4">以下为系统自动抓取的关联制程历史记录</p>
              {item.processHistory.length === 0
                ? <p className="text-sm text-gray-400 text-center py-8">暂无制程历史</p>
                : (
                  <div className="relative pl-6">
                    <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gray-200" />
                    {item.processHistory.map((ph, i) => (
                      <div key={i} className="relative mb-5 last:mb-0">
                        <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow" />
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-gray-700">{ph.step}</span>
                            <span className="text-xs text-gray-400">{ph.timestamp}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>操作员：{ph.operator}</span>
                            <span>设备：{ph.equipment}</span>
                            <span className={/异常|不合格|超标/.test(ph.result) ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                              结果：{ph.result}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {activeTab === 'review' && (
            <div className="space-y-4">
              {item.reviewComments.length === 0
                ? (
                  <div className="text-center py-8 text-gray-400">
                    <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">暂无评审意见</p>
                  </div>
                )
                : item.reviewComments.map((rc, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{rc.reviewer}</p>
                          <p className="text-xs text-gray-500">{rc.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-semibold ${dispositionColors[rc.recommendation]}`}>
                          建议：{dispositionLabels[rc.recommendation]}
                        </span>
                        {rc.signed && (
                          <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                            <CheckCircle className="w-3 h-3" /><span>已签名</span>
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{rc.timestamp}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">{rc.comment}</p>
                  </div>
                ))}
            </div>
          )}

          {activeTab === 'approval' && (
            <div className="space-y-3">
              {item.approvalChain.map((step, i) => (
                <div key={i} className="flex items-center space-x-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.status === 'approved' ? 'bg-green-100' : step.status === 'rejected' ? 'bg-red-100' : 'bg-gray-100'}`}>
                    {step.status === 'approved' ? <ThumbsUp className="w-4 h-4 text-green-600" />
                      : step.status === 'rejected' ? <ThumbsDown className="w-4 h-4 text-red-600" />
                      : <Clock className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-gray-800">{step.approver}</span>
                      <span className="text-xs text-gray-500">({step.role})</span>
                    </div>
                    {step.comment && <p className="text-xs text-gray-600 mt-0.5">{step.comment}</p>}
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium ${step.status === 'approved' ? 'text-green-600' : step.status === 'rejected' ? 'text-red-600' : 'text-gray-400'}`}>
                      {step.status === 'approved' ? '已批准' : step.status === 'rejected' ? '已拒绝' : '待审批'}
                    </span>
                    {step.timestamp && <p className="text-xs text-gray-400 mt-0.5">{step.timestamp}</p>}
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 text-center mt-2">所有审批人批准后，MRB 状态自动更新为"已批准"</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="text-xs text-gray-500">{item.closedDate && `关闭日期：${item.closedDate}`}</div>
          <div className="flex items-center space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">关闭</button>
            {item.status === '待评审' && (
              <button onClick={onOpenReview}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center space-x-2">
                <PenLine className="w-4 h-4" /><span>提交评审意见</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ReviewModal ─────────────────────────────────────────────────────
function ReviewModal({ item, onClose, onSubmit }: {
  item: MRBItem;
  onClose: () => void;
  onSubmit: (
    comment: ReviewComment,
    finalDisposition: DispositionCode,
    approve: boolean,
    updatedSubBatches: SubBatch[],
  ) => void;
}) {
  const resolvedSubBatches: SubBatch[] = useMemo(() => {
    if ((item.subBatches ?? []).length > 0) return item.subBatches ?? [];
    const matched = mockDefectiveBatches.find(
      b =>
        b.batchNo === item.batchNo ||
        (b.productCode === item.productCode && b.station === item.station && b.defectType === item.defectType)
    );
    return (matched?.subBatches ?? []).map(sb => ({
      ...sb,
      wafers: sb.wafers.map(w => ({ ...w })),
    }));
  }, [item.batchNo, item.defectType, item.productCode, item.station, item.subBatches]);

  const [selectedSubBatchCode, setSelectedSubBatchCode] = useState(
    resolvedSubBatches[0]?.subBatchCode ?? ''
  );
  const [waferEdits, setWaferEdits] = useState<Record<string, WaferInfo[]>>(() => {
    const init: Record<string, WaferInfo[]> = {};
    resolvedSubBatches.forEach(sb => {
      init[sb.subBatchCode] = sb.wafers.map(w => ({ ...w }));
    });
    return init;
  });

  const [reviewer, setReviewer] = useState('');
  const [role, setRole] = useState('工艺工程师');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const waferDispositionOptions = ['报废', '返工', '特殊接收', '残值回收'];

  const activeWafers: WaferInfo[] = selectedSubBatchCode
    ? (waferEdits[selectedSubBatchCode] ?? [])
    : [];

  const updateWafer = (idx: number, field: keyof WaferInfo, value: string) => {
    setWaferEdits(prev => {
      const list = [...(prev[selectedSubBatchCode] ?? [])];
      list[idx] = { ...list[idx], [field]: value };
      return { ...prev, [selectedSubBatchCode]: list };
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!reviewer.trim()) e.reviewer = '请输入评审人姓名';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    const rc: ReviewComment = {
      reviewer, role, comment: '', recommendation: '',
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
      signed: true,
    };
    const updatedSubBatches: SubBatch[] = resolvedSubBatches.map(sb => ({
      ...sb,
      wafers: waferEdits[sb.subBatchCode] ?? sb.wafers,
    }));
    onSubmit(rc, '', true, updatedSubBatches);
  };

  const defectClassColor: Record<DefectClass, string> = {
    A: 'text-red-600 bg-red-50', B: 'text-orange-600 bg-orange-50',
    C: 'text-yellow-600 bg-yellow-50', '': 'text-gray-400 bg-gray-50',
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">提交评审意见</h3>
            <span className="text-sm text-gray-500">— {item.mrbNo}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">

            {/* ── 批次基本信息 ── */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-blue-700 mb-3">批次基本信息</p>
              <div className="grid grid-cols-4 gap-3">
                {([
                  ['批次号',   item.batchNo],
                  ['产品代码', item.productCode],
                  ['产品名称', item.productName],
                  ['当前站点', item.station],
                  ['缺陷类型', item.defectType],
                  ['提交人',   item.submittedBy],
                  ['提交日期', item.submittedDate],
                  ['SLA 截止', item.slaDeadline],
                ] as [string, string][]).map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-blue-600 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 子批次 & Wafer 明细 ── */}
            {resolvedSubBatches.length > 0 ? (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span>子批次 &amp; Wafer 明细</span>
                  <span className="text-xs font-normal text-gray-400 ml-1">（可对不良处置标记和不良等级进行补充填写）</span>
                </h4>
                <div className="flex gap-4" style={{ minHeight: 220 }}>
                  {/* 子批次列表 */}
                  <div className="w-64 flex-shrink-0">
                    <p className="text-xs font-medium text-gray-500 mb-1">子批次列表</p>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-3 py-2 text-left font-medium text-gray-600">片篮编号</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">子批次编码</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-600">片数</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resolvedSubBatches.map(sb => (
                            <tr
                              key={sb.subBatchCode}
                              onClick={() => setSelectedSubBatchCode(sb.subBatchCode)}
                              className={`cursor-pointer border-b border-gray-100 last:border-0 transition-colors ${
                                selectedSubBatchCode === sb.subBatchCode
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <td className="px-3 py-2 font-mono">{sb.carrierId}</td>
                              <td className="px-3 py-2">{sb.subBatchCode}</td>
                              <td className="px-3 py-2 text-center">{sb.wafers.length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Wafer 明细 */}
                  <div className="flex-1 min-w-0">
                    {selectedSubBatchCode ? (
                      <>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Wafer 明细 — {selectedSubBatchCode}
                          <span className="ml-2 text-gray-400">共 {activeWafers.length} 片</span>
                        </p>
                        <div className="border border-gray-200 rounded-lg overflow-auto max-h-52">
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-gray-50 z-10">
                              <tr className="border-b border-gray-200">
                                <th className="px-3 py-2 text-left font-medium text-gray-600">SlotID</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">WaferID</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">类型</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">不良代码</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">不良处置标记</th>
                                <th className="px-3 py-2 text-center font-medium text-gray-600">不良等级</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeWafers.map((w, idx) => (
                                <tr key={w.slotId} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                  <td className="px-3 py-1.5 font-mono">{w.slotId}</td>
                                  <td className="px-3 py-1.5 font-mono text-gray-600">{w.waferId}</td>
                                  <td className="px-3 py-1.5">{w.type}</td>
                                  <td className="px-3 py-1.5">
                                    <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded font-mono">{w.defectCode}</span>
                                  </td>
                                  <td className="px-3 py-1.5">
                                    <select
                                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                      value={w.dispositionMark}
                                      onChange={e => updateWafer(idx, 'dispositionMark', e.target.value)}
                                    >
                                      <option value="">请选择...</option>
                                      {waferDispositionOptions.map(op => (
                                        <option key={op} value={op}>{op}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-3 py-1.5 text-center">
                                    <select
                                      className={`border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold ${
                                        defectClassColor[w.defectClass]
                                      }`}
                                      value={w.defectClass}
                                      onChange={e => updateWafer(idx, 'defectClass', e.target.value as DefectClass)}
                                    >
                                      <option value="">—</option>
                                      <option value="A">A 级</option>
                                      <option value="B">B 级</option>
                                      <option value="C">C 级</option>
                                    </select>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                        <div className="text-center">
                          <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">点击左侧子批次查看 Wafer 列表</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-xs text-orange-700 font-medium mb-0.5">待评审缺陷描述</p>
                <p className="text-sm text-gray-700">{item.defectDescription || '无'}</p>
              </div>
            )}

            {/* ── 评审人信息 ── */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">评审人<span className="text-red-500"> *</span></label>
                <input
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.reviewer ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder="姓名" value={reviewer} onChange={e => setReviewer(e.target.value)} />
                {errors.reviewer && <p className="text-xs text-red-500 mt-0.5">{errors.reviewer}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">角色</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={role} onChange={e => setRole(e.target.value)}
                >
                  {['工艺工程师', '设备工程师', 'QA 工程师', 'QA 主管', '产品工程师', '生产主管'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">取消</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center space-x-2">
            <Send className="w-4 h-4" /><span>提交评审</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────
export default function MRBManagement() {
  const [data, setData] = useState<MRBItem[]>(mockMRBData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MRBStatus | '全部'>('全部');
  const [priorityFilter, setPriorityFilter] = useState<Priority | '全部'>('全部');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [detailItem, setDetailItem] = useState<MRBItem | null>(null);
  const [reviewItem, setReviewItem] = useState<MRBItem | null>(null);

  const filtered = useMemo(() =>
    data.filter(item => {
      const matchSearch = !searchTerm
        || item.mrbNo.toLowerCase().includes(searchTerm.toLowerCase())
        || item.batchNo.toLowerCase().includes(searchTerm.toLowerCase())
        || item.productCode.toLowerCase().includes(searchTerm.toLowerCase())
        || item.defectDescription.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === '全部' || item.status === statusFilter;
      const matchPriority = priorityFilter === '全部' || item.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    }), [data, searchTerm, statusFilter, priorityFilter]);

  const handleCreate = (item: MRBItem) => {
    setData(prev => [item, ...prev]);
    setShowCreateModal(false);
  };

  const handleReviewSubmit = (
    itemId: string, rc: ReviewComment, finalDisposition: DispositionCode, approve: boolean, updatedSubBatches: SubBatch[],
  ) => {
    setData(prev => prev.map(d => {
      if (d.id !== itemId) return d;
      const newComments = [...d.reviewComments, rc];
      const newChain = d.approvalChain.map(step => {
        if (step.status === 'pending' && step.role.split(' ')[0] === rc.role.split(' ')[0]) {
          return { ...step, status: (approve ? 'approved' : 'rejected') as 'approved' | 'rejected', comment: rc.comment, timestamp: rc.timestamp };
        }
        return step;
      });
      const allApproved = newChain.every(s => s.status === 'approved');
      const anyRejected = newChain.some(s => s.status === 'rejected');
      const newStatus: MRBStatus = (anyRejected || allApproved) ? '已完成' : '待评审';
      return {
        ...d,
        reviewComments: newComments,
        approvalChain: newChain,
        status: newStatus,
        disposition: finalDisposition || d.disposition,
        subBatches: updatedSubBatches.length > 0 ? updatedSubBatches : d.subBatches,
      };
    }));
    setReviewItem(null);
    setDetailItem(null);
  };

  const handleTriggerCAPA = (id: string) => {
    const capaId = `CAPA-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    setData(prev => prev.map(d => d.id === id ? { ...d, capaId } : d));
    setDetailItem(prev => prev && prev.id === id ? { ...prev, capaId } : prev);
    alert(`已发起纠正措施：${capaId}\n（实际系统将跳转至 CAPA 模块）`);
  };

  const statusTabs: (MRBStatus | '全部')[] = ['全部', '待评审', '已完成'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-6 h-6 text-orange-500" />
          <h2 className="text-lg font-semibold text-gray-800">MRB 管理</h2>
          <span className="text-sm text-gray-500">物料评审委员会</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4 mr-1" />新建 MRB
          </button>
          <button
            onClick={() => setShowFlowModal(true)}
            title="不良品处置流程"
            className="inline-flex items-center px-3 py-2 bg-orange-50 text-orange-600 text-sm font-medium rounded-md border border-orange-200 hover:bg-orange-100 transition-colors">
            <GitBranch className="w-4 h-4 mr-1" />处置流程
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
          {statusTabs.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === s ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              {s}
              {s !== '全部' && (
                <span className={`ml-1.5 ${statusFilter === s ? 'text-blue-600' : 'text-gray-400'}`}>
                  {data.filter(d => d.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="搜索 MRB 编号 / 批次号 / 产品代码 / 缺陷描述..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as Priority | '全部')}
              className="pl-9 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
              {(['全部', '紧急', '高', '中', '低'] as (Priority | '全部')[]).map(p => (
                <option key={p} value={p}>{p === '全部' ? '所有优先级' : p}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <span className="text-sm text-gray-500">共 <strong>{filtered.length}</strong> 条</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-600">MRB 编号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">批次号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">产品代码</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">缺陷类型</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">受影响</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">优先级</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">SLA 截止</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">处置</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">CAPA</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={11} className="px-4 py-12 text-center text-gray-400">暂无数据</td></tr>
              : filtered.map((item, index) => {
                const sc = statusConfig[item.status];
                const pc = priorityConfig[item.priority];
                const overdue = isPastSLA(item.slaDeadline, item.status);
                return (
                  <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 !== 0 ? 'bg-gray-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailItem(item)}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                        {item.mrbNo}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs font-mono">{item.batchNo}</td>
                    <td className="px-4 py-3 text-gray-700">{item.productCode}</td>
                    <td className="px-4 py-3 text-gray-600">{item.defectType}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{item.affectedWafers} 片</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${pc.bg} ${pc.color}`}>{item.priority}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
                        {sc.icon}<span>{item.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${overdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        {overdue && <AlertCircle className="w-3 h-3 inline mr-0.5" />}
                        {item.slaDeadline}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.disposition
                        ? <span className={`text-xs font-semibold ${dispositionColors[item.disposition]}`}>{dispositionLabels[item.disposition]}</span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {item.capaId
                        ? <span className="text-xs text-purple-600 font-medium">{item.capaId}</span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button onClick={() => setDetailItem(item)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3 inline-flex items-center space-x-0.5">
                        <Eye className="w-3 h-3" /><span>详情</span>
                      </button>
                      {item.status === '待评审' && (
                        <button onClick={() => setReviewItem(item)}
                          className="text-green-600 hover:text-green-800 text-xs font-medium inline-flex items-center space-x-0.5">
                          <PenLine className="w-3 h-3" /><span>评审</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showFlowModal && (
        <DefectFlowOverlay onClose={() => setShowFlowModal(false)} />
      )}
      {showCreateModal && (
        <CreateMRBModal onClose={() => setShowCreateModal(false)} onCreate={handleCreate} />
      )}
      {detailItem && (
        <DetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onOpenReview={() => { setReviewItem(detailItem); setDetailItem(null); }}
          onTriggerCAPA={handleTriggerCAPA}
        />
      )}
      {reviewItem && (
        <ReviewModal
          item={reviewItem}
          onClose={() => setReviewItem(null)}
          onSubmit={(rc, disp, approve, subs) => handleReviewSubmit(reviewItem.id, rc, disp, approve, subs)}
        />
      )}
    </div>
  );
}
