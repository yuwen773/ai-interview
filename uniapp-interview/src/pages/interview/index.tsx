import { View, Text, Button, Textarea } from '@tarojs/components';
import { useEffect, useMemo, useRef, useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { interviewApi } from '../../api/interview';
import { resumeApi } from '../../api/resume';
import Loading from '../../components/common/Loading';
import Empty from '../../components/common/Empty';
import AnswerCardDrawer from '../../components/interview/AnswerCardDrawer';
import type { InterviewSession, JobRole, Question, AnswerCardItem, AnswerCardStatus } from '../../types/interview';
import './index.scss';

type ViewMode = 'active' | 'history-readonly' | 'history-editable';

export default function Interview() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [resumeId, setResumeId] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [jobLabel, setJobLabel] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [viewingQuestionIndex, setViewingQuestionIndex] = useState(0);
  const [progress, setProgress] = useState({ current: 0, total: 5 });
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [answerDrafts, setAnswerDrafts] = useState<Record<number, string>>({});
  const [savedQuestionIndexes, setSavedQuestionIndexes] = useState<number[]>([]);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const viewingQuestion = questions[viewingQuestionIndex] ?? null;

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

  const buildInitialDrafts = (sessionQuestions: Question[]) => {
    return sessionQuestions.reduce<Record<number, string>>((drafts, item, index) => {
      if (item.userAnswer?.trim()) {
        drafts[index] = item.userAnswer;
      }
      return drafts;
    }, {});
  };

  const buildInitialSavedIndexes = (session: InterviewSession) => {
    const current = session.currentQuestionIndex;
    const currentQuestion = session.questions?.[current];

    if (currentQuestion?.userAnswer?.trim()) {
      return [current];
    }

    return [];
  };

  const applySession = (session: InterviewSession) => {
    const safeIndex = Math.min(session.currentQuestionIndex, Math.max(session.questions.length - 1, 0));

    setSessionId(session.sessionId);
    setJobLabel(session.jobLabel);
    setQuestions(session.questions || []);
    setActiveQuestionIndex(session.currentQuestionIndex);
    setViewingQuestionIndex(safeIndex);
    setAnswerDrafts(buildInitialDrafts(session.questions || []));
    setSavedQuestionIndexes(buildInitialSavedIndexes(session));
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

  const createSession = async (currentResumeId: string, jobRole: JobRole, forceCreate = false) => {
    setLoading(true);
    try {
      const resumeDetail = await resumeApi.getDetail(currentResumeId);
      const resumeText = resumeDetail.resumeText;
      setResumeName(resumeDetail.filename || '');

      if (!resumeText) {
        Taro.showToast({ title: '简历内容为空', icon: 'none' });
        return;
      }

      const session = await interviewApi.createSession({
        resumeId: Number(currentResumeId),
        resumeText,
        questionCount: 5,
        jobRole,
        forceCreate,
      });

      Taro.setStorageSync('currentResumeId', currentResumeId);
      Taro.setStorageSync('currentInterviewJobRole', session.jobRole);
      applySession(session);
    } catch (error) {
      console.error('创建面试失败:', error);
      Taro.showToast({ title: '创建面试失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const updateDraft = (questionIndex: number, nextAnswer: string) => {
    setAnswerDrafts(prev => ({
      ...prev,
      [questionIndex]: nextAnswer,
    }));
  };

  const updateQuestionAnswer = (questionIndex: number, nextAnswer: string) => {
    setQuestions(prev => prev.map((item, index) => (
      index === questionIndex ? { ...item, userAnswer: nextAnswer } : item
    )));
    updateDraft(questionIndex, nextAnswer);
  };

  const markQuestionSaved = (questionIndex: number) => {
    setSavedQuestionIndexes(prev => (
      prev.includes(questionIndex) ? prev : [...prev, questionIndex]
    ));
  };

  const markQuestionSubmitted = (questionIndex: number) => {
    setSavedQuestionIndexes(prev => prev.filter(index => index !== questionIndex));
  };

  const getQuestionStatus = (questionIndex: number, targetQuestion: Question | undefined): AnswerCardStatus => {
    const hasAnswer = Boolean(targetQuestion?.userAnswer?.trim());

    if (savedQuestionIndexes.includes(questionIndex)) {
      return 'saved';
    }

    if (questionIndex < activeQuestionIndex) {
      return hasAnswer ? 'answered' : 'unanswered';
    }

    if (questionIndex === activeQuestionIndex) {
      return hasAnswer ? 'saved' : 'unanswered';
    }

    return 'unanswered';
  };

  const currentAnswer = viewingQuestion ? (answerDrafts[viewingQuestionIndex] ?? viewingQuestion.userAnswer ?? '') : '';
  const viewingStatus = viewingQuestion ? getQuestionStatus(viewingQuestionIndex, viewingQuestion) : 'unanswered';

  const viewMode: ViewMode = useMemo(() => {
    if (viewingQuestionIndex === activeQuestionIndex) {
      return 'active';
    }

    return viewingStatus === 'saved' ? 'history-editable' : 'history-readonly';
  }, [activeQuestionIndex, viewingQuestionIndex, viewingStatus]);

  const isAnswerEditable = viewMode === 'active' || viewMode === 'history-editable';

  const confirmAction = async (title: string, content: string, confirmText: string) => {
    const result = await Taro.showModal({
      title,
      content,
      confirmText,
      confirmColor: '#2563eb',
    });

    return result.confirm;
  };

  const persistDraftAnswer = async (questionIndex: number, nextAnswer: string, successTitle: string) => {
    setLoading(true);
    try {
      await interviewApi.saveAnswer({
        sessionId,
        answer: nextAnswer,
        questionIndex,
      });
      updateQuestionAnswer(questionIndex, nextAnswer);
      markQuestionSaved(questionIndex);
      Taro.showToast({ title: successTitle, icon: 'success' });
    } catch (error) {
      console.error('暂存答案失败:', error);
      Taro.showToast({ title: '暂存失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!viewingQuestion || !currentAnswer.trim()) {
      Taro.showToast({ title: '先输入当前答案再暂存', icon: 'none' });
      return;
    }

    const confirmed = await confirmAction(
      '确认暂存',
      `确认暂存 Q${viewingQuestionIndex + 1} 的答案吗？`,
      '确认暂存'
    );

    if (!confirmed) {
      return;
    }

    await persistDraftAnswer(viewingQuestionIndex, currentAnswer, '已暂存当前答案');
  };

  const handleSaveHistoryDraft = async () => {
    if (!viewingQuestion || viewingStatus !== 'saved' || !currentAnswer.trim()) {
      Taro.showToast({ title: '暂无可保存的暂存修改', icon: 'none' });
      return;
    }

    const confirmed = await confirmAction(
      '确认保存修改',
      `确认保存 Q${viewingQuestionIndex + 1} 的暂存修改吗？`,
      '确认保存'
    );

    if (!confirmed) {
      return;
    }

    await persistDraftAnswer(viewingQuestionIndex, currentAnswer, '已保存暂存修改');
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
      if (currentAnswer.trim() && viewingQuestion) {
        await interviewApi.saveAnswer({
          sessionId,
          answer: currentAnswer,
          questionIndex: activeQuestionIndex,
        });
        updateQuestionAnswer(activeQuestionIndex, currentAnswer);
        markQuestionSaved(activeQuestionIndex);
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
    if (!viewingQuestion || viewingQuestionIndex !== activeQuestionIndex || !currentAnswer.trim()) {
      Taro.showToast({ title: '请先回到当前题并输入答案', icon: 'none' });
      return;
    }

    const confirmed = await confirmAction(
      '确认提交',
      `提交后将进入下一题，确认提交 Q${activeQuestionIndex + 1} 的答案吗？`,
      '确认提交'
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const res = await interviewApi.submitAnswer({
        sessionId,
        answer: currentAnswer,
        questionIndex: activeQuestionIndex,
      });
      const nextActiveQuestionIndex = res.currentQuestionIndex ?? res.currentIndex;

      if (typeof nextActiveQuestionIndex !== 'number' || Number.isNaN(nextActiveQuestionIndex)) {
        throw new Error('提交答案响应缺少 currentQuestionIndex');
      }

      setQuestions(prev => prev.map((item, index) => {
        if (index === activeQuestionIndex) {
          return { ...item, userAnswer: currentAnswer };
        }

        if (res.nextQuestion && index === nextActiveQuestionIndex) {
          return { ...item, ...res.nextQuestion };
        }

        return item;
      }));

      updateDraft(activeQuestionIndex, currentAnswer);
      markQuestionSubmitted(activeQuestionIndex);

      if (!res.hasNextQuestion || !res.nextQuestion) {
        Taro.navigateTo({ url: `/pages/interview-report/index?sessionId=${sessionId}` });
        return;
      }

      setActiveQuestionIndex(nextActiveQuestionIndex);
      setViewingQuestionIndex(nextActiveQuestionIndex);
      setProgress({ current: nextActiveQuestionIndex + 1, total: res.totalQuestions || 5 });
      setAnswerDrafts(prev => ({
        ...prev,
        [nextActiveQuestionIndex]: prev[nextActiveQuestionIndex] ?? res.nextQuestion?.userAnswer ?? '',
      }));
    } catch (error) {
      console.error('提交答案失败:', error);
      Taro.showToast({ title: '提交失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const answerCards: AnswerCardItem[] = questions.map((item, index) => ({
    questionIndex: index,
    displayIndex: index + 1,
    status: getQuestionStatus(index, item),
    question: item.question,
    savedAnswer: item.userAnswer || undefined,
  }));

  const handleJumpToQuestion = (questionIndex: number) => {
    if (!questions[questionIndex] || questionIndex >= activeQuestionIndex) {
      return;
    }

    setViewingQuestionIndex(questionIndex);
    setDrawerVisible(false);
    Taro.showToast({ title: `查看 Q${questionIndex + 1}`, icon: 'none' });
  };

  const handleReturnToCurrent = () => {
    setViewingQuestionIndex(activeQuestionIndex);
  };

  const handleTouchStart = (e: any) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: any) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < Math.abs(deltaX) && deltaX < 0) {
      setDrawerVisible(true);
    }
  };

  if (loading && !viewingQuestion) {
    return <Loading text="准备面试中..." fullPage />;
  }

  if (!viewingQuestion && !sessionId) {
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
            <Text className="question-card__label">
              {viewMode === 'active' ? '当前问题' : `历史查看 · Q${viewingQuestionIndex + 1}`}
            </Text>
            <Text className="question-badge">{viewMode === 'active' ? (viewingQuestion?.category || '待回答') : '历史题目'}</Text>
          </View>
          <Text className="question-card__content">{viewingQuestion?.question || ''}</Text>
        </View>

        <View className="drawer-trigger" onClick={() => setDrawerVisible(true)}>
          <Text>答题卡</Text>
          <Text className="drawer-trigger__hint">点击查看全部题目</Text>
        </View>

        <View className="answer-area section-shell">
          <Text className="answer-area__label">
            {viewMode === 'active' ? '当前作答' : `Q${viewingQuestionIndex + 1} 答案`}
          </Text>
          <Textarea
            className={`answer-input ${!isAnswerEditable ? 'answer-input--readonly' : ''}`}
            value={currentAnswer}
            onInput={(e) => isAnswerEditable && updateDraft(viewingQuestionIndex, e.detail.value)}
            placeholder={isAnswerEditable ? '请输入你的答案...' : '该题答案仅供查看，不能修改'}
            disabled={!isAnswerEditable}
          />
          <Text className="answer-count">{currentAnswer.trim().length} / 2000</Text>
        </View>

        {viewMode === 'active' && (
          <View className="actions">
            <View className="actions__secondary">
              <Button className="action-chip action-chip--secondary" onClick={handleSaveDraft} disabled={!currentAnswer.trim() || loading}>
                暂存答案
              </Button>
              <Button className="action-chip action-chip--secondary" onClick={handleCompleteEarly} disabled={loading}>
                提前结束
              </Button>
            </View>
            <Button className="submit-btn" onClick={handleSubmitAnswer} disabled={loading || !currentAnswer.trim()}>
              {loading ? '提交中...' : '提交答案'}
            </Button>
          </View>
        )}

        {viewMode === 'history-readonly' && (
          <View className="history-panel section-shell">
            <Text className="history-panel__text">该题答案已提交，当前仅支持查看。</Text>
            <Button className="history-panel__button" onClick={handleReturnToCurrent}>
              返回当前题
            </Button>
          </View>
        )}

        {viewMode === 'history-editable' && (
          <View className="actions">
            <View className="history-panel section-shell">
              <Text className="history-panel__text">这是暂存题目，你可以修改并再次保存。</Text>
            </View>
            <View className="actions__secondary">
              <Button className="action-chip action-chip--secondary" onClick={handleReturnToCurrent} disabled={loading}>
                返回当前题
              </Button>
              <Button className="action-chip" onClick={handleSaveHistoryDraft} disabled={!currentAnswer.trim() || loading}>
                保存暂存修改
              </Button>
            </View>
          </View>
        )}
      </View>

      <AnswerCardDrawer
        visible={drawerVisible}
        items={answerCards}
        activeIndex={activeQuestionIndex}
        selectedIndex={viewingQuestionIndex}
        onClose={() => setDrawerVisible(false)}
        onJump={handleJumpToQuestion}
      />
    </View>
  );
}
