import { BatchData } from '../types';

export const mockAllAccumulateBatches: BatchData[] = [
  {
    id: 'ACCUM001',
    batchCode: 'ACCUM001',
    productCode: 'P001',
    productName: 'Product 1',
    totalQty: 50,
    goodQty: 48,
    defectQty: 2,
    status: 'Hold',
    station: 'ST01',
    stationName: 'Station One',
    equipmentCode: 'EQP-ACCUM',
    equipmentName: 'Accumulation Equipment',
    equipmentChamber: 'DEFAULT',
    nextStationCode: 'nextStation',
    nextStationName: 'Next Station',
    productVersion: 1,
    recipeCode: 'RCP-ACCUM',
    ingotId: 'INGOT-ACCUM',
    isSmallBatch: false,
    isHold: true
  },
  {
    id: 'ACCUM002',
    batchCode: 'ACCUM002',
    productCode: 'P002',
    productName: 'Product 2',
    totalQty: 75,
    goodQty: 72,
    defectQty: 3,
    status: 'Hold',
    station: 'ST02',
    stationName: 'Station Two',
    equipmentCode: 'EQP-ACCUM',
    equipmentName: 'Accumulation Equipment',
    equipmentChamber: 'DEFAULT',
    nextStationCode: 'nextStation',
    nextStationName: 'Next Station',
    productVersion: 1,
    recipeCode: 'RCP-ACCUM',
    ingotId: 'INGOT-ACCUM',
    isSmallBatch: false,
    isHold: true
  }
];