import { Button, Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import Loading from '../../components/common/Loading';
import dashboardApi from '../../api/dashboard';
import { isInterviewOngoing } from '../../utils/interviewSession';
import type { DashboardSummary } from '../../types/dashboard';
import './index.scss';

type TaskCardConfig = {
  badgeText: string;
  badgeClassName: string;
  title: string;
  description: string;
  actionText: string;
  actionClassName?: string;
  onAction: () => void;
};

const FALLBACK_SUMMARY: DashboardSummary = {
  resumeCount: 0,
  totalInterviewCount: 0,
  unfinishedInterviewCount: 0,
  latestResume: null,
  latestInterview: null,
  latestReport: null,
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return '刚刚更新';
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

function getInterviewStatusMeta(summary: DashboardSummary) {
  const latestInterview = summary.latestInterview;

  if (!latestInterview) {
    return {
      label: '待开始',
      className: 'status-pill status-pill--info',
      text: summary.resumeCount > 0 ? '已有简历，可以开始第一场练习' : '上传简历后即可生成专属练习路径',
    };
  }

  if (isInterviewOngoing(latestInterview)) {
    return {
      label: '进行中',
      className: 'status-pill status-pill--warning',
      text: `最近一场练习创建于 ${formatDateTime(latestInterview.createdAt)}`,
    };
  }

  if (latestInterview.status === 'COMPLETED') {
    return {
      label: '待看报告',
      className: 'status-pill status-pill--info',
      text: `已完成作答，建议回顾报告详情`,
    };
  }

  return {
    label: '已出报告',
    className: 'status-pill status-pill--success',
    text:
      latestInterview.overallScore == null
        ? `练习完成于 ${formatDateTime(latestInterview.completedAt)}`
        : `最近得分 ${latestInterview.overallScore} 分`,
  };
}

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [statusNote, setStatusNote] = useState('');

  const loadSummary = async () => {
    setLoading(true);
    setStatusNote('');

    try {
      const nextSummary = await dashboardApi.getSummary();
      setSummary(nextSummary);
    } catch (error) {
      console.error('加载首页摘要失败:', error);
      setSummary((currentSummary) => currentSummary ?? FALLBACK_SUMMARY);
      setStatusNote('当前无法连接本地服务，首页先展示占位状态。接通后端后会自动恢复真实数据。');
    } finally {
      setLoading(false);
    }
  };

  useDidShow(() => {
    loadSummary();
  });

  const goUpload = () => {
    Taro.navigateTo({ url: '/pages/upload/index' });
  };

  const goResumeLibrary = () => {
    Taro.switchTab({ url: '/pages/resume-list/index' });
  };

  const goInterviewHistory = () => {
    Taro.switchTab({ url: '/pages/interview-history/index' });
  };

  const goLatestResume = () => {
    if (!summary?.latestResume?.id) {
      goResumeLibrary();
      return;
    }

    Taro.setStorageSync('currentResumeId', String(summary.latestResume.id));
    Taro.navigateTo({ url: `/pages/resume-detail/index?id=${summary.latestResume.id}` });
  };

  const goInterviewConfig = () => {
    if (!summary?.latestResume?.id) {
      Taro.showToast({ title: '请先上传简历', icon: 'none' });
      return;
    }

    Taro.setStorageSync('currentResumeId', String(summary.latestResume.id));
    Taro.navigateTo({ url: `/pages/interview-config/index?resumeId=${summary.latestResume.id}` });
  };

  const continueInterview = () => {
    if (!summary?.latestInterview?.sessionId) {
      goInterviewConfig();
      return;
    }

    Taro.navigateTo({ url: `/pages/interview/index?sessionId=${summary.latestInterview.sessionId}` });
  };

  const goLatestReport = () => {
    if (!summary?.latestReport?.sessionId) {
      goInterviewHistory();
      return;
    }

    Taro.navigateTo({ url: `/pages/interview-report/index?sessionId=${summary.latestReport.sessionId}` });
  };

  const getPrimaryTask = (): TaskCardConfig => {
    if (!summary || summary.resumeCount === 0 || !summary.latestResume) {
      return {
        badgeText: '新手起步',
        badgeClassName: 'status-pill status-pill--info',
        title: '先上传一份简历，建立你的练习档案',
        description: '上传后可以查看解析结果、选择岗位，并进入完整模拟面试流程。',
        actionText: '上传简历',
        onAction: goUpload,
      };
    }

    if (summary.unfinishedInterviewCount > 0 && summary.latestInterview?.sessionId) {
      return {
        badgeText: '优先完成',
        badgeClassName: 'status-pill status-pill--warning',
        title: '继续上一场未完成面试',
        description: '从中断的位置接着答题，保持训练节奏，不丢失作答上下文。',
        actionText: '继续面试',
        onAction: continueInterview,
      };
    }

    if (summary.latestReport?.sessionId && summary.latestReport.overallScore != null) {
      return {
        badgeText: '结果可看',
        badgeClassName: 'status-pill status-pill--success',
        title: `最近一次练习拿到 ${summary.latestReport.overallScore} 分`,
        description: '回看报告里的优点、改进建议和逐题反馈，再决定下一轮练习重点。',
        actionText: '查看最近报告',
        actionClassName: 'action-chip index-page__task-action action-chip--secondary',
        onAction: goLatestReport,
      };
    }

    return {
      badgeText: '下一步',
      badgeClassName: 'status-pill status-pill--info',
      title: '最新简历已就绪，可以开始新一轮模拟面试',
      description: '先确认岗位方向，再进入答题流程，报告会自动沉淀到面试记录中。',
      actionText: '开始面试',
      onAction: goInterviewConfig,
    };
  };

  if (loading) {
    return (
      <View className="index-page page-shell">
        <Loading text="正在整理你的面试进展..." fullPage />
      </View>
    );
  }

  const currentSummary = summary ?? FALLBACK_SUMMARY;
  const primaryTask = getPrimaryTask();
  const interviewStatus = getInterviewStatusMeta(currentSummary);

  return (
    <View className="index-page page-shell">
      <View className="index-page__hero section-shell section-shell--primary">
        <View className="index-page__hero-top">
          <View>
            <Text className="index-page__eyebrow">校招模拟面试闭环</Text>
            <Text className="index-page__hero-title">把今天最该做的一步先完成</Text>
          </View>
          <View className="status-pill status-pill--info index-page__hero-badge">首页摘要</View>
        </View>
        <Text className="index-page__hero-desc">
          用一张简历串起上传、练习、报告和复盘，让每次训练都有连续反馈。
        </Text>
        <View className="index-page__hero-stats">
          <View className="stat-block">
            <Text className="stat-block__value">{currentSummary.resumeCount}</Text>
            <Text className="stat-block__label">简历数量</Text>
            <Text className="stat-block__hint">
              {currentSummary.latestResume ? `最近上传 ${formatDateTime(currentSummary.latestResume.uploadedAt)}` : '先上传一份简历'}
            </Text>
          </View>
          <View className="stat-block">
            <Text className="stat-block__value">{currentSummary.totalInterviewCount}</Text>
            <Text className="stat-block__label">练习场次</Text>
            <Text className="stat-block__hint">
              {currentSummary.unfinishedInterviewCount > 0
                ? `还有 ${currentSummary.unfinishedInterviewCount} 场待完成`
                : '当前没有未完成面试'}
            </Text>
          </View>
          <View className="stat-block">
            <Text className="stat-block__value">{currentSummary.latestReport?.overallScore ?? '--'}</Text>
            <Text className="stat-block__label">最近得分</Text>
            <Text className="stat-block__hint">
              {currentSummary.latestReport == null ? '完成练习后会自动生成' : '用于跟踪近期训练表现'}
            </Text>
          </View>
        </View>
      </View>

      {statusNote ? (
        <View className="section-shell index-page__notice">
          <Text className="index-page__notice-title">当前为离线占位视图</Text>
          <Text className="index-page__notice-text">{statusNote}</Text>
          <Button className="action-chip action-chip--secondary index-page__notice-action" onClick={loadSummary}>
            重新加载
          </Button>
        </View>
      ) : null}

      <View className="task-card task-card--primary index-page__task-card">
        <View className="index-page__task-header">
          <View className={primaryTask.badgeClassName}>{primaryTask.badgeText}</View>
          {currentSummary.latestResume && (
            <Text className="task-card__eyebrow text-truncate" style={{ maxWidth: '340rpx' }}>
              当前简历：{currentSummary.latestResume.filename}
            </Text>
          )}
        </View>
        <Text className="task-card__title">{primaryTask.title}</Text>
        <Text className="task-card__desc">{primaryTask.description}</Text>
        <View className="index-page__task-actions">
          <Button className={primaryTask.actionClassName ?? 'action-chip index-page__task-action'} onClick={primaryTask.onAction}>
            {primaryTask.actionText}
          </Button>
          {currentSummary.latestResume && (
            <Button className="action-chip action-chip--secondary index-page__task-action" onClick={goLatestResume}>
              查看最新简历
            </Button>
          )}
        </View>
      </View>

      <View className="section-shell index-page__status-section">
        <View className="index-page__section-head">
          <Text className="index-page__section-title">最近状态</Text>
          <Text className="surface-note">把最近一次上传、练习和报告放在同一屏里看清楚。</Text>
        </View>
        <View className="index-page__status-grid">
          <View className="index-page__status-card">
            <Text className="index-page__status-label">简历进度</Text>
            {currentSummary.latestResume ? (
              <>
                <Text className="index-page__status-title text-truncate">{currentSummary.latestResume.filename}</Text>
                <Text className="index-page__status-text">
                  最近上传于 {formatDateTime(currentSummary.latestResume.uploadedAt)}
                </Text>
              </>
            ) : (
              <Text className="index-page__status-text">还没有简历，上传后即可进入后续训练流程。</Text>
            )}
          </View>
          <View className="index-page__status-card">
            <Text className="index-page__status-label">面试状态</Text>
            <View className={interviewStatus.className}>{interviewStatus.label}</View>
            <Text className="index-page__status-text">{interviewStatus.text}</Text>
          </View>
          <View className="index-page__status-card">
            <Text className="index-page__status-label">结果反馈</Text>
            <Text className="index-page__status-score">{currentSummary.latestReport?.overallScore ?? '--'}</Text>
            <Text className="index-page__status-text">
              {currentSummary.latestReport == null
                ? '完成至少一场面试后，这里会展示最近一次报告分数。'
                : '建议结合报告详情和成长曲线一起复盘。'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
