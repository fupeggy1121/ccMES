// src/components/ProductionPlan/MaterialFeedingForm.tsx
import React, { useState, useEffect } from 'react';
import { X, Package, Beaker, Hash, Calendar, User, AlertTriangle, CheckCircle, Search, QrCode, Plus, Minus, Trash2, Zap, AlertCircle, ChevronDown } from 'lucide-react';
import { MaterialSelectionModal } from './MaterialSelectionModal';
import { CarrierBindingModule } from './CarrierBindingModule';
import PlatenSelectionModal from './PlatenSelectionModal';
import { IncomingMaterialParamsModal } from './IncomingMaterialParamsModal';
import { useData } from '../../hooks/useData';
import { PreloadRecord, MaterialSelectionRule, ProductProcessSpec } from '../../types';
import { ProcessStation } from '../../services/processRouteService';
import { useRulesForSelection } from '../../hooks/useRulesForSelection';

interface MaterialFeedingFormProps {
  workOrderId: string;
  workOrderType: string;
  workOrderProductType: string; // 新增工单产品类型属性
  workOrderStartProcessStationCode: string;
  workOrderEndProcessStationCodee: string;
  workOrderNumber: string;
  onClose: () => void;
  onSubmit: (feedingData: any, preloadRecordId?: string) => void; // Modified onSubmit to accept preloadRecordId
  currentProductProcessStations: ProcessStation[]; // 新增：接收工艺站点
  fetchAndSetProductProcessStations: (productSupabaseId: string) => void; // 新增：接收获取函数
}

// New interface for hierarchical categories (define here or in a shared types file)
export interface MaterialCategoryNode {
  id: string;
  name: string;
  level: number;
  children?: MaterialCategoryNode[];
  filterKey?: string; // 用于过滤物料的键，仅在叶子节点（小类）上设置
}

export interface LineSideRawMaterialBox {
  id: string;
  materialCode: string;
  materialName: string;
  batchNumber: string;
  lotNumber: string; // 用于衬底片编码
  boxQuantity: number; // 表示箱子的数量，通常为1
  waferCount: number; // NEW: 表示该物料（单片或箱）包含的晶圆片数
  unit: string;
  location: string;
  expiryDate: Date;
  supplier: string;
  materialType: 'raw-material';
  materialCategory: 'substrate' | 'chemical' | 'gas';
  boxId: string;
  smallCategoryFilterKey: string;
  isBox: boolean; // NEW: True if this material represents a box of wafers, false if it's a single wafer
}

interface FeedingHistoryRecord {
  feedingDate: Date;
  operator: string;
  materials: {
    materialCode: string;
    materialName: string;
    feedingQuantity: number;
    unit: string;
  }[];
  totalQuantity: number;
  lotId: string;
}

export const MaterialFeedingForm: React.FC<MaterialFeedingFormProps> = ({
  workOrderId,
  workOrderNumber,
  workOrderType,
  workOrderProductType,
  workOrderStartProcessStationCode,
  workOrderEndProcessStationCodee,
  onClose,
  onSubmit,
  currentProductProcessStations, // 使用传入的工艺站点
  fetchAndSetProductProcessStations, // 使用传入的获取函数
}) => {
  const [operator, setOperator] = useState('张三');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  // 移除 selectedMaterialBoxIds 状态，新增 fedMaterials 状态
  const [fedMaterials, setFedMaterials] = useState<LineSideRawMaterialBox[]>([]);
  const [feedingHistory, setFeedingHistory] = useState<FeedingHistoryRecord[]>([]);
  const [notes, setNotes] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedLotId, setGeneratedLotId] = useState('');
  const [showMaterialSelectionModal, setShowMaterialSelectionModal] = useState(false); // 控制物料选择模态框显示
  const [showPlatenSelectionModal, setShowPlatenSelectionModal] = useState(false); // 控制衬底盒选择模态框显示
  // 新增状态：存储 CarrierBindingModule 返回的绑定数据
  const [carrierBindings, setCarrierBindings] = useState<{ materialId: string; waferBasketId?: string; slotNumber?: number }[]>([]);
  const [selectedPreloadRecord, setSelectedPreloadRecord] = useState<PreloadRecord | null>(null); // New state to store selected PreloadRecord

  // 使用useData hook获取数据
  const { preloadRecords, carriers, materials } = useData();

  // 模拟规则数据（实际应从后端获取）
  const [mockRules] = useState<MaterialSelectionRule[]>([
    {
      id: 'rule-1',
      ruleName: '切片厚度规则',
      processStationCode: 'PS001',
      materialCategory: '导轮',
      targetMaterialAttribute: 'groovePitch',
      ruleType: 'range',
      ruleDefinition: { min: 5, max: 15 },
      drivingProductAttribute: 'slicingThicknessTarget',
      drivingLogicExpression: 'product * 0.5',
      isActive: true,
      notes: '根据产品切片厚度选择合适的导轮沟距'
    }
  ]);

  // 模拟产品工艺规范
  const mockProductProcessSpec: ProductProcessSpec = {
    productRefId: workOrderProductType,
    slicingThicknessTarget: 10,
  };

  // 规则驱动选择提示状态
  const [ruleSuggestions, setRuleSuggestions] = useState<{ruleId: string; suggestion: string}[]>([]);

  // Helper function to get process station name
  const getProcessStationName = (code: string): string => {
    const station = currentProductProcessStations.find(s => s.code === code);
    return station ? station.name : code;
  };

  // Define the hierarchical category data
  const hierarchicalMaterialCategories: MaterialCategoryNode[] = [
    {
      id: 'raw_material',
      name: '原料',
      level: 1,
      children: [
        {
          id: 'gaas_substrate',
      name: '砷化镓衬底',
      level: 2,
      children: [
            { id: 'gaas_4inch', name: '4寸', level: 3, filterKey: 'gaas_4inch' },
            { id: 'gaas_6inch', name: '6寸', level: 3, filterKey: 'gaas_6inch' },
          ],
        },
        {
          id: 'sic_substrate',
      name: '碳化硅衬底',
      level: 2,
      children: [
            { id: 'sic_4inch', name: '4寸', level: 3, filterKey: 'sic_4inch' },
            { id: 'sic_6inch', name: '6寸', level: 3, filterKey: 'sic_6inch' },
          ],
        },
        {
          id: 'gan_substrate',
      name: '氮化镓衬底',
      level: 2,
      children: [
            { id: 'gan_4inch', name: '4寸', level: 3, filterKey: 'gan_4inch' },
            { id: 'gan_6inch', name: '6寸', level: 3, filterKey: 'gan_6inch' },
          ],
        },
        {
          id: 'si_substrate',
      name: '硅衬底',
      level: 2,
      children: [
            { id: 'si_4inch', name: '4寸', level: 3, filterKey: 'si_4inch' },
            { id: 'si_6inch', name: '6寸', level: 3, filterKey: 'si_6inch' },
          ],
        },
        { id: 'chemical', name: '化学品', level: 2, filterKey: 'chemical' },
        { id: 'gas', name: '气体', level: 2, filterKey: 'gas' },
      ],
    },
  ];

  // Helper to flatten categories to get all filterKeys for initial material generation
  const getAllSmallCategoryFilterKeys = (nodes: MaterialCategoryNode[]): string[] => {
    let keys: string[] = [];
    nodes.forEach(node => {
      if (node.filterKey) {
        keys.push(node.filterKey);
      }
      if (node.children) {
        keys = keys.concat(getAllSmallCategoryFilterKeys(node.children));
      }
    });
    return keys;
  };

  const allFilterKeys = getAllSmallCategoryFilterKeys(hierarchicalMaterialCategories);

  // Generate mock LineSideRawMaterialBox data
  const generateMockMaterials = (count: number): LineSideRawMaterialBox[] => {
    const materials: LineSideRawMaterialBox[] = [];
    const suppliers = ['供应商A', '供应商B', '供应商C', '供应商D', '供应商E'];
    const locations = ['A区-01', 'A区-02', 'B区-01', 'B区-02', 'C区-01', 'C区-02', 'D区-01', 'D区-02'];
    const units = {
      substrate: '片',
      chemical: 'L',
      gas: '瓶'
    };

    for (let i = 1; i <= count; i++) {
      const categoryIndex = i % allFilterKeys.length;
      const filterKey = allFilterKeys[categoryIndex];
      let materialCode = '';
      let materialName = '';
      let boxQuantity = 1; // Default for substrates
      let unit = '片';
      let materialCategory: 'substrate' | 'chemical' | 'gas' = 'substrate'; // Default

      if (filterKey.includes('gaas') || filterKey.includes('sic') || filterKey.includes('gan') || filterKey.includes('si')) {
        materialCategory = 'substrate';
        materialCode = `SUB-${filterKey.toUpperCase()}-${i.toString().padStart(3, '0')}`;
        materialName = `${filterKey.replace('_', ' ').replace('inch', '寸').toUpperCase()}衬底`;
        boxQuantity = 1; // Substrates are 1 piece per box
        unit = units.substrate;
      } else if (filterKey === 'chemical') {
        materialCategory = 'chemical';
        materialCode = `CHEM-ACID-${i.toString().padStart(3, '0')}`;
        materialName = `化学品-${i}`;
        boxQuantity = Math.floor(Math.random() * 10) + 1; // 1-10 L
        unit = units.chemical;
      } else if (filterKey === 'gas') {
        materialCategory = 'gas';
        materialCode = `GAS-N2-${i.toString().padStart(3, '0')}`;
        materialName = `气体-${i}`;
        boxQuantity = Math.floor(Math.random() * 3) + 1; // 1-3 bottles
        unit = units.gas;
      }

      materials.push({
        id: `box-${i.toString().padStart(3, '0')}`,
        materialCode: materialCode,
        materialName: materialName,
        batchNumber: `B${Math.floor(Math.random() * 1000000).toString().padStart(7, '0')}`,
        lotNumber: `L${Math.floor(Math.random() * 1000000).toString().padStart(7, '0')}`,
        boxQuantity: boxQuantity,
        unit: unit,
        location: locations[Math.floor(Math.random() * locations.length)],
        expiryDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000), // Expires within 1 year
        supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
        materialType: 'raw-material', // Keep this as a general type
        materialCategory: materialCategory, // Use the more specific category
        boxId: `BOX-${i.toString().padStart(3, '0')}`,
        smallCategoryFilterKey: filterKey // Link to the small category filter key
      });
    }
    return materials;
  };

  // 使用 useState 的惰性初始化，确保 lineSideRawMaterialBoxes 只在组件挂载时生成一次
  const [lineSideRawMaterialBoxes] = useState<LineSideRawMaterialBox[]>(() => generateMockMaterials(50));


  const handleRemoveSelectedMaterial = (materialId: string) => {
    setFedMaterials(prev => prev.filter(material => material.id !== materialId));
    // 移除对应的载具绑定信息
    setCarrierBindings(prev => prev.filter(binding => binding.materialId !== materialId));
  };

  const generateLotId = () => {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `LOT-${timestamp}-${random}`;
  };

  const getExpiryStatus = (expiryDate: Date) => {
    const now = new Date();
    const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return { text: '已过期', color: 'text-red-500' };
    if (diffDays <= 30) return { text: '即将过期', color: 'text-orange-500' };
    return { text: '正常', color: 'text-green-500' };
  };

  const handleSubmit = () => {
    if (fedMaterials.length === 0) {
      alert('请至少选择一箱原料进行投料');
      return;
    }

    // 仅当产品类型不是“氮化镓外延片”时，才进行片篮/槽位绑定验证
    if (workOrderProductType !== '氮化镓外延片') { // 新增此行
      // 校验所有已选物料是否都已绑定片篮和槽位 (如果需要强制绑定)
      const unassignedMaterials = fedMaterials.filter(material => {
        const binding = carrierBindings.find(b => b.materialId === material.id);
        return !binding || !binding.waferBasketId || !binding.slotNumber;
      });

      if (unassignedMaterials.length > 0) {
        alert(`以下物料未完成片篮/槽位绑定，请检查：\n${unassignedMaterials.map(material => material.lotNumber || material.id).join('\n')}`);
        return;
      }
    } // 新增此行

    // Generate Lot ID
    const lotId = generateLotId();
    setGeneratedLotId(lotId);
    
    const totalQuantity = fedMaterials.reduce((sum, material) => sum + material.boxQuantity, 0);
    
    // Create feeding record for history
    const feedingRecord: FeedingHistoryRecord = {
      feedingDate: new Date(),
      operator,
      materials: fedMaterials.map(material => ({
        materialCode: material.materialCode,
        materialName: material.materialName,
        feedingQuantity: material.boxQuantity,
        unit: material.unit
      })),
      totalQuantity,
      lotId
    };
    
    // Add to feeding history
    setFeedingHistory(prev => [feedingRecord, ...prev]);

    // Prepare feeding data for submission
    const feedingData = {
      workOrderId,
      workOrderNumber,
      lotId,
      operator,
      feedingDate: new Date(),
      materials: fedMaterials.map(material => {
        const binding = carrierBindings.find(b => b.materialId === material.id);
        return {
          materialId: material.id,
          materialCode: material.materialCode,
          materialName: material.materialName,
          batchNumber: material.batchNumber,
          lotNumber: material.lotNumber,
          boxId: material.boxId,
          feedingQuantity: material.boxQuantity,
          unit: material.unit,
          location: material.location,
          waferBasketId: binding?.waferBasketId, // 从 carrierBindings 获取
          slotNumber: binding?.slotNumber,       // 从 carrierBindings 获取
        };
      }),
      notes
    };

    // Call the onSubmit callback, passing the preloadRecordId if available
    onSubmit(feedingData, selectedPreloadRecord?.id);
    
    // Show success modal
    setShowSuccessModal(true);
  };

  const handleSuccessModalClose = () => {
    // Reset form for next operation
    setFedMaterials([]);
    setCarrierBindings([]); // 清空载具绑定信息
    setSelectedPreloadRecord(null); // Clear selected preload record
    setShowSuccessModal(false);
    // onClose(); // 移除此行，以防止整个表单自动关闭
  };

  // 处理添加按钮点击事件
  const handleAddButtonClick = () => {
    console.log('当前工单产品类型:', workOrderProductType); // 添加这行日志
    // 定义外延片产品类型
    // 明确只有 '氮化镓外延片' 才弹出 PlatenSelectionModal
    if (workOrderProductType === '氮化镓外延片') {
      console.log('handleAddButtonClick: 设置 showPlatenSelectionModal 为 true');
      setShowPlatenSelectionModal(true);
    } else {
      // 其他所有产品类型（包括碳化硅外延片和砷化镓外延片）都弹出 MaterialSelectionModal
      console.log('handleAddButtonClick: 设置 showMaterialSelectionModal 为 true');
      setShowMaterialSelectionModal(true);
    }
  };

  // 处理物料选择模态框确认选择
  const handleMaterialSelectionConfirm = (selectedIds: string[]) => {
    const newSelectedBoxes = lineSideRawMaterialBoxes.filter(box => selectedIds.includes(box.id));
    setFedMaterials(prev => {
      const existingIds = new Set(prev.map(m => m.id));
      const uniqueNewMaterials = newSelectedBoxes.filter(m => !existingIds.has(m.id));
      return [...prev, ...uniqueNewMaterials];
    });
    setShowMaterialSelectionModal(false);
  };

  // 处理衬底盒选择模态框确认选择
  const handlePlatenSelectionConfirm = (record: PreloadRecord) => {
    setSelectedPreloadRecord(record); // Store the selected preload record
    const newFedWafers: LineSideRawMaterialBox[] = [];
    record.platenPositions.forEach(pos => {
      if (pos.substrateId) {
        // 从 useData 提供的 materials 数组中查找完整的衬底片信息
        const materialFromUseData = materials.find(m => m.id === pos.substrateId);
        if (materialFromUseData) {
          // 构建 LineSideRawMaterialBox 对象，代表单片衬底
          const newBox: LineSideRawMaterialBox = {
            id: materialFromUseData.id,
            materialCode: materialFromUseData.lotNumber, // 使用 lotNumber 作为物料编码
            materialName: `${materialFromUseData.specifications?.grade || ''} ${materialFromUseData.materialType === 'substrate' ? '衬底片' : materialFromUseData.materialType}`,
            batchNumber: materialFromUseData.batchId,
            lotNumber: materialFromUseData.lotNumber,
            boxQuantity: 1, // 单片衬底，数量为1
            waferCount: 1, // 单片衬底，晶圆片数为1
            unit: '片', // 单位为"片"
            location: materialFromUseData.location || 'MBE设备', // 默认位置
            expiryDate: new Date(materialFromUseData.createdAt.getTime() + 365 * 24 * 60 * 60 * 1000), // 假设有效期为创建后一年
            supplier: '内部生产', // 假设为内部生产
            materialType: 'raw-material',
            materialCategory: 'substrate',
            boxId: materialFromUseData.id, // 使用衬底片ID作为箱号
            smallCategoryFilterKey: 'substrate', // 归类为衬底
            isBox: false, // 表示这不是一个箱子，而是单片
          };
          newFedWafers.push(newBox);
        }
      }
    });

    setFedMaterials(prev => {
      const existingIds = new Set(prev.map(m => m.id));
      const uniqueNewMaterials = newFedWafers.filter(m => !existingIds.has(m.id));
      return [...prev, ...uniqueNewMaterials];
    });
    setShowPlatenSelectionModal(false);
  };

  // 模拟设备列表
  const equipmentOptions = [
    { value: 'MOCVD-01', label: 'MOCVD-01' },
    { value: 'MOCVD-02', label: 'MOCVD-02' },
    { value: 'MOCVD-03', label: 'MOCVD-03' },
    { value: 'MBE-01', label: 'MBE-01' },
    { value: 'MBE-02', label: 'MBE-02' },
    { value: 'HVPE-01', label: 'HVPE-01' },
  ];

  // 添加一个 useEffect 来监听 showPlatenSelectionModal 的变化
  useEffect(() => {
    console.log('MaterialFeedingForm Render: PlatenSelectionModal isOpen prop:', showPlatenSelectionModal);
  }, [showPlatenSelectionModal]);  

  const canSubmit = fedMaterials.length > 0 && operator.trim();
  const totalQuantity = fedMaterials.reduce((sum, material) => sum + material.boxQuantity, 0);

  return (
    <>
      {/* Main Form Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-7xl mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">原料投料</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* NEW: Basic Information Section */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <Hash className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">基本信息</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Work Order Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">工单号</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={workOrderNumber}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">投料设备</label>
                  <div className="relative">
                    <select
                      value={selectedEquipment}
                      onChange={(e) => setSelectedEquipment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">请选择设备</option>
                      {equipmentOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Operator */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">操作员</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={operator}
                      onChange={(e) => setOperator(e.target.value)}
                      className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                
                {/* Feeding Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">投料日期</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={new Date().toLocaleDateString('zh-CN')}
                      disabled
                      className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Notes - spans 2 columns */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">备注说明</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={1}
                    placeholder="请输入投料备注信息（可选）"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>{/* end grid */}
              
              {/* Conditionally render process stations for rework/OEM orders */}
              {(workOrderType === "返工工单" || workOrderType === "代工工单") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">起始工序</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={getProcessStationName(workOrderStartProcessStationCode)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">结束工序</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={getProcessStationName(workOrderEndProcessStationCodee)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Material Selection Section - NEW UI */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Package className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">输入投料物料</h3>
                </div>
                <button
                  onClick={handleAddButtonClick}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  添加
                </button>
              </div>

              {/* Rule-driven Suggestion */}
              {mockRules.some(r => r.isActive && r.processStationCode === workOrderStartProcessStationCode) && (
                <div className="mb-4 bg-blue-50 border border-blue-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">规则驱动选择建议</h4>
                      <p className="text-sm text-blue-800 mb-2">
                        根据该工单的BOM模板配置，系统可以根据规则自动推荐合适的物料。请在添加物料时留意系统提示。
                      </p>
                      <div className="text-xs text-blue-700 bg-white px-2 py-1 rounded">
                        活跃规则: {mockRules.filter(r => r.isActive).map(r => r.ruleName).join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Selected Materials Table */}
              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          衬底片编码
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          批次号
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          物料编码
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          物料名称
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          单位
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          数量
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fedMaterials.length > 0 ? (
                        fedMaterials.map(material => (
                          <tr key={material.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {material.lotNumber}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {material.batchNumber}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {material.materialCode}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {material.materialName}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {material.unit}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {material.boxQuantity}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleRemoveSelectedMaterial(material.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无已选投料物料</h3>
                            <p className="mt-1 text-sm text-gray-500">请点击"添加"按钮选择物料。</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Carrier Binding Module */}
            {workOrderProductType !== '氮化镓外延片' && fedMaterials.length > 0 && (
              <CarrierBindingModule
                selectedMaterials={fedMaterials}
                onBindingChange={setCarrierBindings} // 接收绑定数据
              />
            )}

            {/* Process Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <Hash className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-900 mb-2">投料流程说明</h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <p>1. 从线边库中选择需要投料的衬底片</p>
                    <p>2. 根据不同的衬底类型，每次选择不同的衬底数量进行投料</p>
                    <p>3. 确认投料后系统将自动生成生产批次号（Lot ID），且衬底片将从线边库扣减，开始生产流程</p>
                    <p>6. 生产批次号将用于后续的生产追溯和质量管控</p>
                  </div>
                </div>
              </div>
            </div>
          </div> 

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Beaker className="w-4 h-4" />
              确认投料
            </button>
          </div>
        </div>
      </div>

      {/* Material Selection Modal */}
      <MaterialSelectionModal
        isOpen={showMaterialSelectionModal}
        onClose={() => setShowMaterialSelectionModal(false)}
        onConfirm={handleMaterialSelectionConfirm}
        availableMaterials={lineSideRawMaterialBoxes}
        hierarchicalCategories={hierarchicalMaterialCategories}
        initialSelectedIds={fedMaterials.map(m => m.id)}
      />

      {/* Platen Selection Modal */}
      {console.log('MaterialFeedingForm Render: PlatenSelectionModal isOpen prop:', showPlatenSelectionModal)}      
      <PlatenSelectionModal
        isOpen={showPlatenSelectionModal}
        onCancel={() => setShowPlatenSelectionModal(false)}
        onConfirm={handlePlatenSelectionConfirm}
        preloadRecords={preloadRecords}
        carriers={carriers}
        materials={materials}
      />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 transform transition-all flex flex-col max-h-[90vh]">
            {/* Scrollable Content Area - 新增此 div 并添加 flex-1 overflow-y-auto */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-8">
                {/* Success Message */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">投料成功！</h3>
                  <p className="text-gray-600 mb-6">原料投料已完成，系统已自动开批生产批次</p>

                  {/* Generated Lot ID Display */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-center mb-3">
                      <Hash className="w-6 h-6 text-green-600 mr-2" />
                      <span className="text-lg font-semibold text-green-900">生产批次号</span>
                    </div>
                    <div className="text-2xl font-bold text-green-800 font-mono bg-white px-4 py-2 rounded-lg border border-green-300">
                      {generatedLotId}
                    </div>
                  </div>

                  {/* Summary Information */}
                  <div className="bg-blue-50 rounded-lg p-4 text-left space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">工单号:</span>
                      <span className="font-medium text-gray-900">{workOrderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">总投料数量:</span>
                      <span className="font-medium text-gray-900">
                        {totalQuantity.toLocaleString()} 片
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">操作员:</span>
                      <span className="font-medium text-gray-900">{operator}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">投料时间:</span>
                      <span className="font-medium text-gray-900">
                        {new Date().toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Material Box Numbers Display - 改为表格展示 */}
              <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">投料原料明细</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物料号</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物料名称</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">供应商</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">批次号</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">衬底号</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fedMaterials.length > 0 ? (
                        fedMaterials.map((material) => (
                          <tr key={material.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{material.materialCode}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{material.materialName}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{material.supplier}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{material.batchNumber}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{material.lotNumber}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            暂无投料原料明细。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-center p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0"> {/* 添加 flex-shrink-0 */}
              <button
                onClick={handleSuccessModalClose}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
              >
                <CheckCircle className="w-5 h-4" />
                确认完成
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
