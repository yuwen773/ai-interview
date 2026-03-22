import { Button, ScrollView, Text, View } from '@tarojs/components';
import { useEffect, useMemo, useState } from 'react';
import Taro from '@tarojs/taro';
import interviewApi from '../../api/interview';
import Empty from '../../components/common/Empty';
import Loading from '../../components/common/Loading';
import type { InterviewReport, QuestionEvaluation, ReferenceAnswer, ReportDimension } from '../../types/interview';
import './index.scss';

function getScoreSummary(score: number) {
  if (score >= 85) {
    return { label: '表现稳定', description: '这一轮输出比较完整，可以开始针对短板做更细的打磨。' };
  }
  if (score >= 70) {
    return { label: '基础扎实', description: '整体回答已经成型，下一步重点补足关键细节和表达层次。' };
  }
  if (score >= 60) {
    return { label: '继续强化', description: '说明你已经抓住部分重点，但还需要更结构化地组织回答。' };
  }
  return { label: '需要补强', description: '建议先围绕岗位核心问题补知识点，再回到模拟面试复练。' };
}

function getDimensionTone(score: number) {
  if (score >= 85) {
    return 'report-page__dimension-fill report-page__dimension-fill--excellent';
  }
  if (score >= 70) {
    return 'report-page__dimension-fill report-page__dimension-fill--good';
  }
  if (score >= 60) {
    return 'report-page__dimension-fill report-page__dimension-fill--steady';
  }
  return 'report-page__dimension-fill report-page__dimension-fill--weak';
}

function getQuestionTone(score: number) {
  if (score >= 85) {
    return 'status-pill status-pill--success';
  }
  if (score >= 70) {
    return 'status-pill status-pill--info';
  }
  if (score >= 60) {
    return 'status-pill status-pill--warning';
  }
  return 'status-pill status-pill--danger';
}

function buildReferenceMap(items: ReferenceAnswer[] = []) {
  return items.reduce<Record<number, ReferenceAnswer>>((acc, item) => {
    acc[item.questionIndex] = item;
    return acc;
  }, {});
}

export default function InterviewReportPage() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [errorText, setErrorText] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const sessionId = Taro.getCurrentInstance().router?.params.sessionId;

  const loadReport = async () => {
    if (!sessionId) {
      setLoading(false);
      setErrorText('缺少会话编号，暂时无法加载报告。');
      return;
    }

    try {
      setLoading(true);
      setErrorText('');
      const nextReport = await interviewApi.getReport(sessionId);
      setReport(nextReport);
      setExpandedQuestion(nextReport.questionDetails?.[0]?.questionIndex ?? null);
    } catch (error) {
      console.error('加载面试报告失败', error);
      setReport(null);
      setErrorText('报告暂时还不可用，可能还在生成中，也可能本地服务尚未启动。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, [sessionId]);

  const scoreSummary = useMemo(
    () => getScoreSummary(report?.overallScore ?? 0),
    [report?.overallScore]
  );
  const referenceMap = useMemo(
    () => buildReferenceMap(report?.referenceAnswers),
    [report?.referenceAnswers]
  );

  const handleToggleQuestion = (questionIndex: number) => {
    setExpandedQuestion((current) => (current === questionIndex ? null : questionIndex));
  };

  const handleExportPdf = async () => {
    if (!sessionId) {
      return;
    }

    try {
      const filePath = await interviewApi.exportReport(sessionId);
      await Taro.openDocument({ filePath, fileType: 'pdf' });
    } catch (error) {
      console.error('导出面试报告失败', error);
      Taro.showToast({ title: '导出失败', icon: 'none' });
    }
  };

  if (loading) {
    return (
      <View className="report-page page-shell">
        <Loading text="正在整理本场面试反馈..." />
      </View>
    );
  }

  if (!sessionId || errorText) {
    return (
      <View className="report-page page-shell">
        <Empty text={errorText || '报告不存在'} actionText="重新加载" onAction={() => void loadReport()} />
      </View>
    );
  }

  if (!report) {
    return (
      <View className="report-page page-shell">
        <Empty text="报告尚未生成完成，请稍后再试。" actionText="重新加载" onAction={() => void loadReport()} />
      </View>
    );
  }

  return (
    <View className="report-page page-shell">
      <View className="report-page__hero section-shell section-shell--primary">
        <View className="report-page__hero-top">
          <View>
            <Text className="report-page__eyebrow">面试评估报告</Text>
            <Text className="report-page__title">{report.jobLabel || '岗位模拟面试'}</Text>
          </View>
          <View className="status-pill report-page__hero-badge">{scoreSummary.label}</View>
        </View>
        <Text className="report-page__subtitle">
          共完成 {report.totalQuestions} 题，这份报告会把总分、分类结果和逐题反馈放在同一页里方便复盘。
        </Text>
        <View className="report-page__hero-body">
          <View className="report-page__score-card">
            <Text className="report-page__score-value">{report.overallScore}</Text>
            <Text className="report-page__score-max">/100</Text>
          </View>
          <View className="report-page__hero-copy">
            <Text className="report-page__hero-copy-title">本场结论</Text>
            <Text className="report-page__hero-copy-text">{scoreSummary.description}</Text>
          </View>
        </View>
      </View>

      <View className="report-page__overview-grid">
        <View className="stat-block">
          <Text className="stat-block__value">{report.totalQuestions}</Text>
          <Text className="stat-block__label">完成题数</Text>
          <Text className="stat-block__hint">逐题反馈已纳入下方详情</Text>
        </View>
        <View className="stat-block">
          <Text className="stat-block__value">{report.categoryScores?.length ?? 0}</Text>
          <Text className="stat-block__label">覆盖维度</Text>
          <Text className="stat-block__hint">按题型聚合岗位能力表现</Text>
        </View>
        <View className="stat-block">
          <Text className="stat-block__value">{report.referenceAnswers?.length ?? 0}</Text>
          <Text className="stat-block__label">参考答案</Text>
          <Text className="stat-block__hint">可直接对照自己的表达缺口</Text>
        </View>
      </View>

      <View className="section-shell report-page__section">
        <View className="report-page__section-head">
          <Text className="report-page__section-title">分类得分</Text>
          <Text className="surface-note">先用分类视角看整场表现，再进入逐题反馈。</Text>
        </View>
        <View className="report-page__dimensions">
          {report.categoryScores?.map((item: ReportDimension) => (
            <View key={item.category} className="report-page__dimension-card">
              <View className="report-page__dimension-head">
                <View>
                  <Text className="report-page__dimension-title">{item.category}</Text>
                  <Text className="report-page__dimension-meta">{item.questionCount} 题</Text>
                </View>
                <Text className="report-page__dimension-score">{item.score}</Text>
              </View>
              <View className="report-page__dimension-track">
                <View
                  className={getDimensionTone(item.score)}
                  style={{ width: `${Math.max(6, Math.min(item.score, 100))}%` }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="section-shell report-page__section">
        <View className="report-page__section-head">
          <Text className="report-page__section-title">总体评价</Text>
          <Text className="surface-note">用一段完整总结告诉你这场面试最值得保留和最该修正的地方。</Text>
        </View>
        <Text className="report-page__summary-text">{report.overallFeedback || '暂无总体评价。'}</Text>
      </View>

      <View className="report-page__two-column">
        <View className="task-card task-card--info report-page__panel">
          <Text className="report-page__panel-title">优势亮点</Text>
          {report.strengths?.length ? (
            <View className="report-page__bullet-list">
              {report.strengths.map((item, index) => (
                <View key={`${item}-${index}`} className="report-page__bullet-item">
                  <Text className="report-page__bullet-marker">+</Text>
                  <Text className="report-page__bullet-text">{item}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="report-page__placeholder">当前没有提炼出明确亮点。</Text>
          )}
        </View>

        <View className="task-card task-card--result report-page__panel">
          <Text className="report-page__panel-title">改进建议</Text>
          {report.improvements?.length ? (
            <View className="report-page__bullet-list">
              {report.improvements.map((item, index) => (
                <View key={`${item}-${index}`} className="report-page__bullet-item">
                  <Text className="report-page__bullet-marker">•</Text>
                  <Text className="report-page__bullet-text">{item}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="report-page__placeholder">当前没有额外改进建议。</Text>
          )}
        </View>
      </View>

      <View className="section-shell report-page__section">
        <View className="report-page__section-head">
          <Text className="report-page__section-title">逐题反馈</Text>
          <Text className="surface-note">展开具体题目，查看你的回答、评语和对应的参考答案。</Text>
        </View>
        {report.questionDetails?.length ? (
          <View className="report-page__question-list">
            {report.questionDetails.map((item: QuestionEvaluation) => {
              const isExpanded = expandedQuestion === item.questionIndex;
              const referenceAnswer = referenceMap[item.questionIndex];

              return (
                <View key={item.questionIndex} className="report-page__question-card">
                  <View className="report-page__question-head" onClick={() => handleToggleQuestion(item.questionIndex)}>
                    <View className="report-page__question-heading">
                      <Text className="task-card__eyebrow">第 {item.questionIndex} 题 · {item.category}</Text>
                      <Text className="report-page__question-title">{item.question}</Text>
                    </View>
                    <View className="report-page__question-head-side">
                      <View className={getQuestionTone(item.score)}>{item.score} 分</View>
                      <Text className="report-page__question-toggle">{isExpanded ? '收起' : '展开'}</Text>
                    </View>
                  </View>

                  {isExpanded ? (
                    <View className="report-page__question-body">
                      <View className="report-page__answer-panel">
                        <Text className="report-page__answer-label">我的回答</Text>
                        <Text className="report-page__answer-text">{item.userAnswer || '本题没有有效作答内容。'}</Text>
                      </View>

                      <View className="report-page__answer-panel report-page__answer-panel--feedback">
                        <Text className="report-page__answer-label">面试官反馈</Text>
                        <Text className="report-page__answer-text">{item.feedback || '暂无逐题反馈。'}</Text>
                      </View>

                      <View className="report-page__answer-panel">
                        <Text className="report-page__answer-label">参考答案</Text>
                        <Text className="report-page__answer-text">
                          {referenceAnswer?.referenceAnswer || '当前没有可展示的参考答案。'}
                        </Text>
                        {referenceAnswer?.keyPoints?.length ? (
                          <View className="report-page__key-points">
                            {referenceAnswer.keyPoints.map((point, index) => (
                              <View key={`${point}-${index}`} className="report-page__key-point">
                                <Text className="report-page__key-point-index">{index + 1}</Text>
                                <Text className="report-page__key-point-text">{point}</Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : (
          <Text className="report-page__placeholder">逐题反馈生成后会展示在这里。</Text>
        )}
      </View>

      <View className="section-shell report-page__section">
        <View className="report-page__section-head">
          <Text className="report-page__section-title">参考答案总览</Text>
          <Text className="surface-note">如果只想快速复盘标准表达，可以直接浏览这一组参考答案。</Text>
        </View>
        {report.referenceAnswers?.length ? (
          <View className="report-page__reference-list">
            {report.referenceAnswers.map((item, index) => (
              <View key={`${item.questionIndex}-${index}`} className="task-card task-card--info report-page__reference-card">
                <Text className="task-card__eyebrow">第 {item.questionIndex} 题 · 参考表达</Text>
                <Text className="report-page__reference-question">{item.question}</Text>
                <Text className="task-card__desc">{item.referenceAnswer}</Text>
                {item.keyPoints?.length ? (
                  <View className="report-page__reference-tags">
                    {item.keyPoints.map((point, pointIndex) => (
                      <View key={`${point}-${pointIndex}`} className="status-pill status-pill--info report-page__reference-tag">
                        {point}
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <Text className="report-page__placeholder">当前没有可展示的参考答案。</Text>
        )}
      </View>

      <View className="report-page__actions">
        <Button className="action-chip report-page__action" onClick={handleExportPdf}>
          导出 PDF 报告
        </Button>
        <Button
          className="action-chip action-chip--secondary report-page__action"
          onClick={() => Taro.navigateBack({ delta: 1 })}
        >
          返回上一页
        </Button>
      </View>
    </View>
  );
}
