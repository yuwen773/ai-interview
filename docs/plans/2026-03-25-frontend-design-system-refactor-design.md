# 前端页面重构设计方案

> **日期**: 2026-03-25
> **状态**: 已确认
> **目标**: 按照 `frontend/design-system` 设计系统文档重构前端所有页面

---

## 1. 项目概述

### 背景

`frontend/design-system/MASTER.md` 包含完整的设计系统规范，涵盖颜色系统、字体系统、间距系统、动效规范和组件规范。需要将现有前端代码按照此设计系统进行重构。

### 范围

重构范围：
- `frontend/src-v2/` 下的所有页面
- 纯 UI 重构，不改变业务逻辑和 API 调用方式
- 保留现有 3D Avatar 实现（Three.js/React Three Fiber）

### 设计方向

**"Motion Realm + Shader Essence"**
- 大胆动效，stagger 入场
- 局部质感（shader 用于背景和 logo）
- 克制的科技感（深色模式 Cyan/Magenta 光效）
- 专业但吸引人（面向求职者）

---

## 2. 技术决策

| 项目 | 决策 |
|------|------|
| 样式方案 | Tailwind CSS + CSS Variables |
| 动效方案 | Framer Motion（已安装） |
| 图标方案 | Lucide React（已安装） |
| 3D Avatar | 保留现有实现（复用 `src/components/InterviewAvatar/`） |
| 状态管理 | 不变（纯 UI 重构） |
| API 调用 | 不变 |
| 双主题 | Light Mode + Dark Mode 同步实现 |

---

## 3. CSS 变量系统

### 颜色系统

**Light Theme**
```css
--color-primary: #2596D1;
--color-primary-light: #7DCBF7;
--color-primary-dark: #1d7ab0;
--color-accent-purple: #7C3AED;
--color-accent-green: #10B981;
--color-accent-yellow: #F59E0B;
--bg-primary: #F5F5F5;
--bg-card: #FFFFFF;
--text-primary: #18181B;
--text-secondary: #71717A;
--border-subtle: #E4E4E7;
```

**Dark Theme**
```css
--bg-primary: #0C0C0E;
--bg-card: #18181B;
--text-primary: #FAFAFA;
--text-secondary: #B8B8C0;
--color-cyan: #00F5D4;
--color-magenta: #F0ABFC;
--border-subtle: #27272A;
--glow-cyan: 0 0 20px rgba(0, 245, 212, 0.15);
--glow-magenta: 0 0 20px rgba(240, 171, 252, 0.15);
```

### 字体系统

```css
--font-display: 'Satoshi', 'DM Sans', system-ui, sans-serif;
--font-body: 'Plus Jakarta Sans', 'Noto Sans SC', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### 间距系统（4px 网格）

```css
--space-1: 4px;
--space-2: 8px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-16: 64px;
```

### 圆角系统

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-2xl: 32px;
--radius-full: 9999px;
```

### Z-Index 层级

```css
--z-base: 0;
--z-dropdown: 60;
--z-sticky: 70;
--z-navbar: 80;
--z-overlay: 90;
--z-modal: 100;
--z-toast: 110;
--z-tooltip: 120;
--z-scroll-progress: 200;
```

---

## 4. 组件规范

### 4.1 Button

**Primary Button**
- Light: `linear-gradient(from-[#7DCBF7] to-[#2596D1])`, `border-radius: var(--radius-full)`
- Dark: `linear-gradient(from-[#00F5D4] to-[#00C4B4])`
- Hover: `translateY(-2px)`, `box-shadow` 增强
- Active: `translateY(0) scale(0.98)`
- Disabled: `opacity: 0.5`

**Secondary/Ghost Button**
- Light: `background: white`, `border: 2px solid var(--color-primary)`
- Dark: `background: transparent`, `border-color: var(--color-cyan)`

**Icon Button**
- 尺寸: 36px(sm) / 44px(md) / 52px(lg)
- `border-radius: var(--radius-md)`

### 4.2 Card

**Light Mode**
```css
background: var(--bg-card);
border: 1px solid var(--border-subtle);
border-radius: var(--radius-2xl);
box-shadow: var(--shadow-card);
```

**Dark Mode**
```css
background: var(--bg-card);
border: 1px solid var(--border-subtle);
border-radius: var(--radius-2xl);
box-shadow: none;
```

**Hover (统一)**
- Light: `translateY(-4px)`, `box-shadow: var(--shadow-hover)`
- Dark: `translateY(-4px)`, `border-color: var(--color-cyan)`, `box-shadow: var(--glow-cyan)`

### 4.3 Input

```css
background: var(--bg-card);
border: 1px solid var(--border-subtle);
border-radius: var(--radius-md);
padding: 12px 16px;
```

**Focus**
```css
border-color: var(--color-primary);
box-shadow: 0 0 0 3px rgba(37, 150, 209, 0.15);
```

### 4.4 Modal

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}
.modal {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-hover);
}
```

### 4.5 Toast

```css
background: var(--bg-card);
border: 1px solid var(--border-subtle);
border-radius: var(--radius-lg);
box-shadow: var(--shadow-hover);
```

### 4.6 Avatar

```css
border-radius: 50%;
/* Dark Mode: Cyan Glow */
box-shadow: 0 0 30px rgba(0, 245, 212, 0.2), 0 0 60px rgba(0, 245, 212, 0.1);
```

### 4.7 Progress

```css
background: var(--bg-secondary);
border-radius: var(--radius-full);
/* Primary Variant */
background: linear-gradient(to right, #7DCBF7, #2596D1);
```

---

## 5. 页面规范

### 5.1 Landing Page (首页)

**无导航栏，全屏叙事结构**

- Scroll Progress Bar（固定顶部）
- Hero Section（3D Avatar + 标题 + CTA）
- Challenges Section（痛点共鸣）
- Features Section（Bento Grid 布局）
- Trust Signals Section
- CTA Section（底部）

### 5.2 Upload Page (上传页)

**上传区域为视觉焦点**

- 页面居中卡片布局
- 拖拽上传区域（虚线边框）
- 文件选中状态
- 上传进度状态
- 错误状态

### 5.3 History Page (简历库)

**表格展示**

- Page Header + Search Input
- Table Card（圆角卡片包裹）
- 评分 Progress Bar
- 状态 Badge
- 空状态 SVG 插画

### 5.4 Interview Page (面试页) - 核心页面

**Avatar "数字窗口" 为视觉焦点**

- 左侧：Avatar 区域（脉冲光晕）+ 控制面板
- 右侧：对话历史面板
- 配置阶段：Package Selection Cards
- 对话阶段：Message Bubbles

### 5.5 Knowledge Base Pages

**管理页**: 统计卡片 + 表格列表
**上传页**: 同 Upload Page
**问答页**: 聊天界面（Message Bubbles）

---

## 6. 动效规范

### 时机

| 动画类型 | 时长 | Easing |
|----------|------|--------|
| Micro (hover) | 150ms | ease-out |
| Standard (appear) | 300-400ms | ease-out |
| Page transition | 400-600ms | ease-in-out |
| Stagger delay | 50-80ms | - |

### 类型

1. **Page Load**: 元素依次淡入上浮 (stagger: 60-80ms)
2. **Hover**: 上浮 + 阴影增强
3. **Avatar Pulse**: 呼吸效果 (scale: 1 → 1.03 → 1, 5s 周期)
4. **Button**: hover 上浮 + 阴影，点击微缩

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 150ms !important;
  }
}
```

---

## 7. 项目结构

```
frontend/src-v2/
├── index.css              # CSS Variables + Tailwind
├── components/
│   ├── ui/               # 通用 UI 组件
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Tabs.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Progress.tsx
│   │   ├── Skeleton.tsx
│   │   └── ScrollProgress.tsx
│   └── layout/           # 布局组件
│       ├── Layout.tsx    # 顶部导航栏布局
│       └── PageHeader.tsx
├── pages/
│   ├── LandingPage.tsx
│   ├── UploadPage.tsx
│   ├── HistoryPage.tsx
│   ├── InterviewPage.tsx
│   └── knowledge-base/
│       ├── ManagePage.tsx
│       ├── UploadPage.tsx
│       └── QueryPage.tsx
└── App.tsx               # 路由配置
```

---

## 8. 实现步骤

### Phase 1: 设计系统基础
1. CSS Variables（颜色、字体、间距、圆角、z-index）
2. 暗色模式适配（`.dark` class）
3. Tailwind 配置更新

### Phase 2: 基础 UI 组件
1. Button（Primary/Secondary/Icon, Light/Dark）
2. Card（统一 Hover 效果）
3. Input（Text/Textarea/Search）
4. Modal/Dialog
5. Toast
6. Dropdown
7. Tabs
8. Badge/Tag
9. Avatar
10. Progress
11. Skeleton
12. ScrollProgress

### Phase 3: 布局组件
1. Layout（顶部导航栏 + 内容区）
2. PageHeader

### Phase 4: 页面实现
1. LandingPage（首页）
2. UploadPage（上传）
3. HistoryPage（简历库）
4. InterviewPage（面试 - 核心）
5. KnowledgeBase - ManagePage
6. KnowledgeBase - UploadPage
7. KnowledgeBase - QueryPage

---

## 9. Anti-Patterns (禁止)

- ❌ Emoji 作为图标
- ❌ 花哨的弹跳/脉冲动画（除了 Avatar）
- ❌ 过度使用强调色
- ❌ 文字小于 14px
- ❌ 深色模式过度赛博
- ❌ 移动端复杂动画

---

## 10. 验收标准

1. 所有组件支持 Light/Dark 双主题
2. 动效使用 Framer Motion，符合时序规范
3. 移动端有响应式适配，动画适当简化
4. 保留现有 3D Avatar 功能
5. 不改变任何业务逻辑和 API 调用
6. 通过 WCAG AA 对比度标准
