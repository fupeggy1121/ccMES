import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Select } from 'antd';
import { SAMPLING_RULE_OPTIONS } from '../constants/samplingRules';

const { Option } = Select;

export interface CommonStationOption {
  key: string;
  name: string;
}

interface BatchSamplingRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (stationKey: string, samplingRule: string) => Promise<void> | void;
  stations: CommonStationOption[];
  loading?: boolean;
}

const BatchSamplingRuleModal: React.FC<BatchSamplingRuleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  stations,
  loading = false,
}) => {
  const [stationKey, setStationKey] = useState<string>('');
  const [samplingRule, setSamplingRule] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setStationKey('');
      setSamplingRule('');
      return;
    }

    if (stations.length > 0) {
      setStationKey(prev => prev || stations[0].key);
    }
  }, [isOpen, stations]);

  const stationOptions = useMemo(
    () => stations.map(station => ({ label: station.name, value: station.key })),
    [stations]
  );

  const handleConfirm = async () => {
    if (!stationKey) {
      window.alert('请选择站点');
      return;
    }

    if (!samplingRule) {
      window.alert('请选择抽检规则');
      return;
    }

    await onConfirm(stationKey, samplingRule);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl m-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">编辑抽检规则</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" disabled={loading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">站点</label>
            <Select
              placeholder="请选择站点"
              value={stationKey || undefined}
              onChange={(value: string) => setStationKey(value)}
              style={{ width: '100%' }}
              options={stationOptions}
              disabled={loading || stationOptions.length === 0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">抽检规则</label>
            <Select
              placeholder="请选择抽检规则"
              value={samplingRule || undefined}
              onChange={(value: string) => setSamplingRule(value)}
              style={{ width: '100%' }}
              disabled={loading}
            >
              {SAMPLING_RULE_OPTIONS.map(rule => (
                <Option key={rule.value} value={rule.value}>
                  {rule.label}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || stationOptions.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '保存中...' : '确定'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchSamplingRuleModal;
