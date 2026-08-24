// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// 从环境变量获取 Supabase URL 和 Anon Key
// 确保在 .env 文件中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl); // 添加此行
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Loaded' : 'Not Loaded'); // 添加此行

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is not set in environment variables.');
  // 在生产环境中，您可能希望抛出错误或采取其他措施
  throw new Error('Supabase environment variables are missing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
