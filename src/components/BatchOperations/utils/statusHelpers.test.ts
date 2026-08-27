import { describe, it, expect } from 'vitest';
import { deriveBatchRunState } from './statusHelpers';

describe('deriveBatchRunState', () => {
  it('returns 扣留 when the batch is held, regardless of status', () => {
    expect(deriveBatchRunState({ status: '待进站', isHold: true })).toBe('扣留');
    expect(deriveBatchRunState({ status: '加工中', isHold: true })).toBe('扣留');
  });

  it('returns 闲置 for a non-held batch waiting to enter a station', () => {
    expect(deriveBatchRunState({ status: '待进站', isHold: false })).toBe('闲置');
  });

  it('returns 运行 for a non-held batch that is processing or waiting to exit', () => {
    expect(deriveBatchRunState({ status: '加工中', isHold: false })).toBe('运行');
    expect(deriveBatchRunState({ status: '待出站', isHold: false })).toBe('运行');
  });
});
