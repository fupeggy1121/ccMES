/*
  # 用户反馈系统表
  
  ## 概述
  创建用户反馈收集系统，用于记录用户对AI回复的反馈，驱动模型迭代优化。
  
  ## 新建表
  
  ### 1. feedback（基础反馈表）
  - `id` (uuid, 主键) - 反馈唯一标识
  - `message_id` (text) - 关联的消息ID
  - `feedback_type` (text) - 反馈类型（helpful/not_helpful/incorrect/other）
  - `rating` (integer) - 满意度评分（1-5星）
  - `comment` (text) - 反馈评论/说明
  - `query` (text) - 原始查询文本
  - `response` (text) - AI回复文本
  - `created_at` (timestamptz) - 创建时间
  
  ### 2. intent_feedback（意图识别反馈表）
  - `id` (uuid, 主键)
  - `feedback_id` (uuid, 外键) - 关联到feedback表
  - `recognized_intent` (text) - 识别的意图
  - `actual_intent` (text) - 实际意图
  - `confidence` (numeric) - 识别置信度
  - `is_correct` (boolean) - 是否正确识别
  - `created_at` (timestamptz)
  
  ### 3. query_result_feedback（查询结果反馈表）
  - `id` (uuid, 主键)
  - `feedback_id` (uuid, 外键)
  - `result_accuracy` (text) - 结果准确度（accurate/partial/incorrect）
  - `missing_data` (text) - 缺失的数据说明
  - `extra_data` (text) - 多余的数据说明
  - `suggestion` (text) - 改进建议
  - `created_at` (timestamptz)
  
  ## 安全设置
  启用RLS，匿名用户可插入和读取反馈数据。
*/

-- 1. 创建基础反馈表
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text NOT NULL,
  feedback_type text NOT NULL DEFAULT 'other',
  rating integer DEFAULT 3 CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  query text NOT NULL,
  response text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_message ON feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

-- 2. 创建意图反馈表
CREATE TABLE IF NOT EXISTS intent_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  recognized_intent text NOT NULL,
  actual_intent text DEFAULT '',
  confidence numeric DEFAULT 0,
  is_correct boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intent_feedback_feedback ON intent_feedback(feedback_id);
CREATE INDEX IF NOT EXISTS idx_intent_feedback_correct ON intent_feedback(is_correct);

-- 3. 创建查询结果反馈表
CREATE TABLE IF NOT EXISTS query_result_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  result_accuracy text NOT NULL DEFAULT 'partial',
  missing_data text DEFAULT '',
  extra_data text DEFAULT '',
  suggestion text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_query_result_feedback_feedback ON query_result_feedback(feedback_id);
CREATE INDEX IF NOT EXISTS idx_query_result_feedback_accuracy ON query_result_feedback(result_accuracy);

-- 启用RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_result_feedback ENABLE ROW LEVEL SECURITY;

-- 创建公开访问策略（演示用途）
CREATE POLICY "Allow public insert to feedback"
  ON feedback FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read feedback"
  ON feedback FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to intent_feedback"
  ON intent_feedback FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read intent_feedback"
  ON intent_feedback FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to query_result_feedback"
  ON query_result_feedback FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read query_result_feedback"
  ON query_result_feedback FOR SELECT
  TO anon
  USING (true);
