// src/api/products.ts
import moment from 'moment';
import { supabase } from './supabase';
import {
  Product,
  Station,
  StationSubPath,
  ProductStationSubPathOverride,
  SubProcessConfig,
  ProductStatus,
  StationSpecification,
  Parameter,
  ParameterGroup,
  mapSupabaseProductToProductType // 导入更新后的映射函数
} from '../types/Product';
import { enrichStationWithDefaults } from '../utils/stationEnrichment';

// 获取所有可用的子路径
const getAllAvailableSubPaths = async (): Promise<StationSubPath[]> => {
  const { data: subPathsData, error: subPathsError } = await supabase
    .from('process_routes')
    .select('id, code, name, description, path_type')
    .in('path_type', ['regular_sub', 'rework', 'lab', 'monitor', 'specialSampling'])
    .order('name', { ascending: true });

  if (subPathsError) {
    console.error('获取子路径时出错:', subPathsError);
    return [];
  }

  return subPathsData.map(route => ({
    id: route.id,
    name: route.name,
    type: route.path_type === 'regular_sub' ? 'regular' : route.path_type,
    description: route.description || '',
    returnStationCode: '',
    canBeDisabled: true,
    defaultEnabled: true
  }));
};

export const products = {
  getProducts: async (params: { searchTerm?: string; statusFilter?: ProductStatus | 'ALL'; mainProcessPathSearchTerm?: string; page?: number; pageSize?: number; }) => {
    let query = supabase
      .from('products')
      .select('*, process_routes(name)', { count: 'exact' });

    if (params.searchTerm) {
      query = query.or(`product_code.ilike.%${params.searchTerm}%,product_name.ilike.%${params.searchTerm}%`);
    }
    if (params.statusFilter && params.statusFilter !== 'ALL') {
      query = query.eq('status', params.statusFilter);
    }
    if (params.mainProcessPathSearchTerm) {
      query = query.in('main_process_route_id', supabase
        .from('process_routes')
        .select('id')
        .ilike('name', `%${params.mainProcessPathSearchTerm}%`)
        .filter('path_type', 'eq', 'main')
      );
    }

    const { data, error, count } = await query
      .order('id', { ascending: true })
      .range(((params.page || 1) - 1) * (params.pageSize || 10), (params.page || 1) * (params.pageSize || 10) - 1);

    if (error) {
      console.error('获取产品时出错:', error);
      return { items: [], totalCount: 0 };
    }

    // 获取所有可用的子路径
    const availableSubPaths = await getAllAvailableSubPaths();

    const mappedProducts = data.map((row: any) => ({
      ...mapSupabaseProductToProductType(row, availableSubPaths), // 在这里传递 availableSubPaths
      mainProcessPath: row.process_routes ? row.process_routes.name : null,
    }));
    return { items: mappedProducts, totalCount: count || 0 };
  },

  getProductById: async (id: number) => {
    const { data, error } = await supabase.from('products').select('*, process_routes(name)').eq('id', id).single();
    if (error) {
      console.error('按 ID 获取产品时出错:', error);
      return null;
    }
    
    // 获取所有可用的子路径
    const availableSubPaths = await getAllAvailableSubPaths();
    
    const product = mapSupabaseProductToProductType(data, availableSubPaths); // 在这里传递 availableSubPaths
    return {
      ...product,
      mainProcessPath: data.process_routes ? data.process_routes.name : null,
    };
  },

  createProduct: async (productData: Partial<Product>) => {
    // 生成一个新的唯一 ID
    const { data: maxIdData, error: maxIdError } = await supabase
      .from('products')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    if (maxIdError) {
      console.error('获取最大产品 ID 时出错:', maxIdError);
      throw maxIdError;
    }
    const newId = (maxIdData && maxIdData.length > 0 ? maxIdData[0].id : 0) + 1;

    let enrichedProcessStations: Station[] = [];
    if (productData.mainProcessRouteId) {
      // 1. 查找对应的工艺主路径 ID
      const { data: routeData, error: routeError } = await supabase
        .from('process_routes')
        .select('id')
        .eq('id', productData.mainProcessRouteId)
        .eq('path_type', 'main')
        .single();

      if (routeError || !routeData) {
        console.warn(`未找到工艺主路径 ID: ${productData.mainProcessRouteId}, 无法初始化站点。`, routeError);
      } else {
        const routeId = routeData.id;
        // 2. 获取该工艺主路径下的所有基本站点
        const { data: routeStationsData, error: routeStationsError } = await supabase
          .from('process_route_stations')
          .select(`
            sequence,
            stations (id, code, name, equipment_group_ids, parameter_group_ids, recipe_id)
          `)
          .eq('route_id', routeId)
          .order('sequence', { ascending: true });

        if (routeStationsError) {
          console.error('获取工艺主路径站点时出错:', routeStationsError);
        } else if (routeStationsData) {
          // 3. 获取所有可用的子路径，用于丰富主路径站点
          const availableSubPaths = await getAllAvailableSubPaths();

          // 4. 丰富这些基本站点（异步处理）
          enrichedProcessStations = await Promise.all(
            routeStationsData.map(async (rs) => {
              const stationWithDefaults = await enrichStationWithDefaults(
                rs.stations as any, 
                rs.sequence, 
                availableSubPaths
              );
              // 简化存储结构，只存储必要的ID数组
              return {
                ...stationWithDefaults,
                // 保存简化版本到数据库
                simplifiedForStorage: {
                  id: stationWithDefaults.id,
                  sequence: stationWithDefaults.sequence,
                  stationName: stationWithDefaults.stationName,
                  stationCode: stationWithDefaults.stationCode,
                  equipment_group_ids: stationWithDefaults.equipment_group_ids,
                  parameter_group_ids: stationWithDefaults.parameter_group_ids || [],
                  samplingRule: stationWithDefaults.samplingRule || '',
                  recipeId: stationWithDefaults.recipeId,
                  associatedSubPaths: stationWithDefaults.associatedSubPaths.map(subPath => ({
                    id: subPath.id,
                    isEnabled: subPath.defaultEnabled
                  }))
                }
              };
            })
          );
        }
      }
    }

    const { data, error } = await supabase.from('products').insert({
      id: newId,
      product_code: productData.productCode,
      product_name: productData.productName,
      product_category: productData.productCategory,
      product_category_version: productData.productCategoryVersion,
      product_type: productData.productType,
      customer_name: productData.customerName,
      description: productData.description,
      main_process_route_id: productData.mainProcessRouteId,
      status: productData.status || 'DRAFT',
      specifications: productData.specifications || {},
      // 存储简化的站点信息（包含ID数组）
      process_stations: enrichedProcessStations.map(s => s.simplifiedForStorage),
      station_sub_path_overrides: productData.stationSubPathOverrides || [],
      revision_history: productData.revisionHistory || [],
      experimental_deviation_config: productData.experimentalDeviationConfig,
      sub_process_configs: productData.subProcessConfigs || [],
    }).select().single();

    if (error) {
      console.error('创建产品时出错:', error);
      throw error;
    }
    
    // 获取所有可用的子路径
    const availableSubPaths = await getAllAvailableSubPaths();
    const product = mapSupabaseProductToProductType(data, availableSubPaths);
    // 返回完整的产品信息，包含完整的站点数据
    return {
      ...product,
      processStations: enrichedProcessStations
    };
  },

  updateProduct: async (id: number, productData: Partial<Product>) => {
    // 如果更新了主工艺路径，需要重新初始化站点
    let updatedProcessStations = productData.processStations;
    
    if (productData.mainProcessRouteId !== undefined) {
      // 重新获取站点信息（与createProduct类似）
      const availableSubPaths = await getAllAvailableSubPaths();
      
      const { data: routeStationsData, error: routeStationsError } = await supabase
        .from('process_route_stations')
        .select(`
          sequence,
          stations (id, code, name, equipment_group_ids, parameter_group_ids, recipe_id)
        `)
        .eq('route_id', productData.mainProcessRouteId)
        .order('sequence', { ascending: true });

      if (!routeStationsError && routeStationsData) {
        updatedProcessStations = await Promise.all(
          routeStationsData.map(async (rs) => {
            const stationWithDefaults = await enrichStationWithDefaults(
              rs.stations as any, 
              rs.sequence, 
              availableSubPaths
            );
            // 保存简化版本
            return {
              ...stationWithDefaults,
              simplifiedForStorage: {
                id: stationWithDefaults.id,
                sequence: stationWithDefaults.sequence,
                stationName: stationWithDefaults.stationName,
                stationCode: stationWithDefaults.stationCode,
                equipment_group_ids: stationWithDefaults.equipment_group_ids,
                parameter_group_ids: stationWithDefaults.parameter_group_ids || [],
                samplingRule: stationWithDefaults.samplingRule || '',
                recipeId: stationWithDefaults.recipeId,
                associatedSubPaths: stationWithDefaults.associatedSubPaths.map(subPath => ({
                  id: subPath.id,
                  isEnabled: subPath.defaultEnabled
                }))
              }
            };
          })
        );
      }
    }

    const { data, error } = await supabase.from('products').update({
      product_code: productData.productCode,
      product_name: productData.productName,
      product_category: productData.productCategory,
      product_category_version: productData.productCategoryVersion,
      product_type: productData.productType,
      customer_name: productData.customerName,
      description: productData.description,
      main_process_route_id: productData.mainProcessRouteId,
      status: productData.status,
      specifications: productData.specifications || {},
      process_stations: updatedProcessStations ? updatedProcessStations.map(s => 
        'simplifiedForStorage' in s ? s.simplifiedForStorage : s
      ) : productData.processStations || [],
      station_sub_path_overrides: productData.stationSubPathOverrides || [],
      revision_history: productData.revisionHistory || [],
      experimental_deviation_config: productData.experimentalDeviationConfig,
      sub_process_configs: productData.subProcessConfigs || [],
      updated_at: new Date().toISOString(),
    }).eq('id', id).select().single();

    if (error) {
      console.error('更新产品时出错:', error);
      throw error;
    }
    
    // 获取所有可用的子路径
    const availableSubPaths = await getAllAvailableSubPaths();
    const product = mapSupabaseProductToProductType(data, availableSubPaths);
    // 返回完整的产品信息，包含完整的站点数据
    return {
      ...product,
      processStations: updatedProcessStations || productData.processStations || []
    };
  },

  deleteProduct: async (id: number) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('删除产品时出错:', error);
      throw error;
    }
    return true;
  },

  // 用于 ApprovalTemplateConfig 的产品模型数据
  getProductModels: async () => {
    const { data: productsData, error } = await supabase.from('products').select('*, process_routes(name)');
    if (error) {
      console.error('获取产品模型时出错:', error);
      return [];
    }

    const availableSubPaths = await getAllAvailableSubPaths();

    const productModelsPromises = productsData.map(async (productRow: any) => {
      const product = mapSupabaseProductToProductType(productRow, availableSubPaths);
      let dynamicSpecifications: StationSpecification[] = [];

      // 1. 添加主工艺路径站点
      console.log(`[getProductModels] Processing product: ${product.productName}, mainProcessRouteId: ${product.mainProcessRouteId}`);
      if (product.mainProcessRouteId) {
        const { data: routeStationsData, error: routeStationsError } = await supabase
          .from('process_route_stations')
          .select(`
            sequence,
            stations (id, code, name, equipment_group_ids, parameter_group_ids, recipe_id)
          `)
          .eq('route_id', product.mainProcessRouteId)
          .order('sequence', { ascending: true });

        if (routeStationsError) {
          console.error(`[getProductModels] 获取工艺主路径站点时出错 (${product.mainProcessRouteId}):`, routeStationsError);
        } else if (routeStationsData) {
          const enrichedMainStationsPromises = routeStationsData.map(async (rs) => {
            const { data: stationData, error } = await supabase
              .from('stations')
              .select('id, code, name, equipment_group_ids, parameter_group_ids, recipe_id')
              .eq('id', rs.stations.id)
              .single();

console.log(`[getProductModels] Raw stationData for ${stationData?.name} (ID: ${stationData?.id}):`, stationData); // <-- 添加这一行日志            
            
            if (error || !stationData) {
              console.error(`[getProductModels] 获取站点 ${rs.stations.id} 信息失败:`, error);
              return null;
            }
            
            return enrichStationWithDefaults(stationData, rs.sequence, availableSubPaths);
          });
          
          const enrichedMainStations = (await Promise.all(enrichedMainStationsPromises)).filter(Boolean);

          enrichedMainStations.forEach(station => {
            if (station) {
              // 添加日志：检查从 enrichStationWithDefaults 返回的 station 对象中的参数类型
              console.log(`[getProductModels] Main Station Parameters for ${station.stationName}:`, {
                measurement: station.measurementParameters.map(p => ({ id: p.id, name: p.name, type: p.type })),
                process: station.processParameters.map(p => ({ id: p.id, name: p.name, type: p.type })),
                spc: station.spcParameters.map(p => ({ id: p.id, name: p.name, type: p.type })),
              });
              
              dynamicSpecifications.push({
                stationId: station.id,
                stationName: station.stationName,
                category: 'main',
                parameters: [
                  ...station.measurementParameters.map(param => ({
                    parameterId: param.id,
                    parameterName: param.name,
                    unit: param.unit || '',
                    lowerLimit: (param.lower_limit as number) || 0,
                    upperLimit: (param.upper_limit as number) || 0,
                    target: ((param.lower_limit as number || 0) + (param.upper_limit as number || 0)) / 2,
                    type: param.type // <-- 添加这一行
                  })),
                  ...station.processParameters.map(param => ({
                    parameterId: param.id,
                    parameterName: param.name,
                    unit: param.unit || '',
                    lowerLimit: (param.lower_limit as number) || 0,
                    upperLimit: (param.upper_limit as number) || 0,
                    target: ((param.lower_limit as number || 0) + (param.upper_limit as number || 0)) / 2,
                    type: param.type // <-- 添加这一行
                  })),
                  ...station.spcParameters.map(param => ({
                    parameterId: param.id,
                    parameterName: param.name,
                    unit: param.unit || '',
                    lowerLimit: (param.lower_limit as number) || 0,
                    upperLimit: (param.upper_limit as number) || 0,
                    target: ((param.lower_limit as number || 0) + (param.upper_limit as number || 0)) / 2,
                    type: param.type // <-- 添加这一行
                  }))
                ]
              });
            }
          });
        }
      }

      // 2. 添加监控子工艺路径站点
      const monitorRoutes = availableSubPaths.filter(sp => sp.type === 'monitor');
      for (const route of monitorRoutes) {
        const { data: routeStationsData, error: routeStationsError } = await supabase
          .from('process_route_stations')
          .select(`
            sequence,
            stations (id, code, name, equipment_group_ids, parameter_group_ids, recipe_id)
          `)
          .eq('route_id', route.id)
          .order('sequence', { ascending: true });

        if (!routeStationsError && routeStationsData) {
          const enrichedMonitorStationsPromises = routeStationsData.map(async (rs) => {
            const { data: stationData, error } = await supabase
              .from('stations')
              .select('id, code, name, equipment_group_ids, parameter_group_ids, recipe_id')
              .eq('id', rs.stations.id)
              .single();
            
            if (error || !stationData) {
              console.error(`[getProductModels] 获取站点 ${rs.stations.id} 信息失败:`, error);
              return null;
            }
            
            return enrichStationWithDefaults(stationData, rs.sequence, availableSubPaths);
          });
          
          const enrichedMonitorStations = (await Promise.all(enrichedMonitorStationsPromises)).filter(Boolean);

          enrichedMonitorStations.forEach(station => {
            if (station) {
              // 添加日志：检查监控路径站点的参数类型
              console.log(`[getProductModels] Monitor Station Parameters for ${station.stationName}:`, {
                measurement: station.measurementParameters.map(p => ({ id: p.id, name: p.name, type: p.type })),
                process: station.processParameters.map(p => ({ id: p.id, name: p.name, type: p.type })),
                spc: station.spcParameters.map(p => ({ id: p.id, name: p.name, type: p.type })),
              });
              
              dynamicSpecifications.push({
                stationId: station.id,
                stationName: station.stationName,
                category: 'monitor',
                subPathId: route.id,
                subPathName: route.name,
                parameters: [
                  ...station.measurementParameters.map(param => ({
                    parameterId: param.id,
                    parameterName: param.name,
                    unit: param.unit || '',
                    lowerLimit: (param.lower_limit as number) || 0,
                    upperLimit: (param.upper_limit as number) || 0,
                    target: ((param.lower_limit as number || 0) + (param.upper_limit as number || 0)) / 2,
                    type: param.type // <-- 添加这一行
                  })),
                  ...station.processParameters.map(param => ({
                    parameterId: param.id,
                    parameterName: param.name,
                    unit: param.unit || '',
                    lowerLimit: (param.lower_limit as number) || 0,
                    upperLimit: (param.upper_limit as number) || 0,
                    target: ((param.lower_limit as number || 0) + (param.upper_limit as number || 0)) / 2,
                    type: param.type // <-- 添加这一行
                  })),
                  ...station.spcParameters.map(param => ({
                    parameterId: param.id,
                    parameterName: param.name,
                    unit: param.unit || '',
                    lowerLimit: (param.lower_limit as number) || 0,
                    upperLimit: (param.upper_limit as number) || 0,
                    target: ((param.lower_limit as number || 0) + (param.upper_limit as number || 0)) / 2,
                    type: param.type // <-- 添加这一行
                  }))
                ]
              });
            }
          });
        }
      }

      // 3. 添加特殊抽样子工艺路径站点
      if (product.stationSubPathOverrides && product.stationSubPathOverrides.length > 0) {
        for (const override of product.stationSubPathOverrides) {
          const subPathDefinition = availableSubPaths.find(sp => sp.id === override.subPathId && sp.type === 'specialSampling');
          if (subPathDefinition && (override.isEnabled ?? subPathDefinition.defaultEnabled)) {
            let stationsToProcess: Station[] = [];
            if (override.configuredStations && override.configuredStations.length > 0) {
              stationsToProcess = override.configuredStations;
            } else {
              const { data: routeStationsData, error: routeStationsError } = await supabase
                .from('process_route_stations')
                .select(`
                  sequence,
                  stations (id, code, name, equipment_group_ids, parameter_group_ids, recipe_id)
                `)
                .eq('route_id', subPathDefinition.id)
                .order('sequence', { ascending: true });

              if (!routeStationsError && routeStationsData) {
                const enrichedSpecialSamplingStationsPromises = routeStationsData.map(async (rs) => {
                  const { data: stationData, error } = await supabase
                    .from('stations')
                    .select('id, code, name, equipment_group_ids, parameter_group_ids, recipe_id')
                    .eq('id', rs.stations.id)
                    .single();
                  
                  if (error || !stationData) {
                    console.error(`[getProductModels] 获取站点 ${rs.stations.id} 信息失败:`, error);
                    return null;
                  }
                  
                  return enrichStationWithDefaults(stationData, rs.sequence, availableSubPaths);
                });
                
                stationsToProcess = (await Promise.all(enrichedSpecialSamplingStationsPromises)).filter(Boolean) as Station[];
              }
            }

            stationsToProcess.forEach(station => {
              // 添加日志：检查特殊抽样路径站点的参数类型
              console.log(`[getProductModels] Special Sampling Station Parameters for ${station.stationName}:`, {
                measurement: station.measurementParameters.map(p => ({ id: p.id, name: p.name, type: p.type })),
                process: station.processParameters.map(p => ({ id: p.id, name: p.name, type: p.type })),
                spc: station.spcParameters.map(p => ({ id: p.id, name: p.name, type: p.type })),
              });
              
              dynamicSpecifications.push({
                stationId: station.id,
                stationName: station.stationName,
                category: 'specialSampling',
                subPathId: subPathDefinition.id,
                subPathName: subPathDefinition.name,
                parameters: [
                  ...station.measurementParameters.map(param => ({
                    parameterId: param.id,
                    parameterName: param.name,
                    unit: param.unit || '',
                    lowerLimit: (param.lower_limit as number) || 0,
                    upperLimit: (param.upper_limit as number) || 0,
                    target: ((param.lower_limit as number || 0) + (param.upper_limit as number || 0)) / 2,
                    type: param.type // <-- 添加这一行
                  })),
                  ...station.processParameters.map(param => ({
                    parameterId: param.id,
                    parameterName: param.name,
                    unit: param.unit || '',
                    lowerLimit: (param.lower_limit as number) || 0,
                    upperLimit: (param.upper_limit as number) || 0,
                    target: ((param.lower_limit as number || 0) + (param.upper_limit as number || 0)) / 2,
                    type: param.type // <-- 添加这一行
                  })),
                  ...station.spcParameters.map(param => ({
                    parameterId: param.id,
                    parameterName: param.name,
                    unit: param.unit || '',
                    lowerLimit: (param.lower_limit as number) || 0,
                    upperLimit: (param.upper_limit as number) || 0,
                    target: ((param.lower_limit as number || 0) + (param.upper_limit as number || 0)) / 2,
                    type: param.type // <-- 添加这一行
                  }))
                ]
              });
            });
          }
        }
      }

      // 构造 approvalTemplate - 添加了console.log语句
      console.log(`[getProductModels] Raw approval_template from productRow for ${product.productName}:`, JSON.stringify(productRow.approval_template, null, 2));
      const approvalTemplate = productRow.approval_template || {
        id: `template_${product.id}`,
        productModelId: String(product.id),
        version: '1.0',
        isActive: true,
        createdAt: productRow.created_at,
        updatedAt: productRow.updated_at,
        approvalItems: []
      };

      return {
        id: String(product.id),
        name: product.productName,
        modelNumber: product.productCode,
        version: 'v1.0',
        productType: product.productType,
        productUsage: '通用',
        processRoute: productRow.process_routes ? productRow.process_routes.name : null,
        updatedAt: productRow.updated_at,
        specifications: dynamicSpecifications,
        approvalTemplate: approvalTemplate
      };
    });

    return Promise.all(productModelsPromises);
  },

  updateApprovalTemplate: async (modelId: string, template: any) => {
    const { error } = await supabase
      .from('products')
      .update({ 
        approval_template: template, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', parseInt(modelId));

    if (error) {
      console.error('更新审批模板时出错:', error);
      throw error;
    }
    console.log(`已更新产品模型 ${modelId} 的审批模板。`);
    return true;
  }
};