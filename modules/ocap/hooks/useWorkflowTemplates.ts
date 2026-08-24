import { useState, useEffect } from 'react';
import { WorkflowTemplate } from '../types/workflow';
import { systemTemplates } from '../data/workflowTemplateRegistry';
import { templateStorage } from '../utils/templateStorage';
import { convertCustomWorkflowToReactFlow } from '../utils/workflowConverter';

export const useWorkflowTemplates = () => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载所有模板（系统 + 用户）
  const loadTemplates = () => {
    setLoading(true);
    try {
      const userTemplates = templateStorage.getUserTemplates();


      const allTemplates = [...systemTemplates, ...userTemplates];
      setTemplates(allTemplates);
    } catch (error) {
      console.error('加载模板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 创建新模板
  const createTemplate = (templateData: Omit<WorkflowTemplate, 'id'>): WorkflowTemplate => {
    const newTemplate: WorkflowTemplate = {
      ...templateData,
      id: `user-${Date.now()}`, // 生成唯一ID
      version: templateData.version || '1.0', // 确保版本号被设置，如果未提供则默认为1.0
      nodeCount: templateData.workflowData?.length || 0, // nodeCount 应该基于 workflowData
    };
    templateStorage.addTemplate(newTemplate);
    loadTemplates();
    return newTemplate;
  };

  // 更新模板
  const updateTemplate = (id: string, updates: Partial<WorkflowTemplate>) => {
    // 找到要更新的模板
    const existingTemplate = templates.find(t => t.id === id);
    if (!existingTemplate) {
      throw new Error('模板不存在');
    }

    // 如果是系统模板，不允许修改除节点和边之外的元数据
    // 移除此处的系统模板修改限制，因为需求是允许编辑系统模板
    // if (existingTemplate.isSystemTemplate) {
    //   throw new Error('不能修改系统预定义模板');
    // }

    templateStorage.updateTemplate(id, {
      ...updates,
      nodeCount: updates.workflowData?.length || existingTemplate.nodeCount, // 更新 nodeCount      
      metadata: {
        ...existingTemplate.metadata, // 保留原有metadata
        ...updates.metadata, // 合并新的metadata
        lastModified: new Date().toISOString().split('T')[0] // 自动更新最后修改时间
      }
    });
    loadTemplates();
  };

  // 删除模板
  const deleteTemplate = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template?.isSystemTemplate) {
      throw new Error('不能删除系统预定义模板');
    }
    
    templateStorage.deleteTemplate(id);
    loadTemplates();
  };

  // 复制模板（基于系统模板创建用户模板）
  const duplicateTemplate = (sourceId: string, newName?: string) => {
    const source = templates.find(t => t.id === sourceId);
    if (!source) throw new Error('源模板不存在');

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
  };

  // 根据ID获取模板
  const getTemplateById = (id: string): WorkflowTemplate | undefined => {
    return templates.find(t => t.id === id);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

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