import { View, Text, Button, Textarea, ScrollView } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { interviewApi } from '../../api/interview';
import { resumeApi } from '../../api/resume';
import Loading from '../../components/common/Loading';
import Empty from '../../components/common/Empty';
import AnswerCardDrawer from '../../components/interview/AnswerCardDrawer';
import type { InterviewSession, JobRole, Question, AnswerCardItem, AnswerCardStatus } from '../../types/interview';
import './index.scss';

export default function Interview() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [resumeId, setResumeId] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [jobLabel, setJobLabel] = useState('');
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 5 });
  const canSaveDraft = Boolean(sessionId && question && answer.trim());
  const canCompleteEarly = Boolean(sessionId && !loading);

  // 注意：currentQuestionIndex 是 0-based
  const answerCards: AnswerCardItem[] = questions.map((q, index) => {
    let status: AnswerCardStatus;
    if (index < currentQuestionIndex) {
      status = 'answered';
    } else if (index === currentQuestionIndex) {
      status = q.userAnswer ? 'answered' : 'unanswered';
    } else {
      status = 'unanswered';
    }

    return {
      questionIndex: index,           // 0-based，API 用
      displayIndex: index + 1,       // 1-based，显示用
      status,
      question: q.question,
      savedAnswer: q.userAnswer || undefined,
    };
  });

  const handleSaveAnswer = async (questionIndex: number, answer: string) => {
    // questionIndex 是 0-based
    try {
      await interviewApi.saveAnswer({
        sessionId,
        answer,
        questionIndex,
      });
      // 更新本地 questions 状态
      setQuestions(prev => prev.map((q, i) =>
        i === questionIndex ? { ...q, userAnswer: answer } : q
      ));
      Taro.showToast({ title: '已保存', icon: 'success' });
    } catch (error) {
      Taro.showToast({ title: '保存失败', icon: 'none' });
    }
  };

  useEffect(() => {
    const params = router.params || {};
    const currentResumeId = params.resumeId || Taro.getStorageSync('currentResumeId');
    const sessionIdParam = params.sessionId;
    const jobRole = (params.jobRole || Taro.getStorageSync('currentInterviewJobRole')) as JobRole | '';
    const forceCreate = params.forceCreate === 'true';

    if (currentResumeId) {
      setResumeId(String(currentResumeId));
    }

    if (sessionIdParam) {
      void restoreSession(sessionIdParam);
      return;
    }

    if (!currentResumeId) {
      return;
    }

    if (!jobRole) {
      Taro.navigateTo({ url: `/pages/interview-config/index?resumeId=${currentResumeId}` });
      return;
    }

    void createSession(String(currentResumeId), jobRole, forceCreate);
  }, [router.params]);

  const applySession = (session: InterviewSession) => {
    const currentQuestion = session.questions?.[session.currentQuestionIndex] ?? null;
    setSessionId(session.sessionId);
    setJobLabel(session.jobLabel);
    setQuestions(session.questions || []);
    setCurrentQuestionIndex(session.currentQuestionIndex ?? 0);
    setQuestion(currentQuestion);
    setAnswer(currentQuestion?.userAnswer || '');
    setProgress({
      current: Math.min(session.currentQuestionIndex + 1, session.totalQuestions),
      total: session.totalQuestions || 5,
    });
  };

  const restoreSession = async (currentSessionId: string) => {
    setLoading(true);
    try {
      const session = await interviewApi.getSession(currentSessionId);
      Taro.setStorageSync('currentInterviewJobRole', session.jobRole);
      const storedResumeId = Taro.getStorageSync('currentResumeId');
      if (storedResumeId) {
        setResumeId(String(storedResumeId));
      }
      applySession(session);
    } catch (error) {
      console.error('恢复面试失败:', error);
      Taro.showToast({ title: '恢复面试失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (resumeId: string, jobRole: JobRole, forceCreate = false) => {
    setLoading(true);
    try {
      const resumeDetail = await resumeApi.getDetail(resumeId);
      const resumeText = resumeDetail.resumeText;
      setResumeName(resumeDetail.filename || '');

      if (!resumeText) {
        Taro.showToast({ title: '简历内容为空', icon: 'none' });
        return;
      }

      const session = await interviewApi.createSession({
        resumeId: Number(resumeId),
        resumeText,
        questionCount: 5,
        jobRole,
        forceCreate,
      });

      Taro.setStorageSync('currentResumeId', resumeId);
      Taro.setStorageSync('currentInterviewJobRole', session.jobRole);
      applySession(session);
    } catch (error) {
      console.error('创建面试失败:', error);
      Taro.showToast({ title: '创建面试失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!question || !canSaveDraft) {
      Taro.showToast({ title: '先输入当前答案再暂存', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      await interviewApi.saveAnswer({
        sessionId,
        answer,
        questionIndex: question.questionIndex,
      });
      Taro.showToast({ title: '已暂存当前答案', icon: 'success' });
    } catch (error) {
      console.error('暂存答案失败:', error);
      Taro.showToast({ title: '暂存失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteEarly = async () => {
    if (!canCompleteEarly) {
      return;
    }

    const result = await Taro.showModal({
      title: '提前结束面试',
      content: '当前会话会立即进入评估流程，未回答的问题将不再继续。确认现在结束吗？',
      confirmText: '确认结束',
      confirmColor: '#ea580c',
    });

    if (!result.confirm) {
      return;
    }

    setLoading(true);
    try {
      if (canSaveDraft) {
        await interviewApi.saveAnswer({
          sessionId,
          answer,
          questionIndex: question!.questionIndex,
        });
      }
      await interviewApi.completeInterview(sessionId);
      Taro.showToast({ title: '已提交评估', icon: 'success' });
      Taro.navigateTo({ url: `/pages/interview-report/index?sessionId=${sessionId}` });
    } catch (error) {
      console.error('提前交卷失败:', error);
      Taro.showToast({ title: '提前结束失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !question) {
      Taro.showToast({ title: '请输入答案', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      const currentAnswer = answer;

      const res = await interviewApi.submitAnswer({
        sessionId,
        answer: currentAnswer,
        questionIndex: question.questionIndex,
      });

      if (!res.hasNextQuestion || !res.nextQuestion) {
        Taro.navigateTo({ url: `/pages/interview-report/index?sessionId=${sessionId}` });
        return;
      }

      // Update local questions state
      setQuestions(prev => prev.map((q, i) =>
        i === currentQuestionIndex ? { ...q, userAnswer: currentAnswer } : q
      ));
      setQuestion(res.nextQuestion);
      setCurrentQuestionIndex(res.currentIndex);
      setProgress({ current: res.currentIndex + 1, total: res.totalQuestions || 5 });
      setAnswer('');
    } catch (error) {
      console.error('提交答案失败:', error);
      Taro.showToast({ title: '提交失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !question) {
    return <Loading text="准备面试中..." />;
  }

  if (!question && !sessionId) {
    return (
      <Empty
        text="请先从岗位选择页开始面试"
        actionText="选择岗位"
        onAction={() => Taro.switchTab({ url: '/pages/index/index' })}
      />
    );
  }

  return (
    <View className="interview-page page-shell">
      <View className="interview-page__hero section-shell section-shell--primary">
        <View className="interview-page__hero-top">
          <View>
            <Text className="interview-page__eyebrow">正在面试</Text>
            <Text className="interview-page__title">{jobLabel || '模拟面试'}</Text>
          </View>
          <View className="status-pill status-pill--info">第 {progress.current} 题</View>
        </View>
        <Text className="interview-page__subtitle">
          {resumeName || (resumeId ? `简历 #${resumeId}` : '当前简历')}
          {' · '}
          共 {progress.total} 题，本页支持暂存答案后稍后继续，也可以直接提前结束进入报告。
        </Text>
        <View className="interview-page__progress-meta">
          <View className="stat-block">
            <Text className="stat-block__value">{progress.current}</Text>
            <Text className="stat-block__label">当前进度</Text>
            <Text className="stat-block__hint">按题号推进</Text>
          </View>
          <View className="stat-block">
            <Text className="stat-block__value">{Math.max(progress.total - progress.current, 0)}</Text>
            <Text className="stat-block__label">剩余题数</Text>
            <Text className="stat-block__hint">可提前结束进入评估</Text>
          </View>
        </View>
        <View className="interview-page__progress-bar">
          <View
            className="interview-page__progress-fill"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </View>
      </View>

      <View className="section-shell interview-page__question-card">
        <View className="interview-page__section-head">
          <Text className="interview-page__section-title">当前问题</Text>
          <Text className="interview-page__question-badge">{question?.category || '待回答'}</Text>
        </View>
        <Text className="interview-page__question-content">{question?.question || ''}</Text>
      </View>

      <View className="interview-page__drawer-trigger" onClick={() => setDrawerVisible(true)}>
        <Text>答题卡</Text>
        <Text className="interview-page__drawer-hint">点击查看全部题目</Text>
      </View>

      <View className="section-shell interview-page__answer-area">
        <View className="interview-page__section-head">
          <Text className="interview-page__section-title">当前作答</Text>
          <Text className="surface-note">先组织当前答案，再决定暂存还是直接提交进入下一题。</Text>
        </View>
        <Textarea
          className="interview-page__answer-input"
          value={answer}
          onInput={(e) => setAnswer(e.detail.value)}
          placeholder="请输入你的答案..."
          maxLength={2000}
        />
        <Text className="interview-page__answer-count">{answer.trim().length} / 2000</Text>
      </View>

      <View className="interview-page__actions">
        <Button
          className="action-chip action-chip--secondary interview-page__secondary-action"
          onClick={handleSaveDraft}
          disabled={!canSaveDraft || loading}
        >
          <Text>暂存答案</Text>
        </Button>
        <Button
          className="action-chip action-chip--secondary interview-page__secondary-action"
          onClick={handleCompleteEarly}
          disabled={!canCompleteEarly}
        >
          <Text>提前结束</Text>
        </Button>
        <Button
          className="interview-page__submit-btn"
          onClick={handleSubmitAnswer}
          disabled={loading || !answer.trim()}
        >
          {loading ? '提交中...' : '提交答案'}
        </Button>
      </View>

      <AnswerCardDrawer
        visible={drawerVisible}
        items={answerCards}
        currentIndex={currentQuestionIndex}
        onClose={() => setDrawerVisible(false)}
        onSaveAnswer={handleSaveAnswer}
      />
    </View>
  );
}
