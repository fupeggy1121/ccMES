// src/components/form-template/FormFieldRenderer.tsx
import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { FormField } from '../../types/form';
import FileUpload from '../FileUpload';
import MeasurementEntryField from '../form-fields/MeasurementEntryField';

interface FormFieldRendererProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onOpenDrawer: () => void;
  isReadOnly: boolean;
}

const FormFieldRenderer: React.FC<FormFieldRendererProps> = ({
  field,
  isSelected,
  onSelect,
  onRemove,
  onMoveUp,
  onMoveDown,
  onOpenDrawer,
  isReadOnly
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const [{ isDragging }, drag] = useDrag({
    type: 'FORM_FIELD',
    item: { id: field.id, type: 'FIELD' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const showControls = isSelected || isHovered;

  const renderFieldComponent = () => {
    const commonProps = {
      previewMode: true,
      disabled: true,
      label: field.label,
      required: field.required,
    };

    switch (field.type) {
      case 'text':
        return <input type="text" {...commonProps} />;
      
      case 'textarea':
        return <textarea {...commonProps} />;
      
      case 'number':
        return <input type="number" {...commonProps} />;
      
      case 'date':
        return <input type="date" {...commonProps} />;
      
      case 'time':
        return <input type="time" {...commonProps} />;
      
      case 'datetime':
        return <input type="datetime-local" {...commonProps} />;
      
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">请选择</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div>
            {field.options?.map((option, index) => (
              <label key={index}>
                <input
                  type="radio"
                  name={field.id}
                  value={option.value}
                  {...commonProps}
                />
                {option.label}
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div>
            {field.options?.map((option, index) => (
              <label key={index}>
                <input
                  type="checkbox"
                  value={option.value}
                  {...commonProps}
                />
                {option.label}
              </label>
            ))}
          </div>
        );
      
      case 'file':
        return <FileUpload {...commonProps} />;
      
      case 'measurement_entry':
        return <MeasurementEntryField {...commonProps} />;
      
      default:
        return <div>未知字段类型: {field.type}</div>;
    }
  };

  return (
    <div
      ref={drag}
      className={`form-field-renderer ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        border: isSelected ? '2px dashed #1890ff' : '1px solid #d9d9d9',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '8px',
        backgroundColor: '#fafafa',
        cursor: 'pointer',
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {/* 字段标签 */}
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        {field.label}
        {field.required && <span style={{ color: 'red', marginLeft: '4px' }}>*</span>}
      </div>

      {/* 实际字段组件 */}
      {renderFieldComponent()}

      {/* 字段描述 */}
      {field.description && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          {field.description}
        </div>
      )}

      {/* 操作按钮 */}
      {showControls && !isReadOnly && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            right: '8px',
            display: 'flex',
            gap: '4px',
            backgroundColor: '#1890ff',
            borderRadius: '4px',
            padding: '2px 4px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onOpenDrawer}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="配置"
          >
            ⚙️
          </button>
          
          <button
            onClick={onMoveUp}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="上移"
          >
            ↑
          </button>
          
          <button
            onClick={onMoveDown}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="下移"
          >
            ↓
          </button>
          
          <button
            onClick={onRemove}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="删除"
          >
            ×
          </button>
        </div>
      )}

      {/* 拖拽手柄 */}
      {showControls && !isReadOnly && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            cursor: 'grab',
            color: '#666',
            fontSize: '12px',
          }}
          title="拖拽排序"
        >
          ⋮⋮
        </div>
      )}
    </div>
  );
};

export default FormFieldRenderer;