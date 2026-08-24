import React, { useState } from 'react';
import { Database, Server, Cloud, Shield, Zap, Users, Settings, Monitor } from 'lucide-react';

const Architecture: React.FC = () => {
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);

  const layers = [
    {
      id: 'presentation',
      title: '表现层',
      icon: Monitor,
      color: 'bg-blue-500',
      components: [
        { name: 'OCAP Dashboard', desc: '异常监控仪表板' },
        { name: 'Workflow Designer', desc: '工作流可视化设计器' },
        { name: 'Mobile App', desc: '移动端应急处理应用' },
        { name: 'API Gateway', desc: 'RESTful API网关' }
      ]
    },
    {
      id: 'application',
      title: '应用层',
      icon: Settings,
      color: 'bg-green-500',
      components: [
        { name: 'Workflow Service', desc: '工作流引擎服务' },
        { name: 'Rule Engine', desc: '规则引擎服务' },
        { name: 'Notification Service', desc: '通知服务' },
        { name: 'User Service', desc: '用户管理服务' }
      ]
    },
    {
      id: 'business',
      title: '业务层',
      icon: Zap,
      color: 'bg-yellow-500',
      components: [
        { name: 'Exception Detection', desc: '异常检测引擎' },
        { name: 'Decision Engine', desc: '智能决策引擎' },
        { name: 'Execution Engine', desc: '自动化执行引擎' },
        { name: 'Integration Hub', desc: '系统集成中心' }
      ]
    },
    {
      id: 'data',
      title: '数据层',
      icon: Database,
      color: 'bg-purple-500',
      components: [
        { name: 'Time Series DB', desc: '时序数据库(InfluxDB)' },
        { name: 'Configuration DB', desc: '配置数据库(PostgreSQL)' },
        { name: 'Document Store', desc: '文档存储(MongoDB)' },
        { name: 'Cache Layer', desc: '缓存层(Redis)' }
      ]
    },
    {
      id: 'infrastructure',
      title: '基础设施层',
      icon: Server,
      color: 'bg-gray-500',
      components: [
        { name: 'Message Queue', desc: '消息队列(RabbitMQ/Kafka)' },
        { name: 'Service Mesh', desc: '服务网格(Istio)' },
        { name: 'Monitoring', desc: '监控系统(Prometheus)' },
        { name: 'Container Platform', desc: '容器平台(Kubernetes)' }
      ]
    }
  ];

  const techStack = {
    frontend: [
      { name: 'React 18', desc: '用户界面框架' },
      { name: 'TypeScript', desc: '类型安全的JavaScript' },
      { name: 'Ant Design', desc: 'UI组件库' },
      { name: 'D3.js', desc: '数据可视化' }
    ],
    backend: [
      { name: 'Spring Boot', desc: 'Java微服务框架' },
      { name: 'Spring Cloud', desc: '微服务生态' },
      { name: 'Flowable', desc: '工作流引擎' },
      { name: 'Drools', desc: '规则引擎' }
    ],
    data: [
      { name: 'PostgreSQL', desc: '关系型数据库' },
      { name: 'InfluxDB', desc: '时序数据库' },
      { name: 'MongoDB', desc: '文档数据库' },
      { name: 'Redis', desc: '内存缓存' }
    ],
    infrastructure: [
      { name: 'Docker', desc: '容器化技术' },
      { name: 'Kubernetes', desc: '容器编排' },
      { name: 'Kafka', desc: '消息队列' },
      { name: 'Istio', desc: '服务网格' }
    ]
  };

  return (
    <div className="space-y-8">
      {/* 系统架构图 */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">系统分层架构</h2>
        <div className="space-y-4">
          {layers.map((layer, index) => {
            const Icon = layer.icon;
            const isSelected = selectedLayer === layer.id;
            
            return (
              <div
                key={layer.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedLayer(isSelected ? null : layer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 ${layer.color} rounded-lg flex items-center justify-center mr-4`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{layer.title}</h3>
                      <p className="text-sm text-gray-600">{layer.components.length} 个核心组件</p>
                    </div>
                  </div>
                  <div className={`transform transition-transform ${isSelected ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {layer.components.map((component, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900">{component.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{component.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>


      {/* API接口设计 */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">核心API接口设计</h3>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">工作流管理API</h4>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex items-center">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-3">POST</span>
                <span>/api/v1/workflows</span>
                <span className="ml-auto text-gray-600">创建工作流</span>
              </div>
              <div className="flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-3">GET</span>
                <span>/api/v1/workflows/{"{id}"}</span>
                <span className="ml-auto text-gray-600">获取工作流详情</span>
              </div>
              <div className="flex items-center">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded mr-3">PUT</span>
                <span>/api/v1/workflows/{"{id}"}</span>
                <span className="ml-auto text-gray-600">更新工作流</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">异常处理API</h4>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex items-center">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-3">POST</span>
                <span>/api/v1/exceptions/trigger</span>
                <span className="ml-auto text-gray-600">触发异常处理</span>
              </div>
              <div className="flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-3">GET</span>
                <span>/api/v1/exceptions/{"{id}"}/status</span>
                <span className="ml-auto text-gray-600">查询处理状态</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">监控数据API</h4>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex items-center">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-3">POST</span>
                <span>/api/v1/monitoring/data</span>
                <span className="ml-auto text-gray-600">上报监控数据</span>
              </div>
              <div className="flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-3">GET</span>
                <span>/api/v1/monitoring/metrics</span>
                <span className="ml-auto text-gray-600">获取实时指标</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Architecture;