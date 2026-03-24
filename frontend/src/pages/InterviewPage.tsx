import {useCallback, useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {interviewApi} from '../api/interview';
import {getErrorMessage} from '../api/request';
import ConfirmDialog from '../components/ConfirmDialog';
import InterviewConfigPanel from '../components/InterviewConfigPanel';
import {useRecording} from '../hooks/useRecording';
import {useQuestionVoicePrefetch} from '../hooks/useQuestionVoicePrefetch';
import {useQuestionVoicePlayer} from '../hooks/useQuestionVoicePlayer';
import {useLipSync} from '../hooks/useLipSync';
import type {CandidateInputMode, InterviewQuestion, InterviewSession, JobRole, JobRoleDTO} from '../types/interview';
import {deleteSessionAudio} from '../utils/interviewVoiceCache';
import {InterviewRoomScene} from '../components/InterviewRoom/InterviewRoomScene';
import {InterviewControlPanel} from '../components/InterviewRoom/InterviewControlPanel';
import {InterviewSubtitlePanel} from '../components/InterviewRoom/InterviewSubtitlePanel';
import {getInterviewerMode} from '../utils/interviewMode';

type InterviewStage = 'config' | 'interview';

interface Message {
  type: 'interviewer' | 'user';
  content: string;
  category?: string;
  questionIndex?: number;
}

interface InterviewProps {
  resumeText: string;
  resumeId?: number;
  onBack: () => void;
  onInterviewComplete: () => void;
}

export default function Interview({ resumeText, resumeId, onBack, onInterviewComplete }: InterviewProps) {
  const [stage, setStage] = useState<InterviewStage>('config');
  const [jobRoles, setJobRoles] = useState<JobRoleDTO[]>([]);
  const [selectedJobRole, setSelectedJobRole] = useState<JobRole | null>(null);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [questionCount, setQuestionCount] = useState(8);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [answer, setAnswer] = useState('');
  const [candidateInputMode, setCandidateInputMode] = useState<CandidateInputMode>('text');
  const [questionVoiceEnabled, setQuestionVoiceEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [checkingUnfinished, setCheckingUnfinished] = useState(false);
  const [unfinishedSession, setUnfinishedSession] = useState<InterviewSession | null>(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [forceCreateNew, setForceCreateNew] = useState(false);
  const { isRecording, startRecording, stopRecording, clearRecording } = useRecording();
  const { mouthOpen } = useLipSync();
  const lastAutoPlayedQuestionRef = useRef<string | null>(null);
  // 用 ref 做轻量级幂等保护，避免状态更新异步时同一动作被快速连点触发多次。
  const submitInFlightRef = useRef(false);
  const recognizeInFlightRef = useRef(false);
  const createInFlightRef = useRef(false);
  const completeInFlightRef = useRef(false);
  const handleQuestionVoiceError = useCallback((message: string) => {
    setError(message);
  }, []);
  const {
    isPlaying: isPlayingQuestionAudio,
    isLoading: isLoadingQuestionAudio,
    playQuestion,
    stopPlayback: stopQuestionAudio
  } = useQuestionVoicePlayer({
    onError: handleQuestionVoiceError
  });
  useQuestionVoicePrefetch({
    sessionId: session?.sessionId ?? null,
    questions: session?.questions ?? [],
    currentQuestionIndex: currentQuestion?.questionIndex ?? session?.currentQuestionIndex ?? 0,
    questionVoiceEnabled,
    enabled: stage === 'interview',
    windowSize: 3,
  });

  const cleanupSessionVoiceCache = useCallback(async (sessionId: string) => {
    try {
      await deleteSessionAudio(sessionId);
    } catch (error) {
      console.warn('question_voice_cache_cleanup_failed', { sessionId, error });
    }
  }, []);

  // 初始化配置页数据：岗位列表 + 未完成会话。
  useEffect(() => {
    let cancelled = false;

    const loadConfigData = async () => {
      setLoadingRoles(true);
      setCheckingUnfinished(Boolean(resumeId));
      setError('');

      try {
        const [roles, foundSession] = await Promise.all([
          interviewApi.getJobRoles(),
          resumeId ? interviewApi.findUnfinishedSession(resumeId) : Promise.resolve(null),
        ]);

        if (cancelled) {
          return;
        }

        setJobRoles(roles);
        setUnfinishedSession(foundSession);
        setSelectedJobRole((currentRole) => {
          if (foundSession?.jobRole) {
            return foundSession.jobRole;
          }
          if (currentRole && roles.some((role) => role.code === currentRole)) {
            return currentRole;
          }
          return null;
        });
      } catch (err) {
        if (!cancelled) {
          console.error('加载面试配置失败', err);
          setError('加载岗位配置失败，请刷新后重试');
        }
      } finally {
        if (!cancelled) {
          setLoadingRoles(false);
          setCheckingUnfinished(false);
        }
      }
    };

    void loadConfigData();

    return () => {
      cancelled = true;
    };
  }, [resumeId]);

  const resetVoiceAnswer = () => {
    // 语音答题相关状态需要一起清空，避免重录后遗留上一次识别结果。
    clearRecording();
  };

  const handleContinueUnfinished = () => {
    if (!unfinishedSession) return;
    setForceCreateNew(false);  // 重置强制创建标志
    setSelectedJobRole(unfinishedSession.jobRole);
    restoreSession(unfinishedSession);
    setUnfinishedSession(null);
  };

  const handleStartNew = () => {
    setUnfinishedSession(null);
    setForceCreateNew(true);  // 标记需要强制创建新会话
  };

  const restoreSession = (sessionToRestore: InterviewSession) => {
    stopQuestionAudio();
    lastAutoPlayedQuestionRef.current = null;
    setSession(sessionToRestore);
    setError('');
    setCandidateInputMode('text');
    resetVoiceAnswer();

        // 恢复当前问题
    const currentQ = sessionToRestore.questions[sessionToRestore.currentQuestionIndex];
    if (currentQ) {
      setCurrentQuestion(currentQ);

        // 恢复消息历史
      const restoredMessages: Message[] = [];
      for (let i = 0; i <= sessionToRestore.currentQuestionIndex; i++) {
        const q = sessionToRestore.questions[i];
        restoredMessages.push({
          type: 'interviewer',
          content: q.question,
          category: q.category,
          questionIndex: i
        });
        if (q.userAnswer) {
          restoredMessages.push({
            type: 'user',
            content: q.userAnswer
          });
        }
      }
      setMessages(restoredMessages);
    }

        setStage('interview');
  };

  const startInterview = async () => {
    if (createInFlightRef.current || !selectedJobRole) return;
    createInFlightRef.current = true;
    setIsCreating(true);
    setError('');
    stopQuestionAudio();
    lastAutoPlayedQuestionRef.current = null;
    setCandidateInputMode('text');
    resetVoiceAnswer();

        try {
      // 创建新面试（如果 forceCreateNew 为 true，则强制创建新会话）
      const newSession = await interviewApi.createSession({
        resumeText,
        questionCount,
        resumeId,
        jobRole: selectedJobRole,
        forceCreate: forceCreateNew
      });

            // 重置强制创建标志
      setForceCreateNew(false);

            // 如果返回的是未完成的会话（currentQuestionIndex > 0 或已有答案），恢复它
            const hasProgress = newSession.currentQuestionIndex > 0 ||
                          newSession.questions.some(q => q.userAnswer) ||
                          newSession.status === 'IN_PROGRESS';

            if (hasProgress) {
        // 这是恢复的会话
        restoreSession(newSession);
      } else {
        // 全新的会话
        setSession(newSession);

                if (newSession.questions.length > 0) {
          const firstQuestion = newSession.questions[0];
          setCurrentQuestion(firstQuestion);
          setMessages([{
            type: 'interviewer',
            content: firstQuestion.question,
            category: firstQuestion.category,
            questionIndex: 0
          }]);
        }

                setStage('interview');
      }
    } catch (err) {
      setError('创建面试失败，请重试');
      console.error(err);
      setForceCreateNew(false);  // 出错时也重置标志
    } finally {
      createInFlightRef.current = false;
      setIsCreating(false);
    }
  };

  const handleSubmitAnswer = async () => {
    await submitAnswerText(answer);
  };

  const submitAnswerText = async (submittedAnswer: string) => {
    if (!submittedAnswer.trim() || !session || !currentQuestion || submitInFlightRef.current) return;

    submitInFlightRef.current = true;
    setIsSubmitting(true);
    setError('');

    const finalAnswer = submittedAnswer.trim();
    const userMessage: Message = {
      type: 'user',
      content: finalAnswer
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await interviewApi.submitAnswer({
        sessionId: session.sessionId,
        questionIndex: currentQuestion.questionIndex,
        answer: finalAnswer,
        interviewerOutputMode: questionVoiceEnabled ? 'textVoice' : 'text'
      });

      setAnswer('');
      resetVoiceAnswer();

      if (response.hasNextQuestion && response.nextQuestion) {
        const nextQuestion = response.nextQuestion;
        lastAutoPlayedQuestionRef.current = null;
        setCurrentQuestion(nextQuestion);
        setMessages(prev => [...prev, {
          type: 'interviewer',
          content: nextQuestion.question,
          category: nextQuestion.category,
          questionIndex: nextQuestion.questionIndex
        }]);
      } else {
        lastAutoPlayedQuestionRef.current = null;
        stopQuestionAudio();
        await cleanupSessionVoiceCache(session.sessionId);
        onInterviewComplete();
      }
    } catch (err) {
      setMessages(prev => prev.slice(0, -1));
      setError(getErrorMessage(err) || '提交答案失败，请重试');
      console.error(err);
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleQuestionVoiceEnabledChange = (enabled: boolean) => {
    if (isSubmitting || isRecognizing || isRecording) return;
    setError('');
    setQuestionVoiceEnabled(enabled);
    if (!enabled) {
      lastAutoPlayedQuestionRef.current = null;
      stopQuestionAudio();
    }
  };

  const handleStartRecording = async () => {
    setError('');
    // 录音与题目播报共用音频输出设备，开始录音前先停播，减少回声和串音。
    stopQuestionAudio();
    try {
      await startRecording();
    } catch (err) {
      setError(getErrorMessage(err) || '无法开始录音');
      console.error(err);
    }
  };

  const handleStopRecording = async () => {
    if (!session || !currentQuestion || recognizeInFlightRef.current) return;

    recognizeInFlightRef.current = true;
    setIsRecognizing(true);
    setError('');

    try {
      const audioBlob = await stopRecording();
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('录音内容为空，请重新录音');
      }

      const response = await interviewApi.recognizeVoiceAnswer({
        sessionId: session.sessionId,
        questionIndex: currentQuestion.questionIndex,
        file: audioBlob,
        inputMode: candidateInputMode
      });

      // 识别结果回显到文字输入框，切换到文字模式让用户确认后提交
      setAnswer(response.recognizedText);
      setCandidateInputMode('text');
    } catch (err) {
      resetVoiceAnswer();
      setError(getErrorMessage(err) || '语音识别失败，请重试或切回文字模式');
      console.error(err);
    } finally {
      recognizeInFlightRef.current = false;
      setIsRecognizing(false);
    }
  };

  const handleCompleteEarly = async () => {
    if (!session || completeInFlightRef.current) return;

    completeInFlightRef.current = true;
    setIsSubmitting(true);
    try {
      lastAutoPlayedQuestionRef.current = null;
      stopQuestionAudio();
      await interviewApi.completeInterview(session.sessionId);
      await cleanupSessionVoiceCache(session.sessionId);
      setShowCompleteConfirm(false);
      // 面试已完成，评估将在后台进行，跳转到面试记录页
      onInterviewComplete();
    } catch (err) {
      setError('提前交卷失败，请重试');
      console.error(err);
    } finally {
      completeInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleReplayQuestionAudio = async () => {
    if (!currentQuestion || !session) return;
    setError('');
    await playQuestion(currentQuestion.question, {
      sessionId: session.sessionId,
      questionIndex: currentQuestion.questionIndex,
    });
  };

  useEffect(() => {
    if (!currentQuestion) return;

    if (!questionVoiceEnabled) {
      stopQuestionAudio();
      return;
    }

    // 同一道题只自动播报一次，用户手动重播走显式按钮，不在 effect 里重复触发。
    const questionKey = `${currentQuestion.questionIndex}:${currentQuestion.question}`;
    if (lastAutoPlayedQuestionRef.current === questionKey) {
      return;
    }

    lastAutoPlayedQuestionRef.current = questionKey;
    if (!session) {
      return;
    }
    void playQuestion(currentQuestion.question, {
      sessionId: session.sessionId,
      questionIndex: currentQuestion.questionIndex,
    });
  }, [
    session?.sessionId,
    currentQuestion?.questionIndex,
    currentQuestion?.question,
    questionVoiceEnabled,
    playQuestion,
    stopQuestionAudio
  ]);

    // 配置界面
  const renderConfig = () => {
    const distributionMap: Record<JobRole, string> = {
      JAVA_BACKEND: '题目分布：项目经历 + MySQL + Redis + Java 基础/集合/并发 + Spring / Spring Boot',
      WEB_FRONTEND: '题目分布：项目经历 + JavaScript / TypeScript + HTML / CSS + 浏览器 / 网络 + React + 工程化',
      PYTHON_ALGORITHM: '题目分布：项目经历 + Python 核心 + 算法与数据结构 + 工程实践',
    };

    return (
      <InterviewConfigPanel
        roles={jobRoles}
        selectedJobRole={selectedJobRole}
        onJobRoleChange={setSelectedJobRole}
        jobDistributionText={
          selectedJobRole
            ? distributionMap[selectedJobRole]
            : '请选择岗位后查看对应题目分布'
        }
        questionCount={questionCount}
        onQuestionCountChange={setQuestionCount}
        onStart={startInterview}
        isCreating={isCreating}
        loadingRoles={loadingRoles}
        checkingUnfinished={checkingUnfinished}
        unfinishedSession={unfinishedSession}
        onContinueUnfinished={handleContinueUnfinished}
        onStartNew={handleStartNew}
        resumeText={resumeText}
        onBack={onBack}
        error={error}
      />
    );
  };

    // 面试对话界面
  const renderInterview = () => {
    if (!session || !currentQuestion) return null;

    // 计算面试官模式
    const interviewerMode = getInterviewerMode(
      stage,
      isRecording,
      isSubmitting,
      isPlayingQuestionAudio
    );

    return (
      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* 左侧：场景区域 */}
        <div className="flex-1 relative rounded-2xl overflow-hidden shadow-lg">
          <InterviewRoomScene mode={interviewerMode} mouthOpen={mouthOpen}>
            {/* 底部控制栏作为 children */}
            <InterviewControlPanel
              mode={interviewerMode}
              candidateInputMode={candidateInputMode}
              isRecording={isRecording}
              isRecognizing={isRecognizing}
              isSubmitting={isSubmitting}
              audioLevel={0}
              answer={answer}
              onAnswerChange={setAnswer}
              onSubmit={handleSubmitAnswer}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onStopInterview={handleCompleteEarly}
              onCandidateInputModeChange={setCandidateInputMode}
              error={error}
            />
          </InterviewRoomScene>
        </div>

        {/* 右侧：对话侧边栏 */}
        <div className="w-[380px] hidden lg:block">
          <InterviewSubtitlePanel
            session={session}
            currentQuestion={currentQuestion}
            messages={messages}
            questionVoiceEnabled={questionVoiceEnabled}
            isRecording={isRecording}
            isRecognizing={isRecognizing}
            isSubmitting={isSubmitting}
            isPlayingQuestionAudio={isPlayingQuestionAudio}
            isLoadingQuestionAudio={isLoadingQuestionAudio}
            error={error}
            onQuestionVoiceEnabledChange={handleQuestionVoiceEnabledChange}
            onReplayQuestionAudio={handleReplayQuestionAudio}
            onStopQuestionAudio={stopQuestionAudio}
          />
        </div>
      </div>
    );
  };

  const stageSubtitles = {
    config: '配置您的面试参数',
    interview: '认真回答每个问题，展示您的实力'
  };

    return (
    <div className="pb-10">
      {/* 页面头部 */}
        <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          模拟面试
        </h1>
            <p className="text-slate-500 dark:text-slate-400">{stageSubtitles[stage]}</p>
      </motion.div>

        <AnimatePresence mode="wait" initial={false}>
        {stage === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderConfig()}
          </motion.div>
        )}
        {stage === 'interview' && (
          <motion.div
            key="interview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderInterview()}
          </motion.div>
        )}
      </AnimatePresence>

        {/* 提前交卷确认对话框 */}
      <ConfirmDialog
        open={showCompleteConfirm}
        title="提前交卷"
        message="确定要提前交卷吗？未回答的问题将按0分计算。"
        confirmText="确定交卷"
        cancelText="取消"
        confirmVariant="warning"
        loading={isSubmitting}
        onConfirm={handleCompleteEarly}
        onCancel={() => setShowCompleteConfirm(false)}
      />
    </div>
  );
}
