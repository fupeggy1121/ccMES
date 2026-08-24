// src/components/form-fields/EquipmentEntryField.tsx
import React, { useState, useMemo, useEffect } from 'react';

interface Equipment {
  id: string;
  name: string;
  model: string;
  status: 'available' | 'in-use' | 'maintenance';
}

interface EquipmentEntryFieldProps {
  field: any; // Contains equipmentEntryConfig
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  previewMode?: boolean;
}

const EquipmentEntryField: React.FC<EquipmentEntryFieldProps> = ({
  field,
  value,
  onChange,
  disabled = false,
  previewMode = false
}) => {
  // Mock equipment data source
  const mockEquipmentData: Equipment[] = useMemo(() => [
    { id: 'EQ001', name: 'Ultrasound Machine', model: 'US-2000', status: 'available' },
    { id: 'EQ002', name: 'X-Ray Machine', model: 'XR-500', status: 'available' },
    { id: 'EQ003', name: 'MRI Scanner', model: 'MRI-3T', status: 'in-use' },
    { id: 'EQ004', name: 'CT Scanner', model: 'CT-64', status: 'maintenance' },
    { id: 'EQ005', name: 'ECG Monitor', model: 'ECG-PRO', status: 'available' },
    { id: 'EQ006', name: 'Defibrillator', model: 'DEFIB-AED', status: 'available' },
    { id: 'EQ007', name: 'Ventilator', model: 'VENT-200', status: 'in-use' },
    { id: 'EQ008', name: 'Infusion Pump', model: 'INF-PUMP', status: 'available' },
  ], []);

  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [equipmentName, setEquipmentName] = useState('');

  // Filter equipment based on search term
  const filteredEquipment = useMemo(() => {
    if (!searchTerm) return mockEquipmentData;
    return mockEquipmentData.filter(equipment =>
      equipment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, mockEquipmentData]);

  // Update equipment name when value changes
  useEffect(() => {
    if (value) {
      const selectedEquipment = mockEquipmentData.find(eq => eq.id === value);
      setEquipmentName(selectedEquipment ? selectedEquipment.name : '');
    } else {
      setEquipmentName('');
    }
  }, [value, mockEquipmentData]);

  const handleEquipmentSelect = (equipmentId: string) => {
    onChange(equipmentId);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow for click selection
    setTimeout(() => setShowDropdown(false), 200);
  };

  return (
    <div className="equipment-entry-field">
      {/* Equipment ID Searchable Dropdown */}
      <div className="equipment-id-field">
        <label htmlFor="equipment-id">
          {field?.equipmentEntryConfig?.idLabel || '设备编号'}
        </label>
        <div className="searchable-dropdown">
          <input
            id="equipment-id"
            type="text"
            value={searchTerm || value}
            onChange={handleSearchChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            disabled={disabled || previewMode}
            placeholder="搜索或选择设备编号..."
            className="dropdown-input"
          />
          
          {showDropdown && filteredEquipment.length > 0 && (
            <div className="dropdown-list">
              {filteredEquipment.map(equipment => (
                <div
                  key={equipment.id}
                  className={`dropdown-item ${equipment.status}`}
                  onClick={() => handleEquipmentSelect(equipment.id)}
                >
                  <div className="equipment-id">{equipment.id}</div>
                  <div className="equipment-info">
                    <span className="equipment-name">{equipment.name}</span>
                    <span className="equipment-model">{equipment.model}</span>
                  </div>
                  <div className={`status-badge ${equipment.status}`}>
                    {equipment.status === 'available' && '可用'}
                    {equipment.status === 'in-use' && '使用中'}
                    {equipment.status === 'maintenance' && '维护中'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Equipment Name Display (Read-only) */}
      <div className="equipment-name-field">
        <label htmlFor="equipment-name">
          {field?.equipmentEntryConfig?.nameLabel || '设备名称'}
        </label>
        <input
          id="equipment-name"
          type="text"
          value={equipmentName}
          readOnly
          disabled={disabled}
          placeholder="设备名称将根据选择自动显示"
          className="readonly-input"
        />
      </div>

      <style jsx>{`
        .equipment-entry-field {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .equipment-id-field,
        .equipment-name-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        label {
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .dropdown-input,
        .readonly-input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          width: 100%;
          box-sizing: border-box;
        }

        .dropdown-input:focus {
          outline: none;
          border-color: #007bff;
        }

        .readonly-input {
          background-color: #f5f5f5;
          color: #666;
          cursor: not-allowed;
        }

        .searchable-dropdown {
          position: relative;
        }

        .dropdown-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .dropdown-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
        }

        .dropdown-item:hover {
          background-color: #f8f9fa;
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .equipment-id {
          font-weight: bold;
          color: #333;
          min-width: 80px;
        }

        .equipment-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin: 0 12px;
        }

        .equipment-name {
          font-size: 14px;
          color: #333;
        }

        .equipment-model {
          font-size: 12px;
          color: #666;
        }

        .status-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .status-badge.available {
          background-color: #d4edda;
          color: #155724;
        }

        .status-badge.in-use {
          background-color: #fff3cd;
          color: #856404;
        }

        .status-badge.maintenance {
          background-color: #f8d7da;
          color: #721c24;
        }

        .dropdown-item.available {
          border-left: 3px solid #28a745;
        }

        .dropdown-item.in-use {
          border-left: 3px solid #ffc107;
        }

        .dropdown-item.maintenance {
          border-left: 3px solid #dc3545;
        }
      `}</style>
    </div>
  );
};

export default EquipmentEntryField;