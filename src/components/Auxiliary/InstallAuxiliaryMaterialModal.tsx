// src/components/Auxiliary/InstallAuxiliaryMaterialModal.tsx
import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, Space, message } from 'antd';
import { ScanOutlined } from '@ant-design/icons';
import { X, Package } from 'lucide-react';
import { AuxiliaryMaterial } from '../../types';

interface InstallAuxiliaryMaterialModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (auxiliaryId: string, instanceUniqueCode: string, auxiliaryBatch: string) => void;
  auxiliaryMaterial: AuxiliaryMaterial;
}

// src/components/Auxiliary/InstallAuxiliaryMaterialModal.tsx

// ... (其他导入和接口定义)

export const InstallAuxiliaryMaterialModal: React.FC<InstallAuxiliaryMaterialModalProps> = ({
  visible,
  onClose,
  onSubmit,
  auxiliaryMaterial,
}) => {
  const [form] = Form.useForm();
  const [isAssigned, setIsAssigned] = useState(false);

  // 动态判断是否已分配
  useEffect(() => {
    const assigned = !!(auxiliaryMaterial.instanceUniqueCode && auxiliaryMaterial.auxiliaryBatch);
    setIsAssigned(assigned);
  }, [auxiliaryMaterial]);

  // 初始值填充
  useEffect(() => {
    if (visible && auxiliaryMaterial) {
      form.setFieldsValue({
        equipmentId: auxiliaryMaterial.equipmentId || '未分配',
        auxiliaryId: auxiliaryMaterial.auxiliaryId, // 新增：辅料ID
        auxiliaryCode: auxiliaryMaterial.auxiliaryCode, // 新增：辅料编码
        auxiliaryName: auxiliaryMaterial.auxiliaryName,
        auxiliaryBatch: auxiliaryMaterial.auxiliaryBatch || '',
        instanceUniqueCode: auxiliaryMaterial.instanceUniqueCode || '',
      });
    }
  }, [visible, auxiliaryMaterial, form]);

  const handleScan = () => {
    // 模拟扫码功能，生成随机值
    const randomCode = `INST_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    form.setFieldsValue({ instanceUniqueCode: randomCode });
    message.success('扫码成功');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(auxiliaryMaterial.id, values.instanceUniqueCode, values.auxiliaryBatch);
      handleClose();
      message.success('安装成功');
    } catch (error) {
      message.error('表单验证失败，请检查输入');
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={handleClose}
      footer={null}
      closable={false}
      width={480}
      className="install-auxiliary-modal"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <Package className="w-6 h-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">安装辅料</h2>
            <p className="text-sm text-gray-600 mt-1">确认安装辅料到设备</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <Form
        form={form}
        layout="vertical"
        className="p-6"
      >
        {/* 设备ID - 只读展示 */}
        <Form.Item
          label="设备ID"
          name="equipmentId"
        >
          <Input readOnly className="bg-gray-50" />
        </Form.Item>

        {/* 辅料ID - 只读展示 */}
        <Form.Item
          label="辅料ID"
          name="auxiliaryId"
        >
          <Input readOnly className="bg-gray-50" />
        </Form.Item>

        {/* 辅料编码 - 只读展示 */}
        <Form.Item
          label="辅料编码"
          name="auxiliaryCode"
        >
          <Input readOnly className="bg-gray-50" />
        </Form.Item>

        {/* 辅料名称 - 只读展示 */}
        <Form.Item
          label="辅料名称"
          name="auxiliaryName"
        >
          <Input readOnly className="bg-gray-50" />
        </Form.Item>

        {/* 实例唯一码 - 动态只读，带扫码功能 */}
        <Form.Item
          label="实例唯一码"
          name="instanceUniqueCode"
          rules={[{ required: true, message: '请输入实例唯一码' }]}
        >
          <Input
            readOnly={isAssigned}
            placeholder={isAssigned ? '' : '请输入或扫码获取实例唯一码'}
            className={isAssigned ? 'bg-gray-50' : ''}
            suffix={
              !isAssigned && (
                <Button
                  type="text"
                  icon={<ScanOutlined />}
                  onClick={handleScan}
                  className="text-blue-600"
                >
                  扫码
                </Button>
              )
            }
          />
        </Form.Item>

        {/* 辅料批号 - 动态只读 */}
        <Form.Item
          label="辅料批号"
          name="auxiliaryBatch"
          rules={[{ required: true, message: '请输入辅料批号' }]}
        >
          <Input
            readOnly={isAssigned}
            placeholder={isAssigned ? '' : '请输入辅料批号'}
            className={isAssigned ? 'bg-gray-50' : ''}
          />
        </Form.Item>

        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            确认要将此辅料安装到设备吗？安装后辅料状态将变为已安装。
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button onClick={handleClose} className="px-4 py-2">
            取消
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700"
          >
            确认安装
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
