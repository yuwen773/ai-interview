import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FileText, Users, Brain, Sparkles, ArrowRight, ChevronDown, Quote } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

// ============================================================================
// AudioVisualizer - 音频可视化装饰
// ============================================================================
function AudioVisualizer({ className = '' }: { className?: string }) {
  const bars = Array.from({ length: 20 });
  const [heights, setHeights] = useState(bars.map(() => Math.random() * 0.3 + 0.1));

  useEffect(() => {
    const interval = setInterval(() => {
      setHeights(bars.map(() => Math.random() * 0.6 + 0.2));
    }, 180);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-end gap-[2px] h-10 ${className}`}>
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-gradient-to-t from-amber-600 to-yellow-400 rounded-full"
          animate={{ height: `${heights[i] * 100}%` }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// TypedText - 打字机效果
// ============================================================================
function TypedText({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const timer = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), 35);
    return () => clearTimeout(timer);
  }, [displayed, started, text]);

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && (
        <span className="animate-pulse inline-block w-0.5 h-[0.9em] bg-amber-500 ml-0.5 align-middle" />
      )}
    </span>
  );
}

// ============================================================================
// Counter - 数字动画
// ============================================================================
function Counter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const start = performance.now();
        const duration = 1800;
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

// ============================================================================
// OrbitalDiagram - 交互式训练流程图
// ============================================================================
const orbitalNodes = [
  { label: '训练', cx: 150, cy: 30 },
  { label: '评估', cx: 260, cy: 95 },
  { label: '画像', cx: 220, cy: 230 },
  { label: '调度', cx: 80, cy: 230 },
  { label: '进化', cx: 40, cy: 95 },
];

const nodeDescriptions: Record<string, string> = {
  '训练': 'AI 模拟真实面试场景，针对你的简历和画像动态生成题目，提供沉浸式训练体验。',
  '评估': '每次回答即时评估，从准确性、深度、表达力等多维度给出详细反馈。',
  '画像': '持续追踪优势与薄弱环节，用 SM-2 间隔重复算法精准管理掌握度。',
  '调度': '基于画像智能调度训练重点，优先强化薄弱环节。',
  '进化': '训练越多，AI 越懂你，能力螺旋上升。',
};

function OrbitalDiagram() {
  const [active, setActive] = useState<string | null>(null);

  const arcs = orbitalNodes.map((node, i) => {
    const next = orbitalNodes[(i + 1) % orbitalNodes.length];
    return { key: `${node.label}-${next.label}`, path: `M ${node.cx} ${node.cy} L ${next.cx} ${next.cy}` };
  });

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
      <div className="relative w-[300px] h-[300px] flex-shrink-0">
        <svg viewBox="0 0 300 260" className="w-full h-full" aria-label="闭环训练流程图">
          {arcs.map((arc) => (
            <path key={arc.key} d={arc.path} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="4 4" opacity="0.25" />
          ))}
          <circle cx="150" cy="135" r="38" fill="var(--color-primary)" opacity="0.06" />
          <text x="150" y="140" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--color-primary)">持续进化</text>
          {orbitalNodes.map((node) => (
            <g key={node.label} className="cursor-pointer" onClick={() => setActive(active === node.label ? null : node.label)} role="button" tabIndex={0} aria-label={node.label}>
              <circle cx={node.cx} cy={node.cy} r="22" fill={active === node.label ? 'var(--color-primary)' : 'var(--color-surface)'} stroke="var(--color-primary)" strokeWidth="2" className="transition-all duration-500" />
              <text x={node.cx} y={node.cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="600" className={active === node.label ? 'fill-white' : 'fill-[var(--color-text)] dark:fill-[var(--color-text-dark)]'}>{node.label}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="flex-1 min-h-[100px] max-w-md">
        {active ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <h3 className="text-xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">{active}</h3>
            <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] leading-relaxed text-sm">{nodeDescriptions[active]}</p>
          </motion.div>
        ) : (
          <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] italic text-sm">点击节点查看说明</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FeatureCard
// ============================================================================
function FeatureCard({ icon: Icon, title, description, delay }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: delay / 1000, ease: 'easeOut' }}
      className="group"
    >
      <div className="relative bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-3xl p-8 hover:border-[var(--color-primary)] dark:hover:border-[var(--color-primary)] transition-all duration-300">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[var(--color-primary)]/0 via-[var(--color-primary)]/0 to-[var(--color-primary)]/3 dark:to-[var(--color-primary)]/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">{title}</h3>
          <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// TestimonialCard
// ============================================================================
function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-3xl p-8 relative">
      <Quote className="w-6 h-6 text-[var(--color-primary)] opacity-40 absolute top-6 left-6" />
      <p className="text-[var(--color-text)] dark:text-[var(--color-text-dark)] italic relative z-10 mb-6 leading-relaxed text-sm">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] flex items-center justify-center">
          <span className="text-[var(--color-primary)] font-semibold text-sm">{author[0]}</span>
        </div>
        <div>
          <div className="font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)] text-sm">{author}</div>
          <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{role}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LandingPage
// ============================================================================
export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 400], [0, 100]);
  const y2 = useTransform(scrollY, [0, 400], [0, -60]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] relative overflow-x-hidden">
      {/* 主题切换按钮 */}
      <button
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
        className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] flex items-center justify-center shadow-sm hover:shadow-md transition-all hover:scale-105"
      >
        {theme === 'dark' ? (
          <svg className="w-5 h-5 text-[var(--color-text)] dark:text-[var(--color-text-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-[var(--color-text)] dark:text-[var(--color-text-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
        {/* 氛围背景 */}
        <div className="absolute inset-0" aria-hidden="true">
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-[180px]"
            style={{
              background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)',
              top: '-15%',
              left: '-5%',
              y: y1,
            }}
          />
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[150px]"
            style={{
              background: 'radial-gradient(circle, var(--color-primary-hover) 0%, transparent 70%)',
              bottom: '-10%',
              right: '-5%',
              y: y2,
            }}
          />
          {/* 微弱网格纹理 */}
          <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          {/* 标签徽章 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] border border-[var(--color-primary-border)] dark:border-[var(--color-primary-border-dark)] text-[var(--color-primary)] dark:text-[var(--color-primary)] text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI 智能面试训练</span>
          </motion.div>

          {/* 主标题 */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="text-[var(--color-text)] dark:text-[var(--color-text-dark)]">AI 面试教练</span>
          </motion.h1>

          {/* 打字机副标题 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-8 h-7"
          >
            <TypedText text="基于 AI 的智能面试系统，持续进化你的面试能力" delay={500} />
          </motion.div>

          {/* 音频可视化装饰 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex justify-center mb-8"
          >
            <AudioVisualizer />
          </motion.div>

          {/* 统计数据 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex flex-wrap justify-center gap-8 sm:gap-12 mb-10"
          >
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]"><Counter target={1000} suffix="+" /></div>
              <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-1">练习次数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]"><Counter target={50} suffix="+" /></div>
              <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-1">覆盖技能</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">7×24</div>
              <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-1">模拟面试</div>
            </div>
          </motion.div>

          {/* CTA 按钮 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.9 }}>
            <button
              onClick={() => navigate('/upload')}
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-lg shadow-lg shadow-[var(--color-primary)]/20 hover:shadow-xl hover:shadow-[var(--color-primary)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span>开始训练</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        </div>

        {/* 滚动提示 */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="flex flex-col items-center gap-1.5 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
            <span className="text-[10px] uppercase tracking-widest">Scroll</span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* Orbital Section */}
      <section className="py-24 lg:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-3">闭环训练，持续进化</h2>
            <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] max-w-md mx-auto text-sm">五大环节形成完整闭环，驱动面试能力螺旋上升</p>
          </motion.div>
          <OrbitalDiagram />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 lg:py-32 px-6 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-3">核心功能</h2>
            <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] max-w-md mx-auto text-sm">AI 驱动的一站式面试准备</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard icon={FileText} title="简历分析" description="上传简历即刻获取 AI 深度分析，识别优势与改进方向，生成结构化评估报告。" delay={0} />
            <FeatureCard icon={Users} title="模拟面试" description="AI 扮演面试官，根据你的简历和画像动态出题，支持实时语音交互。" delay={100} />
            <FeatureCard icon={Brain} title="个人画像" description="基于间隔重复算法追踪掌握度，精准定位薄弱环节，智能规划训练重点。" delay={200} />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 lg:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-3">用户评价</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TestimonialCard quote="AI 面试官非常专业，会根据我的简历针对性地提问，帮助我发现了自己的知识盲区。" author="张同学" role="24届毕业生" />
            <TestimonialCard quote="通过持续练习，我的面试通过率从30%提升到了85%，强烈推荐！" author="李同学" role="社招求职者" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 px-6 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-4">开启 AI 面试训练</h2>
          <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-8 text-sm">上传简历，即刻开始个性化训练</p>
          <button onClick={() => navigate('/upload')} className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-lg shadow-lg shadow-[var(--color-primary)]/20 hover:shadow-xl hover:shadow-[var(--color-primary)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
            <span>立即开始</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">AI 面试教练 — 专业面试训练平台</p>
        </div>
      </footer>
    </div>
  );
}