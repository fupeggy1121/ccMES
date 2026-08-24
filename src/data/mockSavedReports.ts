// src/data/mockSavedReports.ts
import { Sparkles, BarChart, TrendingUp, AlertTriangle, ClipboardList } from 'lucide-react';
import React from 'react';

export interface SavedReport {
  id: string;
  name: string;
  type: 'mes-chat' | 'generic-report' | 'oee-report' | 'quality-report' | 'downtime-report' | 'production-summary-report'; // 定义报告类型
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; // 使用 React ComponentType 作为图标类型
  description?: string;
  queryParams?: Record<string, any>; // 报告可能需要的查询参数
  sqlQuery?: string; // <--- 确保此行存在：存储SQL查询语句
  // 新增字段：用于存储图表数据和配置
  data?: any[];
  visualizationType?: 'bar' | 'line' | 'pie' | 'scatter' | 'card' | 'gauge' | 'table' | 'heatmap' | 'radar' | 'funnel' | 'treemap';
  chartConfig?: {
    title?: string;
    xAxisField?: string;
    yAxisField?: string;
    colorField?: string;
    valueField?: string;
    cardTheme?: 'success' | 'warning' | 'danger' | 'info';
    trend?: { direction: 'up' | 'down' | 'stable'; value: number };
    comparisonValue?: { label: string; value: number };
    gaugeMin?: number;
    gaugeMax?: number;
    gaugeThresholds?: number[];
  };
  created_by?: string; // 新增：创建人
  created_at?: Date; // 新增：创建时间
  updated_at?: Date; // 新增：更新时间
}

// 将 Lucide Icons 作为 SavedReport 的静态属性导出，以便在 service 中引用
export namespace SavedReport {
  export const Sparkles = Sparkles;
  export const BarChart = BarChart;
  export const TrendingUp = TrendingUp;
  export const AlertTriangle = AlertTriangle;
  export const ClipboardList = ClipboardList;
}