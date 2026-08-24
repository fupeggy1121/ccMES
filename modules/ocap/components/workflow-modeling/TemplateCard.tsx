import React from 'react';
import { WorkflowTemplate } from '../../types/workflow';
import { Edit, Trash2, Copy, FileText, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { categoryConfigs } from '../../data/workflowTemplateRegistry';

interface TemplateCardProps {
  template: WorkflowTemplate;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onDelete, onDuplicate }) => {
  const navigate = useNavigate();

  const categoryConfig = categoryConfigs.find(c => c.category === template.category);
  
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    draft: 'bg-yellow-100 text-yellow-800',
    archived: 'bg-gray-100 text-gray-800'
  };

  const statusLabels = {
    active: '已发布',
    draft: '草稿',
    archived: '已归档'
  };

  return (
    <div 
      className={`border-2 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer ${
        categoryConfig?.color || 'bg-gray-50 border-gray-200'
      }`}
      onClick={() => navigate(`/workflow-designer/${template.id}`)}
    >
      {/* 头部 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <FileText className={`w-5 h-5 ${categoryConfig?.iconColor || 'text-gray-600'}`} />
            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
            {template.isSystemTemplate && (
              <Lock className="w-4 h-4 text-gray-400" title="系统模板" />
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[template.status]}`}>
          {statusLabels[template.status]}
        </span>
      </div>

      {/* 分类标签 */}
      <div className="mb-4">
        <span className="inline-block px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700">
          {categoryConfig?.label || template.category}
        </span>
      </div>

      {/* 元数据 */}
      <div className="flex items-center space-x-3 text-xs text-gray-500 mb-4">
        <span>版本 {template.version}</span>
        <span>•</span>
        <span>{template.nodeCount} 个节点</span>
        <span>•</span>
        <span>{template.metadata.lastModified}</span>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => navigate(`/workflow-designer/${template.id}`)}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Edit size={16} className="mr-2" />
          {template.isSystemTemplate ? '查看' : '编辑'}
        </button>

        {onDuplicate && (
          <button
            onClick={() => onDuplicate(template.id)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            title="复制模板"
          >
            <Copy size={16} />
          </button>
        )}

        {!template.isSystemTemplate && onDelete && (
          <button
            onClick={() => onDelete(template.id)}
            className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
            title="删除模板"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TemplateCard;
