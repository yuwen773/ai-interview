import { Button, Text, View } from '@tarojs/components';
import { useEffect, useMemo, useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { historyApi, type InterviewItem, type ResumeDetail } from '../../api/history';
import Loading from '../../components/common/Loading';
import Empty from '../../components/common/Empty';
import { isInterviewOngoing } from '../../utils/interviewSession';
import './index.scss';

interface Suggestion {
  category?: string;
  priority?: string;
  issue: string;
  recommendation: string;
}

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

function getAnalyzeStatusMeta(status?: ResumeDetail['analyzeStatus'], error?: string | null) {
  switch (status) {
    case 'PENDING':
      return {
        label: '等待分析',
        className: 'status-pill status-pill--info',
        description: '简历已入队，系统正在准备分析任务。',
      };
    case 'PROCESSING':
      return {
        label: '分析中',
        className: 'status-pill status-pill--warning',
        description: '正在解析内容与生成建议，页面会自动刷新。',
      };
    case 'FAILED':
      return {
        label: '分析失败',
        className: 'status-pill status-pill--danger',
        description: error || '本次分析未完成，可以稍后重新发起。',
      };
    case 'COMPLETED':
      return {
        label: '已完成分析',
        className: 'status-pill status-pill--success',
        description: '当前简历已可直接进入岗位配置和模拟面试。',
      };
    default:
      return {
        label: '待处理',
        className: 'status-pill status-pill--info',
        description: '进入详情后会显示更完整的处理结果。',
      };
  }
}

function normalizeSuggestions(items: unknown[] = []): Suggestion[] {
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Record<string, unknown>;

      // 如果已经是正确的结构
      if (typeof record.issue === 'string' && typeof record.recommendation === 'string') {
        return {
          category: typeof record.category === 'string' ? record.category : undefined,
          priority: typeof record.priority === 'string' ? record.priority : undefined,
          issue: record.issue,
          recommendation: record.recommendation,
        } satisfies Suggestion;
      }

      // 兼容旧的结构或尝试拼凑
      const issue =
        (record.title as string) ||
        (record.dimension as string) ||
        (record.issue as string) ||
        '发现一个问题';
      const recommendation =
        (record.suggestion as string) || (record.description as string) || (record.recommendation as string) || '';

      if (issue && recommendation) {
        return {
          issue,
          recommendation,
        } satisfies Suggestion;
      }

      return null;
    })
    .filter((item): item is Suggestion => item !== null);
}

function normalizeInterviews(items: unknown[] = []): InterviewItem[] {
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Record<string, unknown>;
      return {
        id: Number(record.id ?? 0),
        sessionId: String(record.sessionId ?? ''),
        jobRole: record.jobRole as InterviewItem['jobRole'],
        jobLabel: typeof record.jobLabel === 'string' ? record.jobLabel : undefined,
        totalQuestions: Number(record.totalQuestions ?? 0),
        status: String(record.status ?? ''),
        evaluateStatus: record.evaluateStatus as InterviewItem['evaluateStatus'],
        evaluateError: typeof record.evaluateError === 'string' ? record.evaluateError : undefined,
        overallScore: typeof record.overallScore === 'number' ? record.overallScore : null,
        overallFeedback: null,
        createdAt: String(record.createdAt ?? ''),
        completedAt: typeof record.completedAt === 'string' ? record.completedAt : null,
      } satisfies InterviewItem;
    })
    .filter((item): item is InterviewItem => Boolean(item?.sessionId));
}

export default function ResumeDetailPage() {
  const router = useRouter();
  const resumeId = router.params.id;
  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState<ResumeDetail | null>(null);

  const latestAnalysis = useMemo(() => resume?.analyses?.[0] ?? null, [resume]);
  const suggestions = useMemo(
    () => normalizeSuggestions(latestAnalysis?.suggestions),
    [latestAnalysis?.suggestions]
  );
  const interviews = useMemo(() => normalizeInterviews(resume?.interviews), [resume?.interviews]);
  const statusMeta = getAnalyzeStatusMeta(resume?.analyzeStatus, resume?.analyzeError);

  const loadResume = async (isPolling = false) => {
    if (!resumeId) {
      setLoading(false);
      return;
    }

    try {
      if (!isPolling) {
        setLoading(true);
      }
      const data = await historyApi.getResumeDetail(Number(resumeId));
      setResume(data);
    } catch (error) {
      console.error('加载简历详情失败', error);
      if (!isPolling) {
        Taro.showToast({ title: '加载详情失败', icon: 'none' });
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadResume();
  }, [resumeId]);

  useEffect(() => {
    if (resume?.analyzeStatus !== 'PENDING' && resume?.analyzeStatus !== 'PROCESSING') {
      return undefined;
    }

    const timer = setInterval(() => {
      void loadResume(true);
    }, 3000);

    return () => clearInterval(timer);
  }, [resume?.analyzeStatus, resumeId]);

  const handleStartInterview = () => {
    if (!resumeId) {
      return;
    }

    if (resume?.analyzeStatus !== 'COMPLETED') {
      Taro.showToast({ title: '请先等待分析完成', icon: 'none' });
      return;
    }

    Taro.setStorageSync('currentResumeId', String(resumeId));
    Taro.navigateTo({ url: `/pages/interview-config/index?resumeId=${resumeId}` });
  };

  const handleReanalyze = async () => {
    if (!resumeId) {
      return;
    }

    try {
      await historyApi.reanalyze(Number(resumeId));
      Taro.showToast({ title: '已重新发起分析', icon: 'success' });
      void loadResume();
    } catch (error) {
      console.error('重新分析失败', error);
      Taro.showToast({ title: '重新分析失败', icon: 'none' });
    }
  };

  const handleExport = async () => {
    if (!resumeId) {
      return;
    }

    try {
      const filePath = await historyApi.exportAnalysisPdf(Number(resumeId));
      await Taro.openDocument({ filePath, fileType: 'pdf' });
    } catch (error) {
      console.error('导出 PDF 失败', error);
      Taro.showToast({ title: '导出失败', icon: 'none' });
    }
  };

  const handleOpenGrowthCurve = () => {
    if (!resumeId) {
      return;
    }

    Taro.navigateTo({ url: `/pages/growth-curve/index?resumeId=${resumeId}` });
  };

  const handleOpenInterview = (item: InterviewItem) => {
    const target = isInterviewOngoing(item)
      ? `/pages/interview/index?sessionId=${item.sessionId}`
      : `/pages/interview-report/index?sessionId=${item.sessionId}`;
    Taro.navigateTo({ url: target });
  };

  if (loading) {
    return (
      <View className="resume-detail-page page-shell">
        <Loading text="正在加载简历详情..." fullPage />
      </View>
    );
  }

  if (!resume || !resumeId) {
    return (
      <View className="resume-detail-page page-shell">
        <Empty
          text="没有找到这份简历。你可以返回简历库重新选择，或先上传新的简历。"
          actionText="返回简历库"
          onAction={() => Taro.switchTab({ url: '/pages/resume-list/index' })}
        />
      </View>
    );
  }

  return (
    <View className="resume-detail-page page-shell">
      <View className="resume-detail-page__hero section-shell section-shell--primary">
        <View className="resume-detail-page__hero-top">
          <View>
            <Text className="resume-detail-page__eyebrow">简历详情</Text>
            <Text className="resume-detail-page__title">{resume.filename}</Text>
          </View>
          <View className={statusMeta.className}>{statusMeta.label}</View>
        </View>
        <Text className="resume-detail-page__desc">{statusMeta.description}</Text>
        <View className="resume-detail-page__hero-stats">
          <View className="stat-block stat-block--highlight">
            <View className="stat-block__main">
              <Text className="stat-block__value">{latestAnalysis?.overallScore ?? '--'}</Text>
              <Text className="stat-block__label">综合得分</Text>
            </View>
            <Text className="stat-block__hint">
              {latestAnalysis
                ? `最近分析于 ${formatDateTime(latestAnalysis.analyzedAt)}`
                : '等待首次分析完成'}
            </Text>
          </View>
          <View className="stat-block">
            <View className="stat-block__main">
              <Text className="stat-block__value">{interviews.length}</Text>
              <Text className="stat-block__label">关联面试</Text>
            </View>
            <Text className="stat-block__hint">从同一份简历继续进入练习</Text>
          </View>
          <View className="stat-block">
            <View className="stat-block__main">
              <Text className="stat-block__value">{resume.accessCount ?? 0}</Text>
              <Text className="stat-block__label">详情浏览</Text>
            </View>
            <Text className="stat-block__hint">上传时间 {formatDateTime(resume.uploadedAt)}</Text>
          </View>
        </View>
      </View>

      <View className="section-shell resume-detail-page__section">
        <View className="resume-detail-page__section-head">
          <Text className="resume-detail-page__section-title">分析摘要</Text>
          <Text className="surface-note">先看整体判断，再决定是否重新分析或直接进入面试。</Text>
        </View>
        <Text className="resume-detail-page__summary">
          {latestAnalysis?.summary ||
            (resume.analyzeStatus === 'FAILED'
              ? resume.analyzeError || '本次分析未成功完成。'
              : '分析结果生成后会显示在这里。')}
        </Text>
      </View>

      <View className="section-shell resume-detail-page__section">
        <View className="resume-detail-page__section-head">
          <Text className="resume-detail-page__section-title">维度得分</Text>
          <Text className="surface-note">把当前简历的优势和短板拆到更具体的维度里看。</Text>
        </View>
        {latestAnalysis ? (
          <View className="resume-detail-page__scores">
            {[
              ['内容质量', latestAnalysis.contentScore],
              ['结构规范', latestAnalysis.structureScore],
              ['技能匹配', latestAnalysis.skillMatchScore],
              ['项目经验', latestAnalysis.projectScore],
              ['表达呈现', latestAnalysis.expressionScore],
            ].map(([label, score]) => (
              <View key={label} className="resume-detail-page__score-row">
                <View className="resume-detail-page__score-head">
                  <Text className="resume-detail-page__score-label">{label}</Text>
                  <Text className="resume-detail-page__score-value">{score}</Text>
                </View>
                <View className="resume-detail-page__score-track">
                  <View
                    className="resume-detail-page__score-fill"
                    style={{ width: `${Math.max(0, Math.min(Number(score), 100))}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text className="resume-detail-page__placeholder">分析完成后会展示具体维度得分。</Text>
        )}
      </View>

      <View className="resume-detail-page__analysis-sections">
        <View className="section-shell resume-detail-page__section">
          <View className="resume-detail-page__section-head">
            <Text className="resume-detail-page__section-title">亮点总结</Text>
          </View>
          {latestAnalysis?.strengths?.length ? (
            <View className="resume-detail-page__list">
              {latestAnalysis.strengths.map((item, index) => (
                <View
                  key={`${item}-${index}`}
                  className="resume-detail-page__list-item resume-detail-page__strength-item"
                >
                  <Text className="resume-detail-page__strength-marker">✓</Text>
                  <Text className="resume-detail-page__strength-text">{item}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="resume-detail-page__placeholder">分析完成后会总结简历亮点。</Text>
          )}
        </View>

        <View className="section-shell resume-detail-page__section">
          <View className="resume-detail-page__section-head">
            <Text className="resume-detail-page__section-title">改进建议</Text>
          </View>
          {suggestions.length ? (
            <View className="resume-detail-page__list">
              {suggestions.map((item, index) => (
                <View
                  key={`${item.issue}-${index}`}
                  className="resume-detail-page__list-item resume-detail-page__suggestion-item"
                >
                  <View className="resume-detail-page__suggestion-meta">
                    {item.category && <Text className="status-pill status-pill--info">{item.category}</Text>}
                    {item.priority && (
                      <Text
                        className={`status-pill ${
                          item.priority === '高'
                            ? 'status-pill--danger'
                            : item.priority === '中'
                            ? 'status-pill--warning'
                            : 'status-pill--info'
                        }`}
                      >
                        {item.priority}
                      </Text>
                    )}
                  </View>
                  <View className="resume-detail-page__suggestion-content">
                    <Text className="resume-detail-page__suggestion-issue">{item.issue}</Text>
                    <Text className="resume-detail-page__suggestion-recommendation">
                      {item.recommendation}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="resume-detail-page__placeholder">
              暂无额外建议，可继续通过面试结果反向优化。
            </Text>
          )}
        </View>
      </View>

      <View className="section-shell resume-detail-page__section">
        <View className="resume-detail-page__section-head">
          <Text className="resume-detail-page__section-title">关联面试记录</Text>
          <Text className="surface-note">从这里继续未完成面试，或直接打开最近报告。</Text>
        </View>
        {interviews.length ? (
          <View className="resume-detail-page__interview-list">
            {interviews.map((item) => {
              const isOngoing = isInterviewOngoing(item);
              return (
                <View key={item.sessionId} className="task-card task-card--info resume-detail-page__interview-card">
                  <View className="resume-detail-page__interview-head">
                    <View>
                      <Text className="task-card__eyebrow">创建于 {formatDateTime(item.createdAt)}</Text>
                      <Text className="resume-detail-page__interview-title">
                        {item.jobLabel || '岗位面试'}
                      </Text>
                    </View>
                    <View className={isOngoing ? 'status-pill status-pill--warning' : 'status-pill status-pill--success'}>
                      {isOngoing ? '进行中' : '已完成'}
                    </View>
                  </View>
                  <Text className="task-card__desc">
                    共 {item.totalQuestions} 题
                    {item.overallScore != null ? ` · 最近得分 ${item.overallScore}` : ''}
                    {item.completedAt ? ` · 完成于 ${formatDateTime(item.completedAt)}` : ''}
                  </Text>
                  <Button
                    className="action-chip action-chip--secondary resume-detail-page__interview-action"
                    onClick={() => handleOpenInterview(item)}
                  >
                    {isOngoing ? '继续面试' : '查看报告'}
                  </Button>
                </View>
              );
            })}
          </View>
        ) : (
          <Text className="resume-detail-page__placeholder">这份简历还没有关联面试，分析完成后可以直接开始第一场训练。</Text>
        )}
      </View>

      <View className="resume-detail-page__actions">
        <Button className="action-chip resume-detail-page__action" onClick={handleStartInterview}>
          开始面试
        </Button>
        <Button
          className="action-chip action-chip--secondary resume-detail-page__action"
          onClick={handleReanalyze}
        >
          重新分析
        </Button>
        <Button
          className="action-chip action-chip--secondary resume-detail-page__action"
          onClick={handleExport}
        >
          导出 PDF
        </Button>
        <Button
          className="action-chip action-chip--secondary resume-detail-page__action"
          onClick={handleOpenGrowthCurve}
        >
          查看成长曲线
        </Button>
      </View>
    </View>
  );
}
