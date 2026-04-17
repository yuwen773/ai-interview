import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ChevronDown, Target, Star, Clock } from 'lucide-react';
import { useMouseParallax } from '../../hooks/useMouseParallax';
import { useTheme } from '../../hooks/useTheme';
import AnimatedCounter from './components/AnimatedCounter';
import GridScan from '../../components/GridScan/GridScan';
import {
  HERO_BADGE,
  HERO_TITLE_LINE1,
  HERO_TITLE_LINE2,
  HERO_SUBTITLE,
  HERO_CTA_PRIMARY,
  HERO_CTA_SECONDARY,
  HERO_STATS,
} from './data';

const STAT_ICONS = [Target, Star, Clock] as const;

function getScoreColor(score: number, max: number) {
  const ratio = score / max;
  if (ratio >= 0.8) return 'var(--color-success)';
  if (ratio >= 0.6) return 'var(--color-primary)';
  return 'var(--color-error)';
}

function ScoreBar({ label, score, max = 10 }: { label: string; score: number; max?: number }) {
  const color = getScoreColor(score, max);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] truncate">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] dark:bg-[var(--color-border-dark)] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(score / max) * 100}%`, background: color }} />
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
        {[
          { label: '项目经历', score: 8, color: 'var(--color-success)' },
          { label: '技术深度', score: 6, color: 'var(--color-primary)' },
          { label: '表达清晰度', score: 7, color: 'var(--color-success)' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
            <span className="text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{item.label}: </span>
            <span className="font-medium" style={{ color: item.color }}>{item.score}/10</span>
          </div>
        ))}
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

export default function HeroSection() {
  const navigate = useNavigate();
  const parallax = useMouseParallax(15);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center px-6 py-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <GridScan
          sensitivity={0}
          lineThickness={1}
          linesColor={isDark ? '#78350f' : '#d4a54a'}
          gridScale={0.08}
          scanColor={isDark ? '#f59e0b' : '#d97706'}
          scanOpacity={isDark ? 0.3 : 0.18}
          scanDirection="pingpong"
          scanDuration={3}
          scanDelay={1.5}
          scanGlow={0.6}
          scanSoftness={2}
          lineJitter={0.05}
          enablePost={false}
          noiseIntensity={0.008}
          className={isDark ? 'opacity-35' : 'opacity-18'}
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-8 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] border border-[var(--color-primary-border)] dark:border-[var(--color-primary-border-dark)] text-[var(--color-primary)] text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            {HERO_BADGE}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[1.15]"
          >
            <span className="text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{HERO_TITLE_LINE1}</span>
            <br />
            <span className="text-[var(--color-primary)]">
              {HERO_TITLE_LINE2}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-base sm:text-lg text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] max-w-xl mb-8 leading-relaxed"
          >
            {HERO_SUBTITLE}
          </motion.p>

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
              {HERO_CTA_PRIMARY}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={scrollToHowItWorks}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] font-medium hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] transition-all duration-200"
            >
              {HERO_CTA_SECONDARY}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex flex-wrap gap-8 sm:gap-12"
          >
            {HERO_STATS.map((stat, i) => {
              const Icon = STAT_ICONS[i];
              return (
                <div key={stat.label} className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] flex items-center justify-center text-[var(--color-primary)]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                      {'raw' in stat ? stat.raw : <AnimatedCounter target={stat.value} suffix={'suffix' in stat ? stat.suffix : ''} decimal={'decimal' in stat ? stat.decimal : false} />}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        <div className="hidden lg:flex flex-col gap-4 items-end opacity-60">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{ y: parallax.y * 0.3, x: parallax.x * 0.2 }}
          >
            <MockReportCard />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            style={{ y: parallax.y * 0.2, x: parallax.x * 0.3 }}
          >
            <MockResumeCard />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            style={{ y: parallax.y * 0.15, x: parallax.x * 0.1 }}
          >
            <MockChatCard />
          </motion.div>
        </div>
      </div>

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
