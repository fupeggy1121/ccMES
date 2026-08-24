// src/components/BatchRemarksEditor.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface BatchRemarksEditorProps {
  remarks: string[];
  onRemarksChange: (remarks: string[]) => void;
}

const BatchRemarksEditor: React.FC<BatchRemarksEditorProps> = ({
  remarks,
  onRemarksChange
}) => {
  const [localRemarks, setLocalRemarks] = useState<string[]>([]);

  useEffect(() => {
    setLocalRemarks(remarks.length > 0 ? remarks : ['']);
  }, [remarks]);

  const handleAddRemark = () => {
    const updatedRemarks = [...localRemarks, ''];
    setLocalRemarks(updatedRemarks);
    onRemarksChange(updatedRemarks);
  };

  const handleRemoveRemark = (index: number) => {
    if (localRemarks.length > 1) {
      const updatedRemarks = localRemarks.filter((_, i) => i !== index);
      setLocalRemarks(updatedRemarks);
      onRemarksChange(updatedRemarks);
    }
  };

  const handleRemarkChange = (index: number, value: string) => {
    const updated = [...localRemarks];
    updated[index] = value;
    setLocalRemarks(updated);
    onRemarksChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {localRemarks.map((remark, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={remark}
                onChange={(e) => handleRemarkChange(index, e.target.value)}
                placeholder={`备注 ${index + 1}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => handleRemoveRemark(index)}
              disabled={localRemarks.length === 1}
              className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              title="删除备注"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleAddRemark}
        className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
      >
        <Plus className="w-4 h-4" />
        添加备注
      </button>
    </div>
  );
};

export default BatchRemarksEditor;