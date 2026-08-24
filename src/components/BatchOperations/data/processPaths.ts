// src/data/processPaths.ts
import { StationData } from '../types';

export interface ProcessPath {
  pathCode: string;
  pathName: string;
}

export const mockProductProcessPaths: ProcessPath[] = [
  { pathCode: 'PATH001', pathName: '6寸抛光片' },
  { pathCode: 'PATH002', pathName: '6寸经排版磁测试火烧光片' },
  { pathCode: 'PATH003', pathName: '6寸特殊工艺路径' }
];

// 新增：产品主路径站点数据
export const mockProductMainPathStations: { [key: string]: StationData[] } = {
  '9999-0001': [
    { code: 'thqfhjy', name: '退火前腐后检验' },
    { code: 'fhqx2', name: '腐后清洗2' },
    { code: 'jcz', name: '进出站' },
  ],
  '9999-0002': [
    { code: 'stationX', name: '站点X' },
    { code: 'stationY', name: '站点Y' },
    { code: 'stationZ', name: '站点Z' },
  ],
  'PROD-XYZ': [
    { code: 'start', name: '开始' },
    { code: 'middle', name: '中间' },
    { code: 'end', name: '结束' },
  ],
  'PROD-ABC': [
    { code: 'thqfhjy', name: '退火前腐后检验' },
    { code: 'stationZ', name: '站点Z' },
  ],
  // 补充 batchList 中 P001 和 P002 的示例站点
  'P001': [
    { code: 'station1', name: '倒角' },
    { code: 'station2', name: '双面研磨' },
    { code: 'station3', name: '双面研磨' },
    { code: 'packagingStation', name: '包装站点' },
    { code: 'markingStation', name: '打标站点' },
    { code: 'geometricInspection', name: '几何参数检验' },
    { code: 'visualInspection', name: '目检' },
    { code: 'particleInspection', name: '颗粒检测' },
  ],
  'P002': [
    { code: 'station1', name: '倒角' },
    { code: 'station2', name: '双面研磨' },
    { code: 'station3', name: '双面研磨' },
    { code: 'packagingStation', name: '包装站点' },
    { code: 'markingStation', name: '打标站点' },
    { code: 'geometricInspection', name: '几何参数检验' },
    { code: 'visualInspection', name: '目检' },
    { code: 'particleInspection', name: '颗粒检测' },
  ],
};