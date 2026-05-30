import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { EvaluationStatusResponse, VoiceEvaluationDetail, VoiceAnswerDetail, voiceInterviewApi } from '../../api/voiceInterview';
import InterviewDetailPanel from '../../components/InterviewDetailPanel';
import type { InterviewDetail } from '../../api/history';

const GENERATING_STEPS = [
  '正在解析您的回答内容...',
  '正在分析每道题的得分...',
  '正在生成综合评价...',
  '正在更新您的能力画像...',
  '即将完成...',
];

export default function VoiceInterviewEvaluationPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState<VoiceEvaluationDetail | null>(null);
  const [loadingState, setLoadingState] = useState<'loading' | 'generating' | 'done' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const loadEvaluation = async () => {
    if (!sessionId) return;

    setLoadingState('loading');
    setErrorMessage(null);

    try {
      const status = await voiceInterviewApi.getEvaluation(parseInt(sessionId));
      handleStatusResponse(status);
    } catch {
      try {
        const status = await voiceInterviewApi.generateEvaluation(parseInt(sessionId));
        handleStatusResponse(status);
      } catch (err) {
        console.error('Failed to trigger evaluation:', err);
        setErrorMessage('触发评估失败，请重试');
        setLoadingState('error');
      }
    }
  };

  const handleStatusResponse = (response: EvaluationStatusResponse) => {
    const status = response.evaluateStatus;

    if (status === 'COMPLETED' && response.evaluation) {
      setEvaluation(response.evaluation);
      setLoadingState('done');
      stopPolling();
    } else if (status === 'FAILED') {
      setErrorMessage(response.evaluateError || '评估生成失败');
      setLoadingState('error');
      stopPolling();
    } else {
      setLoadingState('generating');
      startTimeRef.current = Date.now();
      startProgressAnimation();
      startPolling();
    }
  };

  const startProgressAnimation = () => {
    pollIntervalRef.current = setInterval(() => {
      setGeneratingStep(prev => (prev + 1) % GENERATING_STEPS.length);
    }, 4000);

    progressRef.current = setInterval(() => {
      setProgress(prev => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        if (elapsed < 30) return Math.min(prev + 2, 60);
        return Math.min(prev + 0.3, 95);
      });
    }, 500);
  };

  const stopPolling = () => {
    if (pollingRef.current) { clearTimeout(pollingRef.current); pollingRef.current = null; }
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
  };

  const startPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
    }

    pollingRef.current = setTimeout(async () => {
      if (!sessionId) return;

      try {
        const response = await voiceInterviewApi.getEvaluation(parseInt(sessionId));
        const status = response.evaluateStatus;

        if (status === 'COMPLETED' && response.evaluation) {
          setEvaluation(response.evaluation);
          setLoadingState('done');
          stopPolling();
        } else if (status === 'FAILED') {
          setErrorMessage(response.evaluateError || '评估生成失败');
          setLoadingState('error');
          stopPolling();
        } else {
          startPolling();
        }
      } catch {
        setErrorMessage('获取评估状态失败');
        setLoadingState('error');
        stopPolling();
      }
    }, 3000);
  }, [sessionId]);

  const handleRetry = async () => {
    if (!sessionId) return;
    setLoadingState('generating');
    setErrorMessage(null);
    startTimeRef.current = Date.now();
    startProgressAnimation();

    try {
      const status = await voiceInterviewApi.generateEvaluation(parseInt(sessionId));
      handleStatusResponse(status);
    } catch (err) {
      console.error('Failed to retry evaluation:', err);
      setErrorMessage('重试失败，请稍后再试');
      setLoadingState('error');
      stopPolling();
    }
  };

  useEffect(() => {
    loadEvaluation();
    return () => {
      stopPolling();
    };
  }, [sessionId]);

  // 转换 evaluation 为 interviewDetail 格式以复用 InterviewDetailPanel
  const interviewDetail = useMemo<InterviewDetail | null>(() => {
    if (!evaluation) return null;
    return {
      id: 0,
      sessionId: sessionId!,
      totalQuestions: evaluation.totalQuestions,
      status: 'COMPLETED',
      overallScore: evaluation.overallScore,
      overallFeedback: evaluation.overallFeedback,
      createdAt: '',
      completedAt: '',
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      answers: evaluation.answers.map((a: VoiceAnswerDetail) => ({
        questionIndex: a.questionIndex,
        question: a.question,
        category: a.category,
        userAnswer: a.userAnswer,
        score: a.score,
        feedback: a.feedback,
        referenceAnswer: a.referenceAnswer ?? undefined,
        keyPoints: a.keyPoints ?? undefined,
        answeredAt: '',
      })),
    };
  }, [evaluation, sessionId]);

  // Loading state（第1次请求）
  if (loadingState === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-[var(--color-border)] dark:border-[var(--color-border-dark)] border-t-[var(--color-primary)] animate-spin" />
          <div className="absolute inset-0 rounded-full border-4 border-[var(--color-border)] dark:border-[var(--color-border-dark)] border-t-[var(--color-primary)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s', animationDelay: '0.5s' }} />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-1">正在加载评估报告</p>
          <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">请稍候...</p>
        </div>
      </div>
    );
  }

  // 评估中（轮询中）
  if (loadingState === 'generating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4">
        <div className="relative flex flex-col items-center">
          <div className="w-28 h-28 rounded-full border-4 border-[var(--color-border)] dark:border-[var(--color-border-dark)] border-t-[var(--color-primary)] animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-[var(--color-border)] dark:border-[var(--color-border-dark)] border-t-[var(--color-primary-hover)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.8s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
            </svg>
          </div>
        </div>

        <div className="text-center max-w-sm">
          <h2 className="text-xl font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">
            AI 正在生成面试评估报告
          </h2>
          <div className="h-6 mb-4">
            <p key={generatingStep} className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] animate-pulse">
              {GENERATING_STEPS[generatingStep]}
            </p>
          </div>

          <div className="w-full max-w-xs mx-auto">
            <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-1.5">
              <span>评估进度</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--color-border)] dark:bg-[var(--color-border-dark)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-4">
            预计需要 20-30 秒，请勿关闭页面
          </p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (loadingState === 'error' || !evaluation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-lg font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">
            评估报告生成失败
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-6">
            {errorMessage || '加载失败，请稍后重试'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
            <button
              onClick={() => navigate('/voice-interview')}
              className="px-5 py-2.5 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] text-sm font-medium rounded-xl hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] transition-colors"
            >
              返回列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 报告内容
  return (
    <div className="pb-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <button
            onClick={() => navigate('/voice-interview')}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">语音面试评估报告</h1>
            <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">会话 ID: {sessionId}</p>
          </div>
        </motion.div>
        {interviewDetail && <InterviewDetailPanel interview={interviewDetail} />}
      </div>
    </div>
  );
}