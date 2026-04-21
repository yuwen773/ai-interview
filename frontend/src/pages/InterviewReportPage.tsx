import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { interviewApi } from '../api/interview';
import type { InterviewReport } from '../types/interview';
import { getScoreProgressColor } from '../utils/score';

interface InterviewReportPageProps {
  onBack: () => void;
}

type LoadingState = 'loading' | 'generating' | 'done' | 'error';

const GENERATING_STEPS = [
  '正在解析您的回答内容...',
  '正在分析每道题的得分...',
  '正在生成综合评价...',
  '正在更新您的能力画像...',
  '即将完成...',
];

export default function InterviewReportPage({ onBack }: InterviewReportPageProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // 轮询获取报告
  const pollReport = async (isFirst = false) => {
    if (!sessionId) return;
    try {
      const r = await interviewApi.getReport(sessionId);
      setReport(r);
      setLoadingState('done');
      stopPolling();
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      // "面试报告生成中，请稍后再试" 是正常状态，不是错误
      if (msg.includes('生成中') || msg.includes('EVALUATED') || err?.code === 400) {
        if (isFirst) {
          setLoadingState('generating');
          startTimeRef.current = Date.now();
          startProgressAnimation();
        }
        // 继续轮询
      } else {
        setErrorMessage(msg || '加载报告失败');
        setLoadingState('error');
        stopPolling();
      }
    }
  };

  const startProgressAnimation = () => {
    // 文字动画：每 4 秒切换一条提示
    pollIntervalRef.current = setInterval(() => {
      setGeneratingStep(prev => (prev + 1) % GENERATING_STEPS.length);
    }, 4000);

    // 进度条动画：0 → 95%（评估完成前不会到100）
    progressRef.current = setInterval(() => {
      setProgress(prev => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        // 模拟进度曲线：前30秒快速到60%，之后缓慢到90%
        if (elapsed < 30) return Math.min(prev + 2, 60);
        return Math.min(prev + 0.3, 95);
      });
    }, 500);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
  };

  useEffect(() => {
    if (!sessionId) {
      setLoadingState('error');
      setErrorMessage('会话 ID 不存在');
      return;
    }

    void pollReport(true);

    // 每 5 秒轮询一次
    const timer = setInterval(() => { void pollReport(false); }, 5000);
    return () => { clearInterval(timer); stopPolling(); };
  }, [sessionId]);

  // 加载中（第1次请求）
  if (loadingState === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-[var(--color-border)] dark:border-[var(--color-border-dark)] border-t-[var(--color-primary)] animate-spin" />
          <div className="absolute inset-0 rounded-full border-4 border-[var(--color-border)] dark:border-[var(--color-border-dark)] border-t-[var(--color-primary)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s', animationDelay: '0.5s' }} />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-1">正在加载报告</p>
          <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">请稍候...</p>
        </div>
      </div>
    );
  }

  // 评估中（轮询中）
  if (loadingState === 'generating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4">
        {/* 动画区域 */}
        <div className="relative flex flex-col items-center">
          {/* 外圈旋转 */}
          <div className="w-28 h-28 rounded-full border-4 border-[var(--color-border)] dark:border-[(var(--color-border-dark))] border-t-[var(--color-primary)] animate-spin" />
          {/* 内圈反向 */}
          <div className="absolute inset-2 rounded-full border-4 border-[var(--color-border)] dark:border-[(var(--color-border-dark))] border-t-[var(--color-primary-hover)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.8s' }} />
          {/* 中心图标 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
            </svg>
          </div>
        </div>

        {/* 文字区域 */}
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">
            AI 正在生成面试报告
          </h2>
          <div className="h-6 mb-4">
            <p key={generatingStep} className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] animate-pulse">
              {GENERATING_STEPS[generatingStep]}
            </p>
          </div>

          {/* 进度条 */}
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

  // 真正的错误
  if (loadingState === 'error' || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-lg font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">
            报告暂不可用
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-6">
            {errorMessage || '加载失败，请稍后重试'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setLoadingState('generating'); void pollReport(true); }}
              className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-medium rounded-xl transition-colors"
            >
              重试
            </button>
            <button
              onClick={onBack}
              className="px-5 py-2.5 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] text-sm font-medium rounded-xl hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] transition-colors"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 报告内容
  return (
    <div className="max-w-3xl mx-auto p-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">面试报告</h1>
        <button onClick={onBack} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] dark:text-[var(--color-text-muted-dark)] dark:hover:text-[var(--color-text-dark)]">返回</button>
      </div>

      <div className="bg-[var(--color-bg-secondary)] dark:bg-[var(--color-surface-dark)] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white ${getScoreProgressColor(report.overallScore)}`}>
            {report.overallScore}
          </div>
          <div>
            <div className="text-lg font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{report.jobLabel}</div>
            <div className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{report.totalQuestions} 道题目</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {report.categoryScores.map(cs => (
            <div key={cs.category} className="flex justify-between items-center p-3 bg-[var(--color-bg)] dark:bg-[var(--color-surface-raised-dark)] rounded-lg">
              <span className="text-sm text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{cs.category}</span>
              <span className={`text-sm font-semibold ${getScoreProgressColor(cs.score).replace('bg-', 'text-')}`}>{cs.score}分</span>
            </div>
          ))}
        </div>
      </div>

      {report.overallFeedback && (
        <div className="bg-[var(--color-bg-secondary)] dark:bg-[var(--color-surface-dark)] rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">综合评价</h3>
          <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{report.overallFeedback}</p>
        </div>
      )}

      {report.strengths.length > 0 && (
        <div className="bg-[var(--color-bg-secondary)] dark:bg-[var(--color-surface-dark)] rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">优势</h3>
          <ul className="list-disc pl-5 space-y-1">
            {report.strengths.map((s, i) => <li key={i} className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{s}</li>)}
          </ul>
        </div>
      )}

      {report.improvements.length > 0 && (
        <div className="bg-[var(--color-bg-secondary)] dark:bg-[var(--color-surface-dark)] rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">改进建议</h3>
          <ul className="list-disc pl-5 space-y-1">
            {report.improvements.map((im, i) => <li key={i} className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{im}</li>)}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1 py-3 rounded-xl font-semibold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-center text-sm">
          画像已自动更新
        </div>
      </div>
    </div>
  );
}
