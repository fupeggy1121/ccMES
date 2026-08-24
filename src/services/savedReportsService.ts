// src/services/savedReportsService.ts
import { supabase } from '../lib/supabaseClient';
import { SavedReport } from '../data/mockSavedReports'; // 复用 SavedReport 接口
import { Sparkles, BarChart, TrendingUp, AlertTriangle, ClipboardList } from 'lucide-react';

const TABLE_NAME = 'saved_reports';

// 辅助函数：将数据库行转换为 SavedReport 接口
const mapRowToSavedReport = (row: any): SavedReport => ({
  id: row.id,
  name: row.report_name,
  type: row.report_type,
  description: row.description,
  icon: row.report_type === 'mes-chat' ? Sparkles : BarChart, // 默认图标，实际应根据类型映射
  queryParams: row.query_params,
  sqlQuery: row.sql_query, // <--- 确保此行存在
  // 新增字段的映射
  data: row.report_data || null,
  visualizationType: row.visualization_type || 'table',
  chartConfig: row.chart_config || {},
  // createdBy: row.created_by, // 如果需要，可以添加
  // createdAt: new Date(row.created_at),
  // updatedAt: new Date(row.updated_at),
});

// 辅助函数：将 SavedReport 接口转换为数据库行
const mapSavedReportToRow = (report: Partial<SavedReport>): any => ({
  report_name: report.name,
  report_type: report.type,
  description: report.description,
  query_params: report.queryParams,
  sql_query: report.sqlQuery, // <--- 确保此行存在
  // 新增字段的映射
  report_data: report.data,
  visualization_type: report.visualizationType,
  chart_config: report.chartConfig,
  created_by: report.created_by, // 如果需要，可以添加
});

export const savedReportsService = {
  async fetchSavedReports(): Promise<SavedReport[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved reports:', error);
      throw error;
    }
    // 假设 SavedReport 接口中的 icon 字段是动态生成的，这里需要根据 report_type 映射
    return data.map(row => ({
      ...mapRowToSavedReport(row),
      icon: row.report_type === 'mes-chat' ? Sparkles : (row.report_type === 'oee-report' ? BarChart : (row.report_type === 'quality-report' ? TrendingUp : (row.report_type === 'downtime-report' ? AlertTriangle : ClipboardList))) // 根据类型映射图标
    }));
  },

  async createSavedReport(report: Omit<SavedReport, 'id' | 'icon'>): Promise<SavedReport> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(mapSavedReportToRow(report))
      .select()
      .single();

    if (error) {
      console.error('Error creating saved report:', error);
      throw error;
    }
    return {
      ...mapRowToSavedReport(data),
      icon: data.report_type === 'mes-chat' ? Sparkles : (data.report_type === 'oee-report' ? BarChart : (data.report_type === 'quality-report' ? TrendingUp : (data.report_type === 'downtime-report' ? AlertTriangle : ClipboardList)))
    };
  },

  async deleteSavedReport(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting saved report:', error);
      throw error;
    }
  },
};