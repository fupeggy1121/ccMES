import React from 'react';
import { ProductSpecifications } from '../types/Product';

interface ProductSpecificationsFormProps {
  specifications: ProductSpecifications;
  isReadOnly: boolean;
  updateSpecification: (field: keyof ProductSpecifications, value: any) => void;
}

const ProductSpecificationsForm: React.FC<ProductSpecificationsFormProps> = ({
  specifications,
  isReadOnly,
  updateSpecification
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">产品规格参数</h3>
      <div className="grid grid-cols-4 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              型号
            </label>
            <select
              value={specifications.type}
              onChange={(e) => updateSpecification('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              disabled={isReadOnly}
            >
              <option value="">请选择</option>
              <option value="N">N</option>
              <option value="P">P</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              厚度倍数
            </label>
            <select
              value={specifications.thicknessMultiplier}
              onChange={(e) => updateSpecification('thicknessMultiplier', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              disabled={isReadOnly}
            >
              <option value="">请选择</option>
              <option value="X1">X1</option>
              <option value="X2">X2</option>
              <option value="X3">X3</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              背封
            </label>
            <select
              value={specifications.backSeal}
              onChange={(e) => updateSpecification('backSeal', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              disabled={isReadOnly}
            >
              <option value="">请选择</option>
              <option value="背封">背封</option>
              <option value="无背封">无背封</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              晶向
            </label>
            <select
              value={specifications.crystal}
              onChange={(e) => updateSpecification('crystal', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              disabled={isReadOnly}
            >
              <option value="">请选择</option>
              <option value={100}>100</option>
              <option value={110}>110</option>
              <option value={111}>111</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              厚度
            </label>
            <select
              value={specifications.thickness}
              onChange={(e) => updateSpecification('thickness', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              disabled={isReadOnly}
            >
              <option value="">请选择</option>
              <option value={500}>500</option>
              <option value={550}>550</option>
              <option value={625}>625</option>
              <option value={675}>675</option>
              <option value={725}>725</option>
              <option value={750}>750</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              去边
            </label>
            <select
              value={specifications.method}
              onChange={(e) => updateSpecification('method', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              disabled={isReadOnly}
            >
              <option value="">请选择</option>
              <option value="去边">去边</option>
              <option value="保边">保边</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              直径
            </label>
            <select
              value={specifications.diameter}
              onChange={(e) => updateSpecification('diameter', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              disabled={isReadOnly}
            >
              <option value="">请选择</option>
              <option value={6}>6</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              倒角
            </label>
            <select
              value={specifications.chamfer}
              onChange={(e) => updateSpecification('chamfer', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              disabled={isReadOnly}
            >
              <option value="">请选择</option>
              <option value="对称倒角">对称倒角</option>
              <option value="不对称倒角">不对称倒角</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              掺杂剂
            </label>
            <select
              value={specifications.dopant}
              onChange={(e) => updateSpecification('dopant', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              disabled={isReadOnly}
            >
              <option value="">请选择</option>
              <option value="磷">磷</option>
              <option value="硼">硼</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              清洗或腐蚀方式
            </label>
            <select
              value={specifications.cleaningMethod}
              onChange={(e) => updateSpecification('cleaningMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              disabled={isReadOnly}
            >
              <option value="">请选择</option>
              <option value="酸洗">酸洗</option>
              <option value="碱洗">碱洗</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              参考面
            </label>
            <select
              value={specifications.referenceSurface}
              onChange={(e) => updateSpecification('referenceSurface', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              disabled={isReadOnly}
            >
              <option value="">请选择</option>
              <option value="一条特参">一条特参</option>
              <option value="两条特参">两条特参</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              喷砂
            </label>
            <select
              value={specifications.polishing}
              onChange={(e) => updateSpecification('polishing', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              disabled={isReadOnly}
            >
              <option value="">请选择</option>
              <option value="喷砂">喷砂</option>
              <option value="不喷砂">不喷砂</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSpecificationsForm; 