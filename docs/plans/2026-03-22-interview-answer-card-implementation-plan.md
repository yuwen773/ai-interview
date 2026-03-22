# 模拟面试答题卡抽屉 - 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将模拟面试页面的对话记录移除，新增右侧滑出的答题卡抽屉，提供题目导航能力。

**Architecture:** 答题卡数据从 `InterviewSession.questions` 派生，状态分为已答/暂存/未答三种。抽屉组件通过手势和点击触发，支持展开查看详情和修改暂存答案。

**Tech Stack:** Taro + React + TypeScript + SCSS

---

## 数据格式说明（基于真实 API 响应）

```ts
interface InterviewSession {
  sessionId: string;
  currentQuestionIndex: number;  // 0-based，当前题目的索引
  questions: Question[];          // 所有题目数组
}

interface Question {
  questionIndex: number;         // 0-based
  question: string;               // 题目内容
  userAnswer: string | null;      // 用户回答，未回答时为 null
  isFollowUp: boolean;            // 是否为追问
  parentQuestionIndex: number | null;  // 追问的父问题索引
}
```

**状态判断逻辑：**
```ts
// answerCards 派生逻辑
questions.map((q, index) => {
  // index < currentQuestionIndex: 该题已过，已答
  // index === currentQuestionIndex: 当前题
  //   - q.userAnswer 有值且非空 → 已答（之前暂存后提交，或恢复时已有）
  //   - q.userAnswer 为 null → 未答
  // index > currentQuestionIndex: 未到该题，未答

  let status: AnswerCardStatus;
  if (index < currentQuestionIndex) {
    status = 'answered';
  } else if (index === currentQuestionIndex) {
    status = q.userAnswer ? 'answered' : 'unanswered';
  } else {
    status = 'unanswered';
  }

  return {
    questionIndex: index,           // 0-based，与 API 一致
    displayIndex: index + 1,         // 1-based，显示用
    status,
    question: q.question,
    savedAnswer: q.userAnswer,
  };
});
```

---

## Task 1: 添加答题卡类型定义

**Files:**
- Modify: `uniapp-interview/src/types/interview.ts`

**Step 1: 添加类型定义**

在 `interview.ts` 末尾添加：

```ts
// 答题卡状态
export type AnswerCardStatus = 'answered' | 'saved' | 'unanswered';

// 答题卡条目
export interface AnswerCardItem {
  questionIndex: number;    // 题号（0-based，与 API 一致）
  displayIndex: number;     // 显示用题号（1-based，Q1, Q2...）
  status: AnswerCardStatus;
  question: string;         // 题目内容
  savedAnswer?: string;     // 用户回答（answered/saved 状态时有值）
}
```

**Step 2: 验证类型**

Run: `cd uniapp-interview && npx tsc --noEmit src/types/interview.ts`
Expected: 无编译错误

**Step 3: 提交**

```bash
git add uniapp-interview/src/types/interview.ts
git commit -m "feat(interview): add AnswerCardStatus and AnswerCardItem types"
```

---

## Task 2: 创建 AnswerCardItem 组件

**Files:**
- Create: `uniapp-interview/src/components/interview/AnswerCardItem/index.tsx`
- Create: `uniapp-interview/src/components/interview/AnswerCardItem/index.scss`

**Step 1: 创建 AnswerCardItem 组件**

`uniapp-interview/src/components/interview/AnswerCardItem/index.tsx`:

```tsx
import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import type { AnswerCardItem as AnswerCardItemType } from '../../../types/interview';
import './index.scss';

interface Props {
  item: AnswerCardItemType;
  isCurrent: boolean;
  onSaveAnswer?: (questionIndex: number, answer: string) => void;
}

const STATUS_CONFIG = {
  answered: { label: '已答', color: '#22c55e' },
  saved: { label: '暂存', color: '#eab308' },
  unanswered: { label: '未答', color: '#ef4444' },
};

export default function AnswerCardItem({ item, isCurrent, onSaveAnswer }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editAnswer, setEditAnswer] = useState(item.savedAnswer || '');
  const config = STATUS_CONFIG[item.status];

  // 当展开时，同步最新的 savedAnswer
  useEffect(() => {
    if (expanded) {
      setEditAnswer(item.savedAnswer || '');
    }
  }, [expanded, item.savedAnswer]);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleSave = () => {
    if (onSaveAnswer && item.status === 'saved') {
      onSaveAnswer(item.questionIndex, editAnswer);  // questionIndex 是 0-based
      setExpanded(false);
    }
  };

  return (
    <View
      className={`answer-card-item ${isCurrent ? 'answer-card-item--current' : ''} answer-card-item--${item.status}`}
      onClick={handleToggle}
    >
      <View className="answer-card-item__header">
        <Text className="answer-card-item__index">Q{item.displayIndex}</Text>
        <View className="answer-card-item__status" style={{ backgroundColor: config.color }}>
          <Text className="answer-card-item__status-text">{config.label}</Text>
        </View>
      </View>

      {expanded && (
        <View className="answer-card-item__detail" onClick={(e) => e.stopPropagation()}>
          <Text className="answer-card-item__question">{item.question}</Text>
          {item.status === 'saved' && (
            <>
              <Text className="answer-card-item__answer-label">暂存的答案：</Text>
              <View className="answer-card-item__answer-input">
                <textarea
                  value={editAnswer}
                  onInput={(e) => setEditAnswer(e.detail.value)}
                  placeholder="请输入答案..."
                  maxLength={2000}
                />
              </View>
              <View className="answer-card-item__actions">
                <Text className="answer-card-item__save-btn" onClick={handleSave}>保存</Text>
              </View>
            </>
          )}
          {item.status === 'answered' && item.savedAnswer && (
            <>
              <Text className="answer-card-item__answer-label">我的回答：</Text>
              <Text className="answer-card-item__answer-text">{item.savedAnswer}</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}
```

**Step 2: 创建样式文件**

`uniapp-interview/src/components/interview/AnswerCardItem/index.scss`:

```scss
.answer-card-item {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  border: 2px solid transparent;

  &--current {
    border-color: #2563eb;
    background: #eff6ff;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__index {
    font-size: 28px;
    font-weight: 600;
    color: #0f172a;
  }

  &__status {
    padding: 6px 16px;
    border-radius: 999px;

    &-text {
      font-size: 20px;
      color: #ffffff;
      font-weight: 500;
    }
  }

  &__detail {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
  }

  &__question {
    display: block;
    font-size: 24px;
    color: #0f172a;
    line-height: 1.6;
    margin-bottom: 12px;
  }

  &__answer-label {
    display: block;
    font-size: 22px;
    color: #64748b;
    margin-bottom: 8px;
  }

  &__answer-input {
    background: #f8fafc;
    border-radius: 12px;
    padding: 12px;

    textarea {
      width: 100%;
      min-height: 120px;
      font-size: 24px;
      line-height: 1.6;
      color: #0f172a;
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }

  &__save-btn {
    font-size: 24px;
    color: #2563eb;
    font-weight: 600;
    padding: 8px 16px;
  }

  &__answer-text {
    display: block;
    font-size: 24px;
    color: #0f172a;
    line-height: 1.6;
    background: #f8fafc;
    padding: 12px;
    border-radius: 12px;
  }
}
```

**Step 3: 验证编译**

Run: `cd uniapp-interview && npx tsc --noEmit`
Expected: 无编译错误

**Step 4: 提交**

```bash
git add uniapp-interview/src/components/interview/AnswerCardItem/
git commit -m "feat(interview): add AnswerCardItem component"
```

---

## Task 3: 创建 AnswerCardDrawer 组件

**Files:**
- Create: `uniapp-interview/src/components/interview/AnswerCardDrawer/index.tsx`
- Create: `uniapp-interview/src/components/interview/AnswerCardDrawer/index.scss`

**Step 1: 创建 AnswerCardDrawer 组件**

`uniapp-interview/src/components/interview/AnswerCardDrawer/index.tsx`:

```tsx
import { View, Text } from '@tarojs/components';
import { useEffect, useRef, useState } from 'react';
import type { AnswerCardItem as AnswerCardItemType } from '../../../types/interview';
import AnswerCardItem from '../AnswerCardItem';
import './index.scss';

interface Props {
  visible: boolean;
  items: AnswerCardItemType[];
  currentIndex: number;
  onClose: () => void;
  onSaveAnswer?: (questionIndex: number, answer: string) => void;
}

export default function AnswerCardDrawer({ visible, items, currentIndex, onClose, onSaveAnswer }: Props) {
  const startX = useRef(0);
  const startY = useRef(0);

  useEffect(() => {
    // 阻止背景滚动
    if (visible) {
      Taro.setNavigationBarTitle({ title: '' });
    }
  }, [visible]);

  const handleTouchStart = (e: any) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: any) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - startX.current;
    const deltaY = endY - startY.current;

    // 水平滑动大于50px且方向为从右向左（负值）
    if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < Math.abs(deltaX)) {
      if (deltaX < 0) {
        // 从右向左滑，关闭
        onClose();
      }
    }
  };

  const handleOverlayClick = () => {
    onClose();
  };

  if (!visible) return null;

  return (
    <View className="answer-card-drawer">
      {/* 遮罩层 */}
      <View className="answer-card-drawer__overlay" onClick={handleOverlayClick} />

      {/* 抽屉内容 */}
      <View
        className="answer-card-drawer__content"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <View className="answer-card-drawer__header">
          <Text className="answer-card-drawer__title">答题卡</Text>
          <View className="answer-card-drawer__legend">
            <View className="answer-card-drawer__legend-item">
              <View className="answer-card-drawer__legend-dot" style={{ backgroundColor: '#22c55e' }} />
              <Text>已答</Text>
            </View>
            <View className="answer-card-drawer__legend-item">
              <View className="answer-card-drawer__legend-dot" style={{ backgroundColor: '#eab308' }} />
              <Text>暂存</Text>
            </View>
            <View className="answer-card-drawer__legend-item">
              <View className="answer-card-drawer__legend-dot" style={{ backgroundColor: '#ef4444' }} />
              <Text>未答</Text>
            </View>
          </View>
        </View>

        <View className="answer-card-drawer__list">
          {items.map((item) => (
            <AnswerCardItem
              key={item.questionIndex}
              item={item}
              isCurrent={item.questionIndex === currentIndex}
              onSaveAnswer={onSaveAnswer}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
```

**Step 2: 创建样式文件**

`uniapp-interview/src/components/interview/AnswerCardDrawer/index.scss`:

```scss
.answer-card-drawer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;

  &__overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 40%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
  }

  &__content {
    position: absolute;
    top: 0;
    right: 0;
    width: 60%;
    height: 100%;
    background: #f8fafc;
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
  }

  &__header {
    padding: 24px 20px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
  }

  &__title {
    font-size: 32px;
    font-weight: 700;
    color: #0f172a;
    display: block;
    margin-bottom: 16px;
  }

  &__legend {
    display: flex;
    gap: 16px;

    &-item {
      display: flex;
      align-items: center;
      gap: 6px;

      Text {
        font-size: 22px;
        color: #64748b;
      }
    }

    &-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }
}
```

**Step 3: 验证编译**

Run: `cd uniapp-interview && npx tsc --noEmit`
Expected: 无编译错误

**Step 4: 提交**

```bash
git add uniapp-interview/src/components/interview/AnswerCardDrawer/
git commit -m "feat(interview): add AnswerCardDrawer component"
```

---

## Task 4: 修改 InterviewPage 集成答题卡

**Files:**
- Modify: `uniapp-interview/src/pages/interview/index.tsx`
- Modify: `uniapp-interview/src/pages/interview/index.scss`

**Step 1: 修改 InterviewPage - 移除历史记录，添加答题卡状态**

在 `index.tsx` 中：

1. 添加 state:
```ts
const [drawerVisible, setDrawerVisible] = useState(false);
```

2. 添加 answerCards 派生数据:
```ts
// 注意：currentQuestionIndex 是 0-based
const answerCards: AnswerCardItem[] = questions.map((q, index) => {
  let status: AnswerCardStatus;
  if (index < currentQuestionIndex) {
    status = 'answered';
  } else if (index === currentQuestionIndex) {
    status = q.userAnswer ? 'answered' : 'unanswered';
  } else {
    status = 'unanswered';
  }

  return {
    questionIndex: index,           // 0-based，API 用
    displayIndex: index + 1,       // 1-based，显示用
    status,
    question: q.question,
    savedAnswer: q.userAnswer || undefined,
  };
});
```

3. 添加 handleSaveAnswer 函数:
```ts
const handleSaveAnswer = async (questionIndex: number, answer: string) => {
  // questionIndex 是 0-based
  try {
    await interviewApi.saveAnswer({
      sessionId,
      answer,
      questionIndex,
    });
    // 更新本地 questions 状态
    setQuestions(prev => prev.map((q, i) =>
      i === questionIndex ? { ...q, userAnswer: answer } : q
    ));
    Taro.showToast({ title: '已保存', icon: 'success' });
  } catch (error) {
    Taro.showToast({ title: '保存失败', icon: 'none' });
  }
};
```

4. 移除 messages state 和相关渲染代码（`messages` 数组、`messages.length > 0` 的 history 区域）

5. 添加抽屉触发按钮（在底部操作区上方）:
```tsx
<View className="interview-page__drawer-trigger" onClick={() => setDrawerVisible(true)}>
  <Text>答题卡</Text>
  <Text className="interview-page__drawer-hint">点击查看全部题目</Text>
</View>
```

6. 添加抽屉组件:
```tsx
<AnswerCardDrawer
  visible={drawerVisible}
  items={answerCards}
  currentIndex={currentQuestionIndex}
  onClose={() => setDrawerVisible(false)}
  onSaveAnswer={handleSaveAnswer}
/>
```

**Step 2: 修改样式 - 移除历史记录样式，添加抽屉触发按钮样式**

在 `index.scss` 中：

1. 移除 `&__history` 相关样式
2. 添加抽屉触发按钮样式:
```scss
&__drawer-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: #eff6ff;
  border-radius: 16px;
  border: 1px dashed #2563eb;

  Text {
    font-size: 26px;
    color: #2563eb;
    font-weight: 500;
  }

  &-hint {
    font-size: 22px !important;
    color: #64748b !important;
    font-weight: 400 !important;
  }
}
```

**Step 3: 验证编译**

Run: `cd uniapp-interview && npx tsc --noEmit`
Expected: 无编译错误

**Step 4: 提交**

```bash
git add uniapp-interview/src/pages/interview/
git commit -m "feat(interview): integrate answer card drawer into interview page"
```

---

## Task 5: 添加手势滑动打开抽屉

**Files:**
- Modify: `uniapp-interview/src/pages/interview/index.tsx`

**Step 1: 添加手势处理**

在 `index.tsx` 的 InterviewPage 组件中添加 touch 状态:

```ts
const touchStartX = useRef(0);
const touchStartY = useRef(0);
```

添加手势处理函数:

```ts
const handleTouchStart = (e: any) => {
  touchStartX.current = e.touches[0].clientX;
  touchStartY.current = e.touches[0].clientY;
};

const handleTouchEnd = (e: any) => {
  const deltaX = e.changedTouches[0].clientX - touchStartX.current;
  const deltaY = e.changedTouches[0].clientY - touchStartY.current;

  // 水平滑动大于50px，且垂直偏移小于水平偏移
  if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < Math.abs(deltaX)) {
    if (deltaX < 0) {
      // 从右向左滑，打开抽屉
      setDrawerVisible(true);
    }
  }
};
```

在根 View 上添加手势监听:

```tsx
<View
  className="interview-page page-shell"
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
>
```

**Step 2: 验证编译**

Run: `cd uniapp-interview && npx tsc --noEmit`
Expected: 无编译错误

**Step 3: 提交**

```bash
git add uniapp-interview/src/pages/interview/index.tsx
git commit -m "feat(interview): add swipe gesture to open answer card drawer"
```

---

## Task 6: 最终验证

**Step 1: 运行完整编译**

Run: `cd uniapp-interview && npx tsc --noEmit`
Expected: 无编译错误

**Step 2: ESLint 检查**

Run: `cd uniapp-interview && npx eslint src/pages/interview/ src/components/interview/ --ext .ts,.tsx`
Expected: 无错误

**Step 3: 提交所有变更**

```bash
git add -A && git commit -m "feat(interview): complete answer card drawer feature

- Add AnswerCardStatus and AnswerCardItem types
- Add AnswerCardItem component with expand/edit support
- Add AnswerCardDrawer with right-side slide-out gesture
- Integrate drawer into InterviewPage with swipe support
- Remove legacy messages/history section"
```

---

## 验收标准

1. ✅ 答题卡抽屉从右侧滑出，宽度为屏幕60%
2. ✅ 左侧40%区域显示阴影遮罩，点击可关闭
3. ✅ 抽屉顶部有颜色图例：🟢已答 🟡暂存 🔴未答
4. ✅ 每道题只显示题号+状态
5. ✅ 点击条目可展开查看完整问题和暂存答案
6. ✅ 🟢已答不可修改，🟡暂存可修改
7. ✅ 🟢已答可跳转查看，🔴未答显示但不可交互
8. ✅ 从右向左滑动手势可打开抽屉
9. ✅ 页面移除历史对话记录区域
10. ✅ 暂存后状态保持🟡，提交后变🟢
