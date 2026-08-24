// src/components/ProcessParameters.tsx
import React, { useMemo } from 'react';
import { WaferData, InspectionParameter } from '../types';
import { Plus, Info, Upload } from 'lucide-react'; // Import Plus, Info, and Upload icons
import { getStationParameterDefinitions, determineWaferType, determineDisposition, determineGrade, generateSimulatedInspectionParameters } from '../utils/inspectionHelpers'; // 导入辅助函数

interface ProcessParametersProps {
  wafers: WaferData[];
  station: string;
  onParameterChange: (waferId: string, paramName: string, newValue: number) => void; // waferId 类型改为 string
  onAutoFillParameter: (waferId: string, paramName: string) => void; // waferId 类型改为 string
  onWafersUpdate?: (updatedWafers: WaferData[]) => void; // 将 onWafersUpdate 标记为可选
}

const ProcessParameters: React.FC<ProcessParametersProps> = ({
  wafers = [],
  station,
  onParameterChange,
  onAutoFillParameter,
  onWafersUpdate = () => {}, // 提供一个默认的空函数
}) => {
  const parameterDefinitions = useMemo(() => getStationParameterDefinitions(station), [station]);

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4">
      <div className="px-6 py-3 border-b">
        <h2 className="text-base font-medium text-gray-700">量测参数</h2>
      </div>
      <div className="p-6">
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="sticky top-0 z-30">
                <tr className="bg-gray-50">
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-0 z-20 bg-gray-50 w-[80px]">Sublot ID</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-[80px] z-20 bg-gray-50 w-[80px]">Carrier ID</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-[160px] z-20 bg-gray-50 w-[60px]">Slot NO</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-[220px] z-20 bg-gray-50 w-[120px]">Wafer ID</th>
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
                            <span>{paramValue}</span>
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

export default ProcessParameters;
