import React, { useEffect, useMemo, useState } from 'react';
import { batchApiService } from '../BatchOperations/services/batchApiService';
import { BatchData } from '../BatchOperations/types';
import { buildCsvContent, downloadCsv } from '../BatchOperations/utils/csvExport';
import BatchHoldModal from '../BatchOperations/components/BatchHoldModal';
import BatchReleaseModal from '../BatchOperations/components/BatchReleaseModal';
import { batchHoldService } from '../../services/batchHold/batchHoldService';

const BatchHoldSearchModule: React.FC = () => {
  const [allBatches, setAllBatches] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(true);

  // 检索条件
  const [selectedEquipmentCodes, setSelectedEquipmentCodes] = useState<string[]>([]);
  const [selectedIngotIds, setSelectedIngotIds] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);

  // 批量解锁区块的状态
  const [heldBatchIds, setHeldBatchIds] = useState<string[]>([]);
  const [releaseCategoryFilter, setReleaseCategoryFilter] = useState('');
  const [releaseCustomerFilter, setReleaseCustomerFilter] = useState('');
  const [releaseProductCodeFilter, setReleaseProductCodeFilter] = useState('');
  const [checkedReleaseBatchIds, setCheckedReleaseBatchIds] = useState<string[]>([]);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await batchApiService.listBatches();
      setAllBatches(data);
      const activeRecords = await batchHoldService.listActiveHoldRecords();
      setHeldBatchIds(Array.from(new Set(activeRecords.map(r => r.batchId))));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const equipmentOptions = useMemo(
    () => Array.from(new Set(allBatches.map(b => b.equipmentCode).filter(Boolean))).sort(),
    [allBatches]
  );
  const ingotOptions = useMemo(
    () => Array.from(new Set(allBatches.map(b => b.ingotId).filter(Boolean))).sort(),
    [allBatches]
  );

  const searchResults = useMemo(() => {
    if (!hasSearched) return [];
    return allBatches.filter(b => {
      if (selectedEquipmentCodes.length > 0 && !selectedEquipmentCodes.includes(b.equipmentCode)) return false;
      if (selectedIngotIds.length > 0 && !selectedIngotIds.includes(b.ingotId)) return false;
      if (!b.lastOutstationAt) return false;
      const t = new Date(b.lastOutstationAt).getTime();
      if (startTime && t < new Date(startTime).getTime()) return false;
      if (endTime && t > new Date(endTime).getTime()) return false;
      return true;
    });
  }, [allBatches, hasSearched, selectedEquipmentCodes, selectedIngotIds, startTime, endTime]);

  const heldBatches = useMemo(
    () => allBatches.filter(b => heldBatchIds.includes(b.id)),
    [allBatches, heldBatchIds]
  );

  const releaseCategoryOptions = useMemo(
    () => Array.from(new Set(heldBatches.map(b => b.productCategory).filter(Boolean))) as string[],
    [heldBatches]
  );
  const releaseCustomerOptions = useMemo(
    () => Array.from(new Set(heldBatches.map(b => b.customerName).filter(Boolean))) as string[],
    [heldBatches]
  );

  const filteredHeldBatches = useMemo(() => {
    return heldBatches.filter(b => {
      if (releaseCategoryFilter && b.productCategory !== releaseCategoryFilter) return false;
      if (releaseCustomerFilter && b.customerName !== releaseCustomerFilter) return false;
      if (releaseProductCodeFilter && !b.productCode.toLowerCase().includes(releaseProductCodeFilter.toLowerCase())) return false;
      return true;
    });
  }, [heldBatches, releaseCategoryFilter, releaseCustomerFilter, releaseProductCodeFilter]);

  const toggleReleaseBatchChecked = (batchId: string) => {
    setCheckedReleaseBatchIds(prev =>
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    );
  };

  const handleReleaseConfirmed = async () => {
    setIsReleaseModalOpen(false);
    setCheckedReleaseBatchIds([]);
    await loadBatches();
  };

  const handleSearch = () => setHasSearched(true);

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
    await loadBatches();
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-xl font-semibold text-gray-800">批次检索批量HOLD/解锁</h1>

        {/* 检索区 */}
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          <h2 className="text-sm font-medium text-gray-700">按机台 / 晶棒 + 出站时间范围检索</h2>
          {loading ? (
            <p className="text-sm text-gray-400">加载批次数据中...</p>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">机台（可多选）</label>
                <select
                  multiple
                  value={selectedEquipmentCodes}
                  onChange={e =>
                    setSelectedEquipmentCodes(Array.from(e.target.selectedOptions).map(o => o.value))
                  }
                  className="w-full h-28 border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  {equipmentOptions.map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">晶棒ID（可多选）</label>
                <select
                  multiple
                  value={selectedIngotIds}
                  onChange={e => setSelectedIngotIds(Array.from(e.target.selectedOptions).map(o => o.value))}
                  className="w-full h-28 border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  {ingotOptions.map(id => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">出站时间从</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
                <label className="block text-xs font-medium text-gray-500 mb-1 mt-2">出站时间到</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  检索
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 检索结果区 */}
        {hasSearched && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700">
                检索结果（{searchResults.length}）
              </h2>
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
            <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
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

        {/* 批量解锁区 */}
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
          <h2 className="text-sm font-medium text-gray-700">批量解锁（当前所有已Hold批次，共 {heldBatches.length}）</h2>
          <div className="grid grid-cols-4 gap-3">
            <select
              value={releaseCategoryFilter}
              onChange={e => setReleaseCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">全部产品分类</option>
              {releaseCategoryOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={releaseCustomerFilter}
              onChange={e => setReleaseCustomerFilter(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">全部客户</option>
              {releaseCustomerOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="text"
              value={releaseProductCodeFilter}
              onChange={e => setReleaseProductCodeFilter(e.target.value)}
              placeholder="按料号搜索"
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <button
              onClick={() => setIsReleaseModalOpen(true)}
              disabled={checkedReleaseBatchIds.length === 0}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                checkedReleaseBatchIds.length > 0
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              批量释放（{checkedReleaseBatchIds.length}）
            </button>
          </div>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-3 py-2 bg-gray-50 border-b w-8"></th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">批次编码</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">料号</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">产品分类</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">客户</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase border-b">站点</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredHeldBatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">当前没有符合条件的Hold批次</td>
                  </tr>
                ) : (
                  filteredHeldBatches.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={checkedReleaseBatchIds.includes(b.id)}
                          onChange={() => toggleReleaseBatchChecked(b.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-900">{b.batchCode}</td>
                      <td className="px-3 py-2.5 text-gray-700">{b.productCode}</td>
                      <td className="px-3 py-2.5 text-gray-700">{b.productCategory || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-700">{b.customerName || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-700">{b.stationName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <BatchHoldModal
        isOpen={isHoldModalOpen}
        batchIds={searchResults.map(b => b.id)}
        onClose={() => setIsHoldModalOpen(false)}
        onConfirmed={handleHoldConfirmed}
      />
      <BatchReleaseModal
        isOpen={isReleaseModalOpen}
        batchIds={checkedReleaseBatchIds}
        onClose={() => setIsReleaseModalOpen(false)}
        onConfirmed={handleReleaseConfirmed}
      />
    </div>
  );
};

export default BatchHoldSearchModule;
