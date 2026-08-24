import React, { useState } from 'react';
import { Plus, Edit, Copy, Trash2, Lock, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkflowTemplates } from '../hooks/useWorkflowTemplates';
import { categoryConfigs } from '../data/workflowTemplateRegistry';

const WorkflowModeling = () => {
  const navigate = useNavigate();
  const { templates, loading, createTemplate, deleteTemplate, duplicateTemplate } = useWorkflowTemplates();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此工作流模板吗？此操作不可恢复。')) {
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
      // 导航到新的设计器页面，并传递复制的模板数据
      navigate('/workflow-designer/new', { state: { duplicatedTemplate: newTemplate } });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/workflow-designer/${id}`);
  };

  // 过滤模板
  const filteredTemplates = templates.filter(t => {
    const categoryMatch = filterCategory === 'all' || t.category === filterCategory;
    const statusMatch = filterStatus === 'all' || t.status === filterStatus;
    return categoryMatch && statusMatch;
  });

  // 状态标签映射
  const statusConfig = {
    active: { label: '已发布', className: 'bg-green-100 text-green-800' },
    draft: { label: '草稿', className: 'bg-yellow-100 text-yellow-800' },
    archived: { label: '已归档', className: 'bg-gray-100 text-gray-800' },
    pending_review: { label: '待审核', className: 'bg-purple-100 text-purple-800' } // 新增
  };

  // 获取分类标签
  const getCategoryLabel = (category: string) => {
    const config = categoryConfigs.find(c => c.category === category);
    return config?.label || category;
  };

  return (
    <div>
      {/* 页头 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">OCAP工单建模</h1>
        <p className="text-gray-600 mt-1">创建和管理OCAP工单处理流程模板</p>
      </div>

      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {/* 分类过滤 */}
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

          {/* 状态过滤 */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部状态</option>
            <option value="active">已发布</option>
            <option value="draft">草稿</option>
            <option value="archived">已归档</option>
            <option value="pending_review">待审核</option>
          </select>

          <div className="text-sm text-gray-600">
            共 {filteredTemplates.length} 个模板
          </div>
        </div>

        {/* 创建按钮 */}
        <button
          onClick={() => navigate('/workflow-designer/new')} // 直接导航到新模板创建页面
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          创建工作流
        </button>
      </div>

      {/* 表格 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            {filterCategory !== 'all' || filterStatus !== 'all' 
              ? '没有符合条件的模板'
              : '暂无工作流模板，点击"创建工作流"开始'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  模板名称
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
                  节点数
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
                    {/* 模板名称 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
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

                    {/* 分类 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">
                        {getCategoryLabel(template.category)}
                      </span>
                    </td>

                    {/* 状态 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status.className}`}>
                        {status.label}
                      </span>
                    </td>

                    {/* 版本 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {template.version}
                    </td>

                    {/* 节点数 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {template.nodeCount}
                    </td>

                    {/* 最后修改 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {template.metadata.lastModified}
                    </td>

                    {/* 创建者 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {template.metadata.createdBy}
                    </td>

                    {/* 操作 */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* 编辑按钮 (始终显示) */}
                        <button
                          onClick={() => handleEdit(template.id)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="编辑"
                        >
                          <Edit size={16} />
                        </button>

                        {/* 复制按钮 (始终显示) */}
                        <button
                          onClick={() => handleDuplicate(template.id)}
                          className="text-gray-600 hover:text-gray-800 transition-colors"
                          title="复制"
                        >
                          <Copy size={16} />
                        </button>

                        {/* 删除按钮 (始终显示，但系统模板的删除逻辑在hook中被阻止) */}
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
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

export default WorkflowModeling;
