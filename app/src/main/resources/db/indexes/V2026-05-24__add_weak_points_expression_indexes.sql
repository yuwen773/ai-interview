-- ease_factor 表达式索引，解决按难度因子排序（SM-2 算法中难度因子越低越需优先复习）
CREATE INDEX idx_weak_ease_factor_expr ON user_weak_points (((sr_state->>'ease_factor')::decimal));