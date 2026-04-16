import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, Brain, Moon, Sun, ArrowRight } from 'lucide-react';
import { useMouseParallax } from '../hooks/useMouseParallax';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useTheme } from '../hooks/useTheme';

// ---------------------------------------------------------------------------
// TypedLine - types text character by character
// ---------------------------------------------------------------------------
function TypedLine({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const timer = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), 30);
    return () => clearTimeout(timer);
  }, [displayed, started, text]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && <span className="animate-pulse">|</span>}
    </span>
  );
}

// ---------------------------------------------------------------------------
// AnimatedCounter - counts from 0 to target when visible
// ---------------------------------------------------------------------------
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
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
        const duration = 1500;
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
          setCount(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ---------------------------------------------------------------------------
// Orbital diagram node data
// ---------------------------------------------------------------------------
const orbitalNodes = [
  { label: '训练', cx: 150, cy: 30 },
  { label: '评估', cx: 260, cy: 95 },
  { label: '画像', cx: 220, cy: 230 },
  { label: '调度', cx: 80, cy: 230 },
  { label: '进化', cx: 40, cy: 95 },
];

const nodeDescriptions: Record<string, string> = {
  '训练': 'AI 模拟真实面试场景，针对你的简历和画像动态生成题目，提供沉浸式训练体验。',
  '评估': '每次回答即时评估，从准确性、深度、表达力等多维度给出详细反馈和改进建议。',
  '画像': '持续积累你的能力画像，追踪优势与薄弱环节，用 SM-2 间隔重复算法精准管理掌握度。',
  '调度': '基于画像智能调度下次训练重点，优先强化薄弱环节，让每一分钟练习都高效精准。',
  '进化': '通过持续迭代闭环，你的面试能力螺旋上升——训练越多，AI 越懂你，效果越好。',
};

// ---------------------------------------------------------------------------
// OrbitalDiagram
// ---------------------------------------------------------------------------
function OrbitalDiagram() {
  const [active, setActive] = useState<string | null>(null);
  const sectionRef = useScrollReveal<HTMLDivElement>();

  // Build arc paths between adjacent nodes
  const arcs = orbitalNodes.map((node, i) => {
    const next = orbitalNodes[(i + 1) % orbitalNodes.length];
    return {
      key: `${node.label}-${next.label}`,
      path: `M ${node.cx} ${node.cy} L ${next.cx} ${next.cy}`,
    };
  });

  return (
    <div ref={sectionRef} className="scroll-reveal flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
      {/* SVG orbital */}
      <div className="relative w-[300px] h-[300px] flex-shrink-0">
        <svg viewBox="0 0 300 260" className="w-full h-full" aria-label="闭环训练流程图">
          {/* Arcs */}
          {arcs.map((arc) => (
            <path
              key={arc.key}
              d={arc.path}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeDasharray="100"
              opacity="0.5"
              className="animate-beam"
            />
          ))}

          {/* Center glow circle */}
          <circle cx="150" cy="135" r="36" fill="var(--color-primary)" opacity="0.08" />
          <text
            x="150"
            y="140"
            textAnchor="middle"
            className="fill-[var(--color-primary)]"
            fontSize="13"
            fontWeight="700"
          >
            持续进化
          </text>

          {/* Nodes */}
          {orbitalNodes.map((node) => (
            <g
              key={node.label}
              className="cursor-pointer"
              onClick={() => setActive(active === node.label ? null : node.label)}
              role="button"
              tabIndex={0}
              aria-label={node.label}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActive(active === node.label ? null : node.label);
                }
              }}
            >
              <circle
                cx={node.cx}
                cy={node.cy}
                r="22"
                fill={active === node.label ? 'var(--color-primary)' : 'var(--color-surface)'}
                stroke="var(--color-primary)"
                strokeWidth="2"
                className="transition-all duration-300"
              />
              <text
                x={node.cx}
                y={node.cy + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fontWeight="600"
                className={active === node.label ? 'fill-white' : 'fill-[var(--color-text)] dark:fill-[var(--color-text-dark)]'}
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Description panel */}
      <div className="flex-1 min-h-[140px] max-w-md">
        {active ? (
          <div className="animate-fade-in-up">
            <h3 className="text-xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-3">
              {active}
            </h3>
            <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] leading-relaxed text-base">
              {nodeDescriptions[active]}
            </p>
          </div>
        ) : (
          <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] text-base italic">
            点击节点查看详细说明
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FeatureCard
// ---------------------------------------------------------------------------
function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <div
      className="reveal-item group relative bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl p-8 hover:border-[var(--color-primary)] dark:hover:border-[var(--color-primary)] transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5"
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] flex items-center justify-center mb-5 group-hover:bg-[var(--color-primary)] transition-colors duration-300">
        <Icon className="w-6 h-6 text-[var(--color-primary)] group-hover:text-white transition-colors duration-300" />
      </div>
      <h3 className="text-lg font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">
        {title}
      </h3>
      <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LandingPage
// ---------------------------------------------------------------------------
export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const parallax = useMouseParallax(30);
  const featureRef = useScrollReveal<HTMLDivElement>();
  const ctaRef = useScrollReveal<HTMLDivElement>();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] relative overflow-hidden">
      {/* Theme toggle - floating top-right */}
      <button
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
        className="fixed top-6 right-6 z-50 w-10 h-10 rounded-full bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-[var(--color-text)] dark:text-[var(--color-text-dark)]" />
        ) : (
          <Moon className="w-5 h-5 text-[var(--color-text)] dark:text-[var(--color-text-dark)]" />
        )}
      </button>

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
        {/* Background floating orbs with parallax */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-20 dark:opacity-10 blur-[120px] bg-amber-400"
            style={{
              top: '10%',
              left: '15%',
              transform: `translate(${parallax.x * 1.2}px, ${parallax.y * 1.2}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full opacity-15 dark:opacity-8 blur-[100px] bg-amber-300"
            style={{
              bottom: '15%',
              right: '10%',
              transform: `translate(${parallax.x * -0.8}px, ${parallax.y * -0.8}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          />
          <div
            className="absolute w-[300px] h-[300px] rounded-full opacity-10 dark:opacity-5 blur-[80px] bg-amber-500"
            style={{
              top: '50%',
              left: '60%',
              transform: `translate(${parallax.x * 0.5}px, ${parallax.y * 0.5}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          />
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
              AI 面试教练
            </span>
          </h1>

          {/* Typed subtitle */}
          <p className="text-lg sm:text-xl text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-12 h-8">
            <TypedLine text="基于 AI 的智能面试训练系统，持续进化你的面试能力" delay={600} />
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12 mb-12">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                <AnimatedCounter target={1000} suffix="+" />
              </div>
              <div className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-1">
                练习次数
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                <AnimatedCounter target={50} suffix="+" />
              </div>
              <div className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-1">
                覆盖技能
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                7×24
              </div>
              <div className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-1">
                模拟面试
              </div>
            </div>
          </div>

          {/* CTA button */}
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-white font-bold text-lg shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105 active:scale-100 transition-all duration-300"
          >
            开始使用
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-[var(--color-text-muted)] dark:bg-[var(--color-text-muted-dark)] rounded-full" />
          </div>
        </div>
      </section>

      {/* ===== ORBITAL SECTION ===== */}
      <section className="py-20 lg:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-4">
            闭环训练，持续进化
          </h2>
          <p className="text-center text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-16 max-w-xl mx-auto">
            从训练到评估、从画像到调度，五大环节形成完整闭环，驱动面试能力螺旋上升。
          </p>
          <OrbitalDiagram />
        </div>
      </section>

      {/* ===== FEATURE CARDS SECTION ===== */}
      <section className="py-20 lg:py-32 px-6">
        <div ref={featureRef} className="scroll-reveal max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-4 reveal-item">
            核心功能
          </h2>
          <p className="text-center text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-16 max-w-xl mx-auto reveal-item" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
            AI 驱动的一站式面试准备，从简历分析到模拟面试再到能力画像。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={FileText}
              title="简历分析"
              description="上传简历即刻获取 AI 深度分析，识别优势与改进方向，生成结构化评估报告。"
              delay={200}
            />
            <FeatureCard
              icon={Users}
              title="模拟面试"
              description="AI 扮演面试官，根据你的简历和画像动态出题，支持 3D 虚拟面试官实时互动。"
              delay={350}
            />
            <FeatureCard
              icon={Brain}
              title="个人画像"
              description="基于间隔重复算法追踪掌握度，精准定位薄弱环节，智能规划下次训练重点。"
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 lg:py-32 px-6">
        <div ref={ctaRef} className="scroll-reveal max-w-2xl mx-auto text-center">
          <h2 className="reveal-item text-3xl sm:text-4xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-6">
            开始你的 AI 面试训练
          </h2>
          <p className="reveal-item text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-10 text-lg" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
            上传简历，即刻开启个性化训练之旅
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="reveal-item inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-white font-bold text-lg shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105 active:scale-100 transition-all duration-300"
            style={{ '--reveal-delay': '200ms' } as React.CSSProperties}
          >
            立即开始
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
        <p className="text-center text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
          AI 面试教练 — 专业面试训练平台
        </p>
      </footer>
    </div>
  );
}
