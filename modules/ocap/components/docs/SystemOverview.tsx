import React from 'react';
import { Server, Database, Zap, Shield, Clock, Users } from 'lucide-react';

const SystemOverview: React.FC = () => {
  const features = [
    {
      icon: Zap,
      title: '实时异常检测',
      description: '毫秒级响应，支持多维度指标监控',
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      icon: Shield,
      title: '自动化执行',
      description: '基于工作流引擎的智能决策和执行',
      color: 'text-green-600 bg-green-100'
    },
    {
      icon: Clock,
      title: '7×24 运行',
      description: '高可用架构，确保生产连续性',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: Users,
      title: '协同处理',
      description: '支持人机协同的异常处理流程',
      color: 'text-purple-600 bg-purple-100'
    }
  ];

  const metrics = [
  ];

  return (
    <div className="space-y-8">
      {/* 系统介绍 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-4">OCAP 工作流配置系统</h1>
        <p className="text-xl mb-6 text-blue-100">
          智能化生产异常处理系统，通过可视化工作流配置实现自动化质量控制
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl font-bold text-white">{metric.value}</div>
              <div className="text-sm text-blue-200">{metric.label}</div>
              <div className="text-xs text-blue-300 mt-1">{metric.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 核心特性 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          );
        })}
      </div>

      {/* 系统组件 */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">系统核心组件</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex items-center mb-3">
              <Server className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">数据采集层</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 实时数据采集适配器</li>
              <li>• 多协议设备接入</li>
              <li>• 数据预处理与清洗</li>
              <li>• 消息队列缓冲</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center mb-3">
              <Database className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold">规则引擎层</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 实时异常检测算法</li>
              <li>• 智能阈值管理</li>
              <li>• 多维度规则配置</li>
              <li>• 模式识别与预警</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center mb-3">
              <Shield className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold">执行层</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 工作流引擎</li>
              <li>• 自动化执行器</li>
              <li>• 人机协同界面</li>
              <li>• 执行结果反馈</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 技术优势 */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">业务价值</h3>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span><strong>降低质量风险：</strong>及时发现和处理生产异常</span>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span><strong>提升效率：</strong>自动化处理减少人工干预</span>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span><strong>标准化流程：</strong>统一的异常处理标准和规范</span>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span><strong>数据驱动：</strong>全过程追溯和持续改进</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SystemOverview;