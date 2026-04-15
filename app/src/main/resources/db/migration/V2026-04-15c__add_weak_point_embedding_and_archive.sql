-- V2026-04-15c: 为弱项添加 embedding 列（bytea，存储序列化的 float[]）
-- 用于语义去重和相似度匹配

ALTER TABLE user_weak_points ADD COLUMN IF NOT EXISTS embedding BYTEA;

-- 为已有弱项补充归档标记列（用于长期未见弱项的归档）
-- 注意：is_improved 已存在，此处不需修改

-- 添加 last_seen 的索引以支持归档查询
CREATE INDEX IF NOT EXISTS idx_weak_last_seen ON user_weak_points (user_id, last_seen) WHERE is_improved = FALSE;
