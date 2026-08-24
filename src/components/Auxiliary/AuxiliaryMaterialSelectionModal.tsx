// src/components/Auxiliary/AuxiliaryMaterialSelectionModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Table,
  Input,
  Pagination,
  Button,
  Space,
  message,
  Typography,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AuxiliaryMaterial } from '../../types';

const { Search } = Input;
const { Text } = Typography;

interface AuxiliaryMaterialSelectionModalProps {
  visible: boolean;
  onCancel: () => void;
  onSelect: (material: AuxiliaryMaterial) => void;
  dataSource?: AuxiliaryMaterial[];
  loading?: boolean;
  title?: string;
  pageSize?: number;
}

const AuxiliaryMaterialSelectionModal: React.FC<AuxiliaryMaterialSelectionModalProps> = ({
  visible,
  onCancel,
  onSelect,
  dataSource = [],
  loading = false,
  title = '选择辅料',
  pageSize = 10,
}) => {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowKey, setSelectedRowKey] = useState<string | number | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<AuxiliaryMaterial | null>(null);

  // 搜索过滤后的数据
  const filteredData = useMemo(() => {
    if (!searchText.trim()) {
      return dataSource;
    }
    
    const lowerSearchText = searchText.toLowerCase();
    return dataSource.filter(item =>
      item.auxiliaryName?.toLowerCase().includes(lowerSearchText) ||
      item.auxiliaryCode?.toLowerCase().includes(lowerSearchText) ||
      item.specifications?.toLowerCase().includes(lowerSearchText) ||
      item.supplier?.toLowerCase().includes(lowerSearchText)
    );
  }, [dataSource, searchText]);

  // 分页数据
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // 重置选择状态
  useEffect(() => {
    if (!visible) {
      setSelectedRowKey(null);
      setSelectedMaterial(null);
      setSearchText('');
      setCurrentPage(1);
    }
  }, [visible]);

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1); // 搜索后重置到第一页
  };

  // 处理分页变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 处理行选择
  const handleRowSelect = (record: AuxiliaryMaterial) => {
    setSelectedRowKey(record.auxiliaryId);
    setSelectedMaterial(record);
  };

  // 处理确认选择
  const handleConfirmSelection = () => {
    if (!selectedMaterial) {
      message.warning('请先选择一种辅料');
      return;
    }
    
    onSelect(selectedMaterial);
    onCancel(); // 选择后关闭模态框
  };

  // 表格列定义
  const columns: ColumnsType<AuxiliaryMaterial> = [
    {
      title: '选择',
      key: 'selection',
      width: 60,
      render: (_, record) => (
        <input
          type="radio"
          name="materialSelection"
          checked={selectedRowKey === record.auxiliaryId}
          onChange={() => handleRowSelect(record)}
        />
      ),
    },
    {
      title: '辅料ID',
      dataIndex: 'auxiliaryId',
      key: 'auxiliaryId',
      width: 100,
      sorter: (a, b) => (a.auxiliaryId || '').toString().localeCompare((b.auxiliaryId || '').toString()),
    },
    {
      title: '辅料编码',
      dataIndex: 'auxiliaryCode',
      key: 'auxiliaryCode',
      width: 120,
      sorter: (a, b) => (a.auxiliaryCode || '').localeCompare(b.auxiliaryCode || ''),
    },
    {
      title: '辅料名称',
      dataIndex: 'auxiliaryName',
      key: 'auxiliaryName',
      width: 150,
      sorter: (a, b) => (a.auxiliaryName || '').localeCompare(b.auxiliaryName || ''),
    },
    {
      title: '规格',
      dataIndex: 'specifications',
      key: 'specifications',
      width: 120,
      render: (text) => text || '-',
      sorter: (a, b) => (a.specifications || '').localeCompare(b.specifications || ''),
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 150,
      render: (text) => text || '-',
      sorter: (a, b) => (a.supplier || '').localeCompare(b.supplier || ''),
    },
  ];

  // 自定义行类名，用于高亮选中的行
  const rowClassName = (record: AuxiliaryMaterial) => {
    return selectedRowKey === record.auxiliaryId ? 'selected-row' : '';
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirmSelection}
          disabled={!selectedMaterial}
        >
          确认选择
        </Button>,
      ]}
    >
      {/* 搜索区域 */}
      <div style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Search
            placeholder="请输入辅料名称、编码、规格或供应商进行搜索"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            onSearch={handleSearch}
            onChange={(e) => setSearchText(e.target.value)}
            value={searchText}
            style={{ width: 400 }}
          />
          
          <div>
            <Text type="secondary">
              共找到 {filteredData.length} 条记录
              {searchText && `（搜索：${searchText}）`}
            </Text>
          </div>
        </Space>
      </div>

      {/* 表格区域 */}
      <Table
        columns={columns}
        dataSource={paginatedData}
        loading={loading}
        pagination={false}
        size="middle"
        rowKey="auxiliaryId"
        rowClassName={rowClassName}
        onRow={(record) => ({
          onClick: () => handleRowSelect(record),
        })}
        scroll={{ y: 400 }}
      />

      {/* 分页区域 */}
      {filteredData.length > 0 && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredData.length}
            onChange={handlePageChange}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }
          />
        </div>
      )}

      {/* 选中的辅料信息显示 */}
      {selectedMaterial && (
        <div style={{ marginTop: 16, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
          <Text strong>已选辅料：</Text>
          <Text> {selectedMaterial.auxiliaryName}（{selectedMaterial.auxiliaryCode}）</Text>
          {selectedMaterial.specifications && (
            <Text>，规格：{selectedMaterial.specifications}</Text>
          )}
          {selectedMaterial.supplier && (
            <Text>，供应商：{selectedMaterial.supplier}</Text>
          )}
        </div>
      )}
    </Modal>
  );
};

export default AuxiliaryMaterialSelectionModal;