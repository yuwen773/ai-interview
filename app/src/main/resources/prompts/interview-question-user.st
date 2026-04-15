# 输入数据
请为岗位 `{jobLabel}`（{jobRole}）生成共 {questionCount} 个主问题。
每个主问题必须额外生成 {followUpCount} 个追问。

## 岗位说明
- 岗位描述：{jobDescription}
- 技术关键词：{techKeywords}
- 重点关注：{focusAreas}

## 题目规划
{questionPlan}

## 额外提示
{promptHint}

## 可用题型枚举
{questionTypes}

## 候选人简历
---简历内容开始---
{resumeText}
---简历内容结束---

## 历史提问记录
以下是该候选人已经回答过的问题列表，请在生成新问题时尽可能避免重复：
---历史提问开始---
{historicalQuestions}
---历史提问结束---

## 历史弱项（专项训练优先）
{weakPointContext}

## 输出要求
请严格按照 JSON 格式输出问题列表，直接输出 JSON 对象，不要包含任何 Markdown 代码块标签。
