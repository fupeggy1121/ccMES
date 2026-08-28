import { useCallback, useEffect, useState } from 'react';
import { ruleStorage } from '../services/holdRule/ruleStorage';
import { AutoHoldRule } from '../services/holdRule/types';

/** 供批次扣留节点配置下拉框使用：只读取已启用的扣留规则列表。
 *  规则本身的增删改在"扣留规则"管理页（HoldRuleManagement）完成。 */
export const useHoldRules = () => {
  const [rules, setRules] = useState<AutoHoldRule[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRules = useCallback(() => {
    setLoading(true);
    try {
      setRules(ruleStorage.getRules().filter(r => r.enabled));
    } catch (error) {
      console.error('加载扣留规则失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  return { rules, loading, loadRules };
};
