// src/utils/dataTransformers.ts

/**
 * 将 snake_case 对象转换为 camelCase
 */
export const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

/**
 * 将数据库批次数据转换为前端 BatchData 类型
 */
export const transformBatchData = (dbBatch: any) => ({
  id: dbBatch.id,
  batchCode: dbBatch.batch_code,
  productCode: dbBatch.product_code,
  productName: dbBatch.product_name,
  totalQty: dbBatch.total_qty,
  goodQty: dbBatch.good_qty,
  defectQty: dbBatch.defect_qty,
  status: dbBatch.status,
  station: dbBatch.current_station_name, // CRITICAL CHANGE: 使用 dbBatch.current_station_name 作为 station
  // CRITICAL CHANGE: Use dbBatch.current_station_name directly if available, otherwise fallback to '未知站点'
  stationName: dbBatch.current_station_name || '未知站点',
  equipmentCode: dbBatch.equipment_code,
  equipmentName: dbBatch.equipment_name,
  equipmentChamber: dbBatch.equipment_chamber,
  nextStationCode: dbBatch.next_station_code,
  nextStationName: dbBatch.next_station_name,
  productVersion: dbBatch.product_version,
  recipeCode: dbBatch.recipe_code,
  ingotId: dbBatch.ingot_id,
  isSmallBatch: dbBatch.is_small_batch,
  isHold: dbBatch.is_hold,
});

/**
 * 将数据库产品数据转换为前端 ProductData 类型
 */
export const transformProductData = (dbProduct: any) => ({
  id: dbProduct.id,
  productCode: dbProduct.product_code,
  productName: dbProduct.product_name,
  productVersion: dbProduct.product_version,
  productType: dbProduct.product_type,
  specParams: dbProduct.spec_params,
  processPathName: dbProduct.process_path_name,
});

/**
 * 将数据库子批次数据转换为前端 SubBatchData 类型
 */
export const transformSubBatchData = (dbSubBatch: any) => ({
  id: dbSubBatch.id,
  sublotId: dbSubBatch.sub_batch_code,
  // CRITICAL CHANGE: 假设后端直接返回 flat 的 snake_case 字段
  carrierId: dbSubBatch.carrier_code || '未知载具',
  totalQty: dbSubBatch.total_qty,
  goodQty: dbSubBatch.good_qty,
  defectQty: dbSubBatch.defect_qty,
  defectDisposal: dbSubBatch.defect_disposal,
  status: dbSubBatch.status,
  station: dbSubBatch.station_code || '未知站点',
  stationName: dbSubBatch.station_name || '未知站点',
  equipment: dbSubBatch.equipment_code || '未知设备',
  packagingBarcode: dbSubBatch.packaging_barcode,
});
