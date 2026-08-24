// src/components/ProductionPlan/WorkOrderForm.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Package, Target, AlertCircle, FileText, Search, List, Edit, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useBOMData } from '../../hooks/useBOMData';
import { useData } from '../../hooks/useData';
import { ProductionOrder } from '../../types';
import { ProcessStation } from '../../services/processRouteService'; // 导入 ProcessStation 接口

interface WorkOrderFormProps {
  onClose: () => void;
  onSubmit: (workOrderData: any, isEditMode: boolean) => void;
  initialData?: ProductionOrder | null;
  isEdit?: boolean;
}

export const WorkOrderForm: React.FC<WorkOrderFormProps> = ({ onClose, onSubmit, initialData = null, isEdit = false }) => {
  const { bomTemplates: originalBomTemplates, loading: bomLoading } = useBOMData();
  const { products, productProcessStations, fetchAndSetProductProcessStations } = useData(); // 导入 productProcessStations 和 fetchAndSetProductProcessStations

  const bomTemplates = [
    ...originalBomTemplates,
  ];

  const [formData, setFormData] = useState({
    productRefId: '',
    targetQuantity: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    priority: 'medium',
    createdBy: '张三',
    selectedBomTemplateId: '',
    notes: '',
    orderType: '标准工单',
    startProcessStationCode: '',
    endProcessStationCode: '',
    assignedOperator: '张三',
  });

  const [bomItems, setBomItems] = useState<any[]>([]);
  const [editingBomItems, setEditingBomItems] = useState(false);
  const [showBomTemplateInfo, setShowBomTemplateInfo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [activeProcessStationCode, setActiveProcessStationCode] = useState<string>('');
  // currentProductProcessStations 现在直接使用 productProcessStations
  // const [currentProductProcessStations, setCurrentProductProcessStations] = useState<ProcessStation[]>([]); // 移除此行

  const operators = ['张三', '李四', '王五', '赵六', '孙七', '周八'];

  const orderTypeOptions = [
    '标准工单',
    '返工工单',
    '实验工单',
    '代工工单',
    '其他类型'
  ];

  // 当 initialData 变化时预填充表单
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        productRefId: initialData.productRefId || '',
        targetQuantity: initialData.targetQuantity.toString(),
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
        priority: initialData.priority || 'medium',
        createdBy: initialData.assignedOperator || '张三',
        selectedBomTemplateId: '',
        notes: initialData.notes || '',
        orderType: initialData.orderType || '标准工单',
        startProcessStationCode: initialData.startProcessStationCode || '',
        endProcessStationCode: initialData.endProcessStationCode || '',
        assignedOperator: initialData.assignedOperator || '张三',
      });
      setBomItems(initialData.bomItems || []);

      // 在编辑模式下，如果产品ID存在，则获取其工艺站点
      if (initialData.productRefId) {
        fetchAndSetProductProcessStations(initialData.productRefId);
      }
    } else {
      // 新建模式下，重置表单
      setFormData({
        productRefId: '',
        targetQuantity: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        priority: 'medium',
        createdBy: '张三',
        selectedBomTemplateId: '',
        notes: '',
        orderType: '标准工单',
        startProcessStationCode: '',
        endProcessStationCode: '',
        assignedOperator: '张三',
      });
      setBomItems([]);
      fetchAndSetProductProcessStations(''); // 清空工艺站点
    }
  }, [isEdit, initialData, products, fetchAndSetProductProcessStations]);


  // 当选择BOM模板或目标数量变化时，重新计算BOM项目需求数量
  useEffect(() => {
    // 仅在新建模式下或编辑模式下允许BOM模板影响bomItems
    if (!isEdit && formData.selectedBomTemplateId && formData.targetQuantity) {
      const selectedTemplate = bomTemplates.find(t => t.id === formData.selectedBomTemplateId);
      const targetQty = parseInt(formData.targetQuantity);

      if (selectedTemplate && targetQty > 0) {
        const calculatedBomItems = selectedTemplate.bomItems.map(item => ({
          ...item,
          requiredQuantity: item.requiredQuantity * targetQty, // 修正：使用 item.requiredQuantity
          processStationCode: item.processStationCode || ''
        }));
        setBomItems(calculatedBomItems);
      }
    } else if (!isEdit && formData.selectedBomTemplateId) {
      const selectedTemplate = bomTemplates.find(t => t.id === formData.selectedBomTemplateId);
      if (selectedTemplate) {
        setBomItems(selectedTemplate.bomItems.map(item => ({
          ...item,
          requiredQuantity: item.requiredQuantity, // 修正：使用 item.requiredQuantity
          processStationCode: item.processStationCode || ''
        })));
      }
    } else if (!isEdit) {
      setBomItems([]);
    }
  }, [formData.selectedBomTemplateId, formData.targetQuantity, bomTemplates, isEdit]);

  // 处理产品料号变更 (现在是 productRefId)
  const handleProductRefIdChange = (productRefId: string) => {
    handleInputChange('selectedBomTemplateId', ''); // 清空BOM模板选择
    setBomItems([]);

    handleInputChange('productRefId', productRefId); // 更新 productRefId

    // 动态获取工艺站点
    fetchAndSetProductProcessStations(productRefId);
  };

  // currentProductProcessStations 现在直接使用 productProcessStations
  const currentProductProcessStations = productProcessStations;

  const filteredBomItems = activeProcessStationCode
    ? bomItems.filter(item => item.processStationCode === activeProcessStationCode)
    : bomItems;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.productRefId && !isEdit) { // 仅在新建模式下验证 productRefId
      newErrors.productRefId = '请选择产品料号';
    }

    if (!formData.targetQuantity || parseInt(formData.targetQuantity) <= 0) {
      newErrors.targetQuantity = '请输入有效的目标数量';
    }

    if (!formData.startDate) {
      newErrors.startDate = '请选择开始日期';
    }

    if (!formData.endDate) {
      newErrors.endDate = '请选择结束日期';
    } else if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = '结束日期必须晚于开始日期';
    }

    if (!formData.createdBy && !isEdit) { // 仅在新建模式下验证 createdBy
      newErrors.createdBy = '请选择创建人';
    }

    if (!formData.orderType && !isEdit) { // 仅在新建模式下验证 orderType
      newErrors.orderType = '请选择工单类别';
    }

    // 仅在新建模式下或编辑模式下允许编辑这些字段时进行验证
    if ((formData.orderType === '返工工单' || formData.orderType === '代工工单') && !isEdit) {
      if (!formData.startProcessStationCode) {
        newErrors.startProcessStationCode = '请选择起始加工站点';
      }

      if (!formData.endProcessStationCode) {
        newErrors.endProcessStationCode = '请选择结束加工站点';
      }

      if (formData.startProcessStationCode && formData.endProcessStationCode) {
        const startIndex = currentProductProcessStations.findIndex(
          station => station.code === formData.startProcessStationCode
        );
        const endIndex = currentProductProcessStations.findIndex(
          station => station.code === formData.endProcessStationCode
        );

        if (startIndex === -1 || endIndex === -1) {
          newErrors.endProcessStationCode = '无效的工艺站点选择';
        } else if (startIndex === endIndex) {
          newErrors.endProcessStationCode = '起始和结束加工站点不能相同';
        } else if (endIndex <= startIndex) {
          newErrors.endProcessStationCode = '结束加工站点必须在起始加工站点之后';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      const selectedProduct = products.find(p => p.supabase_id === formData.productRefId);
      const selectedBomTemplate = bomTemplates.find(t => t.id === formData.selectedBomTemplateId);

      if (!isEdit && !selectedProduct) { // 仅在新建模式下验证产品选择
        alert('请选择有效的产品料号');
        return;
      }

      const workOrderData = {
        ...formData,
        targetQuantity: parseInt(formData.targetQuantity),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        // 在编辑模式下，这些字段不应从表单中获取，而是使用 initialData 中的值
        productRefId: isEdit ? initialData?.productRefId : selectedProduct?.supabase_id,
        productName: isEdit ? initialData?.productName : selectedProduct?.product_name,
        bomTemplate: isEdit ? initialData?.bomTemplate : selectedBomTemplate, // 保存选中的BOM模板信息
        bomItems: isEdit ? initialData?.bomItems : bomItems.map(item => ({
          ...item,
          processStationCode: item.processStationCode
        })),
        // assignedOperator 在编辑模式下也不可编辑
        assignedOperator: isEdit ? initialData?.assignedOperator : formData.assignedOperator,
      };
      await onSubmit(workOrderData, isEdit); // 传递 isEdit 标志
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateBomItem = (index: number, field: string, value: any) => {
    const updatedItems = [...bomItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setBomItems(updatedItems);
  };

  const addBomItem = () => {
    const newItem = {
      id: `ITEM-${Date.now()}`,
      materialCode: '',
      materialName: '',
      specification: '',
      unit: '',
      requiredQuantity: 0,
      unitPrice: 0,
      supplier: '',
      notes: '',
      processStationCode: activeProcessStationCode
    };
    setBomItems([...bomItems, newItem]);
  };

  const removeBomItem = (index: number) => {
    if (bomItems.length > 1) {
      setBomItems(bomItems.filter((_, i) => i !== index));
    }
  };

  const selectedProduct = products.find(p => p.supabase_id === formData.productRefId);
  const selectedBomTemplate = bomTemplates.find(t => t.id === formData.selectedBomTemplateId);

  const currentProductName = isEdit ? initialData?.productName : selectedProduct?.product_name || '';

  const filteredBomTemplates = bomTemplates.filter(t =>
    (!currentProductName || t.productType === currentProductName) &&
    t.status === 'active'
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-7xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{isEdit ? '编辑生产工单' : '新建生产工单'}</h2>
            <p className="text-sm text-gray-600 mt-1">{isEdit ? `工单号: ${initialData?.orderNumber}` : '创建新的生产工单计划'}</p>
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
          <div className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    工单类别 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.orderType}
                    onChange={(e) => handleInputChange('orderType', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.orderType ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isEdit} // 编辑模式下禁用
                  >
                    {orderTypeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.orderType && (
                    <p className="text-red-500 text-xs mt-1">{errors.orderType}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    工单编号
                  </label>
                  <input
                    type="text"
                    value={isEdit ? initialData?.orderNumber : "系统自动生成"}
                    disabled // 始终禁用
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    产品料号 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.productRefId} // 绑定 productRefId
                    onChange={(e) => handleProductRefIdChange(e.target.value)} // 调用新的处理函数
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.productRefId ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isEdit} // 编辑模式下禁用
                  >
                    <option value="">请选择产品料号</option>
                    {products.map(product => ( // 遍历从 useData 获取的 products
                      <option key={product.supabase_id} value={product.supabase_id}>
                        {product.product_code} - {product.product_name}
                      </option>
                    ))}
                  </select>
                  {errors.productRefId && (
                    <p className="text-red-500 text-xs mt-1">{errors.productRefId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    创建人 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.createdBy}
                    onChange={(e) => handleInputChange('createdBy', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.createdBy ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isEdit} // 编辑模式下禁用
                  >
                    <option value="">请选择创建人</option>
                    {operators.map(operator => (
                      <option key={operator} value={operator}>{operator}</option>
                    ))}
                  </select>
                  {errors.createdBy && (
                    <p className="text-red-500 text-xs mt-1">{errors.createdBy}</p>
                  )}
                </div>

                {/* Product Details */}
                {(selectedProduct || (isEdit && initialData)) && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 col-span-full">
                    <h4 className="text-sm font-medium text-blue-900 mb-3">产品详细信息</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-cols-4  gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">产品名称:</span>
                        <span className="ml-2 font-medium text-blue-900">{isEdit ? initialData?.productName : selectedProduct?.product_name}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">产品编码:</span>
                        <span className="ml-2 font-medium text-blue-900">{isEdit ? initialData?.productRefId : selectedProduct?.product_code}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* 新增：起始和结束加工站点（仅在返工或代工时显示） */}
              {(formData.orderType === '返工工单' || formData.orderType === '代工工单') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      起始加工站点 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.startProcessStationCode}
                      onChange={(e) => handleInputChange('startProcessStationCode', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.startProcessStationCode ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isEdit} // 编辑模式下禁用
                    >
                      <option value="">请选择起始加工站点</option>
                      {currentProductProcessStations.map((station, index) => (
                        <option key={station.code} value={station.code}>
                          {station.name} ({station.description})
                        </option>
                      ))}
                    </select>
                    {errors.startProcessStationCode && (
                      <p className="text-red-500 text-xs mt-1">{errors.startProcessStationCode}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      结束加工站点 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.endProcessStationCode}
                      onChange={(e) => handleInputChange('endProcessStationCode', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.endProcessStationCode ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isEdit} // 编辑模式下禁用
                    >
                      <option value="">请选择结束加工站点</option>
                      {currentProductProcessStations.map((station, index) => (
                        <option key={station.code} value={station.code}>
                          {station.name} ({station.description})
                        </option>
                      ))}
                    </select>
                    {errors.endProcessStationCode && (
                      <p className="text-red-500 text-xs mt-1">{errors.endProcessStationCode}</p>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Production Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">生产信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    目标数量 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={formData.targetQuantity}
                      onChange={(e) => handleInputChange('targetQuantity', e.target.value)}
                      placeholder="请输入目标数量"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.targetQuantity ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    </div>
                  </div>
                  {errors.targetQuantity && (
                    <p className="text-red-500 text-xs mt-1">{errors.targetQuantity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">优先级</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">低优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="high">高优先级</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    计划开始日期 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.startDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-8 pr-3 flex items-center pointer-events-none">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  {errors.startDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    计划结束日期 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      min={formData.startDate}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.endDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-8 pr-3 flex items-center pointer-events-none">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  {errors.endDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
                  )}
                </div>
              </div>

            </div>

            {/* BOM Template Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">工单BOM</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">选择BOM模板</label>
                <select
                  value={formData.selectedBomTemplateId}
                  onChange={(e) => handleInputChange('selectedBomTemplateId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={bomLoading || !formData.productRefId || isEdit} // 编辑模式下禁用
                >
                  <option value="">请选择BOM模板（可选）</option>
                  {bomLoading ? (
                    <option disabled>加载中...</option>
                  ) : filteredBomTemplates.length === 0 ? (
                    <option disabled>暂无可用模板</option>
                  ) : (
                    filteredBomTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.templateName} - {template.productType} (v{template.version})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* BOM Template Info Button */}
              {(selectedBomTemplate || (isEdit && initialData?.bomTemplate)) && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowBomTemplateInfo(!showBomTemplateInfo)}
                    className="flex items-center text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    查看模板信息
                    {showBomTemplateInfo ? (
                      <ChevronUp className="w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </button>

                  {showBomTemplateInfo && (
                    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">模板信息</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">模板名称:</span>
                          <span className="ml-2 font-medium text-gray-900">{isEdit ? initialData?.bomTemplate?.templateName : selectedBomTemplate?.templateName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">产品类型:</span>
                          <span className="ml-2 font-medium text-gray-900">{isEdit ? initialData?.productName : selectedBomTemplate?.productType}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">版本:</span>
                          <span className="ml-2 font-medium text-gray-900">{isEdit ? initialData?.bomTemplate?.version : selectedBomTemplate?.version}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">物料数量:</span>
                          <span className="ml-2 font-medium text-gray-900">{isEdit ? initialData?.bomItems?.length : selectedBomTemplate?.bomItems.length} 种</span>
                        </div>
                      </div>
                      {(isEdit ? initialData?.notes : selectedBomTemplate?.description) && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">描述:</span>
                          <span className="ml-2 text-gray-900">{isEdit ? initialData?.notes : selectedBomTemplate?.description}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* BOM Items */}
              {bomItems.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">BOM物料清单</h4>
                    {!isEdit && ( // 仅在新建模式下显示编辑按钮
                      <div className="flex items-center space-x-3">
                        {formData.targetQuantity && (
                          <span className="text-sm text-gray-600">
                            目标数量: {parseInt(formData.targetQuantity).toLocaleString()} 个产品
                          </span>
                        )}
                        <button
                          onClick={() => setEditingBomItems(!editingBomItems)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm font-medium"
                        >
                          <Edit className="w-4 h-4" />
                          {editingBomItems ? '完成编辑' : '编辑'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    {/* 两栏布局：左侧工艺站点，右侧物料清单 */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      {/* 左侧：工艺站点列表 */}
                      <div className="md:col-span-1">
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <h5 className="text-sm font-medium text-gray-700">工艺站点</h5>
                          </div>
                          <ul className="divide-y divide-gray-200">
                            {currentProductProcessStations.map(station => (
                              <li key={station.code}>
                                <button
                                  onClick={() => setActiveProcessStationCode(station.code)}
                                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                                    activeProcessStationCode === station.code
                                      ? 'bg-blue-50 text-blue-700 font-medium'
                                      : 'hover:bg-gray-50'
                                  }`}
                                  title={station.description}
                                >
                                  <div className="font-medium">{station.name}</div>
                                  <div className="text-xs text-gray-500 mt-1 truncate">{station.description}</div>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* 右侧：物料清单 */}
                      <div className="md:col-span-4">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-white">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">
                                  物料编码
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  物料名称
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  规格
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  单位
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  需求数量
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  供应商
                                </th>
                                {editingBomItems && !isEdit && ( // 仅在新建模式下且允许编辑时显示操作列
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">
                                    操作
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredBomItems.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    {(editingBomItems && !isEdit) ? ( // 仅在新建模式下且允许编辑时显示输入框
                                      <input
                                        type="text"
                                        value={item.materialCode}
                                        onChange={(e) => updateBomItem(index, 'materialCode', e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                        placeholder="物料编码"
                                      />
                                    ) : (
                                      <div className="text-sm font-medium text-gray-900">{item.materialCode}</div>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{item.materialName}</div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{item.specification}</div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{item.unit}</div>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.requiredQuantity.toLocaleString()}
                                    </div>
                                    {formData.targetQuantity && selectedBomTemplate && (
                                      <div className="text-xs text-gray-500">
                                        单位用量: {(item.requiredQuantity / parseInt(formData.targetQuantity)).toLocaleString()}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{item.supplier}</div>
                                  </td>
                                  {(editingBomItems && !isEdit) && ( // 仅在新建模式下且允许编辑时显示操作列
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <button
                                        onClick={() => removeBomItem(index)}
                                        disabled={bomItems.length <= 1}
                                        className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {(editingBomItems && !isEdit) && ( // 仅在新建模式下且允许编辑时显示添加物料按钮
                          <div className="mt-4">
                            <button
                              onClick={addBomItem}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                              <Package className="w-4 h-4" />
                              添加物料
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">备注说明</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                placeholder="请输入备注信息（可选）"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-2">工单创建说明</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• 工单编号将在创建时自动生成</p>
                    <p>• 产品料号包含了产品的加工规格和工艺路径信息</p>
                    <p>• BOM模板中维护的是生产每个单位产品所需的物料数量</p>
                    <p>• 选择模板后，物料需求数量将根据目标数量自动计算</p>
                    <p>• 编辑时支持修改物料编码，以适应特定规格要求</p>
                    {(formData.orderType === '返工工单' || formData.orderType === '代工工单') && (
                      <>
                        <p>• 返工/代工工单需要指定起始和结束加工站点</p>
                        <p>• 结束加工站点必须在起始加工站点之后</p>
                      </>
                    )}
                  </div>
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {isEdit ? '保存修改' : '创建工单'}
          </button>
        </div>
      </div>
    </div>
  );
};