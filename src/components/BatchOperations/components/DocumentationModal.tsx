// src/components/DocumentationModal.tsx
import React from 'react';
import { X } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
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

        {/* 文档内容 */}
        <div className="flex-grow overflow-y-auto p-5 text-gray-700 text-sm leading-relaxed">
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

          <hr className="my-6 border-gray-200" />

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
        </div>
      </div>
    </div>
  );
};

export default DocumentationModal;
