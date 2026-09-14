import { FinishedGoodsBatch } from '../types';

/**
 * 已包装完成入成品库的批次种子数据。
 *
 * 为什么独立于 batches.ts：`batchList` 是"在制批次"清单，被批次作业模块直接当作可操作对象
 * 渲染和筛选；成品库批次已经离开在制流程、没有可执行的站点操作，混进去只会让在制清单里
 * 出现一批点不动的行。自动批量扣留需要它们时通过 resolveFinishedGoodsBatches 单独查询。
 *
 * 时间字段相对模块加载时刻生成：扣留规则按"事件发生时间往前推 N 小时"圈定批次，写死绝对
 * 时间戳会让这批数据在任何一次演示里都落在窗口外，永远匹配不上。
 */
const HOUR = 60 * 60 * 1000;
const _loadedAt = Date.now();
const hoursAgo = (h: number): string => new Date(_loadedAt - h * HOUR).toISOString();

export const finishedGoodsBatchList: FinishedGoodsBatch[] = [
  {
    id: 'fg-7a1d4c02-9b6e-4f51-8d33-2c61a0f7b5e1',
    batchCode: 'BATCHFG0731',
    productCode: 'P002',
    productName: 'Product Beta',
    totalQty: 296,
    ingotId: 'ING002',
    packagedAt: hoursAgo(5.5),
    packagingBarcode: 'PKG-20260915-0731',
    inboundAt: hoursAgo(5),
    warehouseLocation: '成品库 A 区-03-12',
    customerName: '客户A',
    productCategory: '正片',
  },
  {
    id: 'fg-3e58b9d7-41af-4c8a-b0d2-95e7c31684fa',
    batchCode: 'BATCHFG0864',
    productCode: 'P002',
    productName: 'Product Beta',
    totalQty: 288,
    ingotId: 'ING002',
    packagedAt: hoursAgo(4.5),
    packagingBarcode: 'PKG-20260915-0864',
    inboundAt: hoursAgo(4),
    warehouseLocation: '成品库 A 区-03-14',
    customerName: '客户A',
    productCategory: '正片',
  },
  {
    id: 'fg-c204f8ab-6d13-4e79-9a55-7b8e0d2f3c46',
    batchCode: 'BATCHFG0912',
    productCode: 'P004',
    productName: 'Product Delta',
    totalQty: 312,
    ingotId: 'ING003',
    packagedAt: hoursAgo(3.5),
    packagingBarcode: 'PKG-20260915-0912',
    inboundAt: hoursAgo(3),
    warehouseLocation: '成品库 B 区-01-05',
    customerName: '客户C',
    productCategory: '重掺片',
  },
];
