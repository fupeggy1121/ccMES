// src/components/ExperimentalDeviationModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Switch, Form, Input, Select, message } from 'antd';
import { Product, ExperimentalDeviationConfig, StationDeviation, Station, EquipmentGroup, Equipment, Parameter, ParameterGroup } from '../types/Product';
// 移除 mock 数据导入
import StationDeviationConfig from './StationDeviationConfig';
import ProductBasicInfoForm from './ProductBasicInfoForm';
import ProductSpecificationsForm from './ProductSpecificationsForm';
import MainProcessStationConfig from './MainProcessStationConfig';
import api from '../api'; // 导入 api
import { // 新增：导入 mock 数据
  mockProductCategories,
  mockProductCategoryVersions,
  productTypes
} from '../data/mockData';

const { Option } = Select;
const { TextArea } = Input;

interface ExperimentalDeviationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ExperimentalDeviationConfig) => void;
  product: Product | null;
}

const ExperimentalDeviationModal: React.FC<ExperimentalDeviationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product
}) => {
  const [form] = Form.useForm();
  const [experimentalConfig, setExperimentalConfig] = useState<ExperimentalDeviationConfig>({
    enabled: false,
    deviationType: '',
    description: '',
    justification: '',
    stationDeviations: []
  });
  const [isStationDeviationModalOpen, setIsStationDeviationModalOpen] = useState(false);
  const [currentStationForDeviation, setCurrentStationForDeviation] = useState<Station | null>(null);
  
  // 新增状态：存储从 API 获取的数据
  const [equipmentGroups, setEquipmentGroups] = useState<EquipmentGroup[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [allParameters, setAllParameters] = useState<Parameter[]>([]);
  const [parameterGroups, setParameterGroups] = useState<ParameterGroup[]>([]); // 新增：存储参数组数据

  // 新增：判断 StationDeviation 是否有有意义的偏离
  const hasAnyMeaningfulDeviation = (sd: StationDeviation): boolean => {
    // 如果 sd 为 null 或 undefined，则没有有意义的偏离
    if (!sd) {
      return false;
    }

    // 使用对象解构将 stationId 属性分离出来，其余属性收集到 otherProps 中
    const { stationId, ...otherProps } = sd;
    
    // 返回 otherProps 中属性的数量是否大于 0
    return Object.keys(otherProps).length > 0;
  };

  // Initialize form when product changes
  useEffect(() => {
    if (product && product.experimentalDeviationConfig) {
      const config = product.experimentalDeviationConfig;
      // Ensure stationDeviations is always an array
      const safeConfig = {
        ...config,
        stationDeviations: config.stationDeviations || []
      };
      setExperimentalConfig(safeConfig);
      form.setFieldsValue(safeConfig);
    } else {
      setExperimentalConfig({
        enabled: false,
        deviationType: '',
        description: '',
        justification: '',
        stationDeviations: []
      });
      form.resetFields();
    }
  }, [product, form]);

  // 新增：在 useEffect 中获取数据
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const fetchedEquipmentGroups = await api.equipment.getEquipmentGroups();
        setEquipmentGroups(fetchedEquipmentGroups);

        const fetchedEquipmentList = await api.equipment.getAllEquipment();
        setEquipmentList(fetchedEquipmentList);

        const fetchedAllParameters = await api.parameters.getParameters();
        setAllParameters(fetchedAllParameters);

        // 新增：获取参数组数据
        const fetchedParameterGroups = await api.parameters.getParameterGroups();
        setParameterGroups(fetchedParameterGroups);
      } catch (error) {
        console.error('Failed to fetch initial data for ExperimentalDeviationModal:', error);
        message.error('获取设备或参数数据失败');
      }
    };

    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  const handleStationDeviationUpdate = (stationId: string, deviationToUpdate: StationDeviation | null) => {
    setExperimentalConfig(prev => {
      const existingIndex = prev.stationDeviations.findIndex(sd => sd.stationId === stationId);
      
      let updatedDeviations;
      
      if (deviationToUpdate === null || !hasAnyMeaningfulDeviation(deviationToUpdate)) {
        // Remove deviation if null or no meaningful deviations
        updatedDeviations = prev.stationDeviations.filter(sd => sd.stationId !== stationId);
      } else {
        // Ensure parameter arrays are initialized as empty arrays, not undefined
        const safeDeviation: StationDeviation = {
          ...deviationToUpdate,
          deviatedEquipmentGroups: deviationToUpdate.deviatedEquipmentGroups || [], // 修改这里
          deviatedMeasurementParameters: deviationToUpdate.deviatedMeasurementParameters || [],
          deviatedProcessParameters: deviationToUpdate.deviatedProcessParameters || [],
          deviatedSpcParameters: deviationToUpdate.deviatedSpcParameters || []
        };

        if (existingIndex >= 0) {
          // Update existing deviation
          updatedDeviations = [...prev.stationDeviations];
          updatedDeviations[existingIndex] = safeDeviation;
        } else {
          // Add new deviation
          updatedDeviations = [...prev.stationDeviations, safeDeviation];
        }
      }

      return {
        ...prev,
        stationDeviations: updatedDeviations
      };
    });
  };

  const handleOpenStationDeviationModal = (station: Station) => {
    setCurrentStationForDeviation(station);
    setIsStationDeviationModalOpen(true);
  };

  const handleCloseStationDeviationModal = () => {
    setIsStationDeviationModalOpen(false);
    setCurrentStationForDeviation(null);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      const finalConfig: ExperimentalDeviationConfig = {
        ...experimentalConfig,
        ...values,
        // Ensure stationDeviations is always defined
        stationDeviations: experimentalConfig.stationDeviations || []
      };

      onSave(finalConfig);
      message.success('实验偏离配置保存成功');
      handleClose();
    } catch (error) {
      message.error('请检查表单填写是否正确');
    }
  };

  const handleClose = () => {
    form.resetFields();
    setExperimentalConfig({
      enabled: false,
      deviationType: '',
      description: '',
      justification: '',
      stationDeviations: []
    });
    onClose();
  };

  const getStationDeviation = (stationId: string): StationDeviation | null => {
    return experimentalConfig.stationDeviations?.find(sd => sd.stationId === stationId) || null;
  };

  // No-op functions for read-only context
  const noopFunction = () => {};
  const noopUpdateFunction = () => {};

  // Calculate total parameter deviations across all station deviations
  const calculateTotalParameterDeviations = (): number => {
    if (!experimentalConfig.stationDeviations || experimentalConfig.stationDeviations.length === 0) {
      return 0;
    }

    return experimentalConfig.stationDeviations.reduce((total, stationDeviation) => {
      const measurementParams = stationDeviation.deviatedMeasurementParameters?.length || 0;
      const processParams = stationDeviation.deviatedProcessParameters?.length || 0;
      const spcParams = stationDeviation.deviatedSpcParameters?.length || 0;
      return total + measurementParams + processParams + spcParams;
    }, 0);
  };

  if (!product) {
    return null;
  }

  return (
    <Modal
      title={
        <div>
          <div>实验偏离配置</div>
          <div className="border-b border-gray-200 pb-2 mb-4"></div>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      width={1200}
      style={{ maxWidth: '90vw' }}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          保存配置
        </Button>,
      ]}
    >
      {/* Product Basic Information */}
      <div className="mb-4">      
      <ProductBasicInfoForm 
        formData={product}
        onFieldChange={noopUpdateFunction} // Changed from onFormDataChange
        isReadOnly={true}
        isEditingExistingProduct={true}
        productCategories={mockProductCategories} // 新增：传递 productCategories
        productCategoryVersions={mockProductCategoryVersions} // 新增：传递 productCategoryVersions
        productTypes={productTypes} // 新增：传递 productTypes
      />
      </div>        

      {/* Product Specifications */}
      <div className="mb-4">       
      <ProductSpecificationsForm 
        specifications={product.specifications} 
        updateSpecification={noopUpdateFunction} // Changed from onSpecificationsChange
        isReadOnly={true}
      />
      </div>         

      {/* Process Configuration */}
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">工艺配置</h3>
        {/* Main Process Path Display */}
        <div className="mb-6">
          <h3 className="text-m font-medium mb-2">主工艺路径</h3>
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <span className="font-medium">主路径: </span>
            {product.mainProcessPath || '未配置'}
          </div>
          
          {/* Main Process Stations */}
          {product.processStations && product.processStations.length > 0 && (
            <div className="space-y-6">
              <MainProcessStationConfig 
                stations={product.processStations} 
                isReadOnly={true}
                onUpdateStationField={noopUpdateFunction}
                onOpenParameterModal={() => {}}
                onOpenRemarksModal={() => {}}
                onConfigureDeviation={handleOpenStationDeviationModal}
                equipmentGroups={equipmentGroups} // 传递从 API 获取的设备组数据
                equipmentList={equipmentList} // 传递从 API 获取的设备列表数据
                showDeviationButton={true}
                productStationSubPathOverrides={[]}
                onConfigureSubPaths={noopFunction}
                parameterGroups={parameterGroups} // 传递从 API 获取的参数组数据
              />
            </div>
          )}
        </div>
      </div>

      {/* Station Deviation Configuration Modal */}
      <Modal
        open={isStationDeviationModalOpen}
        onCancel={handleCloseStationDeviationModal}
        title={`当前站点偏离配置 - ${currentStationForDeviation?.stationName || ''}`}
        width={1200}
        footer={null}
      >
        {currentStationForDeviation && (
          <StationDeviationConfig
            station={currentStationForDeviation}
            deviation={getStationDeviation(currentStationForDeviation.id)}
            onUpdateDeviation={handleStationDeviationUpdate}
            isReadOnly={false}
            equipmentGroups={equipmentGroups} // 传递从 API 获取的设备组数据
            equipmentList={equipmentList}     // 传递从 API 获取的设备列表数据
            allParameters={allParameters}     // 传递从 API 获取的参数数据
          />
        )}
      </Modal>

    </Modal>
  );
};

export default ExperimentalDeviationModal;
