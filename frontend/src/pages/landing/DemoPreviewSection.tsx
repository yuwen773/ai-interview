import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionHeading from './components/SectionHeading';
import { DEMO_LABEL, DEMO_TITLE, DEMO_TABS, type DemoTab } from './data';

// ============================================================================
// Tab Content Components
// ============================================================================

function InterviewTabContent() {
  return (
    <div className="bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] rounded-xl overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
        <div className="w-8 h-8 rounded-full bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] flex items-center justify-center">
          <span className="text-[10px] font-bold text-[var(--color-primary)]">AI</span>
        </div>
        <div>
          <div className="text-xs font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">AI 面试官 · Ethan</div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
            <span className="text-[10px] text-[var(--color-success)]">正在提问...</span>
          </div>
        </div>
        <div className="ml-auto text-[11px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">3 / 8 题</div>
      </div>
      {/* Chat */}
      <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
        <div className="flex gap-2">
          <div className="flex-1 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-xl rounded-tl-sm px-3.5 py-2.5">
            <span className="text-[10px] inline-block px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] mb-1.5">MySQL</span>
            <p className="text-xs text-[var(--color-text)] dark:text-[var(--color-text-dark)] leading-relaxed">
              你刚才提到了索引优化，能说说在什么情况下索引会失效吗？举例说明。
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-[var(--color-primary)] text-white rounded-xl rounded-tr-sm px-3.5 py-2.5">
            <p className="text-xs leading-relaxed">
              索引失效常见的情况包括：使用函数操作索引列、隐式类型转换、like 以通配符开头、联合索引不满足最左前缀原则...
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-xl rounded-tl-sm px-3.5 py-2.5">
            <span className="text-[10px] inline-block px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] mb-1.5">Redis</span>
            <p className="text-xs text-[var(--color-text)] dark:text-[var(--color-text-dark)] leading-relaxed">
              回答得不错。那我们聊聊 Redis，缓存击穿、穿透、雪崩分别是什么？你是怎么预防的？
            </p>
          </div>
        </div>
      </div>
      {/* Input area */}
      <div className="px-4 py-3 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-9 rounded-lg bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] px-3 flex items-center">
            <span className="text-xs text-[var(--color-text-placeholder)] dark:text-[var(--color-text-placeholder-dark)]">输入你的回答...</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[var(--color-error)]/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-[var(--color-error)]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportTabContent() {
  const categories = [
    { name: 'Java 基础', score: 9 },
    { name: '并发编程', score: 7 },
    { name: 'MySQL', score: 6 },
    { name: 'Redis', score: 5 },
    { name: 'Spring', score: 8 },
    { name: '项目表达', score: 8 },
  ];
  return (
    <div className="bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] rounded-xl p-5 space-y-4">
      {/* Score header */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-lg font-bold">82</div>
        <div>
          <div className="text-sm font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">综合评分</div>
          <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">Java 后端 · 8 道题 · 标准模式</div>
        </div>
      </div>
      {/* Score grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {categories.map((cat) => (
          <div key={cat.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)]">
            <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{cat.name}</span>
            <span className="text-sm font-bold" style={{ color: cat.score >= 8 ? 'var(--color-success)' : cat.score >= 6 ? 'var(--color-primary)' : 'var(--color-error)' }}>{cat.score}/10</span>
          </div>
        ))}
      </div>
      {/* Feedback */}
      <div className="space-y-2">
        <div className="px-3 py-2 rounded-lg border-l-2 border-[var(--color-success)] bg-[var(--color-success)]/5">
          <div className="text-[11px] font-semibold text-[var(--color-success)] mb-0.5">优势</div>
          <div className="text-[11px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">Java 基础扎实，项目表达清晰有条理</div>
        </div>
        <div className="px-3 py-2 rounded-lg border-l-2 border-[var(--color-primary)] bg-[var(--color-primary)]/5">
          <div className="text-[11px] font-semibold text-[var(--color-primary)] mb-0.5">改进方向</div>
          <div className="text-[11px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">Redis 相关知识点需要加强，建议补充缓存实战经验</div>
        </div>
      </div>
    </div>
  );
}

function ProfileTabContent() {
  const topics = [
    { name: 'Java 基础', score: 85, zone: 'solid', zoneText: '已掌握', color: 'var(--color-success)' },
    { name: 'Spring 框架', score: 75, zone: 'solid', zoneText: '已掌握', color: 'var(--color-success)' },
    { name: 'MySQL', score: 55, zone: 'building', zoneText: '提升中', color: 'var(--color-primary)' },
    { name: '并发编程', score: 60, zone: 'building', zoneText: '提升中', color: 'var(--color-primary)' },
    { name: 'Redis', score: 35, zone: 'focus', zoneText: '重点突破', color: 'var(--color-error)' },
  ];
  return (
    <div className="bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] rounded-xl p-5 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: '练习次数', value: '12', color: 'var(--color-info)' },
          { label: '平均分', value: '62', color: 'var(--color-success)' },
          { label: '待复习', value: '3', color: 'var(--color-primary)' },
          { label: '技能覆盖', value: '5', color: '#8b5cf6' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{s.label}</div>
          </div>
        ))}
      </div>
      {/* Topics */}
      <div className="space-y-2.5">
        {topics.map((t) => (
          <div key={t.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{t.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${t.color}15`, color: t.color }}>{t.zoneText}</span>
                <span className="text-xs font-medium" style={{ color: t.color }}>{t.score}</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-border)] dark:bg-[var(--color-border-dark)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: t.color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${t.score}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TAB_CONTENTS: Record<DemoTab, () => JSX.Element> = {
  '面试训练室': InterviewTabContent,
  '评估报告': ReportTabContent,
  '个人画像': ProfileTabContent,
};

// ============================================================================
// Demo Preview Section
// ============================================================================

export default function DemoPreviewSection() {
  const [activeTab, setActiveTab] = useState<DemoTab>(DEMO_TABS[0]);

  return (
    <section className="py-20 lg:py-28 px-6 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)]">
      <div className="max-w-4xl mx-auto">
        <SectionHeading label={DEMO_LABEL} title={DEMO_TITLE} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-error)]/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]/60" />
            </div>
            <div className="flex-1 mx-3 h-6 rounded-md bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] flex items-center px-3">
              <span className="text-[10px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">ai-interview.app/interview</span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
            {DEMO_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-text-dark)]'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="demo-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {TAB_CONTENTS[activeTab]()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
