// src/utils/statusHelpers.ts

/**
 * 根据状态获取对应的颜色类名
 */
export const getStatusColor = (status: string) => {
  switch (status) {
    case '待进站':
      return 'text-gray-600 bg-gray-100';
    case '加工中':
      return 'text-blue-600 bg-blue-100';
    case '待出站':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export type BatchRunState = '运行' | '闲置' | '扣留';

/**
 * 新增：根据批次的加工状态（status）和扣留标记（isHold）派生出"批次状态"
 * 已扣留 -> 扣留；未扣留且待进站 -> 闲置；其余（加工中/待出站）-> 运行
 */
export const deriveBatchRunState = (batch: { status: string; isHold: boolean }): BatchRunState => {
  if (batch.isHold) return '扣留';
  if (batch.status === '待进站') return '闲置';
  return '运行';
};

/**
 * 检查批次是否可以进行特定操作
 */
export const canPerformOperation = (
  batchStatus: string, 
  operation: string
): boolean => {
  const allowedOperations: Record<string, string[]> = {
    '待进站': ['instation', 'cancelEntry', 'transfer', 'merge', 'split'],
    '加工中': ['outstation', 'measurement', 'process', 'defect', 'carrierChange'],
    '待出站': ['outstation', 'measurement', 'process'],
  };
  
  return allowedOperations[batchStatus]?.includes(operation) || false;
};

/**
 * 获取操作按钮的禁用状态
 */
export const getOperationDisabledState = (
  batch: any, 
  operation: string
): { disabled: boolean; tooltip: string } => {
  const canOperate = canPerformOperation(batch.status, operation);
  
  if (!canOperate) {
    return {
      disabled: true,
      tooltip: `当前状态"${batch.status}"无法执行此操作`,
    };
  }
  
  if (batch.isHold && !['releaseHold', 'view'].includes(operation)) {
    return {
      disabled: true,
      tooltip: '批次已锁定，无法执行此操作',
    };
  }
  
  return {
    disabled: false,
    tooltip: '',
  };
};