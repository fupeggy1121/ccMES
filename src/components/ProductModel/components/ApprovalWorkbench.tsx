import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Modal, Form, DatePicker, message, Tabs, Tag } from 'antd';
import { SearchOutlined, EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import moment from 'moment';
import api from '../api';
import { Product, ProductStatus } from '../types/Product'; // Import Product and ProductStatus types
import ApprovalFormModal from './ApprovalFormModal'; // Import the new ApprovalFormModal

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { TabPane } = Tabs;

// Helper function to format specification summary
const formatSpecificationSummary = (product: Product) => {
  const specs = product.specifications;
  if (!specs) return 'N/A';
  return `型号:${specs.type || '-'} 晶向:${specs.crystal || '-'} 直径:${specs.diameter || '-'} 厚度:${specs.thickness || '-'} 掺杂剂:${specs.dopant || '-'}`;
};

// Helper function to format sub process paths
const formatSubProcessPaths = (product: Product) => {
  if (!product.subProcessConfigs || product.subProcessConfigs.length === 0) return '-';
  return product.subProcessConfigs.map(config => config.path).join(', ');
};

const ApprovalWorkbench = () => {
  const [tasks, setTasks] = useState<any[]>([]); // Use any[] for now as tasks will be enriched
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});

  // State for the new ApprovalFormModal
  const [isApprovalFormModalVisible, setIsApprovalFormModalVisible] = useState(false);
  const [currentApprovalTaskDetails, setCurrentApprovalTaskDetails] = useState<any>(null);
  const [approvalActionType, setApprovalActionType] = useState<'approve' | 'reject' | null>(null);

  // 新增状态
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' 或 'completed'
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [completedPagination, setCompletedPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [completedFilters, setCompletedFilters] = useState({});

  // 获取待审批任务
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters
      };

      const response = await api.approval.getPendingTasks(params);
      // 移除此处对 mockProducts 的依赖，因为 api.approval.getPendingTasks 已经返回了 enrichedTasks
      setTasks(response.data.items);
      setPagination({
        ...pagination,
        total: response.data.totalCount
      });
    } catch (error) {
      message.error('获取审批任务失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取已完成审批任务
  const fetchCompletedTasks = async () => {
    setCompletedLoading(true);
    try {
      const params = {
        page: completedPagination.current,
        pageSize: completedPagination.pageSize,
        ...completedFilters
      };
      const response = await api.approval.getCompletedTasks(params);
      setCompletedTasks(response.data.items);
      setCompletedPagination({
        ...completedPagination,
        total: response.data.totalCount
      });
    } catch (error) {
      message.error('获取已完成审批任务失败');
    } finally {
      setCompletedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchTasks();
    } else {
      fetchCompletedTasks();
    }
  }, [pagination.current, pagination.pageSize, filters, completedPagination.current, completedPagination.pageSize, completedFilters, activeTab]);

  // 处理表格变化（分页、筛选）
  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  // 处理筛选搜索
  const handleSearch = (values: any) => {
    const newFilters: any = {};

    if (values.productId) newFilters.productId = values.productId;
    if (values.productName) newFilters.productName = values.productName;
    if (values.submitter) newFilters.submitter = values.submitter;
    if (values.submitTime) {
      newFilters.startTime = values.submitTime[0].format('YYYY-MM-DD');
      newFilters.endTime = values.submitTime[1].format('YYYY-MM-DD');
    }

    setFilters(newFilters);
    setPagination({ ...pagination, current: 1 });
  };

  // 处理已完成任务表格变化
  const handleCompletedTableChange = (newPagination: any) => {
    setCompletedPagination(newPagination);
  };

  // 处理已完成任务筛选搜索
  const handleCompletedSearch = (values: any) => {
    const newFilters: any = {};
    if (values.productId) newFilters.productId = values.productId;
    if (values.productName) newFilters.productName = values.productName;
    if (values.submitTime) {
      newFilters.submitStartTime = values.submitTime[0].format('YYYY-MM-DD');
      newFilters.submitEndTime = values.submitTime[1].format('YYYY-MM-DD');
    }
    if (values.approvalTime) {
      newFilters.approvalStartTime = values.approvalTime[0].format('YYYY-MM-DD');
      newFilters.approvalEndTime = values.approvalTime[1].format('YYYY-MM-DD');
    }
    setCompletedFilters(newFilters);
    setCompletedPagination({ ...completedPagination, current: 1 });
  };

  // Open approval form modal
  const openApprovalFormModal = (task: any, type: 'approve' | 'reject') => {
    setCurrentApprovalTaskDetails(task);
    setApprovalActionType(type);
    setIsApprovalFormModalVisible(true);
  };

  // Handle confirmation from ApprovalFormModal
  const handleApprovalConfirm = async (taskId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      if (action === 'approve') {
        await api.approval.approveTask(taskId);
        message.success('审批已通过');
      } else {
        await api.approval.rejectTask(taskId, reason || '');
        message.success('已驳回申请');
      }
      setIsApprovalFormModalVisible(false);
      setCurrentApprovalTaskDetails(null);
      fetchTasks(); // Refresh list
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 查看详情
  const viewDetails = (taskId: string) => {
    // 实际项目中这里应使用路由导航
    window.location.href = `/products/${taskId}?mode=readonly`;
  };

  // 表格列定义
  const columns = [
    {
      title: '审批工单编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '产品编号',
      dataIndex: 'productId',
      key: 'productId',
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '审批状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ProductStatus) => (
        <span style={{ color: status === 'PENDING' ? '#faad14' : '#52c41a' }}>
          {status === 'PENDING' ? '待审批' : '已处理'}
        </span>
      ),
    },
    {
      title: '提交人',
      dataIndex: 'submitter',
      key: 'submitter',
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      key: 'submitTime',
      render: (text: string) => moment(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<CheckOutlined />}
            onClick={() => openApprovalFormModal(record, null)}
          >
            审批
          </Button>
        </Space>
      ),
    },
  ];

  // 已完成审批任务表格列定义
  const completedColumns = [
    {
      title: '审批工单编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '产品编号',
      dataIndex: 'productId',
      key: 'productId',
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '工单状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'APPROVED' ? 'success' : 'error'}>
          {status === 'APPROVED' ? '通过' : '拒绝'}
        </Tag>
      ),
    },
    {
      title: '提交人',
      dataIndex: 'submitter',
      key: 'submitter',
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      key: 'submitTime',
      render: (text: string) => moment(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '审批人',
      dataIndex: 'approver',
      key: 'approver',
    },
    {
      title: '审批时间',
      dataIndex: 'approvalTime',
      key: 'approvalTime',
      render: (text: string) => moment(text).format('YYYY-MM-DD HH:mm'),
    },
  ];

  // 搜索表单
  const SearchForm = () => (
    <Form layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
      <Form.Item name="productId" label="产品编号">
        <Input placeholder="请输入产品编号" />
      </Form.Item>

      <Form.Item name="productName" label="产品名称">
        <Input placeholder="请输入产品名称" />
      </Form.Item>

      <Form.Item name="submitter" label="提交人">
        <Input placeholder="请输入提交人姓名" />
      </Form.Item>

      <Form.Item name="submitTime" label="提交时间">
        <RangePicker showTime />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
          搜索
        </Button>
      </Form.Item>
    </Form>
  );

  // 已完成任务搜索表单
  const CompletedSearchForm = () => (
    <Form layout="inline" onFinish={handleCompletedSearch} style={{ marginBottom: 16 }}>
      <Form.Item name="productId" label="产品编号">
        <Input placeholder="请输入产品编号" />
      </Form.Item>

      <Form.Item name="productName" label="产品名称">
        <Input placeholder="请输入产品名称" />
      </Form.Item>

      <Form.Item name="submitTime" label="提交时间范围">
        <RangePicker showTime />
      </Form.Item>

      <Form.Item name="approvalTime" label="审批时间范围">
        <RangePicker showTime />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
          搜索
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div className="approval-workbench">

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="待审批任务" key="pending">
          {/* 待审批任务搜索区域 */}
          <SearchForm />

          {/* 待审批任务列表 */}
          <Table
            columns={columns}
            dataSource={tasks}
            rowKey="id"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
          />
        </TabPane>
        <TabPane tab="已完成审批任务" key="completed">
          {/* 已完成任务搜索区域 */}
          <CompletedSearchForm />

          {/* 已完成任务列表 */}
          <Table
            columns={completedColumns}
            dataSource={completedTasks}
            rowKey="id"
            loading={completedLoading}
            pagination={completedPagination}
            onChange={handleCompletedTableChange}
            scroll={{ x: 'max-content' }}
          />
        </TabPane>
      </Tabs>

      {/* 审批工单模态框 */}
      <ApprovalFormModal
        isOpen={isApprovalFormModalVisible}
        onClose={() => setIsApprovalFormModalVisible(false)}
        task={currentApprovalTaskDetails}
        onConfirm={handleApprovalConfirm}
      />
    </div>
  );
};

export default ApprovalWorkbench;