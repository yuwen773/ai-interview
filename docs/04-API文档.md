# API 文档

## 1. 概述

本文档描述 AI-Interview 平台的所有 RESTful API 接口。

### 1.1 基础信息

**Base URL**: `http://localhost:8080/api`

**响应格式**: JSON

**统一响应结构**:
```json
{
  "code": 200,
  "message": "success",
  "data": { }
}
```

### 1.2 错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 2xxx | 简历模块错误 |
| 3xxx | 面试模块错误 |
| 4xxx | 存储模块错误 |
| 5xxx | 导出模块错误 |
| 6xxx | 知识库模块错误 |
| 7xxx | AI 服务错误 |
| 8xxx | 限流错误 |

## 2. 简历模块 API

### 2.1 上传简历

**请求**:
```http
POST /api/resumes/upload
Content-Type: multipart/form-data
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 简历文件 (PDF/DOCX/DOC/TXT, 最大10MB) |
| customName | String | 否 | 自定义名称 |

**响应**:
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "id": 1,
    "filename": "张三_Java开发工程师.pdf",
    "fileSize": 123456,
    "uploadedAt": "2024-01-01T10:00:00",
    "analyzeStatus": "PENDING"
  }
}
```

### 2.2 获取简历列表

**请求**:
```http
GET /api/resumes?page=1&size=20
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| size | Integer | 否 | 每页数量，默认20，最大100 |

**响应**:
```json
{
  "code": 200,
  "data": {
    "total": 100,
    "items": [
      {
        "id": 1,
        "filename": "张三_Java开发工程师.pdf",
        "fileSize": 123456,
        "uploadedAt": "2024-01-01T10:00:00",
        "accessCount": 5,
        "latestScore": 85,
        "lastAnalyzedAt": "2024-01-01T10:05:00",
        "interviewCount": 2
      }
    ]
  }
}
```

### 2.3 获取简历详情

**请求**:
```http
GET /api/resumes/{id}/detail
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | Long | 简历ID |

**响应**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "filename": "张三_Java开发工程师.pdf",
    "fileSize": 123456,
    "contentType": "application/pdf",
    "storageUrl": "https://storage.example.com/resume/xxx.pdf",
    "uploadedAt": "2024-01-01T10:00:00",
    "accessCount": 5,
    "resumeText": "张三\nJava开发工程师\n...",
    "analyzeStatus": "COMPLETED",
    "analyzeError": null,
    "analyses": [
      {
        "id": 1,
        "overallScore": 85,
        "contentScore": 22,
        "structureScore": 18,
        "skillMatchScore": 23,
        "expressionScore": 12,
        "projectScore": 10,
        "summary": "该候选人整体表现优秀...",
        "analyzedAt": "2024-01-01T10:05:00",
        "strengths": ["技术栈全面", "项目经验丰富"],
        "suggestions": [
          {
            "category": "内容",
            "priority": "高",
            "issue": "缺少量化成果",
            "recommendation": "建议添加具体的项目数据"
          }
        ]
      }
    ],
    "interviews": []
  }
}
```

### 2.4 删除简历

**请求**:
```http
DELETE /api/resumes/{id}
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | Long | 简历ID |

**响应**:
```json
{
  "code": 200,
  "message": "删除成功"
}
```

### 2.5 重新分析简历

**请求**:
```http
POST /api/resumes/{id}/reanalyze
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | Long | 简历ID |

**响应**:
```json
{
  "code": 200,
  "message": "重新分析任务已提交",
  "data": {
    "resumeId": 1,
    "status": "PENDING"
  }
}
```

### 2.6 导出简历分析报告 (PDF)

**请求**:
```http
GET /api/resumes/{id}/export
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | Long | 简历ID |

**响应**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="resume_analysis_1.pdf"

[PDF 二进制数据]
```

## 3. 面试模块 API

### 3.1 创建面试会话

**请求**:
```http
POST /api/interview/sessions
Content-Type: application/json
```

**请求体**:
```json
{
  "resumeText": "张三\nJava开发工程师\n...",
  "questionCount": 10,
  "resumeId": 1,
  "forceCreate": false
}
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| resumeText | String | 是 | 简历文本 |
| questionCount | Integer | 是 | 题目数量 (3-20) |
| resumeId | Long | 是 | 简历ID |
| forceCreate | Boolean | 否 | 是否强制创建新会话，默认false |

**响应**:
```json
{
  "code": 200,
  "data": {
    "sessionId": "uuid-string",
    "resumeText": "张三\nJava开发工程师...",
    "totalQuestions": 10,
    "currentQuestionIndex": 0,
    "questions": [
      {
        "questionIndex": 0,
        "question": "请介绍一下你最近参与的项目",
        "type": "PROJECT",
        "category": "项目经历",
        "userAnswer": null,
        "score": null,
        "feedback": null,
        "isFollowUp": false,
        "parentQuestionIndex": null
      }
    ],
    "status": "CREATED"
  }
}
```

### 3.2 获取面试会话信息

**请求**:
```http
GET /api/interview/sessions/{sessionId}
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| sessionId | String | 会话ID |

**响应**:
```json
{
  "code": 200,
  "data": {
    "sessionId": "uuid-string",
    "resumeText": "...",
    "totalQuestions": 10,
    "currentQuestionIndex": 3,
    "questions": [...],
    "status": "IN_PROGRESS"
  }
}
```

### 3.3 获取当前问题

**请求**:
```http
GET /api/interview/sessions/{sessionId}/question
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| sessionId | String | 会话ID |

**响应**:
```json
{
  "code": 200,
  "data": {
    "questionIndex": 3,
    "question": "请解释一下 Java 的 HashMap 实现原理",
    "type": "JAVA_COLLECTION",
    "category": "集合",
    "userAnswer": null,
    "score": null,
    "feedback": null,
    "isFollowUp": false,
    "parentQuestionIndex": null
  }
}
```

### 3.4 提交答案

**请求**:
```http
POST /api/interview/sessions/{sessionId}/answers
Content-Type: application/json
```

**请求体**:
```json
{
  "sessionId": "uuid-string",
  "questionIndex": 3,
  "answer": "HashMap 是基于哈希表实现的..."
}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "hasNextQuestion": true,
    "nextQuestion": {
      "questionIndex": 4,
      "question": "HashMap 中的 hash 冲突是如何解决的？",
      "type": "JAVA_COLLECTION",
      "category": "集合",
      "isFollowUp": true,
      "parentQuestionIndex": 3
    },
    "currentIndex": 4,
    "totalQuestions": 10
  }
}
```

### 3.5 暂存答案

**请求**:
```http
PUT /api/interview/sessions/{sessionId}/answers
Content-Type: application/json
```

**请求体**:
```json
{
  "sessionId": "uuid-string",
  "questionIndex": 3,
  "answer": "HashMap 是基于哈希表实现的..."
}
```

**响应**:
```json
{
  "code": 200,
  "message": "答案已暂存"
}
```

### 3.6 提前交卷

**请求**:
```http
POST /api/interview/sessions/{sessionId}/complete
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| sessionId | String | 会话ID |

**响应**:
```json
{
  "code": 200,
  "message": "面试已提交，正在评估中...",
  "data": {
    "sessionId": "uuid-string",
    "evaluateStatus": "PENDING"
  }
}
```

### 3.7 获取面试报告

**请求**:
```http
GET /api/interview/sessions/{sessionId}/report
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| sessionId | String | 会话ID |

**响应**:
```json
{
  "code": 200,
  "data": {
    "sessionId": "uuid-string",
    "totalQuestions": 10,
    "overallScore": 82,
    "categoryScores": [
      {
        "category": "项目经历",
        "score": 85,
        "questionCount": 2
      },
      {
        "category": "Java基础",
        "score": 80,
        "questionCount": 2
      }
    ],
    "questionDetails": [
      {
        "questionIndex": 0,
        "question": "请介绍一下你最近参与的项目",
        "category": "项目经历",
        "userAnswer": "我最近参与了一个电商系统...",
        "score": 85,
        "feedback": "回答清晰，项目描述详细，建议补充项目难点"
      }
    ],
    "overallFeedback": "整体表现良好，基础知识扎实，项目经验丰富。",
    "strengths": [
      "Java 基础知识扎实",
      "项目经验丰富",
      "沟通表达清晰"
    ],
    "improvements": [
      "需要深入理解并发编程原理",
      "建议补充系统设计经验"
    ],
    "referenceAnswers": [
      {
        "questionIndex": 0,
        "question": "请介绍一下你最近参与的项目",
        "referenceAnswer": "建议从项目背景、技术选型、个人职责、项目成果等方面进行介绍...",
        "keyPoints": ["项目背景", "技术选型", "个人职责", "项目成果"]
      }
    ]
  }
}
```

### 3.8 导出面试报告 (PDF)

**请求**:
```http
GET /api/interview/sessions/{sessionId}/export
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| sessionId | String | 会话ID |

**响应**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="interview_report_xxx.pdf"

[PDF 二进制数据]
```

### 3.9 删除面试会话

**请求**:
```http
DELETE /api/interview/sessions/{sessionId}
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| sessionId | String | 会话ID |

**响应**:
```json
{
  "code": 200,
  "message": "会话已删除"
}
```

### 3.10 获取面试历史列表

**请求**:
```http
GET /api/interview/history?resumeId=1&page=1&size=20
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| resumeId | Long | 是 | 简历ID |
| page | Integer | 否 | 页码，默认1 |
| size | Integer | 否 | 每页数量，默认20 |

**响应**:
```json
{
  "code": 200,
  "data": {
    "total": 5,
    "items": [
      {
        "id": 1,
        "sessionId": "uuid-string",
        "status": "EVALUATED",
        "overallScore": 82,
        "totalQuestions": 10,
        "createdAt": "2024-01-01T10:00:00",
        "completedAt": "2024-01-01T10:30:00"
      }
    ]
  }
}
```

## 4. 知识库模块 API

### 4.1 上传知识库文件

**请求**:
```http
POST /api/knowledgebase/upload
Content-Type: multipart/form-data
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 知识库文件 (最大50MB) |
| name | String | 否 | 知识库名称 |
| category | String | 否 | 分类 |

**响应**:
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "id": 1,
    "name": "Java核心技术",
    "category": "技术文档",
    "originalFilename": "java_core.pdf",
    "fileSize": 234567,
    "uploadedAt": "2024-01-01T10:00:00",
    "vectorStatus": "PENDING"
  }
}
```

### 4.2 获取知识库列表

**请求**:
```http
GET /api/knowledgebase/list?category=技术文档&page=1&size=20
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | String | 否 | 分类筛选 |
| page | Integer | 否 | 页码，默认1 |
| size | Integer | 否 | 每页数量，默认20 |

**响应**:
```json
{
  "code": 200,
  "data": {
    "total": 10,
    "items": [
      {
        "id": 1,
        "name": "Java核心技术",
        "category": "技术文档",
        "originalFilename": "java_core.pdf",
        "fileSize": 234567,
        "uploadedAt": "2024-01-01T10:00:00",
        "lastAccessedAt": "2024-01-01T11:00:00",
        "accessCount": 5,
        "questionCount": 12,
        "vectorStatus": "COMPLETED",
        "vectorError": null,
        "chunkCount": 150
      }
    ]
  }
}
```

### 4.3 获取知识库详情

**请求**:
```http
GET /api/knowledgebase/{id}
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | Long | 知识库ID |

**响应**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "name": "Java核心技术",
    "category": "技术文档",
    "originalFilename": "java_core.pdf",
    "fileSize": 234567,
    "contentType": "application/pdf",
    "storageUrl": "https://storage.example.com/kb/xxx.pdf",
    "uploadedAt": "2024-01-01T10:00:00",
    "lastAccessedAt": "2024-01-01T11:00:00",
    "accessCount": 5,
    "questionCount": 12,
    "vectorStatus": "COMPLETED",
    "vectorError": null,
    "chunkCount": 150
  }
}
```

### 4.4 删除知识库

**请求**:
```http
DELETE /api/knowledgebase/{id}
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | Long | 知识库ID |

**响应**:
```json
{
  "code": 200,
  "message": "知识库已删除"
}
```

### 4.5 查询知识库

**请求**:
```http
POST /api/knowledgebase/query
Content-Type: application/json
```

**请求体**:
```json
{
  "knowledgeBaseIds": [1, 2, 3],
  "question": "Java 中 HashMap 的实现原理是什么？"
}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "answer": "HashMap 是基于哈希表实现的 Map 接口...",
    "knowledgeBaseId": 1,
    "knowledgeBaseName": "Java核心技术"
  }
}
```

### 4.6 流式查询知识库 (SSE)

**请求**:
```http
POST /api/knowledgebase/query/stream
Content-Type: application/json
```

**请求体**:
```json
{
  "knowledgeBaseIds": [1, 2],
  "question": "Java 中 HashMap 的实现原理是什么？"
}
```

**响应**:
```
Content-Type: text/event-stream

data: {"type":"start","data":""}

data: {"type":"content","data":"HashMap "}

data: {"type":"content","data":"是基于"}

data: {"type":"content","data":"哈希表"}

...

data: {"type":"end","data":""}
```

### 4.7 获取所有分类

**请求**:
```http
GET /api/knowledgebase/categories
```

**响应**:
```json
{
  "code": 200,
  "data": ["技术文档", "面试题库", "公司制度", "产品手册"]
}
```

### 4.8 更新知识库分类

**请求**:
```http
PUT /api/knowledgebase/{id}/category
Content-Type: application/json
```

**请求体**:
```json
{
  "category": "新的分类"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "分类已更新"
}
```

### 4.9 获取知识库统计

**请求**:
```http
GET /api/knowledgebase/stats
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "totalCount": 50,
    "totalQuestionCount": 1250,
    "totalAccessCount": 3500,
    "completedCount": 45,
    "processingCount": 3,
    "failedCount": 2
  }
}
```

## 5. RAG 聊天 API

### 5.1 创建聊天会话

**请求**:
```http
POST /api/rag-chat/sessions
Content-Type: application/json
```

**请求体**:
```json
{
  "knowledgeBaseIds": [1, 2, 3],
  "title": "Java 技术咨询"
}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "title": "Java 技术咨询",
    "knowledgeBaseIds": [1, 2, 3],
    "createdAt": "2024-01-01T10:00:00"
  }
}
```

### 5.2 获取会话列表

**请求**:
```http
GET /api/rag-chat/sessions?page=1&size=20
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "total": 5,
    "items": [
      {
        "id": 1,
        "title": "Java 技术咨询",
        "messageCount": 12,
        "knowledgeBaseNames": ["Java核心技术", "面试题库"],
        "updatedAt": "2024-01-01T11:00:00",
        "isPinned": false
      }
    ]
  }
}
```

### 5.3 获取会话详情

**请求**:
```http
GET /api/rag-chat/sessions/{id}
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | Long | 会话ID |

**响应**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "title": "Java 技术咨询",
    "knowledgeBases": [...],
    "messages": [
      {
        "id": 1,
        "type": "user",
        "content": "HashMap 的实现原理是什么？",
        "createdAt": "2024-01-01T10:00:00"
      },
      {
        "id": 2,
        "type": "assistant",
        "content": "HashMap 是基于哈希表实现的...",
        "createdAt": "2024-01-01T10:00:05"
      }
    ],
    "createdAt": "2024-01-01T10:00:00",
    "updatedAt": "2024-01-01T11:00:00"
  }
}
```

### 5.4 发送消息 (流式)

**请求**:
```http
POST /api/rag-chat/sessions/{id}/messages/stream
Content-Type: application/json
```

**请求体**:
```json
{
  "question": "HashMap 的实现原理是什么？"
}
```

**响应**:
```
Content-Type: text/event-stream

data: {"type":"start","data":""}

data: {"type":"content","data":"HashMap "}

data: {"type":"content","data":"是基于"}

...

data: {"type":"end","data":""}
```

### 5.5 更新会话标题

**请求**:
```http
PUT /api/rag-chat/sessions/{id}/title
Content-Type: application/json
```

**请求体**:
```json
{
  "title": "新标题"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "标题已更新"
}
```

### 5.6 更新关联知识库

**请求**:
```http
PUT /api/rag-chat/sessions/{id}/knowledgebases
Content-Type: application/json
```

**请求体**:
```json
{
  "knowledgeBaseIds": [1, 2, 4]
}
```

**响应**:
```json
{
  "code": 200,
  "message": "知识库已更新"
}
```

### 5.7 删除聊天会话

**请求**:
```http
DELETE /api/rag-chat/sessions/{id}
```

**响应**:
```json
{
  "code": 200,
  "message": "会话已删除"
}
```

### 5.8 置顶/取消置顶会话

**请求**:
```http
PUT /api/rag-chat/sessions/{id}/pin
```

**响应**:
```json
{
  "code": 200,
  "message": "操作成功"
}
```

## 6. 语音服务 API

### 6.1 语音转文字 (ASR)

**请求**:
```http
POST /api/audio/asr
Content-Type: multipart/form-data
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| audio | File | 是 | 音频文件 |

**响应**:
```json
{
  "code": 200,
  "data": {
    "text": "识别出的文字内容"
  }
}
```

### 6.2 文字转语音 (TTS)

**请求**:
```http
POST /api/audio/tts
Content-Type: application/json
```

**请求体**:
```json
{
  "text": "要转换的文字",
  "voice": "longhua",
  "speed": 1.0,
  "format": "mp3"
}
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| text | String | 是 | 要转换的文字 |
| voice | String | 否 | 发音人，默认 longhua |
| speed | Double | 否 | 语速，默认 1.0 |
| format | String | 否 | 格式，默认 mp3 |

**响应**:
```
Content-Type: audio/mpeg

[音频二进制数据]
```

### 6.3 流式语音合成

**请求**:
```http
POST /api/audio/tts/stream
Content-Type: application/json
```

**请求体**:
```json
{
  "text": "要转换的文字",
  "voice": "longhua"
}
```

**响应**:
```
Content-Type: audio/mpeg

[流式音频数据]
```

## 7. 健康检查

### 7.1 系统健康状态

**请求**:
```http
GET /actuator/health
```

**响应**:
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": { "database": "PostgreSQL", "validationQuery": "isValid()" }
    },
    "redis": {
      "status": "UP"
    }
  }
}
```

## 8. 限流说明

系统在以下接口实现了限流：

| 接口 | 限流策略 |
|------|---------|
| POST /api/resumes/upload | 5次/分钟/IP |
| POST /api/interview/sessions | 10次/分钟/IP |
| POST /api/knowledgebase/upload | 3次/分钟/IP |
| POST /api/knowledgebase/query | 20次/分钟/IP |

超出限流将返回：
```json
{
  "code": 8001,
  "message": "请求过于频繁，请稍后再试"
}
```
