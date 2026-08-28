import { describe, it, expect } from 'vitest';
import { workOrderService } from './workOrderService';
import { mockWorkOrders } from '../data/mockData';

describe('workOrderService', () => {
  it('listWorkOrders returns the seed work orders initially', () => {
    const list = workOrderService.listWorkOrders();
    expect(list.length).toBeGreaterThanOrEqual(mockWorkOrders.length);
  });

  it('createWorkOrder appends a new work order that shows up in listWorkOrders', () => {
    const id = workOrderService.generateId();
    const created = workOrderService.createWorkOrder(
      {
        name: 'SPC自动Hold测试工单',
        batchNumber: '3个批次（详见Hold记录）',
        equipment: 'EQ999',
        productModel: 'TEST-MODEL',
        exceptionType: 'SPC OOS/OOC',
        description: '自动触发',
        submitter: 'SPC自动触发系统',
      },
      id
    );

    expect(created.id).toBe(id);
    expect(created.status).toBe('processing');
    expect(created.currentAssignee).toBeNull();
    expect(created.stages).toEqual([]);

    const list = workOrderService.listWorkOrders();
    expect(list.find(w => w.id === id)).toBeTruthy();
  });

  it('generateId returns unique ids across calls', () => {
    const a = workOrderService.generateId();
    const b = workOrderService.generateId();
    expect(a).not.toBe(b);
  });
});
