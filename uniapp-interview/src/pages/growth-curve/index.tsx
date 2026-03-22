import { Button, ScrollView, Text, View } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import interviewApi from '../../api/interview';
import Loading from '../../components/common/Loading';
import Empty from '../../components/common/Empty';
import type { GrowthCurve, GrowthCurveJobRole } from '../../types/interview';
import './index.scss';

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(5, 10);
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${month}/${day}`;
}

export default function GrowthCurvePage() {
  const router = useRouter();
  const resumeId = router.params.resumeId || Taro.getStorageSync('currentResumeId');
  const [loading, setLoading] = useState(true);
  const [curve, setCurve] = useState<GrowthCurve | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    if (!resumeId) {
      setLoading(false);
      return;
    }

    const loadCurve = async () => {
      setLoading(true);
      try {
        const data = await interviewApi.getGrowthCurve(Number(resumeId));
        setCurve(data);
        setSelectedRole((current) => current || data.byJobRole[0]?.jobRole || '');
      } catch (error) {
        console.error('加载成长曲线失败', error);
        Taro.showToast({ title: '加载成长曲线失败', icon: 'none' });
      } finally {
        setLoading(false);
      }
    };

    void loadCurve();
  }, [resumeId]);

  const activeRole = useMemo<GrowthCurveJobRole | null>(() => {
    if (!curve?.byJobRole.length) {
      return null;
    }

    return curve.byJobRole.find((item) => item.jobRole === selectedRole) ?? curve.byJobRole[0];
  }, [curve, selectedRole]);

  const latestPoint = activeRole?.scorePoints.at(-1) ?? null;
  const bestPoint = activeRole?.scorePoints.reduce((best, current) => {
    if (!best || current.overallScore > best.overallScore) {
      return current;
    }
    return best;
  }, activeRole.scorePoints[0]);

  if (loading) {
    return (
      <View className="growth-curve-page page-shell">
        <Loading text="正在整理成长曲线..." />
      </View>
    );
  }

  if (!resumeId) {
    return (
      <View className="growth-curve-page page-shell">
        <Empty
          text="需要先选择一份简历，才能查看对应的成长趋势。"
          actionText="返回简历库"
          onAction={() => Taro.switchTab({ url: '/pages/resume-list/index' })}
        />
      </View>
    );
  }

  if (!curve?.byJobRole.length || !activeRole) {
    return (
      <View className="growth-curve-page page-shell">
        <Empty
          text="这份简历还没有可统计的历史得分。完成至少一场面试后，这里会展示趋势变化。"
          actionText="开始面试"
          onAction={() => Taro.navigateTo({ url: `/pages/interview-config/index?resumeId=${resumeId}` })}
        />
      </View>
    );
  }

  return (
    <View className="growth-curve-page page-shell">
      <View className="growth-curve-page__hero section-shell section-shell--primary">
        <Text className="growth-curve-page__eyebrow">成长曲线</Text>
        <Text className="growth-curve-page__title">用每次练习的分数变化判断自己是否真的在进步</Text>
        <Text className="growth-curve-page__desc">
          当前展示的是同一份简历下，不同岗位方向的历史成绩趋势。先看整体分数，再看最近一轮的分类表现。
        </Text>
        <View className="growth-curve-page__stats">
          <View className="stat-block">
            <Text className="stat-block__value">{activeRole.scorePoints.length}</Text>
            <Text className="stat-block__label">有效记录</Text>
            <Text className="stat-block__hint">按已完成且有分数的练习统计</Text>
          </View>
          <View className="stat-block">
            <Text className="stat-block__value">{latestPoint?.overallScore ?? '--'}</Text>
            <Text className="stat-block__label">最近得分</Text>
            <Text className="stat-block__hint">
              {latestPoint ? `最近一次 ${formatDateLabel(latestPoint.date)}` : '暂无最新得分'}
            </Text>
          </View>
          <View className="stat-block">
            <Text className="stat-block__value">{bestPoint?.overallScore ?? '--'}</Text>
            <Text className="stat-block__label">最佳得分</Text>
            <Text className="stat-block__hint">用于对比当前水平与历史峰值</Text>
          </View>
        </View>
      </View>

      <View className="growth-curve-page__chips">
        {curve.byJobRole.map((item) => (
          <Button
            key={item.jobRole}
            className={
              item.jobRole === activeRole.jobRole
                ? 'growth-curve-page__chip growth-curve-page__chip--active'
                : 'growth-curve-page__chip'
            }
            onClick={() => setSelectedRole(item.jobRole)}
          >
            {item.jobLabel}
          </Button>
        ))}
      </View>

      <View className="section-shell growth-curve-page__section">
        <View className="growth-curve-page__section-head">
          <Text className="growth-curve-page__section-title">{activeRole.jobLabel} 趋势</Text>
          <Text className="surface-note">用轻量柱状轨迹看每次练习的分数起伏。</Text>
        </View>
        <View className="growth-curve-page__chart">
          {activeRole.scorePoints.map((point) => (
            <View key={`${activeRole.jobRole}-${point.date}`} className="growth-curve-page__chart-column">
              <Text className="growth-curve-page__chart-score">{point.overallScore}</Text>
              <View className="growth-curve-page__chart-track">
                <View
                  className="growth-curve-page__chart-bar"
                  style={{ height: `${Math.max(8, point.overallScore)}%` }}
                />
              </View>
              <Text className="growth-curve-page__chart-date">{formatDateLabel(point.date)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="growth-curve-page__summary-grid">
        <View className="section-shell growth-curve-page__section">
          <View className="growth-curve-page__section-head">
            <Text className="growth-curve-page__section-title">最近一次分类表现</Text>
          </View>
          {latestPoint?.categoryScores.length ? (
            <View className="growth-curve-page__category-list">
              {latestPoint.categoryScores.map((item) => (
                <View key={item.category} className="growth-curve-page__category-item">
                  <View className="growth-curve-page__category-head">
                    <Text className="growth-curve-page__category-label">{item.category}</Text>
                    <Text className="growth-curve-page__category-score">{item.score}</Text>
                  </View>
                  <View className="growth-curve-page__category-track">
                    <View
                      className="growth-curve-page__category-fill"
                      style={{ width: `${Math.max(0, Math.min(item.score, 100))}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="growth-curve-page__placeholder">最近一次练习还没有分类得分明细。</Text>
          )}
        </View>

        <View className="section-shell growth-curve-page__section">
          <View className="growth-curve-page__section-head">
            <Text className="growth-curve-page__section-title">行动建议</Text>
          </View>
          <View className="growth-curve-page__tips">
            <View className="growth-curve-page__tip">
              <Text className="growth-curve-page__tip-title">继续当前方向</Text>
              <Text className="growth-curve-page__tip-text">
                如果最近分数接近或超过历史最佳，可以继续沿用当前岗位方向刷题。
              </Text>
            </View>
            <View className="growth-curve-page__tip">
              <Text className="growth-curve-page__tip-title">回看最近报告</Text>
              <Text className="growth-curve-page__tip-text">
                若最近一次分数回落，优先回看该场报告里的改进建议，再进入下一轮练习。
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
