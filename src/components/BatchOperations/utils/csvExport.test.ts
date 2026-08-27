import { describe, it, expect } from 'vitest';
import { buildCsvContent } from './csvExport';

describe('buildCsvContent', () => {
  it('builds a CSV string with header row and escaped values', () => {
    const rows = [
      { batchCode: 'BATCH001', equipmentName: 'AP01', qty: 100 },
      { batchCode: 'BATCH,002', equipmentName: 'AP02', qty: 50 },
    ];
    const csv = buildCsvContent(rows, [
      { key: 'batchCode', label: '批次编码' },
      { key: 'equipmentName', label: '机台' },
      { key: 'qty', label: '数量' },
    ]);

    const lines = csv.split('\n');
    expect(lines[0]).toBe('批次编码,机台,数量');
    expect(lines[1]).toBe('BATCH001,AP01,100');
    expect(lines[2]).toBe('"BATCH,002",AP02,50');
  });

  it('returns just the header row when rows is empty', () => {
    const csv = buildCsvContent([], [{ key: 'batchCode', label: '批次编码' }]);
    expect(csv).toBe('批次编码');
  });
});
