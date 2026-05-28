-- LLM Provider 配置表
CREATE TABLE llm_provider_config (
    id VARCHAR(64) PRIMARY KEY,
    base_url VARCHAR(512) NOT NULL,
    api_key_ciphertext VARCHAR(4096) NOT NULL,
    api_key_nonce VARCHAR(64) NOT NULL,
    model VARCHAR(128) NOT NULL,
    embedding_model VARCHAR(128),
    embedding_dimensions INT,
    supports_embedding BOOLEAN NOT NULL DEFAULT false,
    temperature DOUBLE PRECISION,
    enabled BOOLEAN NOT NULL DEFAULT true,
    builtin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_llm_provider_enabled ON llm_provider_config(enabled);

-- 全局设置表（单例，ID=1）
CREATE TABLE llm_global_setting (
    id BIGINT PRIMARY KEY,
    default_chat_provider_id VARCHAR(64) NOT NULL,
    default_embedding_provider_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 初始化默认Provider（DashScope）
INSERT INTO llm_provider_config (id, base_url, api_key_ciphertext, api_key_nonce, model, supports_embedding, enabled, builtin, created_at, updated_at)
VALUES ('dashscope', 'https://dashscope.aliyuncs.com/compatible-mode/v1', '', '', 'qwen-plus', true, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 初始化默认设置
INSERT INTO llm_global_setting (id, default_chat_provider_id, default_embedding_provider_id, created_at, updated_at)
VALUES (1, 'dashscope', 'dashscope', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);