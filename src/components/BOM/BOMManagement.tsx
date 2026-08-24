// src/components/BOM/BOMManagement.tsx
import React, { useState } from 'react';
import { Search, Filter, Plus, FileText, Edit, Copy, Trash2, Package, Calculator, Calendar, User, Eye } from 'lucide-react';
import { useBOMData } from '../../hooks/useBOMData';
import { useData } from '../../hooks/useData'; // 新增导入 useData
import { BOMTemplateForm } from './BOMTemplateForm';
import { BOMTemplateDetail } from './BOMTemplateDetail';

export const BOMManagement: React.FC = () => {
  const { bomTemplates, loading, createBOMTemplate, updateBOMTemplate, deleteBOMTemplate } = useBOMData();
  const { products, productProcessStations } = useData(); // 获取产品列表和工艺站点
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showTemplateDetail, setShowTemplateDetail] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);

  const filteredTemplates = bomTemplates.filter(template => {
    const matchesSearch = 
      template.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.templateCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.productType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || template.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      'active': 'bg-green-100 text-green-800',
      'draft': 'bg-yellow-100 text-yellow-800',
      'archived': 'bg-gray-100 text-gray-800'
    };
    const labels = {
      'active': '启用',
      'archived': '禁用'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setEditMode(false);
    setShowTemplateForm(true);
  };

  const handleEditTemplate = (template: any) => {
    setSelectedTemplate(template);
    setEditMode(true);
    setShowTemplateForm(true);
  };

  const handleCopyTemplate = (template: any) => {
    const copiedTemplate = {
      ...template,
      templateName: `${template.templateName} - 副本`,
      templateCode: `${template.templateCode}_COPY`,
      status: 'draft'
    };
    setSelectedTemplate(copiedTemplate);
    setEditMode(false);
    setShowTemplateForm(true);
  };

  const handleViewTemplate = (template: any) => {
    setSelectedTemplate(template);
    setShowTemplateDetail(true);
  };

  const handleDeleteTemplate = (template: any) => {
    if (confirm(`确定要删除BOM模板 "${template.templateName}" 吗？`)) {
      deleteBOMTemplate(template.id);
    }
  };

  const handleTemplateFormSubmit = (templateData: any) => {
    if (editMode && selectedTemplate) {
      updateBOMTemplate(selectedTemplate.id, templateData);
    } else {
      createBOMTemplate(templateData);
    }
    setShowTemplateForm(false);
    setSelectedTemplate(null);
    setEditMode(false);
  };

  const getTotalAmount = (items: any[]) => {
    return items.reduce((sum, item) => sum + (item.requiredQuantity * item.unitPrice), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">BOM管理</h2>
          <p className="text-gray-600 mt-1">物料清单模板维护与管理</p>
        </div>
        <button
          onClick={handleCreateTemplate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建BOM
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索模板名称、编号或产品名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部状态</option>
              <option value="active">启用</option>
              <option value="archived">禁用</option>
            </select>
            
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>
        </div>
      </div>

      {/* BOM Templates Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">BOM模板列表</h3>
            <span className="text-sm text-gray-500">共 {filteredTemplates.length} 个模板</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  模板名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  产品名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  物料数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  单位产品金额
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{template.templateName}</div>
                        <div className="text-sm text-gray-500">{template.templateCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900">{template.productType}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {template.bomItems.length} 种物料
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calculator className="w-4 h-4 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900">
                        ¥{getTotalAmount(template.bomItems).toFixed(2)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{template.createdBy}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {template.createdAt.toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(template.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewTemplate(template)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        查看
                      </button>
                      <button 
                        onClick={() => handleEditTemplate(template)}
                        className="text-green-600 hover:text-green-900 flex items-center gap-1 text-sm font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        编辑
                      </button>
                      <button 
                        onClick={() => handleCopyTemplate(template)}
                        className="text-purple-600 hover:text-purple-900 flex items-center gap-1 text-sm font-medium"
                      >
                        <Copy className="w-4 h-4" />
                        复制
                      </button>
                      <button 
                        onClick={() => handleDeleteTemplate(template)}
                        className="text-red-600 hover:text-red-900 flex items-center gap-1 text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无BOM模板</h3>
            <p className="mt-1 text-sm text-gray-500">请点击"新建BOM模板"按钮创建第一个模板。</p>
          </div>
        )}
      </div>

      {/* BOM Template Form Modal */}
      {showTemplateForm && (
        <BOMTemplateForm
          template={selectedTemplate}
          isEdit={editMode}
          onClose={() => {
            setShowTemplateForm(false);
            setSelectedTemplate(null);
            setEditMode(false);
          }}
          onSubmit={handleTemplateFormSubmit}
          products={products} // 传递产品列表
        />
      )}

      {/* BOM Template Detail Modal */}
      {showTemplateDetail && selectedTemplate && (
        <BOMTemplateDetail
          template={selectedTemplate}
          onClose={() => {
            setShowTemplateDetail(false);
            setSelectedTemplate(null);
          }}
          currentProductProcessStations={productProcessStations} // 传递 productProcessStations
        />
      )}
    </div>
  );
};