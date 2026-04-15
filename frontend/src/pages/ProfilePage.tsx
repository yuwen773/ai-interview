import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Brain, Target, CheckCircle, Clock } from 'lucide-react';
import { profileApi, type UserProfileDto, type WeakPointDto } from '../api/profile';
import { getErrorMessage } from '../api/request';

type FilterTab = 'weak' | 'improved' | 'due';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [dueReviews, setDueReviews] = useState<WeakPointDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>('weak');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, reviewsData] = await Promise.all([
        profileApi.getProfile('current'),
        profileApi.getDueReviews('current'),
      ]);
      setProfile(profileData);
      setDueReviews(reviewsData);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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

  // Derive improved weak points from dueReviews (isImproved=true)
  const improvedPoints = dueReviews.filter(w => w.isImproved);
  const weakPoints = dueReviews.filter(w => !w.isImproved);

  // Practice statistics
  const totalSessions = profile.topicMasteries.reduce((sum, m) => sum + m.sessionCount, 0);
  const avgScore = profile.topicMasteries.length > 0
    ? profile.topicMasteries.reduce((sum, m) => sum + m.score, 0) / profile.topicMasteries.length
    : 0;

  // Get zone label based on mastery score
  const getZone = (score: number) => {
    if (score >= 80) return { label: '掌握', color: 'text-green-500 bg-green-50 dark:bg-green-900/20' };
    if (score >= 60) return { label: '熟悉', color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' };
    if (score >= 40) return { label: '薄弱', color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' };
    return { label: '欠缺的', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/upload')} className="p-2 rounded-lg hover:bg-[var(--color-surface-raised)]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">个人画像</h1>
          {profile.targetRole && <p className="text-sm text-[var(--color-text-muted)]">目标岗位: {profile.targetRole}</p>}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard icon={<Target className="w-5 h-5" />} label="总练习次数" value={totalSessions} color="text-blue-500" />
        <StatsCard icon={<CheckCircle className="w-5 h-5" />} label="综合均分" value={parseFloat(avgScore.toFixed(1))} color="text-green-500" />
        <StatsCard icon={<Clock className="w-5 h-5" />} label="待复习" value={profile.dueReviewCount} color="text-orange-500" />
        <StatsCard icon={<Brain className="w-5 h-5" />} label="技能覆盖" value={profile.topicMasteries.length} color="text-purple-500" />
      </div>

      {/* Domain Table */}
      <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-[var(--color-text)] mb-4">技能掌握详情</h3>
        <div className="space-y-3">
          {profile.topicMasteries.map(m => {
            const zone = getZone(m.score);
            return (
              <div key={m.topic} className="flex items-center gap-3">
                <span className="w-28 text-sm text-[var(--color-text)] truncate">{m.topic}</span>
                <div className="flex-1 h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${m.score >= 80 ? 'bg-green-500' : m.score >= 60 ? 'bg-yellow-500' : m.score >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
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

      {/* Evidence Table with tabs */}
      <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6">
        <div className="flex gap-4 border-b border-[var(--color-border)] mb-4">
          {[
            { key: 'weak' as FilterTab, label: '弱项', count: weakPoints.length },
            { key: 'due' as FilterTab, label: '待复习', count: dueReviews.length },
            { key: 'improved' as FilterTab, label: '已改善', count: improvedPoints.length },
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
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {(filterTab === 'weak' ? weakPoints : filterTab === 'due' ? dueReviews : improvedPoints).map(wp => (
            <div key={wp.id} className="p-4 bg-[var(--color-bg)] rounded-lg">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-500 mr-2">{wp.topic}</span>
                  {wp.isImproved && <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-500">已改善</span>}
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
          ))}
          {dueReviews.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
              {filterTab === 'improved' ? '暂无已改善的弱项' : '暂无待复习内容'}
            </p>
          )}
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
