// src/components/MeasurementParameters.tsx
import React, { useMemo } from 'react';
import { WaferData, InspectionParameter } from '../types';
import { Plus, Info, Upload } from 'lucide-react'; // Import Plus, Info, and Upload icons
import { getStationParameterDefinitions, determineWaferType, determineDisposition, determineGrade, generateSimulatedInspectionParameters } from '../utils/inspectionHelpers'; // 导入辅助函数

interface MeasurementParametersProps {
  wafers: WaferData[];
  station: string;
  onParameterChange: (waferId: string, paramName: string, newValue: number) => void; // waferId 类型改为 string
  onAutoFillParameter: (waferId: string, paramName: string) => void; // For the '+' button, waferId 类型改为 string
  onWafersUpdate?: (updatedWafers: WaferData[]) => void; // 将 onWafersUpdate 标记为可选
  isReadOnly?: boolean; // 新增：只读模式属性
}

const MeasurementParameters: React.FC<MeasurementParametersProps> = ({
  wafers = [],
  station,
  onParameterChange,
  onAutoFillParameter,
  onWafersUpdate = () => {}, // 提供一个默认的空函数
  isReadOnly = false, // 默认非只读模式
}) => {
  const parameterDefinitions = useMemo(() => getStationParameterDefinitions(station), [station]);

  // 新增：处理导入Excel的逻辑
  const handleImportExcel = () => {
    if (isReadOnly) {
      return; // 只读模式下不执行导入
    }
    
    if (!station) {
      alert('请先选择一个站点。');
      return;
    }
    if (wafers.length === 0) {
      alert('没有晶圆片数据可供导入。');
      return;
    }

    const updatedWafers = wafers.map(wafer => {
      // 模拟从Excel导入数据，生成参数值
      const newParams = generateSimulatedInspectionParameters(station);

      // 根据新生成的参数值，更新晶圆片的类型、处置和档位
      const newType = determineWaferType(newParams);
      const newDisposition = determineDisposition(newType, newParams);
      const newGrade = determineGrade(station, newParams);

      return {
        ...wafer,
        inspectionParameters: newParams,
        type: newType,
        disposition: newDisposition,
        grade: newGrade,
        inspectionStatus: '已检验', // 标记为已检验
      };
    });

    onWafersUpdate(updatedWafers); // 将更新后的晶圆片数据传递给父组件
    alert('Excel参数导入成功，晶圆片信息已更新！');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4">
      <div className="px-6 py-3 border-b flex justify-between items-center"> {/* 调整布局以容纳按钮 */}
        <h2 className="text-base font-medium text-gray-700">量测参数</h2>
        <button
          onClick={handleImportExcel}
          disabled={isReadOnly}
          className={`inline-flex items-center px-3 py-1 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isReadOnly 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
          }`}
        >
          <Upload className="w-4 h-4 mr-2" />
          导入Excel
        </button>
      </div>
      <div className="p-6">
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="overflow-x-auto max-h-96"> {/* Added max-h-96 for scrollability */}
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="sticky top-0 z-30"> {/* Added sticky top-0 z-30 here */}
                <tr className="bg-gray-50">
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-0 z-20 bg-gray-50 w-[80px]">Sublot ID</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-[80px] z-20 bg-gray-50 w-[80px]">Carrier ID</th> {/* Adjust left value based on previous column width */}
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-[160px] z-20 bg-gray-50 w-[60px]">Slot NO</th> {/* Adjust left value */}
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-[220px] z-20 bg-gray-50 w-[120px]">Wafer ID</th> {/* Adjust left value */}
                  {parameterDefinitions.map((param, index) => (
                    <th key={index} className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {param.name} ({param.unit})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wafers.length > 0 ? (
                  wafers.map((wafer) => (
                    <tr key={wafer.id}>
                      <td className="px-2 py-2 whitespace-nowrap sticky left-0 z-10 bg-white w-[80px]">{wafer.sublotId}</td>
                      <td className="px-2 py-2 whitespace-nowrap sticky left-[80px] z-10 bg-white w-[80px]">{wafer.carrierId}</td>
                      <td className="px-2 py-2 whitespace-nowrap sticky left-[160px] z-10 bg-white w-[60px]">{wafer.slotNo}</td>
                      <td className="px-2 py-2 whitespace-nowrap sticky left-[220px] z-10 bg-white w-[120px]">{wafer.waferId}</td>
                      {parameterDefinitions.map((paramDef, index) => {
                        const currentParam = wafer.inspectionParameters?.find(p => p.name === paramDef.name);
                        const paramValue = currentParam ? currentParam.value : '';

                        return (
                          <td key={index} className="px-2 py-2 whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              <input
                                type="number" // Assuming numerical input for parameters
                                value={paramValue}
                                onChange={(e) => onParameterChange(wafer.id, paramDef.name, parseFloat(e.target.value))}
                                disabled={isReadOnly}
                                className={`w-20 border border-gray-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 ${
                                  isReadOnly 
                                    ? 'bg-gray-100 cursor-not-allowed' 
                                    : 'bg-white focus:ring-blue-500'
                                }`}
                                placeholder="输入值"
                              />
                              <button
                                onClick={() => onAutoFillParameter(wafer.id, paramDef.name)}
                                disabled={isReadOnly}
                                className={`p-1 rounded text-xs ${
                                  isReadOnly 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                                title="EAP自动获取/自动填充"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                className="p-1 text-gray-500 hover:text-gray-700 text-xs"
                                title={`参数详情: ${paramDef.name} (${paramDef.unit})`}
                              >
                                <Info className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4 + parameterDefinitions.length} className="px-6 py-4 text-center text-sm text-gray-400">
                      无晶圆片数据或未生成参数
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeasurementParameters;