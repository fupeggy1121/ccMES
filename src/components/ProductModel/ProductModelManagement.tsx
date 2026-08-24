import React, { useState, useCallback, useEffect } from 'react';
import { Search, RotateCcw, Upload, Plus, BookOpen } from 'lucide-react';
import ProductTree from './components/ProductTree';
import ProductTable from './components/ProductTable';
import ProductModal from './components/ProductModal';
import SpecificationModal from './components/SpecificationModal';
import ApprovalWorkbench from './components/ApprovalWorkbench';
import RevisionHistoryModal from './components/RevisionHistoryModal';
import ExperimentalDeviationModal from './components/ExperimentalDeviationModal';
import BatchSamplingRuleModal, { CommonStationOption } from './components/BatchSamplingRuleModal';
import { ApprovalTemplateConfig } from './components/ApprovalTemplateConfig';
import { SystemDocumentation } from './components/SystemDocumentation';
import { Product, ProductCategory, ProductStatus, ProductVersionSnapshot, Station } from './types/Product';
import { mockCategories } from './data/mockData';
import api from './api';
import { useApprovalTemplateData } from './hooks/useApprovalTemplateData';

const ProductModelManagement: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>(mockCategories);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [currentView, setCurrentView] = useState<'productManagement' | 'approvalWorkbench'>('productManagement');

  const [isRevisionHistoryModalOpen, setIsRevisionHistoryModalOpen] = useState(false);
  const [viewingProductSnapshots, setViewingProductSnapshots] = useState<ProductVersionSnapshot[]>([]);
  const [viewingProductNameForHistory, setViewingProductNameForHistory] = useState('');

  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'ALL'>('ALL');
  const [pendingApprovalTasksCount, setPendingApprovalTasksCount] = useState(0);
  const [mainProcessPathSearchTerm, setMainProcessPathSearchTerm] = useState('');

  const [isExperimentalDeviationModalOpen, setIsExperimentalDeviationModalOpen] = useState(false);
  const [productForDeviationConfig, setProductForDeviationConfig] = useState<Product | null>(null);

  const [selectedProductModelIdForConfig, setSelectedProductModelIdForConfig] = useState<string | null>(null);
  const [isDocumentationModalOpen, setIsDocumentationModalOpen] = useState(false);
  const [isApprovalTemplateConfigModalOpen, setIsApprovalTemplateConfigModalOpen] = useState(false);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [isBatchSamplingRuleModalOpen, setIsBatchSamplingRuleModalOpen] = useState(false);
  const [batchSamplingRuleLoading, setBatchSamplingRuleLoading] = useState(false);
  const [commonStationsForBatchEdit, setCommonStationsForBatchEdit] = useState<CommonStationOption[]>([]);

  const {
    productModels,
    loading: approvalTemplateLoading,
    updateTemplate,
    fetchProductModels,
  } = useApprovalTemplateData();

  const fetchProducts = useCallback(async () => {
    try {
      const { items, totalCount } = await api.products.getProducts({
        searchTerm,
        statusFilter,
        mainProcessPathSearchTerm,
        page: currentPage,
        pageSize
      });
      setProducts(items);
      setTotalProductsCount(totalCount);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  }, [searchTerm, statusFilter, mainProcessPathSearchTerm, currentPage, pageSize]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await api.approval.getPendingTasks({});
        setPendingApprovalTasksCount(response.data.totalCount);
      } catch (error) {
        setPendingApprovalTasksCount(0);
      }
    };
    fetchCount();
  }, []);

  const handleCategorySelect = (categoryId: string) => setSelectedCategory(categoryId);

  const handleToggleCategory = (categoryId: string) => {
    const updateCategory = (cats: ProductCategory[]): ProductCategory[] =>
      cats.map(cat => {
        if (cat.id === categoryId) return { ...cat, isExpanded: !cat.isExpanded };
        if (cat.children) return { ...cat, children: updateCategory(cat.children) };
        return cat;
      });
    setCategories(updateCategory(categories));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchProducts();
  };

  const handleClear = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setCurrentPage(1);
    setMainProcessPathSearchTerm('');
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      if (productData.id) {
        const originalProduct = products.find(p => p.id === productData.id);
        let newStatus = productData.status;
        if (originalProduct && (originalProduct.status === 'ACTIVE' || originalProduct.status === 'DRAFT' || originalProduct.status === 'REJECTED')) {
          newStatus = 'DRAFT';
        }
        await api.products.updateProduct(productData.id, { ...productData, status: newStatus });
      } else {
        await api.products.createProduct(productData);
      }
      fetchProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleViewSpecifications = (product: Product) => {
    setViewingProduct(product);
    setIsSpecModalOpen(true);
  };

  const handleViewRevisionHistory = async (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const mockSnapshots: ProductVersionSnapshot[] = product.revisionHistory.map((entry, index) => ({
        snapshotId: `${product.id}-snap-v${index + 1}`,
        productId: product.id,
        systemVersion: `V1.${index + 1}`,
        timestamp: entry.timestamp,
        productCode: product.productCode,
        productName: `${product.productName} (V1.${index + 1})`,
        productCategory: product.productCategory,
        productCategoryVersion: product.productCategoryVersion,
        productType: product.productType,
        customerName: product.customerName,
        mainProcessPath: product.mainProcessPath,
        specifications: product.specifications,
        internalRevisionHistory: [entry],
        subProcessConfigs: product.subProcessConfigs
      }));
      setViewingProductSnapshots(mockSnapshots);
      setViewingProductNameForHistory(product.productName);
      setIsRevisionHistoryModalOpen(true);
    }
  };

  const handleConfigureExperimentalDeviation = (product: Product) => {
    setProductForDeviationConfig(product);
    setIsExperimentalDeviationModalOpen(true);
  };

  const handleSaveExperimentalDeviation = async (deviationData: any) => {
    try {
      if (!productForDeviationConfig) return;
      await api.approval.saveExperimentalDeviation({
        productId: productForDeviationConfig.id,
        ...deviationData
      });
      setIsExperimentalDeviationModalOpen(false);
      setProductForDeviationConfig(null);
      fetchProducts();
    } catch (error) {
      console.error('Failed to save experimental deviation configuration:', error);
    }
  };

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

  const getStationIdentity = (station: Partial<Station> & Record<string, any>): string =>
    station.stationCode || station.station_code || station.code || station.stationName || station.station_name || station.name || station.id;

  const getStationMatchKey = (station: Partial<Station> & Record<string, any>): string => {
    if (station.sequence !== undefined && station.sequence !== null) {
      return `seq:${station.sequence}`;
    }

    return `legacy:${getStationIdentity(station)}`;
  };

  const handleToggleProductSelection = (productId: number) => {
    setSelectedProductIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleToggleAllProductSelection = (productIds: number[]) => {
    if (productIds.length === 0) return;

    setSelectedProductIds(prev => {
      const allSelected = productIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !productIds.includes(id));
      }

      const next = new Set(prev);
      productIds.forEach(id => next.add(id));
      return Array.from(next);
    });
  };

  const handleOpenBatchSamplingRuleModal = async () => {
    const selectedProducts = products.filter(product => selectedProductIds.includes(product.id));
    if (selectedProducts.length < 2) {
      window.alert('请至少选择两个产品模型进行批量编辑。');
      return;
    }

    // 收集所有选中产品的路由ID（去重）
    const routeIds = [...new Set(
      selectedProducts.map(p => p.mainProcessRouteId).filter(Boolean)
    )];

    let stationOptions: CommonStationOption[] = [];

    if (routeIds.length === 1 && routeIds[0]) {
      // 所有产品共用同一路由，直接从路由定义取站点列表
      try {
        const routeStations = await api.processRoutes.getStationsForRoute(String(routeIds[0]));
        if (routeStations.length > 0) {
          stationOptions = routeStations.map((station: any) => ({
            key: `seq:${station.sequence}`,
            name: `${station.sequence} - ${station.name || station.stationName || station.code || ''}`,
          }));
        }
      } catch (e) {
        console.error('获取路由站点失败，降级到本地匹配', e);
      }
    }

    // 降级：从各产品本地存储的站点取交集
    if (stationOptions.length === 0) {
      const [firstProduct, ...restProducts] = selectedProducts;
      const firstStations = firstProduct.processStations || [];
      const commonBySeq = firstStations.filter(station =>
        station.sequence !== undefined &&
        restProducts.every(product =>
          (product.processStations || []).some(ps => ps.sequence === station.sequence)
        )
      );
      const commonByIdentity = firstStations.filter(station =>
        restProducts.every(product =>
          (product.processStations || []).some(ps => getStationIdentity(ps) === getStationIdentity(station))
        )
      );
      const common = commonBySeq.length > 0 ? commonBySeq : commonByIdentity;
      stationOptions = common.map(station => ({
        key: getStationMatchKey(station),
        name: `${station.sequence !== undefined ? `${station.sequence} - ` : ''}${station.stationName}`,
      }));
    }

    if (stationOptions.length === 0) {
      window.alert('所选产品没有可共同编辑的站点。');
      return;
    }

    setCommonStationsForBatchEdit(stationOptions);
    setIsBatchSamplingRuleModalOpen(true);
  };

  const handleBatchSamplingRuleSave = async (stationKey: string, samplingRule: string) => {
    try {
      setBatchSamplingRuleLoading(true);

      const selectedProducts = products.filter(product => selectedProductIds.includes(product.id));
      await Promise.all(
        selectedProducts.map(async product => {
          const storedStations = product.processStations || [];
          // 优先按 seq: 序号匹配，同时兼容旧字段
          const updatedProcessStations = storedStations.map(station => {
            const seqKey = station.sequence !== undefined ? `seq:${station.sequence}` : null;
            const matches = (seqKey && seqKey === stationKey) ||
              getStationMatchKey(station) === stationKey ||
              getStationIdentity(station) === stationKey;
            return matches ? { ...station, samplingRule } : station;
          });

          // 如果产品本地没有站点记录，需要先从路由拉取再写入
          if (storedStations.length === 0 && product.mainProcessRouteId) {
            try {
              const routeStations = await api.processRoutes.getStationsForRoute(String(product.mainProcessRouteId));
              const enriched = routeStations.map((s: any) => ({
                id: s.id,
                sequence: s.sequence,
                stationCode: s.code || '',
                stationName: s.name || '',
                equipment_group_ids: s.equipment_group_ids || [],
                parameter_group_ids: s.parameter_group_ids || [],
                recipe_id: s.recipe_id || '',
                samplingRule: `seq:${s.sequence}` === stationKey ? samplingRule : '',
                remarks: [],
                associatedSubPaths: [],
                measurementParameters: [],
                processParameters: [],
                spcParameters: [],
              }));
              return api.products.updateProduct(product.id, { processStations: enriched });
            } catch (e) {
              console.error('从路由初始化站点失败', e);
            }
          }

          return api.products.updateProduct(product.id, {
            processStations: updatedProcessStations,
          });
        })
      );

      setIsBatchSamplingRuleModalOpen(false);
      setSelectedProductIds([]);
      fetchProducts();
    } catch (error) {
      console.error('Failed to batch update sampling rule:', error);
      window.alert('批量编辑抽检规则失败，请稍后重试。');
    } finally {
      setBatchSamplingRuleLoading(false);
    }
  };

  const handlePreviewCP = (productId: number) => console.log('Preview CP:', productId);
  const handleUploadCP = (productId: number) => console.log('Upload CP:', productId);
  const handleCreateCP = (productId: number) => console.log('Create CP:', productId);
  const handleQueryData = (productId: number) => console.log('Query Data:', productId);

  const handleImportConfig = async (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    // 懒加载：打开弹窗前才触发重量级 getProductModels 请求
    await fetchProductModels();
    setSelectedProductModelIdForConfig(String(product.id));
    setIsApprovalTemplateConfigModalOpen(true);
  };

  const handleCopyProduct = (productId: number) => {
    const productToCopy = products.find(p => p.id === productId);
    if (productToCopy) {
      const copiedProduct: Product = JSON.parse(JSON.stringify(productToCopy));
      copiedProduct.id = null;
      copiedProduct.productCode = '';
      copiedProduct.productName = '';
      copiedProduct.customerName = '';
      copiedProduct.productCategory = '';
      copiedProduct.productCategoryVersion = '';
      copiedProduct.productType = '';
      copiedProduct.description = '';
      copiedProduct.status = 'DRAFT';
      copiedProduct.revisionHistory = [];
      copiedProduct.stationSubPathOverrides = [];
      copiedProduct.experimentalDeviationConfig = undefined;
      copiedProduct.subProcessConfigs = [];
      setEditingProduct(copiedProduct);
      setIsModalOpen(true);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('确定要删除此产品吗？')) {
      try {
        await api.products.deleteProduct(productId);
        fetchProducts();
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const handleDeleteRow = (productId: number) => handleDeleteProduct(productId);
  const handleViewProduct = (product: Product) => console.log('View Product Details:', product);

  const handleSubmitForApproval = async (productId: number) => {
    if (window.confirm('确定要提交审批吗？')) {
      try {
        await api.products.updateProduct(productId, { status: 'PENDING_APPROVAL' });
        fetchProducts();
        const response = await api.approval.getPendingTasks({});
        setPendingApprovalTasksCount(response.data.totalCount);
      } catch (error) {
        console.error('Failed to submit for approval:', error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部视图切换栏 */}
      <div className="bg-white shadow-sm border-b p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className={`px-4 py-2 rounded-md ${currentView === 'productManagement' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              onClick={() => setCurrentView('productManagement')}
            >
              产品模型
            </button>
            <button
              className={`px-4 py-2 rounded-md flex items-center ${currentView === 'approvalWorkbench' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              onClick={() => setCurrentView('approvalWorkbench')}
            >
              审批工作台
              {pendingApprovalTasksCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {pendingApprovalTasksCount}
                </span>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDocumentationModalOpen(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              说明文档
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      {currentView === 'productManagement' ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* 搜索栏 */}
          <div className="bg-white border-b p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="产品编号"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                />
                <input
                  type="text"
                  placeholder="工艺主路径"
                  value={mainProcessPathSearchTerm}
                  onChange={(e) => setMainProcessPathSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button onClick={handleClear} className="px-4 py-2 text-gray-500 rounded-md flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700">状态:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ProductStatus | 'ALL')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">全部</option>
                  <option value="DRAFT">草稿</option>
                  <option value="PENDING_APPROVAL">待审批</option>
                  <option value="ACTIVE">激活</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenBatchSamplingRuleModal}
                  disabled={selectedProductIds.length === 0}
                  className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  编辑抽检规则
                </button>
                <button className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  导入
                </button>
                <button
                  onClick={handleAddNew}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  新增
                </button>
              </div>
            </div>
          </div>

          {/* 分栏内容 */}
          <div className="flex-1 flex min-h-0 p-4 gap-4">
            <div className="w-64 bg-white rounded-lg shadow-sm flex-shrink-0 overflow-auto">
              <ProductTree
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
                onToggleCategory={handleToggleCategory}
                onEditCategory={(id) => console.log('Edit category:', id)}
                onDeleteCategory={(id) => console.log('Delete category:', id)}
                onAddSubCategory={(id) => console.log('Add sub category:', id)}
              />
            </div>
            <div className="flex-1 bg-white rounded-lg shadow-sm min-w-0 overflow-auto">
              <ProductTable
                products={products}
                selectedProductIds={selectedProductIds}
                currentPage={currentPage}
                pageSize={pageSize}
                totalCount={totalProductsCount}
                onToggleProductSelection={handleToggleProductSelection}
                onToggleAllProductSelection={handleToggleAllProductSelection}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
                onPreviewCP={handlePreviewCP}
                onUploadCP={handleUploadCP}
                onCreateCP={handleCreateCP}
                onQueryData={handleQueryData}
                onImportConfig={handleImportConfig}
                onCopyProduct={handleCopyProduct}
                onDeleteRow={handleDeleteRow}
                onViewSpecifications={handleViewSpecifications}
                onViewProduct={handleViewProduct}
                onSubmitForApproval={handleSubmitForApproval}
                onViewRevisionHistory={handleViewRevisionHistory}
                onConfigureExperimentalDeviation={handleConfigureExperimentalDeviation}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-6 min-h-0 overflow-auto">
          <div className="bg-white rounded-lg shadow-sm h-full">
            <ApprovalWorkbench />
          </div>
        </div>
      )}

      {/* 模态框 */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
        title={editingProduct && editingProduct.id ? '编辑产品' : (editingProduct ? '复制产品' : '新增产品')}
      />

      <SpecificationModal
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
        specifications={viewingProduct?.specifications || {} as any}
        productName={viewingProduct?.productName || ''}
      />

      <RevisionHistoryModal
        isOpen={isRevisionHistoryModalOpen}
        onClose={() => setIsRevisionHistoryModalOpen(false)}
        productName={viewingProductNameForHistory}
        versionSnapshots={viewingProductSnapshots}
      />

      <ExperimentalDeviationModal
        isOpen={isExperimentalDeviationModalOpen}
        onClose={() => {
          setIsExperimentalDeviationModalOpen(false);
          setProductForDeviationConfig(null);
        }}
        onSave={handleSaveExperimentalDeviation}
        product={productForDeviationConfig}
      />

      {isDocumentationModalOpen && (
        <SystemDocumentation onClose={() => setIsDocumentationModalOpen(false)} />
      )}

      <ApprovalTemplateConfig
        isOpen={isApprovalTemplateConfigModalOpen}
        onClose={() => {
          setIsApprovalTemplateConfigModalOpen(false);
          setSelectedProductModelIdForConfig(null);
        }}
        productModels={productModels}
        updateTemplate={updateTemplate}
        initialSelectedModelId={selectedProductModelIdForConfig}
      />

      <BatchSamplingRuleModal
        isOpen={isBatchSamplingRuleModalOpen}
        onClose={() => setIsBatchSamplingRuleModalOpen(false)}
        onConfirm={handleBatchSamplingRuleSave}
        stations={commonStationsForBatchEdit}
        loading={batchSamplingRuleLoading}
      />
    </div>
  );
};

export default ProductModelManagement;
