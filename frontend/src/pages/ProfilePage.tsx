import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Brain, Target, CheckCircle, Clock, Lightbulb, Layers3 } from 'lucide-react';
import {
  profileApi,
  type UserProfileDto,
  type WeakPointDto,
  type StrongPointDto,
  type BehaviorSignalDto,
  type ProfilePatternDto,
  type ProfileRecommendationDto,
} from '../api/profile';
import ScoreTrendChart from '../components/ScoreTrendChart';
import { getErrorMessage } from '../api/request';
import { useScrollReveal } from '../hooks/useScrollReveal';

type FilterTab = 'weak' | 'improved' | 'due' | 'strong';

const MASTERY_ZONES = [
  { min: 70, label: '稳固', zone: 'Strong', color: 'text-[var(--color-success)] bg-[var(--color-success-subtle)] dark:bg-[var(--color-success-subtle-dark)]', barColor: 'bg-[var(--color-success)]' },
  { min: 40, label: '建设中', zone: 'Build', color: 'text-[var(--color-warning)] bg-[var(--color-warning-subtle)] dark:bg-[var(--color-warning-subtle-dark)]', barColor: 'bg-[var(--color-warning)]' },
  { min: 0,  label: '集中突破', zone: 'Focus', color: 'text-[var(--color-error)] bg-[var(--color-error-subtle)] dark:bg-[var(--color-error-subtle-dark)]', barColor: 'bg-[var(--color-error)]' },
] as const;

const STATS_CARDS_META = [
  { icon: <Target className="w-5 h-5" />, label: '总练习次数', color: 'text-[var(--color-stats-sessions)]', bg: 'bg-[var(--color-stats-sessions-bg)] dark:bg-[var(--color-stats-sessions-bg-dark)]' },
  { icon: <CheckCircle className="w-5 h-5" />, label: '综合均分', color: 'text-[var(--color-stats-score)]', bg: 'bg-[var(--color-stats-score-bg)] dark:bg-[var(--color-stats-score-bg-dark)]' },
  { icon: <Clock className="w-5 h-5" />, label: '待复习', color: 'text-[var(--color-stats-reviews)]', bg: 'bg-[var(--color-stats-reviews-bg)] dark:bg-[var(--color-stats-reviews-bg-dark)]' },
  { icon: <Brain className="w-5 h-5" />, label: '技能覆盖', color: 'text-[var(--color-stats-coverage)]', bg: 'bg-[var(--color-stats-coverage-bg)] dark:bg-[var(--color-stats-coverage-bg-dark)]' },
];

const SIGNAL_NAMESPACE_LABELS: Record<string, string> = {
  communication: '表达沟通',
  reasoning: '推理分析',
  narrative: '项目叙事',
  metacognition: '自我校准',
};

function getZone(score: number) {
  return MASTERY_ZONES.find(z => score >= z.min) ?? MASTERY_ZONES[MASTERY_ZONES.length - 1];
}

function getSignalTone(signal: BehaviorSignalDto): string {
  if (signal.polarity === 'POSITIVE') {
    return 'bg-[var(--color-success-subtle)] dark:bg-[var(--color-success-subtle-dark)] text-[var(--color-success)]';
  }
  if (signal.status === 'IMPROVING' || signal.polarity === 'NEUTRAL') {
    return 'bg-[var(--color-warning-subtle)] dark:bg-[var(--color-warning-subtle-dark)] text-[var(--color-warning)]';
  }
  return 'bg-[var(--color-error-subtle)] dark:bg-[var(--color-error-subtle-dark)] text-[var(--color-error)]';
}

function getRecommendationTone(priority: number): string {
  if (priority <= 1) return 'border-[var(--color-error)]/30 bg-[var(--color-error-subtle)] dark:bg-[var(--color-error-subtle-dark)]';
  if (priority === 2) return 'border-[var(--color-warning)]/30 bg-[var(--color-warning-subtle)] dark:bg-[var(--color-warning-subtle-dark)]';
  return 'border-[var(--color-border-subtle)] dark:border-[var(--color-border-subtle-dark)] bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)]';
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const skillsRef = useScrollReveal<HTMLDivElement>();
  const weakPointsRef = useScrollReveal<HTMLDivElement>();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [activeWeakPoints, setActiveWeakPoints] = useState<WeakPointDto[]>([]);
  const [dueWeakPoints, setDueWeakPoints] = useState<WeakPointDto[]>([]);
  const [improvedWeakPoints, setImprovedWeakPoints] = useState<WeakPointDto[]>([]);
  const [strongPoints, setStrongPoints] = useState<StrongPointDto[]>([]);
  const [behaviorSignals, setBehaviorSignals] = useState<BehaviorSignalDto[]>([]);
  const [patterns, setPatterns] = useState<ProfilePatternDto[]>([]);
  const [recommendations, setRecommendations] = useState<ProfileRecommendationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>('weak');
  const [topicFilter, setTopicFilter] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        profileData,
        activeWeakData,
        dueWeakData,
        improvedWeakData,
        strongData,
        behaviorSignalData,
        patternData,
        recommendationData,
      ] = await Promise.all([
        profileApi.getProfile(),
        profileApi.getWeakPoints('default', 'ACTIVE'),
        profileApi.getWeakPoints('default', 'DUE'),
        profileApi.getWeakPoints('default', 'IMPROVED'),
        profileApi.getStrongPoints(),
        profileApi.getBehaviorSignals(),
        profileApi.getPatterns(),
        profileApi.getRecommendations(),
      ]);
      setProfile(profileData);
      setActiveWeakPoints(activeWeakData);
      setDueWeakPoints(dueWeakData);
      setImprovedWeakPoints(improvedWeakData);
      setStrongPoints(strongData);
      setBehaviorSignals(behaviorSignalData);
      setPatterns(patternData);
      setRecommendations(recommendationData);
      setError(null);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const topics = useMemo(() => [...new Set([
    ...activeWeakPoints.map(w => w.topic),
    ...dueWeakPoints.map(w => w.topic),
    ...improvedWeakPoints.map(w => w.topic),
    ...strongPoints.map(sp => sp.topic),
  ])].sort(), [activeWeakPoints, dueWeakPoints, improvedWeakPoints, strongPoints]);

  const groupedBehaviorSignals = useMemo(() => {
    return behaviorSignals.reduce((acc, signal) => {
      (acc[signal.namespace] = acc[signal.namespace] || []).push(signal);
      return acc;
    }, {} as Record<string, BehaviorSignalDto[]>);
  }, [behaviorSignals]);

  const totalSessions = useMemo(
    () => profile?.topicMasteries.reduce((sum, m) => sum + m.sessionCount, 0) ?? 0,
    [profile]
  );
  const avgScore = useMemo(() => {
    const ms = profile?.topicMasteries ?? [];
    return ms.length > 0 ? ms.reduce((sum, m) => sum + m.score, 0) / ms.length : 0;
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-3 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{error || '加载失败'}</p>
        <button onClick={() => navigate('/upload')} className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg">返回首页</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/upload')}
          className="p-2 rounded-xl hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--color-text)] dark:text-[var(--color-text-dark)]" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] tracking-tight">个人画像</h1>
          {profile.targetRole && (
            <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-1">目标岗位: {profile.targetRole}</p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {STATS_CARDS_META.map((card, i) => (
          <div key={card.label} className="reveal-item" style={{ '--reveal-delay': `${i * 100}ms` } as React.CSSProperties}>
            <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <span className={card.color}>{card.icon}</span>
              </div>
              <div className="text-2xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{
                card.label === '总练习次数' ? totalSessions :
                card.label === '综合均分' ? parseFloat(avgScore.toFixed(1)) :
                card.label === '待复习' ? profile.dueReviewCount :
                profile.topicMasteries.length
              }</div>
              <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-0.5">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Score Trend Chart */}
      {profile.topicMasteries.length > 1 && (
        <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-4">技能分数概览</h3>
          <ScoreTrendChart masteries={profile.topicMasteries} />
        </div>
      )}

      {/* Skill Mastery Details */}
      <div ref={skillsRef} className="scroll-reveal bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl p-6 mb-6">
        <h3 className="font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-4">技能掌握详情</h3>
        <div className="space-y-3">
          {profile.topicMasteries.map(m => {
            const zone = getZone(m.score);
            return (
              <div key={m.topic} className="flex items-center gap-3">
                <span className="w-28 text-sm text-[var(--color-text)] dark:text-[var(--color-text-dark)] truncate">{m.topic}</span>
                <div className="flex-1 h-2 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${zone.barColor}`}
                    style={{ width: `${m.score}%` }}
                  />
                </div>
                <span className="w-12 text-sm font-medium text-right text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{m.score.toFixed(1)}</span>
                <span className={`w-16 text-xs text-center px-2 py-0.5 rounded-full ${zone.color}`}>{zone.label}</span>
                <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{m.sessionCount}次练习</span>
              </div>
            );
          })}
          {profile.topicMasteries.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] text-center py-4">暂无练习数据</p>
          )}
        </div>
      </div>

      {/* Weak Points / Review Section */}
      <div ref={weakPointsRef} className="scroll-reveal bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          {topics.length > 1 && (
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="text-sm border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-lg px-3 py-1.5 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="">全部主题</option>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>
        <div className="flex gap-4 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)] mb-4">
          {[
            { key: 'weak' as FilterTab, label: '弱项', count: activeWeakPoints.filter(w => !topicFilter || w.topic === topicFilter).length },
            { key: 'due' as FilterTab, label: '待复习', count: dueWeakPoints.filter(w => !topicFilter || w.topic === topicFilter).length },
            { key: 'improved' as FilterTab, label: '已改善', count: improvedWeakPoints.filter(w => !topicFilter || w.topic === topicFilter).length },
            { key: 'strong' as FilterTab, label: '强项', count: strongPoints.filter(sp => !topicFilter || sp.topic === topicFilter).length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                filterTab === tab.key
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-text-dark)]'
              }`}
            >
              {tab.label}
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)]">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {(() => {
            if (filterTab === 'strong') {
              const filtered = strongPoints.filter(sp => !topicFilter || sp.topic === topicFilter);
              if (filtered.length === 0) {
                return <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] text-center py-8">暂无强项记录，继续加油练习吧</p>;
              }
              return Object.entries(
                filtered.reduce((acc, sp) => {
                  (acc[sp.topic] = acc[sp.topic] || []).push(sp);
                  return acc;
                }, {} as Record<string, StrongPointDto[]>)
              ).map(([topic, points]) => (
                <div key={topic}>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-[var(--color-badge-topic-bg)] dark:bg-[var(--color-badge-topic-bg-dark)] text-[var(--color-badge-topic)]">{topic}</span>
                  <ul className="mt-1 ml-4 space-y-1">
                    {points.map(p => (
                      <li key={p.id} className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">- {p.description}</li>
                    ))}
                  </ul>
                </div>
              ));
            }

            const list = (filterTab === 'weak' ? activeWeakPoints : filterTab === 'due' ? dueWeakPoints : improvedWeakPoints)
              .filter(w => !topicFilter || w.topic === topicFilter);

            if (list.length === 0) {
              const emptyMessages: Record<string, string> = {
                weak: '没有薄弱项，表现出色',
                improved: '暂无已改善的弱项',
                due: '暂无待复习内容',
              };
              return <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] text-center py-8">{emptyMessages[filterTab] ?? '暂无数据'}</p>;
            }

            return list.map(wp => (
              <div key={wp.id} className="p-4 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-xl border border-[var(--color-border-subtle)] dark:border-[var(--color-border-subtle-dark)]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex gap-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-[var(--color-badge-weak-bg)] dark:bg-[var(--color-badge-weak-bg-dark)] text-[var(--color-badge-weak)]">{wp.topic}</span>
                    {wp.isImproved && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-[var(--color-badge-improved-bg)] dark:bg-[var(--color-badge-improved-bg-dark)] text-[var(--color-badge-improved)]">
                        已改善
                        <span className="inline-block animate-bounce-in text-[var(--color-badge-improved)] ml-1">&uarr;</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">已见{wp.timesSeen}次</span>
                </div>
                <p className="text-sm text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-1">{wp.questionText}</p>
                {wp.answerSummary && (
                  <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">参考回答: {wp.answerSummary}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
                  <span>下次复习: {wp.nextReview}</span>
                  <span>EF: {wp.easeFactor.toFixed(2)}</span>
                  <span>重复: {wp.repetitions}次</span>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Behavior Signals */}
      <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl p-6 mt-6">
        <h3 className="font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-4">表现画像</h3>
        {behaviorSignals.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] text-center py-8">暂无表现画像，完成一次面试后会自动沉淀</p>
        ) : (
          <div className="space-y-5">
            {Object.entries(groupedBehaviorSignals).map(([namespace, signals]) => (
              <div key={namespace}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-[var(--color-badge-topic-bg)] dark:bg-[var(--color-badge-topic-bg-dark)] text-[var(--color-badge-topic)]">
                    {SIGNAL_NAMESPACE_LABELS[namespace] ?? namespace}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{signals.length} 条</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {signals.map(signal => (
                    <div key={signal.id} className="p-4 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-xl border border-[var(--color-border-subtle)] dark:border-[var(--color-border-subtle-dark)]">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${getSignalTone(signal)}`}>{signal.status}</span>
                        <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">已见{signal.timesSeen}次</span>
                      </div>
                      <p className="text-sm text-[var(--color-text)] dark:text-[var(--color-text-dark)] leading-relaxed">{signal.statement}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patterns and Recommendations */}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers3 className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">长期模式</h3>
          </div>
          {patterns.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] text-center py-8">暂无长期模式</p>
          ) : (
            <div className="space-y-3">
              {patterns.map(pattern => (
                <div key={pattern.id} className="p-4 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-xl border border-[var(--color-border-subtle)] dark:border-[var(--color-border-subtle-dark)]">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-sm font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{pattern.title}</h4>
                    <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{Math.round(pattern.confidence * 100)}%</span>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{pattern.summary}</p>
                  {pattern.relatedTopics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {pattern.relatedTopics.map(topic => (
                        <span key={topic} className="text-xs px-2 py-0.5 rounded bg-[var(--color-badge-topic-bg)] dark:bg-[var(--color-badge-topic-bg-dark)] text-[var(--color-badge-topic)]">{topic}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">推荐行动</h3>
          </div>
          {recommendations.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] text-center py-8">暂无推荐行动</p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <div key={`${recommendation.type}-${recommendation.title}-${index}`} className={`p-4 rounded-xl border ${getRecommendationTone(recommendation.priority)}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-sm font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{recommendation.title}</h4>
                    <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">P{recommendation.priority}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{recommendation.reason}</p>
                  {recommendation.topic && (
                    <span className="inline-flex mt-3 text-xs px-2 py-0.5 rounded bg-[var(--color-badge-topic-bg)] dark:bg-[var(--color-badge-topic-bg-dark)] text-[var(--color-badge-topic)]">{recommendation.topic}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
