// src/components/BatchOperations/components/PackagingSection.tsx
import React, { useEffect, useState } from 'react';
import { Package, Printer, RotateCcw } from 'lucide-react';
import { BatchData, SubBatchData, PackagingRecord } from '../types';
import { batchApiService } from '../services/batchApiService';
import { mockOperators } from '../data/mockOperators';
import { generatePackagingBarcode } from '../utils/packagingBarcode';
import BatchOperationModal from './BatchOperationModal';

interface PackagingSectionProps {
  selectedBatch: BatchData | null;
  subBatches: SubBatchData[];
  onSubBatchesUpdated: (updated: SubBatchData[]) => void;
}

interface PendingCarrierItem {
  sublotId: string;
  carrierId: string;
  confirmed: boolean;
}

type PackagingPhase = 'confirm' | 'barcode' | 'preview';

const PackagingSection: React.FC<PackagingSectionProps> = ({
  selectedBatch,
  subBatches,
  onSubBatchesUpdated,
}) => {
  const batchId = selectedBatch?.id || '';

  // 已生成的出货条码记录：不再渲染成列表，只用于"重打"时定位子批次所属的记录
  const [records, setRecords] = useState<PackagingRecord[]>([]);
  const [selectedSublotIds, setSelectedSublotIds] = useState<string[]>([]);

  // 包装弹窗：防呆确认 → 出货条码表单 → 标签打印预览，三阶段共用一个弹窗
  const [packagingModalOpen, setPackagingModalOpen] = useState(false);
  const [packagingPhase, setPackagingPhase] = useState<PackagingPhase>('confirm');
  const [pendingChecklist, setPendingChecklist] = useState<PendingCarrierItem[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [barcodeForm, setBarcodeForm] = useState<{ packagingBarcode: string; operator: string; remark: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [reprintTarget, setReprintTarget] = useState<{ sublotId: string; recordId: string } | null>(null);
  const [reprintReason, setReprintReason] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!batchId) {
      setRecords([]);
      return;
    }
    (async () => {
      const data = await batchApiService.getPackagingRecords(batchId);
      if (!cancelled) setRecords(data);
    })();
    return () => { cancelled = true; };
  }, [batchId]);

  const handleRowSelect = (sublotId: string) => {
    setSelectedSublotIds(prev =>
      prev.includes(sublotId) ? prev.filter(id => id !== sublotId) : [...prev, sublotId]
    );
  };

  const handleStartPackaging = () => {
    if (selectedSublotIds.length === 0) return;
    const checklist = subBatches
      .filter(sb => selectedSublotIds.includes(sb.sublotId))
      .map(sb => ({ sublotId: sb.sublotId, carrierId: sb.carrierId, confirmed: false }));
    setPendingChecklist(checklist);
    setPackagingPhase('confirm');
    setPackagingModalOpen(true);
    setScanError(null);
    setScanInput('');
    setBarcodeForm(null);
  };

  const handleScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const value = scanInput.trim();
    if (!value) return;

    const target = pendingChecklist.find(item => item.carrierId === value && !item.confirmed);
    if (!target) {
      setScanError(`片篮号「${value}」不在所选批次中，或已确认过`);
      setScanInput('');
      return;
    }

    const updated = pendingChecklist.map(item =>
      item.sublotId === target.sublotId ? { ...item, confirmed: true } : item
    );
    setPendingChecklist(updated);
    setScanError(null);
    setScanInput('');

    if (updated.every(item => item.confirmed)) {
      const nextBarcode = generatePackagingBarcode(selectedBatch?.batchCode || '', records);
      setBarcodeForm({
        packagingBarcode: nextBarcode,
        operator: mockOperators[0]?.name || '',
        remark: '',
      });
      setPackagingPhase('barcode');
    }
  };

  const handleCancelPackaging = () => {
    setPackagingModalOpen(false);
    setPackagingPhase('confirm');
    setPendingChecklist([]);
    setScanInput('');
    setScanError(null);
    setBarcodeForm(null);
  };

  const handleConfirmBarcodeForm = () => {
    if (!barcodeForm || !barcodeForm.packagingBarcode.trim()) return;
    setPackagingPhase('preview');
  };

  const handleConfirmPrint = async () => {
    if (!barcodeForm || !barcodeForm.packagingBarcode.trim() || !batchId) return;
    setIsSubmitting(true);
    try {
      const carrierIds = pendingChecklist.map(item => item.carrierId);
      const { record } = await batchApiService.createPackagingRecord(batchId, {
        sublotIds: pendingChecklist.map(item => item.sublotId),
        carrierIds,
        packagingBarcode: barcodeForm.packagingBarcode.trim(),
        operator: barcodeForm.operator,
        remark: barcodeForm.remark || undefined,
      });

      await batchApiService.printPackagingRecord(batchId, record.id);

      console.log('--- 打印出货条码标签 ---');
      console.log(`出货条码: ${record.packagingBarcode}`);
      console.log(`子批次: ${record.sublotIds.join(', ')}`);
      console.log(`片数: ${record.totalQty}`);
      console.log('-----------------------');

      setRecords(prev => [...prev, { ...record, printStatus: '已打印' as const, printCount: record.printCount + 1 }]);

      const updatedSubBatches = subBatches.map(sb =>
        selectedSublotIds.includes(sb.sublotId)
          ? {
              ...sb,
              packagingBarcode: record.packagingBarcode,
              packagingStatus: '已包装' as const,
              packagingTime: record.packagingTime,
              printStatus: '已打印' as const,
              printCount: (sb.printCount || 0) + 1,
            }
          : sb
      );
      onSubBatchesUpdated(updatedSubBatches);

      setSelectedSublotIds([]);
      handleCancelPackaging();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReprint = (sb: SubBatchData) => {
    const record = records.find(r => r.sublotIds.includes(sb.sublotId));
    if (!record) return;
    setReprintTarget({ sublotId: sb.sublotId, recordId: record.id });
    setReprintReason('');
  };

  const handleConfirmReprint = async () => {
    if (!reprintTarget || !reprintReason.trim() || !batchId) return;
    const operator = mockOperators[0]?.name || '';
    const record = records.find(r => r.id === reprintTarget.recordId);
    if (!record) return;

    await batchApiService.reprintPackagingRecord(batchId, reprintTarget.recordId, reprintReason.trim(), operator);

    console.log(`--- 重打标签：${record.packagingBarcode}，原因：${reprintReason.trim()} ---`);

    setRecords(prev => prev.map(r =>
      r.id === reprintTarget.recordId
        ? {
            ...r,
            printCount: r.printCount + 1,
            reprints: [...r.reprints, { id: `reprint-${r.printCount + 1}`, reason: reprintReason.trim(), operator, time: new Date().toISOString() }],
          }
        : r
    ));
    onSubBatchesUpdated(subBatches.map(sb =>
      record.sublotIds.includes(sb.sublotId)
        ? { ...sb, printCount: (sb.printCount || 0) + 1 }
        : sb
    ));

    setReprintTarget(null);
    setReprintReason('');
  };

  const previewTotalQty = subBatches
    .filter(sb => selectedSublotIds.includes(sb.sublotId))
    .reduce((sum, sb) => sum + sb.totalQty, 0);

  const packagingModalTitle = packagingPhase === 'preview' ? '标签打印预览' : '包装确认';

  return (
    <div className="p-4 border-b">
      <h2 className="text-base font-medium mb-2 text-gray-700">包装打印</h2>

      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100 border-b">
                <th className="py-1.5 px-3 w-10 text-left"></th>
                <th className="py-1.5 px-3 text-left text-gray-700 font-medium">子批次号</th>
                <th className="py-1.5 px-3 text-left text-gray-700 font-medium">载具编码</th>
                <th className="py-1.5 px-3 text-center text-gray-700 font-medium">片数</th>
                <th className="py-1.5 px-3 text-center text-gray-700 font-medium">包装状态</th>
                <th className="py-1.5 px-3 text-left text-gray-700 font-medium">出货条码</th>
                <th className="py-1.5 px-3 text-left text-gray-700 font-medium">包装时间</th>
                <th className="py-1.5 px-3 text-center text-gray-700 font-medium">打印状态</th>
                <th className="py-1.5 px-3 text-center text-gray-700 font-medium">打印次数</th>
                <th className="py-1.5 px-3 text-center text-gray-700 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {subBatches.length > 0 ? (
                subBatches.map((sb, index) => (
                  <tr key={sb.sublotId} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-1 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedSublotIds.includes(sb.sublotId)}
                        disabled={sb.packagingStatus === '已包装'}
                        onChange={() => handleRowSelect(sb.sublotId)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                    <td className="py-1 px-3">{sb.sublotId}</td>
                    <td className="py-1 px-3">{sb.carrierId}</td>
                    <td className="py-1 px-3 text-center">{sb.totalQty}</td>
                    <td className="py-1 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${sb.packagingStatus === '已包装' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {sb.packagingStatus || '待包装'}
                      </span>
                    </td>
                    <td className="py-1 px-3">{sb.packagingBarcode || '-'}</td>
                    <td className="py-1 px-3">{sb.packagingTime ? new Date(sb.packagingTime).toLocaleString() : '-'}</td>
                    <td className="py-1 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${sb.printStatus === '已打印' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {sb.printStatus || '未打印'}
                      </span>
                    </td>
                    <td className="py-1 px-3 text-center">{sb.printCount || 0}</td>
                    <td className="py-1 px-3 text-center space-x-2">
                      {sb.packagingStatus !== '已包装' && (
                        <button
                          onClick={handleStartPackaging}
                          disabled={!selectedSublotIds.includes(sb.sublotId)}
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                            selectedSublotIds.includes(sb.sublotId)
                              ? 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          }`}
                        >
                          <Package className="w-3 h-3 mr-1" />
                          包装
                        </button>
                      )}
                      {sb.printStatus === '已打印' && (
                        <button
                          onClick={() => handleOpenReprint(sb)}
                          className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-orange-700 bg-orange-100 rounded hover:bg-orange-200"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          重打
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500">暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BatchOperationModal
        isOpen={packagingModalOpen}
        title={packagingModalTitle}
        onClose={handleCancelPackaging}
        maxWidth="max-w-lg"
      >
        <div className="p-4">
          {packagingPhase === 'confirm' && (
            <>
              <h3 className="text-sm font-medium text-gray-700 mb-2">防呆确认：请依次扫描/输入实际片篮号</h3>
              <ul className="space-y-1 mb-2 max-h-40 overflow-y-auto">
                {pendingChecklist.map(item => (
                  <li key={item.sublotId} className="text-sm flex items-center">
                    <span className={`inline-block w-4 h-4 mr-2 rounded-full text-center text-xs leading-4 ${item.confirmed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                      {item.confirmed ? '✓' : ''}
                    </span>
                    {item.sublotId}（{item.carrierId}）
                  </li>
                ))}
              </ul>
              <input
                type="text"
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                onKeyDown={handleScanKeyDown}
                placeholder="扫描或输入片篮号，回车确认"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {scanError && <p className="text-sm text-red-600 mt-1.5">{scanError}</p>}
              <div className="flex justify-end mt-3">
                <button onClick={handleCancelPackaging} className="px-4 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
                  取消
                </button>
              </div>
            </>
          )}

          {packagingPhase === 'barcode' && barcodeForm && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">出货条码</label>
                  <input
                    type="text"
                    value={barcodeForm.packagingBarcode}
                    onChange={e => setBarcodeForm({ ...barcodeForm, packagingBarcode: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">包装人员</label>
                  <select
                    value={barcodeForm.operator}
                    onChange={e => setBarcodeForm({ ...barcodeForm, operator: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                  >
                    {mockOperators.map(op => (
                      <option key={op.id} value={op.name}>{op.name}({op.id})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={barcodeForm.remark}
                  onChange={e => setBarcodeForm({ ...barcodeForm, remark: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                  placeholder="备注（可选）"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-3">
                <button onClick={handleCancelPackaging} className="px-4 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
                  取消
                </button>
                <button
                  onClick={handleConfirmBarcodeForm}
                  disabled={!barcodeForm.packagingBarcode.trim()}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一步
                </button>
              </div>
            </>
          )}

          {packagingPhase === 'preview' && barcodeForm && (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-3 space-y-1 text-sm">
                <p><span className="text-gray-500">出货条码：</span>{barcodeForm.packagingBarcode}</p>
                <p><span className="text-gray-500">子批次号：</span>{pendingChecklist.map(item => item.sublotId).join(', ')}</p>
                <p><span className="text-gray-500">片数：</span>{previewTotalQty}</p>
                <p><span className="text-gray-500">包装人员：</span>{barcodeForm.operator}</p>
                {barcodeForm.remark && <p><span className="text-gray-500">备注：</span>{barcodeForm.remark}</p>}
              </div>
              <div className="flex justify-end space-x-3">
                <button onClick={handleCancelPackaging} className="px-4 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
                  取消
                </button>
                <button
                  onClick={handleConfirmPrint}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  {isSubmitting ? '处理中...' : '确认打印'}
                </button>
              </div>
            </>
          )}
        </div>
      </BatchOperationModal>

      <BatchOperationModal
        isOpen={!!reprintTarget}
        title="重打标签"
        onClose={() => setReprintTarget(null)}
        maxWidth="max-w-md"
      >
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">重打原因</label>
            <textarea
              value={reprintReason}
              onChange={e => setReprintReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="如：标签污损、字迹模糊..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button onClick={() => setReprintTarget(null)} className="px-4 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
              取消
            </button>
            <button
              onClick={handleConfirmReprint}
              disabled={!reprintReason.trim()}
              className={`px-4 py-1.5 rounded-md text-sm font-medium ${reprintReason.trim() ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              确认重打
            </button>
          </div>
        </div>
      </BatchOperationModal>
    </div>
  );
};

export default PackagingSection;
