import React, { useState } from 'react';
import { Plus, Edit, Copy, Trash2, Lock, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFormTemplates } from '../hooks/useFormTemplates';
import { categoryConfigs } from '../data/formTemplateRegistry';

const FormTemplateManagement = () => {
  const navigate = useNavigate();
  const { templates, loading, deleteTemplate, duplicateTemplate } = useFormTemplates();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此表单模版吗？此操作不可恢复。')) {
      try {
        deleteTemplate(id);
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleDuplicate = (id: string) => {
    try {
      const newTemplate = duplicateTemplate(id);
      alert(`已创建副本：${newTemplate.name}`);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/form-templates/${id}/edit`);
  };

  const filteredTemplates = templates.filter(t => {
    const categoryMatch = filterCategory === 'all' || t.category === filterCategory;
    const statusMatch = filterStatus === 'all' || t.status === filterStatus;
    const searchMatch = searchQuery === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && statusMatch && searchMatch;
  });

  const statusConfig = {
    active: { label: '已发布', className: 'bg-green-100 text-green-800' },
    draft: { label: '草稿', className: 'bg-yellow-100 text-yellow-800' },
    archived: { label: '已归档', className: 'bg-gray-100 text-gray-800' }
  };

  const getCategoryLabel = (category: string) => {
    const config = categoryConfigs.find(c => c.category === category);
    return config?.label || category;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">表单模版管理</h1>
        <p className="text-gray-600 mt-1">创建和管理数据采集表单模版</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="搜索模版名称或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部分类</option>
            {categoryConfigs.map(cat => (
              <option key={cat.category} value={cat.category}>{cat.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部状态</option>
            <option value="active">已发布</option>
            <option value="draft">草稿</option>
            <option value="archived">已归档</option>
          </select>

          <div className="text-sm text-gray-600">
            共 {filteredTemplates.length} 个模版
          </div>
        </div>

        <button
          onClick={() => navigate('/form-templates/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          创建表单模版
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {filterCategory !== 'all' || filterStatus !== 'all' || searchQuery !== ''
              ? '没有符合条件的模版'
              : '暂无表单模版，点击"创建表单模版"开始'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  模版名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分类
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  版本
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  字段数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最后修改
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建者
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTemplates.map(template => {
                const status = statusConfig[template.status];
                const isSystem = template.isSystemTemplate;

                return (
                  <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {isSystem && (
                          <Lock className="w-4 h-4 text-gray-400 mr-2" title="系统模版" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {template.name}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {template.description}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">
                        {getCategoryLabel(template.category)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status.className}`}>
                        {status.label}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {template.version}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {template.fields.length}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {template.metadata.lastModified}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {template.metadata.createdBy}
                    </td>

<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  <div className="flex items-center justify-end space-x-2">
    <button
      onClick={() => handleEdit(template.id)}
      className="text-blue-600 hover:text-blue-800 transition-colors"
      title="编辑" // 统一为“编辑”
    >
      <Edit size={16} /> {/* 统一使用 Edit 图标 */}
    </button>

    <button
      onClick={() => handleDuplicate(template.id)}
      className="text-gray-600 hover:text-gray-800 transition-colors"
      title="复制"
    >
      <Copy size={16} />
    </button>

    {!isSystem && (
      <button
        onClick={() => handleDelete(template.id)}
        className="text-red-600 hover:text-red-800 transition-colors"
        title="删除"
      >
        <Trash2 size={16} />
      </button>
    )}
  </div>
</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FormTemplateManagement;
