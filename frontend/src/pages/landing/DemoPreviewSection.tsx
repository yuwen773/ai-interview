import { motion } from 'framer-motion';
import { MessageSquare, BarChart3, Brain } from 'lucide-react';
import { DEMO_LABEL, DEMO_TITLE } from './data';
import CardSwap, { Card } from '../../components/CardSwap';

const REPORT_CATEGORIES = [
  { name: 'Java 基础', score: 9 },
  { name: '并发编程', score: 7 },
  { name: 'MySQL', score: 6 },
  { name: 'Redis', score: 5 },
  { name: 'Spring', score: 8 },
  { name: '项目表达', score: 8 },
];

const PROFILE_TOPICS = [
  { name: 'Java 基础', score: 85, zoneText: '已掌握', color: 'var(--color-success)' },
  { name: 'Spring 框架', score: 75, zoneText: '已掌握', color: 'var(--color-success)' },
  { name: 'MySQL', score: 55, zoneText: '提升中', color: 'var(--color-primary)' },
  { name: '并发编程', score: 60, zoneText: '提升中', color: 'var(--color-primary)' },
  { name: 'Redis', score: 35, zoneText: '重点突破', color: 'var(--color-error)' },
];

const PROFILE_STATS = [
  { label: '练习次数', value: '12', color: 'var(--color-info)' },
  { label: '平均分', value: '62', color: 'var(--color-success)' },
  { label: '待复习', value: '3', color: 'var(--color-primary)' },
  { label: '技能覆盖', value: '5', color: '#8b5cf6' },
];

function getScoreColor(score: number) {
  if (score >= 8) return 'var(--color-success)';
  if (score >= 6) return 'var(--color-primary)';
  return 'var(--color-error)';
}

/** 浏览器窗口模拟外壳 */
function BrowserChrome({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] flex-shrink-0">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-error)]/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)]/60" />
      </div>
      <div className="flex-1 mx-2 h-5 rounded-md bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] flex items-center px-2.5">
        <span className="text-[9px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] truncate">{url}</span>
      </div>
    </div>
  );
}

function InterviewContent() {
  return (
    <>
      <BrowserChrome url="ai-interview.app/interview" />
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2.5 px-3 py-2 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
          <div className="w-7 h-7 rounded-full bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] flex items-center justify-center">
            <span className="text-[9px] font-bold text-[var(--color-primary)]">AI</span>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">AI 面试官 · Ethan</div>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-[var(--color-success)] animate-pulse" />
              <span className="text-[8px] text-[var(--color-success)]">正在提问...</span>
            </div>
          </div>
          <div className="ml-auto text-[9px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">3 / 8 题</div>
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          <div className="flex gap-1.5">
            <div className="flex-1 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-lg rounded-tl-sm px-3 py-2">
              <span className="text-[8px] inline-block px-1 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] mb-1">MySQL</span>
              <p className="text-[10px] text-[var(--color-text)] dark:text-[var(--color-text-dark)] leading-relaxed">索引失效常见的情况有哪些？举例说明。</p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[80%] bg-[var(--color-primary)] text-white rounded-lg rounded-tr-sm px-3 py-2">
              <p className="text-[10px] leading-relaxed">使用函数操作索引列、隐式类型转换、like 通配符开头、联合索引不满足最左前缀...</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <div className="flex-1 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-lg rounded-tl-sm px-3 py-2">
              <span className="text-[8px] inline-block px-1 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] mb-1">Redis</span>
              <p className="text-[10px] text-[var(--color-text)] dark:text-[var(--color-text-dark)] leading-relaxed">缓存击穿、穿透、雪崩分别是什么？怎么预防？</p>
            </div>
          </div>
        </div>
        <div className="px-3 py-2 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-7 rounded-md bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] px-2 flex items-center">
              <span className="text-[9px] text-[var(--color-text-placeholder)] dark:text-[var(--color-text-placeholder-dark)]">输入你的回答...</span>
            </div>
            <div className="w-7 h-7 rounded-md bg-[var(--color-error)]/10 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[var(--color-error)]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ReportContent() {
  return (
    <>
      <BrowserChrome url="ai-interview.app/report" />
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-base font-bold flex-shrink-0">82</div>
          <div>
            <div className="text-xs font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">综合评分</div>
            <div className="text-[9px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">Java 后端 · 8 道题 · 标准模式</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {REPORT_CATEGORIES.map((cat) => (
            <div key={cat.name} className="flex items-center justify-between px-2 py-1.5 rounded-md bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)]">
              <span className="text-[9px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{cat.name}</span>
              <span className="text-[10px] font-bold" style={{ color: getScoreColor(cat.score) }}>{cat.score}/10</span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="px-2.5 py-1.5 rounded-md bg-[var(--color-success)]/5 flex gap-2">
            <div className="w-1 rounded-full bg-[var(--color-success)] flex-shrink-0" />
            <div>
              <div className="text-[9px] font-semibold text-[var(--color-success)]">优势</div>
              <div className="text-[9px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">Java 基础扎实，项目表达清晰</div>
            </div>
          </div>
          <div className="px-2.5 py-1.5 rounded-md bg-[var(--color-primary)]/5 flex gap-2">
            <div className="w-1 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
            <div>
              <div className="text-[9px] font-semibold text-[var(--color-primary)]">改进方向</div>
              <div className="text-[9px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">Redis 需加强，补充缓存实战</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ProfileContent() {
  return (
    <>
      <BrowserChrome url="ai-interview.app/profile" />
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        <div className="grid grid-cols-4 gap-1.5">
          {PROFILE_STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-base font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[8px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {PROFILE_TOPICS.map((t) => (
            <div key={t.name} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{t.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[7px] px-1 py-0.5 rounded-full font-medium" style={{ background: `${t.color}15`, color: t.color }}>{t.zoneText}</span>
                  <span className="text-[9px] font-medium" style={{ color: t.color }}>{t.score}</span>
                </div>
              </div>
              <div className="h-1 rounded-full bg-[var(--color-border)] dark:bg-[var(--color-border-dark)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ background: t.color, width: `${t.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const DEMO_FEATURES = [
  {
    icon: MessageSquare,
    title: '面试训练室',
    desc: 'AI 面试官实时追问，语音+文字双模态交互，还原真实面试场景',
  },
  {
    icon: BarChart3,
    title: '评估报告',
    desc: '多维度评分、优劣势精准诊断，每次面试都有明确提升方向',
  },
  {
    icon: Brain,
    title: '个人画像',
    desc: 'SM-2 间隔重复算法追踪知识薄弱点，智能规划复习路径',
  },
];

export default function DemoPreviewSection() {
  return (
    <section className="py-20 lg:py-28 px-6 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 lg:items-start">
        {/* 左侧：文字介绍 */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-xs font-medium uppercase tracking-widest text-[var(--color-primary)] mb-3">
            {DEMO_LABEL}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-4 leading-tight">
            {DEMO_TITLE}
          </h2>
          <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] text-sm sm:text-base leading-relaxed mb-8">
            从简历解析到面试模拟，从评估报告到知识追踪——每一个界面都是可交互的完整产品，不是贴图。
          </p>
          <div className="space-y-5">
            {DEMO_FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] flex items-center justify-center flex-shrink-0">
                  <feat.icon className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-1">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 右侧：CardSwap 产品预览 */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex justify-center lg:justify-end lg:mt-20"
          style={{ minHeight: '480px' }}
        >
          <CardSwap
            width={540}
            height={400}
            cardDistance={50}
            verticalDistance={60}
            delay={4000}
            pauseOnHover={true}
            skewAmount={4}
            easing="elastic"
          >
            <Card className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] flex flex-col">
              <InterviewContent />
            </Card>
            <Card className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] flex flex-col">
              <ReportContent />
            </Card>
            <Card className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] flex flex-col">
              <ProfileContent />
            </Card>
          </CardSwap>
        </motion.div>
      </div>
    </section>
  );
}
