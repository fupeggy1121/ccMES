// src/components/Auxiliary/AssignAuxiliaryModal.tsx
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  message,
} from 'antd';
import { ScanOutlined } from '@ant-design/icons';

// 定义辅料对象接口
export interface AuxiliaryMaterial {
  id: string;
  equipmentId: string;
  auxiliaryId: string;
  auxiliaryCode: string;
  auxiliaryName: string;
  instanceUniqueCode?: string;
  auxiliaryBatch?: string;
}

// 定义模态框属性接口
export interface AssignAuxiliaryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (id: string, instanceUniqueCode: string, auxiliaryBatch: string) => void;
  auxiliaryMaterial: AuxiliaryMaterial | null;
}

export const AssignAuxiliaryModal: React.FC<AssignAuxiliaryModalProps> = ({
  visible,
  onClose,
  onSubmit,
  auxiliaryMaterial,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 当模态框显示或辅料对象变化时，重置表单
  useEffect(() => {
    if (visible && auxiliaryMaterial) {
      form.setFieldsValue({
        equipmentId: auxiliaryMaterial.equipmentId,
        auxiliaryId: auxiliaryMaterial.auxiliaryId,
        auxiliaryCode: auxiliaryMaterial.auxiliaryCode,
        auxiliaryName: auxiliaryMaterial.auxiliaryName,
        instanceUniqueCode: auxiliaryMaterial.instanceUniqueCode || '',
        auxiliaryBatch: auxiliaryMaterial.auxiliaryBatch || '',
      });
    }
  }, [visible, auxiliaryMaterial, form]);

  // 处理扫码操作
  const handleScan = () => {
    // 模拟生成随机的 instanceUniqueCode
    const randomCode = `SCAN_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    form.setFieldsValue({ instanceUniqueCode: randomCode });
    message.success('扫码成功！');
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      if (!auxiliaryMaterial) {
        message.error('辅料信息不存在');
        return;
      }

      // 调用父组件提交函数，传递 auxiliaryMaterial.id
      onSubmit(
        auxiliaryMaterial.id,
        values.instanceUniqueCode,
        values.auxiliaryBatch
      );
      
      message.success('分配辅料成功！');
      handleClose();
    } catch (error) {
      console.error('表单验证失败:', error);
      message.error('请填写完整信息');
    } finally {
      setLoading(false);
    }
  };

  // 处理模态框关闭
  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="分配辅料"
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          确定分配
        </Button>,
      ]}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item label="设备ID" name="equipmentId">
          <Input readOnly />
        </Form.Item>

        <Form.Item label="辅料ID" name="auxiliaryId">
          <Input readOnly />
        </Form.Item>

        <Form.Item label="辅料编码" name="auxiliaryCode">
          <Input readOnly />
        </Form.Item>

        <Form.Item label="辅料名称" name="auxiliaryName">
          <Input readOnly />
        </Form.Item>

        <Form.Item
          label="辅料唯一码"
          name="instanceUniqueCode"
          rules={[{ required: false, message: '请输入辅料唯一码' }]}
        >
          <Input
            placeholder="请扫描或输入辅料唯一码"
            addonAfter={
              <Button
                type="link"
                icon={<ScanOutlined />}
                onClick={handleScan}
                style={{ padding: 0, border: 'none' }}
              >
                扫码
              </Button>
            }
          />
        </Form.Item>

        <Form.Item
          label="辅料批次号"
          name="auxiliaryBatch"
          rules={[{ required: false, message: '请输入辅料批次号' }]}
        >
          <Input placeholder="请输入辅料批次号" />
        </Form.Item>
      </Form>
    </Modal>
  );
}; 