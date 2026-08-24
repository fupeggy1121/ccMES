import React, { useState } from 'react';
import { Thermometer, Zap, AlertTriangle, CheckCircle, Clock, Users, Settings, Play } from 'lucide-react';

const Scenarios: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState('temperature');

  const scenarios = [
    {
      id: 'temperature',
      title: '温度异常处理',
      icon: Thermometer,
      color: 'bg-red-500',
      description: '生产设备温度超出控制界限时的自动化处理流程',
      triggerConditions: [
        '设备温度 > 85°C（上限）',
        '设备温度 < 15°C（下限）',
        '温度波动幅度 > 5°C/min'
      ],
      workflow: [
        {
          step: 1,
          type: 'detection',
          title: '异常检测',
          description: '系统检测到温度异常',
          icon: AlertTriangle,
          duration: '< 5秒',
          automated: true
        },
        {
          step: 2,
          type: 'assessment',
          title: '风险评估',
          description: '评估异常严重程度和影响范围',
          icon: Settings,
          duration: '5-10秒',
          automated: true
        },
        {
          step: 3,
          type: 'action',
          title: '自动调节',
          description: '调整冷却系统参数',
          icon: Zap,
          duration: '10-30秒',
          automated: true
        },
        {
          step: 4,
          type: 'notification',
          title: '通知相关人员',
          description: '向操作员和维护团队发送警报',
          icon: Users,
          duration: '即时',
          automated: true
        },
        {
          step: 5,
          type: 'monitoring',
          title: '持续监控',
          description: '监控温度恢复情况',
          icon: Clock,
          duration: '5-15分钟',
          automated: true
        },
        {
          step: 6,
          type: 'verification',
          title: '效果确认',
          description: '确认问题是否解决',
          icon: CheckCircle,
          duration: '人工确认',
          automated: false
        }
      ]
    },
    {
      id: 'pressure',
      title: '压力异常处理',
      icon: Zap,
      color: 'bg-yellow-500',
      description: '系统压力异常时的快速响应和处理机制',
      triggerConditions: [
        '系统压力 > 8 bar（上限）',
        '系统压力 < 2 bar（下限）',
        '压力突然下降 > 1 bar/min'
      ],
      workflow: [
        {
          step: 1,
          type: 'detection',
          title: '压力监测',
          description: '实时监测系统压力变化',
          icon: AlertTriangle,
          duration: '< 3秒',
          automated: true
        },
        {
          step: 2,
          type: 'safety',
          title: '安全评估',
          description: '评估压力异常的安全风险',
          icon: Settings,
          duration: '3-5秒',
          automated: true
        },
        {
          step: 3,
          type: 'emergency',
          title: '紧急措施',
          description: '启动压力释放阀或增压泵',
          icon: Zap,
          duration: '5-15秒',
          automated: true
        },
        {
          step: 4,
          type: 'isolation',
          title: '隔离异常区域',
          description: '关闭相关管路阀门',
          icon: Settings,
          duration: '10-20秒',
          automated: true
        },
        {
          step: 5,
          type: 'inspection',
          title: '人工检查',
          description: '派遣维护人员现场检查',
          icon: Users,
          duration: '15-30分钟',
          automated: false
        }
      ]
    },
    {
      id: 'quality',
      title: '质量异常处理',
      icon: CheckCircle,
      color: 'bg-blue-500',
      description: '产品质量指标超标时的质量控制流程',
      triggerConditions: [
        '产品合格率 < 95%',
        '关键尺寸偏差 > ±0.1mm',
        '表面质量等级 < A级'
      ],
      workflow: [
        {
          step: 1,
          type: 'detection',
          title: '质量检测',
          description: '在线质量检测发现异常',
          icon: AlertTriangle,
          duration: '实时',
          automated: true
        },
        {
          step: 2,
          type: 'sampling',
          title: '样品抽检',
          description: '增加抽检频率进行确认',
          icon: Settings,
          duration: '5-10分钟',
          automated: true
        },
        {
          step: 3,
          type: 'analysis',
          title: '根因分析',
          description: '分析质量异常的可能原因',
          icon: Settings,
          duration: '10-20分钟',
          automated: true
        },
        {
          step: 4,
          type: 'adjustment',
          title: '工艺调整',
          description: '调整相关工艺参数',
          icon: Zap,
          duration: '5-15分钟',
          automated: true
        },
        {
          step: 5,
          type: 'quarantine',
          title: '产品隔离',
          description: '隔离异常批次产品',
          icon: Settings,
          duration: '即时',
          automated: true
        },
        {
          step: 6,
          type: 'approval',
          title: '质量确认',
          description: '质量经理确认处理措施',
          icon: Users,
          duration: '人工审批',
          automated: false
        }
      ]
    }
  ];

  const currentScenario = scenarios.find(s => s.id === selectedScenario) || scenarios[0];

  const getStepColor = (type: string) => {
    const colors = {
      detection: 'bg-red-100 text-red-700 border-red-200',
      assessment: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      safety: 'bg-orange-100 text-orange-700 border-orange-200',
      action: 'bg-blue-100 text-blue-700 border-blue-200',
      emergency: 'bg-red-100 text-red-700 border-red-200',
      isolation: 'bg-purple-100 text-purple-700 border-purple-200',
      notification: 'bg-green-100 text-green-700 border-green-200',
      monitoring: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      verification: 'bg-teal-100 text-teal-700 border-teal-200',
      sampling: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      analysis: 'bg-gray-100 text-gray-700 border-gray-200',
      adjustment: 'bg-blue-100 text-blue-700 border-blue-200',
      quarantine: 'bg-orange-100 text-orange-700 border-orange-200',
      approval: 'bg-green-100 text-green-700 border-green-200',
      inspection: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* 场景选择 */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">典型异常处理场景</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((scenario) => {
            const Icon = scenario.icon;
            const isSelected = selectedScenario === scenario.id;
            
            return (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center mb-3">
                  <div className={`w-12 h-12 ${scenario.color} rounded-lg flex items-center justify-center mr-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{scenario.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{scenario.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 场景详情 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 触发条件 */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
            触发条件
          </h3>
          <ul className="space-y-3">
            {currentScenario.triggerConditions.map((condition, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">{condition}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-6 p-4 bg-orange-50 rounded-lg">
            <h4 className="font-semibold text-orange-900 mb-2">监控要求</h4>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• 数据采集频率: 每秒1次</li>
              <li>• 异常检测延迟: &lt; 5秒</li>
              <li>• 误报率要求: &lt; 1%</li>
            </ul>
          </div>
        </div>

        {/* 工作流程 */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Play className="w-5 h-5 text-green-500 mr-2" />
              处理流程
            </h3>
            <div className="text-sm text-gray-600">
              预计总耗时: {currentScenario.workflow.reduce((acc, step) => {
                if (step.duration.includes('分钟')) {
                  const minutes = parseInt(step.duration.match(/\d+/)?.[0] || '0');
                  return acc + minutes * 60;
                } else if (step.duration.includes('秒')) {
                  const seconds = parseInt(step.duration.match(/\d+/)?.[0] || '0');
                  return acc + seconds;
                }
                return acc;
              }, 0)}秒
            </div>
          </div>

          <div className="space-y-4">
            {currentScenario.workflow.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === currentScenario.workflow.length - 1;
              
              return (
                <div key={step.step} className="relative">
                  <div className="flex items-start">
                    <div className="flex flex-col items-center mr-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStepColor(step.type)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {!isLast && (
                        <div className="w-px h-12 bg-gray-300 mt-2"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 pb-8">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{step.title}</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            step.automated 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {step.automated ? '自动' : '人工'}
                          </span>
                          <span className="text-sm text-gray-500">{step.duration}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">{step.description}</p>
                      
                      {/* 步骤详细配置 */}
                      {step.step === 3 && selectedScenario === 'temperature' && (
                        <div className="bg-gray-50 rounded-lg p-3 mt-2">
                          <h5 className="font-medium text-gray-900 mb-2">自动调节参数:</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• 冷却流量: +20%</li>
                            <li>• 风扇转速: +500 RPM</li>
                            <li>• 工作负载: -10%</li>
                          </ul>
                        </div>
                      )}
                      
                      {step.step === 4 && selectedScenario === 'temperature' && (
                        <div className="bg-gray-50 rounded-lg p-3 mt-2">
                          <h5 className="font-medium text-gray-900 mb-2">通知对象:</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• 当班操作员 (短信+邮件)</li>
                            <li>• 维护工程师 (邮件)</li>
                            <li>• 生产主管 (钉钉消息)</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Scenarios;