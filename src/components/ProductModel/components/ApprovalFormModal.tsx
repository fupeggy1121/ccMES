import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Input, Descriptions, Tag, Table } from 'antd';
import moment from 'moment';
import { Product, ProductStatus, SubProcessConfig, Station } from '../types/Product';

const { TextArea } = Input;

interface ApprovalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    submitter: string;
    submitTime: string;
    status: string;
    productDetails: Product;
    originalProductDetails: Product;
  };
  onConfirm: (taskId: string, action: 'approve' | 'reject', reason?: string) => void;
}

const ApprovalFormModal: React.FC<ApprovalFormModalProps> = ({
  isOpen,
  onClose,
  task,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [internalAction, setInternalAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
      setInternalAction(null);
    }
  }, [isOpen, form]);

  const handleOk = async (action: 'approve' | 'reject') => {
    setInternalAction(action);
    setLoading(true);
    
    try {
      let values = {};
      if (action === 'reject') {
        values = await form.validateFields();
      }
      await onConfirm(task.id, action, (values as { reason?: string }).reason);
      setLoading(false);
      onClose();
    } catch (error) {
      setLoading(false);
      console.error('Validation failed:', error);
    }
  };

  // 渲染站点表格（只读）
  const renderStationTable = (stations: Station[] | undefined) => {
    if (!stations || stations.length === 0) {
      return <div className="text-gray-400 italic py-2">无站点配置</div>;
    }

    const columns = [
      {
        title: '站点名称',
        dataIndex: 'stationName',
        key: 'name',
      },
      {
        title: '设备组',
        dataIndex: 'equipmentGroup',
        key: 'equipmentGroup',
      },
      {
        title: '配方',
        dataIndex: 'recipe',
        key: 'recipe',
      },
      {
        title: '量测参数',
        dataIndex: 'measureParamCount',
        key: 'measureParamCount',
        render: (count: number) => count > 0 ? `${count}个` : '-'
      },
      {
        title: '工艺参数',
        dataIndex: 'processParamCount',
        key: 'processParamCount',
        render: (count: number) => `${count}个`
      },
      {
        title: 'SPC管控',
        dataIndex: 'spcParamCount',
        key: 'spcParamCount',
        render: (count: number) => count > 0 ? `${count}个` : '-'
      },
      {
        title: '备注',
        dataIndex: 'remarkCount',
        key: 'remarkCount',
        render: (count: number) => count > 0 ? `${count}条` : '-'
      },
    ];

    return (
      <Table 
        columns={columns}
        dataSource={stations}
        rowKey="stationName"
        pagination={false}
        size="small"
        bordered
        className="mt-2 mb-4"
      />
    );
  };

  // Helper function to format specification summary
  const formatSpecificationSummary = (product: Product) => {
    const specs = product.specifications;
    if (!specs) return 'N/A';
    return (
      <>
        <Descriptions.Item label="型号">{specs.type || '-'}</Descriptions.Item>
        <Descriptions.Item label="厚度倍数">{specs.thicknessMultiplier || '-'}</Descriptions.Item>
        <Descriptions.Item label="背封">{specs.backSeal || '-'}</Descriptions.Item>
        <Descriptions.Item label="晶向">{specs.crystal || '-'}</Descriptions.Item>
        <Descriptions.Item label="厚度">{specs.thickness || '-'}</Descriptions.Item>
        <Descriptions.Item label="去边">{specs.method || '-'}</Descriptions.Item>
        <Descriptions.Item label="直径">{specs.diameter || '-'}</Descriptions.Item>
        <Descriptions.Item label="倒角">{specs.chamfer || '-'}</Descriptions.Item>
        <Descriptions.Item label="掺杂剂">{specs.dopant || '-'}</Descriptions.Item>
        <Descriptions.Item label="清洗或腐蚀方式">{specs.cleaningMethod || '-'}</Descriptions.Item>
        <Descriptions.Item label="参考面">{specs.referenceSurface || '-'}</Descriptions.Item>
        <Descriptions.Item label="喷砂">{specs.polishing || '-'}</Descriptions.Item>
      </>
    );
  };

  // Helper to render a Descriptions.Item with comparison and highlighting
  const renderComparedItem = (label: string, originalValue: any, revisedValue: any) => {
    // Handle undefined/null values for comparison and display
    const originalDisplay = originalValue !== undefined && originalValue !== null && originalValue !== '' ? String(originalValue) : '-';
    const revisedDisplay = revisedValue !== undefined && revisedValue !== null && revisedValue !== '' ? String(revisedValue) : '-';

    const isChanged = originalDisplay !== revisedDisplay;

    return (
      <Descriptions.Item label={label} key={label}>
        {isChanged ? (
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs">原: {originalDisplay}</span>
            <span className="changed-field">新: {revisedDisplay}</span>
          </div>
        ) : (
          <span>{revisedDisplay}</span>
        )}
      </Descriptions.Item>
    );
  };

  // 格式化子工艺路径为逗号分隔的字符串
  const formatSubProcessConfigs = (configs: SubProcessConfig[] | undefined) => {
    if (!configs || configs.length === 0) return '-';
    return configs.map(config => config.path).join(', ');
  };

  // Helper for specifications comparison
  const renderComparedSpecifications = (originalSpecs: Product['specifications'], revisedSpecs: Product['specifications']) => {
    const specFields: Array<{ key: keyof Product['specifications'], label: string }> = [
      { key: 'type', label: '型号' },
      { key: 'thicknessMultiplier', label: '厚度倍数' },
      { key: 'backSeal', label: '背封' },
      { key: 'crystal', label: '晶向' },
      { key: 'thickness', label: '厚度' },
      { key: 'method', label: '去边' },
    ];

    return specFields.map(field => 
      renderComparedItem(field.label, originalSpecs?.[field.key], revisedSpecs?.[field.key])
    );
  };

  const renderComparedSubProcessConfigs = (originalConfigs: SubProcessConfig[] | undefined, revisedConfigs: SubProcessConfig[] | undefined) => {
    const originalFormatted = formatSubProcessConfigs(originalConfigs);
    const revisedFormatted = formatSubProcessConfigs(revisedConfigs);
    return renderComparedItem("工艺子路径", originalFormatted, revisedFormatted);
  };

  if (!task) return null;

  const product = task.productDetails;
  const originalProduct = task.originalProductDetails;

  return (
    <Modal
      title={<span className="text-xl font-semibold">审批工单</span>}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="reject"
          danger
          loading={loading}
          onClick={() => handleOk('reject')}
        >
          驳回
        </Button>,
        <Button
          key="approve"
          type="primary"
          loading={loading}
          onClick={() => handleOk('approve')}
        >
          通过
        </Button>,
      ]}
      width={1200}
    >
      <Form form={form} layout="vertical">
        {/* 基本信息 */}
        <h3 className="text-base font-semibold text-gray-900 mb-4">修订内容对比</h3>
        <h4 className="text-sm font-medium text-gray-700 mb-2">基本信息</h4>
        <Descriptions bordered column={2} size="small" style={{ marginBottom: 20 }}>
          {renderComparedItem("产品编号", originalProduct.productCode, product.productCode)}
          {renderComparedItem("产品名称", originalProduct.productName, product.productName)}
          {renderComparedItem("产品大类", originalProduct.productCategory, product.productCategory)}
          {renderComparedItem("产品大类版本", originalProduct.productCategoryVersion, product.productCategoryVersion)}
          {renderComparedItem("产品类型", originalProduct.productType, product.productType)}
          {renderComparedItem("客户名称", originalProduct.customerName, product.customerName)}
          {renderComparedItem("描述", originalProduct.description, product.description)}
        </Descriptions>

        {/* 产品规格参数 */}
        <h4 className="text-sm font-medium text-gray-700 mb-2">产品规格参数</h4>
        <Descriptions bordered column={2} size="small" style={{ marginBottom: 20 }}>
          {renderComparedSpecifications(originalProduct.specifications, product.specifications)}
        </Descriptions>

        {/* 工艺配置 */}
        <h4 className="text-sm font-medium text-gray-700 mb-2">工艺配置</h4>
        <Descriptions bordered column={2} size="small" style={{ marginBottom: 20 }}>
          {renderComparedItem("工艺主路径", originalProduct.mainProcessPath, product.mainProcessPath)}
          {renderComparedSubProcessConfigs(originalProduct.subProcessConfigs, product.subProcessConfigs)}
        </Descriptions>

        {/* 主路径站点配置 */}
        <h4 className="text-sm font-medium text-gray-700 mb-2">主路径站点配置</h4>
        {renderStationTable(product.processStations)}

        {/* 子路径配置 */}
        {product.subProcessConfigs && product.subProcessConfigs.length > 0 && (
          <>
            <h4 className="text-sm font-medium text-gray-700 mb-2">工艺子路径配置</h4>
            {product.subProcessConfigs.map((config, index) => (
              <div key={index} className="mb-6">
                <div className="font-medium text-gray-700 mb-1">子路径: {config.path}</div>
                <div className="text-sm text-gray-600 mb-2">站点配置:</div>
                {renderStationTable(config.stations)}
              </div>
            ))}
          </>
        )}

        {/* 审批信息 */}
        <h4 className="text-sm font-medium text-gray-700 mb-2">审批信息</h4>
        <Descriptions bordered column={2} size="small" style={{ marginBottom: 20 }}>
          <Descriptions.Item label="提交人">{task.submitter || '-'}</Descriptions.Item>
          <Descriptions.Item label="提交时间">{moment(task.submitTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="当前状态">
            <Tag color={task.status === 'PENDING' ? 'processing' : 'default'}>
              {task.status === 'PENDING' ? '待审批' : '未知'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        {internalAction === 'reject' && (
          <Form.Item
            label="驳回原因"
            name="reason"
            rules={[{ required: true, message: '请填写驳回原因' }]}
          >
            <TextArea rows={4} placeholder="请输入详细的驳回原因..." />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default ApprovalFormModal;