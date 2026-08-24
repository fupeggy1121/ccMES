import React, { useState } from 'react';
import { X } from 'lucide-react';
import { WorkflowTemplate } from '../../types/workflow';
import { categoryConfigs } from '../../data/workflowTemplateRegistry';

interface CreateTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (template: Omit<WorkflowTemplate, 'id' | 'isSystemTemplate'>) => void;
}

const CreateTemplateDialog: React.FC<CreateTemplateDialogProps> = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'custom' as WorkflowTemplate['category'],
    description: '',
    version: '1.0'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      status: 'draft',
      nodeCount: 0,
      workflowData: [],
      metadata: {
        lastModified: new Date().toISOString().split('T')[0],
        createdBy: 'User',
        tags: []
      }
    });
    setFormData({ name: '', category: 'custom', description: '', version: '1.0' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">创建工作流模板</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                模板名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：压力异常处理流程"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                类别 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categoryConfigs.map(cat => (
                  <option key={cat.category} value={cat.category}>
                    {cat.label} - {cat.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="简要描述该工作流的用途和适用场景"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                版本号
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1.0"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTemplateDialog;
