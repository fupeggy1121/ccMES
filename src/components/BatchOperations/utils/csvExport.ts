interface CsvColumn<T> {
  key: keyof T;
  label: string;
}

/** 将字段值转为 CSV 安全的字符串：含逗号/引号/换行时用双引号包裹并转义内部引号 */
function escapeCsvValue(value: unknown): string {
  const str = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** 根据行数据和列定义生成 CSV 文本内容（含表头，不含 BOM） */
export function buildCsvContent<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map(c => escapeCsvValue(c.label)).join(',');
  const lines = rows.map(row => columns.map(c => escapeCsvValue(row[c.key])).join(','));
  return [header, ...lines].join('\n');
}

/** 触发浏览器下载一个 CSV 文件（前端生成，无需后端） */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([`﻿${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
