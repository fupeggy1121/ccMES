// src/data/mockStationRemarks.ts

export interface StationRemark {
  stationCode: string;
  stationName: string;
  remarks: string[];
  lastUpdated: string;
}

export const mockStationRemarks: StationRemark[] = [
  {
    stationCode: "station11",
    stationName: "站点11",
    remarks: [
      "站点11的常规检查已完成。",
      "请确保所有设备参数符合标准。",
      "每日例行维护记录已更新。"
    ],
    lastUpdated: "2026-01-19 10:30:00"
  },
  {
    stationCode: "packagingStation02",
    stationName: "包装站点02",
    remarks: [
      "包装材料需符合ESD防护要求。",
      "温湿度控制：23±2℃，45±10%RH。",
      "每箱包装数量：25片。",
      "需检查包装完整性。"
    ],
    lastUpdated: "2026-01-19 10:35:00"
  },
  {
    stationCode: "packagingStation",
    stationName: "包装站点",
    remarks: [
      "包装线A的产能已达标。",
      "请注意包装标签的打印质量。",
      "定期检查包装设备的磨损情况。"
    ],
    lastUpdated: "2026-01-19 10:40:00"
  },
  {
    stationCode: "visualInspection",
    stationName: "目检站点",
    remarks: [
      "目检标准已更新至最新版本。",
      "请使用标准光源进行目检。",
      "发现异常请立即上报。"
    ],
    lastUpdated: "2026-01-19 10:45:00"
  },
  {
    stationCode: "station13",
    stationName: "站点13",
    remarks: [
      "站点13的工艺流程正在优化。",
      "请严格按照操作指导书执行。",
      "注意安全，佩戴防护用品。"
    ],
    lastUpdated: "2026-01-19 10:50:00"
  },
  {
    stationCode: "geometricInspection02",
    stationName: "几何参数检验站点",
    remarks: [
      "几何参数检验设备已校准。",
      "请确保晶圆放置正确。",
      "检验数据需实时上传。"
    ],
    lastUpdated: "2026-01-19 10:55:00"
  },
  {
    stationCode: "markingStation",
    stationName: "打标站点",
    remarks: [
      "打标机激光功率已调整。",
      "请检查打标码清晰度。",
      "每日清洁打标头。"
    ],
    lastUpdated: "2026-01-19 11:00:00"
  },
  {
    stationCode: "markingStation02",
    stationName: "打标站点02",
    remarks: [
      "打标站点02的维护计划已排定。",
      "请确保所有晶圆都已正确打标。",
      "打标码生成规则已更新。"
    ],
    lastUpdated: "2026-01-19 11:05:00"
  },
  {
    stationCode: "particleInspection02",
    stationName: "颗粒检测站点",
    remarks: [
      "颗粒检测仪已完成校准。",
      "请确保晶圆表面无污染。",
      "检测结果异常请复检。"
    ],
    lastUpdated: "2026-01-19 11:10:00"
  }
];

// 根据站点代码获取站点备注
export const getStationRemarksByCode = (stationCode: string): StationRemark | undefined => {
  return mockStationRemarks.find(remark => remark.stationCode === stationCode);
};

// 获取所有站点备注
export const getAllStationRemarks = (): StationRemark[] => {
  return mockStationRemarks;
};
