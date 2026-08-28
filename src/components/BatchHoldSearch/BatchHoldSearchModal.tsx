import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { batchApiService } from '../BatchOperations/services/batchApiService';
import { BatchData } from '../BatchOperations/types';
import { buildCsvContent, downloadCsv } from '../BatchOperations/utils/csvExport';
import BatchHoldModal from '../BatchOperations/components/BatchHoldModal';
import BatchScopeFilter, {
  BatchScopeFilterValue,
  emptyScopeFilterValue,
  filterBatchesByScope,
} from './BatchScopeFilter';

interface BatchHoldSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 扣留成功后回调，调用方负责刷新批次列表 */
  onConfirmed: () => void;
}

/** 批次检索批量HOLD：按站点/机台或晶棒 + 出站时间检索批次，再一键批量扣留 */
const BatchHoldSearchModal: React.FC<BatchHoldSearchModalProps> = ({ isOpen, onClose, onConfirmed }) => {
  const [allBatches, setAllBatches] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<BatchScopeFilterValue>(emptyScopeFilterValue);
  const [hasSearched, setHasSearched] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);

  // 每次打开重新拉取批次并重置检索态，避免沿用上一次的条件与结果
  useEffect(() => {
    if (!isOpen) return;
    setScope(emptyScopeFilterValue);
    setHasSearched(false);
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await batchApiService.listBatches();
        if (!cancelled) setAllBatches(data);
      } catch (error) {
        alert(`加载批次数据失败：${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isOpen]);

  const searchResults = useMemo(
    () => (hasSearched ? filterBatchesByScope(allBatches, scope) : []),
    [allBatches, hasSearched, scope]
  );

  const handleExport = () => {
    const csv = buildCsvContent(searchResults, [
      { key: 'batchCode', label: '批次编码' },
      { key: 'equipmentName', label: '机台' },
      { key: 'ingotId', label: '晶棒ID' },
      { key: 'station', label: '站点' },
      { key: 'totalQty', label: '数量' },
      { key: 'status', label: '状态' },
      { key: 'lastOutstationAt', label: '出站时间' },
    ]);
    downloadCsv(`批次检索结果_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const handleHoldConfirmed = async () => {
    setIsHoldModalOpen(false);
    setHasSearched(false);
    onConfirmed();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">批次检索批量扣留</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700" aria-label="关闭">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 检索条件区 */}
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-400">加载批次数据中...</p>
            ) : (
              <>
                <BatchScopeFilter batches={allBatches} value={scope} onChange={setScope} />
                <div className="flex justify-end">
                  <button
                    onClick={() => setHasSearched(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    检索
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 检索结果区 */}
          {hasSearched && (
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">检索结果（{searchResults.length}）</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    disabled={searchResults.length === 0}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border ${
                      searchResults.length > 0
                        ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        : 'border-gray-200 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    导出清单
                  </button>
                  <button
                    onClick={() => setIsHoldModalOpen(true)}
                    disabled={searchResults.length === 0}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                      searchResults.length > 0
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    一键批量HOLD（{searchResults.length}）
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[340px] overflow-y-auto border border-gray-100 rounded">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">批次编码</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">机台</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">晶棒ID</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">站点</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase border-b">数量</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase border-b">状态</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">出站时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {searchResults.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">无匹配批次</td>
                      </tr>
                    ) : (
                      searchResults.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2.5 font-medium text-gray-900">
                            {b.batchCode}
                            {b.isHold && (
                              <span className="ml-1.5 inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-100 text-red-700">HOLD</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-gray-700">{b.equipmentName}（{b.equipmentCode}）</td>
                          <td className="px-3 py-2.5 text-gray-700">{b.ingotId}</td>
                          <td className="px-3 py-2.5 text-gray-700">{b.stationName}</td>
                          <td className="px-3 py-2.5 text-center text-gray-700">{b.totalQty}</td>
                          <td className="px-3 py-2.5 text-center text-gray-700">
                            {/* 简化判断：MES 无法感知 ERP 真实发货/成品库状态，此处用"已出站"近似表示"已入库"，非真实成品库集成 */}
                            {b.status === '已出站' ? '已入库' : b.status}
                          </td>
                          <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                            {b.lastOutstationAt ? new Date(b.lastOutstationAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 py-3 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
            关闭
          </button>
        </div>
      </div>

      <BatchHoldModal
        isOpen={isHoldModalOpen}
        batchIds={searchResults.map(b => b.id)}
        onClose={() => setIsHoldModalOpen(false)}
        onConfirmed={handleHoldConfirmed}
      />
    </div>
  );
};

export default BatchHoldSearchModal;
