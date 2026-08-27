// src/services/batchApiService.ts
import { transformBatchData, transformSubBatchData } from '../utils/dataTransformers';
import { BatchData, SubBatchData, ProductData, StationData, WaferLossRecord, WaferData } from '../types';

// ─── Mock 模式开关 ────────────────────────────
// 设为 true 使用本地 Mock 数据，不发起任何网络请求。
// 设为 false 则调用真实后端 API（需要 VITE_BATCH_API_BASE_URL 配置正确）。
export const USE_MOCK_DATA = true;

// 统一 API 基础地址（批次作业后端）
// 使用专用变量 VITE_BATCH_API_BASE_URL，避免与主应用的 VITE_API_BASE_URL 冲突
const API_BASE_URL = import.meta.env.VITE_BATCH_API_BASE_URL || 'https://batch-service-mmtw.onrender.com/api';

// ─── 认证 Token 管理 ──────────────────────────
let _authToken: string | null = null;

// ─── 通用请求工具 ─────────────────────────────
async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`; // 直接使用 API_BASE_URL

  // 构建请求头，自动注入 Authorization
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (_authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${_authToken}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new Error(
      `无法连接批次作业后端 ${url}。请检查：\n` +
      `1. 后端服务是否启动 (cd batch-service && npm run dev)\n` +
      `2. 端口是否正确 (默认 3001)\n` +
      `原始错误: ${err.message}`
    );
  }

  // 401 特殊处理 — Token 过期或无效
  if (res.status === 401) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.error || '认证失败，请重新登录');
    (error as any).code = 'AUTH_REQUIRED';
    throw error;
  }

  // 403 权限不足
  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.error || '权限不足');
    (error as any).code = 'FORBIDDEN';
    throw error;
  }

  // 检测非 JSON 响应
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const preview = (await res.text()).slice(0, 200);
    throw new Error(
      `批次作业后端返回了非 JSON 响应 (Content-Type: ${ct})。\n` +
      `请求地址: ${url}\n` +
      `请确认 VITE_BATCH_API_URL 配置正确。\n` +
      `响应预览: ${preview}`
    );
  }

  const body = await res.json();

  if (!res.ok || body.success === false) {
    throw new Error(body.error || body.message || `HTTP ${res.status}`);
  }

  // 返回 data 字段（数组/对象），而非整个 { success, data } 包装
  return body.data !== undefined ? body.data : body;
}

// CRITICAL CHANGE: 添加一个辅助函数来转换聚合晶圆数据
const transformAggregatedWafer = (apiWafer: any): WaferData => {
  const inspectionResultsByStation: WaferData['inspectionResultsByStation'] = {};
  
  // 定义后端站点代码到前端显示名称的映射
  const stationKeyMap: { [key: string]: string } = {
    geometricInspection: '几何参数检验',
    particleInspection: '颗粒检测',
    visualInspection: '目检',
    // 根据需要添加其他检验站点映射
  };

  if (apiWafer.inspections) {
    for (const apiStationKey in apiWafer.inspections) {
      if (apiWafer.inspections.hasOwnProperty(apiStationKey)) {
        const frontendStationName = stationKeyMap[apiStationKey] || apiStationKey; // 使用映射名称或回退到原始键
        inspectionResultsByStation[frontendStationName] = apiWafer.inspections[apiStationKey];
      }
    }
  }

  return {
    id: apiWafer.id,
    slotNo: apiWafer.slot_number,
    type: apiWafer.wafer_type,
    waferId: apiWafer.wafer_id_code, // 使用 wafer_id_code 作为前端显示的 waferId
    sublotId: apiWafer.sublot_id,
    carrierId: apiWafer.carrier_id,
    lotId: apiWafer.lot_id,
    markingCode: apiWafer.marking_code, // 假设后端有此字段
    markingStatus: apiWafer.marking_status || '未打标', // 提供默认值
    disposition: apiWafer.disposition,
    grade: apiWafer.grade,
    inspectionParameters: apiWafer.inspection_parameters, // 假设后端有此字段
    inspectionStatus: apiWafer.inspection_status || '未检验', // 提供默认值
    inspectionResultsByStation: inspectionResultsByStation,
  };
};


// ─── API 方法 ─────────────────────────────────
const _realBatchApiService = {

  // ── 查询 ──────────────────────────────────

  /** 查询批次列表 — 返回 BatchData[] */
  listBatches: async (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    const data = await request(`/batch/list${qs ? '?' + qs : ''}`); // 路径前缀已在 API_BASE_URL 中
    if (Array.isArray(data)) {
      return data.map(batch => transformBatchData(batch));
    }
    return data;
  },

  /** 查询所有站点 — 返回 StationData[] */
  listStations: () => request('/stations'),

  /** 查询所有站点（别名，兼容 context 中的 fetchStations / getStations） */
  getStations: () => request('/stations'),

  /** 查询产品列表 — 返回 ProductData[] */
  getProducts: () => request('/products'),

  /** 查询损耗晶圆记录 — 返回 WaferLossRecord[] */
  getLossWafers: (limit = 200) => request(`/loss-wafers?limit=${limit}`),

  /** 查询批次详情（含子批次） */
  getBatchDetail: async (batchId: string) => {
    const data = await request(`/batch/${batchId}`);
    return {
      batch: transformBatchData(data.batch),
      subBatches: data.subBatches // 假设子批次数据结构正确，如果需要也应进行转换
    };
  },

  /** 查询批次晶圆数据（含检测结果） */
  getBatchWafers: (batchId: string, stationCode: string) =>
    request(`/batch/${batchId}/wafers?stationCode=${encodeURIComponent(stationCode)}`),

  /** 查询操作历史 */
  getBatchHistory: (batchId: string, limit = 50) =>
    request(`/batch/${batchId}/history?limit=${limit}`),

  /**
   * 获取子批次数据
   * @param masterBatchId 主批次ID
   * @returns Promise<SubBatchData[]>
   */
  getSubBatches: async (masterBatchId: string) => {
    const data = await request(`/batch/${masterBatchId}/sub-batches`);
    if (Array.isArray(data)) {
      return data.map(subBatch => transformSubBatchData(subBatch)); // CRITICAL CHANGE: 对子批次数据进行转换
    }
    return data; // 如果不是数组，直接返回（但通常应该是一个数组）
  },

  // ── 写操作 ────────────────────────────────

  /**
   * 出站确认
   * 对应原 handleConfirmOutstation
   */
  confirmOutstation: (batchId: string, payload: any) => // 调整参数以匹配实际调用
    request('/batch/confirm-outstation', {
      method: 'POST',
      body: JSON.stringify({ batchId, ...payload }),
    }),

  /**
   * 进站确认
   */
  confirmInstation: (payload: any) =>
    request('/confirm-instation', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * 拆批确认
   */
  confirmSplit: (payload: any) =>
    request('/confirm-split', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * 并批确认
   */
  confirmMerge: (payload: any) =>
    request('/confirm-merge', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * 批量扣留
   */
  holdBatches: (batchIds: string[], reasonText: string) =>
    request('/batch/hold-batches', {
      method: 'POST',
      body: JSON.stringify({ batchIds, reasonText }),
    }),

  /**
   * 批量释放
   */
  releaseBatches: (batchIds: string[]) =>
    request('/batch/release-batches', {
      method: 'POST',
      body: JSON.stringify({ batchIds }),
    }),

  /**
   * 获取晶圆载具内容
   */
  getWaferCarrierContents: (subBatchUUIDs: string[], batchId: string) =>
    request(`/batch/${batchId}/wafer-carrier-contents`, {
      method: 'POST',
      body: JSON.stringify({ subBatchIds: subBatchUUIDs }),
    }),

  /**
   * 获取拆批晶圆
   */
  getWafersForSplit: (subBatchCodes: string[], batchId: string) =>
    request(`/batch/${batchId}/wafers-for-split`, {
      method: 'POST',
      body: JSON.stringify({ subBatchCodes }),
    }),

  /**
   * 更新晶圆打标信息
   */
  updateWaferMarking: (waferId: string, markingCode: string, markingStatus: string) =>
    request(`/wafers/${waferId}/marking`, {
      method: 'PUT',
      body: JSON.stringify({ markingCode, markingStatus }),
    }),

  /**
   * 获取包装出货条码记录列表
   */
  getPackagingRecords: (batchId: string) =>
    request(`/batch/${batchId}/packaging-records`),

  /**
   * 生成包装出货条码记录（支持合箱）
   */
  createPackagingRecord: (batchId: string, payload: any) =>
    request(`/batch/${batchId}/packaging-records`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * 打印出货条码标签
   */
  printPackagingRecord: (batchId: string, recordId: string) =>
    request(`/batch/${batchId}/packaging-records/${recordId}/print`, {
      method: 'POST',
    }),

  /**
   * 重打出货条码标签
   */
  reprintPackagingRecord: (batchId: string, recordId: string, reason: string, operator: string) =>
    request(`/batch/${batchId}/packaging-records/${recordId}/reprint`, {
      method: 'POST',
      body: JSON.stringify({ reason, operator }),
    }),

  /**
   * 获取聚合晶圆数据
   * CRITICAL CHANGE: 在这里对返回的晶圆数据进行转换
   */
  getAggregatedWaferData: async (batchId: string) => {
    const data = await request(`/batch/${batchId}/aggregated-wafers`);
    if (Array.isArray(data)) {
      return data.map(transformAggregatedWafer); // 应用转换函数
    }
    return []; // 如果不是数组，返回空数组
  },

  /**
   * 保存检验结果
   */
  saveInspectionResults: (resultsToUpsert: any[]) =>
    request('/inspection-results', {
      method: 'POST',
      body: JSON.stringify({ results: resultsToUpsert }),
    }),

  /**
   * 获取批次备注
   */
  getBatchRemarks: (batchId: string) =>
    request(`/batch/${batchId}/remarks`),

  /**
   * 保存批次备注
   */
  saveBatchRemarks: (batchId: string, remarks: string[]) =>
    request(`/batch/${batchId}/remarks`, {
      method: 'PUT',
      body: JSON.stringify({ remarks }),
    }),

  /**
   * 更新子批次
   */
  updateSubBatch: (subBatchId: string, updates: Partial<SubBatchData>) =>
    request(`/sub-batch/${subBatchId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  /**
   * 记录操作日志
   */
  logOperation: (logData: any) =>
    request('/operation-logs', {
      method: 'POST',
      body: JSON.stringify(logData),
    }),

  // ── 认证 Token 管理 ──────────────────────

  /**
   * 设置 Bearer Token（登录成功后调用）
   * @param {string} token - Supabase session.access_token
   */
  setAuthToken: (token: string) => {
    _authToken = token;
  },

  /** 清除 Token（登出时调用） */
  clearAuthToken: () => {
    _authToken = null;
  },

  /** 获取当前 Token（调试用） */
  getAuthToken: () => _authToken,
};

// ─── 服务导出：根据 USE_MOCK_DATA 开关选择 ────────────────
// 所有组件从此文件 import { batchApiService }，无需修改调用代码。
// 切换时只需将 USE_MOCK_DATA 改为 false 即可恢复真实 API。
import { mockBatchService } from './mockBatchService';
export { _realBatchApiService };
export const batchApiService = USE_MOCK_DATA ? mockBatchService : _realBatchApiService;
