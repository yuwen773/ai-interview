# AI-Interview 开发文档

## 文档目录

本文档提供 AI-Interview 项目的完整开发指南，帮助开发者快速理解项目架构并进行二次开发。

### 📚 文档索引

| 文档 | 说明 |
|------|------|
| [01-项目概述.md](./01-项目概述.md) | 项目简介、功能特性、系统架构 |
| [02-技术架构.md](./02-技术架构.md) | 技术栈、分层架构、设计模式 |
| [03-数据模型.md](./03-数据模型.md) | 数据库设计、实体关系、DTO定义 |
| [04-API文档.md](./04-API文档.md) | RESTful API 接口规范 |
| [05-开发指南.md](./05-开发指南.md) | 本地开发、代码规范、调试技巧 |
| [06-部署指南.md](./06-部署指南.md) | 生产环境部署、Docker配置 |
| [07-二次开发指南.md](./07-二次开发指南.md) | 扩展点说明、开发示例 |

### 快速开始

```bash
# 克隆项目
git clone <repository-url>
cd ai-interview

# 启动开发环境
docker-compose up -d

# 后端启动
cd app
mvn spring-boot:run

# 前端启动
cd frontend
npm install
npm run dev
```

### 项目结构

```
ai-interview/
├── app/                    # 后端 (Spring Boot 3 + Java 21)
├── frontend/               # 前端 (React 18 + TypeScript)
├── docker/                 # Docker 配置
├── docs/                   # 开发文档
├── docker-compose.yml      # 容器编排
└── README.md              # 项目说明
```

### 技术栈概览

**后端**
- Spring Boot 3.x
- Java 21 (虚拟线程)
- PostgreSQL + pgvector
- Redis (缓存 + Stream)
- Spring AI + 通义千问

**前端**
- React 18.3 + TypeScript
- Vite 5.4
- Tailwind CSS 4.1
- Three.js (3D虚拟面试官)

### 核心功能

| 模块 | 功能 |
|------|------|
| 简历管理 | 上传解析、AI分析、评分建议 |
| 智能面试 | 问题生成、答案评估、报告生成 |
| 知识库(RAG) | 文档向量化、智能问答 |
| 语音服务 | ASR语音转文字、TTS文字转语音 |

### 联系方式

如有问题，请提交 Issue 或联系开发团队。
