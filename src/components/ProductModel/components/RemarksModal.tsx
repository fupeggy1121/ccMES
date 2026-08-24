import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface RemarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  remarks: string[];
  onSave: (remarks: string[]) => void;
}

const RemarksModal: React.FC<RemarksModalProps> = ({
  isOpen,
  onClose,
  remarks,
  onSave
}) => {
  const [localRemarks, setLocalRemarks] = useState<string[]>([]);

  useEffect(() => {
    setLocalRemarks(remarks.length > 0 ? remarks : ['']);
  }, [remarks]);

  const handleAddRemark = () => {
    setLocalRemarks([...localRemarks, '']);
  };

  const handleRemoveRemark = (index: number) => {
    if (localRemarks.length > 1) {
      setLocalRemarks(localRemarks.filter((_, i) => i !== index));
    }
  };

  const handleRemarkChange = (index: number, value: string) => {
    const updated = [...localRemarks];
    updated[index] = value;
    setLocalRemarks(updated);
  };

  const handleSave = () => {
    const filteredRemarks = localRemarks.filter(remark => remark.trim() !== '');
    onSave(filteredRemarks);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">站点备注</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
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
            className="mt-4 flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加备注
          </button>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemarksModal;