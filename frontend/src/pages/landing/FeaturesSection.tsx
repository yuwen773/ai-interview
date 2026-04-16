import { motion } from 'framer-motion';
import SectionHeading from './components/SectionHeading';
import { FEATURES_LABEL, FEATURES_TITLE, FEATURES_SUBTITLE, FEATURES, type FeatureItem } from './data';

// ============================================================================
// Mock UI components for each feature card
// ============================================================================

function MockResumeUI() {
  const items = [
    { label: '项目经历', score: 8, color: 'var(--color-success)' },
    { label: '技术深度', score: 6, color: 'var(--color-primary)' },
    { label: '表达清晰度', score: 7, color: 'var(--color-success)' },
    { label: '匹配度', score: 8, color: 'var(--color-success)' },
  ];
  return (
    <div className="bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] rounded-xl p-4 space-y-3">
      <div className="text-xs font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">简历评估报告</div>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] w-16">{item.label}</span>
          <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] dark:bg-[var(--color-border-dark)] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${item.score * 10}%`, background: item.color }} />
          </div>
          <span className="text-[11px] font-medium w-5 text-right" style={{ color: item.color }}>{item.score}</span>
        </div>
      ))}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)]">亮点</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">待改进</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-info)]/10 text-[var(--color-info)]">追问方向</span>
      </div>
    </div>
  );
}

function MockInterviewUI() {
  return (
    <div className="bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] rounded-xl p-4 space-y-2.5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-full bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] flex items-center justify-center">
          <span className="text-[9px] font-bold text-[var(--color-primary)]">AI</span>
        </div>
        <div className="text-[10px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">面试官</div>
        <div className="ml-auto text-[10px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">3 / 8 题</div>
      </div>
      <div className="bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-lg rounded-tl-sm px-3 py-2">
        <p className="text-[11px] text-[var(--color-text)] dark:text-[var(--color-text-dark)] leading-relaxed">
          你提到了使用 Redis 做缓存，能具体说说缓存穿透是怎么处理的吗？
        </p>
      </div>
      <div className="flex justify-end">
        <div className="bg-[var(--color-primary)] text-white rounded-lg rounded-tr-sm px-3 py-2 max-w-[85%]">
          <p className="text-[11px] leading-relaxed">我用了布隆过滤器来防止缓存穿透...</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 pt-1">
        <div className="w-3 h-3 rounded-full bg-[var(--color-error)] animate-pulse" />
        <span className="text-[10px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">录音中...</span>
      </div>
    </div>
  );
}

function MockReportUI() {
  const categories = [
    { name: 'Java 基础', score: 9, total: 10 },
    { name: '并发编程', score: 7, total: 10 },
    { name: 'MySQL', score: 6, total: 10 },
    { name: 'Redis', score: 5, total: 10 },
    { name: 'Spring', score: 8, total: 10 },
    { name: '项目表达', score: 8, total: 10 },
  ];
  return (
    <div className="bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">评估报告</div>
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-[10px] font-bold">82</div>
        </div>
      </div>
      {/* Mini radar placeholder */}
      <div className="w-full aspect-square max-w-[120px] mx-auto mb-3 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,15 85,35 85,70 50,90 15,70 15,35" fill="none" stroke="var(--color-border)" strokeWidth="0.5" />
          <polygon points="50,15 85,35 85,70 50,90 15,70 15,35" fill="none" stroke="var(--color-border)" strokeWidth="0.3" transform="scale(0.66) translate(25.5,25.5)" />
          <polygon points="50,15 85,35 85,70 50,90 15,70 15,35" fill="none" stroke="var(--color-border)" strokeWidth="0.3" transform="scale(0.33) translate(51,51)" />
          <polygon
            points="50,18 82,37 78,68 50,85 22,65 20,37"
            fill="var(--color-primary)"
            fillOpacity="0.15"
            stroke="var(--color-primary)"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {categories.slice(0, 4).map((cat) => (
          <div key={cat.name} className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{cat.name}</span>
            <span className="font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{cat.score}/{cat.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockProfileUI() {
  const topics = [
    { name: 'Java 基础', score: 85, zone: 'solid' as const },
    { name: 'MySQL', score: 55, zone: 'building' as const },
    { name: 'Redis', score: 35, zone: 'focus' as const },
  ];
  const zoneColors = {
    solid: { bg: 'var(--color-success)', text: '已掌握' },
    building: { bg: 'var(--color-primary)', text: '提升中' },
    focus: { bg: 'var(--color-error)', text: '重点突破' },
  };
  return (
    <div className="bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] rounded-xl p-4 space-y-3">
      <div className="text-xs font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">个人画像</div>
      {topics.map((t) => {
        const z = zoneColors[t.zone];
        return (
          <div key={t.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{t.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${z.bg}15`, color: z.bg }}>{z.text}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-border)] dark:bg-[var(--color-border-dark)] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${t.score}%`, background: z.bg }} />
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-1.5 pt-1 text-[10px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        下次复习: Redis · 2 天后
      </div>
    </div>
  );
}

const MOCK_UIS = [MockResumeUI, MockInterviewUI, MockReportUI, MockProfileUI];

// ============================================================================
// FeatureCard with mock UI
// ============================================================================

function FeatureCard({ feature, index }: { feature: FeatureItem; index: number }) {
  const Icon = feature.icon;
  const MockUI = MOCK_UIS[index];
  const isReversed = index % 2 === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl overflow-hidden hover:border-[var(--color-primary)]/40 transition-all duration-300 hover:shadow-lg">
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-0 ${isReversed ? 'md:[direction:rtl]' : ''}`}>
          {/* Text side */}
          <div className={`p-6 sm:p-8 flex flex-col justify-center ${isReversed ? 'md:[direction:ltr]' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Icon className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">{feature.title}</h3>
            <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] leading-relaxed">
              {feature.description}
            </p>
            {feature.tags && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {feature.tags.map((tag) => (
                  <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] text-[var(--color-primary)] font-medium">{tag}</span>
                ))}
              </div>
            )}
          </div>
          {/* Mock UI side */}
          <div className={`p-5 sm:p-6 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] ${isReversed ? 'md:[direction:ltr]' : ''}`}>
            <MockUI />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Features Section
// ============================================================================

export default function FeaturesSection() {
  return (
    <section className="py-20 lg:py-28 px-6 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)]">
      <div className="max-w-6xl mx-auto">
        <SectionHeading label={FEATURES_LABEL} title={FEATURES_TITLE} subtitle={FEATURES_SUBTITLE} />
        <div className="grid grid-cols-1 gap-6">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
