// src/api/index.ts
import { supabase } from './supabase';

import { approval } from './approval';
import { products } from './products';
import { equipment } from './equipment';
import { parameters } from './parameters';
import { processRoutes } from './processRoutes';

const api = {
  approval,
  products,
  equipment,
  parameters,
  processRoutes,
  supabase, // 暴露 supabase 客户端
};

export default api;