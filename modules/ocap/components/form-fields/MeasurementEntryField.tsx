import React, { useState, useEffect } from 'react';

// 定义表单字段类型
interface FormField {
  measurementConfig?: MeasurementConfig; // 改为可选属性
}

// 定义量测配置类型
interface MeasurementConfig {
  columns: ColumnConfig[];
  defaultRows: number;
  allowAddRemove: boolean;
  minRows: number;
  maxRows: number;
}

// 定义列配置类型
interface ColumnConfig {
  key: string;
  label: string;
  type: 'text' | 'number';
  min?: number;
  max?: number;
  step?: number;
}

// 定义组件 Props
interface MeasurementEntryFieldProps {
  field: FormField;
  value: any[];
  onChange: (value: any[]) => void;
  disabled: boolean;
  previewMode: boolean;
}

const MeasurementEntryField: React.FC<MeasurementEntryFieldProps> = ({
  field,
  value,
  onChange,
  disabled,
  previewMode
}) => {
  // 防御性检查：确保 measurementConfig 存在
  if (!field?.measurementConfig) {
    return (
      <div className="w-full p-4 border border-gray-300 rounded-lg bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-sm">量测配置信息缺失</p>
          <p className="text-xs mt-1">无法渲染量测参数录入表格</p>
        </div>
      </div>
    );
  }

  const { measurementConfig } = field;
  
  // 提供默认值以防配置属性缺失
  const {
    columns = [],
    defaultRows = 1,
    allowAddRemove = true,
    minRows = 1,
    maxRows = 10
  } = measurementConfig;

  // 内部状态管理
  const [tableData, setTableData] = useState<any[]>([]);

  // 初始化数据
  useEffect(() => {
    if (previewMode) {
      // 预览模式下使用内部状态
      if (tableData.length === 0) {
        const initialData = value && value.length > 0 ? value : generateEmptyRows(defaultRows);
        setTableData(initialData);
      }
    } else {
      // 非预览模式下使用 props 值
      if (value && value.length > 0) {
        setTableData(value);
      } else {
        const initialData = generateEmptyRows(defaultRows);
        setTableData(initialData);
        onChange(initialData);
      }
    }
  }, [value, previewMode, defaultRows, onChange]);

  // 生成空行
  const generateEmptyRows = (count: number) => {
    return Array.from({ length: count }, () => {
      const row: any = {};
      columns.forEach(column => {
        row[column.key] = column.type === 'number' ? 0 : '';
      });
      return row;
    });
  };

  // 处理单元格值变化
  const handleCellChange = (rowIndex: number, columnKey: string, newValue: any) => {
    const newData = [...tableData];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [columnKey]: newValue
    };

    setTableData(newData);
    
    // 非预览模式下通知父组件
    if (!previewMode) {
      onChange(newData);
    }
  };

  // 数字增减处理
  const handleNumberIncrement = (rowIndex: number, columnKey: string, increment: number) => {
    const currentValue = tableData[rowIndex]?.[columnKey] || 0;
    const columnConfig = columns.find(col => col.key === columnKey);
    
    let newValue = Number(currentValue) + increment;
    
    // 应用约束
    if (columnConfig) {
      if (columnConfig.min !== undefined && newValue < columnConfig.min) {
        newValue = columnConfig.min;
      }
      if (columnConfig.max !== undefined && newValue > columnConfig.max) {
        newValue = columnConfig.max;
      }
    }
    
    handleCellChange(rowIndex, columnKey, newValue);
  };

  // 添加新行
  const handleAddRow = () => {
    if (tableData.length >= maxRows) return;
    
    const newRow: any = {};
    columns.forEach(column => {
      newRow[column.key] = column.type === 'number' ? 0 : '';
    });
    
    const newData = [...tableData, newRow];
    setTableData(newData);
    
    if (!previewMode) {
      onChange(newData);
    }
  };

  // 删除行
  const handleRemoveRow = (rowIndex: number) => {
    if (tableData.length <= minRows) return;
    
    const newData = tableData.filter((_, index) => index !== rowIndex);
    setTableData(newData);
    
    if (!previewMode) {
      onChange(newData);
    }
  };

  // Excel 导入处理（占位实现）
  const handleExcelImport = () => {
    // TODO: 实现 Excel 导入逻辑
    console.log('Excel import clicked - functionality to be implemented');
  };

  // 渲染输入控件
  const renderInputControl = (rowIndex: number, column: ColumnConfig, value: any) => {
    const commonProps = {
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        handleCellChange(rowIndex, column.key, e.target.value),
      disabled: disabled,
      className: "w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
    };

    if (column.type === 'number') {
      return (
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => handleNumberIncrement(rowIndex, column.key, -(column.step || 1))}
            disabled={disabled}
            className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            -
          </button>
          <input
            type="number"
            min={column.min}
            max={column.max}
            step={column.step}
            {...commonProps}
            className={`${commonProps.className} text-center`}
          />
          <button
            type="button"
            onClick={() => handleNumberIncrement(rowIndex, column.key, column.step || 1)}
            disabled={disabled}
            className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            +
          </button>
        </div>
      );
    }

    return <input type="text" {...commonProps} />;
  };

  // 额外的防御性检查：如果 columns 为空数组
  if (columns.length === 0) {
    return (
      <div className="w-full p-4 border border-gray-300 rounded-lg bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-sm">量测配置中未定义列信息</p>
          <p className="text-xs mt-1">无法渲染表格列</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 表格容器 */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {/* 表格 */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {columns.map(column => (
                <th 
                  key={column.key} 
                  className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-300"
                >
                  {column.label}
                </th>
              ))}
              {allowAddRemove && (
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-300 w-20">
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map(column => (
                  <td key={column.key} className="px-4 py-2 border-b border-gray-200">
                    {renderInputControl(rowIndex, column, row[column.key])}
                  </td>
                ))}
                {allowAddRemove && (
                  <td className="px-4 py-2 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(rowIndex)}
                      disabled={disabled || tableData.length <= minRows}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      删除
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex space-x-2">
          {allowAddRemove && (
            <button
              type="button"
              onClick={handleAddRow}
              disabled={disabled || tableData.length >= maxRows}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              添加行
            </button>
          )}
          <button
            type="button"
            onClick={handleExcelImport}
            disabled={disabled}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            导入Excel
          </button>
        </div>
        
        {/* 行数统计 */}
        <div className="text-sm text-gray-500">
          当前行数: {tableData.length} {maxRows && `/ ${maxRows}`}
        </div>
      </div>
    </div>
  );
};

export default MeasurementEntryField;