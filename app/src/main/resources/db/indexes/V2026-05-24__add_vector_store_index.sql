-- 向量存储按 kb_id 查询索引
CREATE INDEX idx_vector_store_kb_id ON vector_store((metadata->>'kb_id'));