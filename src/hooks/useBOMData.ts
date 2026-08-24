// src/hooks/useBOMData.ts
import { useState, useEffect } from 'react';
import { productBOMsService } from '../services/productBOMsService'; // 新增导入
import { BOMTemplate, BOMTemplateItem } from '../types'; // 导入 BOMTemplate 接口

// BOM-specific types (moved to types/index.ts)
// interface BOMTemplate { ... }
// interface BOMTemplateItem { ... }

// Mock data generator (removed, now using Supabase service)

export const useBOMData = () => {
  const [bomTemplates, setBomTemplates] = useState<BOMTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await productBOMsService.fetchBOMTemplates();
        setBomTemplates(data);
      } catch (error) {
        console.error('Failed to fetch BOM templates:', error);
        // Handle error appropriately
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const createBOMTemplate = async (templateData: Omit<BOMTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTemplate = await productBOMsService.createBOMTemplate(templateData);
      setBomTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (error) {
      console.error('Failed to create BOM template:', error);
      throw error;
    }
  };

  const updateBOMTemplate = async (templateId: string, templateData: Partial<BOMTemplate>) => {
    try {
      const updatedTemplate = await productBOMsService.updateBOMTemplate(templateId, templateData);
      setBomTemplates(prev => prev.map(template => 
        template.id === templateId 
          ? updatedTemplate
          : template
      ));
      return updatedTemplate;
    } catch (error) {
      console.error('Failed to update BOM template:', error);
      throw error;
    }
  };

  const deleteBOMTemplate = async (templateId: string) => {
    try {
      await productBOMsService.deleteBOMTemplate(templateId);
      setBomTemplates(prev => prev.filter(template => template.id !== templateId));
    } catch (error) {
      console.error('Failed to delete BOM template:', error);
      throw error;
    }
  };

  return {
    bomTemplates,
    loading,
    createBOMTemplate,
    updateBOMTemplate,
    deleteBOMTemplate
  };
};
