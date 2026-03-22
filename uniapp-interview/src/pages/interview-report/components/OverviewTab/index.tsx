import { View, Text } from '@tarojs/components';
import type { InterviewReport } from '@/types/interview';
import './index.scss';

interface Props {
  data: InterviewReport;
}

function getScoreLevel(score: number) {
  if (score >= 85) return { label: '表现优秀', color: '#52c41a' };
  if (score >= 70) return { label: '表现良好', color: '#1890ff' };
  if (score >= 60) return { label: '表现一般', color: '#faad14' };
  return { label: '需要加强', color: '#ff4d4f' };
}

function getDimensionTone(score: number) {
  if (score >= 85) return '#52c41a';
  if (score >= 70) return '#1890ff';
  if (score >= 60) return '#faad14';
  return '#ff4d4f';
}

export default function OverviewTab({ data }: Props) {
  const { overallScore, jobLabel, totalQuestions, categoryScores, referenceAnswers } = data;
  const level = getScoreLevel(overallScore);

  return (
    <View className="overview-tab">
      {/* Hero Section */}
      <View className="overview-tab__hero">
        <Text className="overview-tab__eyebrow">面试评估报告</Text>
        <Text className="overview-tab__title">{jobLabel || '岗位模拟面试'}</Text>
        <View className="overview-tab__badge" style={{ background: level.color }}>
          {level.label}
        </View>
        <View className="overview-tab__score">
          <Text className="overview-tab__score-num">{overallScore}</Text>
          <Text className="overview-tab__score-total">/100</Text>
        </View>
      </View>

      {/* Stats */}
      <View className="overview-tab__stats">
        <View className="overview-tab__stat">
          <Text className="overview-tab__stat-num">{totalQuestions}</Text>
          <Text className="overview-tab__stat-label">完成题数</Text>
        </View>
        <View className="overview-tab__stat">
          <Text className="overview-tab__stat-num">{categoryScores?.length ?? 0}</Text>
          <Text className="overview-tab__stat-label">覆盖维度</Text>
        </View>
        <View className="overview-tab__stat">
          <Text className="overview-tab__stat-num">{referenceAnswers?.length ?? 0}</Text>
          <Text className="overview-tab__stat-label">参考答案</Text>
        </View>
      </View>

      {/* Category Scores */}
      <View className="overview-tab__categories">
        <Text className="overview-tab__section-title">分类得分</Text>
        {categoryScores?.map((cat, index) => (
          <View key={index} className="overview-tab__category-item">
            <View className="overview-tab__category-header">
              <Text className="overview-tab__category-name">{cat.category}</Text>
              <Text className="overview-tab__category-score">{cat.score}分</Text>
            </View>
            <View className="overview-tab__progress">
              <View
                className="overview-tab__progress-bar"
                style={{
                  width: `${Math.max(6, Math.min(cat.score, 100))}%`,
                  background: getDimensionTone(cat.score)
                }}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
