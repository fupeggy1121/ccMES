import { PackagingRecord } from '../types';

/**
 * 生成出货条码（包装条码）。
 * - 若同批次已存在包装记录，复用其条码前缀，序号在现有记录数量基础上 +1。
 * - 否则以 batchCode 中的数字字符（取后 6 位，不足左补 0）作为前缀，序号从 01 开始。
 * 结果仅用于表单预填展示，用户可编辑，不做全局唯一性校验。
 */
export function generatePackagingBarcode(
  batchCode: string,
  existingRecords: PackagingRecord[]
): string {
  const seq = existingRecords.length + 1;
  const seqStr = String(seq).padStart(2, '0');

  if (existingRecords.length > 0) {
    const lastBarcode = existingRecords[existingRecords.length - 1].packagingBarcode;
    const dashIdx = lastBarcode.lastIndexOf('-');
    const prefix = dashIdx !== -1 ? lastBarcode.slice(0, dashIdx) : lastBarcode;
    return `${prefix}-${seqStr}`;
  }

  const digitsOnly = batchCode.replace(/\D/g, '');
  const prefix = digitsOnly.length >= 6
    ? digitsOnly.slice(-6)
    : digitsOnly.padStart(6, '0');
  return `${prefix}-${seqStr}`;
}
