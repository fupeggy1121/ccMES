import React from 'react';
import { Target, Clipboard, GitBranch, FileText, Users } from 'lucide-react';

const OcapFunctions: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* OCAP实现目标 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg p-6 shadow-md">
        <div className="flex items-center mb-4">
          <Target className="w-8 h-8 mr-3" />
          <h2 className="text-2xl font-bold">OCAP 实现目标</h2>
        </div>
        <p className="text-lg leading-relaxed text-blue-100">
          对 SPC / FDC 等监测触发的失控（OOC/OOS）事件，进行标准化、可追溯的快速处置与恢复。
        </p>
      </div>

      {/* OCAP功能模块说明 */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">OCAP 功能模块说明</h3>

        <div className="space-y-6">
          {/* 功能模块 1: 工单管理 */}
          <div className="border-b pb-6">
            <div className="flex items-center mb-3">
              <Clipboard className="w-6 h-6 text-blue-600 mr-3" />
              <h4 className="text-lg font-semibold text-gray-800">1. OCAP 工单管理</h4>
            </div>
            <p className="text-gray-600 mb-3">
              提供全面的工单生命周期管理，从异常事件的创建、分配、处理到最终的审核与关闭。支持多种异常类型和字段，确保所有异常信息都被准确记录和跟踪。
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
              <li>工单列表与搜索：支持按批次号、设备、工单号进行搜索，按状态和异常类型进行筛选（待处理、处理中、已完成）。</li>
              <li>异常类型分类：支持 SPC OCAP、工艺异常、设备异常、材料异常、质量缺陷等多种异常类型。</li>
              <li>工单详情查看：展示工单基本信息（批次、设备、提交时间）、异常详情和完整的处理流程。</li>
              <li>处理流程跟踪：可视化展示多阶段处理流程，包括各节点的处理人、分析说明、处理措施和完成时间。</li>
              <li>质量审核功能：支持质量人员对工单进行审核，填写审核意见和结论（通过/有条件通过/不通过），并可生成 CAPA 纠正预防措施。</li>
              <li>处理节点管理：支持按角色分配处理任务，记录每个节点的分析结果和处理动作。</li>
            </ul>
          </div>

          {/* 功能模块 2: 工作流建模 */}
          <div className="border-b pb-6">
            <div className="flex items-center mb-3">
              <GitBranch className="w-6 h-6 text-green-600 mr-3" />
              <h4 className="text-lg font-semibold text-gray-800">2. OCAP 工作流建模</h4>
            </div>
            <p className="text-gray-600 mb-3">
              通过直观的可视化设计器，用户可以灵活地定义和配置 OCAP 异常处理流程。支持多种节点类型（开始、条件、动作、结束），并可配置每个节点的具体行为和参数。
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
              <li>模板管理：创建、编辑、复制、删除工作流模板，支持按分类和状态筛选（已发布、草稿、已归档、待审核）。</li>
              <li>模板分类：支持 SPC OCAP、设备故障、工艺问题、材料问题、质量缺陷等多种业务场景分类。</li>
              <li>可视化设计器：拖拽式节点设计，支持开始节点、条件节点（数值条件、批次状态条件）、动作节点（批次保留、设备校准、设备禁用、通知人员、审批、复测等）和结束节点。</li>
              <li>节点配置：为每个节点定义详细的执行动作、条件判断、用户组分配和通知规则。</li>
              <li>版本管理：支持工作流模板的版本控制，记录创建者、最后修改时间和节点数量。</li>
              <li>预设模板库：提供温度控制 OCAP、酸蚀刻工艺异常处理、压力监控 OCAP、设备故障处理等预设模板。</li>
              <li>系统模板保护：系统预设模板带有锁标识，确保核心流程的稳定性。</li>
            </ul>
          </div>

          {/* 功能模块 3: 表单模版管理 */}
          <div className="border-b pb-6">
            <div className="flex items-center mb-3">
              <FileText className="w-6 h-6 text-orange-600 mr-3" />
              <h4 className="text-lg font-semibold text-gray-800">3. 表单模版管理</h4>
            </div>
            <p className="text-gray-600 mb-3">
              提供灵活的表单模版设计和管理功能，支持多种数据采集场景。表单可与工作流节点关联，实现结构化的数据收集和验证。
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
              <li>模版管理：创建、编辑、复制、删除表单模版，支持按分类、状态和关键词搜索。</li>
              <li>模版分类：支持质量检查、设备维护、生产记录、异常处理、设备校准、自定义等多种分类。</li>
              <li>状态管理：表单模版支持草稿、已发布、已归档三种状态，确保版本控制。</li>
              <li>字段类型：支持文本、数字、日期、时间、选择框、复选框、单选框、文本域、文件上传、设备录入、测量数据录入等丰富的字段类型。</li>
              <li>字段配置：每个字段支持验证规则（必填、最小值、最大值、长度限制）、默认值、占位符、帮助文本等配置。</li>
              <li>特殊字段：支持设备录入字段（设备编号自动获取设备信息）和测量数据录入字段（复测站点参数批量录入）。</li>
              <li>系统预设模版：提供产品质量检查表、设备维护记录表、异常处理记录表、设备校准记录表、复测数据录入等系统模版。</li>
              <li>版本追踪：记录模版的创建者、创建时间、最后修改时间、部门和标签信息。</li>
              <li>模版预览：支持查看表单模版的实际渲染效果，确保表单设计符合预期。</li>
            </ul>
          </div>

          {/* 功能模块 4: 用户组管理 */}
          <div>
            <div className="flex items-center mb-3">
              <Users className="w-6 h-6 text-cyan-600 mr-3" />
              <h4 className="text-lg font-semibold text-gray-800">4. 用户组管理</h4>
            </div>
            <p className="text-gray-600 mb-3">
              提供基于角色的用户组管理功能，支持将用户按职能分组，并在工作流中进行任务分配。确保异常处理流程中的责任清晰、权限明确。
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
              <li>用户组创建：创建自定义用户组，设置组名称和描述信息。</li>
              <li>成员管理：为用户组添加或移除成员，支持多选和批量操作。</li>
              <li>用户组搜索：支持按组名称或描述进行搜索，快速定位目标组。</li>
              <li>成员查看：展开用户组可查看详细成员列表，显示成员姓名、邮箱和部门信息。</li>
              <li>工作流集成：用户组可与工作流节点关联，实现基于角色的任务自动分配。</li>
              <li>权限控制：支持编辑和删除用户组，确保组织架构变更时的灵活性。</li>
              <li>成员统计：实时显示每个用户组的成员数量，便于人力资源管理。</li>
              <li>数据持久化：用户组信息存储在 Supabase 数据库中，确保数据安全和可靠性。</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OcapFunctions;