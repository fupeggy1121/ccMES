import React, { useState } from 'react';
import { 
  Tabs, 
  Descriptions, 
  Table, 
  Tag, 
  Button, 
  message,
  Collapse 
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  HistoryOutlined 
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { Panel } = Collapse;

// 产品模型详情页组件
const ProductModelDetail = ({ product, currentUser }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);

  // 审批动作处理器
  const handleApprove = async () => {
    setLoading(true);
    try {
      // 这里调用审批API
      // await approveProduct(product.id);
      message.success('审批通过成功');
      // 通常这里会刷新数据
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      // 这里调用驳回API
      // await rejectProduct(product.id);
      message.success('已驳回');
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 渲染操作按钮
  const renderActionButtons = () => {
    const isApprover = currentUser.roles.includes('APPROVER');
    const canOperate = product.status === 'PENDING_APPROVAL';

    if (isApprover && canOperate) {
      return (
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />}
            onClick={handleApprove}
            loading={loading}
            style={{ marginRight: 8 }}
          >
            通过
          </Button>
          <Button 
            danger
            icon={<CloseCircleOutlined />}
            onClick={handleReject}
            loading={loading}
          >
            驳回
          </Button>
        </div>
      );
    }
    return null;
  };

  // 审批历史列定义
  const approvalColumns = [
    {
      title: '操作时间',
      dataIndex: 'operateTime',
      key: 'operateTime',
      width: 180,
    },
    {
      title: '审批人',
      dataIndex: 'approver',
      key: 'approver',
      render: approver => approver.name,
    },
    {
      title: '动作',
      dataIndex: 'action',
      key: 'action',
      render: action => (
        <Tag color={action === 'APPROVE' ? 'success' : action === 'REJECT' ? 'error' : 'processing'}>
          {action === 'SUBMIT' ? '提交' : action === 'APPROVE' ? '通过' : '驳回'}
        </Tag>
      ),
    },
    {
      title: '状态流转',
      key: 'statusFlow',
      render: (_, record) => (
        <span>
          <Tag>{record.fromStatus}</Tag> 
          → 
          <Tag color="blue">{record.toStatus}</Tag>
        </span>
      ),
    },
    {
      title: '审批意见',
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: true,
    },
  ];

  // 状态标签映射
  const statusTagMap = {
    DRAFT: { color: 'default', text: '草稿' },
    PENDING_APPROVAL: { color: 'processing', text: '待审批' },
    APPROVED: { color: 'success', text: '已批准' },
    REJECTED: { color: 'error', text: '已驳回' },
  };

  return (
    <div className="product-model-detail">
      {/* 状态标识 */}
      <div style={{ marginBottom: 16 }}>
        <Tag color={statusTagMap[product.status].color}>
          {statusTagMap[product.status].text}
        </Tag>
      </div>

      {/* 操作按钮 */}
      {renderActionButtons()}

      {/* 主内容区 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="基本信息" key="basic">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="型号ID">{product.id}</Descriptions.Item>
            <Descriptions.Item label="型号名称">{product.name}</Descriptions.Item>
            <Descriptions.Item label="产品编码">{product.code}</Descriptions.Item>
            <Descriptions.Item label="分类">{product.category}</Descriptions.Item>
            <Descriptions.Item label="创建人">{product.creator}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{product.createTime}</Descriptions.Item>
            <Descriptions.Item label="最后更新时间">{product.updateTime}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusTagMap[product.status].color}>
                {statusTagMap[product.status].text}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          {/* 规格参数 - 使用折叠面板 */}
          <Collapse style={{ marginTop: 24 }}>
            <Panel header="规格参数" key="specs">
              <Descriptions bordered column={2}>
                {Object.entries(product.specifications).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {value}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Panel>
          </Collapse>

          {/* 工艺配置 */}
          <Collapse style={{ marginTop: 16 }}>
            <Panel header="工艺配置" key="process">
              <Descriptions bordered column={2}>
                {Object.entries(product.processConfig).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {value}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Panel>
          </Collapse>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <HistoryOutlined />
              审批历史
            </span>
          } 
          key="approval"
        >
          <Table
            dataSource={product.approvalRecords}
            columns={approvalColumns}
            rowKey="id"
            pagination={false}
            scroll={{ y: 400 }}
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

// 使用示例
// const product = {
//   id: 'PM-2023-001',
//   name: '高端智能手表',
//   code: 'GX-SMART-WATCH',
//   category: '可穿戴设备',
//   creator: '张三',
//   createTime: '2023-06-01 10:30:00',
//   updateTime: '2023-06-15 14:22:00',
//   status: 'PENDING_APPROVAL',
//   specifications: {
//     '屏幕尺寸': '1.78英寸',
//     '分辨率': '448x368',
//     '电池容量': '450mAh',
//     '防水等级': '5ATM'
//   },
//   processConfig: {
//     '外壳工艺': 'CNC精雕',
//     '表面处理': '陶瓷喷砂',
//     '组装流程': '无尘车间'
//   },
//   approvalRecords: [
//     {
//       id: 1,
//       operateTime: '2023-06-10 09:15:00',
//       approver: { id: 101, name: '李四' },
//       action: 'SUBMIT',
//       fromStatus: 'DRAFT',
//       toStatus: 'PENDING_APPROVAL',
//       comment: '提交审批'
//     },
//     {
//       id: 2,
//       operateTime: '2023-06-12 14:30:00',
//       approver: { id: 102, name: '王五' },
//       action: 'REJECT',
//       fromStatus: 'PENDING_APPROVAL',
//       toStatus: 'REJECTED',
//       comment: '电池容量不符合安全标准'
//     },
//     {
//       id: 3,
//       operateTime: '2023-06-14 11:20:00',
//       approver: { id: 101, name: '李四' },
//       action: 'SUBMIT',
//       fromStatus: 'REJECTED',
//       toStatus: 'PENDING_APPROVAL',
//       comment: '已修改电池规格，重新提交'
//     }
//   ]
// };

// const currentUser = {
//   id: 102,
//   name: '王五',
//   roles: ['APPROVER', 'DESIGNER']
// };

// <ProductModelDetail product={product} currentUser={currentUser} />

export default ProductModelDetail;