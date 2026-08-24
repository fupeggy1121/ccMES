// src/services/productBOMsService.ts
import { supabase } from '../lib/supabaseClient';
import { BOMTemplate } from '../types'; // Assuming BOMTemplate is defined in types.ts

const TABLE_NAME = 'product_boms';

// Helper function to map database row to BOMTemplate interface
const mapRowToBOMTemplate = (row: any): BOMTemplate => ({
  id: row.id,
  templateName: row.template_name,
  templateCode: row.template_code,
  productType: row.product_type,
  version: row.version,
  description: row.description,
  status: row.status,
  bomItems: row.bom_items || [],
  totalAmount: parseFloat(row.total_amount),
  createdBy: row.created_by,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

// Helper function to map BOMTemplate interface to database row
const mapBOMTemplateToRow = (template: Partial<BOMTemplate>): any => ({
  template_name: template.templateName,
  template_code: template.templateCode,
  product_type: template.productType,
  version: template.version,
  description: template.description,
  status: template.status,
  bom_items: template.bomItems,
  total_amount: template.totalAmount,
  created_by: template.createdBy,
});

export const productBOMsService = {
  async fetchBOMTemplates(): Promise<BOMTemplate[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching BOM templates:', error);
      throw error;
    }
    return data.map(mapRowToBOMTemplate);
  },

  async createBOMTemplate(template: Omit<BOMTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<BOMTemplate> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(mapBOMTemplateToRow(template))
      .select()
      .single();

    if (error) {
      console.error('Error creating BOM template:', error);
      throw error;
    }
    return mapRowToBOMTemplate(data);
  },

  async updateBOMTemplate(id: string, updates: Partial<BOMTemplate>): Promise<BOMTemplate> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(mapBOMTemplateToRow(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating BOM template:', error);
      throw error;
    }
    return mapRowToBOMTemplate(data);
  },

  async deleteBOMTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting BOM template:', error);
      throw error;
    }
  },
};
