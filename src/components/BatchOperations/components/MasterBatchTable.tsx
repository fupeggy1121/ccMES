// src/components/MasterBatchTable.tsx
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from 'lucide-react';
import { BatchData } from '../types';

interface MasterBatchTableProps {
  filteredBatchList: BatchData[];
  selectedMasterBatchId: string | null;
  handleMasterRowClick: (batchId: string) => void;
  getStatusColor: (status: string) => string;
  showStatusColumn?: boolean;
  showDefectDisposalColumn?: boolean;
}

type SortDir = 'asc' | 'desc' | null;
type SortField = keyof Pick<BatchData, 'batchCode' | 'productCode' | 'productName' | 'totalQty' | 'goodQty' | 'defectQty' | 'status' | 'stationName'>;

interface ColFilter {
  batchCode: string;
  productCode: string;
  productName: string;
  status: string;
  stationName: string;
}

const INIT_FILTERS: ColFilter = { batchCode: '', productCode: '', productName: '', status: '', stationName: '' };

const MasterBatchTable: React.FC<MasterBatchTableProps> = ({
  filteredBatchList,
  selectedMasterBatchId,
  handleMasterRowClick,
  getStatusColor,
  showStatusColumn = true,
  showDefectDisposalColumn = false,
}) => {
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
              {showStatusColumn && <Th field="status" label="状态" align="center" filterEl={<StatusFilter />} />}
              <Th field="stationName" label="站点" filterEl={<FilterInput col="stationName" placeholder="搜索站点" />} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {processedList.length === 0 ? (
              <tr>
                <td colSpan={showStatusColumn ? (showDefectDisposalColumn ? 10 : 9) : (showDefectDisposalColumn ? 9 : 8)} className="px-4 py-8 text-center text-gray-400 text-sm">
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
                  <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">{batch.batchCode}</td>
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
