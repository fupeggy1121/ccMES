// src/components/MasterBatchTable.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from 'lucide-react';
import { BatchData } from '../types';
import { BatchRunState, deriveBatchRunState } from '../utils/statusHelpers';

interface MasterBatchTableProps {
  filteredBatchList: BatchData[];
  selectedMasterBatchId: string | null;
  handleMasterRowClick: (batchId: string) => void;
  getStatusColor: (status: string) => string;
  showStatusColumn?: boolean;
  showDefectDisposalColumn?: boolean;
  /** 新增：批量Hold/Release用的批次勾选态，不传时不渲染勾选列 */
  checkedBatchIds?: string[];
  onToggleBatchChecked?: (batchId: string) => void;
  onToggleAllChecked?: (visibleIds: string[]) => void;
  /** 新增：当前（列过滤+排序后）实际可见的批次id集合发生变化时回调，供上层与勾选态做交集收敛 */
  onVisibleIdsChange?: (visibleIds: string[]) => void;
}

type SortDir = 'asc' | 'desc' | null;
type SortField = keyof Pick<BatchData, 'batchCode' | 'productCode' | 'productName' | 'totalQty' | 'goodQty' | 'defectQty' | 'status' | 'stationName'>;

interface ColFilter {
  batchCode: string;
  productCode: string;
  productName: string;
  status: string;
  /** 新增：批次状态（运行/闲置/扣留）列内筛选，空字符串表示不筛选 */
  batchState: string;
  stationName: string;
}

const INIT_FILTERS: ColFilter = { batchCode: '', productCode: '', productName: '', status: '', batchState: '', stationName: '' };
const BATCH_STATE_OPTS: BatchRunState[] = ['运行', '闲置', '扣留'];

const MasterBatchTable: React.FC<MasterBatchTableProps> = ({
  filteredBatchList,
  selectedMasterBatchId,
  handleMasterRowClick,
  getStatusColor,
  showStatusColumn = true,
  showDefectDisposalColumn = false,
  checkedBatchIds,
  onToggleBatchChecked,
  onToggleAllChecked,
  onVisibleIdsChange,
}) => {
  const showCheckboxColumn = typeof onToggleBatchChecked === 'function';

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [filters, setFilters] = useState<ColFilter>(INIT_FILTERS);
  const [openFilter, setOpenFilter] = useState<keyof ColFilter | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortDir(null); setSortField(null); }
      else setSortDir('asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const setFilter = (col: keyof ColFilter, val: string) =>
    setFilters(prev => ({ ...prev, [col]: val }));
  const clearFilter = (col: keyof ColFilter) => {
    setFilters(prev => ({ ...prev, [col]: '' }));
    setOpenFilter(null);
  };
  const hasActiveFilter = Object.values(filters).some(v => v !== '');

  const processedList = useMemo(() => {
    let list = filteredBatchList.filter(b =>
      (b.batchCode || '').toLowerCase().includes(filters.batchCode.toLowerCase()) &&
      (b.productCode || '').toLowerCase().includes(filters.productCode.toLowerCase()) &&
      (b.productName || '').toLowerCase().includes(filters.productName.toLowerCase()) &&
      (b.status || '').toLowerCase().includes(filters.status.toLowerCase()) &&
      (filters.batchState === '' || deriveBatchRunState(b) === filters.batchState) &&
      (b.stationName || '').toLowerCase().includes(filters.stationName.toLowerCase())
    );
    if (sortField && sortDir) {
      list = [...list].sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        if (typeof av === 'number' && typeof bv === 'number')
          return sortDir === 'asc' ? av - bv : bv - av;
        return sortDir === 'asc'
          ? String(av ?? '').localeCompare(String(bv ?? ''))
          : String(bv ?? '').localeCompare(String(av ?? ''));
      });
    }
    return list;
  }, [filteredBatchList, filters, sortField, sortDir]);

  // 新增：只有"待进站"（闲置）批次才允许被勾选扣留，全选/全选态判断也只看这部分
  const eligibleForHoldIds = useMemo(
    () => processedList.filter(b => b.status === '待进站').map(b => b.id),
    [processedList]
  );
  const allChecked =
    showCheckboxColumn && eligibleForHoldIds.length > 0 && eligibleForHoldIds.every(id => checkedBatchIds?.includes(id));

  useEffect(() => {
    onVisibleIdsChange?.(processedList.map(b => b.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedList]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ChevronsUpDown className="w-3 h-3 ml-0.5 text-gray-400 inline-block flex-shrink-0" />;
    if (sortDir === 'asc')
      return <ChevronUp className="w-3 h-3 ml-0.5 text-blue-500 inline-block flex-shrink-0" />;
    return <ChevronDown className="w-3 h-3 ml-0.5 text-blue-500 inline-block flex-shrink-0" />;
  };

  const FilterInput = ({ col, placeholder }: { col: keyof ColFilter; placeholder: string }) => (
    <span className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpenFilter(openFilter === col ? null : col)}
        className={`p-0.5 rounded hover:bg-gray-200 align-middle ${filters[col] ? 'text-blue-500' : 'text-gray-400'}`}
      >
        <Search className="w-3 h-3" />
      </button>
      {openFilter === col && (
        <div className="absolute z-30 top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 min-w-[160px]">
          <div className="flex items-center gap-1">
            <input
              autoFocus
              type="text"
              value={filters[col]}
              onChange={e => setFilter(col, e.target.value)}
              placeholder={placeholder}
              className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            {filters[col] && (
              <button onClick={() => clearFilter(col)} className="text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </span>
  );

  const statusOpts = useMemo(
    () => Array.from(new Set(filteredBatchList.map(b => b.status).filter(Boolean))).sort(),
    [filteredBatchList]
  );

  const StatusFilter = () => (
    <span className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
        className={`p-0.5 rounded hover:bg-gray-200 align-middle ${filters.status ? 'text-blue-500' : 'text-gray-400'}`}
      >
        <Search className="w-3 h-3" />
      </button>
      {openFilter === 'status' && (
        <div className="absolute z-30 top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 min-w-[120px]">
          {(['', ...statusOpts] as string[]).map(s => (
            <button
              key={s || '__all__'}
              onClick={() => { setFilter('status', s); setOpenFilter(null); }}
              className={`w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-100 ${filters.status === s ? 'text-blue-600 font-semibold' : ''}`}
            >
              {s || '全部'}
            </button>
          ))}
        </div>
      )}
    </span>
  );

  // 新增：批次状态（运行/闲置/扣留）列内筛选下拉，交互复用 StatusFilter 的模式，选项固定
  const BatchStateFilter = () => (
    <span className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpenFilter(openFilter === 'batchState' ? null : 'batchState')}
        className={`p-0.5 rounded hover:bg-gray-200 align-middle ${filters.batchState ? 'text-blue-500' : 'text-gray-400'}`}
      >
        <Search className="w-3 h-3" />
      </button>
      {openFilter === 'batchState' && (
        <div className="absolute z-30 top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 min-w-[120px]">
          {(['', ...BATCH_STATE_OPTS] as string[]).map(s => (
            <button
              key={s || '__all__'}
              onClick={() => { setFilter('batchState', s); setOpenFilter(null); }}
              className={`w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-100 ${filters.batchState === s ? 'text-blue-600 font-semibold' : ''}`}
            >
              {s || '全部'}
            </button>
          ))}
        </div>
      )}
    </span>
  );

  // 新增："批次状态"徽标颜色：运行=蓝，闲置=灰，扣留=红（与 HOLD 徽标一致）
  const batchStateBadgeClass: Record<BatchRunState, string> = {
    运行: 'text-blue-600 bg-blue-100',
    闲置: 'text-gray-600 bg-gray-100',
    扣留: 'text-red-700 bg-red-100',
  };

  interface ThProps {
    field: SortField;
    label: string;
    align?: 'left' | 'center';
    filterEl?: React.ReactNode;
  }
  const Th = ({ field, label, align = 'left', filterEl }: ThProps) => (
    <th
      className={`px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b select-none ${align === 'center' ? 'text-center' : 'text-left'}`}
    >
      <span className={`inline-flex items-center gap-0.5 ${align === 'center' ? 'justify-center w-full' : ''}`}>
        <button
          onClick={() => handleSort(field)}
          className="inline-flex items-center hover:text-gray-800 whitespace-nowrap"
        >
          {label}
          <SortIcon field={field} />
        </button>
        {filterEl}
      </span>
    </th>
  );

  // 新增：不可排序、仅带筛选的表头单元格（"批次状态"是派生字段，不参与现有 SortField 排序）
  interface ThFilterOnlyProps {
    label: string;
    align?: 'left' | 'center';
    filterEl?: React.ReactNode;
  }
  const ThFilterOnly = ({ label, align = 'left', filterEl }: ThFilterOnlyProps) => (
    <th
      className={`px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b select-none ${align === 'center' ? 'text-center' : 'text-left'}`}
    >
      <span className={`inline-flex items-center gap-0.5 ${align === 'center' ? 'justify-center w-full' : ''}`}>
        <span className="whitespace-nowrap">{label}</span>
        {filterEl}
      </span>
    </th>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm" onClick={() => setOpenFilter(null)}>
      <div className="px-4 py-2.5 border-b flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-700">
          主批次列表
          <span className="ml-1.5 text-gray-400 font-normal text-xs">
            ({processedList.length}/{filteredBatchList.length})
          </span>
        </h2>
        {hasActiveFilter && (
          <button
            onClick={() => setFilters(INIT_FILTERS)}
            className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            清除筛选
          </button>
        )}
      </div>
      <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              {showCheckboxColumn && (
                <th className="px-3 py-2 bg-gray-50 border-b w-8 text-center">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={() => onToggleAllChecked?.(eligibleForHoldIds)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    aria-label="全选"
                  />
                </th>
              )}
              <Th field="batchCode" label="批次编码" filterEl={<FilterInput col="batchCode" placeholder="搜索批次" />} />
              <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b">台账号</th>
              <Th field="productCode" label="产品料号" filterEl={<FilterInput col="productCode" placeholder="搜索料号" />} />
              <Th field="productName" label="产品名称" filterEl={<FilterInput col="productName" placeholder="搜索名称" />} />
              <Th field="totalQty" label="总片数" align="center" />
              <Th field="goodQty" label="良品" align="center" />
              <Th field="defectQty" label="不良" align="center" />
              {showDefectDisposalColumn && (
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b text-center">不良处置</th>
              )}
              {showStatusColumn && (
                <ThFilterOnly label="批次状态" align="center" filterEl={<BatchStateFilter />} />
              )}
              {showStatusColumn && <Th field="status" label="加工状态" align="center" filterEl={<StatusFilter />} />}
              <Th field="stationName" label="站点" filterEl={<FilterInput col="stationName" placeholder="搜索站点" />} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {processedList.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    (showCheckboxColumn ? 1 : 0) +
                    (showStatusColumn ? (showDefectDisposalColumn ? 11 : 10) : (showDefectDisposalColumn ? 9 : 8))
                  }
                  className="px-4 py-8 text-center text-gray-400 text-sm"
                >
                  无匹配批次
                </td>
              </tr>
            ) : (
              processedList.map(batch => (
                <tr
                  key={batch.id}
                  className={`cursor-pointer transition-colors ${
                    selectedMasterBatchId === batch.id
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleMasterRowClick(batch.id)}
                >
                  {showCheckboxColumn && (
                    <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checkedBatchIds?.includes(batch.id) ?? false}
                        onChange={() => onToggleBatchChecked?.(batch.id)}
                        // 新增：扣留操作只能对"待进站"（闲置）批次执行，非待进站批次不可勾选
                        disabled={batch.status !== '待进站'}
                        title={batch.status !== '待进站' ? '仅"待进站"（闲置）批次可勾选扣留' : undefined}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                    </td>
                  )}
                  <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">
                    {batch.batchCode}
                    {batch.isHold && (
                      <span className="ml-1.5 inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-100 text-red-700">
                        HOLD
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap font-mono text-xs">{batch.ledgerCode || '—'}</td>
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{batch.productCode}</td>
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{batch.productName}</td>
                  <td className="px-3 py-2.5 text-center text-gray-700">{batch.totalQty}</td>
                  <td className="px-3 py-2.5 text-center text-green-600 font-medium">{batch.goodQty}</td>
                  <td className="px-3 py-2.5 text-center text-red-500 font-medium">{batch.defectQty}</td>
                  {showDefectDisposalColumn && (
                    <td className="px-3 py-2.5 text-center">
                      {batch.defectDisposal ? (
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          batch.defectDisposal === '返工' ? 'bg-blue-100 text-blue-700' :
                          batch.defectDisposal === '报废' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {batch.defectDisposal}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  )}
                  {showStatusColumn && (
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${batchStateBadgeClass[deriveBatchRunState(batch)]}`}
                      >
                        {deriveBatchRunState(batch)}
                      </span>
                    </td>
                  )}
                  {showStatusColumn && (
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(batch.status)}`}
                      >
                        {batch.status}
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{batch.stationName}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterBatchTable;
