// src/components/Carriers/DocumentModal.tsx
import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [activeFRTab, setActiveFRTab] = useState('载具信息管理');
  const [activeOverviewTab, setActiveOverviewTab] = useState('1.1');
  const [activeDataReqTab, setActiveDataReqTab] = useState('carrier');

  const functionalRequirements = [
    {
      id: '载具信息管理',
      title: '载具信息管理',
      content: (
        <>
          {/* FR-001: 载具信息注册 */}
          <h4><strong>一、载具信息注册</strong></h4>
          <p>允许用户录入新的载具信息，包括其唯一标识、类型、容量、初始状态（占用状态、清洗状态）、当前位置以及所属载具组。</p>
          <h5>具体操作流程</h5>
          <ol>
            <li>用户点击"创建载具"按钮。</li>
            <li>系统弹出载具注册表单。</li>
            <li>用户在表单中填写以下信息：
              <ul>
                <li>载具 ID (必填，唯一)</li>
                <li>载具模型 (必填，下拉选择：片篮、Platen、堆叠盒)</li>
                <li>载具组 (必填，下拉选择：从现有载具组中选择)</li>
                <li>清洗状态 (必填，下拉选择：正常、待清洗、清洗中)</li>
                <li>占用状态 (必填，下拉选择：未占用、已占用)</li>
                <li>当前位置 (必填，下拉选择：预定义位置列表)</li>
              </ul>
            </li>
            <li>用户点击"创建载具"按钮提交表单。</li>
            <li>系统对输入数据进行验证。</li>
            <li>验证通过，系统保存载具信息，并显示"载具 [载具 ID] 创建成功！"的提示信息。</li>
            <li>验证失败，系统在对应字段下方显示具体的错误信息。</li>
          </ol>
          <h5>输入参数</h5>
          <ul>
            <li><code>carrierId</code>: string (载具的唯一标识符)</li>
            <li><code>type</code>: enum ('wafer-basket', 'platen', 'stacking-box')</li>
            <li><code>carrierGroupId</code>: string (所属载具组的 ID)</li>
            <li><code>cleaningStatus</code>: enum ('good', 'needs-cleaning', 'in-cleaning')</li>
            <li><code>status</code>: enum ('unoccupied', 'occupied')</li>
            <li><code>currentLocation</code>: string</li>
          </ul>
          <h5>输出结果</h5>
          <ul>
            <li>成功: 新增一条载具记录，并返回成功提示。</li>
            <li>失败: 返回错误提示及具体错误信息。</li>
          </ul>
          <h5>业务规则和约束条件</h5>
          <ul>
            <li>载具 ID 必须是全局唯一的。</li>
            <li>载具 ID、载具模型、载具组、清洗状态、占用状态、当前位置均为必填项。</li>
            <li>载具组必须是系统中已存在的有效载具组。</li>
            <li>载具的 <code>capacity</code> (容量) 和 <code>currentLoad</code> (当前载荷) 将根据载具类型自动初始化或由系统维护，无需用户手动输入。</li>
            <li><code>cleaningCount</code> (清洗次数) 初始值为 0。</li>
          </ul>
          <h5>异常情况处理方式</h5>
          <ul>
            <li><strong>载具 ID 重复</strong>: 提示"载具 ID 已存在，请重新输入。"</li>
            <li><strong>必填项缺失</strong>: 提示"XX 字段为必填项。"</li>
            <li><strong>载具组不存在</strong>: 提示"所选载具组不存在，请检查。"</li>
            <li><strong>数据格式错误</strong>: 提示"XX 字段格式不正确。"</li>
          </ul>

          {/* FR-002: 载具信息查询与筛选 */}
          <h4><strong>二、载具信息查询与筛选</strong></h4>
          <p>允许用户根据载具 ID、类型、占用状态、清洗状态等条件对载具列表进行查询和筛选，并支持分页显示。</p>
          <h5>具体操作流程</h5>
          <ol>
            <li>用户导航到"载具管理"模块的"载具列表"页面。</li>
            <li>用户可以在页面顶部的搜索框中输入载具 ID 或其他关键字进行模糊搜索。</li>
            <li>用户可以通过下拉选择器选择以下筛选条件：
              <ul>
                <li>载具类型 (全部、片篮、Platen、堆叠盒)</li>
                <li>占用状态 (全部、未占用、已占用)</li>
                <li>清洗状态 (全部、正常、待清洗、清洗中)</li>
              </ul>
            </li>
            <li>系统根据用户输入的搜索关键字和选择的筛选条件，实时更新载具列表。</li>
            <li>用户可以通过分页控件浏览载具列表。</li>
          </ol>
          <h5>输入参数</h5>
          <ul>
            <li><code>searchTerm</code>: string (搜索关键字，可选)</li>
            <li><code>typeFilter</code>: enum ('all', 'wafer-basket', 'platen', 'stacking-box', 可选)</li>
            <li><code>loadStatusFilter</code>: enum ('all', 'unoccupied', 'occupied', 可选)</li>
            <li><code>cleaningStatusFilter</code>: enum ('all', 'good', 'needs-cleaning', 'in-cleaning', 可选)</li>
            <li><code>currentPage</code>: number (当前页码)</li>
            <li><code>itemsPerPage</code>: number (每页显示条数)</li>
          </ul>
          <h5>输出结果</h5>
          <ul>
            <li>符合查询和筛选条件的载具列表，包含载具 ID、载具模型、载具组、清洗状态、占用状态、当前位置、当前批次、清洗次数、操作等信息。</li>
          </ul>
          <h5>业务规则和约束条件</h5>
          <ul>
            <li>搜索关键字支持对载具 ID 进行模糊匹配。</li>
            <li>筛选条件可组合使用。</li>
            <li>分页功能应支持跳转到指定页、上一页、下一页，并可调整每页显示条数。</li>
          </ul>
          <h5>异常情况处理方式</h5>
          <ul>
            <li><strong>无匹配结果</strong>: 载具列表区域显示"暂无载具数据"提示。</li>
          </ul>

          {/* FR-003: 载具信息编辑 */}
          <h4><strong>三、载具信息编辑</strong></h4>
          <p>允许用户修改现有载具的非关键信息，如容量、当前位置、所属载具组等。载具 ID 和类型等核心标识信息不可修改。</p>
          <h5>具体操作流程</h5>
          <ol>
            <li>用户在载具列表页面选择一个载具，点击其"操作"列中的"编辑"按钮。</li>
            <li>系统弹出载具编辑表单，并预填充当前载具的所有可编辑信息。</li>
            <li>用户修改需要更新的字段，例如：
              <ul>
                <li>载具组 (下拉选择)</li>
                <li>当前位置 (下拉选择)</li>
              </ul>
            </li>
            <li>用户点击"保存"按钮。</li>
            <li>系统对输入数据进行验证。</li>
            <li>验证通过，系统更新载具信息，并显示"载具 [载具 ID] 更新成功！"的提示信息。</li>
            <li>验证失败，系统在对应字段下方显示具体的错误信息。</li>
          </ol>
          <h5>输入参数</h5>
          <ul>
            <li><code>id</code>: string (载具的系统 ID，用于定位记录)</li>
            <li><code>carrierGroupId</code>: string (新的所属载具组 ID，可选)</li>
            <li><code>currentLocation</code>: string (新的当前位置，可选)</li>
          </ul>
          <h5>输出结果</h5>
          <ul>
            <li>成功: 更新载具记录，并返回成功提示。</li>
            <li>失败: 返回错误提示及具体错误信息。</li>
          </ul>
          <h5>业务规则和约束条件</h5>
          <ul>
            <li>载具 ID (<code>carrierId</code>) 和载具模型 (<code>type</code>) 不可修改。</li>
            <li>只有在载具处于"未占用"状态时，才允许修改其所属载具组和当前位置。</li>
          </ul>
          <h5>异常情况处理方式</h5>
          <ul>
            <li><strong>载具不存在</strong>: 提示"载具不存在，无法编辑。"</li>
            <li><strong>载具状态不符</strong>: 提示"载具处于占用状态，无法修改其所属载具组或位置。"</li>
            <li><strong>数据格式错误</strong>: 提示"XX 字段格式不正确。"</li>
          </ul>
        </>
      ),
    },
    {
      id: '载具状态更新',
      title: '载具状态更新 (系统自动/用户触发)',
      content: (
        <>
          <p>载具的占用状态和清洗状态会根据业务流程自动更新或由用户手动触发更新。</p>
          <h5>具体操作流程 (占用状态 - 系统自动)</h5>
          <ol>
            <li><strong>载具被分配到生产任务</strong>: 当载具（例如 Platen）被成功绑定到 MBE 装片准备任务时，系统自动将该载具的 <code>status</code> 更新为 <code>occupied</code>。</li>
            <li><strong>载具从生产任务中释放</strong>: 当载具（例如 Platen）从生产任务中解绑或任务完成时，系统自动将该载具的 <code>status</code> 更新为 <code>unoccupied</code>。</li>
          </ol>
          <h5>具体操作流程 (清洗状态 - 用户触发)</h5>
          <ol>
            <li><strong>开始清洗</strong>: 用户在载具列表或清洗任务记录中触发清洗操作，系统将载具的 <code>cleaningStatus</code> 更新为 <code>in-cleaning</code>。</li>
            <li><strong>结束清洗</strong>: 用户在清洗任务记录中完成清洗操作，系统将载具的 <code>cleaningStatus</code> 更新为 <code>good</code>。</li>
            <li><strong>标记待清洗</strong>: 当载具的清洗次数达到阈值或被检测到需要清洗时，系统或用户可将 <code>cleaningStatus</code> 更新为 <code>needs-cleaning</code>。</li>
          </ol>
          <h5>输入参数</h5>
          <ul>
            <li><code>id</code>: string (载具的系统 ID)</li>
            <li><code>status</code>: enum ('unoccupied', 'occupied')</li>
            <li><code>cleaningStatus</code>: enum ('good', 'needs-cleaning', 'in-cleaning')</li>
          </ul>
          <h5>输出结果</h5>
          <ul>
            <li>成功: 更新载具状态，并返回成功提示。</li>
            <li>失败: 返回错误提示。</li>
          </ul>
          <h5>业务规则和约束条件</h5>
          <ul>
            <li>载具在 <code>occupied</code> 状态下不能开始清洗。</li>
            <li>载具在 <code>in-cleaning</code> 状态下不能被分配到生产任务。</li>
            <li>状态更新应记录操作日志。</li>
          </ul>
          <h5>异常情况处理方式</h5>
          <ul>
            <li><strong>载具不存在</strong>: 提示"载具不存在，无法更新状态。"</li>
            <li><strong>状态更新冲突</strong>: 提示"载具当前状态不允许进行此操作。"</li>
          </ul>
        </>
      ),
    },
    {
      id: '清洗任务管理',
      title: '清洗任务管理',
      content: (
        <>
          {/* FR-005: 清洗任务管理 */}
          <h4>清洗任务管理</h4>
          <p>允许用户发起和管理载具的清洗任务，包括记录清洗人员、设备、开始时间、结束时间。支持对单个载具进行清洗，也支持选择多个载具进行批量清洗。</p>
          <h5>具体操作流程 (批量载具清洗)</h5>
          <ol>
            <li>用户在"载具列表"页面点击页面顶部的"批量清洗"按钮。</li>
            <li>系统弹出"片篮批量清洗"模态框。</li>
            <li>用户在"选择载具"区域，通过输入载具 ID 或扫描载具二维码，将多个载具添加到列表中。已添加的载具可移除。</li>
            <li>用户在模态框中选择清洗人员 (必填，下拉选择) 和清洗设备 (必填，下拉选择或扫描)。</li>
            <li>用户点击"开始批量清洗"按钮。</li>
            <li>系统验证输入数据，将所有选定载具的 <code>cleaningStatus</code> 更新为 <code>in-cleaning</code>，记录当前时间为 <code>startTime</code>，并创建一条新的 <code>CleaningRecord</code> (包含所有选定载具 ID，状态为 <code>in-progress</code>)。</li>
            <li>系统显示成功提示，模态框界面更新为"结束批量清洗"模式，显示实时流逝时间。</li>
            <li>用户完成清洗后，点击"结束批量清洗"按钮。</li>
            <li>系统记录当前时间为 <code>endTime</code>，更新 <code>CleaningRecord</code> 的 <code>status</code> 为 <code>completed</code>，并将所有参与清洗的载具的 <code>cleaningStatus</code> 更新为 <code>good</code>，<code>cleaningCount</code> 加 1。</li>
            <li>系统显示成功提示，模态框关闭。</li>
          </ol>
          <h5>输入参数</h5>
          <ul>
            <li><code>carrierIds</code>: string[] (参与清洗的载具 ID 列表)</li>
            <li><code>operator</code>: string (清洗操作员)</li>
            <li><code>equipment</code>: string (清洗设备)</li>
            <li><code>startTime</code>: Date (系统自动记录)</li>
            <li><code>endTime</code>: Date (系统自动记录或用户手动调整)</li>
            <li><code>notes</code>: string (备注，可选)</li>
          </ul>
          <h5>输出结果</h5>
          <ul>
            <li>成功: 创建/更新清洗记录，更新载具清洗状态和清洗次数，并返回成功提示。</li>
            <li>失败: 返回错误提示及具体错误信息。</li>
          </ul>
          <h5>业务规则和约束条件</h5>
          <ul>
            <li>载具在"已占用"或"清洗中"状态下不能开始新的清洗任务。</li>
            <li>清洗人员和清洗设备为必填项。</li>
            <li>结束时间必须晚于开始时间。</li>
            <li>批量清洗时，所有选定的载具必须满足清洗条件（例如，都处于"未占用"且"非清洗中"状态）。</li>
            <li>扫描设备功能应能自动填充设备 ID。</li>
          </ul>
          <h5>异常情况处理方式</h5>
          <ul>
            <li><strong>载具状态不符</strong>: 提示"载具 [载具 ID] 处于占用/清洗中状态，无法开始清洗。"</li>
            <li><strong>必填项缺失</strong>: 提示"XX 字段为必填项。"</li>
            <li><strong>结束时间早于开始时间</strong>: 提示"结束时间必须晚于开始时间。"</li>
            <li><strong>载具不存在</strong>: 提示"载具 [载具 ID] 不存在。"</li>
          </ul>

          {/* FR-006: 清洗记录查询 */}
          <h4>清洗记录查询</h4>
          <p>允许用户查询所有清洗任务记录，并查看单个清洗任务的详细信息，包括参与清洗的载具列表。</p>
          <h5>具体操作流程</h5>
          <ol>
            <li>用户导航到"载具管理"模块的"清洗任务记录"页面。</li>
            <li>用户可以在搜索框中输入任务 ID、载具 ID、操作员或设备进行模糊搜索。</li>
            <li>用户可以通过下拉选择器选择"状态"筛选条件 (全部、执行中、已完成)。</li>
            <li>系统根据搜索关键字和筛选条件，实时更新清洗任务列表，并支持分页。</li>
            <li>在清洗任务列表中，对于"执行中"的任务，其"操作"列显示"结束清洗"按钮。</li>
            <li>对于"已完成"的任务，其"操作"列显示"查看详情"按钮。</li>
            <li>用户点击"查看详情"按钮，系统弹出清洗任务详情模态框，显示任务所有信息。</li>
            <li>在清洗任务列表的"载具 ID"列，显示"X 个载具"，鼠标悬停时，系统弹出提示框，显示该清洗任务中所有载具的 ID 列表。</li>
          </ol>
          <h5>输入参数</h5>
          <ul>
            <li><code>searchTerm</code>: string (搜索关键字，可选)</li>
            <li><code>statusFilter</code>: enum ('all', 'in-progress', 'completed', 可选)</li>
            <li><code>currentPage</code>: number (当前页码)</li>
            <li><code>itemsPerPage</code>: number (每页显示条数)</li>
          </ul>
          <h5>输出结果</h5>
          <ul>
            <li>符合查询和筛选条件的清洗任务列表。</li>
            <li>清洗任务详情模态框，包含任务 ID、载具 ID 列表、操作员、设备、开始时间、结束时间、状态、备注等。</li>
            <li>鼠标悬停时显示载具 ID 列表的提示框。</li>
          </ul>
          <h5>业务规则和约束条件</h5>
          <ul>
            <li>搜索关键字支持对任务 ID、载具 ID、操作员、设备进行模糊匹配。</li>
            <li>清洗任务列表应按开始时间倒序排列，进行中的任务优先显示。</li>
            <li>载具 ID 列表提示框应清晰展示每个载具的唯一标识。</li>
          </ul>
          <h5>异常情况处理方式</h5>
          <ul>
            <li><strong>无匹配结果</strong>: 清洗任务列表区域显示"暂无清洗任务记录"提示。</li>
            <li><strong>任务不存在</strong>: 提示"清洗任务不存在，无法查看详情。"</li>
          </ul>
        </>
      ),
    },
    {
      id: '载具组管理',
      title: '载具组管理',
      content: (
        <>
          <p>允许用户创建、编辑和删除载具组，并为载具组配置保养周期。载具组用于对载具进行逻辑分组，便于管理和统计。</p>
          <h5>具体操作流程 (创建载具组)</h5>
          <ol>
            <li>用户导航到"载具管理"模块的"载具组"页面。</li>
            <li>用户点击"新建"按钮。</li>
            <li>系统弹出载具组创建表单。</li>
            <li>用户输入组名称 (必填，唯一)、描述 (必填)、保养周期 (可选，正整数)、周期单位 (可选，下拉选择：天、周、月、年)。</li>
            <li>用户点击"创建载具组"按钮提交表单。</li>
            <li>系统验证输入数据。</li>
            <li>验证通过，系统保存载具组信息，并显示"载具组 [组名称] 创建成功！"的提示信息。</li>
            <li>验证失败，系统在对应字段下方显示具体的错误信息。</li>
          </ol>
          <h5>具体操作流程 (编辑载具组)</h5>
          <ol>
            <li>用户在载具组列表页面选择一个载具组，点击其"操作"列中的"编辑"按钮。</li>
            <li>系统弹出载具组编辑表单，并预填充当前载具组的所有可编辑信息。</li>
            <li>用户修改需要更新的字段，例如：组名称、描述、保养周期、周期单位。</li>
            <li>用户点击"保存修改"按钮。</li>
            <li>系统验证输入数据。</li>
            <li>验证通过，系统更新载具组信息，并显示"载具组 [组名称] 更新成功！"的提示信息。</li>
            <li>验证失败，系统在对应字段下方显示具体的错误信息。</li>
          </ol>
          <h5>具体操作流程 (删除载具组)</h5>
          <ol>
            <li>用户在载具组列表页面选择一个载具组，点击其"操作"列中的"删除"按钮。</li>
            <li>系统弹出确认提示框："确定要删除载具组 [组名称] 吗？"</li>
            <li>用户点击"确定"按钮。</li>
            <li>系统检查该载具组下是否存在关联载具。</li>
            <li>如果不存在关联载具，系统删除载具组，并显示成功提示。</li>
            <li>如果存在关联载具，系统提示"载具组 [组名称] 下仍有载具，无法删除。"</li>
          </ol>
          <h5>输入参数</h5>
          <ul>
            <li><code>groupName</code>: string (载具组名称)</li>
            <li><code>description</code>: string (描述)</li>
            <li><code>maintenanceCycle</code>: number (保养周期值，可选)</li>
            <li><code>maintenanceCycleUnit</code>: enum ('天', '周', '月', '年', 可选)</li>
          </ul>
          <h5>输出结果</h5>
          <ul>
            <li>成功: 创建/更新/删除载具组记录，并返回成功提示。</li>
            <li>失败: 返回错误提示及具体错误信息。</li>
          </ul>
          <h5>业务规则和约束条件</h5>
          <ul>
            <li>载具组名称必须是唯一的。</li>
            <li>组名称和描述为必填项。</li>
            <li>保养周期必须为正整数，如果填写。</li>
            <li>如果填写保养周期，则周期单位也必须填写。</li>
            <li>不允许删除仍有载具关联的载具组。</li>
          </ul>
          <h5>异常情况处理方式</h5>
          <ul>
            <li><strong>组名称重复</strong>: 提示"载具组名称已存在，请重新输入。"</li>
            <li><strong>必填项缺失</strong>: 提示"XX 字段为必填项。"</li>
            <li><strong>数据格式错误</strong>: 提示"XX 字段格式不正确。"</li>
            <li><strong>载具组被占用</strong>: 提示"载具组 [组名称] 下仍有载具，无法删除。"</li>
          </ul>
        </>
      ),
    },
  ];

  const overviewSections = [
    {
      id: '1.1',
      title: '核心目标和业务价值',
      content: (
        <>
          <p>在半导体晶圆制造过程中，晶圆周转用片篮（载具）用于在各工序间转移和承载晶圆。为保障生产过程的洁净度和产品良率，需要对片篮进行有效的生命周期管理，包括日常使用状态跟踪以及定期清洗保养。其核心目标是：</p>
          <ul>
            <li><strong>提高载具利用率</strong>: 精确追踪载具的实时位置、占用状态和清洗状态，减少闲置和查找时间。</li>
            <li><strong>确保产品质量</strong>: 强制执行载具清洗流程，记录清洗历史，避免因载具污染导致的产品缺陷。</li>
            <li><strong>优化生产效率</strong>: 通过清晰的载具状态管理，支持生产计划和物料流转的顺畅进行，减少生产中断。</li>
            <li><strong>实现全面追溯</strong>: 记录载具的每一次使用、清洗和状态变更，为生产过程的追溯和审计提供数据支持。</li>
            <li><strong>降低运营成本</strong>: 延长载具使用寿命，减少不必要的损耗和采购。</li>
          </ul>
          <p>本模块的业务价值在于通过精细化管理，提升半导体制造的整体运营效率和产品质量控制水平。</p>
          <p>当前MES系统支持对片篮的全流程管理功能：</p>
          <ul>
            <li><strong>片篮模型定义</strong>: 维护片篮型号的编码、名称、容量等属性，以便按照型号生成具体的片篮实体。</li>
            <li><strong>片篮分组管理</strong>: 将片篮归类到片篮组，每个片篮组代表一组具有相同管控策略的片篮（例如适用于特定工序的片篮组、清洗周期相同的片篮组等）。片篮组配置统一的使用限制（可使用的工序范围）和清洗维护策略（清洗周期等）。</li>
            <li><strong>片篮注册与投产</strong>: 在MES中登记厂区内实际使用的每个片篮，指定其所属型号和片篮组。片篮组的配置将用于指导该片篮在生产执行过程中的使用管控和清洗计划。新片篮注册投入使用后，直到报废退出，都需要在MES中跟踪其状态和清洗情况。</li>      
          </ul>
        </>
      ),
    },
    {
      id: '1.2',
      title: '名词定义',
      content: (
        <>
          <ul>
            <li><strong>片篮（载具）</strong>: 用于承载晶圆在各工序间流转的容器。</li>
            <li><strong>片篮模型</strong>: 片篮的型号定义，包含编码、名称、容量等基本属性。</li>
            <li><strong>片篮组</strong>: 片篮的分组单元，一个片篮组内的所有片篮遵循相同的使用和清洗策略（如适用于相同工序范围、具有相同清洗周期等）。</li>
            <li><strong>清洗周期</strong>: 片篮需要清洗保养的时间间隔，由片篮组统一定义（例如每使用90天需清洗一次）。</li>
            <li><strong>占用状态</strong>: 片篮是否正被晶圆批次占用。可取值为"未占用"（空篮）或"已占用"（有晶圆）。</li>
            <li><strong>清洗状态</strong>: 片篮当前的清洁维护状态。可取值包括"正常"（清洁有效期内）、"待清洗"（已到清洗周期需保养）和"清洗中"（正在执行清洗作业）。</li>            
          </ul>
        </>
      ),
    },
    {
      id: '1.3',
      title: '片篮状态管理',
      content: (
        <>
          <p>为了清晰地表示片篮的不同状态维度，系统将采用两个独立字段管理片篮状态：</p>
          <ul>
            <li><strong>占用状态</strong>: 标识片篮是否承载晶圆。取值为：未占用：当前片篮为空闲状态，可用于承载新的晶圆批次；已占用：当前片篮上正承载有晶圆批次。</li>
            <li><strong>清洗状态</strong>: 标识片篮的清洁/保养情况。取值为正常：片篮处于清洁有效期内，无需保养，可正常使用；待清洗：片篮已达到规定的清洗周期要求，需要进行清洗保养。在清洗完成前，不允许再次用于生产；清洗中：片篮正在执行清洗过程，尚未完成。清洗完成后将恢复为"正常"状态。</li>
          </ul>
          <p>采用两个字段独立管理占用和清洗状态，可以更准确地反映片篮的实际情况。例如，一个片篮可以同时处于"已占用"且"正常"，表示它正在使用且清洁期未超期；也可以处于"未占用"但"待清洗"，表示空闲但需要尽快清洗。</p>
        </>
      ),
    },
    {
      id: '1.4',
      title: '业务流程',
      content: (
        <>
          <h5>生产周转使用流程</h5>
          <p>在晶圆生产过程中，片篮随晶圆批次流转，其占用状态需要实时更新：</p>          
          <ul>
            <li><strong>承载晶圆 </strong>: 当有晶圆批次需要转移时，操作人员在MES中选择一个未占用且正常的片篮进行承载。此时系统将该片篮的占用状态更新为"已占用"，并记录其与所载晶圆批次的关联（如批次ID等）。</li>
            <li><strong>流转与释放</strong>: 晶圆批次随着片篮移动到下一个工序或地点。当晶圆从片篮中卸出/移走后，操作人员在MES中完成批次的转移操作，系统将该片篮的占用状态更新回"未占用"（空篮可用）。此时片篮重新处于空闲状态，可以被下一个批次再次使用。</li>          
          </ul>     
          <p>在此流程中，系统还需遵循片篮组定义的限制规则：</p>          
          <ul>
            <li><strong>工序适用性检查 </strong>: 当选择片篮承载晶圆时，MES应校验该片篮所属片篮组是否允许用于当前工序。如果不允许，系统应提示不可用，防止片篮误用于未授权的工序步骤。</li>
            <li><strong>清洗到期检查</strong>: 当一个批次准备装载到片篮时，系统应检查该片篮的清洗状态是否为"待清洗"。如果片篮已经超期未清洗（待清洗状态），系统必须禁止将晶圆装载到该片篮上，并提示该片篮需清洗后才能使用。</li>          
          </ul>            
          
          <h5>片篮清洗流程管理</h5>
          <p>针对需要洁净度管控的片篮组，MES应按照预设清洗周期对片篮进行清洗保养管理。流程如下：</p>
          <ol>
            <li><strong>清洗周期监控</strong>: 系统以片篮最后一次清洗完成时间（或新片篮投入使用时间）为起点，开始计时追踪每个片篮距离下次清洗的时间。当达到该片篮组定义的清洗周期阈值时，判定该片篮到期需清洗。</li>
            <li><strong>到期标记</strong>: 当片篮到达清洗周期且：
              <ul>
                <li>片篮空闲（未占用）：系统应立即将其清洗状态更新为"待清洗"，表示该片篮需要保养清洗。在标记为待清洗后，MES将卡控此片篮不再被选择用于新的生产操作（即在批次装载选择时视为不可用）。</li>
                <li>片篮正在使用（已占用）：如果片篮在达到清洗周期时仍承载着晶圆，系统暂时不打断正在进行的生产流程。片篮可继续完成当前批次的流转。但一旦该批次卸载完成、片篮恢复空闲时，系统立即将其清洗状态切换为"待清洗"，并从此刻起禁止再装载新的晶圆批次。</li>
              </ul>
            </li>
            <li><strong>执行清洗</strong>: 对于状态为"待清洗"的片篮，操作人员需要尽快安排清洗。MES应提供在片篮管理界面或清洗管理界面上对待清洗状态的片篮执行清洗操作的功能：
              <ol>
                <li><strong>开始清洗</strong>: 操作人员选中待清洗的片篮，点击"清洗"或类似按钮以开始清洗流程。系统弹出填写清洗信息的窗口，包括指定清洗设备编号和清洗操作人员等字段。填写确认后，系统将该片篮的清洗状态更新为"清洗中"，记录清洗开始时间，并表明该片篮目前正在清洗过程中。</li>
                <li><strong>清洗过程</strong>: 实际的清洗作业在MES系统之外由指定的清洗设备和人员完成。MES主要扮演记录和状态监控角色。在清洗过程中，该片篮不可用于任何生产操作。</li>
                <li><strong>完成清洗</strong>: 当清洗作业完成后，操作人员在MES中点击"清洗完成"/"确认"按钮，结束该片篮的清洗流程。系统记录清洗结束时间，将片篮清洗状态恢复为"正常"，表示该载具已清洁可再次投入使用。同时，片篮保持"未占用"状态（因为清洗过程中篮内无晶圆）。</li>
              </ol>
            </li>
            <li><strong>清洗后处理</strong>: 清洗完成时，系统需进行以下处理：
              <ul>
                <li><strong>重置清洗计时</strong>: 将该片篮的最后清洗完成时间更新为当前时间，以便重新开始下一周期的计时。由此，该片篮的下一次清洗截止时间将顺延一个周期。</li>
                <li><strong>清洗次数累计</strong>: 增加该片篮的清洗次数计数（总清洗次数加一），并保存记录，方便后续查询每个片篮累计清洗了多少次。</li>
                <li><strong>状态解禁</strong>: 片篮清洗状态已恢复正常，意味着它重新符合使用条件。系统应解除对该片篮的使用锁定，允许其再次被选用来承载晶圆批次。</li>
              </ul>
            </li>
          </ol>
          <p>通过上述流程，MES实现了对片篮清洗的闭环管控，确保所有片篮都能按时得到清洁维护，防止超期未清洗的载具继续在生产中使用。</p>
        </>
      ),
    },
    {
      id: '1.5',
      title: '关键用户群体',
      content: (
        <>
          <ul>
            <li><strong>生产操作员</strong>: 负责载具的日常使用、清洗操作；了解载具可用性，执行生产任务。</li>
            <li><strong>质量管理人员</strong>: 审查载具清洗记录，确保符合质量标准。</li>
          </ul>
        </>
      ),
    },
    {
      id: '1.6',
      title: '与其他系统模块的关联关系',
      content: (
        <>
          <ul>
            <li><strong>生产计划模块</strong>:
              <ul>
                <li><strong>输入</strong>: 不同生产工艺站点可能对应特定类型的载具。</li>
                <li><strong>输出</strong>: 载具的占用状态、位置信息会影响生产计划的排程。</li>
              </ul>
            </li>
            <li><strong>设备管理模块</strong>:
              <ul>
                <li><strong>输入</strong>: 载具可能与特定设备关联（例如，Platen 绑定到 MBE 设备）。</li>
                <li><strong>输出</strong>: 载具的安装/卸载状态。</li>
              </ul>
            </li>
            <li><strong>线边仓管理模块</strong>:
              <ul>
                <li><strong>输入</strong>: 载具的入库、出库、位置变更。</li>
                <li><strong>输出</strong>: 载具的当前位置信息。</li>
              </ul>
            </li>
            <li><strong>质量管理模块</strong>:
              <ul>
                <li><strong>输入</strong>: 载具的清洗记录、保养记录。</li>
                <li><strong>输出</strong>: 载具的质量状态评估。</li>
              </ul>
            </li>
          </ul>
        </>
      ),
    },
  ];

  const dataRequirementsSections = [
    {
      id: 'carrier',
      title: '3.1 载具 (Carrier)',
      content: (
        <>
          <h4>载具 (Carrier)</h4>
          <ul>
            <li><strong>数据字段</strong>:
              <ul>
                <li><code>id</code>: string (系统内部唯一标识符，UUID)</li>
                <li><code>carrierId</code>: string (用户可见的载具编号，例如 "WB-001", "PL-005")</li>
                <li><code>type</code>: enum ('stacking-box', 'wafer-basket', 'platen')</li>
                <li><code>capacity</code>: number (载具容量，例如片篮容量25)</li>
                <li><code>currentLoad</code>: number (当前载具内物料数量，例如已装载的晶圆片数)</li>
                <li><code>status</code>: enum ('unoccupied', 'occupied')</li>
                <li><code>cleaningStatus</code>: enum ('good', 'needs-cleaning', 'in-cleaning')</li>
                <li><code>currentLocation</code>: string (载具当前所在位置，例如 "Zone A", "MBE-1")</li>
                <li><code>createdAt</code>: Date (创建时间)</li>
                <li><code>updatedAt</code>: Date (最后更新时间)</li>
                <li><code>cleaningCount</code>: number (累计清洗次数)</li>
                <li><code>loadedSmallBoxes</code>: string[] (载具内装载的小盒 ID 列表，仅适用于堆叠盒或片篮)</li>
                <li><code>carrierGroupId</code>: string (所属载具组的 <code>id</code>)</li>
              </ul>
            </li>
            <li><strong>数据验证规则</strong>:
              <ul>
                <li><code>carrierId</code>: 必填，唯一，长度不超过 50 个字符，支持字母、数字、中划线。</li>
                <li><code>type</code>: 必填，必须是预定义枚举值之一。</li>
                <li><code>capacity</code>: 必填，正整数。</li>
                <li><code>currentLoad</code>: 非负整数，不能超过 <code>capacity</code>。</li>
                <li><code>status</code>: 必填，必须是预定义枚举值之一。</li>
                <li><code>cleaningStatus</code>: 必填，必须是预定义枚举值之一。</li>
                <li><code>currentLocation</code>: 必填，必须是预定义位置列表中的一个。</li>
                <li><code>cleaningCount</code>: 非负整数。</li>
                <li><code>carrierGroupId</code>: 必填，必须是有效的载具组 ID。</li>
              </ul>
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'carrier-group',
      title: '3.2 载具组 (CarrierGroup)',
      content: (
        <>
          <h4>载具组 (CarrierGroup)</h4>
          <ul>
            <li><strong>数据字段</strong>:
              <ul>
                <li><code>id</code>: string (系统内部唯一标识符，UUID)</li>
                <li><code>groupName</code>: string (载具组名称，例如 "MBE Platen组", "清洗片篮组")</li>
                <li><code>description</code>: string (载具组描述)</li>
                <li><code>carrierCount</code>: number (组内载具数量，系统自动统计)</li>
                <li><code>carrierIds</code>: string[] (组内载具的 <code>id</code> 列表，系统自动维护)</li>
                <li><code>groupType</code>: enum ('production', 'maintenance', 'storage') (载具组类型，例如生产用、维护用、存储用)</li>
                <li><code>status</code>: enum ('active', 'inactive') (载具组状态)</li>
                <li><code>createdBy</code>: string (创建人)</li>
                <li><code>createdAt</code>: Date (创建时间)</li>
                <li><code>updatedAt</code>: Date (最后更新时间)</li>
                <li><code>maintenanceCycle</code>: number (保养周期值，例如 30)</li>
                <li><code>maintenanceCycleUnit</code>: string (保养周期单位，例如 '天', '周', '月', '年')</li>
              </ul>
            </li>
            <li><strong>数据验证规则</strong>:
              <ul>
                <li><code>groupName</code>: 必填，唯一，长度不超过 100 个字符。</li>
                <li><code>description</code>: 必填，长度不超过 500 个字符。</li>
                <li><code>groupType</code>: 必填，必须是预定义枚举值之一。</li>
                <li><code>status</code>: 必填，必须是预定义枚举值之一。</li>
                <li><code>maintenanceCycle</code>: 如果存在，必须是正整数。</li>
                <li><code>maintenanceCycleUnit</code>: 如果 <code>maintenanceCycle</code> 存在，则必填，且必须是预定义枚举值之一。</li>
              </ul>
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'cleaning-record',
      title: '3.3 清洗记录 (CleaningRecord)',
      content: (
        <>
          <h4>清洗记录 (CleaningRecord)</h4>
          <ul>
            <li><strong>数据字段</strong>:
              <ul>
                <li><code>id</code>: string (系统内部唯一标识符，UUID，代表一个清洗任务)</li>
                <li><code>carrierId</code>: string (主载具 ID，或批量清洗时代表一个任务 ID，可为空)</li>
                <li><code>carrierIds</code>: string[] (参与本次清洗的所有载具的 <code>id</code> 列表)</li>
                <li><code>operator</code>: string (清洗操作员姓名)</li>
                <li><code>equipment</code>: string (清洗设备 ID)</li>
                <li><code>startTime</code>: Date (清洗开始时间)</li>
                <li><code>endTime</code>: Date (清洗结束时间，进行中时为空)</li>
                <li><code>status</code>: enum ('in-progress', 'completed')</li>
                <li><code>notes</code>: string (备注，可选)</li>
                <li><code>createdAt</code>: Date (创建时间)</li>
                <li><code>updatedAt</code>: Date (最后更新时间)</li>
              </ul>
            </li>
            <li><strong>数据验证规则</strong>:
              <ul>
                <li><code>carrierIds</code>: 必填，至少包含一个有效的载具 ID。</li>
                <li><code>operator</code>: 必填，长度不超过 50 个字符。</li>
                <li><code>equipment</code>: 必填，长度不超过 50 个字符。</li>
                <li><code>startTime</code>: 必填，有效日期时间。</li>
                <li><code>endTime</code>: 如果 <code>status</code> 为 <code>completed</code>，则必填，且必须晚于 <code>startTime</code>。</li>
                <li><code>status</code>: 必填，必须是预定义枚举值之一。</li>
              </ul>
            </li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-7xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">载具管理功能模块需求说明文档</h2>
              <p className="text-sm text-gray-600 mt-1">文档版本: 1.0 | 创建日期: 2025年11月10日</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 prose max-w-none">
          {/* 模块概述 */}
          <h3>1. 模块概述</h3>
          <div className="flex border-b border-gray-200 mb-4 overflow-x-auto whitespace-nowrap">
            {overviewSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveOverviewTab(section.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2
                  ${activeOverviewTab === section.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-700 hover:text-blue-700 hover:border-gray-300 border-transparent'
                  }`}
              >
                {section.id} {section.title}
              </button>
            ))}
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              {overviewSections.find(section => section.id === activeOverviewTab)?.title}
            </h4>
            {overviewSections.find(section => section.id === activeOverviewTab)?.content}
          </div>

          {/* 功能需求清单 */}
          <h3>2. 功能需求清单</h3>
          <div className="flex border-b border-gray-200 mb-4 overflow-x-auto whitespace-nowrap">
            {functionalRequirements.map((req) => (
              <button
                key={req.id}
                onClick={() => setActiveFRTab(req.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2
                  ${activeFRTab === req.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-700 hover:text-blue-700 hover:border-gray-300 border-transparent'
                  }`}
              >
                {req.id}
              </button>
            ))}
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">{functionalRequirements.find(req => req.id === activeFRTab)?.title}</h4>
            {functionalRequirements.find(req => req.id === activeFRTab)?.content}
          </div>

          {/* 数据需求 */}
          <h3>3. 数据需求</h3>
          <div className="flex border-b border-gray-200 mb-4 overflow-x-auto whitespace-nowrap">
            {dataRequirementsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveDataReqTab(section.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2
                  ${activeDataReqTab === section.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-700 hover:text-blue-700 hover:border-gray-300 border-transparent'
                  }`}
              >
                {section.title}
              </button>
            ))}
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">{dataRequirementsSections.find(section => section.id === activeDataReqTab)?.title}</h4>
            {dataRequirementsSections.find(section => section.id === activeDataReqTab)?.content}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};