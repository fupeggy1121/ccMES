// src/components/BatchListPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useBatchOperations } from '../contexts/BatchOperationsContext';
import FinalSortingOverviewModal from './FinalSortingOverviewModal';
import MasterBatchTable from './MasterBatchTable';
import SubBatchTable from './SubBatchTable';
import BatchHoldModal from './BatchHoldModal';
import BatchReleaseModal from './BatchReleaseModal';
import { Clock, BookOpen } from 'lucide-react';

interface BatchListPageProps {
  onSelectBatch: (batch: BatchData) => void;
  getSubBatchesForMaster: (masterBatchId: string) => Promise<SubBatchData[]>;
  getStatusColor: (status: string) => string;
  onCancelEntry: (batch: BatchData) => void;
  onMergeBatch: (batch: BatchData) => void;
  onTransferBatch: (batch: BatchData) => void;
  onAccumulateBatch: (batch: BatchData, isFromStaging?: boolean) => void;
  onCombineTrayBatch: (batch: BatchData) => void;
  onSplitBatch: (batch: BatchData) => void;
  onInstation: (batch: BatchData) => void;
  onDefectEntry: (batch: BatchData) => void;
  onCancelDefectEntry: (batch: BatchData) => void;
  onCutIntoSubpath: (batch: BatchData) => void;
  onCarrierChange: (selectedSubBatches: SubBatchData[]) => void;
  onPostEtchInspectionBalance: (batch: BatchData) => void; // 新增：腐后目检配平
  onMeasurementEntry: (batch: BatchData) => void; // 新增
  onProcessEntry: (batch: BatchData) => void; // 新增
  onOpenBatchRemarks: (batch: BatchData) => void; // 新增：打开批次备注
  onOpenQTimeRemaining: (batch: BatchData) => void; // 新增：打开批次Q-Time剩余查询
  onAutoAccumulateBatch: () => void; // 新增：自动攒批
}

const BatchListPage: React.FC<BatchListPageProps> = ({
  onSelectBatch,
  getSubBatchesForMaster,
  getStatusColor,
  onCancelEntry,
  onMergeBatch,
  onTransferBatch,
  onAccumulateBatch,
  onCombineTrayBatch,
  onSplitBatch,
  onInstation,
  onDefectEntry,
  onCancelDefectEntry,
  onCutIntoSubpath,
  onCarrierChange,
  onPostEtchInspectionBalance, // 新增：腐后目检配平
  onMeasurementEntry, // 新增
  onProcessEntry, // 新增
  onOpenBatchRemarks, // 新增：打开批次备注
  onOpenQTimeRemaining, // 新增：打开批次Q-Time剩余查询
  onAutoAccumulateBatch, // 新增：自动攒批
}) => {
  const {
    batchList,
    selectedBatch,
    fetchAggregatedWaferData,
    aggregatedWafersForOverview,
    isAggregatedDataLoading,
    allStations, // 新增：从上下文获取站点数据
    setIsDocumentationModalOpen,
    setCurrentFormType,
    setSelectedBatch,
    fetchBatches, // 新增：批量Hold/Release后刷新批次列表
  } = useBatchOperations();

  // 状态管理
  const [selectedMasterBatchId, setSelectedMasterBatchId] = useState<string | null>(null);
  const [checkedSubBatchIds, setCheckedSubBatchIds] = useState<string[]>([]);
  // 新增：批量Hold/Release用的主批次多选态与弹窗开关
  const [checkedMasterBatchIds, setCheckedMasterBatchIds] = useState<string[]>([]);
  const [isBatchHoldModalOpen, setIsBatchHoldModalOpen] = useState(false);
  const [isBatchReleaseModalOpen, setIsBatchReleaseModalOpen] = useState(false);
  const [displayedSubBatches, setDisplayedSubBatches] = useState<SubBatchData[]>([]);
  const [loadingSubBatches, setLoadingSubBatches] = useState<boolean>(false);
  const [isFinalSortingOverviewModalOpen, setIsFinalSortingOverviewModalOpen] = useState<boolean>(false);

  // 搜索状态
  const [batchCodeSearchTerm, setBatchCodeSearchTerm] = useState<string>('');
  const [stationSearchTerm, setStationSearchTerm] = useState<string>('');

  // 状态筛选状态
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 标签页状态
  const [activeTab, setActiveTab] = useState<'inProcess' | 'temporary'>('inProcess');

  // 使用 useMemo 过滤在制批次列表
  const filteredBatchList = useMemo(() => {
    // **新增防御性检查**
    if (!Array.isArray(batchList)) {
      console.error('batchList is not an array, returning empty array for filter:', batchList);
      return []; // 返回一个空数组以防止崩溃
    }

    return (batchList || []).filter(batch => {
      // CRITICAL: 确保 'batch' 本身是一个有效的对象，然后才能访问其属性
      if (!batch || typeof batch !== 'object') {
        console.warn('Skipping invalid batch object (undefined or null) in batchList:', batch);
        return false;
      }

      // 排除所有暂存状态的批次
      if (batch.status === '暂存') {
        return false;
      }

      // 根据 statusFilter 过滤 isHold 属性
      // 确保 batch.isHold 是一个布尔值，如果 undefined 则默认为 false
      const isHold = typeof batch.isHold === 'boolean' ? batch.isHold : false;
      if (statusFilter === 'flowing' && isHold) {
        return false;
      }
      if (statusFilter === 'hold' && !isHold) {
        return false;
      }

      // 根据搜索词过滤 batchCode
      // 确保 batch.batchCode 是一个字符串，如果 undefined 则默认为空字符串
      const batchCode = typeof batch.batchCode === 'string' ? batch.batchCode : '';
      const matchesBatchCode = batchCode.toLowerCase().includes(batchCodeSearchTerm.toLowerCase());

      // 确保 batch.stationName 存在且为字符串
      const batchStationName = typeof batch.stationName === 'string' ? batch.stationName : '';
      // 确保 stationSearchTerm 也是字符串
      const currentStationSearchTerm = typeof stationSearchTerm === 'string' ? stationSearchTerm : '';

      const matchesStation = currentStationSearchTerm === 'all' || currentStationSearchTerm === ''
        ? true
        : batchStationName.toLowerCase().includes(currentStationSearchTerm.toLowerCase());

      return matchesBatchCode && matchesStation;
    });
  }, [batchList, batchCodeSearchTerm, stationSearchTerm, statusFilter]);

  // 使用 useMemo 过滤暂存在制批次列表
  const temporaryBatchesList = useMemo(() => {
    return (batchList || []).filter(batch => {
      // 同样对 batch 对象进行有效性检查
      if (!batch || typeof batch !== 'object') {
        console.warn('Skipping invalid batch object in temporaryBatchesList:', batch);
        return false;
      }

      // 只包含暂存状态的批次
      if (batch.status !== '暂存') {
        return false;
      }

      // 根据搜索词过滤 batchCode
      const batchCode = typeof batch.batchCode === 'string' ? batch.batchCode : '';
      const matchesBatchCode = batchCode.toLowerCase().includes(batchCodeSearchTerm.toLowerCase());

      // 对 stationName 进行类型检查
      const batchStationName = typeof batch.stationName === 'string' ? batch.stationName : '';
      const currentStationSearchTerm = typeof stationSearchTerm === 'string' ? stationSearchTerm : '';

      const matchesStation = currentStationSearchTerm === 'all' || currentStationSearchTerm === ''
        ? true
        : batchStationName.toLowerCase().includes(currentStationSearchTerm.toLowerCase());

      return matchesBatchCode && matchesStation;
    });
  }, [batchList, batchCodeSearchTerm, stationSearchTerm]);

  // 根据 activeTab 动态选择要显示的批次列表
  const currentBatchList = useMemo(() => {
    return activeTab === 'inProcess' ? filteredBatchList : temporaryBatchesList;
  }, [activeTab, filteredBatchList, temporaryBatchesList]);

  // 修改此 useEffect 钩子，使其在组件挂载时不默认选中任何批次
  useEffect(() => {
    console.log('BatchListPage useEffect triggered. batchList length:', batchList?.length);
    setSelectedMasterBatchId(null);
    setDisplayedSubBatches([]);
  }, [batchList]);

  // 处理标签页切换
  const handleTabSwitch = (tab: 'inProcess' | 'temporary') => {
    setActiveTab(tab);
    // 切换标签页时重置选择
    setSelectedMasterBatchId(null);
    setDisplayedSubBatches([]);
    setCheckedSubBatchIds([]);
    setCheckedMasterBatchIds([]);
  };

  // 新增：切换单个主批次的批量Hold勾选态
  const handleToggleMasterBatchChecked = (batchId: string) => {
    setCheckedMasterBatchIds(prev =>
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    );
  };

  // 新增：全选/取消全选当前列表的主批次
  const handleToggleAllMasterBatchesChecked = () => {
    if (checkedMasterBatchIds.length === currentBatchList.length) {
      setCheckedMasterBatchIds([]);
    } else {
      setCheckedMasterBatchIds(currentBatchList.map(b => b.id));
    }
  };

  // 新增：批量Hold/Release弹窗确认后的公共收尾逻辑
  const handleBatchHoldOrReleaseConfirmed = async () => {
    setIsBatchHoldModalOpen(false);
    setIsBatchReleaseModalOpen(false);
    setCheckedMasterBatchIds([]);
    await fetchBatches();
  };

  // 处理主批次行点击
  const handleMasterRowClick = async (batchId: string) => {
    console.log('DEBUG: handleMasterRowClick called with batchId:', batchId);
    console.log('Master batch row clicked:', batchId);
    console.log('BatchListPage: Master batch selected:', batchId);
    setSelectedMasterBatchId(batchId);
    setLoadingSubBatches(true);
    try {
      const subBatches = await getSubBatchesForMaster(batchId);
      setDisplayedSubBatches(subBatches);
      console.log('Displayed subBatches for', batchId, ':', subBatches);
      setCheckedSubBatchIds([]);
    } catch (error) {
      console.error('Failed to load sub-batches:', error);
      setDisplayedSubBatches([]);
    } finally {
      setLoadingSubBatches(false);
    }
  };

  // 处理子批次复选框变化
  const handleSubBatchCheckboxChange = (sublotId: string) => {
    if (checkedSubBatchIds.includes(sublotId)) {
      setCheckedSubBatchIds(checkedSubBatchIds.filter(id => id !== sublotId));
    } else {
      setCheckedSubBatchIds([...checkedSubBatchIds, sublotId]);
    }
  };

  // 修改 handlePassStation 函数，增加对打标站点的判断
  const handlePassStation = () => {
    if (selectedMasterBatchId) {
      const foundBatch = batchList.find(batch => batch.id === selectedMasterBatchId);
      if (foundBatch) {
        onSelectBatch(foundBatch);
      }
    }
  };

  // 处理进站取消操作
  const handleCancelEntry = () => {
    if (selectedMasterBatchId) {
      const foundBatch = batchList.find(batch => batch.id === selectedMasterBatchId);
      if (foundBatch) {
        onCancelEntry(foundBatch);
      }
    }
  };

  // 处理并批操作
  const handleMergeBatch = () => {
    if (selectedMasterBatchId) {
      const foundBatch = batchList.find(batch => batch.id === selectedMasterBatchId);
      if (foundBatch) {
        onMergeBatch(foundBatch);
      }
    }
  };

  // 处理转档操作
  const handleTransferBatch = () => {
    if (selectedMasterBatchId) {
      const foundBatch = batchList.find(batch => batch.id === selectedMasterBatchId);
      if (foundBatch) {
        onTransferBatch(foundBatch);
      }
    }
  };

  // 处理攒批操作
  const handleAccumulateBatch = () => {
    if (selectedMasterBatchId) {
      const foundBatch = batchList.find(batch => batch.id === selectedMasterBatchId);
      if (foundBatch) {
        onAccumulateBatch(foundBatch, activeTab === 'temporary');
      }
    }
  };

  // 处理移出暂存区操作
  const handleMoveOutOfStaging = () => {
    if (selectedMasterBatchId) {
      const foundBatch = batchList.find(batch => batch.id === selectedMasterBatchId);
      if (foundBatch) {
        setSelectedBatch(foundBatch);
        setCurrentFormType('moveOutOfStaging');
      }
    }
  };

  // 处理并盘操作
  const handleCombineTrayBatch = () => {
    console.log('BatchListPage: "并盘操作" button clicked.');
    if (selectedMasterBatchId) {
      const foundBatch = batchList.find(batch => batch.id === selectedMasterBatchId);
      if (foundBatch) {
        console.log('BatchListPage: Calling onCombineTrayBatch with batch:', foundBatch);
        onCombineTrayBatch(foundBatch);
      }
    }
  };

  // 处理拆批操作
  const handleSplitBatch = () => {
    if (selectedMasterBatchId) {
      const foundBatch = batchList.find(batch => batch.id === selectedMasterBatchId);
      if (foundBatch) {
        onSplitBatch(foundBatch);
      }
    }
  };

  // 处理不良品录入操作
  const handleDefectEntryClick = () => {
    if (selectedMasterBatchId) {
      const foundBatch = batchList.find(batch => batch.id === selectedMasterBatchId);
      if (foundBatch) {
        onDefectEntry(foundBatch);
      }
    }
  };

  // 处理不良品录入取消操作
  const handleCancelDefectEntryClick = () => {
    if (selectedMasterBatchId) {
      const foundBatch = batchList.find(batch => batch.id === selectedMasterBatchId);
      if (foundBatch) {
        onCancelDefectEntry(foundBatch);
      }
    }
  };

  // 处理切入子路径操作
  const handleCutIntoSubpath = () => {
    console.log('BatchListPage: "切入子路径" button clicked.');
    if (selectedMasterBatchId) {
      const foundBatch = batchList.find(batch => batch.id === selectedMasterBatchId);
      if (foundBatch) {
        console.log('BatchListPage: Calling onCutIntoSubpath with batch:', foundBatch);
        onCutIntoSubpath(foundBatch);
      }
    }
  };

  // 处理片篮更换操作 - 修改后的逻辑
  const handleCarrierChange = () => {
    console.log('BatchListPage: "片篮更换" button clicked.');

    let selectedSubBatchesToPass: SubBatchData[] = [];

    // 情况1：用户勾选了具体的子批次
    if (checkedSubBatchIds.length > 0) {
      selectedSubBatchesToPass = displayedSubBatches.filter(
        subBatch => checkedSubBatchIds.includes(subBatch.sublotId)
      );
    }
    // 情况2：用户没有勾选子批次，但选中了主批次
    else if (selectedMasterBatchId !== null) {
      selectedSubBatchesToPass = displayedSubBatches;
    }
    // 情况3：既没有勾选子批次，也没有选中主批次
    else {
      alert('请选择要操作的子批次或选中一个主批次');
      return;
    }

    // 检查是否有可操作的子批次
    if (selectedSubBatchesToPass.length === 0) {
      alert('请选择要操作的子批次或选中一个主批次');
      return;
    }

    console.log('BatchListPage: Calling onCarrierChange with selectedSubBatchesToPass:', selectedSubBatchesToPass);
    onCarrierChange(selectedSubBatchesToPass);
  };

  // 处理腐后目检配平操作
  const handlePostEtchInspectionBalanceClick = () => {
    if (selectedMasterBatchId) {
      const foundBatch = batchList.find(batch => batch.id === selectedMasterBatchId);
      if (foundBatch) {
        onPostEtchInspectionBalance(foundBatch);
      }
    }
  };

  // 处理量测数据录入操作
  const handleMeasurementEntryClick = () => {
    console.log('BatchListPage: "量测数据录入" button clicked.');
    if (selectedMasterBatchId) {
      const foundBatch = batchList.find(batch => batch.id === selectedMasterBatchId);
      if (foundBatch) {
        onMeasurementEntry(foundBatch);
      }
    }
  };

  // 处理制程数据录入操作
  const handleProcessEntryClick = () => {
    console.log('BatchListPage: "制程数据录入" button clicked.');
    if (selectedMasterBatchId) {
      const foundBatch = batchList.find(batch => batch.id === selectedMasterBatchId);
      if (foundBatch) {
        onProcessEntry(foundBatch);
      }
    }
  };

  // 新增：处理批次备注操作
  const handleBatchRemarksClick = () => {
    console.log('BatchListPage: "批次备注" button clicked.');
    if (selectedMasterBatchId) {
      const foundBatch = batchList.find(batch => batch.id === selectedMasterBatchId);
      if (foundBatch) {
        onOpenBatchRemarks(foundBatch);
      }
    }
  };

  // 新增：处理批次Q-Time剩余查询操作
  const handleQTimeRemainingClick = () => {
    console.log('BatchListPage: "Q-Time剩余" button clicked.');
    if (selectedMasterBatchId) {
      const foundBatch = batchList.find(batch => batch.id === selectedMasterBatchId);
      if (foundBatch) {
        console.log('BatchListPage: Calling onOpenQTimeRemaining with batch:', foundBatch);
        onOpenQTimeRemaining(foundBatch);
      } else {
        // 如果没有选中批次，也可以打开Q-Time查询，但不需要传递批次信息
        onOpenQTimeRemaining();
      }
    } else {
      // 如果没有选中批次，也可以打开Q-Time查询
      onOpenQTimeRemaining();
    }
  };

  // 处理打开最终分选参数总览模态框
  const handleOpenFinalSortingOverviewModal = async () => {
    if (!selectedMasterBatchId) {
      alert('请先选择一个批次。');
      return;
    }
    await fetchAggregatedWaferData(selectedMasterBatchId);
    setIsFinalSortingOverviewModalOpen(true);
  };

  // 获取选中对象的描述
  const getSelectionDescription = () => {
    if (checkedSubBatchIds.length > 0) {
      return `已选择 ${checkedSubBatchIds.length} 个子批次`;
    } else if (selectedMasterBatchId) {
      const batch = batchList.find(b => b.id === selectedMasterBatchId);
      return `已选择主批次: ${batch?.batchCode}`;
    }
    return '未选择任何批次';
  };

  // 检查过站按钮是否可用
  // 注：'加工中' 也需要放开——handleSelectBatch 已经支持把 '加工中' 状态的批次
  // 路由到打标出站/各检验站点表单/包装出站表单，但此前这里没有对应放开，导致
  // 这些站点在 UI 上永远无法通过"进/出站"按钮进入。
  const isPassStationEnabled = selectedMasterBatchId !== null &&
  (batchList.find(b => b.id === selectedMasterBatchId)?.status === '待出站' ||
   batchList.find(b => b.id === selectedMasterBatchId)?.status === '待进站' ||
   batchList.find(b => b.id === selectedMasterBatchId)?.status === '加工中');

  // 检查出站按钮是否可用
  const isOutstationEnabled = selectedMasterBatchId !== null || checkedSubBatchIds.length > 0;

  // 检查进站取消按钮是否可用
  const isCancelEntryEnabled = selectedMasterBatchId !== null && batchList.find(b => b.id === selectedMasterBatchId);

  // 检查并批操作按钮是否可用
  const isMergeBatchEnabled = selectedMasterBatchId !== null && batchList.find(b => b.id === selectedMasterBatchId);

  // 检查转档操作按钮是否可用
  const isTransferBatchEnabled = selectedMasterBatchId !== null && batchList.find(b => b.id === selectedMasterBatchId);

  // 检查攒批操作按钮是否可用
  const isAccumulateBatchEnabled = selectedMasterBatchId !== null && batchList.find(b => b.id === selectedMasterBatchId);

  // 检查并盘操作按钮是否可用
  const isCombineTrayBatchEnabled = selectedMasterBatchId !== null && batchList.find(b => b.id === selectedMasterBatchId);

  console.log('BatchListPage: isCombineTrayBatchEnabled:', isCombineTrayBatchEnabled, 'selectedMasterBatchId:', selectedMasterBatchId);

  // 检查拆批操作按钮是否可用
  const isSplitBatchEnabled = selectedMasterBatchId !== null && batchList.find(b => b.id === selectedMasterBatchId);

  // 检查不良品录入按钮是否可用
  const isDefectEntryEnabled = selectedMasterBatchId !== null && batchList.find(b => b.id === selectedMasterBatchId);

  // 检查不良品录入取消按钮是否可用
  const isCancelDefectEntryEnabled = selectedMasterBatchId !== null && batchList.find(b => b.id === selectedMasterBatchId);

  // 检查切入子路径按钮是否可用
  const isCutIntoSubpathEnabled = selectedMasterBatchId !== null;

  // 检查片篮更换按钮是否可用 - 修改后的逻辑
  const isCarrierChangeEnabled = selectedMasterBatchId !== null || checkedSubBatchIds.length > 0;

  // 检查腐后目检配平按钮是否可用 - 需选中批次且当前站点为"目检"
  const isPostEtchInspectionBalanceEnabled = selectedMasterBatchId !== null &&
    batchList.find(b => b.id === selectedMasterBatchId)?.stationName === '目检';

  // 检查量测数据录入按钮是否可用 - 修改后的逻辑
  const isMeasurementEntryEnabled = selectedMasterBatchId !== null &&
    ['加工中', '待出站'].includes(batchList.find(b => b.id === selectedMasterBatchId)?.status || '');

  // 检查制程数据录入按钮是否可用 - 修改后的逻辑
  const isProcessEntryEnabled = selectedMasterBatchId !== null &&
    ['加工中', '待出站'].includes(batchList.find(b => b.id === selectedMasterBatchId)?.status || '');

  // 新增：检查批次备注按钮是否可用
  const isBatchRemarksEnabled = selectedMasterBatchId !== null;

  // 新增：检查批次Q-Time剩余查询按钮是否可用 - 总是可用
  const isQTimeRemainingEnabled = true;

  // 检查最终分选参数总览按钮是否可用
  const isFinalSortingOverviewEnabled = useMemo(() => {
    console.log('DEBUG: isFinalSortingOverviewEnabled re-evaluating.');
    if (!selectedMasterBatchId) {
      console.log('DEBUG: selectedMasterBatchId is null, returning false.');
      return false;
    }
    const currentSelectedBatch = batchList.find(b => b.id === selectedMasterBatchId);
    if (!currentSelectedBatch) {
      console.log('DEBUG: currentSelectedBatch not found for ID:', selectedMasterBatchId, 'returning false.');
      return false;
    }
    // CRITICAL CHANGE: 更新 inspectionStations 数组以匹配后端返回的站点名称
    const inspectionStations = ['几何参数检验', '颗粒检测', '目检'];
    const isEnabled = inspectionStations.includes(currentSelectedBatch.station);
    console.log('DEBUG: currentSelectedBatch.station:', currentSelectedBatch.station, 'Is in inspectionStations:', isEnabled);
    return isEnabled;
  }, [selectedMasterBatchId, batchList]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="w-full mx-auto">
        <div className="grid grid-cols-[5fr_1.2fr] gap-4">
          {/* 左侧区域 (4/5宽度) */}
          <div>
            {/* 标签页导航 */}
            <div className="mb-4">
              <div className="border-b border-gray-200 flex items-center justify-between">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => handleTabSwitch('inProcess')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === 'inProcess'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    在制批次 ({filteredBatchList.length})
                  </button>
                  <button
                    onClick={() => handleTabSwitch('temporary')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === 'temporary'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    暂存在制批次 ({temporaryBatchesList.length})
                  </button>
                </nav>
                <div className="flex items-center gap-2 mb-1">
                  {activeTab === 'inProcess' && (
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="text-xs border border-gray-300 rounded-md px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">全部批次</option>
                      <option value="flowing">仅看流转中</option>
                      <option value="hold">仅看已Hold</option>
                    </select>
                  )}
                  <button
                    onClick={() => setIsDocumentationModalOpen(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                    文档
                  </button>
                </div>
              </div>
            </div>

            {/* 主批次列表 - 根据 activeTab 动态选择批次列表 */}
            <MasterBatchTable
              filteredBatchList={currentBatchList}
              selectedMasterBatchId={selectedMasterBatchId}
              handleMasterRowClick={handleMasterRowClick}
              getStatusColor={getStatusColor}
              showStatusColumn={activeTab === 'inProcess'}
              showDefectDisposalColumn={activeTab === 'temporary'}
              checkedBatchIds={activeTab === 'inProcess' ? checkedMasterBatchIds : undefined}
              onToggleBatchChecked={activeTab === 'inProcess' ? handleToggleMasterBatchChecked : undefined}
              onToggleAllChecked={activeTab === 'inProcess' ? handleToggleAllMasterBatchesChecked : undefined}
            />

            {/* 子批次列表 - 根据 selectedMasterBatchId 的状态进行渲染 */}
            {selectedMasterBatchId ? (
              <SubBatchTable
                displayedSubBatches={displayedSubBatches}
                loadingSubBatches={loadingSubBatches}
                checkedSubBatchIds={checkedSubBatchIds}
                handleSubBatchCheckboxChange={handleSubBatchCheckboxChange}
                getStatusColor={getStatusColor}
                selectedMasterBatchId={selectedMasterBatchId}
                batchList={batchList}
                showStatusColumn={activeTab === 'inProcess'}
                showDefectDisposalColumn={activeTab === 'temporary'}
              />
            ) : (
              /* 当没有选中主批次时显示的提示 */
              <div className="mt-6 text-center text-gray-500">
                <p>
                  {activeTab === 'inProcess' 
                    ? '请选择一个在制批次以查看其子批次信息' 
                    : '请选择一个暂存批次以查看其子批次信息'}
                </p>
              </div>
            )}
          </div>

          {/* 右侧操作区域 (1/4宽度) */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-medium text-gray-800 mb-4">操作</h2>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">{getSelectionDescription()}</p>
              </div>

              {activeTab === 'inProcess' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handlePassStation}
                    disabled={!isPassStationEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isPassStationEnabled
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    进/出站
                  </button>

                  <button
                    onClick={handleCancelEntry}
                    disabled={!isCancelEntryEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
                      isCancelEntryEnabled
                        ? 'text-white bg-yellow-600 hover:bg-yellow-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    进站取消
                  </button>

                  <button
                    onClick={handleMeasurementEntryClick}
                    disabled={!isMeasurementEntryEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                      isMeasurementEntryEnabled
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    量测数据录入
                  </button>

                  <button
                    onClick={handleProcessEntryClick}
                    disabled={!isProcessEntryEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      isProcessEntryEnabled
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    制程数据录入
                  </button>

                  <button
                    onClick={handleQTimeRemainingClick}
                    disabled={!isQTimeRemainingEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
                      isQTimeRemainingEnabled
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    Q-Time剩余
                  </button>

                  <button
                    onClick={handleDefectEntryClick}
                    disabled={!isDefectEntryEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                      isDefectEntryEnabled
                        ? 'text-white bg-red-600 hover:bg-red-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    不良录入
                  </button>

                  <button
                    onClick={handleCutIntoSubpath}
                    disabled={!isCutIntoSubpathEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                      isCutIntoSubpathEnabled
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    切入子路径
                  </button>

                  <button
                    onClick={handleSplitBatch}
                    disabled={!isSplitBatchEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isSplitBatchEnabled
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    拆批操作
                  </button>

                  <button
                    onClick={handleMergeBatch}
                    disabled={!isMergeBatchEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isMergeBatchEnabled
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    并批操作
                  </button>

                  <button
                    onClick={handleAccumulateBatch}
                    disabled={!isAccumulateBatchEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isAccumulateBatchEnabled
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    攒批操作
                  </button>

                  <button
                    onClick={onAutoAccumulateBatch}
                    className="w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 text-white bg-emerald-600 hover:bg-emerald-700"
                  >
                    自动攒批
                  </button>

                  <button
                    onClick={handleBatchRemarksClick}
                    disabled={!isBatchRemarksEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
                      isBatchRemarksEnabled
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    批次备注
                  </button>

                  <button
                    onClick={handleCarrierChange}
                    disabled={!isCarrierChangeEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isCarrierChangeEnabled
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    片篮更换
                  </button>

                  <button
                    onClick={handlePostEtchInspectionBalanceClick}
                    disabled={!isPostEtchInspectionBalanceEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 ${
                      isPostEtchInspectionBalanceEnabled
                        ? 'text-white bg-cyan-600 hover:bg-cyan-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    腐后目检配平
                  </button>

                  <button
                    onClick={handleTransferBatch}
                    disabled={!isTransferBatchEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isTransferBatchEnabled
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    转档操作
                  </button>

                  <button
                    onClick={handleCancelDefectEntryClick}
                    disabled={!isCancelDefectEntryEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                      isCancelDefectEntryEnabled
                        ? 'text-white bg-red-600 hover:bg-red-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    不良录入取消
                  </button>

                  <button
                    onClick={handleOpenFinalSortingOverviewModal}
                    disabled={!isFinalSortingOverviewEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isFinalSortingOverviewEnabled
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    最终分选总览
                  </button>

                  <button
                    onClick={() => setIsBatchHoldModalOpen(true)}
                    disabled={checkedMasterBatchIds.length === 0}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                      checkedMasterBatchIds.length > 0
                        ? 'text-white bg-red-600 hover:bg-red-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    批量扣留（{checkedMasterBatchIds.length}）
                  </button>

                  <button
                    onClick={() => setIsBatchReleaseModalOpen(true)}
                    disabled={checkedMasterBatchIds.length === 0}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                      checkedMasterBatchIds.length > 0
                        ? 'text-white bg-green-600 hover:bg-green-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    批量释放（{checkedMasterBatchIds.length}）
                  </button>
                </div>
              ) : (
                /* 暂存在制批次标签页：移出暂存区、拆批、攒批 */
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleMoveOutOfStaging}
                    disabled={!selectedMasterBatchId}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${
                      selectedMasterBatchId
                        ? 'text-white bg-amber-500 hover:bg-amber-600'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    移出暂存区
                  </button>

                  <button
                    onClick={handleDefectEntryClick}
                    disabled={!isDefectEntryEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                      isDefectEntryEnabled
                        ? 'text-white bg-red-600 hover:bg-red-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    不良录入
                  </button>

                  <button
                    onClick={handleSplitBatch}
                    disabled={!isSplitBatchEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isSplitBatchEnabled
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    拆批操作
                  </button>

                  <button
                    onClick={handleAccumulateBatch}
                    disabled={!isAccumulateBatchEnabled}
                    className={`w-full flex justify-center items-center px-2 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isAccumulateBatchEnabled
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    }`}
                  >
                    攒批操作
                  </button>
                </div>
              )}

            </div>
          </div> 
        </div>
      </div>

      {/* 最终分选参数总览模态框 */}
      <FinalSortingOverviewModal
        isOpen={isFinalSortingOverviewModalOpen}
        onClose={() => setIsFinalSortingOverviewModalOpen(false)}
        wafers={aggregatedWafersForOverview}
        selectedBatch={selectedBatch}
        isAggregatedDataLoading={isAggregatedDataLoading}
      />

      {/* 新增：批量扣留 / 批量释放模态框 */}
      <BatchHoldModal
        isOpen={isBatchHoldModalOpen}
        batchIds={checkedMasterBatchIds}
        onClose={() => setIsBatchHoldModalOpen(false)}
        onConfirmed={handleBatchHoldOrReleaseConfirmed}
      />
      <BatchReleaseModal
        isOpen={isBatchReleaseModalOpen}
        batchIds={checkedMasterBatchIds}
        onClose={() => setIsBatchReleaseModalOpen(false)}
        onConfirmed={handleBatchHoldOrReleaseConfirmed}
      />

      {/* 新增：片篮重组模块功能说明模态框 - 已整合至系统说明文档 */}
    </div>
  );
};

export default BatchListPage;

