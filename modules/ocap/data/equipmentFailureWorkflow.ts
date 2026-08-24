// src/data/equipmentFailureWorkflow.ts
import { WorkflowNode } from '../types/workflow';

export const equipmentFailureWorkflow: WorkflowNode[] = [
  {
    "id": "ef-start",
    "type": "start",
    "title": "开始",
    "description": "设备故障报警触发",
    "position": { "x": 100, "y": 60 },
    "connections": [
      { "targetNodeId": "ef-1", "sourceHandleId": "bottom-source", "targetHandleId": "top-target" }
    ],
    "config": {}
  },
  {
    "id": "ef-1",
    "type": "action",
    "title": "自动停机",
    "description": "系统自动执行设备紧急停机",
    "position": { "x": 100, "y": 220 },
    "connections": [
      { "targetNodeId": "ef-2", "sourceHandleId": "bottom-source", "targetHandleId": "top-target" }
    ],
    "config": {
      "actionType": "equipmentDisable",
      "disableReasonType": "设备故障",
      "disableReasonDetail": "系统检测到关键部件异常，自动停机",
      "parameters": {
        "emergencyStop": true,
        "isolatePower": true
      },
      "responsiblePersonnel": ["设备工程师"],
      "timeout": 60000
    }
  },
  {
    "id": "ef-2",
    "type": "action",
    "title": "通知设备工程师",
    "description": "通过邮件和系统消息通知设备工程师",
    "position": { "x": 92, "y": 360 },
    "connections": [
      { "targetNodeId": "ef-3", "sourceHandleId": "bottom-source", "targetHandleId": "top-target" }
    ],
    "config": {
      "actionType": "notifyPersonnel",
      "notificationMethods": ["email", "systemMessage"],
      "emailConfig": {
        "recipients": ["equipment.engineer@example.com"],
        "subject": "紧急：设备故障报警 - {{equipmentId}}",
        "bodyTemplate": "设备 {{equipmentId}} 发生故障，请立即处理。故障描述：{{faultDescription}}"
      },
      "systemMessageConfig": {
        "recipientIds": ["eng001", "eng002"],
        "priority": "urgent",
        "messageTemplate": "设备 {{equipmentId}} 故障，请立即前往处理！"
      },
      "responsiblePersonnel": ["设备工程师"],
      "timeout": 300000,
      "escalationRules": {
        "enabled": true,
        "timeoutMinutes": 15,
        "escalateTo": ["equipment.manager@example.com"]
      }
    }
  },
  {
    "id": "ef-3",
    "type": "condition",
    "title": "是否需要人工干预?",
    "description": "根据故障类型判断是否需要现场人工干预",
    "position": { "x": 82, "y": 500 },
    "connections": [
      { "targetNodeId": "ef-4", "sourceHandleId": "right-source", "targetHandleId": "left-target" },
      { "targetNodeId": "ef-end-repair", "sourceHandleId": "bottom-source", "targetHandleId": "top-target" }
    ],
    "config": {
      "dataSources": [
        { "name": "设备诊断系统", "parameters": ["faultCode", "severity", "autoRepairPossible"] }
      ],
      "conditionExpressions": [
        { "expression": "autoRepairPossible == true", "resultLabel": "否", "description": "可自动修复" },
        { "expression": "autoRepairPossible == false", "resultLabel": "是", "description": "需要人工修复" }
      ],
      "branchMappings": [
        { "result": "否", "targetNodeId": "ef-end-repair" },
        { "result": "是", "targetNodeId": "ef-4" }
      ],
      "evaluationLogic": {
        "operator": "firstMatch"
      }
    }
  },
  {
    "id": "ef-4",
    "type": "action",
    "title": "创建维修工单",
    "description": "在维护系统中创建维修工单",
    "position": { "x": 300, "y": 500 },
    "connections": [
      { "targetNodeId": "ef-5", "sourceHandleId": "bottom-source", "targetHandleId": "top-target" }
    ],
    "config": {
      "actionType": "createMaintenanceOrder",
      "parameters": {
        "priority": "high",
        "assignedTeam": "设备维护组",
        "faultDescription": "设备 {{equipmentId}} 故障，需人工检修"
      },
      "responsiblePersonnel": ["设备工程师"],
      "formTemplateId": "system-equipment-maintenance-001",
      "formTemplateName": "设备维护记录表"
    }
  },
  {
    "id": "ef-5",
    "type": "action",
    "title": "人工检修",
    "description": "设备工程师现场进行故障排查和修复",
    "position": { "x": 300, "y": 660 },
    "connections": [
      { "targetNodeId": "ef-end-repair", "sourceHandleId": "bottom-source", "targetHandleId": "top-target" }
    ],
    "config": {
      "actionType": "manualIntervention",
      "parameters": {
        "requiredSkills": ["电气维修", "机械调试"],
        "safetyProcedures": ["LOTO", "ESD"]
      },
      "responsiblePersonnel": ["设备工程师"],
      "timeout": 14400000
    }
  },
  {
    "id": "ef-end-repair",
    "type": "end",
    "title": "设备修复完成",
    "description": "设备故障已解决，恢复生产",
    "position": { "x": 200, "y": 800 },
    "connections": [],
    "config": {
      "endType": "success",
      "completionActions": [
        { "type": "resumeProduction", "parameters": { "equipmentId": "{{equipmentId}}" } },
        { "type": "updateEquipmentStatus", "parameters": { "status": "operational" } }
      ]
    }
  }
];

export const equipmentFailureWorkflowMetadata = {
  "name": "设备故障处理流程",
  "version": "1.0",
  "description": "针对生产设备突发故障的OCAP处理流程，旨在快速响应并恢复生产。",
  "lastModified": "2024-10-27",
  "createdBy": "System",
  "department": "设备部",
  "tags": ["设备", "故障", "维护", "紧急"]
};
