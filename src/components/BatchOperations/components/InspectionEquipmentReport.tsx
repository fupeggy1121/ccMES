import React from 'react';
import { FileText, Calendar, User, Settings } from 'lucide-react';

interface InspectionEquipmentReportProps {
  // 可以根据需要添加props
}

const InspectionEquipmentReport: React.FC<InspectionEquipmentReportProps> = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-blue-600 mr-3" />
              <h1 className="text-2xl font-semibold text-gray-800">设备检验报告</h1>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 报告概览卡片 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-800">今日检验</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">已完成:</span>
                    <span className="font-semibold text-green-600">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">进行中:</span>
                    <span className="font-semibold text-blue-600">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">待检验:</span>
                    <span className="font-semibold text-orange-600">5</span>
                  </div>
                </div>
              </div>

              {/* 设备状态卡片 */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Settings className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-800">设备状态</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">正常运行:</span>
                    <span className="font-semibold text-green-600">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">维护中:</span>
                    <span className="font-semibold text-yellow-600">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">故障:</span>
                    <span className="font-semibold text-red-600">0</span>
                  </div>
                </div>
              </div>

              {/* 检验员信息卡片 */}
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <User className="w-5 h-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-800">检验员</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">在线:</span>
                    <span className="font-semibold text-green-600">6</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">忙碌:</span>
                    <span className="font-semibold text-orange-600">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">离线:</span>
                    <span className="font-semibold text-gray-600">1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 详细报告表格 */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">检验报告详情</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">设备编号</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">设备名称</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">检验时间</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">检验员</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">状态</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">结果</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-sm">HJMVIV09</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">退火前腐后检验设备</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">2025-01-11 09:30</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">张三</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          已完成
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          合格
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-sm">HJMVIV10</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">腐后清洗设备</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">2025-01-11 10:15</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">李四</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          进行中
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">-</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 text-sm">HJMVIV11</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">质量检测设备</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">2025-01-11 11:00</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">王五</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          待检验
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionEquipmentReport;