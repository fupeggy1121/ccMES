// src/components/BatchOperations/components/PackagingSection.tsx
import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { BatchData, SubBatchData, PackagingRecord } from '../types';
import { batchApiService } from '../services/batchApiService';
import { mockOperators } from '../data/mockOperators';
import { generatePackagingBarcode } from '../utils/packagingBarcode';

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

const PackagingSection: React.FC<PackagingSectionProps> = ({
  selectedBatch,
  subBatches,
  onSubBatchesUpdated,
}) => {
  const batchId = selectedBatch?.id || '';

  const [records, setRecords] = useState<PackagingRecord[]>([]);
  const [selectedSublotIds, setSelectedSublotIds] = useState<string[]>([]);
  const [confirmMode, setConfirmMode] = useState(false);
  const [pendingChecklist, setPendingChecklist] = useState<PendingCarrierItem[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [barcodeForm, setBarcodeForm] = useState<{ packagingBarcode: string; operator: string; remark: string } | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setConfirmMode(true);
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
      item.carrierId === value ? { ...item, confirmed: true } : item
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
    }
  };

  const handleCancelPackaging = () => {
    setConfirmMode(false);
    setPendingChecklist([]);
    setScanInput('');
    setScanError(null);
    setBarcodeForm(null);
  };

  const handleConfirmCreateRecord = async () => {
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

      setRecords(prev => [...prev, record]);

      const updatedSubBatches = subBatches.map(sb =>
        selectedSublotIds.includes(sb.sublotId)
          ? { ...sb, packagingBarcode: record.packagingBarcode, packagingStatus: '已包装' as const, packagingTime: record.packagingTime }
          : sb
      );
      onSubBatchesUpdated(updatedSubBatches);

      setSelectedSublotIds([]);
      handleCancelPackaging();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 border-b">
      <h2 className="text-base font-medium mb-4 text-gray-700">包装打印</h2>

      <div className="border rounded-lg overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="py-2 px-4 w-10 text-left"></th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">子批次号</th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">载具编码</th>
              <th className="py-2 px-4 text-center text-gray-700 font-medium">片数</th>
              <th className="py-2 px-4 text-center text-gray-700 font-medium">包装状态</th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">出货条码</th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">包装时间</th>
              <th className="py-2 px-4 text-center text-gray-700 font-medium">打印状态</th>
              <th className="py-2 px-4 text-center text-gray-700 font-medium">打印次数</th>
            </tr>
          </thead>
          <tbody>
            {subBatches.length > 0 ? (
              subBatches.map((sb, index) => (
                <tr key={sb.sublotId} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-2 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedSublotIds.includes(sb.sublotId)}
                      disabled={sb.packagingStatus === '已包装'}
                      onChange={() => handleRowSelect(sb.sublotId)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </td>
                  <td className="py-2 px-4">{sb.sublotId}</td>
                  <td className="py-2 px-4">{sb.carrierId}</td>
                  <td className="py-2 px-4 text-center">{sb.totalQty}</td>
                  <td className="py-2 px-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${sb.packagingStatus === '已包装' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {sb.packagingStatus || '待包装'}
                    </span>
                  </td>
                  <td className="py-2 px-4">{sb.packagingBarcode || '-'}</td>
                  <td className="py-2 px-4">{sb.packagingTime ? new Date(sb.packagingTime).toLocaleString() : '-'}</td>
                  <td className="py-2 px-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${sb.printStatus === '已打印' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {sb.printStatus || '未打印'}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-center">{sb.printCount || 0}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!confirmMode && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleStartPackaging}
            disabled={selectedSublotIds.length === 0}
            className={`inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium ${
              selectedSublotIds.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Package className="w-4 h-4 mr-2" />
            包装
          </button>
        </div>
      )}

      {confirmMode && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">防呆确认：请依次扫描/输入实际片篮号</h3>
          <ul className="space-y-1 mb-3">
            {pendingChecklist.map(item => (
              <li key={item.carrierId} className="text-sm flex items-center">
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
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {scanError && <p className="text-sm text-red-600 mt-2">{scanError}</p>}
          <div className="flex justify-end mt-3">
            <button onClick={handleCancelPackaging} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
              取消
            </button>
          </div>
        </div>
      )}

      {barcodeForm && (
        <div className="border border-blue-200 bg-blue-50 rounded-md p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">出货条码</label>
              <input
                type="text"
                value={barcodeForm.packagingBarcode}
                onChange={e => setBarcodeForm({ ...barcodeForm, packagingBarcode: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">包装人员</label>
              <select
                value={barcodeForm.operator}
                onChange={e => setBarcodeForm({ ...barcodeForm, operator: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                {mockOperators.map(op => (
                  <option key={op.id} value={op.name}>{op.name}({op.id})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={barcodeForm.remark}
              onChange={e => setBarcodeForm({ ...barcodeForm, remark: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="备注（可选）"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button onClick={handleCancelPackaging} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
              取消
            </button>
            <button
              onClick={handleConfirmCreateRecord}
              disabled={isSubmitting || !barcodeForm.packagingBarcode.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '处理中...' : '确定'}
            </button>
          </div>
        </div>
      )}

      <h3 className="text-sm font-medium text-gray-700 mb-2">出货条码列表</h3>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="py-2 px-4 w-10"></th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">出货条码</th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">包装时间</th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">包装人员</th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">子批次号</th>
              <th className="py-2 px-4 text-center text-gray-700 font-medium">总片数</th>
              <th className="py-2 px-4 text-left text-gray-700 font-medium">备注</th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? (
              records.map(record => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 text-center">
                    <input
                      type="radio"
                      checked={selectedRecordId === record.id}
                      onChange={() => setSelectedRecordId(record.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300"
                    />
                  </td>
                  <td className="py-2 px-4">{record.packagingBarcode}</td>
                  <td className="py-2 px-4">{new Date(record.packagingTime).toLocaleString()}</td>
                  <td className="py-2 px-4">{record.operator}</td>
                  <td className="py-2 px-4">{record.sublotIds.join(', ')}</td>
                  <td className="py-2 px-4 text-center">{record.totalQty}</td>
                  <td className="py-2 px-4">{record.remark || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PackagingSection;
