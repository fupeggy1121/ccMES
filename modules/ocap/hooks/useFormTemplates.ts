import { useState, useEffect, useCallback } from 'react';
import { FormTemplate } from '../types/form';
import { systemFormTemplates } from '../data/formTemplateRegistry';
import { formTemplateStorage } from '../utils/formTemplateStorage';

export const useFormTemplates = () => {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = useCallback(() => {
    setLoading(true);
    try {
      const userTemplates = formTemplateStorage.getUserTemplates();
      const allTemplates = [...systemFormTemplates, ...userTemplates];
      setTemplates(allTemplates);
    } catch (error) {
      console.error('加载表单模版失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTemplate = useCallback((template: Omit<FormTemplate, 'id'>) => {
    const newTemplate: FormTemplate = {
      ...template,
      id: `user-${Date.now()}`,
      isSystemTemplate: false
    };
    formTemplateStorage.addTemplate(newTemplate);
    loadTemplates();
    return newTemplate;
  }, [loadTemplates]);

  const updateTemplate = useCallback((id: string, updates: Partial<FormTemplate>) => {
    const template = templates.find(t => t.id === id);
    if (!template) {
      throw new Error('源模版不存在'); // 修正错误信息，保持一致性
    }

    formTemplateStorage.updateTemplate(id, {
      ...updates,
      metadata: {
        ...updates.metadata,
        lastModified: new Date().toISOString().split('T')[0]
      }
    });
    loadTemplates();
  }, [templates, loadTemplates]);

  const deleteTemplate = useCallback((id: string) => {
    const template = templates.find(t => t.id === id);
    if (template?.isSystemTemplate) {
      throw new Error('不能删除系统预定义模版');
    }

    formTemplateStorage.deleteTemplate(id);
    loadTemplates();
  }, [templates, loadTemplates]);

  const duplicateTemplate = useCallback((sourceId: string, newName?: string) => {
    const source = templates.find(t => t.id === sourceId);
    if (!source) throw new Error('源模版不存在');

    const newTemplate = createTemplate({
      ...source,
      name: newName || `${source.name} (副本)`,
      status: 'draft',
      isSystemTemplate: false,
      metadata: {
        ...source.metadata,
        createdBy: 'User',
        lastModified: new Date().toISOString().split('T')[0]
      }
    });

    return newTemplate;
  }, [templates, createTemplate]);

  const getTemplateById = useCallback((id: string): FormTemplate | undefined => {
    return templates.find(t => t.id === id);
  }, [templates]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    loading,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    getTemplateById
  };
};