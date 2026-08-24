// src/api/approval.ts
import moment from 'moment';
import { supabase } from './supabase';
import { Product, ProductStatus, mapSupabaseProductToProductType } from '../types/Product';

// 获取所有可用的子路径
const getAllAvailableSubPaths = async () => {
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

export const approval = {
  getPendingTasks: async (params: any) => {
    // 从 Supabase 获取状态为 'PENDING_APPROVAL' 的产品
    const { data: supabaseProducts, error: fetchError, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('status', 'PENDING_APPROVAL')
      .order('created_at', { ascending: false })
      .range(((params.page || 1) - 1) * (params.pageSize || 10), (params.page || 1) * (params.pageSize || 10) - 1);

    if (fetchError) {
      console.error('从 Supabase 获取待审批产品时出错:', fetchError);
      return { data: { items: [], totalCount: 0 } };
    }

    // 获取所有可用的子路径
    const availableSubPaths = await getAllAvailableSubPaths();

    const enrichedTasks = await Promise.all(supabaseProducts.map(async (productRow: any, index: number) => {
      // 将 Supabase 行数据映射到 Product 类型
      const product: Product = mapSupabaseProductToProductType(productRow, availableSubPaths);

      // 填充 mainProcessPath 名称
      let mainProcessPathName = null;
      if (product.mainProcessRouteId) {
        const { data: routeData, error: routeError } = await supabase
          .from('process_routes')
          .select('name')
          .eq('id', product.mainProcessRouteId)
          .single();
        if (!routeError && routeData) {
          mainProcessPathName = routeData.name;
        }
      }
      // 将 mainProcessPath 名称添加到 product 对象，以便 ApprovalFormModal 可以显示
      (product as any).mainProcessPath = mainProcessPathName;

      // 模拟原始产品详情用于演示
      const originalProduct = JSON.parse(JSON.stringify(product)); // 深度复制
      // 添加一些随机更改到 originalProduct，以便在 ApprovalFormModal 中进行比较
      if (Math.random() > 0.3) {
        originalProduct.productName = `旧版 ${originalProduct.productName}`;
      }
      if (Math.random() > 0.4) {
        originalProduct.description = `旧版描述：${originalProduct.description}`;
      }
      if (Math.random() > 0.5 && originalProduct.specifications) {
        originalProduct.specifications.thickness = originalProduct.specifications.thickness > 10 ? originalProduct.specifications.thickness - 10 : originalProduct.specifications.thickness + 10;
      }
      if (Math.random() > 0.6 && originalProduct.specifications) {
        originalProduct.specifications.diameter = originalProduct.specifications.diameter > 1 ? originalProduct.specifications.diameter - 1 : originalProduct.specifications.diameter + 1;
      }
      if (Math.random() > 0.7 && originalProduct.mainProcessPath) {
        const paths = ['标准CMOS工艺', 'BiCMOS工艺', 'SOI工艺', 'FinFET工艺']; // 示例路径
        const currentPathIndex = paths.indexOf(originalProduct.mainProcessPath);
        if (currentPathIndex !== -1) {
          originalProduct.mainProcessPath = paths[(currentPathIndex + 1) % paths.length];
        } else {
          originalProduct.mainProcessPath = paths[0];
        }
      }
      if (Math.random() > 0.8 && originalProduct.subProcessConfigs && originalProduct.subProcessConfigs.length > 0) {
        originalProduct.subProcessConfigs = originalProduct.subProcessConfigs.slice(0, originalProduct.subProcessConfigs.length - 1);
      }

      return {
        id: `WO-P-${product.id}`,
        productId: product.productCode,
        productName: product.productName,
        submitter: ['张三', '李四', '王五', '赵六'][index % 4],
        submitTime: moment(productRow.created_at).format(),
        status: 'PENDING',
        productDetails: product,
        originalProductDetails: originalProduct
      };
    }));

    return {
      data: {
        items: enrichedTasks,
        totalCount: count || 0
      }
    };
  },

  approveTask: async (taskId: string) => {
    const productId = parseInt(taskId.replace('WO-P-', ''));
    const { error } = await supabase
      .from('products')
      .update({ status: 'ACTIVE', updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (error) {
      console.error('审批任务时出错:', error);
      throw error;
    }
    console.log(`已审批任务: ${taskId}`);
  },

  rejectTask: async (taskId: string, reason: string) => {
    const productId = parseInt(taskId.replace('WO-P-', ''));
    const { error } = await supabase
      .from('products')
      .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (error) {
      console.error('驳回任务时出错:', error);
      throw error;
    }
    console.log(`已驳回任务: ${taskId}，原因: ${reason}`);
  },

  getCompletedTasks: async (params: any) => {
    console.log('正在获取已完成任务，参数:', params);

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .in('status', ['ACTIVE', 'REJECTED']);

    if (params.productId) {
      query = query.ilike('product_code', `%${params.productId.toLowerCase()}%`);
    }
    if (params.productName) {
      query = query.ilike('product_name', `%${params.productName.toLowerCase()}%`);
    }
    if (params.submitStartTime && params.submitEndTime) {
      query = query.gte('created_at', params.submitStartTime).lte('created_at', params.submitEndTime);
    }
    if (params.approvalStartTime && params.approvalEndTime) {
      query = query.gte('updated_at', params.approvalStartTime).lte('updated_at', params.approvalEndTime);
    }

    const { data: supabaseProducts, error: fetchError, count } = await query
      .order('updated_at', { ascending: false })
      .range(((params.page || 1) - 1) * (params.pageSize || 10), (params.page || 1) * (params.pageSize || 10) - 1);

    if (fetchError) {
      console.error('从 Supabase 获取已完成产品时出错:', fetchError);
      return { data: { items: [], totalCount: 0 } };
    }

    // 获取所有可用的子路径
    const availableSubPaths = await getAllAvailableSubPaths();

    const completedTasks = supabaseProducts.map((productRow: any, index: number) => {
      const product = mapSupabaseProductToProductType(productRow, availableSubPaths);
      return {
        id: `WO-C-${product.id}`,
        productId: product.productCode,
        productName: product.productName,
        status: product.status === 'ACTIVE' ? 'APPROVED' : 'REJECTED',
        submitter: ['张三', '李四', '王五', '赵六'][(index + 1) % 4],
        submitTime: moment(productRow.created_at).format('YYYY-MM-DDTHH:mm:ssZ'),
        approver: ['李四', '赵六', '孙八', '吴十'][(index + 2) % 4],
        approvalTime: moment(productRow.updated_at).format('YYYY-MM-DDTHH:mm:ssZ'),
      };
    });

    return {
      data: {
        items: completedTasks,
        totalCount: count || 0
      }
    };
  },

  saveExperimentalDeviation: async (deviationConfig: any) => {
    // 这通常会更新特定产品的 experimental_deviation_config JSONB 字段
    console.log('正在将实验偏离配置保存到 Supabase:', deviationConfig);
    // 假设 deviationConfig 包含 productId
    const { productId, ...configToSave } = deviationConfig;
    const { error } = await supabase
      .from('products')
      .update({ 
        experimental_deviation_config: configToSave, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', productId);

    if (error) {
      console.error('保存实验偏离配置时出错:', error);
      throw error;
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟 API 调用延迟
    return {
      data: {
        success: true,
        message: '实验偏离配置保存成功',
        savedConfig: deviationConfig,
        timestamp: new Date().toISOString(),
        configId: `DEV-${Date.now()}`
      }
    };
  },
};