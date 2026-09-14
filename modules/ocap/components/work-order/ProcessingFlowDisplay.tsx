import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { BatchHoldExecution, WorkOrder, WorkOrderStage } from '../../types/workOrder';
import StatusBadge from '../StatusBadge';
import ProcessTimeline from '../ProcessTimeline';
import { ruleStorage } from '../../services/holdRule/ruleStorage';

interface ProcessingFlowDisplayProps {
  workOrder: WorkOrder;
}

// 辅助函数：获取动作类型的中文标签
const getActionTypeLabel = (actionType?: string): string => {
  if (!actionType) return '执行动作';

  const actionTypeMap: Record<string, string> = {
    'remeasure': '复测',
    'batchHold': '批次扣留',
    'equipmentDisable': '设备扣留',
    'notifyPersonnel': '发送通知',
    'equipmentCalibration': '量测设备校准',
    'approval': '人工审批',
    'equipmentRelease': '设备释放', // 新增
    'batchRelease': '批次释放',     // 新增
    'dataLogging': '数据记录',
    'parameterAdjustment': '参数调整',
    'confirmAlert': '确认告警',
    'recipeCorrection': '配方修正',
    'trialGrinding': '试化腐',
    'createMaintenanceOrder': '创建维修工单',
    'manualIntervention': '人工检修',
    // 可以继续添加其他动作类型的映射
  };

  return actionTypeMap[actionType] || actionType;
};

// 辅助函数：获取阶段类型的中文标签
const getStageTypeLabel = (stageType?: string): string => {
  if (!stageType) return '未知类型';

  const stageTypeMap: Record<string, string> = {
    'action': '操作节点',
    'condition': '条件节点',
    'start': '开始节点',
    'end': '结束节点',
    'parallel': '并行节点',
    // 可以继续添加其他阶段类型的映射
  };

  return stageTypeMap[stageType] || stageType;
};

// 辅助函数：把建模时选的扣留规则ID换成规则名称（规则存在 OCAP 自己的 ruleStorage 里，同步可读）
const getHoldRuleLabel = (ruleId?: string): string => {
  if (!ruleId) return '未选择（默认扣留当前批次）';
  try {
    return ruleStorage.getRules().find(r => r.id === ruleId)?.name || ruleId;
  } catch {
    return ruleId;
  }
};

// 辅助函数：ISO 时间 → 展示格式，无值时给占位符
const formatDateTime = (value?: string): string => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : format(date, 'yyyy-MM-dd HH:mm');
};

// 辅助函数：渲染批次扣留节点的批次清单。
// 分两张表而不是一张带状态列的表：在制批次是真正被扣留的对象（关心站点/机台/扣留时间），
// 已入库批次只是登记在案供质量侧到成品库处置（关心库位/出货条码/入库时间），
// 两拨批次要看的字段几乎不重叠，塞进一张表会有半数单元格是空的。
const renderBatchHoldBatches = (execution: BatchHoldExecution) => {
  const batches = execution.batches || [];
  const heldBatches = batches.filter(b => b.holdResult === 'held');
  const stockedBatches = batches.filter(b => b.holdResult === 'stockedOnly');

  return (
    <div className="space-y-4">
      {/* 规则与触发信息 */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        <div>
          <label className="text-xs font-medium text-gray-500">扣留规则</label>
          <p className="text-sm text-gray-900">{execution.ruleName || getHoldRuleLabel(execution.ruleId)}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">触发机台</label>
          <p className="text-sm text-gray-900">{execution.triggeredByEquipment || '—'}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Monitor类型</label>
          <p className="text-sm text-gray-900">{execution.monitorType || '—'}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">圈定时间窗口</label>
          <p className="text-sm text-gray-900">
            {execution.timeWindow
              ? `${formatDateTime(execution.timeWindow.start)} ~ ${formatDateTime(execution.timeWindow.end)}`
              : '—'}
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">责任工艺工程师</label>
          <p className="text-sm text-gray-900">{execution.notifiedProcessEngineer || '—'}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">知会质量工程师</label>
          <p className="text-sm text-gray-900">{execution.notifiedQualityEngineer || '—'}</p>
        </div>
      </div>

      {/* 汇总 */}
      <p className="text-sm text-gray-700">
        命中批次 <span className="font-medium">{batches.length}</span> 个：在制已扣留
        <span className="font-medium text-red-600"> {heldBatches.length} </span>个，
        已入库仅登记<span className="font-medium text-gray-700"> {stockedBatches.length} </span>个
      </p>

      {/* 在制批次：真正执行了扣留 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">在制批次（已执行扣留）</label>
          <span className="text-xs text-gray-500">{heldBatches.length} 个</span>
        </div>
        {heldBatches.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">窗口内没有仍在制的批次，在制侧无可扣留对象。</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-600">
                <tr>
                  <th className="py-2 px-3 font-medium">批次编码</th>
                  <th className="py-2 px-3 font-medium">料号 / 产品</th>
                  <th className="py-2 px-3 font-medium">数量</th>
                  <th className="py-2 px-3 font-medium">当前站点</th>
                  <th className="py-2 px-3 font-medium">机台</th>
                  <th className="py-2 px-3 font-medium">扣留时间</th>
                  <th className="py-2 px-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {heldBatches.map(batch => (
                  <tr key={batch.batchId} className="border-t border-gray-100">
                    <td className="py-2 px-3 text-gray-900">{batch.batchCode}</td>
                    <td className="py-2 px-3 text-gray-700">{batch.productCode} / {batch.productName}</td>
                    <td className="py-2 px-3 text-gray-700">{batch.quantity}</td>
                    <td className="py-2 px-3 text-gray-700">{batch.stationName || '—'}</td>
                    <td className="py-2 px-3 text-gray-700">{batch.equipmentName || '—'}</td>
                    <td className="py-2 px-3 text-gray-700">{formatDateTime(batch.holdAt)}</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex whitespace-nowrap px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        已扣留
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 成品库批次：只登记已入库，不执行扣留 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">已包装入成品库批次（仅登记，不执行扣留）</label>
          <span className="text-xs text-gray-500">{stockedBatches.length} 个</span>
        </div>
        {stockedBatches.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">窗口内没有已包装入库的批次。</p>
        ) : (
          <>
            <div className="overflow-x-auto border border-gray-200 rounded-md">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs text-gray-600">
                  <tr>
                    <th className="py-2 px-3 font-medium">批次编码</th>
                    <th className="py-2 px-3 font-medium">料号 / 产品</th>
                    <th className="py-2 px-3 font-medium">数量</th>
                    <th className="py-2 px-3 font-medium">出货条码</th>
                    <th className="py-2 px-3 font-medium">库位</th>
                    <th className="py-2 px-3 font-medium">入库时间</th>
                    <th className="py-2 px-3 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {stockedBatches.map(batch => (
                    <tr key={batch.batchId} className="border-t border-gray-100">
                      <td className="py-2 px-3 text-gray-900">{batch.batchCode}</td>
                      <td className="py-2 px-3 text-gray-700">{batch.productCode} / {batch.productName}</td>
                      <td className="py-2 px-3 text-gray-700">{batch.quantity}</td>
                      <td className="py-2 px-3 text-gray-700">{batch.packagingBarcode || '—'}</td>
                      <td className="py-2 px-3 text-gray-700">{batch.warehouseLocation || '—'}</td>
                      <td className="py-2 px-3 text-gray-700">{formatDateTime(batch.inboundAt)}</td>
                      <td className="py-2 px-3">
                        <span className="inline-flex whitespace-nowrap px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
                          已入库
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              这些批次已完成包装入成品库，在制侧没有可扣留对象，需由质量侧在成品库/出货环节另行处置。
            </p>
          </>
        )}
      </div>
    </div>
  );
};

// 辅助函数：渲染配置信息
const renderConfigInfo = (config: any, stageType: string) => {
  if (!config) return null;

  const renderObjectConfig = (obj: Record<string, any>, title: string) => (
    <div className="mt-3">
      <label className="text-sm font-medium text-gray-700">{title}</label>
      <div className="mt-1 p-3 bg-gray-50 rounded-md border">
        {Object.entries(obj).map(([key, value]) => (
          <div key={key} className="flex justify-between py-1 border-b border-gray-200 last:border-b-0">
            <span className="text-sm font-medium text-gray-600">{key}:</span>
            <span className="text-sm text-gray-900">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderArrayConfig = (arr: any, title: string) => { // arr 的类型可以更宽泛
    if (!arr || !Array.isArray(arr) || arr.length === 0) {
      return null; // 如果不是数组、为空或为空数组，则不渲染
    }
    return (
      <div className="mt-3">
        <label className="text-sm font-medium text-gray-700">{title}</label>
        <div className="mt-1 space-y-2">
          {arr.map((item: any, index: number) => ( // 确保 item 和 index 的类型
            <div key={index} className="p-2 bg-gray-50 rounded border text-sm">
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  switch (stageType) {
    case 'start':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">启动配置</label>
            <p className="mt-1 text-sm text-gray-900">
              {config.initiator || '系统自动启动'}
            </p>
          </div>
          {config.initialData && renderObjectConfig(config.initialData, '初始数据')}
          {config.requiredFields && renderArrayConfig(config.requiredFields, '必需字段')}
        </div>
      );

    case 'end':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">结束类型</label>
            <p className="mt-1 text-sm text-gray-900">
              {config.completionType === 'auto' ? '自动完成' :
               config.completionType === 'manual' ? '手动完成' :
               config.completionType || '标准结束'}
            </p>
          </div>
          {config.outputMapping && renderObjectConfig(config.outputMapping, '输出映射')}
          {config.finalActions && renderArrayConfig(config.finalActions, '最终操作')}
        </div>
      );

    case 'condition':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">条件类型</label>
            <p className="mt-1 text-sm text-gray-900">
              {config.conditionType === 'expression' ? '表达式判断' :
               config.conditionType === 'rule' ? '规则引擎' :
               config.conditionType === 'manual' ? '人工判断' :
               config.conditionType || '条件判断'}
            </p>
          </div>
          {config.expression && (
            <div>
              <label className="text-sm font-medium text-gray-700">判断表达式</label>
              <code className="mt-1 block p-2 bg-gray-100 rounded text-sm font-mono text-gray-800">
                {config.expression}
              </code>
            </div>
          )}
          {config.conditionExpressions && config.conditionExpressions.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700">条件表达式</label>
              <ul className="mt-1 text-sm text-gray-900 list-disc list-inside pl-4">
                {config.conditionExpressions.map((expr: any, idx: number) => (
                  <li key={idx}>{expr.resultLabel}: `{expr.expression}`</li>
                ))}
              </ul>
            </div>
          )}
          {config.branchMappings && config.branchMappings.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700">分支映射</label>
              <ul className="mt-1 text-sm text-gray-900 list-disc list-inside pl-4">
                {config.branchMappings.map((mapping: any, idx: number) => (
                  <li key={idx}>{mapping.result} → 节点 {mapping.targetNodeId}</li>
                ))}
              </ul>
            </div>
          )}
          {config.rules && renderArrayConfig(config.rules, '判断规则')}
        </div>
      );

    case 'action':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">动作配置</label>
            <p className="mt-1 text-sm text-gray-900">
              {config.description || `执行 ${getActionTypeLabel(config.actionType)} 操作`}
            </p>
          </div>

          {config.actionType === 'approval' && (
            <>
              {config.approvers && (
                <div>
                  <label className="text-sm font-medium text-gray-700">审批人</label>
                  <p className="mt-1 text-sm text-gray-900">{(config.approvers || []).join(', ') || '无'}</p>
                </div>
              )}
              {config.timeout && (
                <div>
                  <label className="text-sm font-medium text-gray-700">超时时间</label>
                  <p className="mt-1 text-sm text-gray-900">{config.timeout ? `${config.timeout / 1000} 秒` : '无'}</p>
                </div>
              )}
            </>
          )}

          {config.actionType === 'batchHold' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">扣留规则</label>
                <p className="mt-1 text-sm text-gray-900">{getHoldRuleLabel(config.holdRuleConfig)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">扣留备注</label>
                <p className="mt-1 text-sm text-gray-900">{config.holdRemarks || '无'}</p>
              </div>
            </div>
          )}

          {config.actionType === 'equipmentDisable' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">扣留原因类型</label>
                <p className="mt-1 text-sm text-gray-900">{config.disableReasonType || '无'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">扣留原因详情</label>
                <p className="mt-1 text-sm text-gray-900">{config.disableReasonDetail || '无'}</p>
              </div>
            </div>
          )}

          {config.actionType === 'equipmentRelease' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">释放设备ID</label>
                <p className="mt-1 text-sm text-gray-900">{config.releaseEquipmentId || '无'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">释放原因</label>
                <p className="mt-1 text-sm text-gray-900">{config.equipmentReleaseReason || '无'}</p>
              </div>
            </div>
          )}

          {config.actionType === 'batchRelease' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">释放批次ID</label>
                <p className="mt-1 text-sm text-gray-900">{config.releaseBatchId || '无'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">释放原因</label>
                <p className="mt-1 text-sm text-gray-900">{config.batchReleaseReason || '无'}</p>
              </div>
            </div>
          )}

          {config.actionType === 'remeasure' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">复测对象</label>
                <p className="mt-1 text-sm text-gray-900">{config.retestObject === 'anomaly_sample' ? '异常样本' : '自定义'}</p>
              </div>
              {config.retestObject === 'custom' && (
                <div>
                  <label className="text-sm font-medium text-gray-500">样本选择规则</label>
                  <p className="mt-1 text-sm text-gray-900">{config.sampleSelectionRule || '无'}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">复测路径</label>
                <p className="mt-1 text-sm text-gray-900">{config.remeasurementPath || '无'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">测量参数</label>
                <p className="mt-1 text-sm text-gray-900">{config.measurementParameter || '无'}</p>
              </div>
            </div>
          )}

          {config.actionType === 'notifyPersonnel' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">通知方式</label>
                <p className="mt-1 text-sm text-gray-900">{(config.notificationMethods || []).join(', ') || '无'}</p>
              </div>
              {config.emailConfig && (
                <div>
                  <label className="text-sm font-medium text-gray-500">邮件主题</label>
                  <p className="mt-1 text-sm text-gray-900">{config.emailConfig.subject || '无'}</p>
                </div>
              )}
              {/* 可以根据需要添加更多通知方式的详细配置 */}
            </div>
          )}

          {config.actionType === 'equipmentCalibration' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">校准设备来源</label>
                <p className="mt-1 text-sm text-gray-900">{config.calibratedEquipmentSource === 'current_anomaly_equipment' ? '当前异常设备' : '手动选择'}</p>
              </div>
              {config.calibratedEquipmentSource === 'manual_selection' && config.equipmentList && config.equipmentList.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">选择设备</label>
                  <p className="mt-1 text-sm text-gray-900">{config.equipmentList.join(', ')}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">校准标准</label>
                <p className="mt-1 text-sm text-gray-900">{config.calibrationStandards || '无'}</p>
              </div>
            </div>
          )}

          {config.formTemplateId && (
            <div>
              <label className="text-sm font-medium text-gray-700">关联表单模版</label>
              <p className="mt-1 text-sm text-gray-900">{config.formTemplateName || config.formTemplateId}</p>
            </div>
          )}

          {/* 新增：显示标准工时和告警设置 */}
          {config.standardWorkingHours !== undefined && (
            <div>
              <label className="text-sm font-medium text-gray-700">标准工时</label>
              <p className="mt-1 text-sm text-gray-900">{config.standardWorkingHours} 小时</p>
            </div>
          )}
          {config.sendOvertimeAlert !== undefined && (
            <div>
              <label className="text-sm font-medium text-gray-700">超工时告警</label>
              <p className="mt-1 text-sm text-gray-900">{config.sendOvertimeAlert ? '已启用' : '未启用'}</p>
            </div>
          )}

          {config.parameters && renderObjectConfig(config.parameters, '执行参数')}
          {config.requiredFields && renderArrayConfig(config.requiredFields, '必填字段')}
          {config.validationRules && renderArrayConfig(config.validationRules, '验证规则')}
        </div>
      );

    default:
      if (typeof config === 'object') {
        return renderObjectConfig(config, '配置详情');
      }
      return (
        <div>
          <label className="text-sm font-medium text-gray-700">配置信息</label>
          <p className="mt-1 text-sm text-gray-900">{String(config)}</p>
        </div>
      );
  }
};


const renderNodeExecutionContent = (stage: WorkOrderStage) => {
  const { config, type, actionType, analysis, actions, formTemplateName } = stage;

  let nodeSpecificDetails = null;

  if (type === 'condition' && config) {
    nodeSpecificDetails = (
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-900 mb-2">条件判断详情</h4>
        {config.conditionExpressions && config.conditionExpressions.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-500">配置条件表达式</label>
            <ul className="mt-1 text-sm text-gray-900 list-disc list-inside pl-4">
              {config.conditionExpressions.map((expr: any, idx: number) => (
                <li key={idx}>
                  <span className="font-medium">{expr.resultLabel}</span>: <code className="bg-gray-100 px-1 rounded">{expr.expression}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
        {config.branchMappings && config.branchMappings.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-500">分支映射</label>
            <ul className="mt-1 text-sm text-gray-900 list-disc list-inside pl-4">
              {config.branchMappings.map((mapping: any, idx: number) => (
                <li key={idx}>{mapping.result} → 节点 {mapping.targetNodeId}</li>
              ))}
            </ul>
          </div>
        )}
        {stage.status === 'completed' && (
          <div>
            <label className="text-sm font-medium text-gray-500">实际判断结果</label>
            <p className="mt-1 text-sm text-gray-900">
              根据数据评估，命中了 **[某个模拟结果]** 分支，流转至 **[目标节点名称]**。
              {/* 实际应用中，这里会根据工单的实际执行数据来填充 */}
            </p>
          </div>
        )}
      </div>
    );
  } else if (type === 'action' && config) {
    switch (actionType) {
      case 'remeasure':
        nodeSpecificDetails = (
          <div className="space-y-3">
            <h4 className="text-md font-medium text-gray-900 mb-2">复测动作详情</h4>
            <div>
              <label className="text-sm font-medium text-gray-500">复测对象</label>
              <p className="mt-1 text-sm text-gray-900">{config.retestObject === 'anomaly_sample' ? '异常样本' : '自定义'}</p>
            </div>
            {config.retestObject === 'custom' && (
              <div>
                <label className="text-sm font-medium text-gray-500">样本选择规则</label>
                <p className="mt-1 text-sm text-gray-900">{config.sampleSelectionRule || '无'}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">复测路径</label>
              <p className="mt-1 text-sm text-gray-900">{config.remeasurementPath || '无'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">测量参数</label>
              <p className="mt-1 text-sm text-gray-900">{config.measurementParameter || '无'}</p>
            </div>
            {formTemplateName && (
              <div>
                <label className="text-sm font-medium text-gray-500">关联表单模版</label>
                <p className="mt-1 text-sm text-gray-900">{formTemplateName}</p>
              </div>
            )}
            {stage.status === 'completed' && formTemplateName && (
              <div>
                <label className="text-sm font-medium text-gray-500">复测数据</label>
                <p className="mt-1 text-sm text-gray-900">
                  此处将展示复测表单中录入的具体数据。
                  {/* 实际应用中，这里会从 work_order_form_data 表中获取数据并渲染 */}
                </p>
              </div>
            )}
            {/* 新增：显示标准工时和告警设置 */}
            {config.standardWorkingHours !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-500">标准工时</label>
                <p className="mt-1 text-sm text-gray-900">{config.standardWorkingHours} 小时</p>
              </div>
            )}
            {config.sendOvertimeAlert !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-500">超工时告警</label>
                <p className="mt-1 text-sm text-gray-900">{config.sendOvertimeAlert ? '已启用' : '未启用'}</p>
              </div>
            )}
          </div>
        );
        break;
      case 'batchHold':
        nodeSpecificDetails = (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 mb-2">批次扣留动作详情</h4>
            {stage.batchHoldExecution ? (
              renderBatchHoldBatches(stage.batchHoldExecution)
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">扣留规则</label>
                  <p className="mt-1 text-sm text-gray-900">{getHoldRuleLabel(config.holdRuleConfig)}</p>
                </div>
                <p className="text-sm text-gray-600">
                  该节点尚未执行，暂无扣留批次清单。执行后将按所选扣留规则圈定的批次在此展示。
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">扣留备注</label>
              <p className="mt-1 text-sm text-gray-900">{config.holdRemarks || '无'}</p>
            </div>
          </div>
        );
        break;
      case 'equipmentDisable':
        nodeSpecificDetails = (
          <div className="space-y-3">
            <h4 className="text-md font-medium text-gray-900 mb-2">设备扣留动作详情</h4>
            <div>
              <label className="text-sm font-medium text-gray-500">扣留原因类型</label>
              <p className="mt-1 text-sm text-gray-900">{config.disableReasonType || '无'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">扣留原因详情</label>
              <p className="mt-1 text-sm text-gray-900">{config.disableReasonDetail || '无'}</p>
            </div>
            {/* 新增：显示标准工时和告警设置 */}
            {config.standardWorkingHours !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-500">标准工时</label>
                <p className="mt-1 text-sm text-gray-900">{config.standardWorkingHours} 小时</p>
              </div>
            )}
            {config.sendOvertimeAlert !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-500">超工时告警</label>
                <p className="mt-1 text-sm text-gray-900">{config.sendOvertimeAlert ? '已启用' : '未启用'}</p>
              </div>
            )}
          </div>
        );
        break;
      case 'equipmentRelease':
        nodeSpecificDetails = (
          <div className="space-y-3">
            <h4 className="text-md font-medium text-gray-900 mb-2">设备释放动作详情</h4>
            <div>
              <label className="text-sm font-medium text-gray-500">释放设备ID</label>
              <p className="mt-1 text-sm text-gray-900">{config.releaseEquipmentId || '无'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">释放原因</label>
              <p className="mt-1 text-sm text-gray-900">{config.equipmentReleaseReason || '无'}</p>
            </div>
            {/* 新增：显示标准工时和告警设置 */}
            {config.standardWorkingHours !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-700">标准工时</label>
                <p className="mt-1 text-sm text-gray-900">{config.standardWorkingHours} 小时</p>
              </div>
            )}
            {config.sendOvertimeAlert !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-700">超工时告警</label>
                <p className="mt-1 text-sm text-gray-900">{config.sendOvertimeAlert ? '已启用' : '未启用'}</p>
              </div>
            )}
          </div>
        );
        break;
      case 'batchRelease':
        nodeSpecificDetails = (
          <div className="space-y-3">
            <h4 className="text-md font-medium text-gray-900 mb-2">批次释放动作详情</h4>
            <div>
              <label className="text-sm font-medium text-gray-500">释放批次ID</label>
              <p className="mt-1 text-sm text-gray-900">{config.releaseBatchId || '无'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">释放原因</label>
              <p className="mt-1 text-sm text-gray-900">{config.batchReleaseReason || '无'}</p>
            </div>
            {/* 新增：显示标准工时和告警设置 */}
            {config.standardWorkingHours !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-700">标准工时</label>
                <p className="mt-1 text-sm text-gray-900">{config.standardWorkingHours} 小时</p>
              </div>
            )}
            {config.sendOvertimeAlert !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-700">超工时告警</label>
                <p className="mt-1 text-sm text-gray-900">{config.sendOvertimeAlert ? '已启用' : '未启用'}</p>
              </div>
            )}
          </div>
        );
        break;
      case 'notifyPersonnel':
        nodeSpecificDetails = (
          <div className="space-y-3">
            <h4 className="text-md font-medium text-gray-900 mb-2">通知动作详情</h4>
            <div>
              <label className="text-sm font-medium text-gray-500">通知方式</label>
              <p className="mt-1 text-sm text-gray-900">{(config.notificationMethods || []).join(', ') || '无'}</p>
            </div>
            {config.emailConfig && (
              <div>
                <label className="text-sm font-medium text-gray-500">邮件主题</label>
                <p className="mt-1 text-sm text-gray-900">{config.emailConfig.subject || '无'}</p>
              </div>
            )}
            {/* 可以根据需要添加更多通知方式的详细配置 */}
            {/* 新增：显示标准工时和告警设置 */}
            {config.standardWorkingHours !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-500">标准工时</label>
                <p className="mt-1 text-sm text-gray-900">{config.standardWorkingHours} 小时</p>
              </div>
            )}
            {config.sendOvertimeAlert !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-500">超工时告警</label>
                <p className="mt-1 text-sm text-gray-900">{config.sendOvertimeAlert ? '已启用' : '未启用'}</p>
              </div>
            )}
          </div>
        );
        break;
      case 'equipmentCalibration':
        nodeSpecificDetails = (
          <div className="space-y-3">
            <h4 className="text-md font-medium text-gray-900 mb-2">量测设备校准动作详情</h4>
            <div>
              <label className="text-sm font-medium text-gray-500">校准设备来源</label>
              <p className="mt-1 text-sm text-gray-900">{config.calibratedEquipmentSource === 'current_anomaly_equipment' ? '当前异常设备' : '手动选择'}</p>
            </div>
            {config.calibratedEquipmentSource === 'manual_selection' && config.equipmentList && config.equipmentList.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">选择设备</label>
                <p className="mt-1 text-sm text-gray-900">{config.equipmentList.join(', ')}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">校准标准</label>
              <p className="mt-1 text-sm text-gray-900">{config.calibrationStandards || '无'}</p>
            </div>
            {formTemplateName && (
              <div>
                <label className="text-sm font-medium text-gray-500">关联表单模版</label>
                <p className="mt-1 text-sm text-gray-900">{formTemplateName}</p>
              </div>
            )}
            {/* 新增：显示标准工时和告警设置 */}
            {config.standardWorkingHours !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-500">标准工时</label>
                <p className="mt-1 text-sm text-gray-900">{config.standardWorkingHours} 小时</p>
              </div>
            )}
            {config.sendOvertimeAlert !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-500">超工时告警</label>
                <p className="mt-1 text-sm text-gray-900">{config.sendOvertimeAlert ? '已启用' : '未启用'}</p>
              </div>
            )}
          </div>
        );
        break;
      case 'approval':
        nodeSpecificDetails = (
          <div className="space-y-3">
            <h4 className="text-md font-medium text-gray-900 mb-2">审批动作详情</h4>
            <div>
              <label className="text-sm font-medium text-gray-500">审批人</label>
              <p className="mt-1 text-sm text-gray-900">{(config.approvers || []).join(', ') || '无'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">超时时间</label>
              <p className="mt-1 text-sm text-gray-900">{config.timeout ? `${config.timeout / 60000} 分钟` : '无'}</p>
            </div>
            {formTemplateName && (
              <div>
                <label className="text-sm font-medium text-gray-500">关联表单模版</label>
                <p className="mt-1 text-sm text-gray-900">{formTemplateName}</p>
              </div>
            )}
            {/* 新增：显示标准工时和告警设置 */}
            {config.standardWorkingHours !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-500">标准工时</label>
                <p className="mt-1 text-sm text-gray-900">{config.standardWorkingHours} 小时</p>
              </div>
            )}
            {config.sendOvertimeAlert !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-500">超工时告警</label>
                <p className="mt-1 text-sm text-gray-900">{config.sendOvertimeAlert ? '已启用' : '未启用'}</p>
              </div>
            )}
          </div>
        );
        break;
      default:
        // 对于其他未明确定义的动作类型，可以显示通用配置或不显示
        nodeSpecificDetails = (
          <div className="space-y-3">
            <h4 className="text-md font-medium text-gray-900 mb-2">动作配置详情 ({getActionTypeLabel(actionType)})</h4>
            {config && Object.keys(config).length > 0 ? (
              <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto">
                {JSON.stringify(config, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-gray-600">无详细配置信息。</p>
            )}
            {/* 新增：显示标准工时和告警设置 */}
            {config?.standardWorkingHours !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-700">标准工时</label>
                <p className="mt-1 text-sm text-gray-900">{config.standardWorkingHours} 小时</p>
              </div>
            )}
            {config?.sendOvertimeAlert !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-700">超工时告警</label>
                <p className="mt-1 text-sm text-gray-900">{config.sendOvertimeAlert ? '已启用' : '未启用'}</p>
              </div>
            )}
          </div>
        );
        break;
    }
  } else if (type === 'start' || type === 'end') {
    nodeSpecificDetails = (
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-900 mb-2">节点配置详情</h4>
        {config && Object.keys(config).length > 0 ? (
          <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto">
            {JSON.stringify(config, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-gray-600">无详细配置信息。</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 移除了 executionResults 模块 */}

      {nodeSpecificDetails && (
        <div className="border-t pt-4">
          {nodeSpecificDetails} {/* 节点特定详情模块 */}
        </div>
      )}

      {/* 如果没有 analysis 和 actions，根据节点状态显示默认内容 */}
      {stage.status === 'current' && !analysis && !actions && (
        <div className="mt-2 p-4 border border-dashed border-gray-300 rounded-md">
          <p className="text-sm text-gray-600">
            当前节点正在处理中，等待执行结果。
            {formTemplateName && ` (需填写表单: ${formTemplateName})`}
          </p>
        </div>
      )}
      {stage.status === 'completed' && !analysis && !actions && !nodeSpecificDetails && (
        <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h5 className="text-sm font-medium text-gray-700 mb-2">执行状态</h5>
          <p className="text-sm text-gray-600">该节点已执行完成。</p>
        </div>
      )}
      {stage.status === 'pending' && (
        <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h5 className="text-sm font-medium text-yellow-700 mb-2">执行状态</h5>
          <p className="text-sm text-yellow-600">该节点尚未执行。</p>
        </div>
      )}
    </div>
  );
};

const ProcessingFlowDisplay: React.FC<ProcessingFlowDisplayProps> = ({ workOrder }) => {
  const [selectedStage, setSelectedStage] = useState<WorkOrderStage | null>(null);

  // 在 workOrder 变化时重新初始化 selectedStage
  useEffect(() => {
    const defaultStage = workOrder.stages?.find(stage => stage.status === 'current') || workOrder.stages?.[0] || null;
    setSelectedStage(defaultStage);
  }, [workOrder]);

  // 获取所有阶段节点 - 修改后的版本，使用 currentStage 作为索引
  const getVisibleStages = (): WorkOrderStage[] => {
    if (!workOrder.stages || workOrder.stages.length === 0) {
      return [];
    }

    // workOrder.currentStage 存储的是当前阶段的索引（数字），可以为 0。
    // 确保 currentStage 是一个有效的数字索引。
    const currentStageIndex = workOrder.currentStage;

    // 检查 currentStageIndex 是否为有效的数字，并且在 stages 数组的有效范围内
    if (typeof currentStageIndex !== 'number' || currentStageIndex < 0 || currentStageIndex >= workOrder.stages.length) {
      // 如果 currentStageIndex 无效，则返回空数组，或者您可以选择返回第一个阶段作为默认值
      return [];
    }

    // 返回从开始到当前阶段的所有阶段（包括当前阶段）
    return workOrder.stages.slice(0, currentStageIndex + 1);
  };

  const visibleStages = getVisibleStages();

  const handleStageClick = (stage: WorkOrderStage) => {
    setSelectedStage(stage);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">处理流程</h2>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* 左侧流程时间线 - 使用 ProcessTimeline 组件 */}
        <div className="lg:w-1/3 border-r p-6">
          <ProcessTimeline
            stages={visibleStages}
            selectedStageId={selectedStage?.id}
            onStageClick={handleStageClick}
          />
        </div>

        {/* 右侧节点详情 */}
        <div className="lg:w-2/3 p-6">
          {selectedStage ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{selectedStage.name}</h3>
                {selectedStage.description && ( // 新增：显示节点描述
                  <p className="mt-1 text-sm text-gray-600">{selectedStage.description}</p>
                )}
                <div className="mt-2 flex items-center space-x-4">
                  <StatusBadge status={selectedStage.status} />
                  {selectedStage.type && (
                    <span className="text-sm text-gray-600">
                      类型: {getStageTypeLabel(selectedStage.type)}
                      {selectedStage.type === 'action' && (
                        <span className="ml-1">
                          ({getActionTypeLabel(selectedStage.actionType)})
                        </span>
                      )}
                    </span>
                  )}
                  {selectedStage.role && (
                    <span className="text-sm text-gray-600">角色: {selectedStage.role}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedStage.assignee && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">负责人</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedStage.assignee}</p>
                  </div>
                )}

                {selectedStage.completedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">完成时间</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {format(new Date(selectedStage.completedAt), 'yyyy-MM-dd HH:mm')}
                    </p>
                  </div>
                )}

                {selectedStage.createdAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">创建时间</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {format(new Date(selectedStage.createdAt), 'yyyy-MM-dd HH:mm')}
                    </p>
                  </div>
                )}
              </div>

              {/* 节点执行内容 */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">节点详情</h4>
                {renderNodeExecutionContent(selectedStage)}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">请从左侧选择一个节点查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessingFlowDisplay;