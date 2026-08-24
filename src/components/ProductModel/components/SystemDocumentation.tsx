import React, { useState } from 'react';
import { X, FileText, ChevronRight, ChevronDown, AlertTriangle, CheckCircle, Info, Users, Settings, Database, Workflow } from 'lucide-react';

interface SystemDocumentationProps {
  onClose: () => void;
}

export const SystemDocumentation: React.FC<SystemDocumentationProps> = ({ onClose }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const SectionHeader = ({ id, title, icon: Icon }: { id: string; title: string; icon: any }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      {expandedSections.has(id) ? (
        <ChevronDown className="w-5 h-5 text-gray-500" />
      ) : (
        <ChevronRight className="w-5 h-5 text-gray-500" />
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">半导体抛光片生产MES系统</h1>
              <p className="text-gray-600">成品入库审批功能模块说明文档</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[80vh]">
          {/* 系统概述 */}
          <div className="border-b border-gray-200">
            <SectionHeader id="overview" title="系统概述" icon={Info} />
            {expandedSections.has('overview') && (
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">模块名称</h3>
                  <p className="text-blue-800">成品入库审批管理模块 (Finished Product Warehouse Approval Management Module)</p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">基本用途</h3>
                  <p className="text-green-800">
                    本模块是半导体抛光片生产MES系统的核心组件，负责管理生产完成批次的入库审批流程。
                    通过自动化和人工审核相结合的方式，确保只有符合质量标准的产品批次能够入库，
                    维护产品质量的一致性和可追溯性。
                  </p>
                  <div className="bg-white-00 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">业务价值</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• 提高质量控制效率</li>
                      <li>• 减少人工审核工作量</li>
                      <li>• 确保产品质量一致性</li>
                      <li>• 提供完整的审批记录</li>
                    </ul> 
                  </div>                            
                </div>

              </div>
            )}
          </div>

          {/* 数据流程图 */}
          <div className="border-b border-gray-200">
            <SectionHeader id="data-flow" title="业务流程" icon={Database} />
            {expandedSections.has('data-flow') && (
              <div className="p-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">审批流程示意图</h3>
                  
                  <div className="flex flex-col space-y-4">
                    {/* 流程步骤 */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">1</span>
                        </div>
                        <span className="text-sm text-gray-700 text-center">生产批次<br/>执行</span>
                      </div>
                      
                      <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
                      
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold">2</span>
                        </div>
                        <span className="text-sm text-gray-700 text-center">质量数据<br/>采集</span>
                      </div>
                      
                      <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
                      
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-yellow-600 font-semibold">3</span>
                        </div>
                        <span className="text-sm text-gray-700 text-center">自动审批<br/>判断</span>
                      </div>
                      
                      <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
                      
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-semibold">4</span>
                        </div>
                        <span className="text-sm text-gray-700 text-center">人工审核<br/>(如需要)</span>
                      </div>
                      
                      <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
                      
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 font-semibold">5</span>
                        </div>
                        <span className="text-sm text-gray-700 text-center">入库执行<br/>记录归档</span>
                      </div>
                    </div>
                    
                    {/* 决策分支 */}
                    <div className="mt-8 bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">审批决策逻辑</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span><strong>不合格率 = 0%</strong> → 自动通过审批</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span><strong>不合格率 {" > "} 0%</strong> → 转入人工审核</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span><strong>人工审核</strong> → 特殊接收 或 拒绝入库</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>          

          
          {/* 核心功能模块 */}
          <div className="border-b border-gray-200">
            <SectionHeader id="core-functions" title="核心功能模块" icon={Workflow} />
            {expandedSections.has('core-functions') && (
              <div className="p-6 space-y-6">
                
                {/* 入库审批功能 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    入库审批功能
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">功能描述</h4>
                      <p className="text-gray-700 text-sm">
                        对生产完成的产品批次进行质量审核，支持自动审批和人工审批两种模式。
                        系统根据预设的质量标准自动判断批次是否符合入库要求，对于边界情况提供人工审核机制。
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">业务规则</h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <ul className="text-sm text-yellow-800 space-y-1">
                          <li>• <strong>自动审批：</strong>不合格率为0%的批次自动通过审批</li>
                          <li>• <strong>人工审核：</strong>存在不合格产品的批次需要人工审核，可以针对单盒维度进行审批</li>
                          <li>• <strong>接收：</strong>质量管理人员可针对符合参数规格的产品进行接收</li>                
                          <li>• <strong>特殊接收：</strong>针对关键参数轻微超标或非关键参数超标的产品进行特殊接收</li>
                          <li>• <strong>拒绝入库：</strong>严重不合格的批次将被拒绝入库</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">接口依赖</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <h5 className="font-medium text-blue-900 text-sm">数据输入</h5>
                          <ul className="text-xs text-blue-800 mt-1 space-y-1">
                            <li>• 生产批次数据</li>
                            <li>• 产品测量数据</li>
                            <li>• 质量规格标准</li>
                          </ul>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <h5 className="font-medium text-green-900 text-sm">数据输出</h5>
                          <ul className="text-xs text-green-800 mt-1 space-y-1">
                            <li>• 审批决策结果</li>
                            <li>• 审批记录日志</li>
                            <li>• 入库指令信号</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 审批记录管理 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 text-blue-600 mr-2" />
                    审批记录管理
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">功能描述</h4>
                      <p className="text-gray-700 text-sm">
                        提供完整的审批历史记录查询和管理功能，支持按批次号、产品型号、审批状态等条件进行筛选查询。
                        记录包含审批时间、审批人员、审批意见等详细信息。
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">业务规则</h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <ul className="text-sm text-yellow-800 space-y-1">
                          <li>• <strong>记录完整性：</strong>所有审批操作必须记录在案</li>
                          <li>• <strong>可追溯性：</strong>支持按时间、人员、批次等维度追溯</li>
                          <li>• <strong>数据保护：</strong>审批记录不可删除或修改</li>
                          <li>• <strong>权限控制：</strong>仅授权人员可查看敏感审批信息</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 审批模板配置 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Settings className="w-5 h-5 text-purple-600 mr-2" />
                    审批模板配置
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">功能描述</h4>
                      <p className="text-gray-700 text-sm">
                        为不同产品型号配置个性化的审批标准和规则。支持按站点、参数设置不同的聚合方式和控制限值，
                        实现灵活的质量控制策略。
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">配置项说明</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-purple-50 border border-purple-200 rounded p-3">
                          <h5 className="font-medium text-purple-900 text-sm mb-2">聚合方式选项</h5>
                          <div className="grid grid-cols-8 gap-2 text-xs">
                            <span className="bg-white px-2 py-1 rounded border">最小值</span>
                            <span className="bg-white px-2 py-1 rounded border">最大值</span>
                            <span className="bg-white px-2 py-1 rounded border">平均值</span>
                            <span className="bg-white px-2 py-1 rounded border">标准差</span>
                            <span className="bg-white px-2 py-1 rounded border">方差</span>                            
                            <span className="bg-white px-2 py-1 rounded border">中位数</span>
                            <span className="bg-white px-2 py-1 rounded border">百分位数</span> 
                            <span className="bg-white px-2 py-1 rounded border">众数</span>                            
                          </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded p-3">
                          <h5 className="font-medium text-gray-900 text-sm mb-2">参数管控限</h5>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <span className="bg-white px-2 py-1 rounded border">上限值</span>
                            <span className="bg-white px-2 py-1 rounded border">下限值</span>
                            <span className="bg-white px-2 py-1 rounded border">目标值</span>
                            <span className="bg-white px-2 py-1 rounded border">公差</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* 使用限制和注意事项 */}
          <div className="border-b border-gray-200">
            <SectionHeader id="limitations" title="使用限制和注意事项" icon={AlertTriangle} />
            {expandedSections.has('limitations') && (
              <div className="p-6 space-y-4">
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    系统限制
                  </h3>
                  <ul className="text-red-800 space-y-2 text-sm">
                    <li>• <strong>数据完整性要求：</strong>批次必须包含完整的测量数据才能进行审批</li>
                    <li>• <strong>审批权限控制：</strong>只有具备相应权限的用户才能执行审批操作</li>
                    <li>• <strong>模板配置限制：</strong>每个产品型号必须配置审批模板才能使用自动审批</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-3">操作注意事项</h3>
                  <ul className="text-yellow-800 space-y-2 text-sm">
                    <li>• <strong>审批决策不可撤销：</strong>一旦完成审批，决策结果不可修改</li>
                    <li>• <strong>特殊接收需谨慎：</strong>特殊接收应有充分的技术依据和风险评估</li>
                    <li>• <strong>模板变更影响：</strong>修改审批模板会影响后续批次的审批标准</li>
                    <li>• <strong>数据备份重要：</strong>定期备份审批记录和配置数据</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">最佳实践建议</h3>
                  <ul className="text-blue-800 space-y-2 text-sm">
                    <li>• <strong>定期审查模板：</strong>根据生产实际情况定期调整审批模板参数</li>
                    <li>• <strong>培训操作人员：</strong>确保审批人员熟悉系统操作和业务规则</li>
                    <li>• <strong>监控审批效率：</strong>定期分析审批数据，优化审批流程</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};