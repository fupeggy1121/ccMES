// src/components/ProductionPlan/IncomingMaterialParamsModal.tsx
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { X, Layers, Filter, ChevronDown, Check } from 'lucide-react';

// ─── 参数列定义 ──────────────────────────────────────────────────────────────
export interface ParamColumn {
  key: string;
  label: string;
  unit?: string;
  group: string;
}

export const ALL_PARAM_COLUMNS: ParamColumn[] = [
  // 基础几何
  { key: 'diameter',     label: '直径',          unit: 'mm',    group: '基础几何' },
  { key: 'thickness',    label: '厚度',           unit: 'μm',    group: '基础几何' },
  { key: 'ttv',          label: 'TTV',            unit: 'μm',    group: '基础几何' },
  { key: 'bow',          label: '弯曲度 Bow',     unit: 'μm',    group: '基础几何' },
  { key: 'warp',         label: '翘曲度 Warp',    unit: 'μm',    group: '基础几何' },
  { key: 'edgeChip',     label: '崩边宽度',       unit: 'μm',    group: '基础几何' },
  { key: 'chamferAngle', label: '倒角角度',        unit: '°',     group: '基础几何' },
  // 晶向
  { key: 'orientation',  label: '晶向',                          group: '晶向' },
  { key: 'offAngle',     label: '偏角',           unit: '°',     group: '晶向' },
  { key: 'offDirection', label: '偏角方向',                      group: '晶向' },
  { key: 'fwhm',         label: 'XRC FWHM',       unit: 'arcsec',group: '晶向' },
  // 电学
  { key: 'dopingType',   label: '掺杂类型',                      group: '电学' },
  { key: 'resistivity',  label: '电阻率',         unit: 'Ω·cm',  group: '电学' },
  { key: 'carrierConc',  label: '载流子浓度',     unit: 'cm⁻³',  group: '电学' },
  { key: 'mobility',     label: '迁移率',         unit: 'cm²/Vs',group: '电学' },
  { key: 'lifetime',     label: '载流子寿命',     unit: 'μs',    group: '电学' },
  // 晶体质量
  { key: 'etch_pit',     label: '蚀坑密度 EPD',   unit: 'cm⁻²',  group: '晶体质量' },
  { key: 'dislocation',  label: '位错密度',       unit: 'cm⁻²',  group: '晶体质量' },
  { key: 'sf_density',   label: '堆垛层错密度',   unit: 'cm⁻¹',  group: '晶体质量' },
  { key: 'micropipe',    label: '微管密度',       unit: 'cm⁻²',  group: '晶体质量' },
  // 表面
  { key: 'roughnessRa',  label: '粗糙度 Ra',      unit: 'nm',    group: '表面' },
  { key: 'roughnessRq',  label: '粗糙度 Rq',      unit: 'nm',    group: '表面' },
  { key: 'haze',         label: '雾度 Haze',      unit: 'ppm',   group: '表面' },
  { key: 'lls',          label: '光点缺陷 LLS',   unit: '个',    group: '表面' },
  { key: 'scratches',    label: '划伤数',          unit: '条',    group: '表面' },
  { key: 'particles',    label: '颗粒数 (≥0.2μm)', unit: '个',   group: '表面' },
  // 外延面 / 抛光面
  { key: 'epiSide',      label: '外延面',                        group: '外延/抛光' },
  { key: 'polishSide',   label: '抛光面',                        group: '外延/抛光' },
  { key: 'flatOrientation', label: '主平边方向',                 group: '外延/抛光' },
  // 其他
  { key: 'grade',        label: '等级',                          group: '其他' },
  { key: 'laserMark',    label: '激光标记 ID',                   group: '其他' },
  { key: 'substrateType',label: '衬底类型',                      group: '其他' },
  { key: 'certNo',       label: '检验证书编号',                  group: '其他' },
];

// 默认选中的参数列（常用项）
const DEFAULT_SELECTED_KEYS = ['offAngle', 'thickness', 'resistivity', 'warp', 'roughnessRa', 'orientation', 'grade'];

// ─── 来料参数接口 ─────────────────────────────────────────────────────────────
export interface SubstrateIncomingParams {
  waferCode: string;
  [key: string]: string | number;
}

interface IncomingMaterialParamsModalProps {
  title?: string;
  waferCodes: string[];
  onClose: () => void;
}

// ─── 确定性 mock 数据生成 ─────────────────────────────────────────────────────
function generateMockParams(code: string): SubstrateIncomingParams {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  }
  const rnd = (min: number, max: number, decimals: number): number => {
    const ratio = ((hash = (hash * 1664525 + 1013904223) >>> 0) % 10000) / 10000;
    return parseFloat((min + ratio * (max - min)).toFixed(decimals));
  };
  const pick = <T,>(arr: T[]): T => {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    return arr[hash % arr.length];
  };

  return {
    waferCode: code,
    // 基础几何
    diameter:      rnd(99.5, 100.5, 2),
    thickness:     rnd(350, 500, 1),
    ttv:           rnd(1, 10, 1),
    bow:           rnd(-30, 30, 1),
    warp:          rnd(5, 60, 1),
    edgeChip:      rnd(0, 50, 0),
    chamferAngle:  pick([22, 22.5, 45]),
    // 晶向
    orientation:   pick(['<0001>', '<11-20>', '<1-100>', '<100>', '<111>']),
    offAngle:      rnd(0.0, 8.0, 2),
    offDirection:  pick(['<11-20>', '<1-100>', '<010>']),
    fwhm:          rnd(10, 120, 1),
    // 电学
    dopingType:    pick(['N型', 'P型', '半绝缘']),
    resistivity:   rnd(0.01, 1.0, 3),
    carrierConc:   rnd(1e15, 1e17, 0),
    mobility:      rnd(200, 1000, 0),
    lifetime:      rnd(0.1, 10, 2),
    // 晶体质量
    etch_pit:      rnd(1e2, 1e4, 0),
    dislocation:   rnd(1e3, 1e5, 0),
    sf_density:    rnd(0, 50, 1),
    micropipe:     rnd(0, 5, 2),
    // 表面
    roughnessRa:   rnd(0.1, 2.0, 2),
    roughnessRq:   rnd(0.1, 3.0, 2),
    haze:          rnd(0.1, 5.0, 2),
    lls:           rnd(0, 30, 0),
    scratches:     rnd(0, 5, 0),
    particles:     rnd(0, 50, 0),
    // 外延/抛光
    epiSide:       pick(['正面', '背面', '双面']),
    polishSide:    pick(['单面抛光', '双面抛光']),
    flatOrientation: pick(['<11-20>', '<1-100>', '<010>']),
    // 其他
    grade:         pick(['Grade A', 'Grade B', 'Grade C']),
    laserMark:     `LM-${code.slice(-6)}`,
    substrateType: pick(['SiC', 'GaAs', 'GaN', 'Si']),
    certNo:        `CERT-${code.slice(0, 4)}-${(hash % 9000 + 1000)}`,
  };
}

// ─── 多选下拉筛选器组件 ───────────────────────────────────────────────────────
interface ParamFilterDropdownProps {
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
}

const ParamFilterDropdown: React.FC<ParamFilterDropdownProps> = ({ selectedKeys, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (key: string) => {
    onChange(
      selectedKeys.includes(key)
        ? selectedKeys.filter(k => k !== key)
        : [...selectedKeys, key]
    );
  };

  const toggleGroup = (group: string) => {
    const groupKeys = ALL_PARAM_COLUMNS.filter(c => c.group === group).map(c => c.key);
    const allSelected = groupKeys.every(k => selectedKeys.includes(k));
    if (allSelected) {
      onChange(selectedKeys.filter(k => !groupKeys.includes(k)));
    } else {
      const merged = Array.from(new Set([...selectedKeys, ...groupKeys]));
      onChange(merged);
    }
  };

  const groups = Array.from(new Set(ALL_PARAM_COLUMNS.map(c => c.group)));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Filter className="w-4 h-4 text-blue-500" />
        筛选参数项
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          {selectedKeys.length}/{ALL_PARAM_COLUMNS.length}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-[80] bg-white border border-gray-200 rounded-xl shadow-xl w-72 max-h-[60vh] overflow-y-auto">
          {/* 全选/全不选 */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-2 flex gap-3">
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => onChange(ALL_PARAM_COLUMNS.map(c => c.key))}
            >全选</button>
            <span className="text-gray-300">|</span>
            <button
              className="text-xs text-gray-500 hover:underline"
              onClick={() => onChange([])}
            >全不选</button>
            <span className="text-gray-300">|</span>
            <button
              className="text-xs text-gray-500 hover:underline"
              onClick={() => onChange(DEFAULT_SELECTED_KEYS)}
            >重置默认</button>
          </div>

          {/* 分组列表 */}
          {groups.map(group => {
            const cols = ALL_PARAM_COLUMNS.filter(c => c.group === group);
            const allSel = cols.every(c => selectedKeys.includes(c.key));
            const someSel = cols.some(c => selectedKeys.includes(c.key));
            return (
              <div key={group} className="border-b border-gray-50 last:border-0">
                {/* 组标题（可整组切换） */}
                <div
                  className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => toggleGroup(group)}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                    ${allSel ? 'bg-blue-600 border-blue-600' : someSel ? 'bg-blue-100 border-blue-400' : 'border-gray-300'}`}
                  >
                    {allSel && <Check className="w-3 h-3 text-white" />}
                    {!allSel && someSel && <span className="w-2 h-0.5 bg-blue-500 rounded" />}
                  </div>
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{group}</span>
                </div>
                {/* 每个参数项 */}
                {cols.map(col => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-4 py-1.5 pl-8 cursor-pointer hover:bg-blue-50 select-none"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                        ${selectedKeys.includes(col.key) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}
                      onClick={(e) => { e.preventDefault(); toggle(col.key); }}
                    >
                      {selectedKeys.includes(col.key) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-gray-700">{col.label}</span>
                    {col.unit && <span className="text-xs text-gray-400">({col.unit})</span>}
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── 主弹窗组件 ──────────────────────────────────────────────────────────────
export const IncomingMaterialParamsModal: React.FC<IncomingMaterialParamsModalProps> = ({
  title = '来料参数',
  waferCodes,
  onClose,
}) => {
  const [selectedParamKeys, setSelectedParamKeys] = useState<string[]>(DEFAULT_SELECTED_KEYS);

  const paramsList = useMemo(
    () => waferCodes.map(code => generateMockParams(code)),
    [waferCodes]
  );

  const visibleColumns = useMemo(
    () => ALL_PARAM_COLUMNS.filter(c => selectedParamKeys.includes(c.key)),
    [selectedParamKeys]
  );

  const renderCell = (row: SubstrateIncomingParams, col: ParamColumn) => {
    const val = row[col.key];
    if (val === undefined || val === null) return <span className="text-gray-300">—</span>;
    if (col.key === 'grade') {
      const color =
        val === 'Grade A' ? 'bg-green-100 text-green-800' :
        val === 'Grade B' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800';
      return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{String(val)}</span>;
    }
    // 大数字用科学计数法显示
    if (typeof val === 'number' && Math.abs(val) >= 10000) {
      return <span>{val.toExponential(2)}</span>;
    }
    return <span>{String(val)}</span>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[88vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              共 {paramsList.length} 片
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ParamFilterDropdown
              selectedKeys={selectedParamKeys}
              onChange={setSelectedParamKeys}
            />
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 提示条 */}
        {visibleColumns.length === 0 && (
          <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200 text-sm text-yellow-700">
            请通过右上角「筛选参数项」选择要显示的列。
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">序号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">衬底片编码</th>
                {visibleColumns.map(col => (
                  <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {col.label}{col.unit ? ` (${col.unit})` : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paramsList.length > 0 ? (
                paramsList.map((p, idx) => (
                  <tr key={p.waferCode} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{p.waferCode}</td>
                    {visibleColumns.map(col => (
                      <td key={col.key} className="px-4 py-3 whitespace-nowrap text-gray-900">
                        {renderCell(p, col)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="px-4 py-10 text-center text-gray-500">
                    暂无衬底片参数数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingMaterialParamsModal;
