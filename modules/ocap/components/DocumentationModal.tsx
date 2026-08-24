import React, { useState } from 'react';
import { Monitor, Settings, AlertTriangle, BookOpen, X } from 'lucide-react';
import SystemOverview from './docs/SystemOverview';
import Architecture from './docs/Architecture';
import Scenarios from './docs/Scenarios';
import OcapFunctions from './docs/OcapFunctions';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const [modalTab, setModalTab] = useState('overview');

  const modalTabs = [
    { id: 'overview', label: '系统概述', icon: Monitor },
    { id: 'architecture', label: '架构设计', icon: Settings },
    { id: 'ocap_functions', label: '功能说明', icon: BookOpen },    
    { id: 'scenarios', label: '典型场景', icon: AlertTriangle },
  ];

  const renderModalContent = () => {
    switch (modalTab) {
      case 'overview':
        return <SystemOverview />;
      case 'architecture':
        return <Architecture />;
      case 'scenarios':
        return <Scenarios />;
      case 'ocap_functions':
        return <OcapFunctions />;
      default:
        return <SystemOverview />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <div className="bg-white">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                系统功能文档
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex">
              {/* 左侧标签页 */}
              <div className="w-48 bg-gray-50 border-r border-gray-200">
                <div className="p-4">
                  <div className="space-y-1">
                    {modalTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setModalTab(tab.id)}
                          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            modalTab === tab.id
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-4 h-4 mr-3" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* 右侧内容区域 */}
              <div className="flex-1 p-6 max-h-[80vh] overflow-y-auto">
                {renderModalContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationModal;