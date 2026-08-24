// src/components/Auxiliary/LifetimeControlModeling.tsx
import React, { useState } from 'react';
import { Settings, LifeBuoy, Plus, Edit, Trash2, X, Copy } from 'lucide-react';
import { message } from 'antd';
import { useData } from '../../hooks/useData';
import LifetimeControlModelForm from './LifetimeControlModelForm';
import { LifetimeControlModel, Material, Device } from '../../types';

export const LifetimeControlModeling: React.FC = () => {
  const {
    lifetimeControlModels,
    createLifetimeControlModel,
    updateLifetimeControlModel,
    deleteLifetimeControlModel, 
    auxiliaryMaterials 
  } = useData();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<LifetimeControlModel | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyingModelData, setCopyingModelData] = useState<LifetimeControlModel | null>(null);

  // 模拟设备数据
  const mockDevices: Device[] = [
    { id: 'DEV-001', name: '设备A' },
    { id: 'DEV-002', name: '设备B' },
    { id: 'DEV-003', name: '设备C' },
    { id: 'DEV-004', name: '设备D' },
  ];

  const handleCreate = () => {
    setEditingModel(null);
    setIsFormOpen(true);
  };

  const handleEdit = (model: LifetimeControlModel) => {
    setEditingModel(model);
    setIsFormOpen(true);
  };

  const handleDelete = (modelId: string) => {
    if (window.confirm('确定要删除这个寿命管控模型吗？')) {
      deleteLifetimeControlModel(modelId);
    }
  };

  const handleCopy = (model: LifetimeControlModel) => {
    // 排除不需要复制的字段
    const { id, createdAt, updatedAt, ...modelData } = model;
    
    // 为副本添加后缀
    const copyData = {
      ...modelData,
      modelName: `${model.modelName} - 副本`
    };
    
    setCopyingModelData(copyData as LifetimeControlModel);
    setShowCopyModal(true);
    setEditingModel(null);
  };

  const handleFormSubmit = (data: LifetimeControlModel) => {
    if (editingModel) {
      updateLifetimeControlModel(editingModel.id!, data);
    } else {
      createLifetimeControlModel(data);
    }
    setIsFormOpen(false);
    setShowCopyModal(false);
    setCopyingModelData(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setShowCopyModal(false);
    setEditingModel(null);
    setCopyingModelData(null);
  };

  // 从 materialConfigs 获取关联辅料名称
  const getRelatedMaterials = (model: LifetimeControlModel) => {
    if (model.materialConfigs && model.materialConfigs.length > 0) {
      return model.materialConfigs.map(mc => mc.materialName).join(', ');
    }
    // 向后兼容：使用旧字段
    return model.relatedMaterials?.join(', ') || '无';
  };

  // 从 deviceIds 获取关联设备名称
  const getRelatedEquipment = (model: LifetimeControlModel) => {
    if (model.deviceIds && model.deviceIds.length > 0) {
      return model.deviceIds.map(deviceId => {
        const device = mockDevices.find(d => d.id === deviceId);
        return device ? device.name : deviceId;
      }).join(', ');
    }
    // 向后兼容：使用旧字段
    return model.relatedEquipment?.join(', ') || '无';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">寿命管控建模</h2>
          <p className="text-gray-600 mt-1">配置和管理辅料的寿命计算模型</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          创建模型
        </button>
      </div>

      {lifetimeControlModels.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <LifeBuoy className="mx-auto h-12 w-12 text-blue-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">暂无寿命管控模型</h3>
          <p className="mt-2 text-gray-600">点击"创建模型"按钮开始配置第一个寿命计算模型</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">模型名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联辅料</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联设备</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lifetimeControlModels.map((model) => (
                <tr key={model.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {model.modelName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{model.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {getRelatedMaterials(model)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {getRelatedEquipment(model)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {model.updatedAt ? new Date(model.updatedAt).toLocaleString() : '未知'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(model)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="编辑模型"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCopy(model)}
                      className="text-purple-600 hover:text-purple-900 mr-3"
                      title="复制模型"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(model.id!)}
                      className="text-red-600 hover:text-red-900"
                      title="删除模型"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingModel ? '编辑寿命管控模型' : '创建寿命管控模型'}
              </h3>
              <button
                onClick={handleFormClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <LifetimeControlModelForm
                initialData={editingModel}
                materials={auxiliaryMaterials}
                devices={mockDevices}
                onSubmit={handleFormSubmit}
                onCancel={handleFormClose}
              />
            </div>
          </div>
        </div>
      )}

      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                复制寿命管控模型
              </h3>
              <button
                onClick={handleFormClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <LifetimeControlModelForm
                initialData={copyingModelData}
                materials={auxiliaryMaterials}
                devices={mockDevices}
                onSubmit={handleFormSubmit}
                onCancel={handleFormClose}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};