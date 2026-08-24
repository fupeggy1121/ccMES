// src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { LeftSidebar } from './components/Layout/LeftSidebar';
import { menuItems } from './config/menuConfig';
import { CarrierList } from './components/Carriers/CarrierList';
import { CarrierGroupModule } from './components/Carriers/CarrierGroupModule';
import { ProductionPlanModule } from './components/ProductionPlan/ProductionPlanModule';
import { ShipmentManagementModule } from './components/Shipment/ShipmentManagementModule';
import { EquipmentManagement } from './components/Equipment/EquipmentManagement';
import { AuxiliaryLifetimeManagement } from './components/Auxiliary/AuxiliaryLifetimeManagement';
import { LifetimeControlModeling } from './components/Auxiliary/LifetimeControlModeling';
import { CleaningRecordsModule } from './components/Carriers/CleaningRecordsModule';
import FinishedProductInboundModule from './components/FinishedProduct/FinishedProductInboundModule';
import BatchOperationsModule from './components/BatchOperations/BatchOperationsModule';
import MRBManagement from './components/MRB/MRBManagement';
import ProductModelManagement from './components/ProductModel/ProductModelManagement';
import { debounce } from 'lodash';


// Helper function to recursively find the first leaf node in menu structure
const findFirstLeafSubItem = (menuItem: any): string => {
  if (!menuItem.subItems || menuItem.subItems.length === 0) {
    return menuItem.id;
  }
  return findFirstLeafSubItem(menuItem.subItems[0]);
};


function App() {
  const [activeTopModule, setActiveTopModule] = useState('wip-management');
  const [activeSubModule, setActiveSubModule] = useState('fragment-management');

  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  // Set initial active sub-module on mount
  const getInitialActiveSubModule = useCallback((): string => {
    if (menuItems.length === 0) return 'production-plan';
    const firstTopModule = menuItems[0];
    if (!firstTopModule.subItems || firstTopModule.subItems.length === 0) {
      return firstTopModule.id;
    }
    return findFirstLeafSubItem(firstTopModule.subItems[0]);
  }, []);

  useEffect(() => {
    // 默认路由已在 useState 初始值中设定（生产管理 > 批次作业），无需重置
  }, [getInitialActiveSubModule]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const debouncedSearch = debounce((value: string) => {
    console.log('执行搜索:', value);
  }, 500);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const DEFAULT_SUB_MODULE_MAP: Record<string, string> = {
    'basic-config-management': 'product-model-management-external',
  };

  const handleTopModuleChange = (moduleId: string) => {
    console.log('App.tsx: handleTopModuleChange called with moduleId:', moduleId);
    const newTopModule = menuItems.find(item => item.id === moduleId);
    setActiveTopModule(moduleId);
    if (DEFAULT_SUB_MODULE_MAP[moduleId]) {
      setActiveSubModule(DEFAULT_SUB_MODULE_MAP[moduleId]);
    } else if (newTopModule?.subItems && newTopModule.subItems.length > 0) {
      const firstLeafSubItemId = findFirstLeafSubItem(newTopModule.subItems[0]);
      setActiveSubModule(firstLeafSubItemId);
    } else {
      setActiveSubModule(moduleId);
    }
  };

  const handleSubModuleChange = (subModuleId: string) => {
    console.log('App.tsx: handleSubModuleChange called with subModuleId:', subModuleId);
    setActiveSubModule(subModuleId);
  };

  const renderMainContent = () => {
    console.log('App.tsx: renderContent - current activeSubModule:', activeSubModule);

    switch (activeSubModule) {
      case 'production-plan':
      case 'bom-management':
      case 'wafer-preparation':
        return <ProductionPlanModule activeTab={activeSubModule} />;
      case 'carrier-registration':
        return <CarrierList />;
      case 'carrier-group':
        return <CarrierGroupModule />;
      case 'cleaning-task-records':
        return <CleaningRecordsModule />;
      case 'finished-product-batch':
        return <FinishedProductInboundModule />;
      case 'auxiliary-lifetime-management':
        return <AuxiliaryLifetimeManagement />;
      case 'lifetime-control-modeling':
        return <LifetimeControlModeling />;
      case 'shipment-management':
        return <ShipmentManagementModule initialActiveTab={'shipping'} />;
      case 'equipment-management':
        return <EquipmentManagement />;
      case 'fragment-management':
        return <BatchOperationsModule />;
      case 'mrb-management':
        return <MRBManagement />;
      case 'product-model-management-external':
        return <ProductModelManagement />;
      default:
        console.warn(`未知的子模块: ${activeSubModule}`);
        return null;
    }
  };

  // 如果 activeSubModule 为空，显示加载中
  if (!activeSubModule) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header with User Info and Navigation */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="px-6">
          <div className="flex items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800 mr-6">外延MES</h1>
            </div>

            {/* Top Menu Navigation */}
            <div className="flex-1">
              <nav className="flex space-x-1">
                {menuItems.map((item) => {
                  const isActive = activeTopModule === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTopModuleChange(item.id)}
                      className={`
                        inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                        transition-colors duration-200 h-full
                        ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                        }
                      `}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center space-x-4 ml-auto">
              <div className="flex items-center text-sm text-gray-600">
                <span>{currentTime.toLocaleTimeString('zh-CN')}</span>
              </div>

              <button className="relative flex items-center text-sm text-gray-600 hover:text-yellow-600">
                <span className="mr-1">3条告警</span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">张</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Left Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar
          menuItems={menuItems}
          activeTopModule={activeTopModule}
          activeSubModule={activeSubModule}
          onSubModuleChange={handleSubModuleChange}
        />

        <main className="flex-1 p-6 overflow-auto bg-gray-50">
          {renderMainContent()}
        </main>
      </div>
    </div>
    </>
  );
}

export default App;
