import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, ArrowRight, ChevronDown, Target, Star, Clock } from 'lucide-react';
import { useMouseParallax } from '../../hooks/useMouseParallax';
import AnimatedCounter from './components/AnimatedCounter';
import {
  HERO_BADGE,
  HERO_TITLE_LINE1,
  HERO_TITLE_LINE2,
  HERO_SUBTITLE,
  HERO_CTA_PRIMARY,
  HERO_CTA_SECONDARY,
  HERO_STATS,
} from './data';

// ============================================================================
// Floating Mock Cards
// ============================================================================

function ScoreBar({ label, score, max = 10 }: { label: string; score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = score >= 8 ? 'var(--color-success)' : score >= 6 ? 'var(--color-primary)' : 'var(--color-error)';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] truncate">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] dark:bg-[var(--color-border-dark)] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-6 text-right font-medium" style={{ color }}>{score}</span>
    </div>
  );
}

function MockReportCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl p-4 shadow-xl w-[260px] ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-bold">82</div>
        <div>
          <div className="text-xs font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">综合评分</div>
          <div className="text-[10px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">Java 后端 · 8 题</div>
        </div>
      </div>
      <div className="space-y-2">
        <ScoreBar label="Java 基础" score={9} />
        <ScoreBar label="Spring" score={7} />
        <ScoreBar label="MySQL" score={6} />
        <ScoreBar label="项目表达" score={8} />
      </div>
    </div>
  );
}

function MockResumeCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl p-4 shadow-xl w-[240px] ${className}`}>
      <div className="text-xs font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">简历分析结果</div>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
          <span className="text-[var(--color-text)] dark:text-[var(--color-text-dark)]">项目经历: </span>
          <span className="font-medium text-[var(--color-success)]">8/10</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
          <span className="text-[var(--color-text)] dark:text-[var(--color-text-dark)]">技术深度: </span>
          <span className="font-medium text-[var(--color-primary)]">6/10</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
          <span className="text-[var(--color-text)] dark:text-[var(--color-text-dark)]">表达清晰度: </span>
          <span className="font-medium text-[var(--color-success)]">7/10</span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
        <div className="text-[10px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">AI 建议</div>
        <div className="text-[11px] text-[var(--color-primary)] mt-0.5">建议补充 Redis 缓存实践经验</div>
      </div>
    </div>
  );
}

function MockChatCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl p-4 shadow-xl w-[260px] ${className}`}>
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="w-5 h-5 rounded-full bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] flex items-center justify-center text-[var(--color-primary)] text-[9px] font-bold flex-shrink-0">AI</div>
          <div className="bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-xl rounded-tl-sm px-3 py-2 text-[11px] text-[var(--color-text)] dark:text-[var(--color-text-dark)] leading-relaxed">
            请介绍一下你在项目中的角色和具体贡献
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <div className="bg-[var(--color-primary)] text-white rounded-xl rounded-tr-sm px-3 py-2 text-[11px] leading-relaxed max-w-[180px]">
            我负责后端 API 开发，使用 Spring Boot...
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-5 h-5 rounded-full bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] flex items-center justify-center text-[var(--color-primary)] text-[9px] font-bold flex-shrink-0">AI</div>
          <div className="bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-xl rounded-tl-sm px-3 py-2 text-[11px] text-[var(--color-text)] dark:text-[var(--color-text-dark)] leading-relaxed">
            能具体说说 Redis 在这个项目中是怎么用的吗？
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Hero Section
// ============================================================================

function HeroStatIcon({ type }: { type: 'target' | 'star' | 'clock' }) {
  const props = { className: 'w-4 h-4' };
  switch (type) {
    case 'target': return <Target {...props} />;
    case 'star': return <Star {...props} />;
    case 'clock': return <Clock {...props} />;
  }
}

export default function HeroSection() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 400], [0, 100]);
  const y2 = useTransform(scrollY, [0, 400], [0, -60]);
  const parallax = useMouseParallax(15);
  const sectionRef = useRef<HTMLElement>(null);

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center px-6 py-20 overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0" aria-hidden="true">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-25 blur-[180px]"
          style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)', top: '-15%', left: '-5%', y: y1 }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[150px]"
          style={{ background: 'radial-gradient(circle, var(--color-primary-hover) 0%, transparent 70%)', bottom: '-10%', right: '-5%', y: y2 }}
        />
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-8 items-center">
        {/* Left: content */}
        <div>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] border border-[var(--color-primary-border)] dark:border-[var(--color-primary-border-dark)] text-[var(--color-primary)] text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>{HERO_BADGE}</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[1.15]"
          >
            <span className="text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{HERO_TITLE_LINE1}</span>
            <br />
            <span className="bg-gradient-to-r from-amber-500 to-orange-400 bg-clip-text text-transparent">
              {HERO_TITLE_LINE2}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-base sm:text-lg text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] max-w-xl mb-8 leading-relaxed"
          >
            {HERO_SUBTITLE}
          </motion.p>

          {/* Dual CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-wrap items-center gap-4 mb-10"
          >
            <button
              onClick={() => navigate('/upload')}
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold shadow-lg shadow-[var(--color-primary)]/20 hover:shadow-xl hover:shadow-[var(--color-primary)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span>{HERO_CTA_PRIMARY}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={scrollToHowItWorks}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] font-medium hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] transition-all duration-200"
            >
              {HERO_CTA_SECONDARY}
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex flex-wrap gap-8 sm:gap-12"
          >
            {HERO_STATS.map((stat, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] flex items-center justify-center text-[var(--color-primary)]">
                  <HeroStatIcon type={i === 0 ? 'target' : i === 1 ? 'star' : 'clock'} />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                    {'raw' in stat ? stat.raw : <AnimatedCounter target={stat.value} suffix={'suffix' in stat ? stat.suffix : ''} decimal={'decimal' in stat ? stat.decimal : false} />}
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{stat.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: floating mock cards */}
        <div className="hidden lg:block relative h-[440px]">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{ y: parallax.y * 0.5, x: parallax.x * 0.3 }}
            className="absolute top-0 right-0 animate-[float_3s_ease-in-out_infinite]"
          >
            <MockReportCard />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            style={{ y: parallax.y * 0.3, x: parallax.x * 0.5 }}
            className="absolute top-[130px] right-[30px] animate-[float_4s_ease-in-out_infinite_0.5s]"
          >
            <MockResumeCard />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            style={{ y: parallax.y * 0.7, x: parallax.x * 0.2 }}
            className="absolute top-[260px] right-[10px] animate-[float_3.5s_ease-in-out_infinite_1s]"
          >
            <MockChatCard />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-1.5 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]"
        >
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}
