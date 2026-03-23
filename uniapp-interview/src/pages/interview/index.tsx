import { View, Text, Button, Textarea } from '@tarojs/components';
import { useEffect, useState, useRef } from 'react';
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
  const [progress, setProgress] = useState({ current: 0, total: 5 });
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editable, setEditable] = useState(true);  // 是否可编辑答案

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

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
    const currentQ = session.questions?.[session.currentQuestionIndex] ?? null;
    setSessionId(session.sessionId);
    setJobLabel(session.jobLabel);
    setQuestions(session.questions || []);
    setCurrentQuestionIndex(session.currentQuestionIndex);
    setQuestion(currentQ);
    setAnswer(currentQ?.userAnswer || '');
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
    if (!question || !answer.trim()) {
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
      // 更新本地 questions 状态
      setQuestions(prev => prev.map((q, i) =>
        i === currentQuestionIndex ? { ...q, userAnswer: answer } : q
      ));
      Taro.showToast({ title: '已暂存当前答案', icon: 'success' });
    } catch (error) {
      console.error('暂存答案失败:', error);
      Taro.showToast({ title: '暂存失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteEarly = async () => {
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
      if (answer.trim()) {
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
      const res = await interviewApi.submitAnswer({
        sessionId,
        answer,
        questionIndex: question.questionIndex,
      });

      // 更新 questions 中该题的 userAnswer
      setQuestions(prev => prev.map((q, i) =>
        i === currentQuestionIndex ? { ...q, userAnswer: answer } : q
      ));

      if (!res.hasNextQuestion || !res.nextQuestion) {
        Taro.navigateTo({ url: `/pages/interview-report/index?sessionId=${sessionId}` });
        return;
      }

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

  // 答题卡数据派生
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
      questionIndex: index,
      displayIndex: index + 1,
      status,
      question: q.question,
      savedAnswer: q.userAnswer || undefined,
    };
  });

  // 跳转到指定题目
  const handleJumpToQuestion = (questionIndex: number) => {
    const targetQuestion = questions[questionIndex];
    if (!targetQuestion) return;

    // 已答过的题目不可编辑，暂存的可编辑
    const isEditable = !targetQuestion.userAnswer;

    setCurrentQuestionIndex(questionIndex);
    setQuestion(targetQuestion);
    setAnswer(targetQuestion.userAnswer || '');
    setEditable(isEditable);
    setProgress({
      current: questionIndex + 1,
      total: progress.total,
    });
    setDrawerVisible(false);
    Taro.showToast({ title: `跳转到 Q${questionIndex + 1}`, icon: 'none' });
  };

  // 手势处理：从右向左滑打开抽屉
  const handleTouchStart = (e: any) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: any) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < Math.abs(deltaX)) {
      if (deltaX < 0) {
        setDrawerVisible(true);
      }
    }
  };

  if (loading && !question) {
    return <Loading text="准备面试中..." fullPage />;
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
    <View
      className="interview-page page-shell"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <View className="interview-page__content">
        <View className="progress section-shell">
          <View className="progress__top">
            <Text className="job-label">{jobLabel || '模拟面试'}</Text>
            <View className="status-pill">第 {progress.current} 题</View>
          </View>
          <Text className="progress__subtitle">
            {resumeName || (resumeId ? `简历 #${resumeId}` : '当前简历')} · 共 {progress.total} 题
          </Text>
          <View className="progress__meta">
            <View className="stat-block">
              <Text className="stat-block__value">{progress.current}</Text>
              <Text className="stat-block__label">当前进度</Text>
            </View>
            <View className="stat-block">
              <Text className="stat-block__value">{Math.max(progress.total - progress.current, 0)}</Text>
              <Text className="stat-block__label">剩余题数</Text>
            </View>
          </View>
          <View className="progress-bar">
            <View className="progress-fill" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
          </View>
        </View>

        <View className="question-card section-shell">
          <View className="question-card__header">
            <Text className="question-card__label">当前问题</Text>
            <Text className="question-badge">{question?.category || '待回答'}</Text>
          </View>
          <Text className="question-card__content">{question?.question || ''}</Text>
        </View>

        <View className="drawer-trigger" onClick={() => setDrawerVisible(true)}>
          <Text>答题卡</Text>
          <Text className="drawer-trigger__hint">点击查看全部题目</Text>
        </View>

        <View className="answer-area section-shell">
          <Text className="answer-area__label">当前作答</Text>
          <Textarea
            className="answer-input"
            value={answer}
            onInput={(e) => editable && setAnswer(e.detail.value)}
            placeholder={editable ? "请输入你的答案..." : "已答题目，不可修改"}
            disabled={!editable}
          />
          <Text className="answer-count">{answer.trim().length} / 2000</Text>
        </View>

        <View className="actions">
          <View className="actions__secondary">
            <Button className="action-chip action-chip--secondary" onClick={handleSaveDraft} disabled={!editable || !answer.trim() || loading}>
              暂存答案
            </Button>
            <Button className="action-chip action-chip--secondary" onClick={handleCompleteEarly} disabled={loading}>
              提前结束
            </Button>
          </View>
          <Button className="submit-btn" onClick={handleSubmitAnswer} disabled={!editable || loading || !answer.trim()}>
            {loading ? '提交中...' : '提交答案'}
          </Button>
        </View>
      </View>

      <AnswerCardDrawer
        visible={drawerVisible}
        items={answerCards}
        currentIndex={currentQuestionIndex}
        onClose={() => setDrawerVisible(false)}
        onJump={handleJumpToQuestion}
      />
    </View>
  );
}
