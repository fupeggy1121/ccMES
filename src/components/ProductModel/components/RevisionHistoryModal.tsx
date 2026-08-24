import React, { useState } from 'react';
import { X, History, Eye } from 'lucide-react';
import { ProductVersionSnapshot, RevisionHistoryEntry } from '../types/Product';
import ProductDetailsModal from './ProductDetailsModal';

interface RevisionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  versionSnapshots: ProductVersionSnapshot[];
}

const RevisionHistoryModal: React.FC<RevisionHistoryModalProps> = ({
  isOpen,
  onClose,
  productName,
  versionSnapshots
}) => {
  const [showDetailHistory, setShowDetailHistory] = useState(false);
  const [selectedInternalHistory, setSelectedInternalHistory] = useState<RevisionHistoryEntry[]>([]);
  const [selectedSnapshotVersion, setSelectedSnapshotVersion] = useState('');
  const [isProductDetailsModalOpen, setIsProductDetailsModalOpen] = useState(false);
  const [selectedProductSnapshot, setSelectedProductSnapshot] = useState<ProductVersionSnapshot | null>(null);
  const [currentViewingSnapshot, setCurrentViewingSnapshot] = useState<ProductVersionSnapshot | null>(null);

  if (!isOpen) return null;

  // 辅助函数：格式化产品规格摘要
  const formatSpecificationSummary = (specs: ProductVersionSnapshot['specifications']) => {
    if (!specs) return '无规格';
    return `型号:${specs.type || '-'} 晶向:${specs.crystal || '-'} 直径:${specs.diameter || '-'} 厚度:${specs.thickness || '-'}`;
  };

  const handleViewInternalHistory = (snapshot: ProductVersionSnapshot) => {
    // 对内部修订历史进行倒序排序
    const sortedInternalHistory = [...snapshot.internalRevisionHistory].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp)
    );
    setSelectedInternalHistory(sortedInternalHistory);
    setSelectedSnapshotVersion(snapshot.systemVersion);
    setCurrentViewingSnapshot(snapshot);
    setShowDetailHistory(true);
  };

  const handleBackToSnapshots = () => {
    setShowDetailHistory(false);
    setSelectedInternalHistory([]);
    setSelectedSnapshotVersion('');
    setCurrentViewingSnapshot(null);
  };

  const handlePreviewProductModel = (entry: RevisionHistoryEntry) => {
    // 使用当前正在查看的快照数据
    if (currentViewingSnapshot) {
      setSelectedProductSnapshot(currentViewingSnapshot);
      setIsProductDetailsModalOpen(true);
    }
  };

  // 对历史版本快照进行倒序排序
  const sortedVersionSnapshots = [...versionSnapshots].sort((a, b) =>
    b.systemVersion.localeCompare(a.systemVersion)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* 增加模态框宽度，从 max-w-6xl 更改为 max-w-7xl */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {showDetailHistory ? `版本 ${selectedSnapshotVersion} 的修订记录` : `产品 "${productName}" 的历史版本及修订记录`}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!showDetailHistory ? (
            // 第一层：历史版本快照表格
            sortedVersionSnapshots.length > 0 ? ( // 使用排序后的数组
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        产品编号
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        产品名称
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        产品规格
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        产品版本
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        系统版本
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        产品类型
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        客户名称
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        工艺主路径
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        工艺子路径
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedVersionSnapshots.map((snapshot) => ( // 使用排序后的数组
                      <tr key={snapshot.snapshotId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{snapshot.productCode}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{snapshot.productName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="w-32 truncate" title={formatSpecificationSummary(snapshot.specifications)}>
                            {formatSpecificationSummary(snapshot.specifications)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {snapshot.productCategory.charAt(0) + snapshot.productCategoryVersion}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{snapshot.systemVersion}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{snapshot.productType}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{snapshot.customerName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{snapshot.mainProcessPath}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="w-32 truncate" title={snapshot.subProcessConfigs.map(config => config.path).join(', ')}>
                            {snapshot.subProcessConfigs.map(config => config.path).join(', ') || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <button
                            onClick={() => handleViewInternalHistory(snapshot)}
                            className="px-2 py-1 text-xs text-blue-600 rounded hover:bg-blue-50 flex items-center gap-1"
                          >
                            <History className="w-3 h-3" />
                            查看修订历史
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500">暂无历史版本快照。</p>
            )
          ) : (
            // 第二层：详细修订历史记录表格
            selectedInternalHistory.length > 0 ? (
              <>
                <button
                  onClick={handleBackToSnapshots}
                  className="mb-4 px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  &larr; 返回历史版本快照
                </button>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          内部版本
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          更新时间
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          更新人员
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          修改前版本
                        </th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedInternalHistory.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{entry.version}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{entry.timestamp}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{entry.modifier}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <button
                            onClick={() => handlePreviewProductModel(entry)}
                            className="px-3 py-1 text-xs text-blue-600 rounded hover:bg-blue-50 flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            预览
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500">该版本暂无详细修订记录。</p>
            )
          )}
        </div>

        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            关闭
          </button>
        </div>

        {/* 产品详情预览模态框 */}
        <ProductDetailsModal
          isOpen={isProductDetailsModalOpen}
          onClose={() => setIsProductDetailsModalOpen(false)}
          productSnapshot={selectedProductSnapshot}
        />
      </div>
    </div>
  );
};

export default RevisionHistoryModal;
