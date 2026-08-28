import { WorkOrder } from '../types/workOrder';
import { mockWorkOrders } from '../data/mockData';

// 内存单例，风格对齐 mockBatchService：种子数据浅拷贝成可变数组
let _workOrders: WorkOrder[] = mockWorkOrders.map(w => ({ ...w }));
let _seq = 0;

export const workOrderService = {
  /** 查询全部工单（含种子数据与运行期新建的） */
  listWorkOrders(): WorkOrder[] {
    return [..._workOrders];
  },

  /** 预生成一个工单ID（不落库），供调用方在真正创建工单对象之前就拿到ID去关联别的记录 */
  generateId(): string {
    _seq += 1;
    return `OCAP-AUTO-${Date.now()}-${_seq}`;
  },

  /** 用指定ID创建一张工单，默认状态为处理中、无当前处理人、无处理阶段 */
  createWorkOrder(
    input: {
      name: string;
      batchNumber: string;
      equipment: string;
      productModel: string;
      exceptionType: string;
      description: string;
      submitter: string;
    },
    id: string
  ): WorkOrder {
    const workOrder: WorkOrder = {
      id,
      name: input.name,
      batchNumber: input.batchNumber,
      equipment: input.equipment,
      productModel: input.productModel,
      exceptionType: input.exceptionType,
      description: input.description,
      status: 'processing',
      submitter: input.submitter,
      createdAt: new Date().toISOString(),
      currentStage: 0,
      currentAssignee: null,
      stages: [],
    };
    _workOrders.push(workOrder);
    return workOrder;
  },

  /** 仅供测试使用：重置模块内内存状态 */
  __resetForTests(): void {
    _workOrders = mockWorkOrders.map(w => ({ ...w }));
    _seq = 0;
  },
};
