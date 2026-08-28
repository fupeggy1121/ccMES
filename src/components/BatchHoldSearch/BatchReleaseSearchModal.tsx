import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { batchApiService } from '../BatchOperations/services/batchApiService';
import { BatchData } from '../BatchOperations/types';
import BatchReleaseModal from '../BatchOperations/components/BatchReleaseModal';
import { batchHoldService } from '../../services/batchHold/batchHoldService';
import BatchScopeFilter, {
  BatchScopeFilterValue,
  emptyScopeFilterValue,
  filterBatchesByScope,
} from './BatchScopeFilter';

interface BatchReleaseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 释放成功后回调，调用方负责刷新批次列表 */
  onConfirmed: () => void;
}

/** 批次检索批量解锁：在已Hold批次范围内按站点/机台或晶棒 + 产品条件检索，勾选后批量释放 */
const BatchReleaseSearchModal: React.FC<BatchReleaseSearchModalProps> = ({ isOpen, onClose, onConfirmed }) => {
  const [allBatches, setAllBatches] = useState<BatchData[]>([]);
  const [heldBatchIds, setHeldBatchIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [scope, setScope] = useState<BatchScopeFilterValue>(emptyScopeFilterValue);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [productCodeFilter, setProductCodeFilter] = useState('');

  const [checkedBatchIds, setCheckedBatchIds] = useState<string[]>([]);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);

  // 每次打开重新拉取数据并重置检索态
  useEffect(() => {
    if (!isOpen) return;
    setScope(emptyScopeFilterValue);
    setCategoryFilter('');
    setCustomerFilter('');
    setProductCodeFilter('');
    setCheckedBatchIds([]);
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [data, activeRecords] = await Promise.all([
          batchApiService.listBatches(),
          batchHoldService.listActiveHoldRecords(),
        ]);
        if (cancelled) return;
        setAllBatches(data);
        setHeldBatchIds(Array.from(new Set(activeRecords.map(r => r.batchId))));
      } catch (error) {
        alert(`加载批次数据失败：${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isOpen]);

  const heldBatches = useMemo(
    () => allBatches.filter(b => heldBatchIds.includes(b.id)),
    [allBatches, heldBatchIds]
  );

  const categoryOptions = useMemo(
    () => Array.from(new Set(heldBatches.map(b => b.productCategory).filter(Boolean))) as string[],
    [heldBatches]
  );
  const customerOptions = useMemo(
    () => Array.from(new Set(heldBatches.map(b => b.customerName).filter(Boolean))) as string[],
    [heldBatches]
  );

  const filteredHeldBatches = useMemo(
    () =>
      filterBatchesByScope(heldBatches, scope).filter(b => {
        if (categoryFilter && b.productCategory !== categoryFilter) return false;
        if (customerFilter && b.customerName !== customerFilter) return false;
        if (productCodeFilter && !b.productCode.toLowerCase().includes(productCodeFilter.toLowerCase())) return false;
        return true;
      }),
    [heldBatches, scope, categoryFilter, customerFilter, productCodeFilter]
  );

  const toggleChecked = (batchId: string) => {
    setCheckedBatchIds(prev =>
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    );
  };

  const allVisibleChecked =
    filteredHeldBatches.length > 0 && filteredHeldBatches.every(b => checkedBatchIds.includes(b.id));

  const toggleCheckAllVisible = () => {
    const visibleIds = filteredHeldBatches.map(b => b.id);
    setCheckedBatchIds(prev =>
      allVisibleChecked
        ? prev.filter(id => !visibleIds.includes(id))
        : Array.from(new Set([...prev, ...visibleIds]))
    );
  };

  const handleReleaseConfirmed = async () => {
    setIsReleaseModalOpen(false);
    setCheckedBatchIds([]);
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
          <h2 className="text-lg font-semibold text-gray-800">批次检索批量释放</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700" aria-label="关闭">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <p className="text-sm text-gray-400">加载批次数据中...</p>
          ) : (
            <>
              {/* 检索条件区：机台/晶棒 + 出站时间，叠加产品维度条件。
                  下拉选项取全量批次（与批量扣留弹窗一致），避免"当前无已Hold批次"时选项为空；
                  下方结果表格再按已Hold范围过滤。 */}
              <div className="space-y-3">
                <BatchScopeFilter batches={allBatches} value={scope} onChange={setScope} />
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">产品分类</label>
                    <select
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                      className="w-full h-[38px] border border-gray-300 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">全部产品分类</option>
                      {categoryOptions.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">客户</label>
                    <select
                      value={customerFilter}
                      onChange={e => setCustomerFilter(e.target.value)}
                      className="w-full h-[38px] border border-gray-300 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">全部客户</option>
                      {customerOptions.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">料号</label>
                    <input
                      type="text"
                      value={productCodeFilter}
                      onChange={e => setProductCodeFilter(e.target.value)}
                      placeholder="按料号搜索"
                      className="w-full h-[38px] border border-gray-300 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 已Hold批次列表 */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    符合条件的已Hold批次（{filteredHeldBatches.length} / 共 {heldBatches.length}）
                  </h3>
                  <button
                    onClick={() => setIsReleaseModalOpen(true)}
                    disabled={checkedBatchIds.length === 0}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                      checkedBatchIds.length > 0
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    批量释放（{checkedBatchIds.length}）
                  </button>
                </div>
                <div className="overflow-x-auto max-h-[340px] overflow-y-auto border border-gray-100 rounded">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 bg-gray-50 border-b w-8">
                          <input
                            type="checkbox"
                            checked={allVisibleChecked}
                            onChange={toggleCheckAllVisible}
                            disabled={filteredHeldBatches.length === 0}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            aria-label="全选当前结果"
                          />
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">批次编码</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">料号</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">产品分类</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">客户</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">站点</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">机台</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">晶棒ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredHeldBatches.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">当前没有符合条件的Hold批次</td>
                        </tr>
                      ) : (
                        filteredHeldBatches.map(b => (
                          <tr key={b.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={checkedBatchIds.includes(b.id)}
                                onChange={() => toggleChecked(b.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-3 py-2.5 font-medium text-gray-900">{b.batchCode}</td>
                            <td className="px-3 py-2.5 text-gray-700">{b.productCode}</td>
                            <td className="px-3 py-2.5 text-gray-700">{b.productCategory || '—'}</td>
                            <td className="px-3 py-2.5 text-gray-700">{b.customerName || '—'}</td>
                            <td className="px-3 py-2.5 text-gray-700">{b.stationName}</td>
                            <td className="px-3 py-2.5 text-gray-700">{b.equipmentCode || '—'}</td>
                            <td className="px-3 py-2.5 text-gray-700">{b.ingotId || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end px-6 py-3 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
            关闭
          </button>
        </div>
      </div>

      <BatchReleaseModal
        isOpen={isReleaseModalOpen}
        batchIds={checkedBatchIds}
        onClose={() => setIsReleaseModalOpen(false)}
        onConfirmed={handleReleaseConfirmed}
      />
    </div>
  );
};

export default BatchReleaseSearchModal;
