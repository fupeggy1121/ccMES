/*
  # MES生产事件和OEE数据表
  
  ## 概述
  创建MES（制造执行系统）数据分析所需的核心表结构，支持生产事件跟踪、
  OEE计算和质量分析。
  
  ## 新建表
  
  ### 1. production_events（生产事件记录表）
  - `id` (uuid, 主键) - 事件唯一标识
  - `equipment_id` (text) - 关联设备编号
  - `event_type` (text) - 事件类型（START/STOP/ALARM/PRODUCTION等）
  - `product_id` (text) - 产品编号
  - `shift` (text) - 班次（A/B/C）
  - `operator` (text) - 操作员
  - `output_qty` (integer) - 产出数量
  - `good_qty` (integer) - 良品数量
  - `defect_qty` (integer) - 不良品数量
  - `cycle_time` (numeric) - 周期时间（秒）
  - `downtime` (numeric) - 停机时间（分钟）
  - `timestamp` (timestamptz) - 事件时间
  - `created_at` (timestamptz) - 记录创建时间
  
  ### 2. oee_records（OEE计算记录表）
  - `id` (uuid, 主键) - 记录唯一标识
  - `equipment_id` (text) - 设备编号
  - `date` (date) - 日期
  - `shift` (text) - 班次
  - `availability` (numeric) - 可用率（%）
  - `performance` (numeric) - 性能率（%）
  - `quality` (numeric) - 质量率（%）
  - `oee` (numeric) - OEE综合效率（%）
  - `planned_time` (numeric) - 计划生产时间（分钟）
  - `actual_time` (numeric) - 实际生产时间（分钟）
  - `total_output` (integer) - 总产出
  - `good_output` (integer) - 良品产出
  - `created_at` (timestamptz) - 创建时间
  
  ### 3. quality_records（质量检测记录表）
  - `id` (uuid, 主键) - 记录唯一标识
  - `equipment_id` (text) - 设备编号
  - `product_id` (text) - 产品编号
  - `measurement_type` (text) - 测量类型（厚度/重量/尺寸等）
  - `measurement_value` (numeric) - 测量值
  - `unit` (text) - 单位
  - `upper_limit` (numeric) - 上限
  - `lower_limit` (numeric) - 下限
  - `status` (text) - 状态（PASS/FAIL）
  - `shift` (text) - 班次
  - `timestamp` (timestamptz) - 测量时间
  - `created_at` (timestamptz) - 创建时间

  ## 安全设置
  
  由于这是演示系统，所有表启用RLS但允许匿名访问（实际生产环境应基于auth.uid()控制）。
*/

-- 1. 创建生产事件记录表
CREATE TABLE IF NOT EXISTS production_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id text NOT NULL,
  event_type text NOT NULL DEFAULT 'PRODUCTION',
  product_id text NOT NULL DEFAULT 'P-001',
  shift text NOT NULL DEFAULT 'A',
  operator text DEFAULT '',
  output_qty integer DEFAULT 0,
  good_qty integer DEFAULT 0,
  defect_qty integer DEFAULT 0,
  cycle_time numeric DEFAULT 0,
  downtime numeric DEFAULT 0,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_production_events_equipment ON production_events(equipment_id);
CREATE INDEX IF NOT EXISTS idx_production_events_timestamp ON production_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_production_events_shift ON production_events(shift);

-- 2. 创建OEE记录表
CREATE TABLE IF NOT EXISTS oee_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id text NOT NULL,
  date date NOT NULL,
  shift text NOT NULL DEFAULT 'A',
  availability numeric DEFAULT 0,
  performance numeric DEFAULT 0,
  quality numeric DEFAULT 0,
  oee numeric DEFAULT 0,
  planned_time numeric DEFAULT 480,
  actual_time numeric DEFAULT 0,
  total_output integer DEFAULT 0,
  good_output integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(equipment_id, date, shift)
);

CREATE INDEX IF NOT EXISTS idx_oee_records_equipment ON oee_records(equipment_id);
CREATE INDEX IF NOT EXISTS idx_oee_records_date ON oee_records(date DESC);

-- 3. 创建质量记录表
CREATE TABLE IF NOT EXISTS quality_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id text NOT NULL,
  product_id text NOT NULL,
  measurement_type text NOT NULL,
  measurement_value numeric NOT NULL,
  unit text NOT NULL,
  upper_limit numeric DEFAULT 100,
  lower_limit numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'PASS',
  shift text NOT NULL DEFAULT 'A',
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quality_records_equipment ON quality_records(equipment_id);
CREATE INDEX IF NOT EXISTS idx_quality_records_timestamp ON quality_records(timestamp DESC);

-- 启用RLS
ALTER TABLE production_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE oee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_records ENABLE ROW LEVEL SECURITY;

-- 创建公开访问策略（演示用途）
CREATE POLICY "Allow public read access to production_events"
  ON production_events FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to oee_records"
  ON oee_records FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to quality_records"
  ON quality_records FOR SELECT
  TO anon
  USING (true);

-- 创建插入策略（演示数据生成用）
CREATE POLICY "Allow public insert to production_events"
  ON production_events FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public insert to oee_records"
  ON oee_records FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public insert to quality_records"
  ON quality_records FOR INSERT
  TO anon
  WITH CHECK (true);
