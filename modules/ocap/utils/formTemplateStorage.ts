import { FormTemplate } from '../types/form';

const STORAGE_KEY = 'ocap_form_templates';

export const formTemplateStorage = {
  getUserTemplates(): FormTemplate[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('加载表单模版失败:', error);
      return [];
    }
  },

  saveUserTemplates(templates: FormTemplate[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('保存表单模版失败:', error);
      throw new Error('保存失败，可能是存储空间不足');
    }
  },

  addTemplate(template: FormTemplate): void {
    const templates = this.getUserTemplates();
    templates.push(template);
    this.saveUserTemplates(templates);
  },

  updateTemplate(id: string, updates: Partial<FormTemplate>): void {
    const templates = this.getUserTemplates();
    const index = templates.findIndex(t => t.id === id);
    if (index !== -1) {
      templates[index] = { ...templates[index], ...updates };
      this.saveUserTemplates(templates);
    }
  },

  deleteTemplate(id: string): void {
    const templates = this.getUserTemplates();
    const filtered = templates.filter(t => t.id !== id);
    this.saveUserTemplates(filtered);
  },

  getTemplateById(id: string): FormTemplate | null {
    const templates = this.getUserTemplates();
    return templates.find(t => t.id === id) || null;
  }
};
