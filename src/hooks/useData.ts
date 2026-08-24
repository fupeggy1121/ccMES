// src/hooks/useData.ts
import { useState, useEffect, useCallback } from 'react';
import { Material, Carrier, PreloadRecord, ProductionMetrics, ProductionOrder, BOMItem, AuxiliaryMaterial, LifetimeControlModel, AuxiliaryMaterialRequest, AuxiliaryRequestItem, ProcessingHistoryRecord, CarrierGroup, CleaningRecord, PickedMaterialBatch, FinishedProductBatch, SavedReport } from '../types';
import { AuxiliaryReturnRequest, AuxiliaryReturnItem } from '../types';

// 导入新的生产工单服务
import { productionOrdersService } from '../services/productionOrdersService';
import { processRouteService, ProcessStation } from '../services/processRouteService';
import { savedReportsService } from '../services/savedReportsService';

// Import all mock data generators
import { generateMockCarriers } from '../data/mockCarriers';
import { generateMockMaterials } from '../data/mockMaterials';
import { generateMockBOMItems } from '../data/mockBOMItems';
import { generateMockCarrierGroups } from '../data/mockCarrierGroups';
import { generateMockPreloadRecords } from '../data/mockPreloadRecords';
// import { generateMockProductionOrders } from '../data/mockProductionOrders'; // 仍然保留，用于其他模块或回滚
import { generateMockAuxiliaryMaterials } from '../data/mockAuxiliaryMaterials';
import { generateMockProcessingHistoryRecords } from '../data/mockProcessingHistoryRecords';
import { generateMockLifetimeControlModels } from '../data/mockLifetimeControlModels';
import { generateMockAuxiliaryMaterialRequests } from '../data/mockAuxiliaryMaterialRequests';
import { generateMockCleaningRecords } from '../data/mockCleaningRecords';
import { generateMockFinishedProductBatches } from '../data/mockFinishedProductBatches';

// Data hook specific types
interface MaterialPickingRequest {
  id: string;
  workOrderId: string;
  workOrderNumber: string;
  requestDate: Date;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  bomItems: BOMPickingItem[];
  totalAmount: number;
  notes?: string;
  approvedBy?: string;
  approvedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface BOMPickingItem extends BOMItem {
  requestedQuantity: number;
  availableQuantity: number;
  pickingQuantity: number;
}

interface WarehouseOutboundRequest {
  id: string;
  pickingRequestId: string;
  workOrderNumber: string;
  requestDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedBy: string;
  approvedBy?: string;
  approvedDate?: Date;
  items: OutboundItem[];
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OutboundItem {
  materialCode: string;
  materialName: string;
  requestedQuantity: number;
  approvedQuantity: number;
  actualQuantity?: number;
  batchNumber?: string;
  lotNumber?: string;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface MaterialFeedingRecord {
  id: string;
  workOrderId: string;
  workOrderNumber: string;
  lotId: string;
  feedingDate: Date;
  operator: string;
  materials: FeedingMaterial[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FeedingMaterial {
  materialId: string;
  materialCode: string;
  materialName: string;
  batchNumber: string;
  lotNumber: string;
  feedingQuantity: number;
  unit: string;
  location: string;
  waferBasketId?: string;
  slotNumber?: number;
}

export const useData = () => {

  // 将所有 useState Hook 放在最前面，确保顺序固定
  const [materials, setMaterials] = useState<Material[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [preloadRecords, setPreloadRecords] = useState<PreloadRecord[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [materialPickingRequests, setMaterialPickingRequests] = useState<MaterialPickingRequest[]>([]);
  const [warehouseOutboundRequests, setWarehouseOutboundRequests] = useState<WarehouseOutboundRequest[]>([]);
  const [auxiliaryMaterials, setAuxiliaryMaterials] = useState<AuxiliaryMaterial[]>([]);
  const [lifetimeControlModels, setLifetimeControlModels] = useState<LifetimeControlModel[]>([]);
  const [auxiliaryMaterialRequests, setAuxiliaryMaterialRequests] = useState<AuxiliaryMaterialRequest[]>([]);
  const [processingHistoryRecords, setProcessingHistoryRecords] = useState<ProcessingHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [auxiliaryReturnRequests, setAuxiliaryReturnRequests] = useState<AuxiliaryReturnRequest[]>([]);
  const [carrierGroups, setCarrierGroups] = useState<CarrierGroup[]>([]);
  const [cleaningRecords, setCleaningRecords] = useState<CleaningRecord[]>([]);
  const [actualPickedBatches, setActualPickedBatches] = useState<PickedMaterialBatch[]>([]);
  const [finishedProductBatches, setFinishedProductBatches] = useState<FinishedProductBatch[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productProcessStations, setProductProcessStations] = useState<ProcessStation[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);

  // 辅助函数：生成唯一的ID
  const generateCleaningRecordId = useCallback(() => {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CR-${timestamp}-${random}`;
  }, []);

  const generatePickedBatchId = useCallback(() => {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BATCH-${timestamp}-${random}`;
  }, []);

  // 生成模拟的物料批次数据，确保每个批次都关联到工单ID
  const generateMockPickedBatches = useCallback((productionOrders: ProductionOrder[]) => {
    const mockBatches: PickedMaterialBatch[] = [];

    const substrateTypes = [
      { code: 'SIC-4IN', name: '碳化硅衬底', spec: '4英寸 N型', supplier: '天岳先进' },
      { code: 'SIC-6IN', name: '碳化硅衬底', spec: '6英寸 N型', supplier: '天岳先进' },
      { code: 'GAAS-4IN', name: '砷化镓衬底', spec: '4英寸 半绝缘', supplier: '中科镓英' },
      { code: 'GAAS-6IN', name: '砷化镓衬底', spec: '6英寸 半绝缘', supplier: '中科镓英' },
      { code: 'GAN-4IN', name: '氮化镓衬底', spec: '4英寸 N型 自支撑', supplier: '苏州晶湛' },
      { code: 'SI-6IN', name: '硅衬底', spec: '6英寸 P型 (100)', supplier: '上海新昇' },
    ];
    const chemTypes = [
      { code: 'NH4OH', name: '氨水', spec: '电子级 28-30%', supplier: '江化微' },
      { code: 'H2SO4', name: '硫酸', spec: '电子级 96-98%', supplier: '江化微' },
      { code: 'HF', name: '氢氟酸', spec: '电子级 49%', supplier: '巨化股份' },
    ];
    const gasTypes = [
      { code: 'N2-HPA', name: '高纯氮气', spec: '6N 99.9999%', supplier: '广钢气体' },
      { code: 'AR-HPA', name: '高纯氩气', spec: '5N 99.999%', supplier: '广钢气体' },
    ];
    const inboundStatuses: Array<'pending' | 'completed'> = ['completed', 'completed', 'pending', 'completed', 'pending'];

    productionOrders.forEach((order, orderIdx) => {
      // 衬底片批次（每个工单 4-6 片）
      const subCount = 4 + (orderIdx % 3);
      const subType = substrateTypes[orderIdx % substrateTypes.length];
      for (let i = 0; i < subCount; i++) {
        const batchIndex = mockBatches.length + 1;
        const year = 2024 + (orderIdx % 2);
        const month = String((batchIndex % 12) + 1).padStart(2, '0');
        const seq = String(batchIndex).padStart(4, '0');
        mockBatches.push({
          id: `BATCH-${batchIndex.toString().padStart(4, '0')}`,
          workOrderId: order.id,
          bomItemId: `BOM-${order.id}-SUB-${i + 1}`,
          materialCode: subType.code,
          materialName: subType.name,
          specification: subType.spec,
          unit: '片',
          pickedQuantity: 1,
          batchNumber: `BN-${year}${month}-${seq}`,
          lotNumber: `${subType.code}-${year}${month}-${seq}`,
          supplier: subType.supplier,
          pickedDate: new Date(`${year}-${month}-${String(10 + i).padStart(2, '0')}`),
          location: `线边仓-${String.fromCharCode(65 + (orderIdx % 4))}区-${String(i + 1).padStart(2, '0')}`,
          inboundStatus: inboundStatuses[(batchIndex + i) % inboundStatuses.length],
        });
      }
      // 化学品批次（每个工单 1-2 种）
      const chemCount = 1 + (orderIdx % 2);
      for (let j = 0; j < chemCount; j++) {
        const batchIndex = mockBatches.length + 1;
        const chem = chemTypes[(orderIdx + j) % chemTypes.length];
        mockBatches.push({
          id: `BATCH-${batchIndex.toString().padStart(4, '0')}`,
          workOrderId: order.id,
          bomItemId: `BOM-${order.id}-CHEM-${j + 1}`,
          materialCode: chem.code,
          materialName: chem.name,
          specification: chem.spec,
          unit: 'L',
          pickedQuantity: 10 + j * 5,
          batchNumber: `BN-CHEM-${batchIndex.toString().padStart(4, '0')}`,
          lotNumber: `${chem.code}-LOT-${batchIndex.toString().padStart(4, '0')}`,
          supplier: chem.supplier,
          pickedDate: new Date(`2024-0${(j + 1)}-15`),
          location: `化学品仓-C${j + 1}`,
          inboundStatus: j === 0 ? 'completed' : 'pending',
        });
      }
      // 气体批次（每个工单 1 种）
      const batchIndex = mockBatches.length + 1;
      const gas = gasTypes[orderIdx % gasTypes.length];
      mockBatches.push({
        id: `BATCH-${batchIndex.toString().padStart(4, '0')}`,
        workOrderId: order.id,
        bomItemId: `BOM-${order.id}-GAS-1`,
        materialCode: gas.code,
        materialName: gas.name,
        specification: gas.spec,
        unit: '瓶',
        pickedQuantity: 2,
        batchNumber: `BN-GAS-${batchIndex.toString().padStart(4, '0')}`,
        lotNumber: `${gas.code}-LOT-${batchIndex.toString().padStart(4, '0')}`,
        supplier: gas.supplier,
        pickedDate: new Date(`2024-03-01`),
        location: `气体站-G${(orderIdx % 3) + 1}`,
        inboundStatus: 'completed',
      });
    });
    
    return mockBatches;
  }, []);

  // 新增：用于获取保存报表的函数
  const refetchSavedReports = useCallback(async () => {
    try {
      const fetchedSavedReports = await savedReportsService.fetchSavedReports();
      setSavedReports(fetchedSavedReports);
    } catch (error) {
      console.error('Failed to refetch saved reports:', error);
    }
  }, []);

  // 开始清洗操作
  const startCleaning = useCallback((carrierId: string, operator: string, equipment: string): CleaningRecord => {
    const newRecordId = generateCleaningRecordId();
    const newRecord: CleaningRecord = {
      id: newRecordId,
      carrierId,
      operator,
      equipment,
      startTime: new Date(),
      status: 'in-progress',
      notes: '清洗任务开始',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCleaningRecords(prevRecords => [...prevRecords, newRecord]);
    setCarriers(prevCarriers =>
      prevCarriers.map(c =>
        c.id === carrierId
          ? { ...c, cleaningStatus: 'in-cleaning', status: 'occupied', updatedAt: new Date() }
          : c
      )
    );
    return newRecord;
  }, [generateCleaningRecordId]);

  // 完成清洗任务
  const completeCleaningTask = useCallback((recordId: string, operator: string, endTime: Date) => {
    setCleaningRecords(prevRecords =>
      prevRecords.map(record => {
        if (record.id === recordId) {
          return {
            ...record,
            endTime: endTime,
            status: 'completed',
            operator: operator,
            updatedAt: new Date(),
          };
        }
        return record;
      })
    );

    const completedRecord = cleaningRecords.find(rec => rec.id === recordId);
    if (completedRecord) {
      setCarriers(prevCarriers =>
        prevCarriers.map(c => {
          const isCarrierInRecord = c.id === completedRecord.carrierId || 
            (completedRecord.carrierIds && completedRecord.carrierIds.includes(c.id));
          
          return isCarrierInRecord
            ? { 
                ...c, 
                cleaningStatus: 'good', 
                status: 'unoccupied', 
                cleaningCount: (c.cleaningCount || 0) + 1, 
                updatedAt: new Date() 
              }
            : c;
        })
      );
    }
  }, [cleaningRecords]);

  // 批量开始清洗任务
  const startBatchCleaning = useCallback((carrierIds: string[], operator: string, equipment: string) => {
    const newRecordId = generateCleaningRecordId();
    const newRecord: CleaningRecord = {
      id: newRecordId,
      carrierId: carrierIds.join(', '),
      carrierIds: carrierIds,
      operator,
      equipment,
      startTime: new Date(),
      status: 'in-progress',
      notes: '批量清洗任务开始',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCleaningRecords(prevRecords => [...prevRecords, newRecord]);
    setCarriers(prevCarriers =>
      prevCarriers.map(c =>
        carrierIds.includes(c.id)
          ? { ...c, cleaningStatus: 'in-cleaning', status: 'occupied', updatedAt: new Date() }
          : c
      )
    );
    return newRecord;
  }, [generateCleaningRecordId]);

  // 完成单个载具的清洗操作
  const completeCleaning = useCallback((recordId: string, operator: string, endTime: Date) => {
    setCleaningRecords(prev => prev.map(rec => {
      if (rec.id === recordId) {
        const updatedRecord = {
          ...rec,
          endTime: endTime,
          status: 'completed',
          updatedAt: new Date(),
        };
        setCarriers(prevCarriers => prevCarriers.map(c =>
          c.id === rec.carrierId
            ? { ...c, cleaningStatus: 'good', cleaningCount: (c.cleaningCount || 0) + 1 }
            : c
        ));
        return updatedRecord;
      }
      return rec;
    }));
  }, []);

  // 获取指定载具的清洗记录
  const getCleaningRecordsForCarrier = useCallback((carrierId: string): CleaningRecord[] => {
    return cleaningRecords.filter(rec => rec.carrierId === carrierId);
  }, [cleaningRecords]);

  // 新增：工单退料函数
  const returnPickedMaterialBatches = useCallback((batchIds: string[], requestedBy: string, notes?: string) => {
    setActualPickedBatches(prevBatches => 
      prevBatches.map(batch => 
        batchIds.includes(batch.id) 
          ? { ...batch, inboundStatus: 'returned' }
          : batch
      )
    );
    
    console.log(`Material batches returned: ${batchIds.join(', ')}, Requested by: ${requestedBy}, Notes: ${notes}`);
    
    return true;
  }, []);

  // 修改：物料转移函数 - 更新原批次状态并创建新批次
  const transferPickedMaterialBatches = useCallback((
    sourceWorkOrderId: string,
    batchIdsToTransfer: string[],
    targetWorkOrderId: string,
    targetLocation: string,
    transferringOperator: string
  ) => {
    setActualPickedBatches(prevBatches => {
      const updatedBatches = [...prevBatches];
      
      batchIdsToTransfer.forEach(batchId => {
        const originalBatchIndex = updatedBatches.findIndex(batch => batch.id === batchId);
        if (originalBatchIndex === -1) return;
        
        const originalBatch = updatedBatches[originalBatchIndex];
        
        updatedBatches[originalBatchIndex] = {
          ...originalBatch,
          inboundStatus: 'transferred_out'
        };
        
        const newBatch: PickedMaterialBatch = {
          ...originalBatch,
          id: generatePickedBatchId(),
          workOrderId: targetWorkOrderId,
          location: targetLocation,
          inboundStatus: 'transferred_in',
          pickedDate: new Date(),
          transferOperator: transferringOperator
        };
        
        updatedBatches.push(newBatch);
      });
      
      return updatedBatches;
    });
    
    console.log(`Material batches transferred from ${sourceWorkOrderId} to ${targetWorkOrderId}:`, {
      batchIds: batchIdsToTransfer,
      targetLocation,
      transferringOperator
    });
    
    return true;
  }, [generatePickedBatchId]);

  // 新增：获取并设置产品工艺站点的函数
  const fetchAndSetProductProcessStations = useCallback(async (productSupabaseId: string) => {
    if (!productSupabaseId) {
      setProductProcessStations([]);
      return;
    }
    try {
      const stations = await processRouteService.fetchProcessStationsForProduct(productSupabaseId);
      setProductProcessStations(stations);
    } catch (error) {
      console.error('Failed to fetch product process stations:', error);
      setProductProcessStations([]);
    }
  }, []);

  // 数据初始化 useEffect
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. 从 Supabase 获取生产工单数据
        const fetchedProductionOrders = await productionOrdersService.fetchProductionOrders();
        setProductionOrders(fetchedProductionOrders);

        // 2. 从 Supabase 获取产品列表 (用于工单创建时的产品选择)
        const fetchedProducts = await productionOrdersService.fetchProducts();
        setProducts(fetchedProducts);

        // 3. 从 Supabase 获取保存的报表 - 使用 refetchSavedReports
        await refetchSavedReports();

        // 4. 使用导入的模拟数据生成函数 (其他模块继续使用模拟数据)
        const initialFixedMockCarriers = generateMockCarriers();
        setCarriers(initialFixedMockCarriers);

        const mockCleaningRecords = generateMockCleaningRecords(initialFixedMockCarriers);
        setCleaningRecords(mockCleaningRecords);

        const mockMaterials = generateMockMaterials();
        const mockCarrierGroups = generateMockCarrierGroups();
        const mockPreloadRecords = generateMockPreloadRecords(mockMaterials, initialFixedMockCarriers);
        const mockBOMItems = generateMockBOMItems();
        const mockAuxiliaryMaterials = generateMockAuxiliaryMaterials();
        const mockLifetimeControlModels = generateMockLifetimeControlModels(mockAuxiliaryMaterials);
        const mockAuxiliaryMaterialRequests = generateMockAuxiliaryMaterialRequests();
        const mockProcessingHistoryRecords = generateMockProcessingHistoryRecords(mockAuxiliaryMaterials);
        const mockFinishedProductBatches = generateMockFinishedProductBatches(25);

        setAuxiliaryMaterials(mockAuxiliaryMaterials);
        setMaterials(mockMaterials);
        setCarrierGroups(mockCarrierGroups);
        setPreloadRecords(mockPreloadRecords);
        setBomItems(mockBOMItems);
        setLifetimeControlModels(mockLifetimeControlModels);
        setAuxiliaryMaterialRequests(mockAuxiliaryMaterialRequests);
        setProcessingHistoryRecords(mockProcessingHistoryRecords);
        setFinishedProductBatches(mockFinishedProductBatches);

        const mockPickedBatches = generateMockPickedBatches(fetchedProductionOrders);
        setActualPickedBatches(mockPickedBatches);

      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [generateMockPickedBatches, refetchSavedReports]);

  const getMetrics = (): ProductionMetrics => {
    const totalMaterials = materials.length;
    const boundMaterials = materials.filter(m => m.status === 'bound').length;
    const availableCarriers = carriers.filter(c => c.status === 'available').length;
    const activePreloadRecords = preloadRecords.filter(b => b.status === 'active').length;
    const completedToday = preloadRecords.filter(b =>
      b.preloadTime.toDateString() === new Date().toDateString() &&
      b.status === 'completed'
    ).length;
    const efficiency = totalMaterials > 0 ? (boundMaterials / totalMaterials) * 100 : 0;

    return {
      totalMaterials,
      boundMaterials,
      availableCarriers,
      activeBindings: activePreloadRecords,
      completedToday,
      efficiency
    };
  };

  const createPreloadRecord = (preloadData: {
    preloadTime: Date;
    operator: string;
    equipmentId: string;
    chamberId: string;
    rackPosition: string;
    platenId: string;
    boundPositions: { id: number; substrateLotNumber: string; substrateId: string }[];
  }) => {
    const { preloadTime, operator, equipmentId, chamberId, rackPosition, platenId, boundPositions } = preloadData;

    const platen = carriers.find(c => c.id === platenId);
    if (!platen) {
      alert('未找到指定的 Platen');
      return;
    }

    if (platen.status !== 'available') {
      alert(`Platen ${platen.carrierId} 不可用 (${platen.status})`);
      return;
    }

    for (const pos of boundPositions) {
      const substrate = materials.find(m => m.id === pos.substrateId);
      if (!substrate || substrate.status !== 'pending') {
        alert(`衬底片 ${pos.substrateLotNumber} 不可用或未找到`);
        return;
      }
    }

    const newRecord: PreloadRecord = {
      id: `MBE-PRELOAD-${(preloadRecords.length + 1).toString().padStart(3, '0')}`,
      substrateId: boundPositions[0]?.substrateId || 'N/A',
      platenId: platen.id,
      preloadTime: preloadTime,
      operatorId: `OP-${Math.floor(Math.random() * 1000)}`,
      operatorName: operator,
      status: 'active',
      processStep: 'not-degassed',
      equipmentId,
      chamberId,
      rackPosition,
      platenPositions: boundPositions,
      notes: 'MBE预装片记录',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setPreloadRecords(prev => [...prev, newRecord]);
    setCarriers(prev => prev.map(c =>
      c.id === platen.id
        ? { ...c, status: 'bound' as Carrier['status'], currentLoad: boundPositions.length }
        : c
    ));

    setMaterials(prev => prev.map(m =>
      boundPositions.some(p => p.substrateId === m.id)
        ? { ...m, status: 'bound' as Material['status'] }
        : m
    ));
  };

  const updatePreloadStep = (recordId: string, step: PreloadRecord['processStep']) => {
    setPreloadRecords(prev => prev.map(r =>
      r.id === recordId ? { ...r, processStep: step } : r
    ));
  };

  const updatePreloadRecordDegasInfo = (
    recordId: string,
    degasTime: Date,
    degasOperatorId: string,
    degasOperatorName: string
  ) => {
    setPreloadRecords(prev => prev.map(r =>
      r.id === recordId
        ? { ...r, degasTime, degasOperatorId, degasOperatorName, processStep: 'degassed', updatedAt: new Date() }
        : r
    ));
  };

  const unbindPreloadRecord = (recordId: string) => {
    setPreloadRecords(prevRecords => {
      const recordToUnbind = prevRecords.find(r => r.id === recordId);
      if (!recordToUnbind) return prevRecords;

      setMaterials(prevMaterials => prevMaterials.map(m =>
        recordToUnbind.platenPositions.some(p => p.substrateId === m.id)
          ? { ...m, status: 'pending' as Material['status'] }
          : m
      ));

      setCarriers(prevCarriers => prevCarriers.map(c =>
        c.id === recordToUnbind.platenId
          ? { ...c, status: 'available' as Carrier['status'], currentLoad: 0 }
          : c
      ));

      return prevRecords.map(r =>
        r.id === recordId
          ? { ...r, processStep: 'unbound' as PreloadRecord['processStep'], status: 'cancelled' as PreloadRecord['status'], updatedAt: new Date() }
          : r
      );
    });
  };

  const completePreloadRecord = (recordId: string) => {
    setPreloadRecords(prev => prev.map(r =>
      r.id === recordId
        ? { ...r, processStep: 'completed' as PreloadRecord['processStep'], status: 'completed' as PreloadRecord['status'], updatedAt: new Date() }
        : r
    ));
  };

  const createMaterialPickingRequest = useCallback((workOrderId: string, workOrderNumber: string, requestedBy: string, bomPickingItems: any[], notes?: string) => {
    const totalAmount = bomPickingItems.reduce((sum, item) => sum + (item.pickingQuantity * item.unitPrice), 0);
    
    const newRequest: MaterialPickingRequest = {
      id: `MPR-${(materialPickingRequests.length + 1).toString().padStart(3, '0')}`,
      workOrderId,
      workOrderNumber,
      requestDate: new Date(),
      requestedBy,
      status: 'pending',
      bomItems: bomPickingItems,
      totalAmount,
      notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setMaterialPickingRequests(prev => [...prev, newRequest]);
    
    createWarehouseOutboundRequest(newRequest);
    
    const newBatches: PickedMaterialBatch[] = bomPickingItems.map(item => ({
      id: generatePickedBatchId(),
      workOrderId: workOrderId,
      bomItemId: item.id,
      materialCode: item.materialCode,
      materialName: item.materialName,
      specification: item.specification,
      unit: item.unit,
      pickedQuantity: item.pickingQuantity,
      batchNumber: `BATCH-${workOrderNumber}-${item.materialCode}`,
      supplier: item.supplier,
      pickedDate: new Date(),
      location: '线边仓-待分配',
      inboundStatus: 'pending'
    }));
    
    setActualPickedBatches(prev => [...prev, ...newBatches]);
    
    return newRequest;
  }, [generatePickedBatchId, materialPickingRequests.length]);

  const createWarehouseOutboundRequest = (pickingRequest: MaterialPickingRequest) => {
    const outboundItems = pickingRequest.bomItems.map(item => ({
      materialCode: item.materialCode,
      materialName: item.materialName,
      requestedQuantity: item.requestedQuantity,
      approvedQuantity: 0,
      unit: item.unit,
      unitPrice: item.unitPrice,
      totalPrice: item.requestedQuantity * item.unitPrice
    }));

    const newOutboundRequest: WarehouseOutboundRequest = {
      id: `WOR-${(warehouseOutboundRequests.length + 1).toString().padStart(3, '0')}`,
      pickingRequestId: pickingRequest.id,
      workOrderNumber: pickingRequest.workOrderNumber,
      requestDate: new Date(),
      status: 'pending',
      requestedBy: pickingRequest.requestedBy,
      items: outboundItems,
      totalAmount: pickingRequest.totalAmount,
      notes: pickingRequest.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setWarehouseOutboundRequests(prev => [...prev, newOutboundRequest]);
  };

  const createProductionOrder = useCallback(async (workOrderData: any) => {
    const orderNumber = `WO-2024-${(productionOrders.length + 2000).toString()}`;

    const selectedProduct = products.find(p => p.supabase_id === workOrderData.productRefId);
    if (!selectedProduct) {
      throw new Error('Selected product not found.');
    }

    const newOrder: Omit<ProductionOrder, 'id' | 'createdAt' | 'updatedAt' | 'currentProgress'> = {
      orderNumber,
      orderType: workOrderData.orderType,
      planName: workOrderData.planName,
      productRefId: workOrderData.productRefId,
      productName: selectedProduct.product_name,
      targetQuantity: workOrderData.targetQuantity,
      startProcessStationCode: workOrderData.startProcessStationCode,
      endProcessStationCode: workOrderData.endProcessStationCode,
      startDate: workOrderData.startDate,
      endDate: workOrderData.endDate,
      status: 'scheduled',
      priority: workOrderData.priority,
      assignedOperator: workOrderData.assignedOperator,
      bomItems: workOrderData.bomItems,
      notes: workOrderData.notes,
    };

    try {
      const createdOrder = await productionOrdersService.createProductionOrder(newOrder);
      setProductionOrders(prev => [...prev, createdOrder]);
      return createdOrder;
    } catch (error) {
      console.error('Failed to create production order:', error);
      throw error;
    }
  }, [productionOrders.length, products]);

  const updateProductionOrder = useCallback(async (id: string, updates: Partial<ProductionOrder>) => {
    try {
      const updatedOrder = await productionOrdersService.updateProductionOrder(id, updates);
      setProductionOrders(prev => prev.map(order => order.id === id ? updatedOrder : order));
      return updatedOrder;
    } catch (error) {
      console.error('Failed to update production order:', error);
      throw error;
    }
  }, []);

  const addAuxiliaryMaterial = (materialData: Omit<AuxiliaryMaterial, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMaterial: AuxiliaryMaterial = {
      id: `AUX-${(auxiliaryMaterials.length + 1).toString().padStart(3, '0')}`,
      ...materialData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAuxiliaryMaterials(prev => [...prev, newMaterial]);
  };

  const updateAuxiliaryMaterial = (id: string, materialData: Omit<AuxiliaryMaterial, 'id' | 'createdAt' | 'updatedAt'>) => {
    setAuxiliaryMaterials(prev => prev.map(material =>
      material.id === id ? { 
        ...material, 
        ...materialData, 
        instanceUniqueCode: materialData.instanceUniqueCode !== undefined 
          ? materialData.instanceUniqueCode 
          : material.instanceUniqueCode,
        updatedAt: new Date() 
      } : material
    ));
  };

  const deleteAuxiliaryMaterial = (id: string) => {
    setAuxiliaryMaterials(prev => prev.filter(material => material.id !== id));
  };

  const addLifetimeControlModel = (modelData: Omit<LifetimeControlModel, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newModel: LifetimeControlModel = {
      id: `LCM-${(lifetimeControlModels.length + 1).toString().padStart(3, '0')}`,
      ...modelData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setLifetimeControlModels(prev => [...prev, newModel]);
  };

  const updateLifetimeControlModel = (id: string, modelData: Omit<LifetimeControlModel, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLifetimeControlModels(prev => prev.map(model =>
      model.id === id ? { ...model, ...modelData, updatedAt: new Date() } : model
    ));
  };

  const deleteLifetimeControlModel = (id: string) => {
    setLifetimeControlModels(prev => prev.filter(model => model.id !== id));
  };

  const createAuxiliaryMaterialRequest = (requestData: {
    requestedBy: string;
    targetEquipmentId?: string;
    items: Omit<AuxiliaryRequestItem, 'id'>[];
    notes?: string;
  }) => {
    const newRequest: AuxiliaryMaterialRequest = {
      id: `AMR-${(auxiliaryMaterialRequests.length + 1).toString().padStart(3, '0')}`,
      requestNumber: `AMR-2024-${(auxiliaryMaterialRequests.length + 1000).toString()}`,
      requestedBy: requestData.requestedBy,
      requestDate: new Date(),
      targetEquipmentId: requestData.targetEquipmentId,
      status: 'pending',
      items: requestData.items.map((item, index) => ({
        id: `ITEM-${auxiliaryMaterialRequests.length + 1}-${index + 1}`,
        ...item
      })),
      totalAmount: requestData.items.reduce((sum, item) => sum + item.requestedQuantity, 0),
      notes: requestData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setAuxiliaryMaterialRequests(prev => [...prev, newRequest]);
    return newRequest;
  };

  const updateAuxiliaryMaterialRequest = (id: string, requestData: Partial<AuxiliaryMaterialRequest>) => {
    setAuxiliaryMaterialRequests(prev => prev.map(request =>
      request.id === id ? { ...request, ...requestData, updatedAt: new Date() } : request
    ));
  };

  const deleteAuxiliaryMaterialRequest = (id: string) => {
    setAuxiliaryMaterialRequests(prev => prev.filter(request => request.id !== id));
  };

  const approveAuxiliaryMaterialRequest = (id: string, approvedBy: string) => {
    setAuxiliaryMaterialRequests(prev => prev.map(request =>
      request.id === id 
        ? { 
            ...request, 
            status: 'approved', 
            approvedBy, 
            approvedDate: new Date(),
            updatedAt: new Date() 
          } 
        : request
    ));
  };

  const rejectAuxiliaryMaterialRequest = (id: string, approvedBy: string, notes?: string) => {
    setAuxiliaryMaterialRequests(prev => prev.map(request =>
      request.id === id 
        ? { 
            ...request, 
            status: 'rejected', 
            approvedBy, 
            approvedDate: new Date(),
            notes: notes ? `${request.notes || ''} 驳回原因: ${notes}` : request.notes,
            updatedAt: new Date() 
          } 
        : request
    ));
  };

  const completeAuxiliaryMaterialRequest = (id: string) => {
    setAuxiliaryMaterialRequests(prev => prev.map(request =>
      request.id === id 
        ? { ...request, status: 'completed', updatedAt: new Date() } 
        : request
    ));
  };

  const scrapAuxiliaryMaterial = (materialIds: string[], notes?: string) => {
    setAuxiliaryMaterials(prev => prev.map(material => {
      if (materialIds.includes(material.id)) {
        return {
          ...material,
          status: 'scrapped',
          notes: notes ? `${material.notes || ''} 报废原因: ${notes}` : material.notes,
          updatedAt: new Date(),
        };
      }
      return material;
    }));
    console.log('Auxiliary materials scrapped:', materialIds);
  };  

  const createAuxiliaryReturnRequest = (requestData: {
    requestedBy: string;
    requestDate: Date;
    returnType: 'regular' | 'repair';
    items: AuxiliaryReturnItem[];
    notes?: string;
  }) => {
    const newRequest: AuxiliaryReturnRequest = {
      id: `ARR-${(auxiliaryReturnRequests.length + 1).toString().padStart(3, '0')}`,
      requestNumber: `ARR-2024-${(auxiliaryReturnRequests.length + 1000).toString()}`,
      requestedBy: requestData.requestedBy,
      requestDate: requestData.requestDate,
      returnType: requestData.returnType,
      items: requestData.items,
      notes: requestData.notes,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setAuxiliaryReturnRequests(prev => [...prev, newRequest]);
    console.log('New Auxiliary Return Request:', newRequest);
    return newRequest;
  };

  const addCarrier = (carrierData: Omit<Carrier, 'id' | 'createdAt' | 'updatedAt' | 'currentLoad' | 'loadedSmallBoxes' | 'cleaningCount'>) => {
    const newCarrier: Carrier = {
      id: `CAR-${(carriers.length + 1).toString().padStart(3, '0')}`,
      ...carrierData,
      capacity: carrierData.type === 'platen' ? 9 : (carrierData.type === 'wafer-basket' ? 25 : 200),
      currentLoad: 0,
      status: 'unoccupied',
      cleaningStatus: 'good',
      cleaningCount: 0,
      loadedSmallBoxes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCarriers(prev => [...prev, newCarrier]);
    return newCarrier;
  };

  const addCarrierGroup = (groupData: Omit<CarrierGroup, 'id' | 'carrierCount' | 'carrierIds' | 'status' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    const newGroup: CarrierGroup = {
      id: `GROUP-${(carrierGroups.length + 1).toString().padStart(3, '0')}`,
      ...groupData,
      carrierCount: 0,
      carrierIds: [],
      status: 'active',
      createdBy: '系统管理员',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCarrierGroups(prev => [...prev, newGroup]);
    return newGroup;
  };

  const updateFinishedProductBatchStatus = useCallback((batchIds: string[], newStatus: FinishedProductBatch['status']) => {
    setFinishedProductBatches(prevBatches => 
      prevBatches.map(batch => 
        batchIds.includes(batch.id) 
          ? { 
              ...batch, 
              status: newStatus,
              updatedAt: new Date(),
              ...(newStatus === 'outbounded' ? { outboundTime: new Date() } : {}),
              ...(newStatus === 'shipped' ? { outboundTime: new Date() } : {})
            } 
          : batch
      )
    );
    
    console.log(`成品批次状态更新: ${batchIds.join(', ')} -> ${newStatus}`);
    return true;
  }, []);

  const scanOutboundFinishedProductBatches = useCallback((batchIds: string[], operatorName: string, warehouseLocation?: string) => {
    const batchesToUpdate = finishedProductBatches.filter(batch => 
      batchIds.includes(batch.id) && 
      (batch.status === 'approved' || batch.status === 'pending_outbound')
    );
    
    if (batchesToUpdate.length === 0) {
      console.warn('没有符合条件的成品批次可以出库');
      return false;
    }
    
    setFinishedProductBatches(prevBatches => 
      prevBatches.map(batch => 
        batchIds.includes(batch.id) && (batch.status === 'approved' || batch.status === 'pending_outbound')
          ? { 
              ...batch, 
              status: 'outbounded',
              outboundTime: new Date(),
              warehouseLocation: warehouseLocation || batch.warehouseLocation,
              operatorName: operatorName,
              updatedAt: new Date()
            } 
          : batch
      )
    );
    
    const wmsRequests = batchesToUpdate.map(batch => ({
      batchNumber: batch.batchNumber,
      productType: batch.productType,
      productName: batch.productName,
      packageCount: batch.packageCount,
      totalWafers: batch.totalWafers,
      qualityGrade: batch.qualityGrade,
      inspectionResult: batch.inspectionResult,
      warehouseLocation: warehouseLocation || batch.warehouseLocation,
      operator: operatorName,
      timestamp: new Date(),
      wmsRequestId: `WMS-INBOUND-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    }));
    
    console.log('成品批次扫码出库完成:', {
      batchIds,
      operatorName,
      warehouseLocation,
      wmsRequests,
      message: '已生成WMS入库申请'
    });
    
    alert(`成功出库 ${batchesToUpdate.length} 个成品批次，已生成WMS入库申请`);
    
    return true;
  }, [finishedProductBatches]);

  const createSavedReport = useCallback(async (report: Omit<SavedReport, 'id' | 'icon'>) => {
    try {
      const newReport = await savedReportsService.createSavedReport(report);
      setSavedReports(prev => [...prev, newReport]);
      return newReport;
    } catch (error) {
      console.error('Failed to create saved report:', error);
      throw error;
    }
  }, []);

  const deleteSavedReport = useCallback(async (id: string) => {
    try {
      await savedReportsService.deleteSavedReport(id);
      setSavedReports(prev => prev.filter(report => report.id !== id));
    } catch (error) {
      console.error('Failed to delete saved report:', error);
      throw error;
    }
  }, []);

  return {
    materials,
    carriers,
    preloadRecords,
    productionOrders,
    bomItems,
    materialPickingRequests,
    warehouseOutboundRequests,
    auxiliaryMaterials,
    lifetimeControlModels,
    auxiliaryMaterialRequests,
    processingHistoryRecords,
    loading,
    metrics: getMetrics(),
    createPreloadRecord,
    updatePreloadStep,
    updatePreloadRecordDegasInfo,
    unbindPreloadRecord,
    completePreloadRecord,
    createMaterialPickingRequest,
    createProductionOrder,
    updateProductionOrder,
    addAuxiliaryMaterial,
    updateAuxiliaryMaterial,
    deleteAuxiliaryMaterial,
    addLifetimeControlModel,
    updateLifetimeControlModel,
    deleteLifetimeControlModel,
    createAuxiliaryMaterialRequest,
    updateAuxiliaryMaterialRequest,
    deleteAuxiliaryMaterialRequest,
    approveAuxiliaryMaterialRequest,
    rejectAuxiliaryMaterialRequest,
    completeAuxiliaryMaterialRequest,
    auxiliaryReturnRequests,
    createAuxiliaryReturnRequest,
    scrapAuxiliaryMaterial,
    addCarrier,
    carrierGroups,
    addCarrierGroup,
    cleaningRecords,
    startCleaning,
    completeCleaning,
    completeCleaningTask,
    startBatchCleaning,
    getCleaningRecordsForCarrier,
    actualPickedBatches,
    returnPickedMaterialBatches,
    transferPickedMaterialBatches,
    finishedProductBatches,
    updateFinishedProductBatchStatus,
    scanOutboundFinishedProductBatches,
    products,
    productProcessStations,
    fetchAndSetProductProcessStations,
    savedReports,
    createSavedReport,
    deleteSavedReport,
    refetchSavedReports, // <--- 导出新的刷新函数
  };
};