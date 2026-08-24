// src/components/ProductionPlan/ProductionPlanModule.tsx
import React from 'react';
import { ProductionPlan } from './ProductionPlan';
import { BOMManagement } from '../BOM/BOMManagement';
import { Dashboard } from '../Dashboard/Dashboard'; // 导入 Dashboard 组件

interface ProductionPlanModuleProps {
  activeTab: string;
}

export const ProductionPlanModule: React.FC<ProductionPlanModuleProps> = ({ activeTab }) => {
  console.log('ProductionPlanModule.tsx: received activeTab:', activeTab); // 添加日志
  const renderContent = () => {
    switch (activeTab) {
      case 'production-plan':
        return <ProductionPlan />;
      case 'bom-management':
        return <BOMManagement />;
      case 'wafer-preparation': // 新增 case
        return <Dashboard />; // 渲染 Dashboard 组件
      default:
        return <ProductionPlan />;
    }
  };

  return (
    <div className="h-full">
      {renderContent()}
    </div>
  );
};
