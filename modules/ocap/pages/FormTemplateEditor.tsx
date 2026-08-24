import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Save, Plus, Trash2, ChevronUp, ChevronDown, Type, Hash, List, Circle, CheckSquare, Calendar, Clock, Upload, Package, BarChart2, HardDrive } from 'lucide-react';
import { useFormTemplates } from '../hooks/useFormTemplates';
import { FormField, FieldType, FormTemplate } from '../types/form';
import { categoryConfigs } from '../data/formTemplateRegistry';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import FieldConfigDrawer from "../components/form-template/FieldConfigDrawer";
import MeasurementEntryField from "../components/form-fields/MeasurementEntryField";
import EquipmentEntryField from "../components/form-fields/EquipmentEntryField";
import FieldPreview from "../components/form-template/FieldPreview";


const fieldTypeOptions: { type: FieldType; label: string; icon: any }[] = [
  { type: 'text', label: '文本输入', icon: Type },
  { type: 'textarea', label: '多行文本', icon: Type },
  { type: 'number', label: '数字', icon: Hash },
  { type: 'select', label: '下拉选择', icon: List },
  { type: 'radio', label: '单选按钮', icon: Circle },
  { type: 'checkbox', label: '多选框', icon: CheckSquare },
  { type: 'date', label: '日期', icon: Calendar },
  { type: 'time', label: '时间', icon: Clock },
  { type: 'datetime', label: '日期时间', icon: Calendar },
  { type: 'file', label: '文件上传', icon: Upload }
];

// 可拖拽字段类型组件
const DraggableFieldType: React.FC<{ fieldType: typeof fieldTypeOptions[0]; isReadOnly: boolean; onAddField: (type: FieldType) => void }> = ({ 
  fieldType, 
  isReadOnly, 
  onAddField 
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'field-type',
    item: { type: fieldType.type },
    canDrag: !isReadOnly,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <button
      ref={drag}
      onClick={() => !isReadOnly && onAddField(fieldType.type)}
      disabled={isReadOnly}
      className={`w-full flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <fieldType.icon size={16} className="mr-2" />
      {fieldType.label}
    </button>
  );
};



// 字段放置区域组件
const FieldsDropArea: React.FC<{ 
  fields: FormField[]; 
  selectedFieldIndex: number | null;
  isReadOnly: boolean;
  onSelectField: (index: number) => void;
  onRemoveField: (index: number) => void;
  onMoveField: (index: number, direction: 'up' | 'down') => void;
  onAddField: (type: FieldType) => void;
  onOpenDrawer: (fieldId: string) => void;
}> = ({ 
  fields, 
  selectedFieldIndex, 
  isReadOnly, 
  onSelectField, 
  onRemoveField, 
  onMoveField, 
  onAddField,
  onOpenDrawer
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'field-type',
    drop: (item: { type: FieldType }) => {
      onAddField(item.type);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div 
      ref={drop}
      className={`bg-white rounded-lg border-2 border-dashed p-4 flex-1 min-h-[400px] ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
    >
      <h3 className="text-sm font-semibold text-gray-800 mb-3">
        字段列表 ({fields.length})
      </h3>
      {fields.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          {isOver ? '释放以添加字段' : '从左侧拖拽字段或点击添加'}
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-md overflow-hidden">
              {/* 字段操作工具栏 */}
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-xs font-medium text-gray-700 mr-2">
                    {field.label || '未命名字段'}
                  </span>
                  {field.validation?.required && (
                    <span className="text-red-500 text-xs">*</span>
                  )}
                </div>
                {!isReadOnly && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onMoveField(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="上移"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => onMoveField(index, 'down')}
                      disabled={index === fields.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="下移"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      onClick={() => onOpenDrawer(field.id)}
                      className="p-1 text-blue-400 hover:text-blue-600"
                      title="编辑字段"
                    >
                      <Type size={14} />
                    </button>
                    <button
                      onClick={() => onRemoveField(index)}
                      className="p-1 text-red-400 hover:text-red-600"
                      title="删除字段"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              
              {/* 实时预览区域 */}
              <div 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  onSelectField(index);
                  onOpenDrawer(field.id);
                }}
              >
                <FieldPreview
                  field={field}
                  isSelected={selectedFieldIndex === index}
                  disabled={false}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FormTemplateEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTemplateById, updateTemplate, createTemplate, loading: templatesLoading } = useFormTemplates();
  const [template, setTemplate] = useState<Partial<FormTemplate> | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false); 
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedFieldIdForDrawer, setSelectedFieldIdForDrawer] = useState<string | null>(null);
  const [isNewTemplateInitialized, setIsNewTemplateInitialized] = useState(false);
  const [activeComponentTab, setActiveComponentTab] = useState<'basic' | 'custom'>('basic');

  // 自定义组件类型定义
  const customFieldTypes: { type: FieldType; label: string; icon: any }[] = [
    { type: 'custom_input', label: '自定义输入框', icon: Package },
    { type: 'custom_selector', label: '自定义选择器', icon: List },
    { type: 'measurement_entry', label: '量测参数录入', icon: BarChart2 },
    { type: 'equipment_entry', label: '设备录入', icon: HardDrive },
    // 您可以在这里添加更多自定义组件
  ];

  useEffect(() => {
    if (templatesLoading) {
      return;
    }

    if (id && id !== 'new') {
      const foundTemplate = getTemplateById(id);
      if (foundTemplate) {
        // 对于现有模板，如果找到，则始终设置模板和字段。
        // 这确保了使用最新数据，并避免了陈旧状态。
        setTemplate(foundTemplate);
        setFields(foundTemplate.fields || []);
        setIsNewTemplateInitialized(false); // 确保现有模板的此标志为 false
        setNotFound(false); // 重置 notFound 状态
      } else {
        // 如果提供了 ID 但未找到模板，则标记为未找到。
        setNotFound(true);
      }
    } else { // id === 'new'
      // 此块处理新模板初始化，确保它只发生一次。
      if (!isNewTemplateInitialized) {
        const now = new Date().toISOString().split('T')[0];
        setTemplate({
          id: 'new',
          name: '',
          description: '',
          category: 'custom',
          status: 'draft',
          isSystemTemplate: false,
          version: '1.0.0',
          metadata: {
            createdAt: now,
            createdBy: 'User',
            lastModified: now,
            lastModifiedBy: 'User'
          }
        });
        setFields([]);
        setIsNewTemplateInitialized(true);
        setNotFound(false); // 重置 notFound 状态
      }
    }
  }, [id, getTemplateById, templatesLoading, isNewTemplateInitialized]);

  const isNewTemplate = id === 'new';

  const handleAddField = useCallback((type: FieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      // 更新 label 逻辑，使其也能从 customFieldTypes 中查找
      label: `新${fieldTypeOptions.find(f => f.type === type)?.label || customFieldTypes.find(f => f.type === type)?.label || '字段'}`,
      name: `field_${Date.now()}`,
      placeholder: '',
      validation: {}
    };

    if (type === 'select' || type === 'radio' || type === 'checkbox') {
      newField.options = [
        { label: '选项1', value: 'option1' },
        { label: '选项2', value: 'option2' }
      ];
    }

    if (type === 'textarea') {
      newField.rows = 4;
    }

    // 处理自定义组件的特定默认值
    if (type === 'custom_input') {
      newField.placeholder = '请输入自定义内容';
      // 可以添加更多 custom_input 特有的默认属性
    }
    if (type === 'custom_selector') {
      newField.options = [
        { label: '自定义选项A', value: 'custom_a' },
        { label: '自定义选项B', value: 'custom_b' }
      ];
      // 可以添加更多 custom_selector 特有的默认属性
    }

    // 处理量测参数录入组件的默认配置 - 修正为完整且有效的配置
    if (type === 'measurement_entry') {
      newField.measurementConfig = {
        columns: [
          { key: 'sublotId', label: 'SUBLOT ID', type: 'text', required: true },
          { key: 'waferId', label: 'WAFER ID', type: 'text', required: true },
          { key: 'centhk', label: 'CENTHK (MM)', type: 'number', required: false },
          { key: 'edgeExcl', label: 'EDGE EXCL (MM)', type: 'number', required: false },
          { key: 'iwThk', label: 'IW THK (MM)', type: 'number', required: false },
          { key: 'owThk', label: 'OW THK (MM)', type: 'number', required: false }
        ],
        defaultRows: 5, // 修正：将 defaultRowCount 改为 defaultRows
        minRows: 1,
        maxRows: 50,
        allowAddRemove: true,
        showRowNumbers: true,
        validation: {
          required: false,
          minRows: 1,
          maxRows: 50
        }
      };
    }

    // 处理设备录入组件的默认配置
    if (type === 'equipment_entry') {
      newField.equipmentEntryConfig = {
        columns: [
          { key: 'equipmentId', label: '设备ID', type: 'text', required: true },
          { key: 'equipmentName', label: '设备名称', type: 'text', required: true },
          { key: 'status', label: '状态', type: 'select', required: true, options: [
            { label: '运行中', value: 'running' },
            { label: '停机', value: 'stopped' },
            { label: '维护中', value: 'maintenance' }
          ]},
          { key: 'lastMaintenance', label: '最后维护日期', type: 'date', required: false }
        ],
        defaultRows: 3,
        minRows: 1,
        maxRows: 20,
        allowAddRemove: true,
        showRowNumbers: true,
        validation: {
          required: false,
          minRows: 1,
          maxRows: 20
        }
      };
    }

    setFields((prevFields) => {
      const updatedFields = [...prevFields, newField];
      // 在状态更新回调中执行其他依赖于新状态的操作
      setSelectedFieldIndex(updatedFields.length - 1);
      setSelectedFieldIdForDrawer(newField.id);
      setIsDrawerOpen(true);
      return updatedFields;
    });
  }, []); // 依赖数组为空，因为我们使用了 setFields 的函数式更新

  const handleRemoveField = (index: number) => {
    const fieldToRemove = fields[index];
    setFields(fields.filter((_, i) => i !== index));
    
    if (selectedFieldIndex === index) {
      setSelectedFieldIndex(null);
      if (selectedFieldIdForDrawer === fieldToRemove.id) {
        setSelectedFieldIdForDrawer(null);
        setIsDrawerOpen(false);
      }
    } else if (selectedFieldIndex !== null && selectedFieldIndex > index) {
      setSelectedFieldIndex(selectedFieldIndex - 1);
    }
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields);

    if (selectedFieldIndex === index) {
      setSelectedFieldIndex(targetIndex);
    } else if (selectedFieldIndex === targetIndex) {
      setSelectedFieldIndex(index);
    }
  };

  const handleUpdateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const handleUpdateTemplate = (updates: Partial<FormTemplate>) => {
    if (template) {
      setTemplate({ ...template, ...updates });
    }
  };

  const handleSave = async () => {
    if (!template?.name?.trim()) {
      alert('请输入模板名称');
      return;
    }

    if (!template?.category?.trim()) {
      alert('请选择模板分类');
      return;
    }

    setIsSaving(true);
    try {
      const templateData = {
        ...template,
        fields,
        lastModified: new Date().toISOString()
      };

      if (isNewTemplate) {
        // 创建新模板
        const newTemplate = await createTemplate(templateData as FormTemplate);
        alert('创建成功');
        // 导航到编辑页面
        navigate(`/form-templates/${newTemplate.id}`);
      } else if (id) {
        // 更新现有模板
        await updateTemplate(id, templateData);
        alert('保存成功');
      }
    } catch (error: any) {
      alert(error.message || '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDrawer = (fieldId: string) => {
    setSelectedFieldIdForDrawer(fieldId);
    setIsDrawerOpen(true);
  };

  // 显示加载中
  if (id && id !== 'new' && templatesLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  // 显示模版不存在
  if (id && id !== 'new' && !templatesLoading && !template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">模版不存在</p>
        <Link to="/form-templates" className="text-blue-600 hover:underline mt-4 inline-block">
          返回模版列表
        </Link>
      </div>
    );
  }

  const selectedField = selectedFieldIndex !== null ? fields[selectedFieldIndex] : null;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col">
        <div className="mb-6">
          <Link to="/form-templates" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ChevronLeft size={18} className="mr-1" />
            返回模版列表
          </Link>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {template?.isSystemTemplate ? '查看表单模版' : isNewTemplate ? '创建表单模版' : '编辑表单模版'}
            </h1>
            {template?.name && (
              <p className="text-gray-600 mt-1">{template.name}</p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {!template?.isSystemTemplate && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save size={18} className="mr-2" />
                {isSaving ? '保存中...' : isNewTemplate ? '创建' : '保存'}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* 模板基本信息编辑 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">模板基本信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  模板名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={template?.name || ''}
                  onChange={(e) => handleUpdateTemplate({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入模板名称"
                  disabled={!isNewTemplate}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类 <span className="text-red-500">*</span>
                </label>
                <select
                  value={template?.category || ''}
                  onChange={(e) => handleUpdateTemplate({ category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择分类</option>
                  {categoryConfigs.map(config => (
                    <option key={config.category} value={config.category}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={template?.description || ''}
                  onChange={(e) => handleUpdateTemplate({ description: e.target.value })}
                  rows={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                  placeholder="请输入模板描述"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-grow gap-6">
            {/* 左侧边栏 - 组件库 */}
            <div className="w-64 bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">组件库</h2>

              {/* 标签页导航 */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => setActiveComponentTab('basic')}
                  className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${
                    activeComponentTab === 'basic'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  基础组件
                </button>
                <button
                  onClick={() => setActiveComponentTab('custom')}
                  className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${
                    activeComponentTab === 'custom'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  自定义组件
                </button>
              </div>

              {/* 基础组件列表区域 */}
              {activeComponentTab === 'basic' && (
                <div className="space-y-2">
                  {fieldTypeOptions.map((fieldType) => (
                    <DraggableFieldType
                      key={fieldType.type}
                      fieldType={fieldType}
                      isReadOnly={false}
                      onAddField={handleAddField}
                    />
                  ))}
                </div>
              )}

              {/* 自定义组件列表区域 */}
              {activeComponentTab === 'custom' && (
                <div className="space-y-2">
                  {customFieldTypes.map((fieldType) => (
                    <DraggableFieldType
                      key={fieldType.type}
                      fieldType={fieldType}
                      isReadOnly={false}
                      onAddField={handleAddField}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 右侧主内容区域 */}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">模版内容配置</h2>
              <FieldsDropArea
                fields={fields}
                selectedFieldIndex={selectedFieldIndex}
                isReadOnly={false}
                onSelectField={setSelectedFieldIndex}
                onRemoveField={handleRemoveField}
                onMoveField={handleMoveField}
                onAddField={handleAddField}
                onOpenDrawer={handleOpenDrawer}
              />
            </div>
          </div>
        </div>

        {/* 字段配置抽屉 */}
        {isDrawerOpen && selectedFieldIdForDrawer && (
          <FieldConfigDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            field={fields.find(f => f.id === selectedFieldIdForDrawer)}
            onUpdateField={(updatedField) => {
              const index = fields.findIndex(f => f.id === updatedField.id);
              if (index !== -1) {
                handleUpdateField(index, updatedField);
              }
            }}
          />
        )}
      </div>
    </DndProvider>
  );
};

export default FormTemplateEditor;