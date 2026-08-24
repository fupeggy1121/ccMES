import React, { useState } from 'react';
import { X } from 'lucide-react';
import { FormTemplate, FormTemplateCategory } from '../../types/form';
import { categoryConfigs } from '../../data/formTemplateRegistry';

interface CreateFormTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (template: Omit<FormTemplate, 'id'>) => FormTemplate;
}

const CreateFormTemplateDialog = ({ isOpen, onClose, onCreate }: CreateFormTemplateDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'custom' as FormTemplateCategory,
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '请输入模版名称';
    if (!formData.description.trim()) newErrors.description = '请输入模版描述';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newTemplate = onCreate({
      name: formData.name,
      category: formData.category,
      description: formData.description,
      fields: [],
      status: 'draft',
      version: '1.0.0',
      metadata: {
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: 'User',
        lastModified: new Date().toISOString().split('T')[0],
        lastModifiedBy: 'User'
      },
      isSystemTemplate: false
    });

    setFormData({ name: '', category: 'custom', description: '' });
    setErrors({});
    onClose();

    window.location.href = `/form-templates/${newTemplate.id}/edit`;
  };

  const handleClose = () => {
    setFormData({ name: '', category: 'custom', description: '' });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={handleClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">创建表单模版</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                模版名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="例如：产品质量检查表"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                模版分类 <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as FormTemplateCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categoryConfigs.map(cat => (
                  <option key={cat.category} value={cat.category}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                模版描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="简要描述此表单模版的用途和使用场景"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                创建并编辑
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateFormTemplateDialog;
