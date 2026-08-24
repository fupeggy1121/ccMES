// src/components/form-template/FieldPreview.tsx
import React from 'react';
import { Type, Hash, List, Circle, CheckSquare, Calendar, Clock, Upload, Package, BarChart2, HardDrive } from 'lucide-react';
import { FormField, FieldType } from '../../types/form';
import MeasurementEntryField from '../form-fields/MeasurementEntryField';
import EquipmentEntryField from '../form-fields/EquipmentEntryField';

// 定义所有字段类型及其图标
const fieldTypeOptions: { type: FieldType; label: string; icon: any }[] = [
  { type: 'text', label: '文本输入', icon: Type },
  { type: 'textarea', label: '多行文本', icon: Type },
  { type: 'number', label: '数字', icon: Hash },
  { type: 'select', label: '下拉选择', icon: List },
  { type: 'radio', label: '单选按钮', icon: Circle },
  { type: 'checkbox', label: '多选框', icon: CheckSquare },
  { type: 'date', label: '日期', icon: Calendar },
  { type: 'time', label: '时间', icon: Clock },
  { type: 'datetime', label: '日期时间', icon: Calendar },
  { type: 'file', label: '文件上传', icon: Upload },
  { type: 'custom_input', label: '自定义输入框', icon: Package },
  { type: 'custom_selector', label: '自定义选择器', icon: List },
  { type: 'measurement_entry', label: '量测参数录入', icon: BarChart2 },
  { type: 'equipment_entry', label: '设备录入', icon: HardDrive },
];

interface FieldPreviewProps {
  field: FormField;
  isSelected?: boolean; // 可选，用于编辑模式下的选中状态
  disabled?: boolean; // 控制字段是否禁用，用于预览或只读模式
}

const FieldPreview: React.FC<FieldPreviewProps> = ({ field, isSelected = false, disabled = false }) => {
  const fieldTypeIcon = fieldTypeOptions.find(f => f.type === field.type)?.icon || Type;

  return (
    <div className={`p-3 ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white'} border rounded-md`}>
      <div className="flex items-center mb-2">
        {React.createElement(fieldTypeIcon, { size: 16, className: "text-gray-400 mr-2" })}
        <span className="text-sm font-medium text-gray-900">
          {field.label}
          {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </div>

      {/* 字段预览内容 */}
      <div className="mt-2">
        {field.type === 'text' && (
          <input
            type="text"
            placeholder={field.placeholder || '文本输入'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={disabled}
          />
        )}

        {field.type === 'textarea' && (
          <textarea
            rows={field.rows || 4}
            placeholder={field.placeholder || '多行文本'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={disabled}
          />
        )}

        {field.type === 'number' && (
          <input
            type="number"
            placeholder={field.placeholder || '数字输入'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={disabled}
          />
        )}

        {field.type === 'select' && (
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={disabled}
          >
            <option value="">请选择...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {field.type === 'radio' && (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt.value} className="flex items-center">
                <input
                  type="radio"
                  name={field.name}
                  value={opt.value}
                  disabled={disabled}
                  className="mr-2"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        )}

        {field.type === 'checkbox' && (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt.value} className="flex items-center">
                <input
                  type="checkbox"
                  value={opt.value}
                  disabled={disabled}
                  className="mr-2"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        )}

        {field.type === 'date' && (
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={disabled}
          />
        )}

        {field.type === 'time' && (
          <input
            type="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={disabled}
          />
        )}

        {field.type === 'datetime' && (
          <input
            type="datetime-local"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={disabled}
          />
        )}

        {field.type === 'file' && (
          <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
            <Upload size={24} className="mx-auto h-6 w-6 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">点击上传文件</span>
          </div>
        )}

        {field.type === 'custom_input' && (
          <input
            type="text"
            placeholder={field.placeholder || '自定义输入框'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={disabled}
          />
        )}

        {field.type === 'custom_selector' && (
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={disabled}
          >
            <option value="">请选择...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {field.type === 'measurement_entry' && (
          <MeasurementEntryField
            field={field}
            value={[]}
            onChange={() => {}}
            disabled={disabled}
            previewMode={true}
          />
        )}

        {field.type === 'equipment_entry' && (
          <EquipmentEntryField
            field={field}
            value={''} // EquipmentEntryField expects a string value
            onChange={() => {}}
            disabled={disabled}
            previewMode={true}
          />
        )}
      </div>

      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}
    </div>
  );
};

export default FieldPreview;
