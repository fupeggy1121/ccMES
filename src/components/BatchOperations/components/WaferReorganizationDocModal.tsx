// src/components/WaferReorganizationDocModal.tsx
import React from 'react';
import { X, BookOpen } from 'lucide-react'; // Using BookOpen for documentation

interface WaferReorganizationDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string; // The documentation content
}

const WaferReorganizationDocModal: React.FC<WaferReorganizationDocModalProps> = ({ isOpen, onClose, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b flex-shrink-0 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-blue-600" />
            片篮重组模块功能说明
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Documentation content */}
        <div className="flex-grow overflow-y-auto p-5 text-gray-700 text-sm leading-relaxed prose max-w-none">
          {/* Using dangerouslySetInnerHTML to render markdown-like content.
              In a real application, consider a markdown renderer library for security and better rendering. */}
          <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>').replace(/### (.*)/g, '<h3>$1</h3>').replace(/## (.*)/g, '<h2>$1</h2>').replace(/\* (.*)/g, '<li>$1</li>').replace(/`([^`]+)`/g, '<code>$1</code>') }} />
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-5 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaferReorganizationDocModal;
