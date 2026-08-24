import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Parameter } from '../types/Product';

interface ParameterSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  parameters: Parameter[];
  selectedParameters: Parameter[];
  onSave: (selectedParams: Parameter[]) => void;
  isDeviationContext?: boolean;
}

const ParameterSelectionModal: React.FC<ParameterSelectionModalProps> = ({
  isOpen,
  onClose,
  title,
  parameters,
  selectedParameters,
  onSave,
  isDeviationContext = false
}) => {
  const [localSelected, setLocalSelected] = useState<Parameter[]>([]);

  useEffect(() => {
    // 根据是否在偏离上下文中初始化选中参数
    const initializedSelected = selectedParameters.map(param => {
      if (isDeviationContext) {
        // 在偏离上下文中，优先使用偏离限制
        return {
          ...param,
          deviatedUpperLimit: param.deviatedUpperLimit || param.upperLimit || '',
          deviatedLowerLimit: param.deviatedLowerLimit || param.lowerLimit || ''
        };
      } else {
        // 在普通上下文中，使用普通限制
        return {
          ...param,
          upperLimit: param.upperLimit || '',
          lowerLimit: param.lowerLimit || ''
        };
      }
    });
    setLocalSelected(initializedSelected);
  }, [selectedParameters, isDeviationContext]);

  const handleToggleParameter = (parameter: Parameter) => {
    const isSelected = localSelected.some(p => p.id === parameter.id);
    if (isSelected) {
      setLocalSelected(localSelected.filter(p => p.id !== parameter.id));
    } else {
      // 添加参数时根据上下文初始化限制
      if (isDeviationContext) {
        // 在偏离上下文中，初始化偏离限制为原始限制
        setLocalSelected([...localSelected, {
          ...parameter,
          deviatedUpperLimit: parameter.upperLimit || '',
          deviatedLowerLimit: parameter.lowerLimit || ''
        }]);
      } else {
        // 在普通上下文中，初始化普通限制
        setLocalSelected([...localSelected, {
          ...parameter,
          upperLimit: parameter.upperLimit || '',
          lowerLimit: parameter.lowerLimit || ''
        }]);
      }
    }
  };

  const handleLimitChange = (parameterId: string, limitType: 'upper' | 'lower', value: string) => {
    setLocalSelected(prev => 
      prev.map(param => {
        if (param.id !== parameterId) return param;
        
        if (isDeviationContext) {
          // 在偏离上下文中，更新偏离限制
          return {
            ...param,
            [limitType === 'upper' ? 'deviatedUpperLimit' : 'deviatedLowerLimit']: value
          };
        } else {
          // 在普通上下文中，更新普通限制
          return {
            ...param,
            [limitType === 'upper' ? 'upperLimit' : 'lowerLimit']: value
          };
        }
      })
    );
  };

  const handleSave = () => {
    onSave(localSelected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl m-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    选择
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    参数名称
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    单位
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    描述
                  </th>
                  
                  {/* 条件性渲染表格列 */}
                  {isDeviationContext ? (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        原始上限
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        原始下限
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        偏离上限
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        偏离下限
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        上限
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        下限
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parameters.map((parameter) => {
                  const isSelected = localSelected.some(p => p.id === parameter.id);
                  const selectedParam = localSelected.find(p => p.id === parameter.id);
                  
                  return (
                    <tr key={parameter.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleParameter(parameter)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{parameter.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{parameter.unit || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{parameter.description || '-'}</td>
                      
                      {/* 条件性渲染限制输入框 */}
                      {isDeviationContext ? (
                        <>
                          {/* 原始限制（只读） */}
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={parameter.upperLimit || ''}
                              disabled
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-100 text-gray-500"
                              placeholder="原始上限"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={parameter.lowerLimit || ''}
                              disabled
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-100 text-gray-500"
                              placeholder="原始下限"
                            />
                          </td>
                          {/* 偏离限制（可编辑） */}
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={selectedParam?.deviatedUpperLimit || ''}
                              onChange={(e) => handleLimitChange(parameter.id, 'upper', e.target.value)}
                              disabled={!isSelected}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              placeholder="偏离上限"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={selectedParam?.deviatedLowerLimit || ''}
                              onChange={(e) => handleLimitChange(parameter.id, 'lower', e.target.value)}
                              disabled={!isSelected}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              placeholder="偏离下限"
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          {/* 普通限制（可编辑） */}
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={selectedParam?.upperLimit || ''}
                              onChange={(e) => handleLimitChange(parameter.id, 'upper', e.target.value)}
                              disabled={!isSelected}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              placeholder="上限"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={selectedParam?.lowerLimit || ''}
                              onChange={(e) => handleLimitChange(parameter.id, 'lower', e.target.value)}
                              disabled={!isSelected}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              placeholder="下限"
                            />
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

export default ParameterSelectionModal;