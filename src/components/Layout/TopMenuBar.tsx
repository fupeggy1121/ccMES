// src/components/Layout/TopMenuBar.tsx
import React from 'react';
import { MenuItem } from '../../config/menuConfig';

interface TopMenuBarProps {
  menuItems: MenuItem[];
  activeTopModule: string;
  onTopModuleChange: (moduleId: string) => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({ 
  menuItems, 
  activeTopModule, 
  onTopModuleChange 
}) => {
  return (
    <div className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <nav className="ml-6 flex space-x-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTopModule === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onTopModuleChange(item.id)}
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
                    <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};