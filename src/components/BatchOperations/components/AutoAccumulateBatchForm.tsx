// AutoAccumulateBatchForm.tsx
// 自动攒批操作表单
// 并片机设备读取片篮后自动将数据上传到MES后端。
// 操作员输入片篮编码后，MES从后端查询并片机上传的wafer清单，
// 识别每片wafer的来源批次/片篮/slot，确认后弹出成功消息框并关闭表单。

import React, { useState, useCallback } from 'react';
import { Search, CheckCircle, AlertCircle, Loader2, AlertTriangle } from 'lucide-react';

// ── 并片机上传的数据结构（后端存储格式）──────────────────────────
interface WaferListItem {
  slot: number;
  read_wafer_id: string;
  state: '0' | '1';
}

interface MachineUploadData {
  task_id: string;
  box_no: string;
  device_id: string;
  result_time: string;
  wafer_lists: WaferListItem[];
  summary: { ok_count: number; ng_count: number };
}

// ── 统一的表格行（含来源信息；未识别行 isUnresolved=true）──────
interface WaferTableRow {
  currentSlot: number;
  waferId: string;
  materialId: string | null;
  sourceBatchCode: string | null;
  sourceCarrierId: string | null;
  sourceSlot: number | null;
  isUnresolved: boolean;
}

// ────────────────────────────────────────────────────────────────
// 模拟后端数据库
// 实际对应 GET /api/carrier-scan-results?box_no={carrierId}
// ────────────────────────────────────────────────────────────────
const MOCK_CARRIER_SCAN_DB: Record<string, MachineUploadData> = {
  // 正常数据：所有 wafer 刻码均可识别
  'FLOW-20250101001': {
    task_id: 'MES20250101-001',
    box_no: 'FLOW-20250101001',
    device_id: 'AID-01',
    result_time: '2025-01-02T10:15:30+08:00',
    wafer_lists: [
      { slot: 1,  read_wafer_id: 'ABC123456789', state: '0' },
      { slot: 2,  read_wafer_id: 'ABC123456790', state: '0' },
      { slot: 3,  read_wafer_id: 'ABC123456791', state: '0' },
      { slot: 4,  read_wafer_id: 'ABC123456792', state: '0' },
      { slot: 5,  read_wafer_id: 'ABC123456793', state: '0' },
      { slot: 6,  read_wafer_id: 'ABC123456794', state: '0' },
      { slot: 7,  read_wafer_id: 'DEF111111111', state: '0' },
      { slot: 8,  read_wafer_id: 'DEF111111112', state: '0' },
      { slot: 9,  read_wafer_id: 'GHI999999999', state: '0' },
      { slot: 10, read_wafer_id: 'GHI999999998', state: '0' },
      { slot: 11, read_wafer_id: 'JKL888888881', state: '0' },
      { slot: 12, read_wafer_id: 'JKL888888882', state: '0' },
      { slot: 13, read_wafer_id: 'MNO777777771', state: '0' },
      { slot: 14, read_wafer_id: 'MNO777777772', state: '0' },
      { slot: 15, read_wafer_id: 'PQR666666661', state: '0' },
    ],
    summary: { ok_count: 15, ng_count: 0 },
  },

  // 异常数据：slot 11 的 JKL888888881 被并片机识别为 JKL888888887（刻码误读）
  'FLOW-20250101002': {
    task_id: 'MES20250101-002',
    box_no: 'FLOW-20250101002',
    device_id: 'AID-01',
    result_time: '2025-01-02T14:30:10+08:00',
    wafer_lists: [
      { slot: 1,  read_wafer_id: 'ABC123456789', state: '0' },
      { slot: 2,  read_wafer_id: 'ABC123456790', state: '0' },
      { slot: 3,  read_wafer_id: 'ABC123456791', state: '0' },
      { slot: 4,  read_wafer_id: 'ABC123456792', state: '0' },
      { slot: 5,  read_wafer_id: 'ABC123456793', state: '0' },
      { slot: 6,  read_wafer_id: 'ABC123456794', state: '0' },
      { slot: 7,  read_wafer_id: 'DEF111111111', state: '0' },
      { slot: 8,  read_wafer_id: 'DEF111111112', state: '0' },
      { slot: 9,  read_wafer_id: 'GHI999999999', state: '0' },
      { slot: 10, read_wafer_id: 'GHI999999998', state: '0' },
      // ↓ 并片机将 JKL888888881 误读为 JKL888888887，MES 中不存在该刻码
      { slot: 11, read_wafer_id: 'JKL888888887', state: '0' },
      { slot: 12, read_wafer_id: 'JKL888888882', state: '0' },
      { slot: 13, read_wafer_id: 'MNO777777771', state: '0' },
      { slot: 14, read_wafer_id: 'MNO777777772', state: '0' },
      { slot: 15, read_wafer_id: 'PQR666666661', state: '0' },
    ],
    summary: { ok_count: 14, ng_count: 1 },
  },
};

// 模拟：wafer刻码 → 在制品所在批次/片篮/slot/材料号
// 实际对应 GET /api/wafers/{waferId}/location
const MOCK_WAFER_SOURCE_MAP: Record<string, { batchCode: string; carrierId: string; slot: number; materialId: string }> = {
  'ABC123456789': { batchCode: 'ACCUM-A-001', carrierId: 'CA-2025-0001', slot: 3,  materialId: 'W-A001-003' },
  'ABC123456790': { batchCode: 'ACCUM-A-001', carrierId: 'CA-2025-0001', slot: 7,  materialId: 'W-A001-007' },
  'ABC123456791': { batchCode: 'ACCUM-A-002', carrierId: 'CA-2025-0002', slot: 2,  materialId: 'W-A002-002' },
  'ABC123456792': { batchCode: 'ACCUM-A-002', carrierId: 'CA-2025-0002', slot: 5,  materialId: 'W-A002-005' },
  'ABC123456793': { batchCode: 'ACCUM-B-001', carrierId: 'CB-2025-0001', slot: 1,  materialId: 'W-B001-001' },
  'ABC123456794': { batchCode: 'ACCUM-B-001', carrierId: 'CB-2025-0001', slot: 8,  materialId: 'W-B001-008' },
  'DEF111111111': { batchCode: 'ACCUM-A-003', carrierId: 'CA-2025-0003', slot: 4,  materialId: 'W-A003-004' },
  'DEF111111112': { batchCode: 'ACCUM-A-003', carrierId: 'CA-2025-0003', slot: 12, materialId: 'W-A003-012' },
  'GHI999999999': { batchCode: 'ACCUM-C-001', carrierId: 'CC-2025-0001', slot: 6,  materialId: 'W-C001-006' },
  'GHI999999998': { batchCode: 'ACCUM-C-001', carrierId: 'CC-2025-0001', slot: 9,  materialId: 'W-C001-009' },
  'JKL888888881': { batchCode: 'ACCUM-D-001', carrierId: 'CD-2025-0001', slot: 11, materialId: 'W-D001-011' },
  'JKL888888882': { batchCode: 'ACCUM-D-001', carrierId: 'CD-2025-0001', slot: 14, materialId: 'W-D001-014' },
  'MNO777777771': { batchCode: 'ACCUM-E-001', carrierId: 'CE-2025-0001', slot: 5,  materialId: 'W-E001-005' },
  'MNO777777772': { batchCode: 'ACCUM-E-001', carrierId: 'CE-2025-0001', slot: 10, materialId: 'W-E001-010' },
  'PQR666666661': { batchCode: 'ACCUM-F-001', carrierId: 'CF-2025-0001', slot: 2,  materialId: 'W-F001-002' },
  // 注意：JKL888888887 故意不在此表中，模拟刻码误读后 MES 校验失败
};

const mockFetchCarrierScanResult = (boxNo: string): Promise<MachineUploadData | null> =>
  new Promise(resolve => setTimeout(() => resolve(MOCK_CARRIER_SCAN_DB[boxNo] ?? null), 600));

// ── 成功弹框组件 ─────────────────────────────────────────────────
interface SuccessModalProps {
  batchCode: string;
  onClose: () => void;
}
const SuccessModal: React.FC<SuccessModalProps> = ({ batchCode, onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8 flex flex-col items-center gap-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
        <CheckCircle className="w-9 h-9 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800">攒批成功</h3>
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-1">新批次编号</p>
        <p className="text-base font-mono font-bold text-gray-800 bg-gray-100 rounded px-3 py-1.5 select-all">
          {batchCode}
        </p>
      </div>
      <button
        onClick={onClose}
        className="mt-2 w-full px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        确定
      </button>
    </div>
  </div>
);

// ── 主表单组件 ───────────────────────────────────────────────────
interface AutoAccumulateBatchFormProps {
  handleBackToBatchList: () => void;
}

const AutoAccumulateBatchForm: React.FC<AutoAccumulateBatchFormProps> = ({
  handleBackToBatchList,
}) => {
  const [carrierId, setCarrierId]         = useState<string>('');
  const [isQuerying, setIsQuerying]       = useState<boolean>(false);
  const [scanData, setScanData]           = useState<MachineUploadData | null>(null);
  const [waferRows, setWaferRows]         = useState<WaferTableRow[]>([]);
  const [queryError, setQueryError]       = useState<string>('');
  const [successCode, setSuccessCode]     = useState<string>('');  // 非空时显示成功弹框

  // ── 解析 wafer 清单，统一为 WaferTableRow ────────────────────
  const buildWaferRows = useCallback((data: MachineUploadData) => {
    const rows: WaferTableRow[] = data.wafer_lists.map(item => {
      const source = MOCK_WAFER_SOURCE_MAP[item.read_wafer_id];
      if (source) {
        return {
          currentSlot: item.slot,
          waferId: item.read_wafer_id,
          materialId: source.materialId,
          sourceBatchCode: source.batchCode,
          sourceCarrierId: source.carrierId,
          sourceSlot: source.slot,
          isUnresolved: false,
        };
      }
      return {
        currentSlot: item.slot,
        waferId: item.read_wafer_id,
        materialId: null,
        sourceBatchCode: null,
        sourceCarrierId: null,
        sourceSlot: null,
        isUnresolved: true,
      };
    });
    setWaferRows(rows);
  }, []);

  // ── 查询 ─────────────────────────────────────────────────────
  const handleQuery = useCallback(async () => {
    const trimmed = carrierId.trim();
    if (!trimmed) return;
    setIsQuerying(true);
    setQueryError('');
    setScanData(null);
    setWaferRows([]);
    setSuccessCode('');
    try {
      const data = await mockFetchCarrierScanResult(trimmed);
      if (!data) {
        setQueryError(`未找到片篮 "${trimmed}" 的并片机上传记录，请确认片篮编码或联系设备操作员。`);
      } else {
        setScanData(data);
        buildWaferRows(data);
      }
    } finally {
      setIsQuerying(false);
    }
  }, [carrierId, buildWaferRows]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleQuery();
  };

  // ── 确认攒批 ─────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const code = `AUTO-ACCUM-${timestamp}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    setSuccessCode(code);
  }, []);

  const hasUnresolved  = waferRows.some(r => r.isUnresolved);
  const unresolvedRows = waferRows.filter(r => r.isUnresolved);
  const involvedBatches = Array.from(new Set(
    waferRows.filter(r => !r.isUnresolved).map(r => r.sourceBatchCode as string)
  ));

  return (
    <>
      {/* ── 成功弹框（叠在表单之上，确认后关闭整个表单）── */}
      {successCode && (
        <SuccessModal batchCode={successCode} onClose={handleBackToBatchList} />
      )}

      <div className="p-6 space-y-6">

        {/* ── 片篮编码查询 ──────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">片篮编码</label>
            <input
              type="text"
              value={carrierId}
              onChange={(e) => { setCarrierId(e.target.value); setQueryError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="输入或扫描片篮编码，按Enter查询（示例：FLOW-20250101001）"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleQuery}
              disabled={!carrierId.trim() || isQuerying}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap ${
                carrierId.trim() && !isQuerying
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isQuerying
                ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />查询中</>
                : <><Search className="w-4 h-4 mr-1.5" />查询</>
              }
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            操作员将并好片的片篮放到并片机并输入片篮编码后，设备会自动识别Wafer刻码上传Wafer清单至MES。在此输入对应片篮编码即可查询。
          </p>

          {queryError && (
            <div className="mt-3 flex items-start p-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{queryError}</p>
            </div>
          )}

          {scanData && (
            <div className="mt-3 flex gap-6 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-3">
              <div><span className="font-medium text-gray-700">设备ID：</span>{scanData.device_id}</div>
              <div><span className="font-medium text-gray-700">采集时间：</span>{scanData.result_time}</div>
            </div>
          )}
        </div>

        {/* ── Wafer 清单 ───────────────────────────────────── */}
        {waferRows.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Wafer清单
                <span className="ml-2 text-xs font-normal text-gray-500">
                  共 {waferRows.length} 片，涉及 {involvedBatches.length} 个批次
                </span>
              </h3>
              {hasUnresolved && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {unresolvedRows.length} 片刻码异常
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">当前Slot</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">Wafer刻码</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">材料号</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">原批次</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">原片篮</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">原Slot</th>
                  </tr>
                </thead>
                <tbody>
                  {waferRows.map((wafer, idx) =>
                    wafer.isUnresolved ? (
                      <tr key={`${wafer.currentSlot}-${wafer.waferId}`} className="bg-red-50">
                        <td className="px-3 py-2 font-mono text-red-700 border-b border-red-100">{wafer.currentSlot}</td>
                        <td className="px-3 py-2 border-b border-red-100">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                            <span className="font-mono text-red-700 font-semibold">{wafer.waferId}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 border-b border-red-100" colSpan={4}>
                          <span className="text-xs text-red-600">
                            MES中不存在该刻码，请取出该片手动核实刻码是否准确；如有误请联系设备操作员重新上传。
                          </span>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={`${wafer.currentSlot}-${wafer.waferId}`}
                        className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                      >
                        <td className="px-3 py-2 font-mono text-gray-800 border-b border-gray-100">{wafer.currentSlot}</td>
                        <td className="px-3 py-2 font-mono text-gray-800 border-b border-gray-100">{wafer.waferId}</td>
                        <td className="px-3 py-2 font-mono text-gray-800 border-b border-gray-100">{wafer.materialId}</td>
                        <td className="px-3 py-2 font-mono text-gray-800 border-b border-gray-100">{wafer.sourceBatchCode}</td>
                        <td className="px-3 py-2 font-mono text-gray-800 border-b border-gray-100">{wafer.sourceCarrierId}</td>
                        <td className="px-3 py-2 font-mono text-gray-800 border-b border-gray-100">{wafer.sourceSlot}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* 刻码异常时阻止确认的提示 */}
            {hasUnresolved && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  存在 {unresolvedRows.length} 片刻码校验失败的Wafer，无法确认攒批。请取出标红Wafer手动核实刻码，确认无误后联系设备操作员重新上传并片机数据。
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── 操作按钮 ─────────────────────────────────────── */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleBackToBatchList}
            className="px-6 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={waferRows.length === 0 || hasUnresolved}
            className={`px-6 py-2 rounded-md text-sm font-medium ${
              waferRows.length > 0 && !hasUnresolved
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            确认攒批
          </button>
        </div>
      </div>
    </>
  );
};

export default AutoAccumulateBatchForm;
