import React from 'react';
import { X } from 'lucide-react';
import { ProductSpecifications } from '../types/Product';

interface SpecificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  specifications: ProductSpecifications;
  productName: string;
}

const SpecificationModal: React.FC<SpecificationModalProps> = ({
  isOpen,
  onClose,
  specifications,
  productName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            产品规格参数 - {productName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  型号
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {specifications.type}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  厚度倍数
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {specifications.thicknessMultiplier}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  背封
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {specifications.backSeal}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  晶向
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {specifications.crystal}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  厚度
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {specifications.thickness}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  去边
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {specifications.method}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  直径
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {specifications.diameter}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  倒角
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {specifications.chamfer}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  掺杂剂
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {specifications.dopant}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  清洗或腐蚀方式
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {specifications.cleaningMethod}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  参考面
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {specifications.referenceSurface}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  喷砂
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {specifications.polishing}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpecificationModal;