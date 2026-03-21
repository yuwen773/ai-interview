# AI Interview Platform

> 智能模拟面试平台 - 基于 AI 技术的真实面试体验

## 项目简介

AI Interview Platform 是一个全栈智能面试模拟平台，提供真实的面试体验，包括虚拟考官、语音交互、代码评估等功能。

### 核心功能

- **AI 虚拟考官**: 基于 Qwen 大模型的智能面试官，支持多领域技术问题
- **3D 虚拟形象**: 使用 Three.js + VRM 技术的 3D 虚拟考官形象
- **语音交互**: 支持语音问答，提供真实面试体验
- **多端支持**: Web 端 + 微信小程序 + H5
- **知识库管理**: 支持简历解析、面试题库管理、语音合成等功能
- **数据分析**: 面试记录分析、能力评估报告

## 技术架构

### 后端 (Spring Boot)

| 技术 | 版本 | 说明 |
|------|------|------|
| Java | 21 | 编程语言 |
| Spring Boot | 4.0.1 | 应用框架 |
| Spring AI | 2.0.0-M1 | AI 集成框架 |
| Maven | 3.9 | 构建工具 |

**核心模块**:
- `audio`: 语音服务（语音识别、语音合成）
- `interview`: 面试核心业务
- `knowledgebase`: 知识库管理
- `resume`: 简历解析与管理

### 前端 (React)

| 技术 | 版本 | 说明 |
|------|------|------|
| React | 18.3.1 | UI 框架 |
| TypeScript | 5.6.2 | 类型系统 |
| Vite | 5.4.10 | 构建工具 |
| TailwindCSS | 4.1.18 | 样式框架 |
| Three.js | 0.164.0 | 3D 渲染 |
| @pixiv/three-vrm | 2.0.0 | VRM 虚拟形象 |

### 小程序 (Taro)

| 技术 | 版本 | 说明 |
|------|------|------|
| Taro | 3.6.30 | 多端框架 |
| React | 18.2.0 | UI 框架 |

支持平台：微信小程序、支付宝小程序、H5

### 基础设施

| 服务 | 版本 | 说明 |
|------|------|------|
| PostgreSQL | 16 + pgvector | 关系型数据库 + 向量搜索 |
| Redis | 7 | 缓存 |
| MinIO | latest | 对象存储 |

## 快速开始

### 环境要求

- **JDK**: 21+
- **Node.js**: 18+
- **Maven**: 3.9+
- **Docker**: 20+ (可选，用于基础设施服务)
- **pnpm**: 10+ (前端推荐)

### 1. 配置环境变量

复制示例配置文件并填入实际值：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 阿里云 DashScope API Key
AI_BAILIAN_API_KEY=your_api_key_here

# AI 模型
AI_MODEL=qwen-plus
```

> 获取 API Key: https://dashscope.aliyun.com/

### 2. 启动基础设施服务

使用 Docker Compose 启动数据库、Redis 和 MinIO：

```bash
docker-compose up -d postgres redis minio createbuckets
```

### 3. 启动后端服务

```bash
# 进入后端目录
cd app

# 运行应用
mvn spring-boot:run

# 或指定配置文件
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

后端服务将在 `http://localhost:8080` 启动

### 4. 启动前端服务

```bash
# 进入前端目录
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

前端服务将在 `http://localhost:5173` 启动

### 5. 启动小程序（可选）

```bash
# 进入小程序目录
cd uniapp-interview

# 安装依赖
pnpm install

# 微信小程序开发
pnpm dev:weapp

# H5 开发
pnpm dev:h5
```

## 项目结构

```
ai-interview/
├── app/                          # Spring Boot 后端
│   └── src/main/java/interview/guide/
│       ├── common/               # 公共模块
│       ├── infrastructure/       # 基础设施层
│       │   └── file/            # 文件存储
│       └── modules/             # 业务模块
│           ├── audio/           # 语音服务
│           ├── interview/       # 面试业务
│           ├── knowledgebase/   # 知识库
│           └── resume/          # 简历管理
├── frontend/                     # React 前端
│   └── src/
├── uniapp-interview/             # Taro 小程序
│   └── src/
├── docker/                       # Docker 配置
│   └── postgres/init.sql        # 数据库初始化
├── docker-compose.yml            # 容器编排
├── Dockerfile                    # 应用镜像
└── pom.xml                       # Maven 配置
```

## 常用命令

### Maven 构建命令

```bash
# 清理构建
mvn clean

# 编译
mvn compile

# 运行测试
mvn test

# 打包
mvn package

# 跳过测试打包
mvn package -DskipTests

# 运行应用
mvn spring-boot:run

# 指定配置文件运行
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### Docker 命令

```bash
# 构建镜像
docker-compose build

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

## 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 API | 8080 | Spring Boot 应用 |
| 前端 | 5173 | Vite 开发服务器 |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |
| MinIO API | 9000 | 对象存储 API |
| MinIO Console | 9001 | 对象存储管理界面 |

## 📚 开发文档

完整的开发文档已放在 `docs/` 目录下，包含：

| 文档 | 说明 |
|------|------|
| [项目概述](docs/dev/01-项目概述.md) | 项目简介、功能特性、系统架构 |
| [技术架构](docs/dev/02-技术架构.md) | 技术栈、分层架构、设计模式 |
| [数据模型](docs/dev/03-数据模型.md) | 数据库设计、实体关系、DTO定义 |
| [API文档](docs/dev/04-API文档.md) | RESTful API 接口规范 |
| [开发指南](docs/dev/05-开发指南.md) | 本地开发、代码规范、调试技巧 |
| [部署指南](docs/dev/06-部署指南.md) | 生产环境部署、Docker/K8s配置 |
| [二次开发指南](docs/dev/07-二次开发指南.md) | 扩展点说明、开发示例 |

### 快速导航

- **新手入门**: 阅读 [01-项目概述](docs/dev/01-项目概述.md) 和 [05-开发指南](docs/dev/05-开发指南.md)
- **API对接**: 查看 [04-API文档](docs/dev/04-API文档.md)
- **二次开发**: 参考 [07-二次开发指南](docs/dev/07-二次开发指南.md)
- **生产部署**: 参考 [06-部署指南](docs/dev/06-部署指南.md)

## 开发指南

### 添加新的后端模块

```bash
# 在 app/src/main/java/interview/guide/modules 下创建新模块
mkdir -p app/src/main/java/interview/guide/modules/your-module
```

### 前端开发

```bash
# 安装新依赖
pnpm add package-name

# 类型检查
pnpm tsc --noEmit

# 构建生产版本
pnpm build
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
