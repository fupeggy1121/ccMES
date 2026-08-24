// src/components/ProductModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { 
  Product, 
  ProductSpecifications, 
  Station, 
  Parameter, 
  ProductStatus, 
  ProductStationSubPathOverride,
  EquipmentGroup,
  Equipment,
  ParameterGroup
} from '../types/Product';
import {
  mockProductCategories,
  mockProductCategoryVersions,
  productTypes
} from '../data/mockData';
import ParameterSelectionModal from './ParameterSelectionModal';
import RemarksModal from './RemarksModal';
import MainProcessStationConfig from './MainProcessStationConfig';
import ProductSpecificationsForm from './ProductSpecificationsForm';
import StationSubPathConfigModal from './StationSubPathConfigModal';
import ProductBasicInfoForm from './ProductBasicInfoForm';
import api from '../api';
import { enrichStationWithDefaults } from '../utils/stationEnrichment';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
  onSubmitApproval?: () => void;
  product?: Product | null;
  title: string;
  status?: ProductStatus;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSubmitApproval,
  product,
  title,
  status = 'DRAFT'
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    productCode: '',
    productName: '',
    productCategory: '',
    productCategoryVersion: '',
    productType: '',
    customerName: '',
    description: '',
    mainProcessRouteId: '',
    specifications: {
      type: '',
      thicknessMultiplier: '',
      backSeal: '',
      crystal: 0,
      thickness: 0,
      method: '',
      diameter: 0,
      chamfer: '',
      dopant: '',
      cleaningMethod: '',
      referenceSurface: '',
      polishing: ''
    },
    processStations: [],
    stationSubPathOverrides: [],
  });

  const [stationSubPathModalState, setStationSubPathModalState] = useState<{
    isOpen: boolean;
    station: Station | null;
  }>({
    isOpen: false,
    station: null
  });

  // 新增：从API获取的数据状态
  const [equipmentGroups, setEquipmentGroups] = useState<EquipmentGroup[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [parameterGroups, setParameterGroups] = useState<ParameterGroup[]>([]);
  const [allParameters, setAllParameters] = useState<Parameter[]>([]);
  
  const [mainProcessPathOptions, setMainProcessPathOptions] = useState<{ id: string; name: string; }[]>([]);
  const [subProcessPathOptions, setSubProcessPathOptions] = useState<StationSubPath[]>([]);

  const isReadOnly = status === 'PENDING_APPROVAL' || status === 'ACTIVE';
  const showSubmitApproval = status === 'DRAFT' || status === 'REJECTED';
  const isEditingExistingProduct = !!product?.id;

  const [parameterModalState, setParameterModalState] = useState<{
    isOpen: boolean;
    title: string;
    parameters: Parameter[];
    selectedParameters: Parameter[];
    stationId: string;
    configType: 'main' | 'sub';
    subConfigId?: string;
    parameterType: 'measurement' | 'process' | 'spc';
    stationParameterGroups: ParameterGroup[]; // 新增
    initialSelectedParameterGroupIds: string[]; // 新增
    initialSamplingRule?: string;
  }>({
    isOpen: false,
    title: '',
    parameters: [],
    selectedParameters: [],
    stationId: '',
    configType: 'main',
    parameterType: 'measurement',
    stationParameterGroups: [], // 新增
    initialSelectedParameterGroupIds: [], // 新增
    initialSamplingRule: '',
  });

  const [remarksModalState, setRemarksModalState] = useState<{
    isOpen: boolean;
    stationId: string;
    configType: 'main' | 'sub';
    subConfigId?: string;
    remarks: string[];
  }>({
    isOpen: false,
    stationId: '',
    configType: 'main',
    remarks: []
  });

  // 获取所有必要的数据
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 获取设备组
        const equipmentGroupsData = await api.equipment.getEquipmentGroups();
        setEquipmentGroups(equipmentGroupsData);

        // 获取所有设备
        const allEquipmentData = await api.equipment.getAllEquipment();
        setEquipmentList(allEquipmentData);

        // 获取参数组
        const parameterGroupsData = await api.parameters.getParameterGroups();
        setParameterGroups(parameterGroupsData);

        // 获取所有参数
        const parametersData = await api.parameters.getParameters();
        setAllParameters(parametersData);

        // 获取工艺路径选项
        const mainPaths = await api.processRoutes.getAllProcessRoutes();
        setMainProcessPathOptions(mainPaths);

        const subPaths = await api.processRoutes.getAllSubProcessRoutes();
        setSubProcessPathOptions(subPaths);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    if (isOpen) {
      fetchAllData();
    }
  }, [isOpen]);

  // 初始化 formData
  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        mainProcessRouteId: product.mainProcessRouteId || '',
        stationSubPathOverrides: product.stationSubPathOverrides || [],
      });
    } else {
      setFormData({
        productCode: '',
        productName: '',
        productCategory: '',
        productCategoryVersion: '',
        productType: '',
        customerName: '',
        description: '',
        mainProcessRouteId: '',
        specifications: {
          type: '',
          thicknessMultiplier: '',
          backSeal: '',
          crystal: 0,
          thickness: 0,
          method: '',
          diameter: 0,
          chamfer: '',
          dopant: '',
          cleaningMethod: '',
          referenceSurface: '',
          polishing: ''
        },
        processStations: [],
        stationSubPathOverrides: [],
      });
    }
  }, [product]);

  // 新增 useEffect 钩子，用于在加载现有产品时填充 processStations
  useEffect(() => {
    const populateStationsForExistingProduct = async () => {
      if (product && product.mainProcessRouteId && (!formData.processStations || formData.processStations.length === 0)) {
        // 使用 product.mainProcessRouteId 直接获取站点
        const basicStations = await api.processRoutes.getStationsForRoute(product.mainProcessRouteId);
        const availableSubPaths = await api.processRoutes.getAllSubProcessRoutes();

        // 并行处理站点丰富
        const stationsPromises = basicStations.map(async bs =>
          enrichStationWithDefaults(bs as any, availableSubPaths)
        );
        
        const stations: Station[] = await Promise.all(stationsPromises);
        
        setFormData(prev => ({
          ...prev,
          processStations: stations,
        }));
      }
    };

    // 只有当数据加载完成后才执行
    if (isOpen && equipmentGroups.length > 0 && parameterGroups.length > 0) {
      populateStationsForExistingProduct();
    }
  }, [product, formData.processStations, formData.mainProcessRouteId, equipmentGroups, parameterGroups, subProcessPathOptions, isOpen]);

  const handleBasicInfoChange = (field: keyof Product, value: string) => {
    if (isReadOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateSpecification = (field: keyof ProductSpecifications, value: any) => {
    if (isReadOnly) return;

    setFormData({
      ...formData,
      specifications: {
        ...formData.specifications!,
        [field]: value
      }
    });
  };

  const handleMainProcessPathChange = async (routeId: string) => {
    if (isReadOnly) return;

    setFormData(prev => ({ ...prev, mainProcessRouteId: routeId }));

    if (routeId) {
      const basicStations = await api.processRoutes.getStationsForRoute(routeId);
      const availableSubPaths = await api.processRoutes.getAllSubProcessRoutes();

      // 并行处理站点丰富
      const stationsPromises = basicStations.map(async bs =>
        enrichStationWithDefaults(bs as any, availableSubPaths)
      );
      
      const stations: Station[] = await Promise.all(stationsPromises);
      
      setFormData(prev => ({
        ...prev,
        processStations: stations,
        stationSubPathOverrides: []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        processStations: [],
        stationSubPathOverrides: []
      }));
    }
  };

  const updateStationField = (stationId: string, field: keyof Station, value: any, configType: 'main' | 'sub' = 'main', subConfigId?: string) => {
    if (isReadOnly) return;

    if (configType === 'main') {
      setFormData(prev => ({
        ...prev,
        processStations: prev.processStations?.map(station =>
          station.id === stationId ? { ...station, [field]: value } : station
        ) || []
      }));
    }
  };

  const openParameterModal = async (stationId: string, parameterType: 'measurement' | 'process' | 'spc', configType: 'main' | 'sub' = 'main', subConfigId?: string) => {
    if (isReadOnly) return;

    let station: Station | undefined;
    if (configType === 'main') {
      station = formData.processStations?.find(s => s.id === stationId);
    }
    // ... (如果需要处理 subConfigId 对应的站点)

    if (!station) {
      console.error(`[ProductModal] Station not found for ID: ${stationId}`);
      return;
    }

    let parameters: Parameter[] = [];
    let selectedParameters: Parameter[] = [];
    let modalTitle = '';

    console.log(`[ProductModal] openParameterModal for station: ${station.stationName} (ID: ${station.id}), parameterType: ${parameterType}`);
    console.log(`[ProductModal] Station parameter_group_ids:`, station.parameter_group_ids);

    // 从所有参数中筛选出相关类型的参数
    if (station.parameter_group_ids && station.parameter_group_ids.length > 0) {
      // 直接获取这些参数组下的所有参数
      const allStationParams = await api.parameters.getParameters(station.parameter_group_ids);
      console.log(`[ProductModal] Fetched allStationParams for station ${station.name}:`, allStationParams);

      // 此时 parameters 包含所有相关参数，过滤将在 ParameterSelectionModal 内部进行
      parameters = allStationParams;
    } else {
      console.log(`[ProductModal] No parameter_group_ids for station: ${station.name} (ID: ${station.id})`);
    }

    // 获取已选中的参数 (这里需要从 station.measurementParameters 等字段获取)
    switch (parameterType) {
      case 'measurement':
        selectedParameters = station.measurementParameters || [];
        modalTitle = '选择量测参数';
        break;
      case 'process':
        selectedParameters = station.processParameters || [];
        modalTitle = '选择工艺参数';
        break;
      case 'spc':
        selectedParameters = station.spcParameters || [];
        modalTitle = '选择SPC管控参数';
        break;
    }

    // --- ADD LOGS HERE ---
    console.log("[ProductModal] Passing to ParameterSelectionModal:");
    console.log("  stationParameterGroups:", station.parameterGroups); // This is the key prop
    console.log("  initialSelectedParameterGroupIds:", station.parameter_group_ids);
    // --- END LOGS ---

    setParameterModalState({
      isOpen: true,
      title: modalTitle,
      parameters,
      selectedParameters,
      stationId,
      configType,
      subConfigId,
      parameterType,
      stationParameterGroups: station.parameterGroups || [], // 新增：传递站点的参数组
      initialSelectedParameterGroupIds: station.parameter_group_ids || [], // 新增：传递站点已选中的参数组 ID
      initialSamplingRule: station.samplingRule || '',
    });
  };

  const handleParameterSave = (selectedParams: Parameter[], samplingRule?: string) => {
    if (isReadOnly) return;

    const { stationId, parameterType, configType, subConfigId } = parameterModalState;
    
    // 更新站点中的参数数组
    let field: keyof Station;
    switch (parameterType) {
      case 'measurement':
        field = 'measurementParameters';
        break;
      case 'process':
        field = 'processParameters';
        break;
      case 'spc':
        field = 'spcParameters';
        break;
      default:
        field = 'measurementParameters';
    }

    updateStationField(stationId, field, selectedParams, configType, subConfigId);
    if (parameterType === 'measurement' && samplingRule !== undefined) {
      updateStationField(stationId, 'samplingRule', samplingRule, configType, subConfigId);
    }
    setParameterModalState(prev => ({ ...prev, isOpen: false }));
  };

  const openRemarksModal = (stationId: string, configType: 'main' | 'sub' = 'main', subConfigId?: string) => {
    if (isReadOnly) return;

    let station: Station | undefined;

    if (configType === 'main') {
      station = formData.processStations?.find(s => s.id === stationId);
    }

    if (!station) return;

    setRemarksModalState({
      isOpen: true,
      stationId,
      configType,
      subConfigId,
      remarks: station.remarks
    });
  };

  const handleRemarksSave = (remarks: string[]) => {
    if (isReadOnly) return;

    const { stationId, configType, subConfigId } = remarksModalState;
    updateStationField(stationId, 'remarks', remarks, configType, subConfigId);
    setRemarksModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleConfigureSubPaths = (station: Station) => {
    if (isReadOnly) return;

    setStationSubPathModalState({
      isOpen: true,
      station
    });
  };

  const handleSaveSubPathOverrides = (overrides: ProductStationSubPathOverride[]) => {
    if (isReadOnly) return;

    setFormData(prev => {
      const existingOverrides = prev.stationSubPathOverrides || [];
      const newOverrides = [...existingOverrides];

      overrides.forEach(newOverride => {
        const existingIndex = newOverrides.findIndex(
          o => o.stationId === newOverride.stationId && o.subPathId === newOverride.subPathId
        );

        if (existingIndex >= 0) {
          newOverrides[existingIndex] = newOverride;
        } else {
          newOverrides.push(newOverride);
        }
      });

      return {
        ...prev,
        stationSubPathOverrides: newOverrides
      };
    });

    setStationSubPathModalState({ isOpen: false, station: null });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { subProcessConfigs, ...dataToSave } = formData;
    onSave(dataToSave);
    onClose();
  };

  const handleSubmitApproval = () => {
    if (onSubmitApproval) {
      onSubmitApproval();
    }
    onClose();
  };

  if (!isOpen) return null;

  const statusMap: Record<ProductStatus, string> = {
    DRAFT: '草稿',
    PENDING_APPROVAL: '待审批',
    ACTIVE: '激活',
    REJECTED: '已驳回',
    ARCHIVED: '已归档'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {status && (
              <p className="text-sm text-gray-600 mt-1">
                状态: {statusMap[status]}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-8">
            <ProductBasicInfoForm
              formData={formData}
              onFieldChange={handleBasicInfoChange}
              isReadOnly={isReadOnly}
              isEditingExistingProduct={isEditingExistingProduct}
              productCategories={mockProductCategories}
              productCategoryVersions={mockProductCategoryVersions}
              productTypes={productTypes}
            />

            <ProductSpecificationsForm
              specifications={formData.specifications!}
              isReadOnly={isReadOnly}
              updateSpecification={updateSpecification}
            />

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">工艺配置</h3>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  工艺主路径 *
                </label>
                <select
                  value={formData.mainProcessRouteId || ''}
                  onChange={(e) => handleMainProcessPathChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  disabled={isReadOnly}
                >
                  <option value="">请选择工艺主路径</option>
                  {mainProcessPathOptions.map(path => (
                    <option key={path.id} value={path.id}>{path.name}</option>
                  ))}
                </select>
              </div>

              {formData.mainProcessRouteId && formData.processStations && formData.processStations.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">主路径站点配置</h4>
                  <MainProcessStationConfig
                    stations={formData.processStations}
                    isReadOnly={isReadOnly}
                    productStationSubPathOverrides={formData.stationSubPathOverrides || []}
                    onUpdateStationField={updateStationField}
                    onOpenParameterModal={(stationId, parameterType) => openParameterModal(stationId, parameterType, 'main')}
                    onOpenRemarksModal={(stationId) => openRemarksModal(stationId, 'main')}
                    onConfigureSubPaths={handleConfigureSubPaths}
                    onConfigureDeviation={() => {}}
                    equipmentGroups={equipmentGroups} // 传递
                    equipmentList={equipmentList}     // 传递
                    parameterGroups={parameterGroups} // 传递
                    showDeviationButton={false}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              取消
            </button>

            {!isReadOnly && (
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                保存
              </button>
            )}

            {showSubmitApproval && (
              <button
                type="button"
                onClick={handleSubmitApproval}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                提交审批
              </button>
            )}
          </div>
        </form>

        <ParameterSelectionModal
          isOpen={parameterModalState.isOpen}
          onClose={() => setParameterModalState(prev => ({ ...prev, isOpen: false }))}
          title={parameterModalState.title}
          parameters={parameterModalState.parameters}
          selectedParameters={parameterModalState.selectedParameters}
          onSave={handleParameterSave}
          stationParameterGroups={parameterModalState.stationParameterGroups} // 新增
          initialSelectedParameterGroupIds={parameterModalState.initialSelectedParameterGroupIds} // 新增
          parameterType={parameterModalState.parameterType}
          initialSamplingRule={parameterModalState.initialSamplingRule}
        />

        <RemarksModal
          isOpen={remarksModalState.isOpen}
          onClose={() => setRemarksModalState(prev => ({ ...prev, isOpen: false }))}
          remarks={remarksModalState.remarks}
          onSave={handleRemarksSave}
        />

<StationSubPathConfigModal
  isOpen={stationSubPathModalState.isOpen}
  onClose={() => setStationSubPathModalState({ isOpen: false, station: null })}
  station={stationSubPathModalState.station}
  productStationSubPathOverrides={formData.stationSubPathOverrides || []}
  onSaveOverrides={handleSaveSubPathOverrides}
  subProcessPathOptions={subProcessPathOptions}
  equipmentGroups={equipmentGroups} // 传递
  equipmentList={equipmentList}     // 传递
  parameterGroups={parameterGroups} // 传递
/>
      </div>
    </div>
  );
}

export default ProductModal;
