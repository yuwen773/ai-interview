import {useMemo} from 'react';
import {
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart as RechartsRadarChart,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import {normalizeScore} from '../utils/score';

interface RadarChartProps {
  data: Array<{
    subject: string;
    score: number;
    fullMark: number;
  }>;
  height?: number;
  className?: string;
}

/**
 * 雷达图组件（自动归一化到统一比例）
 */
export default function RadarChart({ data, height = 320, className = '' }: RadarChartProps) {
  // 归一化数据：将所有维度归一化到统一比例
  const normalizedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const maxFullMark = Math.max(...data.map(item => item.fullMark));

    // 归一化每个维度到 maxFullMark 比例
    const normalizedScores = data.map(item =>
      normalizeScore(item.score, item.fullMark, maxFullMark)
    );
    const actualMaxScore = Math.max(...normalizedScores, 0);

    // chartMax 至少为 1，确保 Radar 有绘制范围
    const chartMax = Math.max(actualMaxScore, Math.min(maxFullMark, 10));

    return data.map(item => ({
      subject: item.subject,
      score: normalizeScore(item.score, item.fullMark, maxFullMark),
      fullMark: chartMax,
      originalScore: item.score,
      originalFullMark: item.fullMark
    }));
  }, [data]);

    // 检测是否为深色模式
    const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const tickColor = isDark ? '#94a3b8' : '#64748b';
    const tooltipBg = isDark ? '#1e293b' : '#fff';
    const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsRadarChart data={normalizedData}>
            <PolarGrid stroke={gridColor}/>
          <PolarAngleAxis
            dataKey="subject"
            tick={{fill: tickColor, fontSize: 12, fontWeight: 500}}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, Math.max(normalizedData[0]?.fullMark || 1, 1)]}
            tick={{fill: tickColor, fontSize: 10}}
            tickFormatter={(value) => value.toString()}
          />
          <Radar
            name="得分"
            dataKey="score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.6}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            formatter={(_value: number | undefined, _name: string | undefined, props: any) => {
              const originalScore = props?.payload?.originalScore ?? 0;
              const originalFullMark = props?.payload?.originalFullMark ?? 40;
                const percentage = originalFullMark > 0
                    ? Math.round((originalScore / originalFullMark) * 100)
                : 0;
              return [`${originalScore}/${originalFullMark} (${percentage}%)`, '得分'];
            }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
