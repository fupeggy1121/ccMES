// src/components/form-template/FieldConfigDrawer.tsx
import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Switch, Select, InputNumber, Button, Space, Divider, message } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { FormField, FieldValidation, SelectOption as FieldOption } from '../../../types/form';

const { Option } = Select;
const { TextArea } = Input;

interface FieldConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  field: FormField | null;
  onUpdateField: (field: FormField) => void;
}

// 预设量测参数定义 - 确保系统默认列的 isSystem: true 和 editable: false
const predefinedMeasurementParameters = [
  { label: 'WAFER ID', key: 'waferId', type: 'text', unit: '', isSystem: true },
  { label: 'SUBLOT ID', key: 'sublotId', type: 'text', unit: '', isSystem: true },
  { label: 'LOT ID', key: 'lotId', type: 'text', unit: '', isSystem: true },
  { label: '厚度', key: 'thickness', type: 'decimal', unit: 'μm', isSystem: false },
  { label: '宽度', key: 'width', type: 'decimal', unit: 'mm', isSystem: false },
  { label: '长度', key: 'length', type: 'decimal', unit: 'mm', isSystem: false },
  { label: '电阻', key: 'resistance', type: 'decimal', unit: 'Ω', isSystem: false },
  { label: '电压', key: 'voltage', type: 'decimal', unit: 'V', isSystem: false },
  { label: '电流', key: 'current', type: 'decimal', unit: 'A', isSystem: false },
  { label: '温度', key: 'temperature', type: 'decimal', unit: '°C', isSystem: false },
  { label: '压力', key: 'pressure', type: 'decimal', unit: 'Pa', isSystem: false },
  { label: '时间', key: 'time', type: 'decimal', unit: 's', isSystem: false },
  { label: '频率', key: 'frequency', type: 'decimal', unit: 'Hz', isSystem: false },
];

const FieldConfigDrawer: React.FC<FieldConfigDrawerProps> = ({
  isOpen,
  onClose,
  field,
  onUpdateField,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 获取系统默认列（Wafer ID、Sublot ID、Lot ID）- 确保 editable: false
  const getSystemColumns = () => {
    return predefinedMeasurementParameters
      .filter(param => param.isSystem)
      .map(param => ({
        label: param.label,
        key: param.key,
        type: param.type,
        unit: param.unit,
        editable: false,
        isSystem: true
      }));
  };

  // 当字段变化时重置表单 - 优化初始化逻辑
  useEffect(() => {
    if (field) {
      // 对于 measurement_entry 类型，确保有默认的 measurementConfig
      if (field.type === 'measurement_entry') {
        const measurementConfig = field.measurementConfig || {};
        
        // 默认设置为 'retest_site_params'
        if (!measurementConfig.measurementSourceType) {
          measurementConfig.measurementSourceType = 'retest_site_params';
        }
        
        // 确保有系统默认列
        const systemColumns = getSystemColumns();
        
        // 根据 measurementSourceType 设置不同的 columns
        if (measurementConfig.measurementSourceType === 'retest_site_params') {
          // 复测站点参数模式：只包含系统默认列
          measurementConfig.columns = systemColumns;
        } else if (measurementConfig.measurementSourceType === 'manual_selection') {
          // 手动选择模式：包含系统默认列和已有的非系统列
          const existingNonSystemColumns = (measurementConfig.columns || [])
            .filter((col: any) => !col.isSystem);
          measurementConfig.columns = [...systemColumns, ...existingNonSystemColumns];
        } else {
          // 其他情况确保至少包含系统默认列
          if (!measurementConfig.columns || measurementConfig.columns.length === 0) {
            measurementConfig.columns = systemColumns;
          } else {
            // 确保系统列存在
            const hasAllSystemColumns = systemColumns.every(systemCol =>
              measurementConfig.columns.some((col: any) => col.key === systemCol.key)
            );
            
            if (!hasAllSystemColumns) {
              // 添加缺失的系统列
              const existingNonSystemColumns = measurementConfig.columns.filter((col: any) => 
                !systemColumns.some(systemCol => systemCol.key === col.key)
              );
              measurementConfig.columns = [...systemColumns, ...existingNonSystemColumns];
            }
          }
        }
        
        form.setFieldsValue({
          ...field,
          measurementConfig
        });
      } else if (field.type === 'equipment_entry') {
        // 对于 equipment_entry 类型，确保有默认的 equipmentEntryConfig
        const equipmentEntryConfig = field.equipmentEntryConfig || {
          dataSource: '',
          searchable: false,
          supportScan: false,
          displayField: '',
          valueField: ''
        };
        
        form.setFieldsValue({
          ...field,
          equipmentEntryConfig
        });
      } else {
        form.setFieldsValue(field);
      }
    } else {
      form.resetFields();
    }
  }, [field, form]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      if (field) {
        const updatedField = {
          ...field,
          ...values,
        };
        onUpdateField(updatedField);
        message.success('字段配置已更新');
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderBasicConfig = () => (
    <>
      <Divider orientation="left">基础配置</Divider>
      
      <Form.Item
        label="字段标签"
        name="label"
        rules={[{ required: true, message: '请输入字段标签' }]}
      >
        <Input placeholder="例如：用户名" />
      </Form.Item>

      <Form.Item
        label="字段名称"
        name="name"
        rules={[
          { required: true, message: '请输入字段名称' },
          { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '字段名称只能包含字母、数字和下划线，且不能以数字开头' }
        ]}
      >
        <Input placeholder="例如：username" />
      </Form.Item>

      {/* 当字段类型为 measurement_entry 时不显示占位符和默认值 */}
      {field?.type !== 'measurement_entry' && (
        <>
          <Form.Item label="占位符文本" name="placeholder">
            <Input placeholder="例如：请输入您的用户名" />
          </Form.Item>

          <Form.Item label="默认值" name="defaultValue">
            <Input placeholder="字段的默认值" />
          </Form.Item>
        </>
      )}

      <Form.Item label="是否禁用" name="disabled" valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );

  const renderValidationConfig = () => (
    <>
      <Divider orientation="left">验证规则</Divider>
      
      <Form.Item label="是否必填" name={['validation', 'required']} valuePropName="checked">
        <Switch />
      </Form.Item>

      {/* 移除了最小长度和最大长度配置项 */}

      <Form.Item label="正则表达式" name={['validation', 'pattern']}>
        <Input placeholder="例如：^[a-zA-Z0-9]+$" />
      </Form.Item>

      {field?.type === 'number' && (
        <>
          <Form.Item label="最小值" name={['validation', 'min']}>
            <InputNumber placeholder="最小值" />
          </Form.Item>
          <Form.Item label="最大值" name={['validation', 'max']}>
            <InputNumber placeholder="最大值" />
          </Form.Item>
        </>
      )}
    </>
  );

  const renderComponentSpecificConfig = () => {
    return (
      <>
        <Divider orientation="left">组件配置</Divider>
        
        {/* 选项配置 - 适用于 select, radio, checkbox, custom_selector */}
        {['select', 'radio', 'checkbox', 'custom_selector'].includes(field?.type || '') && (
          <>
            <Form.List name="options">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'label']}
                        rules={[{ required: true, message: '请输入选项标签' }]}
                      >
                        <Input placeholder="选项标签" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'value']}
                        rules={[{ required: true, message: '请输入选项值' }]}
                      >
                        <Input placeholder="选项值" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      添加选项
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </>
        )}

        {/* 字段类型特定配置 */}
        {(() => {
          switch (field?.type) {
            case 'textarea':
              return (
                <Form.Item label="行数" name="rows">
                  <InputNumber min={1} max={10} placeholder="文本域行数" />
                </Form.Item>
              );
            case 'custom_input':
              return (
                <>
                  <Form.Item label="自定义属性A" name="customPropA">
                    <Input placeholder="自定义输入框特有属性" />
                  </Form.Item>
                  {/* 根据需要添加更多 custom_input 的特定配置项 */}
                </>
              );
            case 'custom_selector':
              return (
                <>
                  <Form.Item label="自定义属性B" name="customPropB">
                    <Input placeholder="自定义选择器特有属性" />
                  </Form.Item>
                  {/* custom_selector 的选项配置已在上方处理 */}
                </>
              );
            case 'measurement_entry':
              return (
                <>
                  {/* 主配置区域 */}
                  <Form.Item 
                    label="默认行数" 
                    name={['measurementConfig', 'defaultRows']}
                    tooltip="表格初始显示的行数"
                  >
                    <InputNumber min={1} max={50} placeholder="默认行数" />
                  </Form.Item>
                  
                  <Form.Item 
                    label="显示行号" 
                    name={['measurementConfig', 'showRowNumbers']} 
                    valuePropName="checked"
                    tooltip="是否在表格中显示行号"
                  >
                    <Switch />
                  </Form.Item>
                  
                  <Form.Item 
                    label="允许增删行" 
                    name={['measurementConfig', 'allowAddRemove']} 
                    valuePropName="checked"
                    tooltip="是否允许用户动态添加和删除行"
                  >
                    <Switch />
                  </Form.Item>

                  {/* 量测参数项选择 */}
                  <Form.Item
                    label="量测参数项"
                    name={['measurementConfig', 'measurementSourceType']}
                    tooltip="选择量测参数的来源方式"
                    rules={[{ required: true, message: '请选择量测参数来源' }]}
                  >
                    <Select 
                      placeholder="选择量测参数来源"
                      onChange={(value) => {
                        // 当选择改变时，更新 columns 字段
                        const systemColumns = getSystemColumns();
                        
                        if (value === 'retest_site_params') {
                          // 复测站点参数：只保留系统默认列
                          form.setFieldValue(['measurementConfig', 'columns'], systemColumns);
                        } else if (value === 'manual_selection') {
                          // 手动选择：保留系统列和现有的自定义列
                          const currentColumns = form.getFieldValue(['measurementConfig', 'columns']) || [];
                          const existingCustomColumns = currentColumns.filter((col: any) => !col.isSystem);
                          form.setFieldValue(['measurementConfig', 'columns'], [...systemColumns, ...existingCustomColumns]);
                        }
                      }}
                    >
                      <Option value="retest_site_params">复测站点参数</Option>
                      <Option value="manual_selection">手动选择</Option>
                    </Select>
                  </Form.Item>

                  {/* 列定义配置区域 */}
                  <Divider orientation="left">列定义配置</Divider>
                  
                  <Form.Item noStyle shouldUpdate>
                    {() => {
                      const measurementSourceType = form.getFieldValue(['measurementConfig', 'measurementSourceType']);
                      
                      if (measurementSourceType === 'retest_site_params') {
                        return (
                          <div style={{ 
                            padding: '12px', 
                            backgroundColor: '#f0f7ff', 
                            border: '1px solid #91d5ff',
                            borderRadius: '6px',
                            marginBottom: '16px',
                            color: '#0958d9'
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                              复测站点参数模式
                            </div>
                            <div>
                              属性列（WAFER ID、SUBLOT ID、LOT ID）已固定显示。
                              参数列将根据节点关联的站点动态返回并渲染，无需在此手动配置。
                            </div>
                          </div>
                        );
                      }
                      
                      if (measurementSourceType === 'manual_selection') {
                        return (
                          <>
                            {/* 始终渲染系统列 */}
                            <div style={{ marginBottom: '16px' }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>系统默认列</div>
                              {getSystemColumns().map((systemCol, index) => (
                                <div 
                                  key={systemCol.key} 
                                  style={{ 
                                    marginBottom: 12, 
                                    padding: 12, 
                                    border: '1px solid #d9d9d9', 
                                    borderRadius: 6,
                                    backgroundColor: '#f9f9f9'
                                  }}
                                >
                                  <Space style={{ width: '100%' }} direction="vertical">
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>列标签</div>
                                        <Input value={systemCol.label} disabled />
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>列键名</div>
                                        <Input value={systemCol.key} disabled />
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>数据类型</div>
                                        <Input value={systemCol.type} disabled />
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>单位</div>
                                        <Input value={systemCol.unit} disabled />
                                      </div>
                                    </div>
                                  </Space>
                                </div>
                              ))}
                            </div>

                            {/* 自定义列配置 */}
                            <div style={{ marginBottom: '16px' }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>自定义参数列</div>
                              <Form.List name={['measurementConfig', 'columns']}>
                                {(fields, { add, remove }) => {
                                  // 过滤出非系统列
                                  const customFields = fields.filter(({ key, name, ...restField }) => {
                                    const currentField = form.getFieldValue(['measurementConfig', 'columns', name]);
                                    return !currentField?.isSystem;
                                  });

                                  return (
                                    <>
                                      {customFields.map(({ key, name, ...restField }) => (
                                        <div key={key} style={{ 
                                          marginBottom: 16, 
                                          padding: 16, 
                                          border: '1px solid #d9d9d9', 
                                          borderRadius: 6,
                                          position: 'relative'
                                        }}>
                                          <MinusCircleOutlined 
                                            onClick={() => remove(name)}
                                            style={{ 
                                              position: 'absolute', 
                                              right: 8, 
                                              top: 8, 
                                              color: '#ff4d4f',
                                              fontSize: 16,
                                              cursor: 'pointer'
                                            }} 
                                          />
                                          
                                          <Form.Item
                                            {...restField}
                                            label="列标签"
                                            name={[name, 'label']}
                                            rules={[{ required: true, message: '请选择列标签' }]}
                                          >
                                            <Select 
                                              placeholder="选择列标签"
                                              onChange={(value) => {
                                                // 自动填充其他字段
                                                const selectedParam = predefinedMeasurementParameters.find(
                                                  param => param.label === value
                                                );
                                                if (selectedParam) {
                                                  form.setFieldValue(['measurementConfig', 'columns', name, 'key'], selectedParam.key);
                                                  form.setFieldValue(['measurementConfig', 'columns', name, 'type'], selectedParam.type);
                                                  form.setFieldValue(['measurementConfig', 'columns', name, 'unit'], selectedParam.unit);
                                                }
                                              }}
                                            >
                                              {predefinedMeasurementParameters
                                                .filter(param => !param.isSystem)
                                                .map(param => (
                                                  <Option key={param.key} value={param.label}>
                                                    {param.label} {param.unit && `(${param.unit})`}
                                                  </Option>
                                                ))}
                                            </Select>
                                          </Form.Item>
                                          
                                          <Form.Item
                                            {...restField}
                                            label="列键名"
                                            name={[name, 'key']}
                                            rules={[
                                              { required: true, message: '请输入列键名' },
                                              { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '键名只能包含字母、数字和下划线，且不能以数字开头' }
                                            ]}
                                          >
                                            <Input placeholder="例如：length" />
                                          </Form.Item>
                                          
                                          <Form.Item
                                            {...restField}
                                            label="数据类型"
                                            name={[name, 'type']}
                                            rules={[{ required: true, message: '请选择数据类型' }]}
                                          >
                                            <Select placeholder="选择数据类型">
                                              <Option value="text">文本</Option>
                                              <Option value="number">数字</Option>
                                              <Option value="integer">整数</Option>
                                              <Option value="decimal">小数</Option>
                                            </Select>
                                          </Form.Item>
                                          
                                          <Form.Item
                                            {...restField}
                                            label="单位"
                                            name={[name, 'unit']}
                                          >
                                            <Input placeholder="例如：mm, kg, °C" />
                                          </Form.Item>
                                        </div>
                                      ))}
                                      
                                      <Form.Item>
                                        <Button
                                          type="dashed"
                                          onClick={() => add({
                                            label: '',
                                            key: '',
                                            type: 'text',
                                            unit: '',
                                            editable: true,
                                            isSystem: false
                                          })}
                                          block
                                          icon={<PlusOutlined />}
                                        >
                                          添加量测列
                                        </Button>
                                      </Form.Item>
                                    </>
                                  );
                                }}
                              </Form.List>
                            </div>
                          </>
                        );
                      }
                      
                      return null;
                    }}
                  </Form.Item>
                </>
              );
            case 'equipment_entry':
              return (
                <>
                  <Form.Item 
                    label="设备数据源" 
                    name={['equipmentEntryConfig', 'dataSource']}
                    tooltip="设备数据的API端点或数据源"
                  >
                    <Input placeholder="例如：/api/equipments" />
                  </Form.Item>
                  
                  <Form.Item 
                    label="是否可搜索" 
                    name={['equipmentEntryConfig', 'searchable']} 
                    valuePropName="checked"
                    tooltip="是否允许用户搜索设备"
                  >
                    <Switch />
                  </Form.Item>
                  
                  <Form.Item 
                    label="支持扫码" 
                    name={['equipmentEntryConfig', 'supportScan']} 
                    valuePropName="checked"
                    tooltip="是否支持通过扫码录入设备"
                  >
                    <Switch />
                  </Form.Item>
                  
                  <Form.Item 
                    label="显示字段" 
                    name={['equipmentEntryConfig', 'displayField']}
                    tooltip="在界面中显示给用户的字段"
                  >
                    <Input placeholder="例如：equipmentName" />
                  </Form.Item>
                  
                  <Form.Item 
                    label="值字段" 
                    name={['equipmentEntryConfig', 'valueField']}
                    tooltip="作为实际值的字段"
                  >
                    <Input placeholder="例如：equipmentId" />
                  </Form.Item>
                </>
              );
            default:
              return null;
          }
        })()}
      </>
    );
  };

  return (
    <Drawer
      title={field ? `配置字段: ${field.label}` : '字段配置'}
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={520}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSave} loading={loading}>
            保存
          </Button>
        </Space>
      }
    >
      {field ? (
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          scrollToFirstError
        >
          {renderBasicConfig()}
          {renderValidationConfig()}
          {renderComponentSpecificConfig()}
        </Form>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          请选择一个字段进行配置
        </div>
      )}
    </Drawer>
  );
};

export default FieldConfigDrawer;