// src/components/Layout/LeftSidebar.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MenuItem } from '../../config/menuConfig';

interface LeftSidebarProps {
  menuItems: MenuItem[];
  activeTopModule: string;
  activeSubModule: string;
  onSubModuleChange: (subModuleId: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  menuItems,
  activeTopModule,
  activeSubModule,
  onSubModuleChange,
}) => {
  const currentTopModule = menuItems.find(item => item.id === activeTopModule);
  const subMenuItems = currentTopModule?.subItems || [];

  const collectAllExpandableIds = (items: MenuItem[]): Record<string, boolean> => {
    const expandableIds: Record<string, boolean> = {};
    const traverseItems = (menuItems: MenuItem[]) => {
      menuItems.forEach(item => {
        if (item.subItems && item.subItems.length > 0) {
          expandableIds[item.id] = true;
          traverseItems(item.subItems);
        }
      });
    };
    traverseItems(items);
    return expandableIds;
  };

  const [expandedFirstLevelMenus, setExpandedFirstLevelMenus] = useState<Record<string, boolean>>(() => {
    return collectAllExpandableIds(subMenuItems);
  });

  const handleSubMenuClick = (subItem: MenuItem) => {
    if (subItem.subItems && subItem.subItems.length > 0) {
      setExpandedFirstLevelMenus(prev => ({
        ...prev,
        [subItem.id]: !prev[subItem.id]
      }));
      if (!expandedFirstLevelMenus[subItem.id] && subItem.subItems.length > 0) {
        const firstLeaf = findFirstLeafNode(subItem);
        if (firstLeaf) {
          onSubModuleChange(firstLeaf.id);
        }
      }
    } else if (subItem.href) {
      window.open(subItem.href, '_blank', 'noopener,noreferrer');
    } else {
      onSubModuleChange(subItem.id);
    }
  };

  const findFirstLeafNode = (menuItem: MenuItem): MenuItem | null => {
    if (!menuItem.subItems || menuItem.subItems.length === 0) {
      return menuItem;
    }
    for (const child of menuItem.subItems) {
      const leaf = findFirstLeafNode(child);
      if (leaf) return leaf;
    }
    return null;
  };

  const renderMenuItems = (items: MenuItem[], level = 0) => {
    return items.map((item) => {
      const Icon = item.icon;
      const hasSubItems = item.subItems && item.subItems.length > 0;
      const isExpanded = expandedFirstLevelMenus[item.id];
      const isActive = activeSubModule === item.id;
      const isExternalLink = !!item.href && !hasSubItems;
      const paddingLeft = level === 0 ? 'pl-3' : 'pl-9';

      return (
        <div key={item.id}>
          <button
            onClick={() => handleSubMenuClick(item)}
            className={`
              w-full flex items-center px-3 py-2 rounded-md text-sm font-medium
              transition-colors duration-200 ${paddingLeft}
              ${
                isActive && !isExternalLink
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
              }
            `}
          >
            <Icon className={`w-4 h-4 mr-3 ${
              isActive && !isExternalLink ? 'text-blue-700' : 'text-gray-500'
            }`} />
            <span className="flex-1 text-left">{item.label}</span>
            
            {hasSubItems && (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )
            )}
            
            {isExternalLink && (
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            )}
          </button>
          
          {hasSubItems && isExpanded && (
            <div className="ml-2">
              {renderMenuItems(item.subItems!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-56 bg-white shadow-sm border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {currentTopModule?.label}
        </h3>
        <nav className="space-y-1">
          {renderMenuItems(subMenuItems)}
        </nav>
      </div>
    </div>
  );
};
