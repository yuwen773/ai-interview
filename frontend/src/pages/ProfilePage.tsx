import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Brain, Target, CheckCircle, Clock } from 'lucide-react';
import { profileApi, type UserProfileDto, type TopicMasteryDto, type WeakPointDto, type StrongPointDto } from '../api/profile';
import { getErrorMessage } from '../api/request';
import { useScrollReveal } from '../hooks/useScrollReveal';

type FilterTab = 'weak' | 'improved' | 'due' | 'strong';

const MASTERY_ZONES = [
  { min: 70, label: '稳固', zone: 'Strong', color: 'text-green-500 bg-green-50 dark:bg-green-900/20', barColor: 'bg-green-500' },
  { min: 40, label: '建设中', zone: 'Build', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20', barColor: 'bg-amber-500' },
  { min: 0,  label: '集中突破', zone: 'Focus', color: 'text-red-500 bg-red-50 dark:bg-red-900/20', barColor: 'bg-red-500' },
] as const;

function getZone(score: number) {
  return MASTERY_ZONES.find(z => score >= z.min) ?? MASTERY_ZONES[MASTERY_ZONES.length - 1];
}

function ScoreTrendChart({ masteries }: { masteries: TopicMasteryDto[] }) {
  if (masteries.length === 0) return null;

  const data = masteries.map(m => ({ label: m.topic, score: m.score }));
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW),
    y: padding.top + chartH - (d.score / 100) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line
            x1={padding.left}
            y1={padding.top + chartH - (v / 100) * chartH}
            x2={width - padding.right}
            y2={padding.top + chartH - (v / 100) * chartH}
            stroke="var(--color-border)"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
          <text x={padding.left - 8} y={padding.top + chartH - (v / 100) * chartH + 4} textAnchor="end" fontSize="10" fill="var(--color-text-muted)">
            {v}
          </text>
        </g>
      ))}
      {/* Area */}
      <path d={areaPath} fill="url(#scoreGradient)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="var(--color-primary)" stroke="white" strokeWidth="2" />
          <text x={p.x} y={height - 10} textAnchor="middle" fontSize="10" fill="var(--color-text-muted)">
            {p.label.length > 6 ? p.label.slice(0, 6) + '\u2026' : p.label}
          </text>
          <title>{`${p.label}: ${p.score.toFixed(1)}`}</title>
        </g>
      ))}
    </svg>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const skillsRef = useScrollReveal<HTMLDivElement>();
  const weakPointsRef = useScrollReveal<HTMLDivElement>();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [dueReviews, setDueReviews] = useState<WeakPointDto[]>([]);
  const [strongPoints, setStrongPoints] = useState<StrongPointDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>('weak');
  const [topicFilter, setTopicFilter] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, reviewsData, strongData] = await Promise.all([
        profileApi.getProfile(),
        profileApi.getDueReviews(),
        profileApi.getStrongPoints(),
      ]);
      setProfile(profileData);
      setDueReviews(reviewsData);
      setStrongPoints(strongData);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const improvedPoints = useMemo(() => dueReviews.filter(w => w.isImproved), [dueReviews]);
  const weakPoints = useMemo(() => dueReviews.filter(w => !w.isImproved), [dueReviews]);
  const topics = useMemo(() => [...new Set(dueReviews.map(w => w.topic))].sort(), [dueReviews]);

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
        <p className="text-[var(--color-text-muted)]">{error || '加载失败'}</p>
        <button onClick={() => navigate('/upload')} className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg">返回首页</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/upload')} className="p-2 rounded-lg hover:bg-[var(--color-surface-raised)]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">个人画像</h1>
          {profile.targetRole && <p className="text-sm text-[var(--color-text-muted)]">目标岗位: {profile.targetRole}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: <Target className="w-5 h-5" />, label: '总练习次数', value: totalSessions, color: 'text-blue-500' },
          { icon: <CheckCircle className="w-5 h-5" />, label: '综合均分', value: parseFloat(avgScore.toFixed(1)), color: 'text-green-500' },
          { icon: <Clock className="w-5 h-5" />, label: '待复习', value: profile.dueReviewCount, color: 'text-orange-500' },
          { icon: <Brain className="w-5 h-5" />, label: '技能覆盖', value: profile.topicMasteries.length, color: 'text-purple-500' },
        ].map((card, i) => (
          <div key={card.label} className="reveal-item" style={{ '--reveal-delay': `${i * 100}ms` } as React.CSSProperties}>
            <StatsCard icon={card.icon} label={card.label} value={card.value} color={card.color} />
          </div>
        ))}
      </div>

      {profile.topicMasteries.length > 1 && (
        <div className="bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-4">技能分数概览</h3>
          <ScoreTrendChart masteries={profile.topicMasteries} />
        </div>
      )}

      <div ref={skillsRef} className="scroll-reveal bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-[var(--color-text)] mb-4">技能掌握详情</h3>
        <div className="space-y-3">
          {profile.topicMasteries.map(m => {
            const zone = getZone(m.score);
            return (
              <div key={m.topic} className="flex items-center gap-3">
                <span className="w-28 text-sm text-[var(--color-text)] truncate">{m.topic}</span>
                <div className="flex-1 h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${zone.barColor}`}
                    style={{ width: `${m.score}%` }}
                  />
                </div>
                <span className="w-12 text-sm font-medium text-right">{m.score.toFixed(1)}</span>
                <span className={`w-16 text-xs text-center px-2 py-0.5 rounded-full ${zone.color}`}>{zone.label}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{m.sessionCount}次练习</span>
              </div>
            );
          })}
          {profile.topicMasteries.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">暂无练习数据</p>
          )}
        </div>
      </div>

      <div ref={weakPointsRef} className="scroll-reveal bg-[var(--color-bg-secondary)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          {topics.length > 1 && (
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="text-sm border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-lg px-2 py-1 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)]"
            >
              <option value="">全部主题</option>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>
        <div className="flex gap-4 border-b border-[var(--color-border)] mb-4">
          {[
            { key: 'weak' as FilterTab, label: '弱项', count: weakPoints.filter(w => !topicFilter || w.topic === topicFilter).length },
            { key: 'due' as FilterTab, label: '待复习', count: dueReviews.filter(w => !topicFilter || w.topic === topicFilter).length },
            { key: 'improved' as FilterTab, label: '已改善', count: improvedPoints.filter(w => !topicFilter || w.topic === topicFilter).length },
            { key: 'strong' as FilterTab, label: '强项', count: strongPoints.filter(sp => !topicFilter || sp.topic === topicFilter).length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                filterTab === tab.key
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
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
                return <p className="text-sm text-[var(--color-text-muted)] text-center py-8">暂无强项记录，继续加油练习吧</p>;
              }
              return Object.entries(
                filtered.reduce((acc, sp) => {
                  (acc[sp.topic] = acc[sp.topic] || []).push(sp);
                  return acc;
                }, {} as Record<string, StrongPointDto[]>)
              ).map(([topic, points]) => (
                <div key={topic}>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-500">{topic}</span>
                  <ul className="mt-1 ml-4 space-y-1">
                    {points.map(p => (
                      <li key={p.id} className="text-sm text-[var(--color-text-muted)]">- {p.description}</li>
                    ))}
                  </ul>
                </div>
              ));
            }

            const list = (filterTab === 'weak' ? weakPoints : filterTab === 'due' ? dueReviews : improvedPoints)
              .filter(w => !topicFilter || w.topic === topicFilter);

            if (list.length === 0) {
              const emptyMessages: Record<string, string> = {
                weak: '没有薄弱项，表现出色',
                improved: '暂无已改善的弱项',
                due: '暂无待复习内容',
              };
              return <p className="text-sm text-[var(--color-text-muted)] text-center py-8">{emptyMessages[filterTab] ?? '暂无数据'}</p>;
            }

            return list.map(wp => (
              <div key={wp.id} className="p-4 bg-[var(--color-bg)] rounded-lg">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex gap-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-500">{wp.topic}</span>
                    {wp.isImproved && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-500">
                        已改善
                        <span className="inline-block animate-bounce-in text-green-500 ml-1">&uarr;</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">已见{wp.timesSeen}次</span>
                </div>
                <p className="text-sm text-[var(--color-text)] mb-1">{wp.questionText}</p>
                {wp.answerSummary && (
                  <p className="text-xs text-[var(--color-text-muted)]">参考回答: {wp.answerSummary}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-muted)]">
                  <span>下次复习: {wp.nextReview}</span>
                  <span>EF: {wp.easeFactor.toFixed(2)}</span>
                  <span>重复: {wp.repetitions}次</span>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}

function StatsCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <div className="text-2xl font-bold text-[var(--color-text)]">{value}</div>
      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
    </div>
  );
}
