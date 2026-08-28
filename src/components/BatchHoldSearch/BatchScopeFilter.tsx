import React, { useMemo } from 'react';
import { BatchData } from '../BatchOperations/types';
import MultiSelectInput from '../common/MultiSelectInput';

/** 检索方式：每次只能按加工机台或晶棒其中一种筛选 */
export type ScopeFilterMode = 'equipment' | 'ingot';

export interface BatchScopeFilterValue {
  mode: ScopeFilterMode;
  /** 站点单选，机台选项由站点级联得出（同一机台可能服务多个站点） */
  station: string;
  equipmentCodes: string[];
  ingotIds: string[];
  startTime: string;
  endTime: string;
}

export const emptyScopeFilterValue: BatchScopeFilterValue = {
  mode: 'equipment',
  station: '',
  equipmentCodes: [],
  ingotIds: [],
  startTime: '',
  endTime: '',
};

/** 按机台/晶棒 + 出站时间范围过滤批次 */
export const filterBatchesByScope = (
  batches: BatchData[],
  scope: BatchScopeFilterValue
): BatchData[] =>
  batches.filter(b => {
    if (scope.mode === 'equipment') {
      if (scope.station && b.stationName !== scope.station) return false;
      if (scope.equipmentCodes.length > 0 && !scope.equipmentCodes.includes(b.equipmentCode)) return false;
    } else if (scope.ingotIds.length > 0 && !scope.ingotIds.includes(b.ingotId)) {
      return false;
    }
    // 仅在填了时间范围时才要求批次有出站时间，否则未出站批次也应参与机台/晶棒检索
    if (scope.startTime || scope.endTime) {
      if (!b.lastOutstationAt) return false;
      const t = new Date(b.lastOutstationAt).getTime();
      if (scope.startTime && t < new Date(scope.startTime).getTime()) return false;
      if (scope.endTime && t > new Date(scope.endTime).getTime()) return false;
    }
    return true;
  });

interface BatchScopeFilterProps {
  batches: BatchData[];
  value: BatchScopeFilterValue;
  onChange: (next: BatchScopeFilterValue) => void;
}

/**
 * 批量扣留 / 批量释放弹窗共用的检索条件区：
 * 站点 → 机台级联多选，或晶棒多选，二选一，再叠加出站时间范围。
 */
const BatchScopeFilter: React.FC<BatchScopeFilterProps> = ({ batches, value, onChange }) => {
  const stationOptions = useMemo(
    () => Array.from(new Set(batches.map(b => b.stationName).filter(Boolean))).sort(),
    [batches]
  );

  // 机台选项按所选站点级联：同一机台可能同时服务多个站点，未选站点时不给选项
  const equipmentOptions = useMemo(() => {
    if (!value.station) return [];
    return Array.from(
      new Set(
        batches
          .filter(b => b.stationName === value.station)
          .map(b => b.equipmentCode)
          .filter(Boolean)
      )
    ).sort();
  }, [batches, value.station]);

  const ingotOptions = useMemo(
    () => Array.from(new Set(batches.map(b => b.ingotId).filter(Boolean))).sort(),
    [batches]
  );

  // 切换检索方式时清空另一侧条件，避免残留条件参与过滤
  const handleModeChange = (mode: ScopeFilterMode) => {
    if (mode === value.mode) return;
    onChange({ ...value, mode, station: '', equipmentCodes: [], ingotIds: [] });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium text-gray-500">筛选方式</span>
        {([['equipment', '按加工机台'], ['ingot', '按晶棒']] as const).map(([mode, label]) => (
          <label key={mode} className="inline-flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
            <input
              type="radio"
              checked={value.mode === mode}
              onChange={() => handleModeChange(mode)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            {label}
          </label>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {value.mode === 'equipment' ? (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">站点（单选）</label>
              <select
                value={value.station}
                onChange={e => onChange({ ...value, station: e.target.value, equipmentCodes: [] })}
                className="w-full h-[38px] border border-gray-300 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">请选择站点</option>
                {stationOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">加工机台（可多选）</label>
              <MultiSelectInput
                options={equipmentOptions}
                value={value.equipmentCodes}
                onChange={codes => onChange({ ...value, equipmentCodes: codes })}
                disabled={!value.station}
                placeholder="输入或选择机台编码"
                disabledHint="请先选择站点"
              />
            </div>
          </>
        ) : (
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">晶棒ID（可多选）</label>
            <MultiSelectInput
              options={ingotOptions}
              value={value.ingotIds}
              onChange={ids => onChange({ ...value, ingotIds: ids })}
              placeholder="输入或选择晶棒ID"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">出站时间从</label>
          <input
            type="datetime-local"
            value={value.startTime}
            onChange={e => onChange({ ...value, startTime: e.target.value })}
            className="w-full h-[38px] border border-gray-300 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">出站时间到</label>
          <input
            type="datetime-local"
            value={value.endTime}
            onChange={e => onChange({ ...value, endTime: e.target.value })}
            className="w-full h-[38px] border border-gray-300 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default BatchScopeFilter;
