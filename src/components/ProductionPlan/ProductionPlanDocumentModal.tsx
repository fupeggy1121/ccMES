// src/components/ProductionPlan/ProductionPlanDocumentModal.tsx
import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';

interface ProductionPlanDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductionPlanDocumentModal: React.FC<ProductionPlanDocumentModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [activeMainTab, setActiveMainTab] = useState('overview');
  const [activeOverviewTab, setActiveOverviewTab] = useState('1.1');
  const [activeFRTab, setActiveFRTab] = useState('FR-001');
  const [activeDataReqTab, setActiveDataReqTab] = useState('production-order');

  const overviewSections = [
    {
      id: '1.1',
      title: '核心目标和业务价值',
      content: (
        <>
          <p>生产工单模块旨在对半导体晶圆生产过程中的工单进行全面管理，确保生产计划的有效执行和物料的精准控制。其核心目标包括：</p>
          <ul>
            <li><strong>优化生产计划执行</strong>: 通过清晰的工单管理，确保生产任务按计划启动、执行和完成。</li>
            <li><strong>实现物料精准追溯</strong>: 详细记录工单所需的物料清单（BOM），并支持物料领用和投料的追溯。</li>
            <li><strong>提升生产效率</strong>: 简化工单创建、审批和执行流程，减少人工干预和错误。</li>
            <li><strong>支持多类型工单管理</strong>: 能够处理标准工单、返工工单、实验工单和代工工单等多种业务场景。</li>
            <li><strong>提供实时生产数据</strong>: 实时更新工单进度，为生产决策提供数据支持。</li>
          </ul>
          <p>本模块的业务价值在于通过精细化管理，提升半导体制造的整体运营效率、产品质量控制水平和成本效益。</p>
        </>
      ),
    },
    {
      id: '1.2',
      title: '名词定义',
      content: (
        <>
          <ul>
            <li><strong>生产工单 (Work Order)</strong>: 指示生产部门制造特定数量产品的正式文件，包含产品信息、数量、计划时间、BOM等。</li>
            <li><strong>BOM (Bill of Materials)</strong>: 物料清单，详细列出制造一个产品所需的所有原材料、组件和数量。</li>
            <li><strong>工单备料 (Material Picking)</strong>: 根据工单需求，从仓库领用物料的过程。</li>
            <li><strong>投料 (Material Feeding)</strong>: 将备好的物料投入生产线进行加工的过程。</li>
            <li><strong>生产批次号 (Lot ID)</strong>: 生产过程中对一批产品进行唯一标识的编码，用于追溯。</li>
            <li><strong>工艺站点 (Process Station)</strong>: 生产流程中的一个具体工序或工作站。</li>
          </ul>
        </>
      ),
    },
    {
      id: '1.3',
      title: '工单状态管理',
      content: (
        <>
          <p>生产工单的状态会根据其在生产流程中的进展自动更新或由用户手动触发：</p>
          <ul>
            <li><strong>已排产 (Scheduled)</strong>: 工单已创建并计划执行，但尚未开始备料或投料。</li>
            <li><strong>部分排产 (Partially Scheduled)</strong>: 工单已开始备料或投料，但尚未完成所有物料的准备。</li>
            <li><strong>已关闭 (Closed)</strong>: 工单已完成并经过最终审核，不再进行任何操作。</li>
          </ul>
        </>
      ),
    },
    {
      id: '1.4',
      title: '业务流程',
      content: (
        <>
          <h5>生产工单生命周期</h5>

          {/* 生产工单下发生产流程图 */}
          <h5 className="mt-6 mb-4">生产工单下发生产流程图</h5>
          <img
            src="/production-workflow.png" // 图片路径
            alt="生产工单下发生产流程"
            className="max-w-full h-auto my-4 border border-gray-200 rounded-lg shadow-sm"
          />

          {/* 新增：流程步骤详解 */}
          <h4 className="mt-6 mb-3 text-lg font-semibold text-gray-900">流程步骤详解：</h4>
          <p><strong>1、生产计划与排程---ERP端</strong></p>
          <ul>
            <li>ERP系统根据销售订单、预测、库存情况等，运行MRP（物料需求计划），生成生产计划和采购计划。</li>
            <li>生产计划员在ERP中根据设备、人员、物料可用性进行详细排程。</li>
          </ul>
          <p><strong>2、创建并下发生产工单---ERP端</strong></p>
          <ul>
            <li>ERP系统根据排程结果，正式创建生产工单。工单包含关键信息：产品编码、数量、计划开始/结束时间、工艺路线、BOM（物料清单）等。</li>
            <li>ERP通过系统接口（如API、Web Service）将工单下发（同步）到MES系统。此时，工单在MES中通常处于"未排产"状态。</li>
          </ul>
          <p><strong>3、接收工单---MES端</strong></p>
          <ul>
            <li>MES系统接收工单后，生产主管或班组长可以在MES中看到任务。</li>
            <li>当生产线准备就绪可以开始生产时，在MES中针对"工单"执行投料操作，这一步是MES生产执行的起点，工单状态变为"部分排产"。</li>
          </ul>          
          <p><strong>4、备料发料流程---ERP端</strong></p>
          <p>备料是与创建工单一起执行，还是下发后由生产发起，取决于企业的生产模式和物料管理策略，主要有两种模式：</p>
          <p><strong>模式一：工单下发前，ERP端发起齐套备料（推式领料）</strong></p>
          <ul>
            <li>流程：ERP创建工单后，库管人员根据工单BOM，生成备料单（或称领料单），原料总库根据此单进行拣配、齐套检查，然后将物料发往生产线线边仓。工单备料通常在工单下发到MES之前或同时进行，确保生产开始前物料已就位。</li>
            <li>适用场景：
              <ul>
                <li>大批量、少品种的重复性生产。</li>
                <li>物料价值较高、需要严格齐套性检查的生产。</li>
                <li>计划性强，物料准备时间较长的场景。</li>
              </ul>
            </li>
            <li>缺点：可能造成线边仓库存积压，占用资金。</li>
          </ul>
          <p><strong>模式二：工单下发后，MES端发起按需领料（拉式领料）</strong></p>
          <ul>
            <li>流程：MES中的工单同步后，生产开始前，由生产线（班组长或物料员）在MES中发起领料申请。该申请传递至ERP或WMS，指导原料总库进行发料。这种模式减少线边仓库存，按需拉动。</li>
            <li>适用场景：
              <ul>
                <li>小批量、多品种的离散制造。</li>
                <li>精益生产（JIT）模式，追求低库存。</li>
                <li>物料种类繁多，线边仓空间有限。</li>
              </ul>
            </li>
            <li>缺点：对物料配送的及时性要求极高，否则会影响生产。</li>
          </ul>
          <p>"推式"更侧重于计划驱动，而"拉式"更侧重于执行驱动。现代智能制造更倾向于结合两者优点，实现更灵活的物料配送。</p>
          
          <p><strong>5、工单执行与数据采集---MES端</strong></p>
          <ul>
            <li>操作工在MES终端上接收任务，开始生产。</li>
            <li>MES采集生产数据：工时、产量、良品/不良品数量、设备状态、操作人员等。</li>
          </ul>
          <p><strong>6、工单完工与上报---MES端</strong></p>
          <ul>
            <li>当生产完成或一批次完成时，在MES中进行"工序完工报工"操作。</li>
            <li>MES将完工数量、工时、物料消耗等数据实时上报给ERP系统。</li>
          </ul>
          <p><strong>7、工单关闭与成本结算---ERP端</strong></p>
          <ul>
            <li>ERP系统根据MES上报的完工数据，自动扣减库存，计算工单的实际成本。</li>
            <li>工单状态在ERP中变为"已关闭"，完成整个生命周期。</li>
          </ul>


          <p><strong>备料单生成跟原料总库出库操作关联</strong></p>
          <ul>
            <li>备料单（或领料单）是原料总库进行出库操作的唯一合法依据。</li>
            <li>在系统集成层面：
              <ul>
                <li>如果是ERP发起的备料，ERP生成的备料单会直接驱动WMS库存模块进行出库。</li>
                <li>如果是MES发起的领料申请，这个申请会通过接口传递给ERP，ERP系统会据此生成正式的备料单，然后再驱动WMS库存模块进行出库。</li>
              </ul>
            </li>
            <li>出库操作完成后，ERP中的原料总库库存数量会立即扣减，财务账和实物账保持一致。</li>
          </ul>

          <p><strong>备料单上的物料需要在MES线边仓中管理</strong></p>
          <p>线边仓是生产现场的物料缓存区，对其进行精细化管理至关重要。</p>
          <ul>
            <li>库存可视化：让管理者和操作者清晰知道线边仓还有多少物料，避免缺料或积压。</li>
            <li>物料追溯：当发生产品质量问题时，可以快速定位到使用了哪个批次的原材料。</li>
            <li>消耗反冲：很多企业采用"反冲法"计算物料消耗。即工单完工时，根据BOM和完工数量，自动从线边仓扣减物料数量。这要求线边仓有准确的期初和期末库存数据。</li>
          </ul>
          <p>如何在MES中管理：</p>
          <ul>
            <li>当物料从原料总库出库发到线边仓时，在MES中需要做一个"线边仓入库"操作。</li>
            <li>工单完工或批次结束时，MES系统通过"反冲"或手动确认的方式，做"线边仓出库"操作。</li>
          </ul>

          <h4 className="mt-6 mb-3 text-lg font-semibold text-gray-900">总结与最佳实践建议</h4>
          <ul>
            <li>流程标准化：明确界定备料流程是"推式"还是"拉式"，或混合模式，并形成标准操作规程。</li>
            <li>系统集成：确保ERP和MES之间有稳定、高效的数据接口，实现主数据和业务数据的无缝同步。</li>
            <li>线边仓精细化管理：将线边仓视为一个正式的"仓库"在MES中进行管理，这是实现物料精准控制和全流程追溯的关键。</li>
            <li>管控：原料总库的出库必须依据系统中的有效单据，杜绝无单操作，保证账实相符。</li>
          </ul>
        </>
      ),
    },
    {
      id: '1.5', 
      title: '关键用户群体',
      content: (
        <>
          <ul>
            <li><strong>生产计划员</strong>: 负责创建和排程生产工单。</li>
            <li><strong>生产操作员</strong>: 负责执行工单，进行物料领用和投料操作。</li>
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
            <li><strong>物料管理模块</strong>: 提供物料基础信息、库存状态，接收物料领用和投料请求。</li>
            <li><strong>设备管理模块</strong>: 关联生产设备，记录设备使用情况。</li>
            <li><strong>质量管理模块</strong>: 接收工单生产数据，进行质量检验和追溯。</li>
            <li><strong>线边仓管理模块</strong>: 接收物料出库请求，管理线边仓物料库存。</li>
          </ul>
        </>
      ),
    },
  ];

  const functionalRequirements = [
    {
      id: 'FR-001',
      title: 'FR-001: 生产工单创建与管理',
      content: (
        <>
          <h4>生产工单创建</h4>
          <p>允许用户创建新的生产工单，并配置其基本信息、产品信息、计划时间、优先级和BOM。</p>
          <h5>具体操作流程</h5>
          <ol>
            <li>用户点击"新建工单"按钮。</li>
            <li>系统弹出工单创建表单。</li>
            <li>用户填写工单类别（标准、返工、代工等）、产品料号、目标数量、计划开始/结束日期、优先级、创建人等信息。</li>
            <li>用户可选择BOM模板，系统自动计算物料需求。</li>
            <li>对于返工/代工工单，用户需指定起始和结束加工站点。</li>
            <li>用户点击"创建工单"按钮提交。</li>
            <li>系统验证数据，生成唯一工单号，并保存工单信息。</li>
          </ol>
          <h5>输入参数</h5>
          <ul>
            <li><code>orderType</code>: string (工单类别)</li>
            <li><code>productPartNumber</code>: string (产品料号)</li>
            <li><code>targetQuantity</code>: number (目标数量)</li>
            <li><code>startDate</code>: Date (计划开始日期)</li>
            <li><code>endDate</code>: Date (计划结束日期)</li>
            <li><code>priority</code>: enum ('high', 'medium', 'low')</li>
            <li><code>createdBy</code>: string (创建人)</li>
            <li><code>selectedBomTemplateId</code>: string (BOM模板ID，可选)</li>
            <li><code>startProcessStationCode</code>: string (起始加工站点，返工/代工工单必填)</li>
            <li><code>endProcessStationCode</code>: string (结束加工站点，返工/代工工单必填)</li>
            <li><code>notes</code>: string (备注，可选)</li>
          </ul>
          <h5>输出结果</h5>
          <ul>
            <li>成功: 创建新的生产工单记录，并返回成功提示及工单号。</li>
            <li>失败: 返回错误提示及具体错误信息。</li>
          </ul>
          <h5>业务规则和约束条件</h5>
          <ul>
            <li>工单号由系统自动生成，唯一。</li>
            <li>产品料号、目标数量、计划开始/结束日期、创建人为必填项。</li>
            <li>结束日期必须晚于开始日期。</li>
            <li>返工/代工工单的结束加工站点必须在起始加工站点之后。</li>
          </ul>
        </>
      ),
    },
    {
      id: 'FR-002',
      title: 'FR-002: 生产工单查询与筛选',
      content: (
        <>
          <h4>生产工单查询与筛选</h4>
          <p>允许用户根据工单号、产品名称、状态、优先级、工单类别等条件对工单列表进行查询和筛选，并支持分页显示。</p>
          <h5>具体操作流程</h5>
          <ol>
            <li>用户导航到"生产计划"模块的"生产工单"页面。</li>
            <li>用户可以在搜索框中输入工单号或产品名称进行模糊搜索。</li>
            <li>用户可以通过下拉选择器选择以下筛选条件：工单状态、优先级、工单类别。</li>
            <li>系统根据用户输入的搜索关键字和选择的筛选条件，实时更新工单列表。</li>
            <li>工单列表展示工单号、产品名称、工单类别、生产进度、计划时间、负责人、状态、优先级和操作按钮。</li>
          </ol>
          <h5>输入参数</h5>
          <ul>
            <li><code>searchTerm</code>: string (搜索关键字，可选)</li>
            <li><code>statusFilter</code>: enum ('all', 'scheduled', 'in-progress', 'completed', 'delayed', 可选)</li>
            <li><code>priorityFilter</code>: enum ('all', 'high', 'medium', 'low', 可选)</li>
            <li><code>typeFilter</code>: enum ('all', '标准工单', '返工工单', '实验工单', '代工工单', 可选)</li>
          </ul>
          <h5>输出结果</h5>
          <ul>
            <li>符合查询和筛选条件的生产工单列表。</li>
          </ul>
          <h5>业务规则和约束条件</h5>
          <ul>
            <li>搜索关键字支持对工单号和产品名称进行模糊匹配。</li>
            <li>筛选条件可组合使用。</li>
          </ul>
        </>
      ),
    },
    {
      id: 'FR-003',
      title: 'FR-003: 工单备料与投料',
      content: (
        <>
          <h4>工单备料</h4>
          <p>允许生产操作员根据工单BOM发起物料领用申请，并追踪备料进度。</p>
          <h5>具体操作流程</h5>
          <ol>
            <li>用户在工单列表点击某个工单的"工单备料"按钮。</li>
            <li>系统弹出"工单备料单"模态框。</li>
            <li>模态框左侧展示工单的工艺站点列表，用户选择站点后，右侧分两部分：
              <ul>
                <li>上部分：展示该站点已备料的物料批次列表。</li>
                <li>下部分：展示该站点物料清单，用户可输入本次领料数量。</li>
              </ul>
            </li>
            <li>用户填写申请人、本次领料数量等信息，并点击"提交申请"按钮。</li>
            <li>系统验证数据，生成物料领用申请单和仓库出库申请单。</li>
          </ol>
          <h5>输入参数</h5>
          <ul>
            <li><code>workOrderId</code>: string (工单ID)</li>
            <li><code>workOrderNumber</code>: string (工单号)</li>
            <li><code>requestedBy</code>: string (申请人)</li>
            <li><code>bomPickingItems</code>: array (包含物料ID、本次领料数量等)</li>
            <li><code>notes</code>: string (备注，可选)</li>
          </ul>
          <h5>输出结果</h5>
          <ul>
            <li>成功: 生成物料领用申请和出库申请，并返回成功提示。</li>
            <li>失败: 返回错误提示及具体错误信息。</li>
          </ul>

          <h4>物料投料</h4>
          <p>允许生产操作员将备好的物料投入生产线，系统记录投料信息并生成生产批次号。</p>
          <h5>具体操作流程</h5>
          <ol>
            <li>用户在工单列表点击某个工单的"投料"按钮。</li>
            <li>系统弹出"原料投料"模态框。</li>
            <li>用户选择要投料的物料（可从线边仓选择，或对于特定产品类型（如氮化镓外延片）从已除气的Platen中选择衬底片）。</li>
            <li>对于需要片篮绑定的物料，用户需指定片篮和槽位。</li>
            <li>用户填写操作员、投料日期等信息，并点击"确认投料"按钮。</li>
            <li>系统验证数据，生成唯一的生产批次号（Lot ID），更新物料库存，并记录投料历史。</li>
          </ol>
          <h5>输入参数</h5>
          <ul>
            <li><code>workOrderId</code>: string (工单ID)</li>
            <li><code>workOrderNumber</code>: string (工单号)</li>
            <li><code>operator</code>: string (操作员)</li>
            <li><code>feedingDate</code>: Date (投料日期)</li>
            <li><code>materials</code>: array (包含物料ID、数量、片篮ID、槽位号等)</li>
            <li><code>notes</code>: string (备注，可选)</li>
          </ul>
          <h5>输出结果</h5>
          <ul>
            <li>成功: 生成生产批次号，更新物料状态，并返回成功提示。</li>
            <li>失败: 返回错误提示及具体错误信息。</li>
          </ul>
        </>
      ),
    },
    {
      id: 'FR-004',
      title: 'FR-004: BOM物料清单查看',
      content: (
        <>
          <h4>BOM物料清单查看</h4>
          <p>允许用户查看生产工单关联的BOM物料清单，包括物料编码、名称、规格、需求数量等详细信息。</p>
          <h5>具体操作流程</h5>
          <ol>
            <li>用户在工单列表点击某个工单的"BOM"按钮。</li>
            <li>系统弹出"BOM物料清单"模态框。</li>
            <li>模态框左侧展示工单产品对应的工艺站点列表，用户选择站点后，右侧展示该站点所需的物料明细。</li>
            <li>物料明细包括物料编码、名称、规格、供应商、单位、需求数量、单价和总价。</li>
            <li>模态框底部显示物料总计金额。</li>
          </ol>
          <h5>输入参数</h5>
          <ul>
            <li><code>workOrderNumber</code>: string (工单号)</li>
            <li><code>bomItems</code>: array (BOM物料项列表)</li>
            <li><code>productType</code>: string (产品类型)</li>
          </ul>
          <h5>输出结果</h5>
          <ul>
            <li>展示工单的BOM物料清单详情。</li>
          </ul>
        </>
      ),
    },
  ];

  const dataRequirementsSections = [
    {
      id: 'production-order',
      title: '3.1 生产工单 (ProductionOrder)',
      content: (
        <>
          <h4>生产工单 (ProductionOrder)</h4>
          <ul>
            <li><strong>数据字段</strong>:
              <ul>
                <li><code>id</code>: string (系统内部唯一标识符，UUID)</li>
                <li><code>orderType</code>: string (工单类别，例如 '标准工单', '返工工单')</li>
                <li><code>orderNumber</code>: string (工单号，系统自动生成)</li>
                <li><code>planName</code>: string (计划名称)</li>
                <li><code>productType</code>: string (产品类型，例如 '氮化镓外延片')</li>
                <li><code>targetQuantity</code>: number (目标生产数量)</li>
                <li><code>currentProgress</code>: number (当前生产进度)</li>
                <li><code>startProcessStationCode</code>: string (起始加工站点编码，可选)</li>
                <li><code>endProcessStationCode</code>: string (结束加工站点编码，可选)</li>
                <li><code>startDate</code>: Date (计划开始日期)</li>
                <li><code>endDate</code>: Date (计划结束日期)</li>
                <li><code>status</code>: enum ('planned', 'in-progress', 'completed', 'delayed')</li>
                <li><code>priority</code>: enum ('high', 'medium', 'low')</li>
                <li><code>assignedOperator</code>: string (指派的操作员)</li>
                <li><code>notes</code>: string (备注，可选)</li>
                <li><code>createdAt</code>: Date (创建时间)</li>
                <li><code>updatedAt</code>: Date (最后更新时间)</li>
                <li><code>bomItems</code>: BOMItem[] (关联的BOM物料清单)</li>
              </ul>
            </li>
            <li><strong>数据验证规则</strong>:
              <ul>
                <li><code>orderNumber</code>: 必填，唯一。</li>
                <li><code>productType</code>, <code>targetQuantity</code>, <code>startDate</code>, <code>endDate</code>, <code>assignedOperator</code>: 必填。</li>
                <li><code>targetQuantity</code>: 必须为正整数。</li>
                <li><code>endDate</code>: 必须晚于 <code>startDate</code>。</li>
                <li>返工/代工工单的 <code>startProcessStationCode</code> 和 <code>endProcessStationCode</code> 必填，且结束站点必须在起始站点之后。</li>
              </ul>
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'bom-item',
      title: '3.2 BOM物料项 (BOMItem)',
      content: (
        <>
          <h4>BOM物料项 (BOMItem)</h4>
          <ul>
            <li><strong>数据字段</strong>:
              <ul>
                <li><code>id</code>: string (唯一标识符)</li>
                <li><code>materialCode</code>: string (物料编码)</li>
                <li><code>materialName</code>: string (物料名称)</li>
                <li><code>specification</code>: string (规格)</li>
                <li><code>unit</code>: string (单位)</li>
                <li><code>requiredQuantity</code>: number (所需数量)</li>
                <li><code>stockQuantity</code>: number (库存数量)</li>
                <li><code>supplier</code>: string (供应商)</li>
                <li><code>unitPrice</code>: number (单价)</li>
                <li><code>notes</code>: string (备注，可选)</li>
                <li><code>processStationCode</code>: string (关联工艺站点编码)</li>
              </ul>
            </li>
            <li><strong>数据验证规则</strong>:
              <ul>
                <li><code>materialCode</code>, <code>materialName</code>, <code>unit</code>, <code>requiredQuantity</code>, <code>unitPrice</code>: 必填。</li>
                <li><code>requiredQuantity</code>, <code>unitPrice</code>: 必须为正数。</li>
              </ul>
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'material-picking-request',
      title: '3.3 物料领用申请 (MaterialPickingRequest)',
      content: (
        <>
          <h4>物料领用申请 (MaterialPickingRequest)</h4>
          <ul>
            <li><strong>数据字段</strong>:
              <ul>
                <li><code>id</code>: string (唯一标识符)</li>
                <li><code>workOrderId</code>: string (关联工单ID)</li>
                <li><code>workOrderNumber</code>: string (关联工单号)</li>
                <li><code>requestDate</code>: Date (申请日期)</li>
                <li><code>requestedBy</code>: string (申请人)</li>
                <li><code>status</code>: enum ('pending', 'approved', 'rejected', 'completed')</li>
                <li><code>bomItems</code>: BOMPickingItem[] (领用物料项列表)</li>
                <li><code>totalAmount</code>: number (总金额)</li>
                <li><code>notes</code>: string (备注，可选)</li>
                <li><code>approvedBy</code>: string (审批人，可选)</li>
                <li><code>approvedDate</code>: Date (审批日期，可选)</li>
                <li><code>createdAt</code>: Date (创建时间)</li>
                <li><code>updatedAt</code>: Date (最后更新时间)</li>
              </ul>
            </li>
            <li><strong>数据验证规则</strong>:
              <ul>
                <li><code>workOrderId</code>, <code>requestedBy</code>, <code>bomItems</code>: 必填。</li>
                <li><code>bomItems</code> 中的 <code>pickingQuantity</code> 必须大于0。</li>
              </ul>
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'material-feeding-record',
      title: '3.4 物料投料记录 (MaterialFeedingRecord)',
      content: (
        <>
          <h4>物料投料记录 (MaterialFeedingRecord)</h4>
          <ul>
            <li><strong>数据字段</strong>:
              <ul>
                <li><code>id</code>: string (唯一标识符)</li>
                <li><code>workOrderId</code>: string (关联工单ID)</li>
                <li><code>workOrderNumber</code>: string (关联工单号)</li>
                <li><code>lotId</code>: string (生产批次号)</li>
                <li><code>feedingDate</code>: Date (投料日期)</li>
                <li><code>operator</code>: string (操作员)</li>
                <li><code>materials</code>: FeedingMaterial[] (投料物料列表)</li>
                <li><code>notes</code>: string (备注，可选)</li>
                <li><code>createdAt</code>: Date (创建时间)</li>
                <li><code>updatedAt</code>: Date (最后更新时间)</li>
              </ul>
            </li>
            <li><strong>数据验证规则</strong>:
              <ul>
                <li><code>workOrderId</code>, <code>lotId</code>, <code>feedingDate</code>, <code>operator</code>, <code>materials</code>: 必填。</li>
                <li><code>materials</code> 中的 <code>feedingQuantity</code> 必须大于0。</li>
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
              <h2 className="text-xl font-bold text-gray-900">生产工单模块功能说明文档</h2>
              <p className="text-sm text-gray-600 mt-1">文档版本: 1.0 | 创建日期: 2025年11月20日</p>
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
          {/* 主标签页导航 */}
          <div className="flex border-b border-gray-200 mb-4 overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => setActiveMainTab('overview')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2
                ${activeMainTab === 'overview'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-700 hover:text-blue-700 hover:border-gray-300 border-transparent'
                }`}
            >
              1. 模块概述
            </button>
            <button
              onClick={() => setActiveMainTab('functional-requirements')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2
                ${activeMainTab === 'functional-requirements'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-700 hover:text-blue-700 hover:border-gray-300 border-transparent'
                }`}
            >
              2. 功能需求清单
            </button>
            <button
              onClick={() => setActiveMainTab('data-requirements')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2
                ${activeMainTab === 'data-requirements'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-700 hover:text-blue-700 hover:border-gray-300 border-transparent'
                }`}
            >
              3. 数据需求
            </button>
          </div>

          {activeMainTab === 'overview' && (
            <>
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
            </>
          )}

          {activeMainTab === 'functional-requirements' && (
            <>
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
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{functionalRequirements.find(req => req.id === activeFRTab)?.title}</h4>
                {functionalRequirements.find(req => req.id === activeFRTab)?.content}
              </div>
            </>
          )}

          {activeMainTab === 'data-requirements' && (
            <>
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
            </>
          )}
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