// src/components/DocumentationModal.tsx
import React, { useState } from 'react';
import { X, Monitor, Layers, ShieldAlert } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DocTabId = 'overview' | 'basket-reorg' | 'batch-hold-release';

const DOC_TABS: { id: DocTabId; label: string; icon: typeof Monitor }[] = [
  { id: 'overview', label: '系统概述', icon: Monitor },
  { id: 'basket-reorg', label: '片篮重组模块', icon: Layers },
  { id: 'batch-hold-release', label: '批量扣留 / 批量释放', icon: ShieldAlert },
];

const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<DocTabId>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* 模态框内容 */}
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b flex-shrink-0 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">系统说明文档</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 主体：左侧子Tab + 右侧内容 */}
        <div className="flex flex-1 min-h-0">
          {/* 左侧标签页 */}
          <div className="w-48 flex-shrink-0 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 space-y-1">
              {DOC_TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 右侧内容区域 */}
          <div className="flex-1 p-5 overflow-y-auto text-gray-700 text-sm leading-relaxed">
            {activeTab === 'overview' && (
              <>
                <h3 className="text-lg font-semibold mb-3">欢迎使用批次作业系统</h3>
                <p className="mb-4">
                  本系统旨在简化和优化晶圆生产过程中的批次管理和操作。通过直观的用户界面，您可以轻松执行进站、出站、并批、攒批、拆批、打标、不良品录入及取消等多种操作。
                </p>

                <h4 className="text-md font-semibold mb-2">主要功能模块：</h4>
                <ul className="list-disc list-inside mb-4 space-y-1">
                  <li>**批次列表**：查看所有批次的基本信息、状态和当前站点。</li>
                  <li>**进站操作**：将批次从待进站状态流转至加工站点。</li>
                  <li>**出站操作**：完成批次在当前站点的加工，并流转至下一站点。</li>
                  <li>**并批操作**：将多个符合条件的批次合并为一个批次。</li>
                  <li>**攒批操作**：将多个小批量批次或散片晶圆重新组合成一个标准批次。</li>
                  <li>**拆批操作**：将一个大批次拆分为多个小批次。</li>
                  <li>**打标站点**：对晶圆片进行打标码生成和确认。</li>
                  <li>**检验站点**：进行几何参数检验、目检、颗粒检测等，并记录晶圆片类型、处置和档位。</li>
                  <li>**不良品录入**：记录晶圆片的不良信息。</li>
                  <li>**不良品录入取消**：撤销不良品录入，支持对空槽位进行当站Loss晶圆的回填。</li>
                  <li>**转档操作**：在不同产品料号之间进行批次转换。</li>
                </ul>

                <h4 className="text-md font-semibold mb-2">操作指南：</h4>
                <p className="mb-4">
                  在批次列表页面，您可以选择一个主批次进行操作。根据批次的状态和当前站点，右侧的操作区域将显示可用的操作按钮。点击相应的按钮将引导您进入对应的操作表单页面。
                </p>
                <p className="mb-4">
                  在各个操作表单中，请仔细核对批次信息、设备站点信息，并根据提示完成晶圆片或子批次的选择、参数录入等步骤。系统将提供必要的验证和提示，确保操作的准确性。
                </p>

                <h4 className="text-md font-semibold mb-2">常见问题：</h4>
                <ul className="list-disc list-inside mb-4 space-y-1">
                  <li>**如何处理不满篮的批次？**：在攒批操作中，您可以将不满篮的批次与其他批次或散片进行组合。</li>
                  <li>**如何处理Loss晶圆？**：在不良品录入取消页面，空槽位支持通过搜索功能补充Loss晶圆记录。</li>
                  <li>**为什么某些操作按钮是灰色的？**：操作按钮的可用性取决于当前选中批次的状态和权限。请检查批次状态是否符合操作要求。</li>
                </ul>

                <p className="text-gray-600 italic mt-6">
                  如有其他疑问，请联系系统管理员或查阅详细操作手册。
                </p>
              </>
            )}

            {activeTab === 'basket-reorg' && (
              <>
                <h3 className="text-lg font-semibold mb-3">片篮重组模块（WaferBasketReorganizationModule）功能说明</h3>
                <p className="mb-4">
                  该模块是用于晶圆片在不同片篮之间进行重组和转移的核心组件，提供直观的界面，允许用户选择源片篮中的晶圆片，并根据不同转移模式将其移动到目标片篮中。主要应用于拆批、并批、片篮更换等操作。
                </p>

                <h4 className="text-md font-semibold mb-2">主要功能点：</h4>
                <ul className="list-disc list-inside mb-4 space-y-1">
                  <li><strong>源片篮列表</strong>：展示所有可用的源片篮（Carrier ID、Sublot ID、良品数、不良品数），点击选中后高亮显示。</li>
                  <li><strong>源晶圆列表</strong>：展示选中源片篮中的所有晶圆片（槽位号 25→1 降序）。支持逐片或批量修改晶圆类型（良品 / 不良 / Loss）。</li>
                  <li><strong>目标片篮列表</strong>：支持新增、删除、重命名目标片篮，并提供槽位内晶圆的上下调整功能。</li>
                  <li><strong>转移操作</strong>：点击右箭头按钮将选中的源晶圆按当前转移模式写入目标片篮空槽位。</li>
                </ul>

                <h4 className="text-md font-semibold mb-2">转移模式说明：</h4>
                <ul className="list-disc list-inside mb-4 space-y-1">
                  <li><strong>平移（默认）</strong>：源晶圆按 25→1 顺序取出，按 25→1 顺序填入目标片篮空槽位。</li>
                  <li><strong>1→25</strong>：源晶圆按 1→25 顺序取出，按 25→1 顺序填入目标片篮空槽位。</li>
                  <li><strong>25→1</strong>：源晶圆按 25→1 顺序取出，按 1→25 顺序填入目标片篮空槽位。</li>
                </ul>

                <h4 className="text-md font-semibold mb-2">典型操作流程：</h4>
                <ol className="list-decimal list-inside mb-4 space-y-1">
                  <li>在左侧源片篮列表中选择源片篮。</li>
                  <li>在中间晶圆列表中勾选需要转移的晶圆，或批量设置晶圆类型。</li>
                  <li>选择转移模式（平移 / 1→25 / 25→1）。</li>
                  <li>在右侧目标片篮列表中选择目标片篮（可新增），点击右箭头完成转移。</li>
                  <li>可在目标片篮中继续调整晶圆类型和槽位顺序，由 <code>onReorganizationStateChange</code> 回调实时同步给父组件。</li>
                </ol>
              </>
            )}

            {activeTab === 'batch-hold-release' && (
              <>
                <h3 className="text-lg font-semibold mb-3">批量扣留 / 批量释放 操作手册</h3>
                <p className="mb-4">
                  当整批物料因异常需要暂停流转，或风险已排除需要恢复流转时，可以按"加工机台"或"晶棒"批量圈定批次范围，一次性完成扣留（HOLD）或释放，无需逐个批次操作。批次列表页右侧操作面板提供两组相关入口，使用场景不同，操作前请先分清：
                </p>

                <h4 className="text-md font-semibold mb-2">两种入口的区别：</h4>
                <ul className="list-disc list-inside mb-4 space-y-1">
                  <li><strong>批量扣留 / 批量释放</strong>（红色/绿色按钮，始终可点击）：无需预先勾选批次，点击后在弹窗内自行按条件检索出目标批次范围，适合"按机台/晶棒圈定一批批次"的场景。</li>
                  <li><strong>批次扣留（N）/ 批次释放（N）</strong>：需要先在批次列表中勾选一个或多个批次（未勾选时按钮为灰色不可点击，N 为已勾选数量），再对这些已勾选批次直接扣留/释放，适合"已经在列表里挑好了具体批次"的场景。</li>
                  <li>两种入口最终会弹出同一套确认弹窗（扣留填写原因，释放填写审批意见），确认逻辑完全一致，仅批次范围的圈定方式不同，产生的扣留/释放记录没有区别。</li>
                </ul>

                <h4 className="text-md font-semibold mb-2">批量扣留操作步骤：</h4>
                <ol className="list-decimal list-inside mb-4 space-y-1">
                  <li>点击右侧操作面板中的红色<strong>"批量扣留"</strong>按钮，弹出"批次检索批量扣留"窗口。</li>
                  <li>选择检索方式：<strong>按加工机台</strong>（先选站点，再多选该站点下的机台）或<strong>按晶棒</strong>（多选晶棒ID），二者互斥、只能选一种；可再叠加"出站时间从/到"进一步缩小范围。</li>
                  <li>点击<strong>"检索"</strong>，下方会列出命中的批次（批次编码、机台、晶棒ID、站点、数量、状态、出站时间），其中已处于HOLD状态的批次会带有红色 HOLD 标记。</li>
                  <li>确认范围无误后，点击<strong>"一键批量HOLD（N）"</strong>（N为检索结果数），打开批量扣留确认弹窗；也可先点"导出清单"核对范围。</li>
                  <li>在确认弹窗中填写：<strong>扣留原因分类</strong>（SPC异常 / 客户投诉 / 辅料问题 / 其他）、<strong>扣留原因说明</strong>（必填）、<strong>责任工艺工程师</strong>（必填）、<strong>知会质量工程师</strong>（可选）。</li>
                  <li>点击<strong>"确认扣留"</strong>——扣留操作<strong>无需审批，立即生效</strong>，系统会自动向责任工艺工程师生成一条"工程异常反馈"记录（当前阶段仅结构化留存，不发送真实通知）。</li>
                </ol>

                <h4 className="text-md font-semibold mb-2">批量释放操作步骤：</h4>
                <ol className="list-decimal list-inside mb-4 space-y-1">
                  <li>点击右侧操作面板中的绿色<strong>"批量释放"</strong>按钮，弹出"批次检索批量释放"窗口。</li>
                  <li>同样按<strong>加工机台/晶棒</strong> + 出站时间范围检索，还可叠加<strong>产品分类、客户、料号</strong>条件缩小范围；结果只会展示当前<strong>处于HOLD状态</strong>的批次。</li>
                  <li>在结果列表中通过每行前的复选框逐条勾选，或用表头的全选框一次性勾选当前检索结果；切换检索条件不会清空已勾选的批次。</li>
                  <li>点击<strong>"批量释放（N）"</strong>（N为已勾选数量），打开释放确认弹窗。</li>
                  <li>填写<strong>审批意见 / 决议依据</strong>（必填，例如"8.20质量评审会决议，风险已排除"），点击<strong>"确认释放"</strong>完成操作。</li>
                </ol>

                <h4 className="text-md font-semibold mb-2">常见问题：</h4>
                <ul className="list-disc list-inside mb-4 space-y-1">
                  <li><strong>"确认扣留/确认释放"按钮为什么点不动？</strong>：扣留原因说明、责任工艺工程师（扣留场景）或审批意见（释放场景）为必填项，留空时按钮保持灰色不可点击。</li>
                  <li><strong>为什么"批量释放"检索出来是空的？</strong>：该弹窗只列出当前处于HOLD状态的批次，若圈定范围内没有已扣留批次，会提示"当前没有符合条件的Hold批次"，请先确认目标批次是否确已被扣留。</li>
                  <li><strong>批量扣留和批次扣留（N）会不会冲突？</strong>：两者是同一套扣留逻辑的不同入口，可按需选择，不会互相冲突。</li>
                  <li><strong>扣留后能直接撤销吗？</strong>：扣留没有独立的撤销入口，需要通过"批量释放"或"批次释放"重新走一遍释放流程并填写审批意见。</li>
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationModal;
