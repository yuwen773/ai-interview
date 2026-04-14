import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ChevronLeft, TrendingUp } from 'lucide-react';
import { historyApi, type GrowthCurve, type ResumeDetail } from '../api/history';
import { formatDateOnly } from '../utils/date';

interface GrowthCurvePageProps {
  resumeId: number;
  onBack: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  JAVA_BACKEND: '#2563eb',
  WEB_FRONTEND: '#f59e0b',
  PYTHON_ALGORITHM: '#10b981',
};

export default function GrowthCurvePage({ resumeId, onBack }: GrowthCurvePageProps) {
  const [growthCurve, setGrowthCurve] = useState<GrowthCurve | null>(null);
  const [resume, setResume] = useState<ResumeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRoles, setActiveRoles] = useState<Record<string, boolean>>({});
  const [chartDims, setChartDims] = useState({ width: 0, height: 320 });
  const chartRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setChartDims({ width, height: Math.min(320, width * 0.5) });
      }
    });
    ro.observe(el);
    // initial measurement
    const { width } = el.getBoundingClientRect();
    setChartDims({ width, height: Math.min(320, width * 0.5) });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [growthData, resumeData] = await Promise.all([
          historyApi.getGrowthCurve(resumeId),
          historyApi.getResumeDetail(resumeId),
        ]);
        setGrowthCurve(growthData);
        setResume(resumeData);
        setActiveRoles(
          Object.fromEntries(growthData.byJobRole.map(item => [item.jobRole, true]))
        );
      } catch (err) {
        console.error('加载成长曲线失败', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [resumeId]);

  const chartData = useMemo(() => {
    if (!growthCurve) {
      return [];
    }

    const timeline = new Map<string, Record<string, string | number | null>>();

    growthCurve.byJobRole.forEach(series => {
      series.scorePoints.forEach(point => {
        const key = point.date;
        const current = timeline.get(key) ?? {
          date: point.date,
          displayDate: formatDateOnly(point.date),
        };
        current[series.jobRole] = point.overallScore;
        timeline.set(key, current);
      });
    });

    return Array.from(timeline.entries())
      .sort(([left], [right]) => new Date(left).getTime() - new Date(right).getTime())
      .map(([, value]) => value);
  }, [growthCurve]);

  const visibleSeries = useMemo(() => {
    return (growthCurve?.byJobRole ?? []).filter(series => activeRoles[series.jobRole] !== false);
  }, [growthCurve, activeRoles]);

  const summaryCards = useMemo(() => {
    return (growthCurve?.byJobRole ?? []).map(series => {
      const latestPoint = series.scorePoints[series.scorePoints.length - 1];
      const firstPoint = series.scorePoints[0];
      return {
        ...series,
        latestScore: latestPoint?.overallScore ?? null,
        delta:
          latestPoint && firstPoint
            ? latestPoint.overallScore - firstPoint.overallScore
            : null,
        latestCategories: latestPoint?.categoryScores ?? [],
      };
    });
  }, [growthCurve]);

  const toggleRole = (jobRole: string) => {
    setActiveRoles(prev => ({
      ...prev,
      [jobRole]: prev[jobRole] === false,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          className="w-12 h-12 border-4 border-[var(--color-surface-raised)] dark:border-[var(--color-border-dark)] border-t-[var(--color-primary)] rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (!growthCurve) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">成长曲线加载失败，请返回重试</p>
        <button onClick={onBack} className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg">返回详情</button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 min-w-0">
      <div className="flex items-center justify-between gap-4 flex-wrap min-w-0">
        <div className="flex items-center gap-4 min-w-0">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-text-dark)] transition-all shadow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">成长曲线</h2>
            <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
              {resume?.filename || `简历 #${resumeId}`} · 按岗位查看面试得分趋势
            </p>
          </div>
        </div>
      </div>

      {growthCurve.byJobRole.length === 0 ? (
        <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-full flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-[var(--color-text-muted)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--color-text)] dark:text-[var(--color-text-muted-dark)] mb-2">暂无可展示的成长曲线</h3>
          <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">完成至少一场已评分面试后，这里会显示按岗位分组的趋势线。</p>
        </div>
      ) : (
        <>
          <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl p-6 space-y-6 min-w-0">
            <div className="flex items-center justify-between gap-4 flex-wrap min-w-0">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">岗位得分趋势</h3>
                <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">可按岗位显示或隐藏曲线</p>
              </div>
              <div className="flex gap-3 flex-wrap min-w-0">
                {growthCurve.byJobRole.map(series => {
                  const active = activeRoles[series.jobRole] !== false;
                  return (
                    <button
                      key={series.jobRole}
                      onClick={() => toggleRole(series.jobRole)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        active
                          ? 'border-transparent text-white'
                          : 'border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]'
                      }`}
                      style={active ? { backgroundColor: ROLE_COLORS[series.jobRole] || '#6366f1' } : undefined}
                    >
                      {series.jobLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            <div ref={chartRef} className="w-full" style={{ height: 320 }}>
              <ResponsiveContainer width={chartDims.width || '100%'} height={320}>
                <LineChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-[var(--color-border-dark)]" />
                  <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: unknown, name: string | number | undefined) => {
                      const displayValue = Array.isArray(value) ? value.join(', ') : (value ?? '-');
                      const series = growthCurve.byJobRole.find(item => item.jobRole === name);
                      return [`${displayValue} 分`, series?.jobLabel || String(name ?? '-')];
                    }}
                  />
                  <Legend formatter={(value) => growthCurve.byJobRole.find(item => item.jobRole === value)?.jobLabel || value} />
                  {visibleSeries.map(series => (
                    <Line
                      key={series.jobRole}
                      type="monotone"
                      dataKey={series.jobRole}
                      stroke={ROLE_COLORS[series.jobRole] || '#6366f1'}
                      strokeWidth={3}
                      dot={{ fill: ROLE_COLORS[series.jobRole] || '#6366f1', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: ROLE_COLORS[series.jobRole] || '#6366f1' }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summaryCards.map(card => (
              <div key={card.jobRole} className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{card.jobLabel}</span>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: ROLE_COLORS[card.jobRole] || '#6366f1' }}
                  >
                    {card.scorePoints.length} 次
                  </span>
                </div>
                <div className="flex items-end gap-3 mb-4">
                  <span className="text-3xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{card.latestScore ?? '-'}</span>
                  <span className={`text-sm font-medium ${card.delta !== null && card.delta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {card.delta === null ? '暂无变化' : `${card.delta >= 0 ? '+' : ''}${card.delta} 分`}
                  </span>
                </div>
                <div className="space-y-2">
                  {card.latestCategories.length > 0 ? (
                    card.latestCategories.map((category: { category: string; score: number }) => (
                      <div key={`${card.jobRole}-${category.category}`} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{category.category}</span>
                        <span className="font-medium text-[var(--color-text)] dark:text-[var(--color-text-muted-dark)]">{category.score} 分</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">最新一场暂无分类分数</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
