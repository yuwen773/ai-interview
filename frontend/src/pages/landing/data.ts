import {
  FileText,
  Mic,
  BarChart3,
  Brain,
  HelpCircle,
  MessageCircleOff,
  Repeat,
  Upload,
  MessageSquare,
  ClipboardCheck,
} from 'lucide-react';
import type { ComponentType } from 'react';

// ============================================================================
// Hero
// ============================================================================
export const HERO_BADGE = '面向应届毕业生的 AI 面试训练平台';
export const HERO_TITLE_LINE1 = '面试准备不再';
export const HERO_TITLE_LINE2 = '一个人孤军奋战';
export const HERO_SUBTITLE =
  'AI 面试教练会读懂你的简历，模拟真实面试官追问，并在每次练习后帮你找到薄弱点。训练越多，AI 越懂你。';
export const HERO_CTA_PRIMARY = '上传简历，开始训练';
export const HERO_CTA_SECONDARY = '看看怎么运作';

export const HERO_STATS = [
  { value: 5000, suffix: '+', label: '练习次数' },
  { value: 4.8, suffix: '/5', label: '用户满意度', decimal: true },
  { value: 0, label: '7×24 随时练习', raw: '7×24' },
] as const;

// ============================================================================
// Pain Points
// ============================================================================
export const PAIN_LABEL = '你在经历这些吗';
export const PAIN_TITLE = '准备了三个月，面试时还是大脑一片空白';
export const PAIN_SUBTITLE = '刷了上百道题，背了无数八股文，但真正坐到面试官面前——';
export const PAIN_TRANSITION = 'AI 面试教练就是来解决这些问题的';

export const PAIN_POINTS: { icon: ComponentType<{ className?: string }>; text: string }[] = [
  { icon: HelpCircle, text: '被问到简历上的项目，说不清自己做了什么' },
  { icon: MessageCircleOff, text: '不知道自己的回答哪里不行，没人给你反馈' },
  { icon: Repeat, text: '每次面试都踩相同的坑，但不知道坑在哪' },
];

// ============================================================================
// Features
// ============================================================================
export const FEATURES_LABEL = '核心能力';
export const FEATURES_TITLE = '从简历到 offer，全链路 AI 陪练';
export const FEATURES_SUBTITLE = '不只是出题，而是一套完整的面试训练闭环';

export interface FeatureItem {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tags?: string[];
}

export const FEATURES: FeatureItem[] = [
  {
    icon: FileText,
    title: 'AI 深度解读你的简历',
    description:
      '上传简历，AI 会逐项分析你的项目经历、技术栈匹配度和表达亮点，生成结构化评估报告，帮你找到面试官最可能追问的方向。',
  },
  {
    icon: Mic,
    title: '面对 AI 面试官，真实对话训练',
    description:
      '支持实时语音交互，AI 面试官会根据你的简历动态出题，像真实面试官一样追问、引导、施压。4种难度模式，适配不同阶段。',
    tags: ['快速 6题', '标准 8题', '深度 12题', '挑战 16题'],
  },
  {
    icon: BarChart3,
    title: '每次练习都有详细反馈',
    description:
      '每个回答即时评分，从准确性、深度、表达力多维度给出详细反馈。配套雷达图帮你一眼看清优势和短板，而不是刷完题就忘。',
  },
  {
    icon: Brain,
    title: 'AI 越练越懂你',
    description:
      '基于 SM-2 间隔重复算法，持续追踪每个知识点的掌握度。薄弱环节自动标记优先复习，强项巩固保持，你只需要专注训练。',
  },
];

// ============================================================================
// How It Works
// ============================================================================
export const HOW_LABEL = '三步开始';
export const HOW_TITLE = '30 秒上传简历，即刻开启训练';
export const HOW_SUBTITLE = '从简历到能力画像，形成持续进化的训练闭环';

export const HOW_STEPS: {
  num: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}[] = [
  {
    num: '01',
    icon: Upload,
    title: '上传简历',
    description: '支持 PDF、Word 格式。AI 会自动解析你的项目经历、技术栈和经验亮点。',
  },
  {
    num: '02',
    icon: MessageSquare,
    title: '开始模拟面试',
    description:
      '选择目标岗位和面试难度。AI 面试官会根据你的简历和画像动态出题，支持语音和文字交互。',
  },
  {
    num: '03',
    icon: ClipboardCheck,
    title: '查看评估报告',
    description:
      '每轮练习生成详细报告：分维度评分、优势亮点、改进建议。薄弱点自动进入复习队列。',
  },
];

// ============================================================================
// Orbital Diagram
// ============================================================================
export const LOOP_NODES = [
  { label: '训练', cx: 150, cy: 30 },
  { label: '评估', cx: 260, cy: 95 },
  { label: '画像', cx: 220, cy: 230 },
  { label: '调度', cx: 80, cy: 230 },
  { label: '进化', cx: 40, cy: 95 },
];

export const LOOP_DESCRIPTIONS: Record<string, string> = {
  训练: 'AI 模拟真实面试场景，针对你的简历和画像动态生成题目，提供沉浸式训练体验。',
  评估: '每次回答即时评估，从准确性、深度、表达力等多维度给出详细反馈。',
  画像: '持续追踪优势与薄弱环节，用 SM-2 间隔重复算法精准管理掌握度。',
  调度: '基于画像智能调度训练重点，优先强化薄弱环节。',
  进化: '训练越多，AI 越懂你，能力螺旋上升。',
};

export const LOOP_CENTER_TEXT = '持续进化';

// ============================================================================
// Demo Preview Tabs
// ============================================================================
export const DEMO_LABEL = '产品预览';
export const DEMO_TITLE = '真实产品界面，不是概念图';

export const DEMO_TABS = ['面试训练室', '评估报告', '个人画像'] as const;
export type DemoTab = (typeof DEMO_TABS)[number];

// ============================================================================
// Testimonials
// ============================================================================
export const TESTIMONIALS_LABEL = '用户真实反馈';
export const TESTIMONIALS_TITLE = '他们用 AI 面试教练拿到了 offer';
export const TESTIMONIALS_SUBTITLE = '来自不同学校、不同岗位的真实经历';

export interface Testimonial {
  quote: string;
  author: string;
  detail: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'AI 面试官追问的方向和真实面试几乎一样。第一次练的时候被问懵了，但练了五次之后，面试时特别从容。',
    author: '林同学',
    detail: '浙江大学 · 计算机科学 · 已拿到字节跳动 offer',
  },
  {
    quote:
      '简历分析那一步太有用了，它直接告诉我哪个项目经历会被追问，让我提前准备好了回答框架。',
    author: '王同学',
    detail: '武汉大学 · 软件工程 · 已拿到腾讯 offer',
  },
  {
    quote:
      '每次练习后的评估报告帮我找到了自己完全没注意到的知识盲区。SM-2 复习提醒也让我的复习效率高了很多。',
    author: '陈同学',
    detail: '华中科技大学 · 人工智能 · 已拿到美团 offer',
  },
  {
    quote:
      '我是跨专业求职前端，基础比较薄弱。标准模式练了十几轮，面试的时候 HR 说我回答得很有条理。',
    author: '赵同学',
    detail: '北京大学 · 数学系（跨专业）· 已拿到阿里巴巴 offer',
  },
];

// ============================================================================
// FAQ
// ============================================================================
export const FAQ_LABEL = '常见问题';
export const FAQ_TITLE = '你可能想知道的';

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'AI 面试官和真人面试官有什么区别？',
    answer:
      'AI 面试官基于大语言模型，能模拟真实面试官的追问逻辑，并根据你的简历和表现动态调整问题难度和方向。它不会替代真实面试练习，但能帮你高效找到薄弱点，在真实面试前做充分准备。',
  },
  {
    question: '支持哪些岗位的面试训练？',
    answer:
      '目前支持 Java 后端开发、Web 前端开发和 Python 算法三个方向。每个方向覆盖该岗位常见的技术栈和面试题型，后续会持续扩展更多方向。',
  },
  {
    question: '我的简历数据安全吗？',
    answer:
      '你的简历仅用于生成个性化的面试题目和评估报告，不会分享给第三方。所有数据传输采用加密协议，服务器端数据严格隔离。',
  },
  {
    question: '需要付费吗？',
    answer:
      '基础功能完全免费，包括简历分析、模拟面试和评估报告。高级功能（如 3D 面试官、无限次训练等）会提供付费方案。',
  },
  {
    question: '一次面试训练大概多长时间？',
    answer:
      '根据你选择的模式不同，快速模式约 15 分钟（6 题），标准模式约 25 分钟（8 题），深度模式约 40 分钟（12 题），挑战模式约 50 分钟（16 题）。',
  },
  {
    question: '可以用手机使用吗？',
    answer: '目前网页端支持桌面和平板访问。移动端适配正在开发中，同时也提供微信小程序版本。',
  },
];

// ============================================================================
// CTA
// ============================================================================
export const CTA_LABEL = '准备好了吗';
export const CTA_TITLE = '你的 offer 之旅，从上传简历开始';
export const CTA_SUBTITLE =
  '不要等到面试前一天才开始准备。现在就上传简历，让 AI 面试教练帮你找到薄弱点，制定训练计划。';
export const CTA_BUTTON = '立即开始训练';
export const CTA_NOTE = '免费使用，无需注册';

// ============================================================================
// Footer
// ============================================================================
export const FOOTER_TAGLINE = 'AI 面试教练 — 专业面试训练平台';
export const FOOTER_PRODUCT_LINKS = ['简历分析', '模拟面试', '评估报告', '个人画像'];
export const FOOTER_RESOURCE_LINKS = ['使用指南', '常见问题', '更新日志'];
export const FOOTER_COPYRIGHT = '© 2026 AI 面试教练. All rights reserved.';
