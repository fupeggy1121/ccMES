import { WorkflowTemplate } from '../types/workflow';

const STORAGE_KEY = 'ocap_workflow_templates';

export const templateStorage = {
  // 获取所有用户创建的模板
  getUserTemplates(): WorkflowTemplate[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('加载模板失败:', error);
      return [];
    }
  },

  // 保存用户模板
  saveUserTemplates(templates: WorkflowTemplate[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('保存模板失败:', error);
      throw new Error('保存失败，可能是存储空间不足');
    }
  },

  // 添加新模板
  addTemplate(template: WorkflowTemplate): void {
    const templates = this.getUserTemplates();
    templates.push(template);
    this.saveUserTemplates(templates);
  },

  // 更新模板
  updateTemplate(id: string, updates: Partial<WorkflowTemplate>): void {
    const templates = this.getUserTemplates();
    const index = templates.findIndex(t => t.id === id);
    if (index !== -1) {
      templates[index] = { ...templates[index], ...updates };
      this.saveUserTemplates(templates);
    }
  },

  // 删除模板
  deleteTemplate(id: string): void {
    const templates = this.getUserTemplates();
    const filtered = templates.filter(t => t.id !== id);
    this.saveUserTemplates(filtered);
  },

  // 根据ID获取模板
  getTemplateById(id: string): WorkflowTemplate | null {
    const templates = this.getUserTemplates();
    return templates.find(t => t.id === id) || null;
  }
};
