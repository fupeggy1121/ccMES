// src/components/Auxiliary/LifetimeControlModelForm.tsx
import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Divider,
  message,
  InputNumber,
  Tooltip,
  Modal,
} from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';

// 从本地导入 AuxiliaryMaterialSelectionModal 组件
import AuxiliaryMaterialSelectionModal from './AuxiliaryMaterialSelectionModal';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

// 从统一类型文件导入
import { Material, Device, LifetimeControlModel, MaterialConfig, AuxiliaryMaterial } from '../../types';

interface LifetimeControlModelFormProps {
  initialData?: LifetimeControlModel;
  materials: AuxiliaryMaterial[]; // 修改为 AuxiliaryMaterial[] 类型
  devices: Device[];
  onSubmit: (data: LifetimeControlModel) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const LifetimeControlModelForm: React.FC<LifetimeControlModelFormProps> = ({
  initialData,
  materials,
  devices,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [showAuxiliarySelectionModal, setShowAuxiliarySelectionModal] = useState(false);
  const [currentMaterialConfigIndex, setCurrentMaterialConfigIndex] = useState<number | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(
    new Set(initialData?.materialConfigs?.map((mc) => mc.auxiliaryId) || []), // 基于 auxiliaryId 进行过滤
  );

  // 确保 Form.useWatch 在组件顶层调用
  const materialConfigs = Form.useWatch('materialConfigs', form) || [];

  // 单位映射
  const unitMap: { [key: string]: string } = {
    by_time: '天',
    by_batch: '批次',
    by_wafer: '片',
    custom: '单位',
  };

  // 计算方式选项
  const calculationMethodOptions = ['by_time', 'by_batch', 'by_wafer', 'custom'];

  useEffect(() => {
    if (initialData) {
      // 转换旧数据格式到新格式（向后兼容）
      const formData = {
        ...initialData,
        name: initialData.name || initialData.modelName || '',
        deviceIds: initialData.deviceIds || initialData.relatedEquipment || [],
        materialConfigs: initialData.materialConfigs?.map(mc => ({
          ...mc,
          // 确保 auxiliaryId 存在，如果旧数据中没有则使用 materialId
          auxiliaryId: mc.auxiliaryId || mc.materialId,
          // 确保 materialCode 存在
          materialCode: mc.materialCode || mc.materialId,
          // 确保 auxiliaryGroup 存在
          auxiliaryGroup: mc.auxiliaryGroup || '',
        })) || []
      };
      form.setFieldsValue(formData);
      
      // 更新已选中的辅料ID集合
      if (initialData.materialConfigs) {
        const auxiliaryIds = initialData.materialConfigs.map(mc => mc.auxiliaryId || mc.materialId).filter(Boolean);
        setSelectedMaterials(new Set(auxiliaryIds));
      }
    }
  }, [initialData, form]);

  const handleSubmit = async (values: any) => {
    try {
      const submitData: LifetimeControlModel = {
        ...values,
        materialConfigs: values.materialConfigs?.map((mc: MaterialConfig) => ({
          auxiliaryId: mc.auxiliaryId,
          materialCode: mc.materialCode,
          materialName: mc.materialName,
          calculationMethod: mc.calculationMethod,
          ratedLifetime: mc.ratedLifetime,
          auxiliaryGroup: mc.auxiliaryGroup, // 添加辅料组字段
        })) || [],
        // 向后兼容字段
        modelName: values.name,
        relatedMaterials: values.materialConfigs?.map((mc: MaterialConfig) => mc.materialName) || [],
        relatedEquipment: values.deviceIds || []
      };
      await onSubmit(submitData);
    } catch (error) {
      message.error('提交失败，请重试');
    }
  };

  const handleMaterialSelection = (index: number, auxiliaryId: string) => {
    const newSelected = new Set(selectedMaterials);
    const oldAuxiliaryId = form.getFieldValue(['materialConfigs', index, 'auxiliaryId']);
    if (oldAuxiliaryId) {
      newSelected.delete(oldAuxiliaryId);
    }
    newSelected.add(auxiliaryId);
    setSelectedMaterials(newSelected);
  };

  // 基于 auxiliaryId 进行过滤
  const availableMaterials = materials.filter(
    (material) => !selectedMaterials.has(material.id),
  );

  const handleAuxiliarySelect = (selectedMaterial: { id: string; code: string; name: string; group?: string }) => {
    if (currentMaterialConfigIndex !== null) {
      form.setFieldsValue({
        materialConfigs: {
          [currentMaterialConfigIndex]: {
            auxiliaryId: selectedMaterial.id, // 设置 auxiliaryId
            materialCode: selectedMaterial.code, // 设置 materialCode
            materialName: selectedMaterial.name, // 设置 materialName
            auxiliaryGroup: selectedMaterial.group || '', // 设置 auxiliaryGroup
          },
        },
      });

      handleMaterialSelection(currentMaterialConfigIndex, selectedMaterial.id);
    }

    setShowAuxiliarySelectionModal(false);
    setCurrentMaterialConfigIndex(null);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        name: '',
        description: '',
        deviceIds: [],
        materialConfigs: [],
      }}
    >
      {/* 基本信息区域 */}
      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.deviceIds !== currentValues.deviceIds
        }
      >
        {() => (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">基本信息</h3>
            <div className="grid grid-cols-2 gap-x-8">
              <Form.Item
                label="模型名称"
                name="name"
                rules={[{ required: true, message: '请输入模型名称' }]}
              >
                <Input placeholder="请输入模型名称" />
              </Form.Item>

              <Form.Item
                label="关联设备"
                name="deviceIds"
                rules={[{ required: true, message: '请选择关联设备' }]}
              >
                <Select mode="multiple" placeholder="请选择设备">
                  {devices.map((device) => (
                    <Option key={device.id} value={device.id}>
                      {device.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="描述"
                name="description"
                rules={[{ required: true, message: '请输入描述' }]}
                className="col-span-1"
              >
                <TextArea rows={1} placeholder="请输入描述" />
              </Form.Item>
            </div>
          </div>
        )}
      </Form.Item>

      <Divider />

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">辅料寿命配置</h3>

        {/* Table Header */}
        <div className="grid grid-cols-6 gap-4 px-4 py-2 bg-gray-50 font-medium text-gray-700 border-b border-gray-200 rounded-t-lg">
          <div>辅料ID</div>
          <div>辅料组</div>
          <div className="col-span-1">选择辅料</div>
          <div>寿命计算方式</div>
          <div>额定寿命值</div>
          <div>操作</div>
        </div>

        <Form.List name="materialConfigs">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => {
                const { key, name, ...restField } = field;
                const currentCalculationMethod = materialConfigs[name]?.calculationMethod;
                const unit = unitMap[currentCalculationMethod] || '单位';

                return (
                  <div
                    key={key}
                    className="grid grid-cols-6 gap-4 items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
                  >
                    {/* 辅料ID字段 - 不再隐藏，显示为只读 */}
                    <Form.Item
                      {...restField}
                      name={[name, 'auxiliaryId']}
                      rules={[{ required: true, message: '辅料ID不能为空' }]}
                      className="mb-0"
                    >
                      <Input readOnly placeholder="辅料ID" />
                    </Form.Item>

                    {/* 辅料组字段 */}
                    <Form.Item
                      {...restField}
                      name={[name, 'auxiliaryGroup']}
                      className="mb-0"
                    >
                      <Input readOnly placeholder="辅料组" />
                    </Form.Item>

                    {/* 隐藏的 materialCode 字段 */}
                    <Form.Item
                      {...restField}
                      name={[name, 'materialCode']}
                      hidden
                    >
                      <Input />
                    </Form.Item>

                    {/* 选择辅料 */}
                    <div className="col-span-1">
                      <Space.Compact style={{ width: '100%' }}>
                        <Form.Item
                          {...restField}
                          name={[name, 'materialName']}
                          className="mb-0 flex-1"
                          rules={[{ required: true, message: '请选择辅料' }]}
                        >
                          <Input 
                            placeholder="请选择辅料" 
                            readOnly 
                            addonAfter={
                              <Button 
                                type="link" 
                                size="small" 
                                icon={<PlusOutlined />}
                                onClick={() => {
                                  setCurrentMaterialConfigIndex(name);
                                  setShowAuxiliarySelectionModal(true);
                                }}
                              >
                                选择
                              </Button>
                            }
                          />
                        </Form.Item>
                      </Space.Compact>
                      <div className="text-xs text-gray-500 mt-1">
                        {form.getFieldValue(['materialConfigs', name, 'materialName']) }
                        {form.getFieldValue(['materialConfigs', name, 'materialCode']) && 
                          ` (编码: ${form.getFieldValue(['materialConfigs', name, 'materialCode'])})`
                        }
                      </div>
                    </div>

                    {/* 计算方式 */}
                    <div>
                      <Form.Item
                        {...restField}
                        name={[name, 'calculationMethod']}
                        rules={[{ required: true, message: '请选择计算方式' }]}
                        className="mb-0"
                      >
                        <Select placeholder="请选择计算方式">
                          {calculationMethodOptions.map((method) => (
                            <Option key={method} value={method}>
                              {method === 'by_time' ? '按时间' : method === 'by_batch' ? '按加工批次' : method === 'by_wafer' ? '按加工片数' : '自定义'}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>

                    {/* 额定寿命值 + 单位 */}
                    <div>
                      <Form.Item
                        {...restField}
                        name={[name, 'ratedLifetime']}
                        rules={[
                          { required: true, message: '请输入额定寿命值' },
                          {
                            pattern: /^[1-9]\d*$/,
                            message: '请输入正整数',
                          },
                        ]}
                        className="mb-0"
                      >
                        <InputNumber
                          placeholder="请输入额定寿命值"
                          min={1}
                          style={{ width: '100%' }}
                          addonAfter={unit}
                        />
                      </Form.Item>
                    </div>

                    {/* 操作 */}
                    <div className="flex ">
                      <Tooltip title="删除此辅料配置">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            const auxiliaryId = form.getFieldValue([
                              'materialConfigs',
                              name,
                              'auxiliaryId',
                            ]);
                            setSelectedMaterials((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete(auxiliaryId);
                              return newSet;
                            });
                            remove(name);
                          }}
                        />
                      </Tooltip>
                    </div>
                  </div>
                );
              })}

              <div className="px-4 py-3">
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  disabled={availableMaterials.length === 0}
                >
                  添加辅料配置
                </Button>
                {availableMaterials.length === 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    所有可用辅料已添加完毕
                  </div>
                )}
              </div>
            </>
          )}
        </Form.List>
      </div>

      {/* 辅料选择模态框 */}
      <AuxiliaryMaterialSelectionModal
        visible={showAuxiliarySelectionModal}
        onCancel={() => {
          setShowAuxiliarySelectionModal(false);
          setCurrentMaterialConfigIndex(null);
        }}
        onSelect={handleAuxiliarySelect}
      />

      {/* 提交/取消 */}
      <Form.Item style={{ marginTop: 24 }}>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            提交
          </Button>
          <Button onClick={onCancel}>取消</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default LifetimeControlModelForm;