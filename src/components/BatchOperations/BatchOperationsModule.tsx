// BatchOperationsModule.tsx
// 批次作业模块入口 —— 整合自 project 6 的 App.tsx
// 移除了独立应用的 navbar，直接嵌入到 project 4 的主布局中。

import React, { useState } from 'react';
import { GitMerge, Ruler, Cpu } from 'lucide-react';
import { BatchOperationsProvider, useBatchOperations } from './contexts/BatchOperationsContext';
import BatchListPage from './components/BatchListPage';
import BatchSelectionModal from './components/BatchSelectionModal';
import EquipmentStationInfo from './components/EquipmentStationInfo';
import BatchInfoDisplay from './components/BatchInfoDisplay';
import AccumulateBatchForm from './components/AccumulateBatchForm';
import CombineTrayBatchForm from './components/CombineTrayBatchForm';
import OutstationForm from './components/OutstationForm';
import SplitBatchForm from './components/SplitBatchForm';
import InstationForm from './components/InstationForm';
import MarkingStationForm from './components/MarkingStationForm';
import DefectEntryForm from './components/DefectEntryForm';
import CancelDefectEntryForm from './components/CancelDefectEntryForm';
import DocumentationModal from './components/DocumentationModal';
import CutIntoSubpathForm from './components/CutIntoSubpathForm';
import CarrierChangeForm from './components/CarrierChangeForm';
import PostEtchInspectionBalanceForm, { PostEtchInspectionBalanceStepIndicator } from './components/PostEtchInspectionBalanceForm';
import MeasurementParameters from './components/MeasurementParameters';
import ProcessParameters from './components/ProcessParameters';
import BatchRemarksForm from './components/BatchRemarksForm';
import BatchQTimeRemainingForm from './components/BatchQTimeRemainingForm';
import BatchOperationModal from './components/BatchOperationModal';
import MoveOutOfStagingForm from './components/MoveOutOfStagingForm';
import AutoAccumulateBatchForm from './components/AutoAccumulateBatchForm';

function BatchOperationsContent() {
  const batchOperationsContext = useBatchOperations();

  const {
    batchList,
    isLoading,
    error,
    currentFormType,
    selectedBatch,
    displayedFormSubBatches,
    setDisplayedFormSubBatches,
    cancellationReason,
    targetBatchCode,
    isMergeTargetModalOpen,
    isDocumentationModalOpen,
    wafersForCurrentForm,
    currentBatchRemarks,
    allStations,
    isQTimeRemainingModalOpen,
    setIsQTimeRemainingModalOpen,

    handleCombineTrayBatch,
    handleInstation,
    handleSelectBatch,
    handleCancelEntry,
    handleMergeBatch,
    handleTransferBatch,
    handleAccumulateBatch,
    handleSplitBatch,
    handleMarkingStation,
    handleDefectEntry,
    handleCancelDefectEntry,
    handleCutIntoSubpath,
    handleCarrierChange,
    handlePostEtchInspectionBalance,
    handleMeasurementEntry,
    handleProcessEntry,
    handleOpenBatchRemarksModal,
    handleSaveBatchRemarks,
    handleOpenQTimeRemaining,
    handleConfirmSplit: handleConfirmSplitFromContext,
    handleBackToBatchList,
    handleConfirmCancelEntry: handleConfirmCancelEntryFromContext,
    handleConfirmMergeBatch: handleConfirmMergeBatchFromContext,
    handleConfirmWaferTransfer: handleConfirmWaferTransferFromContext,
    handleConfirmCarrierChange: handleConfirmCarrierChangeFromContext,
    handleConfirmPostEtchInspectionBalance: handleConfirmPostEtchInspectionBalanceFromContext,
    handleOpenMergeTargetModal,
    handleCloseMergeTargetModal,
    handleSelectMergeTargetBatch,
    setIsDocumentationModalOpen: setDocModalOpen,
    setCancellationReason,
    getSubBatchesForMaster,
    getStatusColor,
    handleParameterChangeInForm,
    handleAutoFillParameterInForm,
    handleWafersUpdateInForm,
  } = batchOperationsContext;

  const isFormOpen = currentFormType !== 'none';

  // 「腐后目检配平」步骤条状态：镜像表单内部步骤，供弹窗表头展示
  const [postEtchStep, setPostEtchStep] = useState<1 | 2>(1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <p className="text-lg text-gray-700">加载批次数据中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50">
        <p className="text-lg text-red-700">加载数据失败: {error}</p>
        <button onClick={() => window.location.reload()} className="ml-4 px-4 py-2 bg-red-600 text-white rounded">重试</button>
      </div>
    );
  }

  // ── 表单标题映射 ───────────────────────────────────────────
  const formTitles: Record<string, string> = {
    instation:        '进站操作',
    cancelEntry:      '进站取消',
    outstation:       '出站操作',
    splitBatch:       '拆批操作',
    mergeBatch:       '并批操作',
    accumulateBatch:     '攒批操作',
    autoAccumulateBatch: '自动攒批',
    combineTrayBatch:    '并盘操作',
    markingStation:   '打标出站',
    defectEntry:      '不良品录入',
    cancelDefectEntry:'不良品录入取消',
    cutIntoSubpath:   '切入子路径',
    carrierChange:    '片篮更换',
    postEtchInspectionBalance: '腐后目检配平',
    measurementEntry: '量测数据录入',
    processEntry:     '制程数据录入',
    batchRemarks:     '批次备注',
    moveOutOfStaging: '移出暂存区',
  };

  return (
    <div>
      {/* ── 批次列表（始终可见） ─────────────────────────────── */}
      <BatchListPage
        onSelectBatch={handleSelectBatch}
        onCancelEntry={handleCancelEntry}
        onMergeBatch={handleMergeBatch}
        onTransferBatch={handleTransferBatch}
        onAccumulateBatch={handleAccumulateBatch}
        onAutoAccumulateBatch={() => batchOperationsContext.setCurrentFormType('autoAccumulateBatch')}
        onCombineTrayBatch={handleCombineTrayBatch}
        onSplitBatch={handleSplitBatch}
        onInstation={handleInstation}
        onDefectEntry={handleDefectEntry}
        onCancelDefectEntry={handleCancelDefectEntry}
        onCutIntoSubpath={handleCutIntoSubpath}
        onCarrierChange={handleCarrierChange}
        onPostEtchInspectionBalance={handlePostEtchInspectionBalance}
        onMeasurementEntry={handleMeasurementEntry}
        onProcessEntry={handleProcessEntry}
        onOpenBatchRemarks={handleOpenBatchRemarksModal}
        onOpenQTimeRemaining={handleOpenQTimeRemaining}
        getSubBatchesForMaster={getSubBatchesForMaster}
        getStatusColor={getStatusColor}
      />

      {/* ══════════════ 操作表单弹框区域 ══════════════ */}

      {/* 进站操作 */}
      <BatchOperationModal
        isOpen={currentFormType === 'instation'}
        title="进站操作"
        onClose={handleBackToBatchList}
      >
        <InstationForm
          selectedBatch={selectedBatch}
          displayedFormSubBatches={displayedFormSubBatches}
          getSubBatchesForMaster={getSubBatchesForMaster}
          getStatusColor={getStatusColor}
          handleBackToBatchList={handleBackToBatchList}
        />
      </BatchOperationModal>

      {/* 进站取消 */}
      <BatchOperationModal
        isOpen={currentFormType === 'cancelEntry'}
        title="进站取消"
        onClose={handleBackToBatchList}
      >
        <div className="p-6 space-y-4">
          <EquipmentStationInfo selectedBatch={selectedBatch} />
          <BatchInfoDisplay
            selectedBatch={selectedBatch}
            getSubBatchesForMaster={getSubBatchesForMaster}
            getStatusColor={getStatusColor}
            subBatches={displayedFormSubBatches}
          />
          <div>
            <h2 className="text-base font-medium mb-2 text-gray-700">取消原因录入</h2>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
              placeholder="请输入取消原因..."
            />
          </div>
          <div className="flex justify-end pt-2 border-t">
            <button
              onClick={handleConfirmCancelEntryFromContext}
              disabled={!cancellationReason}
              className={`px-6 py-2 rounded-md text-sm font-medium ${cancellationReason ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              确认取消
            </button>
          </div>
        </div>
      </BatchOperationModal>

      {/* 出站操作 */}
      <BatchOperationModal
        isOpen={currentFormType === 'outstation'}
        title="出站操作"
        onClose={handleBackToBatchList}
      >
        <OutstationForm
          selectedBatch={selectedBatch}
          displayedFormSubBatches={displayedFormSubBatches}
          getSubBatchesForMaster={getSubBatchesForMaster}
          getStatusColor={getStatusColor}
          handleBackToBatchList={handleBackToBatchList}
          handleConfirmOutstation={batchOperationsContext.handleConfirmOutstation}
          currentBatchRemarks={currentBatchRemarks}
          currentFormType={currentFormType}
          onSubBatchesUpdated={setDisplayedFormSubBatches}
        />
      </BatchOperationModal>

      {/* 拆批操作 */}
      <BatchOperationModal
        isOpen={currentFormType === 'splitBatch'}
        title="拆批操作"
        onClose={handleBackToBatchList}
        maxWidth="max-w-7xl"
      >
        <SplitBatchForm
          selectedBatch={selectedBatch}
          displayedFormSubBatches={displayedFormSubBatches}
          getSubBatchesForMaster={getSubBatchesForMaster}
          getStatusColor={getStatusColor}
          handleBackToBatchList={handleBackToBatchList}
          onConfirmSplit={handleConfirmSplitFromContext}
        />
      </BatchOperationModal>

      {/* 并批操作 */}
      <BatchOperationModal
        isOpen={currentFormType === 'mergeBatch'}
        title="并批操作"
        onClose={handleBackToBatchList}
      >
        <div className="p-6 space-y-6">
          <EquipmentStationInfo selectedBatch={selectedBatch} />
          <BatchInfoDisplay
            selectedBatch={selectedBatch}
            getSubBatchesForMaster={getSubBatchesForMaster}
            getStatusColor={getStatusColor}
            subBatches={displayedFormSubBatches}
          />
          <div>
            <h2 className="text-base font-medium text-gray-800 mb-3 flex items-center">
              <GitMerge className="w-4 h-4 mr-2 text-blue-600" />
              并批目标批次
            </h2>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={targetBatchCode}
                readOnly
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50"
                placeholder="请选择目标批次"
              />
              <button onClick={handleOpenMergeTargetModal} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                选择批次
              </button>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button onClick={handleBackToBatchList} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">取消</button>
            <button onClick={handleConfirmMergeBatchFromContext} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">确认并批</button>
          </div>
        </div>
      </BatchOperationModal>

      {/* 攒批操作 */}
      <BatchOperationModal
        isOpen={currentFormType === 'accumulateBatch'}
        title="攒批操作"
        onClose={handleBackToBatchList}
        maxWidth="max-w-7xl"
      >
        <AccumulateBatchForm
          handleBackToBatchList={handleBackToBatchList}
          getSubBatchesForMaster={getSubBatchesForMaster}
          getStatusColor={getStatusColor}
          isFromStaging={batchOperationsContext.isAccumulateFromStaging}
        />
      </BatchOperationModal>

      {/* 自动攒批 */}
      <BatchOperationModal
        isOpen={currentFormType === 'autoAccumulateBatch'}
        title="自动攒批"
        onClose={handleBackToBatchList}
        maxWidth="max-w-5xl"
      >
        <AutoAccumulateBatchForm
          handleBackToBatchList={handleBackToBatchList}
        />
      </BatchOperationModal>

      {/* 并盘操作 */}
      <BatchOperationModal
        isOpen={currentFormType === 'combineTrayBatch'}
        title="并盘操作"
        onClose={handleBackToBatchList}
        maxWidth="max-w-7xl"
      >
        <CombineTrayBatchForm
          handleBackToBatchList={handleBackToBatchList}
          getSubBatchesForMaster={getSubBatchesForMaster}
          getStatusColor={getStatusColor}
        />
      </BatchOperationModal>

      {/* 打标出站 */}
      <BatchOperationModal
        isOpen={currentFormType === 'markingStation'}
        title="打标出站"
        onClose={handleBackToBatchList}
        maxWidth="max-w-7xl"
      >
        <MarkingStationForm
          selectedBatch={selectedBatch}
          displayedFormSubBatches={displayedFormSubBatches}
          getSubBatchesForMaster={getSubBatchesForMaster}
          getStatusColor={getStatusColor}
          handleBackToBatchList={handleBackToBatchList}
        />
      </BatchOperationModal>

      {/* 不良品录入 */}
      <BatchOperationModal
        isOpen={currentFormType === 'defectEntry'}
        title="不良品录入"
        onClose={handleBackToBatchList}
        maxWidth="max-w-7xl"
      >
        <DefectEntryForm
          selectedBatch={selectedBatch}
          displayedFormSubBatches={displayedFormSubBatches}
          getSubBatchesForMaster={getSubBatchesForMaster}
          getStatusColor={getStatusColor}
          handleBackToBatchList={handleBackToBatchList}
          handleConfirmWaferTransfer={handleConfirmWaferTransferFromContext}
        />
      </BatchOperationModal>

      {/* 不良品录入取消 */}
      <BatchOperationModal
        isOpen={currentFormType === 'cancelDefectEntry'}
        title="不良品录入取消"
        onClose={handleBackToBatchList}
      >
        <CancelDefectEntryForm
          selectedBatch={selectedBatch}
          displayedFormSubBatches={displayedFormSubBatches}
          getSubBatchesForMaster={getSubBatchesForMaster}
          getStatusColor={getStatusColor}
          handleBackToBatchList={handleBackToBatchList}
        />
      </BatchOperationModal>

      {/* 切入子路径 */}
      <BatchOperationModal
        isOpen={currentFormType === 'cutIntoSubpath'}
        title="切入子路径"
        onClose={handleBackToBatchList}
      >
        <CutIntoSubpathForm
          selectedBatch={selectedBatch}
          displayedFormSubBatches={displayedFormSubBatches}
          getSubBatchesForMaster={getSubBatchesForMaster}
          getStatusColor={getStatusColor}
          handleBackToBatchList={handleBackToBatchList}
        />
      </BatchOperationModal>

      {/* 片篮更换 */}
      <BatchOperationModal
        isOpen={currentFormType === 'carrierChange'}
        title="片篮更换"
        onClose={handleBackToBatchList}
        maxWidth="max-w-7xl"
      >
        <CarrierChangeForm
          selectedBatch={selectedBatch}
          displayedFormSubBatches={displayedFormSubBatches}
          getSubBatchesForMaster={getSubBatchesForMaster}
          getStatusColor={getStatusColor}
          handleBackToBatchList={handleBackToBatchList}
          onConfirmCarrierChange={handleConfirmCarrierChangeFromContext}
        />
      </BatchOperationModal>

      {/* 腐后目检配平 */}
      <BatchOperationModal
        isOpen={currentFormType === 'postEtchInspectionBalance'}
        title="腐后目检配平"
        onClose={handleBackToBatchList}
        maxWidth="max-w-7xl"
        headerRight={<PostEtchInspectionBalanceStepIndicator step={postEtchStep} />}
      >
        <PostEtchInspectionBalanceForm
          selectedBatch={selectedBatch}
          displayedFormSubBatches={displayedFormSubBatches}
          getSubBatchesForMaster={getSubBatchesForMaster}
          getStatusColor={getStatusColor}
          handleBackToBatchList={handleBackToBatchList}
          onConfirm={handleConfirmPostEtchInspectionBalanceFromContext}
          onStepChange={setPostEtchStep}
        />
      </BatchOperationModal>

      {/* 量测数据录入 */}
      <BatchOperationModal
        isOpen={currentFormType === 'measurementEntry'}
        title="量测数据录入"
        onClose={handleBackToBatchList}
        maxWidth="max-w-7xl"
      >
        <div className="p-6 space-y-4">
          <EquipmentStationInfo selectedBatch={selectedBatch} />
          <BatchInfoDisplay
            selectedBatch={selectedBatch}
            getSubBatchesForMaster={getSubBatchesForMaster}
            getStatusColor={getStatusColor}
            subBatches={displayedFormSubBatches}
          />
          <MeasurementParameters
            selectedBatch={selectedBatch}
            displayedFormSubBatches={displayedFormSubBatches}
            wafers={wafersForCurrentForm}
            station={selectedBatch?.station || ''}
            onParameterChange={handleParameterChangeInForm}
            onAutoFillParameter={handleAutoFillParameterInForm}
            onWafersUpdate={handleWafersUpdateInForm}
          />
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button onClick={handleBackToBatchList} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">取消</button>
            <button
              onClick={handleBackToBatchList}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm flex items-center"
            >
              <Ruler className="w-4 h-4 mr-1" />
              确认录入
            </button>
          </div>
        </div>
      </BatchOperationModal>

      {/* 制程数据录入 */}
      <BatchOperationModal
        isOpen={currentFormType === 'processEntry'}
        title="制程数据录入"
        onClose={handleBackToBatchList}
        maxWidth="max-w-7xl"
      >
        <div className="p-6 space-y-4">
          <EquipmentStationInfo selectedBatch={selectedBatch} />
          <BatchInfoDisplay
            selectedBatch={selectedBatch}
            getSubBatchesForMaster={getSubBatchesForMaster}
            getStatusColor={getStatusColor}
            subBatches={displayedFormSubBatches}
          />
          <ProcessParameters
            selectedBatch={selectedBatch}
            displayedFormSubBatches={displayedFormSubBatches}
            wafers={wafersForCurrentForm}
            station={selectedBatch?.station || ''}
            onParameterChange={handleParameterChangeInForm}
            onAutoFillParameter={handleAutoFillParameterInForm}
            onWafersUpdate={handleWafersUpdateInForm}
          />
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button onClick={handleBackToBatchList} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">取消</button>
            <button
              onClick={handleBackToBatchList}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm flex items-center"
            >
              <Cpu className="w-4 h-4 mr-1" />
              确认录入
            </button>
          </div>
        </div>
      </BatchOperationModal>

      {/* 批次备注（自身已是 modal，保持不变） */}
      {currentFormType === 'batchRemarks' && (
        <BatchRemarksForm
          isOpen={currentFormType === 'batchRemarks'}
          onClose={handleBackToBatchList}
          selectedBatch={selectedBatch}
          displayedFormSubBatches={displayedFormSubBatches}
          getSubBatchesForMaster={getSubBatchesForMaster}
          getStatusColor={getStatusColor}
          currentBatchRemarks={currentBatchRemarks}
          onSaveBatchRemarks={handleSaveBatchRemarks}
        />
      )}

      {/* ── 其他辅助弹框 ────────────────────────────────────── */}

      {isMergeTargetModalOpen && (
        <BatchSelectionModal
          isOpen={isMergeTargetModalOpen}
          onClose={handleCloseMergeTargetModal}
          onSelect={handleSelectMergeTargetBatch}
          batches={batchList}
          currentBatchProductCode={selectedBatch?.productCode}
          currentBatchStation={selectedBatch?.station}
          currentBatchId={selectedBatch?.id}
        />
      )}

      {isDocumentationModalOpen && (
        <DocumentationModal
          isOpen={isDocumentationModalOpen}
          onClose={() => setDocModalOpen(false)}
        />
      )}

      {/* 移出暂存区 */}
      <BatchOperationModal
        isOpen={currentFormType === 'moveOutOfStaging'}
        title="移出暂存区"
        onClose={handleBackToBatchList}
      >
        <MoveOutOfStagingForm
          selectedBatch={selectedBatch}
          onConfirm={handleBackToBatchList}
          onCancel={handleBackToBatchList}
        />
      </BatchOperationModal>

      {isQTimeRemainingModalOpen && (
        <BatchQTimeRemainingForm
          isOpen={isQTimeRemainingModalOpen}
          onClose={() => setIsQTimeRemainingModalOpen(false)}
          allStations={allStations}
          selectedBatchStation={selectedBatch?.station}
          batchList={batchList}
        />
      )}
    </div>
  );
}


export default function BatchOperationsModule() {
  return (
    <BatchOperationsProvider>
      <BatchOperationsContent />
    </BatchOperationsProvider>
  );
}
