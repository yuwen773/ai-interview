import { Button, ScrollView, Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import {
  historyApi,
  type InterviewHistorySummary,
  type InterviewHistorySummaryItem,
} from '../../api/history';
import Loading from '../../components/common/Loading';
import Empty from '../../components/common/Empty';
import './index.scss';

function formatDateTime(value?: string | null) {
  if (!value) {
    return '暂无';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.replace('T', ' ').slice(0, 16);
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

function getStatusMeta(item: InterviewHistorySummaryItem) {
  const isOngoing = item.status === 'CREATED' || item.status === 'IN_PROGRESS';
  if (isOngoing) {
    return {
      label: '进行中',
      className: 'status-pill status-pill--warning',
      actionText: '继续面试',
    };
  }

  return {
    label: '已完成',
    className: 'status-pill status-pill--success',
    actionText: '查看报告',
  };
}

const EMPTY_SUMMARY: InterviewHistorySummary = {
  stats: {
    totalCount: 0,
    completedCount: 0,
    averageScore: 0,
  },
  items: [],
};

export default function InterviewHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<InterviewHistorySummary>(EMPTY_SUMMARY);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await historyApi.getInterviewHistorySummary();
      setSummary(data);
    } catch (error) {
      console.error('加载面试记录失败', error);
      Taro.showToast({ title: '加载记录失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useDidShow(() => {
    void loadSummary();
  });

  const handleOpen = (item: InterviewHistorySummaryItem) => {
    const target =
      item.status === 'CREATED' || item.status === 'IN_PROGRESS'
        ? `/pages/interview/index?sessionId=${item.sessionId}`
        : `/pages/interview-report/index?sessionId=${item.sessionId}`;
    Taro.navigateTo({ url: target });
  };

  const handleExport = async (sessionId: string) => {
    try {
      const filePath = await historyApi.exportInterviewPdf(sessionId);
      await Taro.openDocument({ filePath, fileType: 'pdf' });
    } catch (error) {
      console.error('导出面试报告失败', error);
      Taro.showToast({ title: '导出失败', icon: 'none' });
    }
  };

  const handleDelete = async (item: InterviewHistorySummaryItem) => {
    const result = await Taro.showModal({
      title: '删除记录',
      content: `确认删除 ${item.jobLabel} 的面试记录吗？`,
      confirmText: '删除',
      confirmColor: '#ef4444',
    });

    if (!result.confirm) {
      return;
    }

    try {
      await historyApi.deleteInterview(item.sessionId);
      Taro.showToast({ title: '已删除', icon: 'success' });
      setSummary((current) => {
        const items = current.items.filter((entry) => entry.sessionId !== item.sessionId);
        const completed = items.filter((entry) => entry.status === 'COMPLETED').length;
        const scores = items
          .map((entry) => entry.overallScore)
          .filter((score): score is number => typeof score === 'number');
        return {
          stats: {
            totalCount: items.length,
            completedCount: completed,
            averageScore: scores.length
              ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
              : 0,
          },
          items,
        };
      });
    } catch (error) {
      console.error('删除面试记录失败', error);
      Taro.showToast({ title: '删除失败', icon: 'none' });
    }
  };

  if (loading) {
    return (
      <View className="interview-history-page page-shell">
        <Loading text="正在整理最近的面试记录..." />
      </View>
    );
  }

  return (
    <ScrollView className="interview-history-page page-shell" scrollY>
      <View className="interview-history-page__hero section-shell">
        <View className="interview-history-page__hero-head">
          <View>
            <Text className="interview-history-page__eyebrow">训练记录</Text>
            <Text className="interview-history-page__title">把每次练习的状态、结果和复盘集中到一个列表</Text>
          </View>
          <View className="status-pill status-pill--info">历史摘要</View>
        </View>
        <Text className="interview-history-page__desc">
          可以直接继续未完成会话，也可以回看最新报告、导出 PDF 或删除旧记录。
        </Text>
        <View className="interview-history-page__stats">
          <View className="stat-block">
            <Text className="stat-block__value">{summary.stats.totalCount}</Text>
            <Text className="stat-block__label">总场次</Text>
            <Text className="stat-block__hint">包含进行中和已完成的练习</Text>
          </View>
          <View className="stat-block">
            <Text className="stat-block__value">{summary.stats.completedCount}</Text>
            <Text className="stat-block__label">已完成</Text>
            <Text className="stat-block__hint">可直接进入报告查看与导出</Text>
          </View>
          <View className="stat-block">
            <Text className="stat-block__value">{summary.stats.averageScore || '--'}</Text>
            <Text className="stat-block__label">平均分</Text>
            <Text className="stat-block__hint">按已产生分数的历史记录统计</Text>
          </View>
        </View>
      </View>

      {summary.items.length === 0 ? (
        <Empty
          text="还没有面试记录。先从首页或简历详情页发起一次模拟面试。"
          actionText="返回首页"
          onAction={() => Taro.switchTab({ url: '/pages/index/index' })}
        />
      ) : (
        <View className="interview-history-page__list">
          {summary.items.map((item) => {
            const statusMeta = getStatusMeta(item);
            return (
              <View key={item.sessionId} className="task-card interview-history-page__card">
                <View className="interview-history-page__card-head">
                  <View>
                    <Text className="task-card__eyebrow">{item.resumeFilename}</Text>
                    <Text className="interview-history-page__card-title">{item.jobLabel}</Text>
                  </View>
                  <View className={statusMeta.className}>{statusMeta.label}</View>
                </View>

                <Text className="task-card__desc">
                  {item.totalQuestions} 题 · 创建于 {formatDateTime(item.createdAt)}
                  {item.completedAt ? ` · 完成于 ${formatDateTime(item.completedAt)}` : ''}
                </Text>

                <View className="interview-history-page__meta-grid">
                  <View className="interview-history-page__meta">
                    <Text className="interview-history-page__meta-value">{item.overallScore ?? '--'}</Text>
                    <Text className="interview-history-page__meta-label">得分</Text>
                  </View>
                  <View className="interview-history-page__meta">
                    <Text className="interview-history-page__meta-value">
                      {item.status === 'CREATED' || item.status === 'IN_PROGRESS' ? '继续中' : '已归档'}
                    </Text>
                    <Text className="interview-history-page__meta-label">状态</Text>
                  </View>
                </View>

                <View className="interview-history-page__actions">
                  <Button className="action-chip interview-history-page__action" onClick={() => handleOpen(item)}>
                    {statusMeta.actionText}
                  </Button>
                  <Button
                    className="action-chip action-chip--secondary interview-history-page__action"
                    onClick={() => handleExport(item.sessionId)}
                  >
                    导出 PDF
                  </Button>
                  <Button className="interview-history-page__delete" onClick={() => handleDelete(item)}>
                    删除
                  </Button>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
