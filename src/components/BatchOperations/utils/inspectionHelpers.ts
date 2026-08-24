// src/utils/inspectionHelpers.ts
import { WaferData, InspectionParameter } from '../types';

// Helper function to get parameter definitions based on station
export const getStationParameterDefinitions = (station: string): InspectionParameter[] => {
  if (station === '几何参数检验') { // CRITICAL CHANGE: 使用站点名称
    return [
      { name: 'CenThk', unit: 'µm', value: 0 },
      { name: 'Bow-BF', unit: 'µm', value: 0 },
      { name: 'Warp-BF', unit: 'µm', value: 0 },
      { name: 'TTV(GBIR)', unit: 'µm', value: 0, max: 0.3 },
      { name: 'TIR-BF(GFLR NTV)', unit: 'µm', value: 0 },
      { name: 'SFQR', unit: 'µm', value: 0 },
      { name: 'CenRes', unit: 'ohm·cm', value: 0, min: 1, max: 10 }, // Resistivity for grading
    ];
  } else if (station === '目检') { // CRITICAL CHANGE: 使用站点名称
    return [
      { name: '表面颗粒', unit: '个', value: 0, max: 5 },
      { name: '表面划痕', unit: '有/无', value: 0, max: 0 },
      { name: '外观缺陷', unit: '有/无', value: 0, max: 0 },
    ];
  } else if (station === '颗粒检测') { // CRITICAL CHANGE: 使用站点名称
    return [
      // 从颗粒检测站点移除表面颗粒和表面划痕参数
      { name: '颗粒密度', unit: '个/cm²', value: 0, max: 0.1 },
    ];
  } else if (station === 'markingStation') { // 为打标站点添加制程参数
    return [
      { name: '激光功率', unit: 'W', value: 0, min: 10, max: 50 },
      { name: '打标速度', unit: 'mm/s', value: 0, min: 100, max: 500 },
      { name: '焦距', unit: 'mm', value: 0, min: 0, max: 10 },
    ];
  } else if (station === 'sp1Inspection') { // 新增 SP1 站点参数
    return [
      { name: 'SP1参数A', unit: '单位A', value: 0, min: 0, max: 100 },
      { name: 'SP1参数B', unit: '单位B', value: 0, min: 0, max: 50 },
    ];
  }
  else { // 为其他通用过程站点添加一些示例制程参数
    return [
      { name: '温度', unit: '°C', value: 0, min: 20, max: 1000 },
      { name: '压力', unit: 'Pa', value: 0, min: 0, max: 10000 },
      { name: '时间', unit: 'min', value: 0, min: 1, max: 120 },
    ];
  }
};

// Determine wafer type (GOOD/REJECT/DISCARD) based on parameters
export const determineWaferType = (params: InspectionParameter[]): 'GOOD' | 'REJECT' => {
  let isGood = true;
  for (const param of params) {
    if (param.max !== undefined && param.value > param.max) {
      isGood = false;
      break;
    }
    if (param.name === '表面划痕' && param.value === 1) {
      isGood = false;
      break;
    }
    if (param.name === '外观缺陷' && param.value === 1) {
      isGood = false;
      break;
    }
  }
  return isGood ? 'GOOD' : 'REJECT';
};

// Determine disposition (REWORK_WASH/REWORK_POLISH/HOLD/NONE)
export const determineDisposition = (waferType: WaferData['type'], params: InspectionParameter[]): WaferData['disposition'] => {
  if (waferType === 'GOOD' || waferType === 'GoodSample') return 'NONE';

  const hasScratches = params.some(p => p.name === '表面划痕' && p.value === 1);
  const hasParticles = params.some(p => p.name === '表面颗粒' && p.value > 5);
  const hasTTVIssue = params.some(p => p.name === 'TTV(GBIR)' && p.value > 0.3);

  if (hasScratches || hasTTVIssue) return 'REWORK_POLISH';
  if (hasParticles) return 'REWORK_WASH';
  
  return 'HOLD';
};

// Determine grade for Geometric Inspection (resistivity)
export const determineGrade = (station: string, params: InspectionParameter[]): string => {
  if (station !== '几何参数检验') return ''; // CRITICAL CHANGE: 使用站点名称
  const resistivityParam = params.find(p => p.name === 'CenRes');
  if (!resistivityParam) return '';

  const resistivity = resistivityParam.value;
  if (resistivity < 1) return 'A+级';
  if (resistivity >= 1 && resistivity < 3) return 'A级';
  if (resistivity >= 3 && resistivity < 6) return 'B级';
  if (resistivity >= 6 && resistivity <= 10) return 'C级';
  return 'D级';
};

export const getStationDisplayName = (stationCode: string) => {
  switch (stationCode) {
    case '几何参数检验': return '几何参数检验'; // CRITICAL CHANGE: 使用站点名称
    case '颗粒检测': return '颗粒检测'; // CRITICAL CHANGE: 使用站点名称
    case '目检': return '目检'; // CRITICAL CHANGE: 使用站点名称
    case 'sp1Inspection': return 'SP1'; // 如果需要，可以保留这个模拟站点
    case 'markingStation': return '打标站点';
    default: return stationCode; // 默认返回代码本身
  }
};

// Simulate inspection parameters for a wafer (for Excel import simulation)
export const generateSimulatedInspectionParameters = (station: string, forceDefectAtThisStation: boolean = false): InspectionParameter[] => {
  const params: InspectionParameter[] = [];
  
  // 根据不同站点生成参数
  if (station === '几何参数检验') { // CRITICAL CHANGE: 使用站点名称
    params.push({ name: 'CenThk', value: parseFloat((Math.random() * (700 - 600) + 600).toFixed(2)), unit: 'µm' });
    params.push({ name: 'Bow-BF', value: parseFloat((Math.random() * (10 - (-10)) + (-10)).toFixed(2)), unit: 'µm' });
    params.push({ name: 'Warp-BF', value: parseFloat((Math.random() * (15 - 0) + 0).toFixed(2)), unit: 'µm' });
    
    // TTV(GBIR)参数 - 如果强制缺陷，则设置超出限制的值
    if (forceDefectAtThisStation) {
      params.push({ name: 'TTV(GBIR)', value: 0.5, unit: 'µm', max: 0.3 });
    } else {
      params.push({ name: 'TTV(GBIR)', value: parseFloat((Math.random() * (0.25 - 0.1) + 0.1).toFixed(2)), unit: 'µm', max: 0.3 });
    }
    
    params.push({ name: 'TIR-BF(GFLR NTV)', value: parseFloat((Math.random() * (0.5 - 0.1) + 0.1).toFixed(2)), unit: 'µm' });
    params.push({ name: 'SFQR', value: parseFloat((Math.random() * (0.5 - 0.1) + 0.1).toFixed(2)), unit: 'µm' });
    params.push({ name: 'CenRes', value: parseFloat((Math.random() * (10 - 1) + 1).toFixed(2)), unit: 'ohm·cm', min: 1, max: 10 });
  } else if (station === '目检') { // CRITICAL CHANGE: 使用站点名称
    // 表面颗粒和表面划痕参数
    params.push({ name: '表面颗粒', value: Math.floor(Math.random() * 5), unit: '个', max: 5 });
    params.push({ name: '表面划痕', value: Math.random() > 0.9 ? 1 : 0, unit: '有/无', max: 0 });
    
    // 外观缺陷参数 - 如果强制缺陷，则设置为1
    if (forceDefectAtThisStation) {
      params.push({ name: '外观缺陷', value: 1, unit: '有/无', max: 0 });
    } else {
      params.push({ name: '外观缺陷', value: Math.random() > 0.95 ? 1 : 0, unit: '有/无', max: 0 });
    }
  } else if (station === '颗粒检测') { // CRITICAL CHANGE: 使用站点名称
    // 颗粒检测站点现在只包含颗粒密度参数
    // 颗粒密度参数 - 如果强制缺陷，则设置超出限制的值
    if (forceDefectAtThisStation) {
      params.push({ name: '颗粒密度', value: 0.2, unit: '个/cm²', max: 0.1 });
    } else {
      params.push({ name: '颗粒密度', value: parseFloat((Math.random() * (0.08 - 0.01) + 0.01).toFixed(2)), unit: '个/cm²', max: 0.1 });
    }
  } else if (station === 'markingStation') { // 为打标站点模拟参数
    params.push({ name: '激光功率', value: parseFloat((Math.random() * (50 - 10) + 10).toFixed(2)), unit: 'W' });
    params.push({ name: '打标速度', value: parseFloat((Math.random() * (500 - 100) + 100).toFixed(2)), unit: 'mm/s' });
    params.push({ name: '焦距', value: parseFloat((Math.random() * (10 - 0) + 0).toFixed(2)), unit: 'mm' });
  } else if (station === 'sp1Inspection') { // 新增 SP1 站点模拟参数
    params.push({ name: 'SP1参数A', value: parseFloat((Math.random() * 100).toFixed(2)), unit: '单位A' });
    params.push({ name: 'SP1参数B', value: parseFloat((Math.random() * 50).toFixed(2)), unit: '单位B' });
  }
  else { // 为其他通用过程站点模拟参数
    params.push({ name: '温度', value: parseFloat((Math.random() * (1000 - 20) + 20).toFixed(2)), unit: '°C' });
    params.push({ name: '压力', value: parseFloat((Math.random() * (10000 - 0) + 0).toFixed(2)), unit: 'Pa' });
    params.push({ name: '时间', value: parseFloat((Math.random() * (120 - 1) + 1).toFixed(2)), unit: 'min' });
  }
  return params;
};

// Helper function to get disposition display string
export const getDispositionDisplay = (disposition?: WaferData['disposition']) => {
  switch (disposition) {
    case 'REWORK_WASH': return '返洗';
    case 'REWORK_POLISH': return '返抛';
    case 'HOLD': return 'NG';
    case 'NONE': return '无处置';
    default: return '-';
  }
};

// Helper function to get disposition style
export const getDispositionStyle = (disposition?: WaferData['disposition']) => {
  switch (disposition) {
    case 'REWORK_WASH': return 'bg-blue-100 text-blue-800';
    case 'REWORK_POLISH': return 'bg-orange-100 text-orange-800';
    case 'HOLD': return 'bg-red-100 text-red-800';
    case 'NONE': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// New function to generate simulated aggregated inspection data for multiple stations
export const generateSimulatedAggregatedInspectionData = (
  stationCodes: string[],
  waferShouldBeDefective: boolean = false
): { [stationCode: string]: { parameters: InspectionParameter[], defectType?: string, defectCode?: string, waferType?: WaferData['type'], disposition?: WaferData['disposition'], grade?: string } } => {
  const results: { [stationCode: string]: { parameters: InspectionParameter[], defectType?: string, defectCode?: string, waferType?: WaferData['type'], disposition?: WaferData['disposition'], grade?: string } } = {};

  // 如果晶圆应该为缺陷，随机选择一个站点作为缺陷站点
  let defectStation: string | null = null;
  if (waferShouldBeDefective && stationCodes.length > 0) {
    const randomIndex = Math.floor(Math.random() * stationCodes.length);
    defectStation = stationCodes[randomIndex];
  }

  stationCodes.forEach(station => {
    // 根据是否为缺陷站点决定是否强制缺陷
    const forceDefectAtThisStation = waferShouldBeDefective && station === defectStation;
    const params = generateSimulatedInspectionParameters(station, forceDefectAtThisStation);
    const waferType = determineWaferType(params);
    const disposition = determineDisposition(waferType, params);
    const grade = determineGrade(station, params);

    let defectType: string | undefined;
    let defectCode: string | undefined;

    // 新增逻辑：如果 waferType 为 'GOOD'，则 defectType 为 'GOOD'，defectCode 为 undefined
    if (waferType === 'GOOD') {
      defectType = 'GOOD';
      defectCode = undefined; // 确保 defectCode 为 undefined
    } else if (waferType === 'REJECT') { // 只有当 waferType 为 'REJECT' 时才生成具体的不良类型和代码
      defectType = 'Reject'; // 根据最新需求，不良时 defectType 显示为 'Reject'

      // 根据缺陷站点和参数确定缺陷类型和代码
      if (station === '几何参数检验') { // CRITICAL CHANGE: 使用站点名称
        // 检查是否是TTV超标
        const ttvParam = params.find(p => p.name === 'TTV(GBIR)');
        if (ttvParam && ttvParam.value > 0.3) {
          defectCode = 'GEO-001'; // 仅显示缺陷代码
        } else {
          // 其他几何参数缺陷
          const randomDefect = Math.random();
          defectCode = randomDefect < 0.5 ? 'GEO-001' : 'GEO-002'; // 仅显示缺陷代码
        }
      } else if (station === '目检') { // CRITICAL CHANGE: 使用站点名称
        // 检查外观缺陷
        const appearanceParam = params.find(p => p.name === '外观缺陷');
        const scratchParam = params.find(p => p.name === '表面划痕');

        if (appearanceParam && appearanceParam.value === 1) {
          defectCode = 'VIS-002'; // 仅显示缺陷代码
        } else if (scratchParam && scratchParam.value === 1) {
          defectCode = 'VIS-001'; // 仅显示缺陷代码
        } else {
          // 其他目检缺陷
          defectCode = 'VIS-003'; // 仅显示缺陷代码
        }
      } else if (station === '颗粒检测') { // CRITICAL CHANGE: 使用站点名称
        const densityParam = params.find(p => p.name === '颗粒密度');
        if (densityParam && densityParam.value > 0.1) {
          defectCode = 'PAR-001'; // 仅显示缺陷代码
        }
      } else if (station === 'sp1Inspection') {
        const randomDefect = Math.random();
        defectCode = randomDefect < 0.5 ? 'SP1-001' : 'SP1-002'; // 仅显示缺陷代码
      } else {
        // 将默认的 defectType 从 '通用不良' 修改为 '未知不良'
        defectCode = 'DEF-001'; // 仅显示缺陷代码
      }
    }

    results[station] = {
      parameters: params,
      defectType,
      defectCode,
      waferType,
      disposition,
      grade,
    };
  });

  return results;
};
